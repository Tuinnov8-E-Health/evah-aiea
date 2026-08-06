'use client';

import { useEffect } from 'react';
import { startSyncListeners } from '@/lib/sync';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';

let listenersStarted = false;

export function SyncListeners() {
  const { lastMessage } = useWebSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || listenersStarted) return;

    startSyncListeners();
    listenersStarted = true;
  }, []);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'notification') {
        toast({
          title: lastMessage.payload.title || 'Notification',
          description: lastMessage.payload.message,
        });
      }
    }
  }, [lastMessage, toast]);

  return null;
}
