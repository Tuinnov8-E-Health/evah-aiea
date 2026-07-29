/**
 * Client-only Capacitor helper.
 * WARNING: Import this file only from client components. Do NOT import
 * this module into Server Components or Server Actions — it uses the
 * Capacitor runtime which is unavailable on the server.
 */
import { Capacitor } from '@capacitor/core';

export function isNative(): boolean {
    try {
        return typeof Capacitor !== 'undefined' &&
            typeof (Capacitor as any).isNativePlatform === 'function' &&
            (Capacitor as any).isNativePlatform();
    } catch {
        return false;
    }
}

export default { isNative };
