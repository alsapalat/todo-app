import test from 'node:test';
import assert from 'node:assert/strict';
import { isISODate, toISODate, dayDiff, isOverdue, formatDue } from '../src/dates.js';

test('isISODate accepts real calendar days only', () => {
  assert.equal(isISODate('2026-09-08'), true);
  assert.equal(isISODate('2026-02-30'), false);
  assert.equal(isISODate('2026-13-01'), false);
  assert.equal(isISODate('8/9/2026'), false);
  assert.equal(isISODate(''), false);
  assert.equal(isISODate(null), false);
});

test('toISODate uses the local calendar day, not UTC', () => {
  assert.equal(toISODate(new Date(2026, 8, 8, 23, 30)), '2026-09-08');
  assert.equal(toISODate(new Date(2026, 0, 1, 0, 5)), '2026-01-01');
});

test('dayDiff counts whole days across a DST boundary', () => {
  assert.equal(dayDiff('2026-09-08', '2026-09-08'), 0);
  assert.equal(dayDiff('2026-09-09', '2026-09-08'), 1);
  assert.equal(dayDiff('2026-09-07', '2026-09-08'), -1);
  assert.equal(dayDiff('2026-03-30', '2026-03-28'), 2);
});

test('isOverdue is true only for past days', () => {
  assert.equal(isOverdue('2026-09-07', '2026-09-08'), true);
  assert.equal(isOverdue('2026-09-08', '2026-09-08'), false);
  assert.equal(isOverdue('2026-09-09', '2026-09-08'), false);
  assert.equal(isOverdue('nonsense', '2026-09-08'), false);
});

test('formatDue names the days either side of today', () => {
  assert.equal(formatDue('2026-09-08', '2026-09-08'), 'Today');
  assert.equal(formatDue('2026-09-09', '2026-09-08'), 'Tomorrow');
  assert.equal(formatDue('2026-09-07', '2026-09-08'), 'Yesterday');
});

test('formatDue falls back to a short date, with a year only when it differs', () => {
  const near = formatDue('2026-09-20', '2026-09-08');
  assert.match(near, /20/);
  assert.equal(near.includes('2026'), false);
  assert.match(formatDue('2027-01-04', '2026-09-08'), /2027/);
});

test('formatDue returns nothing for an invalid date', () => {
  assert.equal(formatDue('', '2026-09-08'), '');
  assert.equal(formatDue('2026-02-30', '2026-09-08'), '');
});
