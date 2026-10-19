import toast from 'react-hot-toast';
import { db } from './db';
import { BASE, TOKEN_KEY } from '../rest/apiClient';

const MAX_RETRIES = 5;

/** Fired on `window` after queued offline changes were sent to the server. */
export const SYNC_COMPLETE_EVENT = 'alince:sync-complete';

let syncing = false;

/** Best readable message from a failed response (e.g. "Validation error: awb: required"). */
async function readError(response: Response): Promise<string> {
  try {
    const j = (await response.json()) as { message?: string };
    return j.message || `Error ${response.status}`;
  } catch {
    return `Error ${response.status}`;
  }
}

/** Sends every change saved while offline to the server, oldest first. */
export async function processOutbox(): Promise<void> {
  if (syncing || !navigator.onLine) return;
  syncing = true;

  let synced = 0;
  const failed: string[] = [];

  try {
    const entries = await db.outbox.orderBy('createdAt').toArray();
    if (entries.length === 0) return;

    for (const entry of entries) {
      if (!navigator.onLine) break;

      const headers: Record<string, string> = { ...(entry.headers || {}) };
      if (entry.clientId && !headers['X-Client-Id'] && !headers['x-client-id']) {
        headers['X-Client-Id'] = entry.clientId;
      }
      // Always use the CURRENT login token (the one saved with the entry may be old)
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) headers['Authorization'] = `Bearer ${token}`;
      else delete headers['Authorization'];

      try {
        // entry.url is only the endpoint (e.g. "/shipments"), so the API prefix must be added.
        const response = await fetch(`${BASE}${entry.url}`, {
          method: entry.method,
          body: entry.method === 'GET' || !entry.body ? undefined : entry.body,
          headers,
          credentials: 'include',
        });

        if (response.status === 401) {
          // Session expired while offline — keep the change and let the user sign in again.
          failed.push('Session expired — please sign in again, your changes are kept.');
          break;
        }

        // 4xx = the server rejected it (validation, duplicate, permission...). Retrying cannot help.
        if (response.status >= 400 && response.status < 500) {
          failed.push(await readError(response));
          await db.outbox.delete(entry.id!);
          continue;
        }

        // 5xx / 429 = temporary server problem, retry later
        if (!response.ok) {
          entry.retryCount += 1;
          entry.lastError = `Server error ${response.status}`;
          if (entry.retryCount >= MAX_RETRIES) {
            failed.push(`Server error ${response.status} (gave up after ${MAX_RETRIES} tries)`);
            await db.outbox.delete(entry.id!);
          } else {
            await db.outbox.put(entry);
          }
          continue;
        }

        await db.outbox.delete(entry.id!);
        synced += 1;
      } catch (err) {
        // No connection again — stop and try later, keep everything in the queue.
        if (!navigator.onLine || err instanceof TypeError) break;

        entry.retryCount += 1;
        entry.lastError = err instanceof Error ? err.message : String(err);
        if (entry.retryCount >= MAX_RETRIES) {
          failed.push(entry.lastError);
          await db.outbox.delete(entry.id!);
        } else {
          await db.outbox.put(entry);
        }
      }
    }
  } finally {
    syncing = false;
  }

  if (synced > 0) {
    // Drop stale list caches so pages load the real, saved data
    try {
      await db.cache.clear();
    } catch {
      /* ignore */
    }
    toast.success(`${synced} offline change${synced > 1 ? 's' : ''} synced successfully`);
    window.dispatchEvent(new CustomEvent(SYNC_COMPLETE_EVENT, { detail: { synced } }));
  }
  if (failed.length > 0) {
    toast.error(`${failed.length} offline change${failed.length > 1 ? 's' : ''} could not be saved: ${failed[0]}`, {
      duration: 8000,
    });
  }
}

/** Number of changes still waiting to be sent. */
export async function pendingOutboxCount(): Promise<number> {
  return db.outbox.count();
}

// Run automatically when the browser reports the connection is back
window.addEventListener('online', () => {
  void processOutbox();
});

// Periodic background sync
setInterval(() => {
  if (navigator.onLine) void processOutbox();
}, 30000);

// Also try once at start-up (the app may have been closed while offline)
void processOutbox();
