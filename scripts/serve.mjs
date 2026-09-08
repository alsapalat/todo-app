// Minimal static file server so `npm run dev` needs no dependencies.
// Also imported by scripts/check-browser.mjs to serve the app under test.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

// Port 0 asks the OS for a free one; the resolved port comes back in the result.
export default function startServer(port = 3000) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const rel = normalize(path === '/' ? '/index.html' : path).replace(/^(\.\.[/\\])+/, '');
    try {
      const body = await readFile(join(root, rel));
      res.writeHead(200, {
        'content-type': TYPES[extname(rel)] ?? 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found');
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => resolve({ server, port: server.address().port }));
  });
}

// Only listen on the CLI port when run directly, not when imported.
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const port = Number(process.argv[2] ?? process.env.PORT ?? 3000);
  const started = await startServer(port);
  console.log(`todo-app on http://localhost:${started.port}`);
}
