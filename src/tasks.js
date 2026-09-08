// Pure task reducers. No storage, no zustand, no DOM — the store layer wraps
// these, which keeps every rule about tasks testable under `node --test`.
import { sanitizeHtml, MAX_NOTES } from './richtext.js';
import { isISODate } from './dates.js';

export const FILTERS = ['all', 'active', 'done'];
export const MAX_LEN = 200;

let seq = 0;
const newId = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const normalize = (text) => String(text ?? '').trim().slice(0, MAX_LEN);

export function add(tasks, text) {
  const title = normalize(text);
  if (!title) return tasks;
  return [...tasks, { id: newId(), title, done: false, notes: '', due: null, createdAt: Date.now() }];
}

export function toggle(tasks, id) {
  return tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

// Partial edit from the details sheet. Only the keys present are touched, and a
// blank title is ignored rather than wiping the task you opened.
export function update(tasks, id, patch = {}) {
  return tasks.map((t) => {
    if (t.id !== id) return t;
    const next = { ...t };
    if ('title' in patch) next.title = normalize(patch.title) || t.title;
    if ('notes' in patch) next.notes = sanitizeHtml(patch.notes).slice(0, MAX_NOTES);
    if ('due' in patch) next.due = isISODate(patch.due) ? patch.due : null;
    return next;
  });
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

// Anything that isn't a well-formed task is dropped rather than trusted. Runs on
// everything read back from storage, so bad data cannot survive a reload.
export function sanitize(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((t) => t && typeof t.id === 'string' && typeof t.title === 'string')
    .map((t) => ({
      id: t.id,
      title: normalize(t.title),
      done: Boolean(t.done),
      notes: sanitizeHtml(t.notes).slice(0, MAX_NOTES),
      due: isISODate(t.due) ? t.due : null,
      createdAt: Number(t.createdAt) || Date.now(),
    }))
    .filter((t) => t.title);
}
