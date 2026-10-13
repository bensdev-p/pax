// Serves the web export (apps/mobile/dist) with clean URLs (/today → today.html), for checking
// screens in a browser or with Playwright. Usage, from the repo root:
//   node scripts/serve-web.mjs [dir] [port]
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'apps/mobile/dist');
const port = Number(process.argv[3] ?? 8081);
const TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.db': 'application/octet-stream',
};

const isFile = (p) => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};

createServer((req, res) => {
  const path = join(root, decodeURIComponent((req.url ?? '/').split('?')[0]));
  const hit = [path, `${path}.html`, join(path, 'index.html')].find(isFile);
  if (!hit) {
    res.writeHead(404, { 'content-type': 'text/html' });
    res.end(readFileSync(join(root, '+not-found.html')));
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(hit)] ?? 'application/octet-stream' });
  createReadStream(hit).pipe(res);
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
