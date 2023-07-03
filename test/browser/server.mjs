/* eslint-disable strict */
import url from 'node:url';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { on } from 'node:events';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const index_html = path.join(__dirname, 'index.html');
const index_js = path.join(__dirname, 'index.mjs');
const lib = path.resolve(__dirname, '..', '..', 'lib');

const server = http.createServer();
server.addListener('listening', () => {
  console.log(`listening: ${JSON.stringify(server.address())}`);
});
server.listen(8080, '127.0.0.1');

for await (const ev of on(server, 'request')) {
  /** @type {IncomingMessage} */
  const req = ev[0];
  /** @type {ServerResponse} */
  const res = ev[1];

  res.setHeader('Content-Security-Policy', "script-src 'self';");

  if (req.url === '/' || req.url === '/index.html') {
    res.setHeader('content-type', 'text/html');
    res.end(await fs.readFile(index_html, { encoding: 'utf8' }));
    continue;
  }

  if (req.url === '/index.mjs') {
    res.setHeader('content-type', 'text/javascript');
    res.end(await fs.readFile(index_js, { encoding: 'utf8' }));
    continue;
  }

  if (req.url === '/bson.mjs') {
    res.setHeader('content-type', 'text/javascript');
    res.end(await fs.readFile(path.join(lib, 'bson.mjs'), { encoding: 'utf8' }));
    continue;
  }

  if (req.url === '/bson.mjs.map') {
    res.setHeader('content-type', 'text/json');
    res.end(await fs.readFile(path.join(lib, 'bson.mjs.map'), { encoding: 'utf8' }));
    continue;
  }

  res.statusCode = 404;
  res.end('');
}
