import { get, set, del } from 'idb-keyval';

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
  },
  removeItem: async (name: string) => {
    await del(name);
  },
};
