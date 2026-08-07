// Client-only: Dexie/IndexedDB are browser APIs and do not exist server-side.
/**
 * Offline queue for encounters.
 *
 * Intended flow: when an encounter cannot be submitted (offline or
 * non-2xx response), the app will call `queueEncounter(payload)` to
 * persist the payload locally. Later, `flushQueue()` (in
 * `src/lib/sync.ts`) will read queued records and call the server
 * `createEncounter()` API for each; successful sends will be removed
 * from the queue while failures are left for retry. This file is
 * intentionally client-only and must not be imported in server code.
 */

import Dexie from 'dexie';
import type { Encounter, Patient } from '@/lib/types';

type PendingRecord = {
    localId: string;
    queuedAt: string; // ISO timestamp
    payload: Encounter;
};

class OfflineDB extends Dexie {
    pendingEncounters!: Dexie.Table<PendingRecord, string>;
    patients!: Dexie.Table<Patient, string>;

    constructor() {
        super('aiea-offline');
        this.version(1).stores({
            pendingEncounters: '&localId, queuedAt',
        });
        this.version(2).stores({
            pendingEncounters: '&localId, queuedAt',
            patients: '&id, name, status',
        });
    }
}

const db = new OfflineDB();

// --- Encounter Queue Logic ---
export async function queueEncounter(payload: Encounter): Promise<string> {
    const localId = typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
        ? (crypto as any).randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

    const queuedAt = new Date().toISOString();
    await db.pendingEncounters.add({ localId, queuedAt, payload });
    return localId;
}

export function getPendingCount(): Promise<number> {
    return db.pendingEncounters.count();
}

export function getPendingEncounters(): Promise<PendingRecord[]> {
    return db.pendingEncounters.toArray();
}

export function removeFromQueue(localId: string): Promise<void> {
    return db.pendingEncounters.delete(localId) as Promise<void>;
}

// --- Patient Storage Logic ---
export async function upsertPatients(patients: Patient[]): Promise<void> {
    await db.patients.bulkPut(patients);
}

export async function getLocalPatients(): Promise<Patient[]> {
    return db.patients.toArray();
}

export async function getPatientByIdLocally(id: string): Promise<Patient | undefined> {
    return db.patients.get(id);
}

export async function searchPatientsLocally(query: string): Promise<Patient[]> {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    // Dexie doesn't support native partial string matching in indices for all cases easily,
    // so we'll use a filter on the name and ID.
    return db.patients
        .filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.id.toLowerCase().includes(lowerQuery)
        )
        .toArray();
}

export type { PendingRecord };
