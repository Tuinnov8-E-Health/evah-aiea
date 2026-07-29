'use client';

import { useEffect } from 'react';
import { startSyncListeners } from '@/lib/sync';

let listenersStarted = false;

export function SyncListeners() {
  useEffect(() => {
    if (typeof window === 'undefined' || listenersStarted) return;

    startSyncListeners();
    listenersStarted = true;
  }, []);

  return null;
}
