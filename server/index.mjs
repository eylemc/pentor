import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { resolveCaa, resolveMx, resolveTxt } from 'node:dns/promises';
import { connect as tlsConnect } from 'node:tls';
import { isIP } from 'node:net';
import { spawn } from 'node:child_process';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const port = Number(process.env.PORT || 3000);
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((v) => v.trim()).filter(Boolean);
const verifications = new Map();
const scans = new Map();
const cacheDir = process.env.SCAN_CACHE_DIR || '/app/data/scan-cache';
const cacheTtlMs = Number(process.env.SCAN_CACHE_TTL_MS || 24 * 60 * 60_000);
const reportCacheVersion = 'reports-v3';
const advancedCheckpointVersion = 'advanced-checkpoints-v2';
const scanAllowlist = new Set((process.env.SCAN_ALLOWLIST || 'liqheat.com,www.liqheat.com').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean));

const phases = [
  'Preparing authorized target',
  'Checking public exposure',
  'Reviewing web security configuration',
  'Analyzing detected risks',
  'Preparing report',
];

function normalizeDomain(input) {
  if (typeof input !== 'string' || !input.trim()) return null;
  let value = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  value = value.split('/')[0].split('?')[0].split('#')[0].split(':')[0];
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) return null;
  return /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/i.test(value) ? value : null;
}

function originAllowed(origin) {
  if (!origin) return true;
  try {
    const host = new URL(origin).hostname;
    return allowedOrigins.includes(origin) || host === 'localhost' || host.endsWith('.bolt.host') || host.endsWith('.bolt.new');
  } catch {
    return false;
  }
}

function send(res, status, payload, origin) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...(originAllowed(origin) && origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32_768) throw new Error('PAYLOAD_TOO_LARGE');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function isPublicAddress(address) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)));
  }
  if (isIP(address) === 6) {
    const value = address.toLowerCase();
    return !(value === '::' || value === '::1' || value.startsWith('fc') || value.startsWith('fd') || value.startsWith('fe8') ||
      value.startsWith('fe9') || value.startsWith('fea') || value.startsWith('feb') || value.startsWith('::ffff:127.') ||
      value.startsWith('::ffff:10.') || value.startsWith('::ffff:192.168.'));
  }
  return false;
}

async function assertPublicHost(hostname) {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new Error('Target resolved to a prohibited network address.');
  }
  return addresses.map(({ address }) => address);
}

function sameSiteRedirect(from, to, domain) {
  const allowed = new Set([domain, `www.${domain}`]);
  return allowed.has(from.hostname) && allowed.has(to.hostname) && ['http:', 'https:'].includes(to.protocol);
}

async function safeFetch(input, domain, init = {}) {
  let current = new URL(input);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    await assertPublicHost(current.hostname);
    const response = await fetch(current, {
      ...init,
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      headers: {
        'User-Agent': 'Pentor-SafeScan/1.0 (+https://pentor.net)',
        Accept: 'text/html,application/json;q=0.8,*/*;q=0.5',
        ...(init.headers || {}),
      },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (!location) return response;
      const next = new URL(location, current);
      if (!sameSiteRedirect(current, next, domain)) throw new Error('Target redirected outside the authorized domain.');
      current = next;
      continue;
    }
    return response;
  }
  throw new Error('Too many redirects.');
}

async function readLimitedText(response, maxBytes = 65_536) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (size + value.byteLength > maxBytes) {
        const remaining = maxBytes - size;
        if (remaining > 0) chunks.push(value.slice(0, remaining));
        size = maxBytes;
        await reader.cancel();
        break;
      }
      size += value.byteLength;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const merged = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

