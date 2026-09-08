// UI layer: renders the store into the DOM and wires up events.
import {
  add, toggle, update, remove, clearDone, filter, counts, load, save, MAX_LEN,
} from './store.js';
import { readTheme, writeTheme, nextTheme, resolveTheme } from './theme.js';
import { sanitizeHtml, isEmptyHtml } from './richtext.js';
import { toISODate, formatDue, isOverdue } from './dates.js';

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
  sheet: $('details'),
  sheetForm: $('details-form'),
  sheetClose: $('sheet-close'),
  sheetCancel: $('sheet-cancel'),
  dTitle: $('d-title'),
  dNotes: $('d-notes'),
  dDue: $('d-due'),
  dDueClear: $('d-due-clear'),
  rtBar: $('rt-bar'),
};

let tasks = load();
let current = 'all';
let openId = null; // task whose details sheet is open
let today = toISODate();

const darkQuery = matchMedia('(prefers-color-scheme: dark)');
let theme = resolveTheme(readTheme(), darkQuery.matches);

const EMPTY_COPY = {
  all: ['No tasks yet', 'Add one below to get started.'],
  active: ['All clear', 'Nothing left to do.'],
  done: ['Nothing done yet', 'Completed tasks land here.'],
};

const icon = (name, cls = 'icon') =>
  `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}" /></svg>`;

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

// --- list ------------------------------------------------------------

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
}

function row(t) {
  const hasNotes = !isEmptyHtml(t.notes);
  const meta = [];

  if (hasNotes) meta.push(`<span class="tag">${icon('note', 'icon icon-xs')}Notes</span>`);
  if (t.due) {
    const late = !t.done && isOverdue(t.due, today);
    meta.push(
      `<span class="tag${late ? ' late' : ''}">${icon('calendar', 'icon icon-xs')}${escape(formatDue(t.due, today))}</span>`,
    );
  }

  return `
    <li class="item${t.done ? ' done' : ''}" data-id="${t.id}">
      <button class="check" data-act="toggle" aria-pressed="${t.done}"
              aria-label="${t.done ? 'Mark as not done' : 'Mark as done'}">
        <span class="box">${icon('check')}</span>
      </button>
      <button class="body" data-act="details" aria-label="Details for ${escape(t.title)}">
        <span class="body-text">
          <span class="label">${escape(t.title)}</span>
          ${meta.length ? `<span class="meta">${meta.join('')}</span>` : ''}
        </span>
        ${icon('chevron', 'icon icon-xs chevron')}
      </button>
      <button class="act danger" data-act="remove" aria-label="Delete task">${icon('trash')}</button>
    </li>`;
}

// --- details sheet ---------------------------------------------------

function openDetails(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  openId = id;
  els.dTitle.value = task.title;
  els.dNotes.innerHTML = sanitizeHtml(task.notes);
  els.dDue.value = task.due ?? '';
  syncNotes();
  syncToolbar();
  els.sheet.showModal();
}

// Saving hangs off submit rather than the dialog's close event: `close` is not
// reliably delivered for a method="dialog" submit, and submit says what we mean.
els.sheetForm.addEventListener('submit', () => {
  const id = openId;
  openId = null;
  if (!id) return;

  commit(update(tasks, id, {
    title: els.dTitle.value,
    notes: els.dNotes.innerHTML,
    due: els.dDue.value,
  }));
});

function dismiss() {
  openId = null; // discard: nothing is written on the way out
  els.sheet.close();
}
els.sheetClose.addEventListener('click', dismiss);
els.sheetCancel.addEventListener('click', dismiss);
els.sheet.addEventListener('cancel', () => { openId = null; }); // Esc

// Tapping the backdrop closes without saving; the form itself swallows the click.
els.sheet.addEventListener('click', (e) => {
  if (e.target === els.sheet) dismiss();
});

els.dDueClear.addEventListener('click', () => {
  els.dDue.value = '';
  els.dDue.focus();
});

// --- rich text -------------------------------------------------------

const COMMANDS = ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'];

const syncNotes = () =>
  els.dNotes.classList.toggle('is-empty', isEmptyHtml(els.dNotes.innerHTML));

function syncToolbar() {
  for (const btn of els.rtBar.querySelectorAll('[data-cmd]')) {
    let on = false;
    try { on = document.queryCommandState(btn.dataset.cmd); } catch { /* not focused */ }
    btn.setAttribute('aria-pressed', String(on));
  }
}

// Keep the caret where it is when a toolbar button is pressed.
els.rtBar.addEventListener('mousedown', (e) => {
  if (e.target.closest('[data-cmd]')) e.preventDefault();
});

els.rtBar.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cmd]');
  if (!btn || !COMMANDS.includes(btn.dataset.cmd)) return;
  els.dNotes.focus();
  // Ask for tags rather than inline styles — the sanitiser keeps tags, not styles.
  try { document.execCommand('styleWithCSS', false, false); } catch { /* not supported */ }
  document.execCommand(btn.dataset.cmd, false, null);
  syncNotes();
  syncToolbar();
});

// Paste as plain text so foreign markup never enters the field in the first place.
els.dNotes.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = e.clipboardData?.getData('text/plain') ?? '';
  document.execCommand('insertText', false, text);
});

els.dNotes.addEventListener('input', syncNotes);
document.addEventListener('selectionchange', () => {
  if (els.sheet.open && els.dNotes.contains(document.getSelection()?.anchorNode ?? null)) {
    syncToolbar();
  }
});

// --- composer, filters, list events ----------------------------------

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
  if (trigger.dataset.act === 'details') openDetails(id);
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

// A tab left open overnight should not keep calling yesterday "Today".
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  const now = toISODate();
  if (now === today) return;
  today = now;
  els.date.textContent = dateLabel();
  render();
});

const dateLabel = () => new Date().toLocaleDateString(undefined, {
  weekday: 'short', month: 'short', day: 'numeric',
});

applyTheme(theme);
els.date.textContent = dateLabel();
els.addBtn.disabled = true;
render();
