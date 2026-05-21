import { get, set, del } from 'idb-keyval';
import { saveToCloud } from './cloudSyncService';

/**
 * Zustand-compatible storage adapter using IndexedDB via idb-keyval.
 * Implements the StorageValue interface expected by Zustand's persist middleware.
 */
export const idbStorage = {
  getItem: async (name: string) => {
    const value = await get(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name: string, value: unknown) => {
    await set(name, JSON.stringify(value));

    // Cloud sync hook — saves to Supabase when user is linked (per D-02)
    // Check if the value contains game state data (has player and lastUpdate fields)
    if (value && typeof value === 'object' && 'state' in value) {
      const state = (value as Record<string, unknown>).state;
      if (state && typeof state === 'object' && 'player' in state && 'lastUpdate' in state) {
        try {
          await saveToCloud(state as Record<string, unknown>);
        } catch {
          // Cloud save failures should NOT break local save (per T-05-09)
          // Silently logged — local save always succeeds
        }
      }
    }
  },
  removeItem: async (name: string) => {
    await del(name);
  },
};
