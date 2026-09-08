import test from 'node:test';
import assert from 'node:assert/strict';
import {
  add, toggle, update, remove, clearDone, filter, counts, sanitize, MAX_LEN,
} from '../src/tasks.js';

test('add appends a trimmed, undone task', () => {
  const [t] = add([], '  buy milk  ');
  assert.equal(t.title, 'buy milk');
  assert.equal(t.done, false);
});

test('add ignores blank input', () => {
  const tasks = [];
  assert.equal(add(tasks, '   '), tasks);
});

test('add truncates to the max length', () => {
  const [t] = add([], 'x'.repeat(MAX_LEN + 50));
  assert.equal(t.title.length, MAX_LEN);
});

test('ids are unique even within the same millisecond', () => {
  const tasks = ['a', 'b', 'c'].reduce(add, []);
  assert.equal(new Set(tasks.map((t) => t.id)).size, 3);
});

test('toggle flips only the target and does not mutate', () => {
  const before = add(add([], 'a'), 'b');
  const after = toggle(before, before[0].id);
  assert.equal(after[0].done, true);
  assert.equal(after[1].done, false);
  assert.equal(before[0].done, false);
});

test('new tasks start with no notes and no target date', () => {
  const [t] = add([], 'a');
  assert.equal(t.notes, '');
  assert.equal(t.due, null);
});

test('update patches only the keys it is given', () => {
  const before = update(add([], 'old'), null, {});
  const id = before[0].id;
  const titled = update(before, id, { title: 'new' });
  assert.equal(titled[0].title, 'new');
  assert.equal(titled[0].notes, '');

  const noted = update(titled, id, { notes: '<b>why</b>' });
  assert.equal(noted[0].title, 'new');
  assert.equal(noted[0].notes, '<strong>why</strong>');
});

test('update keeps the old title when handed a blank one', () => {
  const before = add([], 'old');
  assert.equal(update(before, before[0].id, { title: '   ' })[0].title, 'old');
});

test('update sanitises notes and validates the date', () => {
  const before = add([], 'a');
  const id = before[0].id;
  assert.equal(
    update(before, id, { notes: '<script>alert(1)</script><i>ok</i>' })[0].notes,
    '<em>ok</em>',
  );
  assert.equal(update(before, id, { due: '2026-09-20' })[0].due, '2026-09-20');
  assert.equal(update(before, id, { due: '2026-02-30' })[0].due, null);
  assert.equal(update(before, id, { due: '' })[0].due, null);
});

test('update leaves other tasks untouched', () => {
  const before = add(add([], 'a'), 'b');
  const after = update(before, before[0].id, { title: 'changed' });
  assert.equal(after[1], before[1]);
});

test('remove drops the task', () => {
  const before = add(add([], 'a'), 'b');
  const after = remove(before, before[0].id);
  assert.deepEqual(after.map((t) => t.title), ['b']);
});

test('clearDone keeps only active tasks', () => {
  const before = add(add([], 'a'), 'b');
  const after = clearDone(toggle(before, before[0].id));
  assert.deepEqual(after.map((t) => t.title), ['b']);
});

test('filter splits by state', () => {
  const base = add(add([], 'a'), 'b');
  const tasks = toggle(base, base[0].id);
  assert.equal(filter(tasks, 'all').length, 2);
  assert.equal(filter(tasks, 'active').length, 1);
  assert.equal(filter(tasks, 'done').length, 1);
  assert.equal(filter(tasks, 'done')[0].title, 'a');
});

test('counts reports totals', () => {
  const before = add(add([], 'a'), 'b');
  assert.deepEqual(counts(toggle(before, before[0].id)), { total: 2, done: 1, active: 1 });
});

test('sanitize rejects junk and coerces shape', () => {
  assert.deepEqual(sanitize(null), []);
  assert.deepEqual(sanitize('not an array'), []);
  assert.deepEqual(sanitize([{ a: 1 }]), []);
  assert.deepEqual(sanitize([{ id: '1' }, { nope: true }]), []);
  assert.deepEqual(sanitize([{ id: '1', title: '   ' }]), []);

  const [t] = sanitize([{ id: '1', title: ' hi ', done: 'yes', createdAt: 5 }]);
  assert.deepEqual(t, { id: '1', title: 'hi', done: true, notes: '', due: null, createdAt: 5 });
});

test('sanitize scrubs stored notes and drops an invalid date', () => {
  const [t] = sanitize([{ id: '1', title: 'hi', notes: '<img src=x onerror=go()>n', due: 'nope' }]);
  assert.equal(t.notes.includes('onerror'), false);
  assert.equal(t.due, null);
  assert.equal(sanitize([{ id: '1', title: 'hi', due: '2026-09-20' }])[0].due, '2026-09-20');
});
