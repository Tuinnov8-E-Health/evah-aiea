import { createEncounter, fetchPatients } from '@/lib/client-api';
import type { Encounter } from '@/lib/types';
import { getPendingEncounters, removeFromQueue, upsertPatients } from '@/lib/offline-queue';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';

/**
 * Syncs the local patient registry with the server.
 */
export async function syncPatients(): Promise<void> {
    try {
        const { patients } = await fetchPatients();
        if (patients && Array.isArray(patients)) {
            await upsertPatients(patients);
        }
    } catch (e) {
        // Silently fail if offline or server is down
        console.error('Failed to sync patients:', e);
    }
}

/**
 * Attempts to flush locally queued encounters to the server.
 *
 * For each pending record, we attempt `createEncounter()` and on
 * success remove it from the local queue. Failures are left in the
 * queue for future retry. This function never throws; it swallows
 * network errors so callers can call it safely.
 */
export async function flushQueue(): Promise<void> {
    const pending = await getPendingEncounters();

    for (const rec of pending) {
        const { localId, payload } = rec;
        const { id: _maybeId, ...body } = payload as any;

        try {
            await createEncounter(body as Omit<Encounter, 'id'>);
            await removeFromQueue(localId);
        } catch (e) {
            // Leave the item in the queue for retry
            // Intentionally don't rethrow
        }
    }
}

/**
 * Registers listeners to attempt flushing the queue when network
 * connectivity changes or the app resumes. The function returns
 * nothing and does not start listeners automatically at import time;
 * callers must invoke this when desired.
 */
export function startSyncListeners(): void {
    try {
        Network.addListener('networkStatusChange', (status) => {
            if ((status as any).connected) {
                void flushQueue();
                void syncPatients();
            }
        });
    } catch (e) {
        // Plugin not available in non-capacitor environments; ignore
    }

    try {
        App.addListener('resume', () => {
            void flushQueue();
            void syncPatients();
        });
    } catch (e) {
        // Plugin not available; ignore
    }
}
