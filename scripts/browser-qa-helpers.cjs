// Shared local browser-QA utilities. No build or deployment operations.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const mime = {'.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.map': 'application/json', '.svg': 'image/svg+xml'};
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const errorText = error => error?.stack || String(error);

async function startStaticServer(directory) {
  const root = path.resolve(directory);
  const text = await fs.readFile(path.join(root, '_headers'), 'utf8').catch(() => '');
  const rules = [];
  for (const line of text.split(/\r?\n/)) {
    if (/^\//.test(line)) rules.push({pattern: line.trim(), headers: {}});
    else if (/^\s+[^:]+:/.test(line) && rules.length) {
      const at = line.indexOf(':'); rules.at(-1).headers[line.slice(0, at).trim()] = line.slice(at + 1).trim();
    }
  }
  const requests = [];
  const server = http.createServer(async (request, response) => {
    let status = 200;
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep) && file !== root) { status = 403; response.writeHead(status).end(); return; }
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const body = await fs.readFile(file);
      const headers = {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'};
      for (const rule of rules) {
        if (rule.pattern === pathname || (rule.pattern.endsWith('*') && pathname.startsWith(rule.pattern.slice(0, -1)))) {
          Object.assign(headers, rule.headers);
        }
      }
      response.writeHead(status, headers); response.end(body);
    } catch { status = 404; response.writeHead(status).end(); }
    finally { requests.push({method: request.method, path: request.url, status}); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return {url: `http://127.0.0.1:${server.address().port}/`, requests, headerRules: rules,
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }};
}

async function prepareEvidence(directory) {
  await fs.mkdir(directory, {recursive: true});
  try { await fs.access(path.join(directory, 'results.json')); throw new Error(`Evidence already exists: ${directory}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
async function saveEvidence(directory, result) {
  result.updatedAt = new Date().toISOString();
  // Compact JSON intentionally avoids repeating huge trees as thousands of lines.
  await fs.writeFile(path.join(directory, 'results.json'), JSON.stringify(result) + '\n');
}
module.exports = {startStaticServer, prepareEvidence, saveEvidence, sha256, errorText};
