import type { Encounter } from '@/lib/types';

export type StoredEncounter = Encounter & {
    viewed?: boolean;
    viewerNotes?: string;
};

export const ENCOUNTER_STORAGE_KEY = 'session_encounters';

export function readStoredEncounters<T extends StoredEncounter = StoredEncounter>(): T[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const saved = localStorage.getItem(ENCOUNTER_STORAGE_KEY);
        if (!saved) {
            return [];
        }

        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function writeStoredEncounters<T extends StoredEncounter = StoredEncounter>(encounters: T[]) {
    if (typeof window === 'undefined') {
        return encounters;
    }

    localStorage.setItem(ENCOUNTER_STORAGE_KEY, JSON.stringify(encounters));
    return encounters;
}

export function appendStoredEncounter<T extends StoredEncounter = StoredEncounter>(encounter: T) {
    const nextEncounters = [...readStoredEncounters<T>(), encounter];
    return writeStoredEncounters(nextEncounters);
}

export function mergeStoredEncounters<T extends StoredEncounter = StoredEncounter>(seedEncounters: T[], storedEncounters: T[] = readStoredEncounters<T>()): T[] {
    const combined = [...seedEncounters, ...storedEncounters];
    const ordered = Array.from(
        combined.reduce((map, encounter) => {
            if (encounter.id) {
                map.set(encounter.id, encounter);
            }
            return map;
        }, new Map<string, T>()).values()
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return ordered;
}
