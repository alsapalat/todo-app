import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHtml, isEmptyHtml, MAX_NOTES } from '../src/richtext.js';

test('keeps allowed formatting tags', () => {
  assert.equal(sanitizeHtml('<strong>a</strong> <em>b</em> <u>c</u> <s>d</s>'),
    '<strong>a</strong> <em>b</em> <u>c</u> <s>d</s>');
  assert.equal(sanitizeHtml('<ul><li>one</li><li>two</li></ul>'),
    '<ul><li>one</li><li>two</li></ul>');
});

test('normalises legacy tags to their modern equivalent', () => {
  assert.equal(sanitizeHtml('<b>a</b><i>b</i><strike>c</strike><div>d</div>'),
    '<strong>a</strong><em>b</em><s>c</s><p>d</p>');
});

test('strips every attribute', () => {
  assert.equal(sanitizeHtml('<strong class="x" onclick="steal()">hi</strong>'),
    '<strong>hi</strong>');
  assert.equal(sanitizeHtml('<p style="position:fixed">hi</p>'), '<p>hi</p>');
});

test('drops unknown tags but keeps their text', () => {
  assert.equal(sanitizeHtml('<span>plain</span>'), 'plain');
  assert.equal(sanitizeHtml('<a href="http://evil">link</a>'), 'link');
});

test('drops dangerous subtrees entirely', () => {
  assert.equal(sanitizeHtml('<script>alert(1)</script>after'), 'after');
  assert.equal(sanitizeHtml('before<style>body{display:none}</style>after'), 'beforeafter');
  assert.equal(sanitizeHtml('<iframe src="x">nope</iframe>ok'), 'ok');
});

test('escapes text so injected markup cannot survive a round trip', () => {
  const once = sanitizeHtml('<img src=x onerror=alert(1)>');
  assert.equal(once.includes('onerror'), false);
  assert.equal(sanitizeHtml(once), once); // sanitising twice changes nothing
  assert.equal(sanitizeHtml('5 < 6 & 7 > 2'), '5 &lt; 6 &amp; 7 &gt; 2');
});

test('closes tags left open and ignores stray closers', () => {
  assert.equal(sanitizeHtml('<strong>bold'), '<strong>bold</strong>');
  assert.equal(sanitizeHtml('</strong>text'), 'text');
  assert.equal(sanitizeHtml('<em><strong>x</em></strong>'), '<em><strong>x</strong></em>');
});

test('br survives as a void tag', () => {
  assert.equal(sanitizeHtml('a<br>b<br/>c'), 'a<br>b<br>c');
});

test('caps very long input', () => {
  assert.ok(sanitizeHtml('x'.repeat(MAX_NOTES + 500)).length <= MAX_NOTES);
});

test('handles empty and nullish input', () => {
  assert.equal(sanitizeHtml(''), '');
  assert.equal(sanitizeHtml(null), '');
  assert.equal(sanitizeHtml(undefined), '');
});

test('isEmptyHtml ignores markup and whitespace', () => {
  assert.equal(isEmptyHtml(''), true);
  assert.equal(isEmptyHtml('<p><br></p>'), true);
  assert.equal(isEmptyHtml('<p>&nbsp; </p>'), true);
  assert.equal(isEmptyHtml(null), true);
  assert.equal(isEmptyHtml('<p>note</p>'), false);
});
