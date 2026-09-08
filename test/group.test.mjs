import test from 'node:test';
import assert from 'node:assert/strict';
import { groupByDate } from '../src/group.js';

const TODAY = '2026-09-08';
let n = 0;
const task = (due, extra = {}) => ({ id: `t${++n}`, title: `t${n}`, done: false, notes: '', due, createdAt: n, ...extra });

const keys = (groups) => groups.map((g) => g.key);
const labels = (groups) => groups.map((g) => g.label);

test('empty input produces no groups', () => {
  assert.deepEqual(groupByDate([], TODAY), []);
});

test('buckets relative days by name', () => {
  const groups = groupByDate([task('2026-09-08'), task('2026-09-09'), task('2026-09-01')], TODAY);
  assert.deepEqual(keys(groups), ['overdue', 'today', 'tomorrow']);
  assert.deepEqual(labels(groups), ['Overdue', 'Today', 'Tomorrow']);
});

test('all past days collapse into one overdue bucket, oldest first', () => {
  const groups = groupByDate([task('2026-09-05'), task('2026-09-01'), task('2026-09-07')], TODAY);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].tasks.map((t) => t.due), ['2026-09-01', '2026-09-05', '2026-09-07']);
});

test('each future day past tomorrow keeps its own group', () => {
  const groups = groupByDate([task('2026-09-20'), task('2026-09-12'), task('2026-09-20')], TODAY);
  assert.deepEqual(keys(groups), ['2026-09-12', '2026-09-20']);
  assert.equal(groups[1].tasks.length, 2);
  assert.match(groups[0].label, /12/);
});

test('undated tasks sort last', () => {
  const groups = groupByDate([task(null), task('2026-09-08'), task(null)], TODAY);
  assert.deepEqual(keys(groups), ['today', 'none']);
  assert.equal(groups[1].label, 'No date');
  assert.equal(groups[1].tasks.length, 2);
});

test('an invalid stored date counts as undated', () => {
  assert.deepEqual(keys(groupByDate([task('2026-02-30')], TODAY)), ['none']);
});

test('groups run overdue, today, tomorrow, later, undated', () => {
  const groups = groupByDate(
    [task(null), task('2026-10-01'), task('2026-09-09'), task('2026-09-08'), task('2026-09-02')],
    TODAY,
  );
  assert.deepEqual(keys(groups), ['overdue', 'today', 'tomorrow', '2026-10-01', 'none']);
});

test('completed tasks group by date like any other', () => {
  const groups = groupByDate([task('2026-09-01', { done: true })], TODAY);
  assert.deepEqual(keys(groups), ['overdue']);
});

test('creation order breaks ties within a day', () => {
  const groups = groupByDate([task('2026-09-08'), task('2026-09-08')], TODAY);
  assert.deepEqual(groups[0].tasks.map((t) => t.id), groups[0].tasks.map((t) => t.id).sort());
});
