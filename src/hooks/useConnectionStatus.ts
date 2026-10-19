import { useState, useEffect, useCallback } from 'react';
import { BASE } from '@/services/rest/apiClient';
import { processOutbox, pendingOutboxCount } from '@/services/offline/syncEngine';

export function useConnectionStatus(pingIntervalMs = 15000) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPending = useCallback(async () => {
    try {
      setPendingCount(await pendingOutboxCount());
    } catch {
      /* ignore */
    }
  }, []);

  const checkHealth = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      refreshPending();
      return;
    }
    // Plain fetch (NOT apiFetch): apiFetch would answer from its offline cache and hide a real outage.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(`${BASE}/health`, { cache: 'no-store', signal: controller.signal });
      setIsOnline(res.ok);
      if (res.ok) await processOutbox(); // connection is really back: push saved changes
    } catch {
      setIsOnline(false);
    } finally {
      clearTimeout(timer);
      refreshPending();
    }
  }, [refreshPending]);

  useEffect(() => {
    const handleOnline = () => checkHealth();
    const handleOffline = () => { setIsOnline(false); refreshPending(); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('alince:sync-complete', refreshPending);

    checkHealth();
    const interval = setInterval(checkHealth, pingIntervalMs);
    // keep the "waiting to sync" counter fresh while offline changes are being queued
    const fast = setInterval(refreshPending, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('alince:sync-complete', refreshPending);
      clearInterval(interval);
      clearInterval(fast);
    };
  }, [checkHealth, pingIntervalMs, refreshPending]);

  return { isOnline, pendingCount };
}
