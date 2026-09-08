// Allowlist sanitiser for the description field.
//
// contenteditable and pasted markup can carry anything, so nothing is trusted:
// text is escaped, every attribute is dropped, and only structural formatting
// tags survive. Written without the DOM so it runs under `node --test`.

export const MAX_NOTES = 5000;

// Source tag -> the tag we emit. Anything absent keeps its text, loses its tag.
const ALLOWED = new Map([
  ['b', 'strong'], ['strong', 'strong'],
  ['i', 'em'], ['em', 'em'],
  ['u', 'u'],
  ['s', 's'], ['strike', 's'], ['del', 's'],
  ['p', 'p'], ['div', 'p'],
  ['br', 'br'],
  ['ul', 'ul'], ['ol', 'ol'], ['li', 'li'],
]);

const VOID = new Set(['br']);

// Tags whose *contents* are dropped too, not just their markup.
const DROP_SUBTREE = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math',
]);

const escape = (s) =>
  s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;

export function sanitizeHtml(input) {
  const html = String(input ?? '').slice(0, MAX_NOTES);
  const out = [];
  const open = [];
  let i = 0;
  let skipUntil = null; // tag name whose subtree we are discarding

  const text = (chunk) => { if (!skipUntil && chunk) out.push(escape(chunk)); };

  TAG.lastIndex = 0;
  for (let m; (m = TAG.exec(html)); ) {
    // A "<" that starts no tag is literal text, so comments never open a hole.
    text(html.slice(i, m.index));
    i = TAG.lastIndex;

    const closing = m[1] === '/';
    const name = m[2].toLowerCase();

    if (skipUntil) {
      if (closing && name === skipUntil) skipUntil = null;
      continue;
    }
    if (!closing && DROP_SUBTREE.has(name)) {
      skipUntil = name;
      continue;
    }

    const tag = ALLOWED.get(name);
    if (!tag) continue; // unknown tag: drop the markup, keep the text

    if (VOID.has(tag)) {
      if (!closing) out.push(`<${tag}>`);
      continue;
    }

    if (!closing) {
      out.push(`<${tag}>`);
      open.push(tag);
      continue;
    }

    // Close back to the matching opener; a stray closer is ignored.
    const at = open.lastIndexOf(tag);
    if (at === -1) continue;
    for (let d = open.length - 1; d >= at; d--) out.push(`</${open[d]}>`);
    open.length = at;
  }
  text(html.slice(i));

  for (let d = open.length - 1; d >= 0; d--) out.push(`</${open[d]}>`); // never leave it unbalanced
  return out.join('');
}

// "Has the user actually written anything?" — tags and blank space don't count.
export const isEmptyHtml = (html) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|\s/g, '')
    .length === 0;
