// UI layer: renders the store into the DOM and wires up events.
import {
  add, toggle, rename, remove, clearDone, filter, counts, load, save, MAX_LEN,
} from './store.js';
import { readTheme, writeTheme, nextTheme, resolveTheme } from './theme.js';

const $ = (id) => document.getElementById(id);
const els = {
  list: $('list'),
  empty: $('empty'),
  emptyTitle: $('empty-title'),
  emptySub: $('empty-sub'),
  count: $('count'),
  date: $('date'),
  filters: $('filters'),
  composer: $('composer'),
  input: $('input'),
  addBtn: $('add'),
  clear: $('clear'),
  toast: $('toast'),
  theme: $('theme'),
  themeIcon: $('theme-icon'),
  themeColor: $('theme-color'),
};

let tasks = load();
let current = 'all';
let editingId = null;

const darkQuery = matchMedia('(prefers-color-scheme: dark)');
let theme = resolveTheme(readTheme(), darkQuery.matches);

const EMPTY_COPY = {
  all: ['No tasks yet', 'Add one below to get started.'],
  active: ['All clear', 'Nothing left to do.'],
  done: ['Nothing done yet', 'Completed tasks land here.'],
};

const icon = (name) =>
  `<svg class="icon" aria-hidden="true"><use href="#i-${name}" /></svg>`;

const escape = (s) =>
  s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

function commit(next) {
  tasks = next;
  if (!save(tasks)) toast('Storage unavailable — tasks are tab-only');
  render();
}

let toastTimer;
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function render() {
  const visible = filter(tasks, current);
  const { total, active, done } = counts(tasks);

  els.list.innerHTML = visible.map(row).join('');
  els.list.hidden = visible.length === 0;

  els.empty.hidden = visible.length > 0;
  [els.emptyTitle.textContent, els.emptySub.textContent] = EMPTY_COPY[current];

  els.count.textContent = total === 0
    ? 'Nothing yet'
    : `${active} left · ${done} done`;

  els.clear.hidden = done === 0;

  for (const btn of els.filters.children) {
    btn.setAttribute('aria-selected', String(btn.dataset.filter === current));
  }

  if (editingId) {
    const input = els.list.querySelector('.edit-input');
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  }
}

function row(t) {
  const editing = t.id === editingId;
  const body = editing
    ? `<input class="edit-input" type="text" maxlength="${MAX_LEN}"
         value="${escape(t.title)}" aria-label="Edit task" enterkeyhint="done" />`
    : `<span class="label" data-act="edit">${escape(t.title)}</span>`;

  return `
    <li class="item${t.done ? ' done' : ''}" data-id="${t.id}">
      <button class="check" data-act="toggle" aria-pressed="${t.done}"
              aria-label="${t.done ? 'Mark as not done' : 'Mark as done'}">
        <span class="box">${icon('check')}</span>
      </button>
      ${body}
      ${editing ? '' : `<button class="act" data-act="edit" aria-label="Edit task">${icon('pencil')}</button>`}
      <button class="act danger" data-act="remove" aria-label="Delete task">${icon('trash')}</button>
    </li>`;
}

// --- events ----------------------------------------------------------

els.composer.addEventListener('submit', (e) => {
  e.preventDefault();
  const next = add(tasks, els.input.value);
  if (next === tasks) return;
  els.input.value = '';
  els.addBtn.disabled = true;
  current = current === 'done' ? 'all' : current; // don't add into a view that hides it
  commit(next);
});

els.input.addEventListener('input', () => {
  els.addBtn.disabled = els.input.value.trim() === '';
});

els.filters.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter');
  if (!btn) return;
  current = btn.dataset.filter;
  editingId = null;
  render();
});

els.clear.addEventListener('click', () => {
  const removed = counts(tasks).done;
  commit(clearDone(tasks));
  toast(`Cleared ${removed} task${removed === 1 ? '' : 's'}`);
});

els.list.addEventListener('click', (e) => {
  const item = e.target.closest('.item');
  const trigger = e.target.closest('[data-act]');
  if (!item || !trigger) return;
  const { id } = item.dataset;

  if (trigger.dataset.act === 'toggle') return commit(toggle(tasks, id));
  if (trigger.dataset.act === 'remove') return commit(remove(tasks, id));
  if (trigger.dataset.act === 'edit') {
    editingId = id;
    render();
  }
});

function finishEdit(input, save_ = true) {
  const id = editingId;
  if (!id) return;
  editingId = null;
  if (save_) commit(rename(tasks, id, input.value));
  else render();
}

els.list.addEventListener('keydown', (e) => {
  if (!e.target.classList.contains('edit-input')) return;
  if (e.key === 'Enter') { e.preventDefault(); finishEdit(e.target, true); }
  if (e.key === 'Escape') finishEdit(e.target, false);
});

els.list.addEventListener('focusout', (e) => {
  if (e.target.classList.contains('edit-input')) finishEdit(e.target, true);
});

// --- theme -----------------------------------------------------------

// Matches the token values in styles.css so mobile browser chrome follows along.
const BAR = { light: '#fafaf9', dark: '#0c0a09' };

function applyTheme(next, { persist = false } = {}) {
  theme = next;
  document.documentElement.dataset.theme = next;
  els.themeIcon.setAttribute('href', next === 'dark' ? '#i-sun' : '#i-moon');
  els.themeColor.setAttribute('content', BAR[next]);

  const label = `Switch to ${nextTheme(next)} mode`;
  els.theme.setAttribute('aria-label', label);
  els.theme.title = label;

  if (persist) writeTheme(next);
}

els.theme.addEventListener('click', () => {
  applyTheme(nextTheme(theme), { persist: true });
});

// Only relevant while no override is stored: follow the system if it changes.
darkQuery.addEventListener('change', (e) => {
  if (!readTheme()) applyTheme(e.matches ? 'dark' : 'light');
});

applyTheme(theme);

els.date.textContent = new Date().toLocaleDateString(undefined, {
  weekday: 'short', month: 'short', day: 'numeric',
});
els.addBtn.disabled = true;
render();
