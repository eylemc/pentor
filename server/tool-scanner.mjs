import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const port = Number(process.env.PORT || 3100);
const token = process.env.SCANNER_TOKEN || '';
const allowedDomains = new Set((process.env.SCAN_ALLOWLIST || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean));
const maxBodyBytes = 32_768;

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
  res.end(body);
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > maxBodyBytes) throw new Error('PAYLOAD_TOO_LARGE');
  }
  return JSON.parse(raw || '{}');
}

function authenticated(req) {
  const supplied = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token || supplied.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(token));
}

function validTarget(raw, domain) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && (url.hostname === domain || url.hostname === `www.${domain}` || `www.${url.hostname}` === domain);
  } catch {
    return false;
  }
}

export function sqlmapArgs(target, outputDir) {
  return [
    '/opt/sqlmap/sqlmap.py', '-u', target, '--batch', '--disable-coloring', '--flush-session',
    '--output-dir', outputDir, '--risk=1', '--level=2', '--threads=1', '--timeout=8', '--retries=0',
    '--delay=0.25', '--technique=BEU', '--smart', '--skip-waf', '--parse-errors', '--answers=quit=N',
  ];
}

export function nmapArgs(domain) {
  return [
    '-sT', '-sV', '--version-light', '-Pn', '-T3', '--max-retries', '1', '--host-timeout', '60s',
    '-p', '1433,1521,27017,3306,5432,6379,9200', '--script', 'safe and (mysql-* or ms-sql-* or mongodb-* or redis-* or pgsql-*)',
    '--script-timeout', '15s', '-oG', '-', domain,
  ];
}

function run(command, args, timeoutMs, signal) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env: { PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin' } });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
    const cancel = () => child.kill('SIGTERM');
    signal?.addEventListener('abort', cancel, { once: true });
    child.stdout.on('data', (data) => { if (stdout.length < 1_000_000) stdout += data.toString(); });
    child.stderr.on('data', (data) => { if (stderr.length < 100_000) stderr += data.toString(); });
    child.once('error', reject);
    child.once('close', (code) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      resolve({ code, timedOut, stdout, stderr: stderr.slice(-2_000) });
    });
  });
}

async function scan(body) {
  const domain = String(body.domain || '').toLowerCase();
  const tier = body.tier === 'advanced' ? 'advanced' : body.tier === 'pro' ? 'pro' : null;
  if (!tier || !allowedDomains.has(domain)) throw new Error('TARGET_NOT_ALLOWED');
  const targets = [...new Set((Array.isArray(body.targets) ? body.targets : []).filter((target) => validTarget(target, domain)))];
  const sqlTargets = targets.slice(0, 3);
  const job = randomUUID();
  const sqlmapPromise = Promise.all(sqlTargets.map(async (target, index) => {
    const result = await run('python3', sqlmapArgs(target, `/tmp/sqlmap/${job}-${index}`), tier === 'advanced' ? 120_000 : 60_000);
    return {
      target: new URL(target).pathname,
      vulnerable: /parameter\s+['"`].+?['"`]\s+is vulnerable|identified the following injection point/i.test(result.stdout),
      timedOut: result.timedOut,
      completed: result.code === 0 || result.timedOut,
    };
  }));
  const nmapPromise = (async () => {
    const result = await run('nmap', nmapArgs(domain), 75_000);
    const ports = [...result.stdout.matchAll(/Ports:\s+([^\n]+)/g)].flatMap((match) => match[1].split(',')).filter((item) => /\/open\//.test(item)).map((item) => item.trim());
    return { completed: result.code === 0 || result.timedOut, timedOut: result.timedOut, openDatabaseServices: ports.slice(0, 20) };
  })();
  const [sqlmap, nmap] = await Promise.all([sqlmapPromise, nmapPromise]);
  return { profile: tier, sqlmap, nmap, restrictions: ['detection-only', 'no data extraction', 'no brute force', 'no OS takeover'] };
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/healthz') return send(res, 200, { ok: true, service: 'pentor-scanner' });
    if (req.method !== 'POST' || req.url !== '/scan') return send(res, 404, { error: 'Not found' });
    if (!authenticated(req)) return send(res, 401, { error: 'Unauthorized' });
    return send(res, 200, await scan(await readJson(req)));
  } catch (error) {
    return send(res, error.message === 'TARGET_NOT_ALLOWED' ? 403 : 400, { error: error.message || 'Scanner failed' });
  }
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(port, '0.0.0.0', () => console.log(`Pentor scanner listening on ${port}`));
}
