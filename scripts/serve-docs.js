#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const PORT = process.env.PORT || 4000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

function safeJoin(base, target) {
  const targetPath = path.posix.normalize('/' + target.replace(/\\/g, '/'));
  return path.join(base, targetPath);
}

async function handler(req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    let rel = url.pathname;
    if (rel === '/') rel = '/index.html';
    const filePath = safeJoin(DIST, rel);
    if (!filePath.startsWith(DIST)) {
      res.writeHead(400); res.end('Bad request'); return;
    }
    const stat = await fsp.stat(filePath).catch(() => null);
    if (!stat || !stat.isFile()) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    res.writeHead(500); res.end('Server error');
  }
}

http.createServer(handler).listen(PORT, () => {
  console.log(`Serving dist/ at http://localhost:${PORT}`);
});

