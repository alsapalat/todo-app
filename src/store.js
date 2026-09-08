// Task store. Pure reducers over a plain array + a thin sessionStorage layer,
// so the logic is testable in node without a DOM.

export const STORAGE_KEY = 'todo-app:v1';
export const FILTERS = ['all', 'active', 'done'];
export const MAX_LEN = 200;

let seq = 0;
const newId = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const normalize = (text) => String(text ?? '').trim().slice(0, MAX_LEN);

export function add(tasks, text) {
  const title = normalize(text);
  if (!title) return tasks;
  return [...tasks, { id: newId(), title, done: false, createdAt: Date.now() }];
}

export function toggle(tasks, id) {
  return tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

export function rename(tasks, id, text) {
  const title = normalize(text);
  if (!title) return remove(tasks, id); // emptying a task deletes it
  return tasks.map((t) => (t.id === id ? { ...t, title } : t));
}

export const remove = (tasks, id) => tasks.filter((t) => t.id !== id);

export const clearDone = (tasks) => tasks.filter((t) => !t.done);

export function filter(tasks, name) {
  if (name === 'active') return tasks.filter((t) => !t.done);
  if (name === 'done') return tasks.filter((t) => t.done);
  return tasks;
}

export const counts = (tasks) => ({
  total: tasks.length,
  done: tasks.filter((t) => t.done).length,
  active: tasks.filter((t) => !t.done).length,
});

// --- persistence -----------------------------------------------------

// Anything that isn't a well-formed task is dropped rather than trusted.
export function parse(raw) {
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((t) => t && typeof t.id === 'string' && typeof t.title === 'string')
      .map((t) => ({
        id: t.id,
        title: normalize(t.title),
        done: Boolean(t.done),
        createdAt: Number(t.createdAt) || Date.now(),
      }))
      .filter((t) => t.title);
  } catch {
    return [];
  }
}

export function load(storage = globalThis.sessionStorage) {
  try {
    return parse(storage?.getItem(STORAGE_KEY));
  } catch {
    return []; // private mode / storage disabled
  }
}

export function save(tasks, storage = globalThis.sessionStorage) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}
