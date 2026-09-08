// Runs test/browser/check.html in headless Chrome and reports its assertions.
// Separate from `npm test` because it needs a real browser; run it before
// shipping anything that touches the details sheet or rendering.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const { default: startServer } = await import('./serve.mjs');
const { server, port } = await startServer(0);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chrome or Chromium found — skipping the browser check.');
  server.close();
  process.exit(0);
}

const profile = join(tmpdir(), `todo-check-${process.pid}`);
const dom = await new Promise((resolve, reject) => {
  const child = spawn(chrome, [
    '--headless=new', '--disable-gpu', `--user-data-dir=${profile}`,
    '--virtual-time-budget=9000', '--dump-dom',
    `http://localhost:${port}/test/browser/check.html`,
  ], { stdio: ['ignore', 'pipe', 'ignore'] });

  let buf = '';
  child.stdout.on('data', (c) => { buf += c; });
  // Chrome sometimes lingers after --dump-dom has written its output.
  const done = () => { child.kill('SIGKILL'); resolve(buf); };
  child.stdout.on('end', done);
  const timer = setTimeout(done, 45_000);
  child.on('error', (e) => { clearTimeout(timer); reject(e); });
});

server.close();
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
const failed = results.split('\n').filter((l) => l.startsWith('FAIL'));
console.log(`\n${results.split('\n').length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
