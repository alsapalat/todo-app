import test from 'node:test';
import assert from 'node:assert/strict';
import { readTheme, writeTheme, nextTheme, resolveTheme, isTheme, THEME_KEY } from '../src/theme.js';

const memory = (seed) => {
  const map = new Map(seed ? [[THEME_KEY, seed]] : []);
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
};

test('isTheme accepts only the two themes', () => {
  assert.equal(isTheme('light'), true);
  assert.equal(isTheme('dark'), true);
  assert.equal(isTheme('system'), false);
  assert.equal(isTheme(null), false);
});

test('nextTheme flips', () => {
  assert.equal(nextTheme('dark'), 'light');
  assert.equal(nextTheme('light'), 'dark');
});

test('resolveTheme prefers a stored override', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('resolveTheme falls back to the system when nothing is stored', () => {
  assert.equal(resolveTheme(null, true), 'dark');
  assert.equal(resolveTheme(null, false), 'light');
  assert.equal(resolveTheme('nonsense', true), 'dark');
});

test('readTheme returns null for missing or junk values', () => {
  assert.equal(readTheme(memory()), null);
  assert.equal(readTheme(memory('purple')), null);
  assert.equal(readTheme(memory('dark')), 'dark');
});

test('writeTheme round-trips and rejects junk', () => {
  const store = memory();
  assert.equal(writeTheme('dark', store), true);
  assert.equal(readTheme(store), 'dark');
  assert.equal(writeTheme('purple', store), false);
  assert.equal(readTheme(store), 'dark');
});

test('storage failures degrade instead of throwing', () => {
  const broken = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  assert.equal(readTheme(broken), null);
  assert.equal(writeTheme('dark', broken), false);
});
