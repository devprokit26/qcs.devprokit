/**
 * Central HTTP client for all REST services.
 *
 * Auth strategy: The JWT returned by /auth/login is stored in
 * localStorage under 'alince_jwt'. Every request sends it as
 * "Authorization: Bearer <token>" which the backend already supports.
 * This avoids all cookie / SameSite / cross-port issues during dev.
 *
 * Error types:
 *   AuthError   — HTTP 401 from the server (bad/expired token)
 *   NetworkError — fetch threw (no connection, timeout)
 *   ServerError  — 5xx or 429 responses
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from '../offline/db';

export const BASE = '/api/v1';
const TIMEOUT_MS = 15_000; // 15 seconds

export const TOKEN_KEY = 'alince_jwt';

// ─── Typed errors ────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(message = 'Unauthenticated') {
    super(message);
    this.name = 'AuthError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network unavailable') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ServerError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ServerError';
    this.status = status;
  }
}

/** Zod / validation errors with per-field detail from the backend */
export class FieldValidationError extends Error {
  readonly fields: Record<string, string>;
  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = 'FieldValidationError';
    this.fields = fields;
  }
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isReadOnly = method === 'GET';
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Deduplication tracking for creates/updates
  let clientId = '';
  if (!isReadOnly) {
    clientId = uuidv4();
    headers.set('X-Client-Id', clientId);
  }

  const isOnline = navigator.onLine;

  // Login / logout can never be queued for later — they need the server right now.
  const isAuthCall = endpoint.startsWith('/auth');
  if (!isOnline && isAuthCall && !isReadOnly) {
    throw new NetworkError('You are offline. Please connect to the internet to sign in.');
  }

  if (!isOnline && isReadOnly) {
    // Read from Dexie cache if offline
    const cached = await db.cache.get(endpoint);
    if (cached) return cached.data as T;
    throw new NetworkError('You are offline and no cached data is available.');
  }

  if (!isOnline && !isReadOnly) {
    // Enqueue mutation to outbox
    await db.outbox.add({
      method,
      url: endpoint,
      body: String(options.body || ''),
      headers: Object.fromEntries(headers.entries()),
      createdAt: Date.now(),
      retryCount: 0,
      clientId,
    });
    await applyOptimisticToCache(method, endpoint, options.body);
    // Callers detect "queued while offline" by this empty object
    return {} as T;
  }

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);

    // If it was a mutation and network failed *during* request, queue it
    // (never for /auth calls — those must hit the server)
    if (!isReadOnly && !isAuthCall && (err instanceof Error && err.name !== 'AbortError')) {
      await db.outbox.add({
        method,
        url: endpoint,
        body: String(options.body || ''),
        headers: Object.fromEntries(headers.entries()),
        createdAt: Date.now(),
        retryCount: 0,
        clientId,
      });
      await applyOptimisticToCache(method, endpoint, options.body);
      return {} as T;
    }

    const msg = err instanceof Error && err.name === 'AbortError'
      ? 'Request timed out'
      : 'Network unavailable';
    
    // Fallback to cache for GET if request failed
    if (isReadOnly) {
      const cached = await db.cache.get(endpoint);
      if (cached) return cached.data as T;
    }

    throw new NetworkError(msg);
  }

  clearTimeout(timeoutId);

  // A 401 from the login call itself just means wrong username / password.
  // It is NOT an expired session, so don't clear anything or redirect.
  if (response.status === 401 && endpoint === '/auth/login') {
    throw new AuthError('Incorrect username or password. Please try again.');
  }

  // Only a genuine 401 from any other endpoint means "session expired -> log out"
  if (response.status === 401) {
    clearToken();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new AuthError('Session expired. Please log in again.');
  }

  // Too many login attempts (rate limiter)
  if (response.status === 429 && endpoint === '/auth/login') {
    throw new ServerError(429, 'Too many login attempts. Please wait a few minutes and try again.');
  }

  // 429 or 5xx are server problems — keep the user logged in
  if (response.status === 429 || response.status >= 500) {
    const errorData = await response.json().catch(() => ({})) as { message?: string };
    throw new ServerError(response.status, errorData.message || `Server error ${response.status}`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as {
      message?: string;
      errors?: Record<string, string[] | string> | Array<{ path?: (string | number)[]; message: string }>;
      fields?: Record<string, string>;
    };

    // Surface Zod / validation field errors (400 or 422)
    if (response.status === 400 || response.status === 422) {
      const fields: Record<string, string> = errorData.fields ? { ...errorData.fields } : {};
      
      if (errorData.errors) {
        if (Array.isArray(errorData.errors)) {
          for (const e of errorData.errors) {
            const key = (e.path ?? []).join('.') || 'root';
            fields[key] = e.message;
          }
        } else if (typeof errorData.errors === 'object') {
          for (const [key, val] of Object.entries(errorData.errors)) {
            fields[key] = Array.isArray(val) ? val.join(', ') : String(val);
          }
        }
      }

      const fieldErrorList = Object.entries(fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');

      const detailedMsg = fieldErrorList
        ? `${errorData.message || 'Validation error'}: ${fieldErrorList}`
        : (errorData.message || 'Validation error');

      throw new FieldValidationError(detailedMsg, fields);
    }

    throw new Error(errorData.message || `Request failed: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) return null as unknown as T;

  const json = await response.json() as { data?: T } | T;
  const result = (json as { data?: T }).data !== undefined ? (json as { data: T }).data : (json as T);

  // Cache successful GET responses EXCEPT for /auth routes
  if (isReadOnly && response.ok && !endpoint.startsWith('/auth')) {
    await db.cache.put({
      key: endpoint,
      data: result,
      timestamp: Date.now(),
    });
  }

  return result;
}


// ─── Offline: show queued changes in the lists straight away ─────────────────
//
// While offline, a queued create/update/delete is only stored in the outbox.
// To make the change visible on screen immediately, we also patch the cached
// GET list the page reads from. When the connection returns the outbox is
// synced and every page re-fetches fresh server data, which replaces these
// temporary rows.

const OPTIMISTIC_COLLECTIONS = [
  '/shipments',
  '/customers',
  '/vendors',
  '/expenses',
  '/cartons/types',
  '/cartons/movements',
  '/weight-proformas',
];

async function applyOptimisticToCache(method: string, endpoint: string, rawBody: unknown): Promise<void> {
  try {
    const path = endpoint.split('?')[0];
    let body: Record<string, unknown> = {};
    if (typeof rawBody === 'string' && rawBody) {
      try { body = JSON.parse(rawBody) as Record<string, unknown>; } catch { body = {}; }
    }

    // Is this a write on one of the collections above?  e.g. POST /shipments, PUT /shipments/5
    const collection = OPTIMISTIC_COLLECTIONS.find(c => path === c || path.startsWith(c + '/'));
    if (!collection) return;
    const idPart = path === collection ? null : path.slice(collection.length + 1);
    if (idPart && idPart.includes('/')) return; // e.g. /shipments/5/status — skip

    const cached = await db.cache.toArray();
    for (const entry of cached) {
      if (!(entry.key === collection || entry.key.startsWith(collection + '?'))) continue;
      if (!Array.isArray(entry.data)) continue;

      let list = entry.data as Array<Record<string, unknown>>;
      if (method === 'POST' && !idPart) {
        list = [...list, { ...body, id: -Date.now(), _pendingSync: true }];
      } else if ((method === 'PUT' || method === 'PATCH') && idPart) {
        list = list.map(r => (String(r.id) === idPart ? { ...r, ...body, id: r.id, _pendingSync: true } : r));
      } else if (method === 'DELETE' && idPart) {
        list = list.filter(r => String(r.id) !== idPart);
      } else {
        continue;
      }
      await db.cache.put({ ...entry, data: list });
    }
  } catch {
    // Cache patching is best-effort; the outbox entry is what really matters.
  }
}