function inspectCertificate(domain) {
  return new Promise((resolve, reject) => {
    const socket = tlsConnect({ host: domain, port: 443, servername: domain, rejectUnauthorized: true, timeout: 8_000 }, () => {
      const cert = socket.getPeerCertificate();
      const protocol = socket.getProtocol();
      socket.end();
      resolve({ validTo: cert.valid_to, issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown', protocol });
    });
    socket.once('timeout', () => socket.destroy(new Error('TLS connection timed out.')));
    socket.once('error', reject);
  });
}

function finding(id, title, severity, area, observed, impact, recommendation, category, passed = false) {
  return {
    id, title, severity, confidence: 'High', affectedArea: area, observed, impact, recommendation,
    references: ['Pentor Free Scan v1'], detectedAt: new Date().toISOString(), status: passed ? 'fixed' : 'open', category,
  };
}

function detectPlatform(headers) {
  const server = headers.get('server') || '';
  if (/cloudflare/i.test(server) || headers.has('cf-ray')) return { name: 'Cloudflare', confidence: 'High', evidence: headers.has('cf-ray') ? 'CF-Ray response header' : `Server: ${server}` };
  if (headers.has('x-vercel-id') || /vercel/i.test(server)) return { name: 'Vercel', confidence: 'High', evidence: headers.has('x-vercel-id') ? 'X-Vercel-Id response header' : `Server: ${server}` };
  if (headers.has('x-nf-request-id') || /netlify/i.test(server)) return { name: 'Netlify', confidence: 'High', evidence: headers.has('x-nf-request-id') ? 'X-Nf-Request-Id response header' : `Server: ${server}` };
  if (/nginx/i.test(server)) return { name: 'Nginx', confidence: 'High', evidence: `Server: ${server}` };
  if (/apache/i.test(server)) return { name: 'Apache', confidence: 'High', evidence: `Server: ${server}` };
  if (/caddy/i.test(server)) return { name: 'Caddy', confidence: 'High', evidence: `Server: ${server}` };
  return { name: 'Unknown web platform', confidence: 'Low', evidence: server ? `Unrecognized Server header: ${server}` : 'No identifying response header was exposed' };
}

function headerFix(platform, header, value, note = '') {
  const deploymentHeader = header === 'content-security-policy' ? 'content-security-policy-report-only' : header;
  const cspPromotion = header === 'content-security-policy'
    ? '\n7. Review browser CSP violation reports, adjust required sources, then promote the tested policy from Content-Security-Policy-Report-Only to Content-Security-Policy.'
    : '';
  const verify = `Verify with: curl -I https://YOUR-DOMAIN | grep -i '^${deploymentHeader}:'\nThen rerun Pentor after promoting any report-only policy.`;
  const caution = note ? `\nImportant: ${note}` : '';
  if (platform.name === 'Cloudflare') return [
    `Detected delivery platform: Cloudflare (${platform.confidence} confidence).`,
    '1. Open Cloudflare Dashboard and select the domain.',
    '2. Go to Rules → Transform Rules → Modify Response Header.',
    '3. Create a response-header rule and apply it to all incoming requests.',
    `4. Choose “Set static” and set ${deploymentHeader} to: ${value}`,
    '5. Save and deploy the rule. Purge the affected cached URL if the old response remains.',
    `6. ${verify}${caution}${cspPromotion}`,
    'If Cloudflare only fronts another host, you may instead set the header at the origin; do not configure conflicting values in both places.',
  ].join('\n');
  if (platform.name === 'Netlify') return [
    `Detected platform: Netlify (${platform.confidence} confidence).`,
    '1. Open or create a public/_headers file in the deployed project.',
    '2. Add a rule for all paths:',
    `   /*\n     ${deploymentHeader}: ${value}`,
    '3. Commit and redeploy the site.',
    `4. ${verify}${caution}${cspPromotion}`,
  ].join('\n');
  if (platform.name === 'Vercel') return [
    `Detected platform: Vercel (${platform.confidence} confidence).`,
    '1. Open vercel.json in the project root.',
    `2. Add ${deploymentHeader}: ${value} under a headers rule whose source is /(.*).`,
    '3. Validate the JSON, commit, and redeploy.',
    `4. ${verify}${caution}${cspPromotion}`,
  ].join('\n');
  if (platform.name === 'Nginx') return [
    `Detected web server: Nginx (${platform.confidence} confidence).`,
    '1. Open the active server block for the HTTPS virtual host.',
    `2. Add: add_header ${deploymentHeader} "${value}" always;`,
    '3. Run: sudo nginx -t',
    '4. If validation succeeds, run: sudo systemctl reload nginx',
    `5. ${verify}${caution}${cspPromotion}`,
  ].join('\n');
  if (platform.name === 'Apache') return [
    `Detected web server: Apache (${platform.confidence} confidence).`,
    '1. Ensure mod_headers is enabled: sudo a2enmod headers',
    `2. In the HTTPS VirtualHost add: Header always set ${deploymentHeader} "${value}"`,
    '3. Run: sudo apachectl configtest',
    '4. If validation succeeds, run: sudo systemctl reload apache2',
    `5. ${verify}${caution}${cspPromotion}`,
  ].join('\n');
  if (platform.name === 'Caddy') return [
    `Detected web server: Caddy (${platform.confidence} confidence).`,
    '1. Open the relevant site block in Caddyfile.',
    `2. Add: header ${deploymentHeader} "${value}"`,
    '3. Run: caddy validate --config /etc/caddy/Caddyfile',
    '4. Reload Caddy using your service or container deployment method.',
    `5. ${verify}${caution}${cspPromotion}`,
  ].join('\n');
  return [
    'Pentor could not reliably identify the origin web server.',
    `1. Configure the application, CDN, or reverse proxy to return: ${deploymentHeader}: ${value}`,
    '2. Apply the change first in staging when possible.',
    `3. ${verify}${caution}${cspPromotion}`,
    `Detection evidence: ${platform.evidence}.`,
  ].join('\n');
}

async function runSafeScan(domain) {
  const findings = [];
  const addresses = await assertPublicHost(domain);
  const tls = await inspectCertificate(domain);
  const main = await safeFetch(`https://${domain}/`, domain);
  const headers = main.headers;
  const status = main.status;
  const platform = detectPlatform(headers);
  await main.body?.cancel();

  findings.push(finding('WEB-001', 'HTTPS endpoint reachable', 'passed', 'Transport security',
    `The authorized target returned HTTP ${status} over HTTPS. Resolved public addresses: ${addresses.join(', ')}.`,
    'HTTPS protects traffic in transit.', 'Maintain HTTPS and certificate renewal.', 'Security headers and TLS', true));

  const expiry = new Date(tls.validTo);
  const days = Math.floor((expiry.getTime() - Date.now()) / 86_400_000);
  findings.push(finding('TLS-001', days < 30 ? 'TLS certificate expires soon' : 'TLS certificate is valid', days < 30 ? 'medium' : 'passed',
    'TLS certificate', `Certificate issuer: ${tls.issuer}; protocol: ${tls.protocol}; expires in approximately ${days} days.`,
    days < 30 ? 'An expired certificate will block or warn visitors.' : 'A valid certificate protects encrypted connections.',
    days < 30 ? 'Renew the certificate and verify automated renewal.' : 'Continue monitoring certificate renewal.', 'Security headers and TLS', days >= 30));

  const headerChecks = [
    ['HDR-001', 'content-security-policy', 'Content Security Policy', 'medium', 'CSP reduces the impact of script and content injection.', "default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'", 'Test CSP in Content-Security-Policy-Report-Only mode first. A policy copied without testing can break scripts, payments, analytics, or authentication.'],
    ['HDR-002', 'strict-transport-security', 'HTTP Strict Transport Security', 'low', 'HSTS tells browsers to continue using HTTPS.', 'max-age=31536000; includeSubDomains', 'Only add includeSubDomains after confirming every subdomain supports HTTPS.'],
    ['HDR-003', 'x-content-type-options', 'MIME sniffing protection', 'low', 'nosniff reduces browser content-type confusion.', 'nosniff', ''],
    ['HDR-004', 'referrer-policy', 'Referrer Policy', 'low', 'A referrer policy limits URL information shared with other sites.', 'strict-origin-when-cross-origin', 'Confirm that analytics and referral attribution still behave as intended.'],
    ['HDR-005', 'permissions-policy', 'Permissions Policy', 'low', 'Permissions Policy limits access to sensitive browser capabilities.', 'camera=(), microphone=(), geolocation=()', 'Allow a capability only if the application genuinely needs it.'],
  ];
  for (const [id, name, title, severity, impact, valueToSet, note] of headerChecks) {
    const value = headers.get(name);
    findings.push(finding(id, value ? `${title} configured` : `${title} missing`, value ? 'passed' : severity,
      'HTTP response headers', value ? `${name}: ${value}` : `No ${name} header was returned by the main HTTPS response. Platform fingerprint: ${platform.name} (${platform.confidence} confidence; ${platform.evidence}).`,
      impact, value ? 'Maintain and periodically review this policy.' : headerFix(platform, name, valueToSet, note), 'Security headers and TLS', Boolean(value)));
  }

  const frameProtected = Boolean(headers.get('x-frame-options')) || /frame-ancestors/i.test(headers.get('content-security-policy') || '');
  findings.push(finding('HDR-006', frameProtected ? 'Frame embedding protection configured' : 'Frame embedding protection missing',
    frameProtected ? 'passed' : 'low', 'HTTP response headers', frameProtected
      ? 'X-Frame-Options or CSP frame-ancestors protection was detected.'
      : 'Neither X-Frame-Options nor a CSP frame-ancestors directive was detected.',
    'Frame protection helps prevent clickjacking.', frameProtected ? 'Maintain the current protection.' : headerFix(platform, 'x-frame-options', 'DENY', 'If legitimate pages must be embedded on the same origin, use SAMEORIGIN or a carefully tested CSP frame-ancestors policy instead.'),
    'Security headers and TLS', frameProtected));

  const serverHeader = headers.get('server');
  if (serverHeader) findings.push(finding('INF-001', 'Server software disclosed', 'low', 'HTTP response headers',
    `The Server header returned: ${serverHeader}`, 'Software disclosure can help attackers focus reconnaissance.',
    'Suppress unnecessary product and version details where practical.', 'Information exposure'));
  else findings.push(finding('INF-001', 'Server version disclosure minimized', 'passed', 'HTTP response headers',
    'No Server header was returned.', 'Reduced disclosure provides less reconnaissance data.', 'No action required.', 'Information exposure', true));

  const cookies = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : (headers.get('set-cookie') ? [headers.get('set-cookie')] : []);
  if (cookies.length) {
    const insecure = cookies.filter((cookie) => !/;\s*secure/i.test(cookie) || !/;\s*httponly/i.test(cookie) || !/;\s*samesite=/i.test(cookie));
    findings.push(finding('SES-001', insecure.length ? 'Cookie security attributes incomplete' : 'Cookie security attributes configured',
      insecure.length ? 'medium' : 'passed', 'Response cookies', `${cookies.length} cookie header(s) observed; ${insecure.length} lacked one or more of Secure, HttpOnly, or SameSite.`,
      'Cookie attributes help reduce session theft and cross-site request risks.', insecure.length
        ? 'Review session cookies and apply Secure, HttpOnly, and an appropriate SameSite value.' : 'Maintain the current cookie settings.',
      'Authentication and session risks', insecure.length === 0));
  }

  const cors = await safeFetch(`https://${domain}/`, domain, { headers: { Origin: 'https://pentor-invalid.example' } });
  const acao = cors.headers.get('access-control-allow-origin');
  const acac = cors.headers.get('access-control-allow-credentials');
  await cors.body?.cancel();
  const unsafeCors = acao === '*' && acac?.toLowerCase() === 'true';
  findings.push(finding('CORS-001', unsafeCors ? 'Potentially unsafe CORS response' : 'No obvious credentialed wildcard CORS',
    unsafeCors ? 'high' : 'passed', 'Cross-origin policy', `Access-Control-Allow-Origin: ${acao || 'not returned'}; credentials: ${acac || 'not returned'}.`,
    'Overly broad credentialed CORS can expose authenticated data cross-origin.', unsafeCors
      ? 'Do not combine wildcard origins with credentialed cross-origin access.' : 'Continue restricting trusted origins explicitly.',
    'Web application exposure', !unsafeCors));

  for (const [id, path, title] of [['FILE-001', '/.well-known/security.txt', 'security.txt'], ['FILE-002', '/robots.txt', 'robots.txt']]) {
    const response = await safeFetch(`https://${domain}${path}`, domain);
    const contentType = response.headers.get('content-type') || '';
    const body = response.ok ? await readLimitedText(response) : '';
    if (!response.ok) await response.body?.cancel();
    const hasExpectedContent = title === 'security.txt'
      ? /(^|\n)\s*Contact\s*:/i.test(body)
      : /(^|\n)\s*User-agent\s*:/i.test(body);
    const exists = response.ok && !contentType.toLowerCase().includes('text/html') && hasExpectedContent;
    findings.push(finding(id, exists ? `${title} is published` : `${title} not found`, exists ? 'passed' : 'info',
      path, `The path returned HTTP ${response.status} with content type ${contentType || 'unspecified'}; expected ${title} directives were ${hasExpectedContent ? 'found' : 'not found'}.`, `${title} can provide useful public guidance.`,
      exists ? 'Review it periodically.' : `Consider publishing ${title} if appropriate.`, 'Public metadata', exists));
  }

  const weights = { critical: 30, high: 18, medium: 8, low: 3, info: 0, passed: 0 };
  const score = Math.max(0, 100 - findings.reduce((sum, item) => sum + weights[item.severity], 0));
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, passed: 0 };
  for (const item of findings) if (item.severity in severityCounts) severityCounts[item.severity] += 1;
  return {
    domain, score, severityCounts, findings, generatedAt: new Date().toISOString(), tier: 'Free Scan',
    summary: `Pentor Free Scan v1 performed ${findings.length} controlled DNS, TLS, HTTP header, cookie, CORS, and public-metadata checks against ${domain}.`,
  };
}

async function dnsOrEmpty(fn) {
  try { return await fn(); } catch { return []; }
}

function recalculateReport(report, tier) {
  const weights = { critical: 30, high: 18, medium: 8, low: 3, info: 0, passed: 0 };
  report.score = Math.max(0, 100 - report.findings.reduce((sum, item) => sum + (weights[item.severity] || 0), 0));
  report.severityCounts = { critical: 0, high: 0, medium: 0, low: 0, passed: 0 };
  for (const item of report.findings) if (item.severity in report.severityCounts) report.severityCounts[item.severity] += 1;
  report.tier = tier;
  report.summary = `Pentor ${tier} performed ${report.findings.length} controlled checks against ${report.domain}.`;
  return report;
}

async function runProScan(domain) {
  const report = await runSafeScan(domain);
  const response = await safeFetch(`https://${domain}/`, domain);
  const platform = detectPlatform(response.headers);
  await response.body?.cancel();
  report.findings.push(finding('TECH-001', `${platform.name} delivery platform detected`, 'info', 'Technology fingerprint',
    `${platform.name} was identified with ${platform.confidence.toLowerCase()} confidence. Evidence: ${platform.evidence}.`,
    'Technology identification allows Pentor to provide implementation-specific remediation.',
    'Review this fingerprint if the application architecture changes.', 'Technology fingerprint'));

  const apex = domain.replace(/^www\./, '');
  const [mx, txt, dmarc, caa] = await Promise.all([
    dnsOrEmpty(() => resolveMx(apex)),
    dnsOrEmpty(() => resolveTxt(apex)),
    dnsOrEmpty(() => resolveTxt(`_dmarc.${apex}`)),
    dnsOrEmpty(() => resolveCaa(apex)),
  ]);
  const flatTxt = txt.flat().join(' ');
  const flatDmarc = dmarc.flat().join(' ');
  const hasSpf = /v=spf1/i.test(flatTxt);
  const hasDmarc = /v=dmarc1/i.test(flatDmarc);
  report.findings.push(finding('DNS-EMAIL-001', hasSpf ? 'SPF record published' : 'SPF record not detected', hasSpf ? 'passed' : 'low',
    'Email authentication', hasSpf ? 'A v=spf1 TXT record was detected.' : 'No v=spf1 TXT record was detected on the apex domain.',
    'SPF identifies mail servers authorized to send for the domain.', hasSpf ? 'Review authorized senders periodically.' :
      '1. Inventory every legitimate email sender.\n2. Publish one SPF TXT record at the apex domain.\n3. Start with a soft-fail policy while validating.\n4. Avoid multiple SPF records and keep DNS lookups within the SPF limit.\n5. Test mail delivery before moving to a hard-fail policy.',
    'Domain and email security', hasSpf));
  report.findings.push(finding('DNS-EMAIL-002', hasDmarc ? 'DMARC record published' : 'DMARC record not detected', hasDmarc ? 'passed' : 'medium',
    'Email authentication', hasDmarc ? `DMARC policy detected: ${flatDmarc}` : 'No v=DMARC1 TXT record was detected at _dmarc.',
    'DMARC helps prevent spoofed email using the domain.', hasDmarc ? 'Review aggregate reports and strengthen the policy when ready.' :
      '1. Confirm SPF and DKIM alignment for legitimate senders.\n2. Create a TXT record at _dmarc with an initial monitoring policy such as v=DMARC1; p=none; rua=mailto:YOUR-REPORT-ADDRESS.\n3. Review aggregate reports.\n4. Fix unauthenticated senders.\n5. Gradually move to quarantine and then reject.',
    'Domain and email security', hasDmarc));
  report.findings.push(finding('DNS-CAA-001', caa.length ? 'CAA records published' : 'CAA record not detected', caa.length ? 'passed' : 'info',
    'Certificate authority controls', caa.length ? `${caa.length} CAA record(s) were detected.` : 'No CAA record was detected.',
    'CAA can restrict which certificate authorities may issue certificates for the domain.', caa.length ? 'Review allowed certificate authorities periodically.' :
      'Identify the certificate authorities used by the site, then publish appropriate CAA issue and issuewild records through the DNS provider.',
    'Domain and DNS security signals', caa.length > 0));
  report.findings.push(finding('DNS-MX-001', mx.length ? 'Mail exchangers detected' : 'No mail exchanger detected', mx.length ? 'passed' : 'info',
    'Mail routing', mx.length ? `${mx.length} MX record(s) were detected.` : 'No MX record was detected for the apex domain.',
    'MX records are required only when the domain receives email.', mx.length ? 'No action required.' : 'If the domain should receive email, configure MX records with the email provider.',
    'Domain and email security', mx.length > 0));
  return recalculateReport(report, 'Pro Scan');
}

function cachePath(domain, tier) {
  return join(cacheDir, `${domain.replace(/[^a-z0-9.-]/g, '_')}--${tier}.json`);
}

async function readCachedReport(domain, tier) {
  try {
    const entry = JSON.parse(await readFile(cachePath(domain, tier), 'utf8'));
    if (entry.version !== reportCacheVersion || !entry.cachedAt || Date.now() - new Date(entry.cachedAt).getTime() > cacheTtlMs) return null;
    return entry;
  } catch {
    return null;
  }
}

async function writeCachedReport(domain, tier, report) {
  await mkdir(cacheDir, { recursive: true });
  const cachedAt = new Date().toISOString();
  await writeJsonAtomic(cachePath(domain, tier), { version: reportCacheVersion, cachedAt, report });
  return cachedAt;
}

function checkpointPath(domain) {
  return join(cacheDir, `${domain.replace(/[^a-z0-9.-]/g, '_')}--advanced-checkpoints.json`);
}

async function writeJsonAtomic(path, value) {
  await mkdir(cacheDir, { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(value), { mode: 0o600 });
  await rename(temporary, path);
}

async function readAdvancedCheckpoints(domain, bypassCache) {
  if (bypassCache) return { version: advancedCheckpointVersion, updatedAt: null, stages: {} };
  try {
    const checkpoint = JSON.parse(await readFile(checkpointPath(domain), 'utf8'));
    const age = Date.now() - new Date(checkpoint.updatedAt).getTime();
    if (checkpoint.version !== advancedCheckpointVersion || !checkpoint.updatedAt || age > cacheTtlMs) throw new Error('stale');
    return checkpoint;
  } catch {
    return { version: advancedCheckpointVersion, updatedAt: null, stages: {} };
  }
}

async function saveAdvancedCheckpoint(domain, checkpoint, stage, value) {
  try {
    checkpoint.stages[stage] = { completedAt: new Date().toISOString(), value };
    checkpoint.updatedAt = new Date().toISOString();
    await writeJsonAtomic(checkpointPath(domain), checkpoint);
    console.log('[PENTOR] Advanced checkpoint saved', JSON.stringify({ domain, stage }));
  } catch (error) {
    delete checkpoint.stages[stage];
    console.error('[PENTOR] Could not persist Advanced checkpoint', domain, stage, error);
  }
}

function runNucleiPass(domain, {
  name, templates = [], automatic = false, templateCondition = null,
  severity = 'low,medium,high,critical', timeoutMs, signal,
}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('Scan cancelled.'));
    const args = [
      '-u', `https://${domain}`, '-jsonl', '-silent', '-severity', severity,
      ...templates.flatMap((template) => ['-t', template]),
      ...(automatic ? ['-t', '/home/node/nuclei-templates', '-as'] : []),
      ...(templateCondition ? ['-tc', templateCondition] : []),
      '-pt', 'http,ssl,dns', '-etags', 'fuzz,bruteforce,dos,headless,code,javascript,network',
      '-rl', '10', '-c', '3', '-bs', '1', '-timeout', '8', '-retries', '0', '-mhe', '15',
      '-ni', '-duc', '-H', 'User-Agent: Pentor-Advanced-Scan/1.0 (+https://pentor.net)',
    ];
    const child = spawn('/usr/local/bin/nuclei', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const startedAt = Date.now();
    let timeoutTriggered = false;
    const timer = setTimeout(() => {
      timeoutTriggered = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    const cancel = () => child.kill('SIGTERM');
    signal?.addEventListener('abort', cancel, { once: true });
    child.stdout.on('data', (data) => { if (stdout.length < 5_000_000) stdout += data.toString(); });
    child.stderr.on('data', (data) => { if (stderr.length < 100_000) stderr += data.toString(); });
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('close', (code, signalName) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      if (signal?.aborted) return reject(new Error('Scan cancelled.'));
      const elapsedMs = Date.now() - startedAt;
      const timedOut = timeoutTriggered;
      if (signalName === 'SIGKILL' && !timeoutTriggered) {
        return reject(new Error(`Nuclei ${name} pass was terminated unexpectedly. Check container memory and host OOM logs.`));
      }
      if (code !== 0 && !stdout.trim() && !timedOut) return reject(new Error(`Nuclei exited with code ${code}: ${stderr.slice(-500)}`));
      const results = stdout.split('\n').filter(Boolean).flatMap((line) => {
        try { return [JSON.parse(line)]; } catch { return []; }
      });
      console.log('[PENTOR] Nuclei pass completed', JSON.stringify({
        name, matches: results.length, timedOut, elapsedMs, timeoutMs,
      }));
      resolve({ results, timedOut, name, elapsedMs, timeoutMs });
    });
  });
}

async function runAdvancedScan(domain, onProgress = () => {}, signal, bypassCache = false) {
  const checkpoints = await readAdvancedCheckpoints(domain, bypassCache);
  let report = checkpoints.stages.baseline?.value;
  const baselineFromCache = Boolean(report);
  if (report) {
    onProgress('Reusing cached baseline security checks', 25);
  } else {
    onProgress('Running baseline security checks', 18);
    report = await runProScan(domain);
    await saveAdvancedCheckpoint(domain, checkpoints, 'baseline', report);
  }

  let infrastructure = checkpoints.stages.infrastructure?.value;
  const infrastructureFromCache = Boolean(infrastructure);
  if (infrastructure) {
    onProgress('Reusing cached TLS and DNS template checks', 42);
  } else {
    onProgress('Running focused TLS and DNS template checks', 30);
    infrastructure = await runNucleiPass(domain, {
      name: 'infrastructure',
      templates: ['/home/node/nuclei-templates/ssl', '/home/node/nuclei-templates/dns'],
      timeoutMs: 2 * 60_000,
      signal,
    });
    if (!infrastructure.timedOut) await saveAdvancedCheckpoint(domain, checkpoints, 'infrastructure', infrastructure);
  }

  let curated = checkpoints.stages.curated?.value;
  const curatedFromCache = Boolean(curated);
  if (curated) {
    onProgress('Reusing cached verified web exposure checks', 63);
  } else {
    onProgress('Running verified web exposure checks', 48);
    curated = await runNucleiPass(domain, {
      name: 'curated-web',
      templates: ['/home/node/nuclei-templates'],
      templateCondition: "verified == true && (contains(tags,'misconfig') || contains(tags,'exposure'))",
      severity: 'medium,high,critical',
      timeoutMs: 3 * 60_000,
      signal,
    });
    if (!curated.timedOut) await saveAdvancedCheckpoint(domain, checkpoints, 'curated', curated);
  }

  let automatic = checkpoints.stages.automatic?.value;
  const automaticFromCache = Boolean(automatic);
  if (automatic) {
    onProgress('Reusing cached technology-specific templates', 79);
  } else {
    onProgress('Running technology-specific vulnerability templates', 61);
    automatic = await runNucleiPass(domain, {
      name: 'automatic', automatic: true, timeoutMs: 3 * 60_000, signal,
    });
    if (!automatic.timedOut) await saveAdvancedCheckpoint(domain, checkpoints, 'automatic', automatic);
  }
  onProgress('Validating and prioritizing findings', 84);
  const nucleiResults = [...infrastructure.results, ...curated.results, ...automatic.results];
  const timedOut = infrastructure.timedOut || curated.timedOut || automatic.timedOut;
  const seen = new Set();
  for (const result of nucleiResults) {
    const templateId = result['template-id'] || result.templateID || 'unknown-template';
    const matched = result['matched-at'] || result.host || `https://${domain}`;
    const key = `${templateId}:${matched}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const info = result.info || {};
    const severity = ['critical', 'high', 'medium', 'low'].includes(info.severity) ? info.severity : 'info';
    const refs = Array.isArray(info.reference) ? info.reference.slice(0, 5) : (info.reference ? [String(info.reference)] : []);
    report.findings.push(finding(`NUCLEI-${templateId}`, info.name || templateId, severity, matched,
      info.description || `Nuclei template ${templateId} matched the authorized target.`,
      info.impact || 'This automated match may indicate an exposed component, misconfiguration, or known vulnerability.',
      info.remediation || 'Validate the match, identify the affected component and version, apply the vendor security update or recommended configuration change, then rerun the Advanced Scan.',
      'Advanced vulnerability templates'));
    report.findings.at(-1).references = refs.length ? refs : [`Nuclei template: ${templateId}`];
  }
  if (timedOut) {
    const timedOutPasses = [infrastructure, curated, automatic].filter((pass) => pass.timedOut);
    const passSummary = timedOutPasses.map((pass) =>
      `${pass.name} pass reached its ${Math.round(pass.timeoutMs / 60_000)}-minute limit after ${Math.round(pass.elapsedMs / 1000)} seconds`
    ).join('; ');
    report.findings.push(finding('SCAN-001', 'Advanced scan safety window reached', 'info', domain,
      `Pentor retained the validated results collected before the cutoff. ${passSummary}.`,
      'Coverage may be incomplete because one or more Advanced template passes did not finish before the safety cutoff.',
      'Review the collected findings and rerun the Advanced Scan during a lower-latency window. For exhaustive coverage, request a scoped human penetration test.',
      'Scan coverage'));
  }
  const rawMatches = nucleiResults.length;
  const uniqueMatches = seen.size;
  const cloudflareFronted = report.findings.some((item) => item.id === 'TECH-001' && /cloudflare/i.test(item.title));
  report.scanCoverage = {
    completed: !timedOut,
    rawMatches,
    uniqueMatches,
    duplicatesSuppressed: Math.max(0, rawMatches - uniqueMatches),
    passes: [
      { name: 'Baseline security and DNS', source: baselineFromCache ? 'cache' : 'live', status: 'completed' },
      { name: 'TLS and DNS templates', source: infrastructureFromCache ? 'cache' : 'live', status: infrastructure.timedOut ? 'partial' : 'completed', elapsedMs: infrastructure.elapsedMs, matches: infrastructure.results.length },
      { name: 'Verified web exposure templates', source: curatedFromCache ? 'cache' : 'live', status: curated.timedOut ? 'partial' : 'completed', elapsedMs: curated.elapsedMs, matches: curated.results.length },
      { name: 'Technology-specific templates', source: automaticFromCache ? 'cache' : 'live', status: automatic.timedOut ? 'partial' : 'completed', elapsedMs: automatic.elapsedMs, matches: automatic.results.length },
    ],
    limitations: cloudflareFronted
      ? ['Cloudflare was detected at the public edge. Origin-server technology and vulnerabilities hidden behind the edge may require authenticated or origin-aware testing.']
      : [],
  };
  onProgress('Building your report', 94);
  const completedReport = recalculateReport(report, 'Advanced Scan');
  completedReport.summary = `Pentor Advanced Scan completed its baseline and three template passes against ${domain}. It produced ${rawMatches} raw template matches, validated ${uniqueMatches} unique Advanced finding${uniqueMatches === 1 ? '' : 's'}, and suppressed ${Math.max(0, rawMatches - uniqueMatches)} duplicate result${rawMatches - uniqueMatches === 1 ? '' : 's'}.`;
  return completedReport;
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (req.method === 'OPTIONS') {
    if (!originAllowed(origin)) return send(res, 403, { error: 'Origin not allowed' }, origin);
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    });
    return res.end();
  }
  if (!originAllowed(origin)) return send(res, 403, { error: 'Origin not allowed' }, origin);

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      return send(res, 200, { ok: true, service: 'pentor-api', mode: 'safe-scan-v1', time: new Date().toISOString() }, origin);
    }

    if (req.method === 'POST' && url.pathname === '/api/domains/validate') {
      const body = await readJson(req);
      const normalized = normalizeDomain(body.domain);
      return normalized
        ? send(res, 200, { valid: true, normalized }, origin)
        : send(res, 400, { valid: false, error: 'Enter a valid domain name.' }, origin);
    }

    if (req.method === 'POST' && url.pathname === '/api/verifications') {
      const body = await readJson(req);
      const domain = normalizeDomain(body.domain);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!domain || !email.endsWith(`@${domain}`) || !body.authorized || !body.acceptedTerms) {
        return send(res, 400, { error: 'Valid domain authorization, terms acceptance, and a matching domain email are required.' }, origin);
      }
      const id = randomUUID();
      verifications.set(domain, {
        id,
        email,
        verified: false,
        expiresAt: Date.now() + 15 * 60_000,
        authorizationAccepted: true,
        termsVersion: String(body.termsVersion || 'unknown'),
        termsAcceptedAt: body.acceptedAt || new Date().toISOString(),
        sourceIp: req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
      });
      return send(res, 201, { ok: true, verificationId: id, sentTo: email, mode: 'demo' }, origin);
    }

    if (req.method === 'POST' && url.pathname === '/api/verifications/confirm-demo') {
      const body = await readJson(req);
      const domain = normalizeDomain(body.domain);
      const item = domain ? verifications.get(domain) : null;
      if (!item || item.expiresAt < Date.now()) return send(res, 404, { error: 'Verification not found or expired.' }, origin);
      item.verified = true;
      return send(res, 200, { ok: true, verified: true }, origin);
    }

    if (req.method === 'POST' && url.pathname === '/api/scans') {
      const body = await readJson(req);
      const domain = normalizeDomain(body.domain);
      const verification = domain ? verifications.get(domain) : null;
      if (!domain || !verification?.verified) return send(res, 403, { error: 'Domain verification is required.' }, origin);
      if (!scanAllowlist.has(domain)) return send(res, 403, { error: 'Real scanning is temporarily restricted to the authorized LiqHeat test domain.' }, origin);
      const scanId = randomUUID();
      const startedAt = new Date().toISOString();
      const requestedType = String(body.testType || 'Free Scan').toLowerCase();
      const tier = requestedType.includes('advanced') ? 'advanced' : requestedType.includes('pro') ? 'pro' : 'free';
      if (tier === 'advanced' && (!body.acceptedAdvancedRisk || body.termsVersion !== '1.0')) {
        return send(res, 400, { error: 'Advanced Scan requires explicit authorization, risk acceptance, and Terms v1.0 acceptance.' }, origin);
      }
      const cached = body.forceRescan ? null : await readCachedReport(domain, tier);
      if (cached) {
        const cachedReport = { ...cached.report, servedFromCache: true, cachedAt: cached.cachedAt };
        scans.set(scanId, {
          scanId, domain, testType: cachedReport.tier, startedAt, complete: true, error: null,
          report: cachedReport, currentPhase: 'Cached report ready', progress: 100,
          cacheHit: true, cachedAt: cached.cachedAt,
        });
        return send(res, 200, { ok: true, scanId, startedAt, cached: true, cachedAt: cached.cachedAt }, origin);
      }
      const controller = new AbortController();
      scans.set(scanId, {
        scanId,
        domain,
        testType: tier === 'advanced' ? 'Advanced Scan' : tier === 'pro' ? 'Pro Scan' : 'Free Scan',
        startedAt,
        complete: false,
        error: null,
        termsVersion: String(body.termsVersion || verification.termsVersion || 'unknown'),
        advancedRiskAccepted: tier === 'advanced' ? true : null,
        acceptedAt: body.acceptedAt || new Date().toISOString(),
        sourceIp: req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        currentPhase: 'Preparing authorized target',
        progress: 6,
        controller,
        cancelled: false,
      });
      const updateProgress = (currentPhase, progress) => {
        const scan = scans.get(scanId);
        if (scan && !scan.complete) Object.assign(scan, { currentPhase, progress });
      };
      const run = tier === 'advanced'
        ? runAdvancedScan(domain, updateProgress, controller.signal, Boolean(body.forceRescan))
        : tier === 'pro' ? runProScan(domain) : runSafeScan(domain);
      run.then(async (report) => {
        const scan = scans.get(scanId);
        if (!scan || scan.cancelled) return;
        let cachedAt = null;
        const partialCoverage = report.findings?.some((item) => item.id === 'SCAN-001');
        if (!partialCoverage) {
          try {
            cachedAt = await writeCachedReport(domain, tier, report);
          } catch (cacheError) {
            console.error('[PENTOR] Could not persist scan cache', domain, tier, cacheError);
          }
        } else {
          console.log('[PENTOR] Partial report was not stored as a final cache entry', domain, tier);
        }
        Object.assign(scan, { complete: true, report: { ...report, servedFromCache: false, cachedAt }, cachedAt, currentPhase: 'Report ready', progress: 100 });
      }).catch((error) => {
        console.error('Scan failed', domain, error);
        const scan = scans.get(scanId);
        if (scan && !scan.cancelled) Object.assign(scan, { complete: true, error: error.message || 'Scan failed.' });
      });
      return send(res, 202, { ok: true, scanId, startedAt, cached: false }, origin);
    }

    const cancelMatch = url.pathname.match(/^\/api\/scans\/([^/]+)\/cancel$/);
    if (req.method === 'POST' && cancelMatch) {
      const scan = scans.get(cancelMatch[1]);
      if (!scan) return send(res, 404, { error: 'Scan not found.' }, origin);
      if (scan.complete) return send(res, 409, { error: 'Scan has already completed.' }, origin);
      scan.cancelled = true;
      scan.complete = true;
      scan.error = 'Scan cancelled by user.';
      scan.currentPhase = 'Cancelled';
      scan.controller?.abort();
      return send(res, 200, { ok: true, cancelled: true }, origin);
    }

    const statusMatch = url.pathname.match(/^\/api\/scans\/([^/]+)$/);
    if (req.method === 'GET' && statusMatch) {
      const scan = scans.get(statusMatch[1]);
      if (!scan) return send(res, 404, { error: 'Scan not found.' }, origin);
      return send(res, 200, {
        domain: scan.domain, testType: scan.testType, startedAt: scan.startedAt,
        phase: scan.complete ? phases.length : 0, phases,
        currentPhase: scan.currentPhase, progress: scan.progress,
        complete: scan.complete, error: scan.error, cached: Boolean(scan.cacheHit), cachedAt: scan.cachedAt || null,
        log: [scan.currentPhase].filter(Boolean),
      }, origin);
    }

    const reportMatch = url.pathname.match(/^\/api\/scans\/([^/]+)\/report$/);
    if (req.method === 'GET' && reportMatch) {
      const scan = scans.get(reportMatch[1]);
      if (!scan) return send(res, 404, { error: 'Scan not found.' }, origin);
      if (scan.error) return send(res, 422, { error: scan.error }, origin);
      if (!scan.complete) return send(res, 409, { error: 'Report is not ready.' }, origin);
      return send(res, 200, scan.report, origin);
    }

    return send(res, 404, { error: 'Not found' }, origin);
  } catch (error) {
    console.error(error);
    return send(res, error?.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400, { error: 'Invalid request.' }, origin);
  }
});

server.listen(port, '0.0.0.0', () => console.log(`Pentor API listening on ${port}`));
