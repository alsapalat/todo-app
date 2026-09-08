// Runs test/browser/check.html against a real Vite dev server in headless
// Chrome. Kept out of `npm test` because it needs a browser; run it before
// shipping anything that touches the details sheet, the store or rendering.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chrome or Chromium found — skipping the browser check.');
  process.exit(0);
}

const server = await createServer({
  logLevel: 'error',
  server: { port: 0, host: '127.0.0.1' },
});
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, '');

const profile = join(tmpdir(), `todo-check-${process.pid}`);
const dom = await new Promise((resolve, reject) => {
  const child = spawn(chrome, [
    '--headless=new', '--disable-gpu', `--user-data-dir=${profile}`,
    '--virtual-time-budget=9000', '--dump-dom',
    `${base}/test/browser/check.html`,
  ], { stdio: ['ignore', 'pipe', 'ignore'] });

  let buf = '';
  child.stdout.on('data', (c) => { buf += c; });
  // Chrome sometimes lingers after --dump-dom has written its output.
  const finish = () => { child.kill('SIGKILL'); resolve(buf); };
  child.stdout.on('end', finish);
  const timer = setTimeout(finish, 45_000);
  child.on('error', (e) => { clearTimeout(timer); reject(e); });
});

await server.close();
await rm(profile, { recursive: true, force: true });

const match = dom.match(/<pre id="result">([\s\S]*?)<\/pre>/);
if (!match) {
  console.error('Could not read the check results from the page.');
  process.exit(1);
}

const results = match[1]
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .trim();

console.log(results);
const lines = results.split('\n');
const failed = lines.filter((l) => l.startsWith('FAIL'));
console.log(`\n${lines.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
