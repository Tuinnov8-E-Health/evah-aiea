'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPendingCount } from '@/lib/offline-queue';
import { flushQueue } from '@/lib/sync';

export function useOfflineQueue() {
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    setPendingCount(await getPendingCount());
  }, []);

  const flushNow = useCallback(async () => {
    await flushQueue();
    await refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    void refreshPendingCount();
    const intervalId = window.setInterval(() => void refreshPendingCount(), 30_000);
    window.addEventListener('focus', refreshPendingCount);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshPendingCount);
    };
  }, [refreshPendingCount]);

  return { pendingCount, flushNow };
}
