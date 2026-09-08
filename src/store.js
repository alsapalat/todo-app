// Zustand store, persisted to localStorage.
//
// All task rules live in tasks.js; this layer only holds the current list,
// exposes actions and handles persistence. Written against zustand/vanilla —
// there is no React here.
import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as T from './tasks.js';

export const STORAGE_KEY = 'todo-app';
export const LEGACY_SESSION_KEY = 'todo-app:v1';
export const VERSION = 1;

// Private browsing can make localStorage throw on touch. Falling back to memory
// keeps the app usable for the session instead of failing to start.
const memoryStorage = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
};

export function pickStorage(candidate = globalThis.localStorage) {
  try {
    const probe = '__todo_probe__';
    candidate.setItem(probe, '1');
    candidate.removeItem(probe);
    return { storage: candidate, durable: true };
  } catch {
    return { storage: memoryStorage(), durable: false };
  }
}

// One-time lift of tasks written by the old sessionStorage build, so upgrading
// does not look like data loss.
export function importLegacySession(local, session) {
  try {
    if (local.getItem(STORAGE_KEY)) return 0;
    const raw = session?.getItem(LEGACY_SESSION_KEY);
    if (!raw) return 0;

    const tasks = T.sanitize(JSON.parse(raw));
    if (!tasks.length) return 0;

    local.setItem(STORAGE_KEY, JSON.stringify({ state: { tasks }, version: VERSION }));
    return tasks.length;
  } catch {
    return 0;
  }
}

export function createTaskStore({ storage } = {}) {
  return createStore(
    persist(
      (set) => ({
        tasks: [],
        add: (text) => set((s) => ({ tasks: T.add(s.tasks, text) })),
        toggle: (id) => set((s) => ({ tasks: T.toggle(s.tasks, id) })),
        update: (id, patch) => set((s) => ({ tasks: T.update(s.tasks, id, patch) })),
        remove: (id) => set((s) => ({ tasks: T.remove(s.tasks, id) })),
        clearDone: () => set((s) => ({ tasks: T.clearDone(s.tasks) })),
      }),
      {
        name: STORAGE_KEY,
        version: VERSION,
        storage: createJSONStorage(() => storage),
        partialize: (s) => ({ tasks: s.tasks }),
        // Everything read back is re-validated; storage is not a trusted source.
        merge: (persisted, current) => ({ ...current, tasks: T.sanitize(persisted?.tasks) }),
      },
    ),
  );
}

const picked = pickStorage();

/** True when tasks survive closing the tab; false in private-mode fallback. */
export const durable = picked.durable;

/** Number of tasks lifted from the old sessionStorage build on this load. */
export const imported = durable
  ? importLegacySession(picked.storage, globalThis.sessionStorage)
  : 0;

export const store = createTaskStore({ storage: picked.storage });
