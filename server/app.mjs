import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createTransport } from './transport.mjs';

const publicRoot = new URL('../', import.meta.url);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

// Keep implementation, tests, git metadata and deployment files off the public origin.
// All public paths are single filenames in known directories; no filesystem joins from input.
export function createApplication() {
  return createTransport({ fallback: async (req, res) => {
    const send = (status, body, type = 'text/plain; charset=utf-8') => {
      res.writeHead(status, { 'Content-Type': type });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      return send(405, 'Method not allowed');
    }
    let path;
    try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
    catch { return send(400, 'Invalid path'); }
    if (path === '/healthz') return send(200, '{"status":"ok"}', 'application/json');
    if (path === '/') path = '/index.html';
    if (!/^\/(?:index\.html|styles\.css|engine\.js|multiplayer\.js|persistence\.js|sw\.js|js\/[a-z0-9-]+\.js|assets\/[a-z0-9-]+\.(?:svg|webp|json))$/.test(path)) {
      return send(404, 'Not found');
    }
    let data;
    try { data = await readFile(new URL('.' + path, publicRoot)); }
    catch (error) {
      if (['ENOENT', 'ENOTDIR'].includes(error.code)) return send(404, 'Not found');
      throw error;
    }
    res.setHeader('Cache-Control', 'no-cache');
    return send(200, data, types[path.slice(path.lastIndexOf('.'))]);
  } });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(pathToFileURL(process.argv[1]))) {
  const port = Number(process.env.PORT || 8787);
  const host = process.env.HOST || '0.0.0.0';
  const server = createApplication();
  server.listen(port, host, () => console.log('Crown & Kingdoms listening on port ' + port));
  // Single-process room state is intentionally ephemeral; stop accepting requests on shutdown.
  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 10_000).unref();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
