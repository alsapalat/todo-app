import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTaskStore, pickStorage, importLegacySession, STORAGE_KEY, LEGACY_SESSION_KEY, VERSION,
} from '../src/store.js';

const memory = (seed = {}) => {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
};

const persisted = (storage) => JSON.parse(storage.getItem(STORAGE_KEY)).state.tasks;

test('actions drive the task list', () => {
  const store = createTaskStore({ storage: memory() });
  store.getState().add('write it down');
  assert.equal(store.getState().tasks.length, 1);

  const { id } = store.getState().tasks[0];
  store.getState().toggle(id);
  assert.equal(store.getState().tasks[0].done, true);

  store.getState().update(id, { title: 'write it down properly', due: '2026-09-20' });
  assert.equal(store.getState().tasks[0].title, 'write it down properly');
  assert.equal(store.getState().tasks[0].due, '2026-09-20');

  store.getState().remove(id);
  assert.deepEqual(store.getState().tasks, []);
});

test('clearDone keeps the active tasks', () => {
  const store = createTaskStore({ storage: memory() });
  store.getState().add('a');
  store.getState().add('b');
  store.getState().toggle(store.getState().tasks[0].id);
  store.getState().clearDone();
  assert.deepEqual(store.getState().tasks.map((t) => t.title), ['b']);
});

test('subscribers are notified of changes', () => {
  const store = createTaskStore({ storage: memory() });
  let calls = 0;
  const off = store.subscribe(() => { calls += 1; });
  store.getState().add('a');
  assert.equal(calls, 1);
  off();
  store.getState().add('b');
  assert.equal(calls, 1);
});

test('every change is written to storage', () => {
  const storage = memory();
  const store = createTaskStore({ storage });
  store.getState().add('persist me');
  assert.deepEqual(persisted(storage).map((t) => t.title), ['persist me']);
});

test('a new store reads back what the last one wrote', () => {
  const storage = memory();
  createTaskStore({ storage }).getState().add('survive the reload');

  const reopened = createTaskStore({ storage });
  assert.deepEqual(reopened.getState().tasks.map((t) => t.title), ['survive the reload']);
});

test('tampered storage is re-sanitised on load, not trusted', () => {
  const storage = memory({
    [STORAGE_KEY]: JSON.stringify({
      version: VERSION,
      state: {
        tasks: [
          { id: '1', title: 'ok', notes: '<img src=x onerror=steal()>note', due: 'nonsense' },
          { id: '2', nope: true },
        ],
      },
    }),
  });

  const [only, ...rest] = createTaskStore({ storage }).getState().tasks;
  assert.equal(rest.length, 0);
  assert.equal(only.notes.includes('onerror'), false);
  assert.equal(only.due, null);
});

test('an empty store starts with no tasks', () => {
  assert.deepEqual(createTaskStore({ storage: memory() }).getState().tasks, []);
});

test('pickStorage falls back to memory when localStorage throws', () => {
  const blocked = { setItem() { throw new Error('denied'); }, removeItem() {}, getItem() { return null; } };
  const fallback = pickStorage(blocked);
  assert.equal(fallback.durable, false);

  fallback.storage.setItem('k', 'v'); // usable, just not durable
  assert.equal(fallback.storage.getItem('k'), 'v');
  assert.equal(pickStorage(memory()).durable, true);
});

test('legacy sessionStorage tasks are lifted into localStorage once', () => {
  const local = memory();
  const session = memory({
    [LEGACY_SESSION_KEY]: JSON.stringify([{ id: 'x', title: 'from the old build', done: false }]),
  });

  assert.equal(importLegacySession(local, session), 1);
  assert.deepEqual(createTaskStore({ storage: local }).getState().tasks.map((t) => t.title),
    ['from the old build']);

  // Already migrated: a second run must not clobber what is there now.
  assert.equal(importLegacySession(local, session), 0);
});

test('legacy import is a no-op with nothing to import', () => {
  assert.equal(importLegacySession(memory(), memory()), 0);
  assert.equal(importLegacySession(memory(), memory({ [LEGACY_SESSION_KEY]: 'not json' })), 0);
  assert.equal(importLegacySession(memory(), memory({ [LEGACY_SESSION_KEY]: '[]' })), 0);
  assert.equal(importLegacySession(memory(), null), 0);
});
