import { createHash } from 'node:crypto';

const MAX_SCRIPTS = 12;
const MAX_DOCUMENT_BYTES = 512_000;
const MAX_TOTAL_BYTES = 4_000_000;

const SECRET_PATTERNS = [
  { name: 'Private key', severity: 'critical', confidence: 'High', regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    reference: 'CWE-321: Use of Hard-coded Cryptographic Key', remediation: 'Revoke or replace the exposed private key immediately, remove it from all client assets, and investigate where the corresponding public identity was used.' },
  { name: 'Credential-bearing database URL', severity: 'critical', confidence: 'High', regex: /(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis):\/\/[^\s:@/'"`]{1,80}:[^\s@'"`]{4,}@[^\s'"`]+/gi,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Rotate the database credential, remove the connection string from client code, restrict database network access, and move all database connections to a server-side component.' },
  { name: 'Supabase secret key', severity: 'critical', confidence: 'High', regex: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g,
    reference: 'Supabase: Securing your data', remediation: 'Revoke the Supabase secret key, replace it with a publishable key in the browser, and keep the replacement secret only in a protected server-side environment.' },
  { name: 'Stripe secret or restricted key', severity: 'critical', confidence: 'High', regex: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
    reference: 'Stripe: API keys', remediation: 'Roll the exposed Stripe key immediately, review Stripe logs for unauthorized activity, and move secret-key operations behind a server-side endpoint.' },
  { name: 'GitHub access token', severity: 'high', confidence: 'High', regex: /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{50,255})\b/g,
    reference: 'GitHub: Secret scanning', remediation: 'Revoke the GitHub token, review its scopes and audit log, create a least-privilege replacement, and store it only in server-side secret storage.' },
  { name: 'GitLab access token', severity: 'high', confidence: 'High', regex: /\bglpat-[A-Za-z0-9_-]{20,}\b/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Revoke the GitLab token, review its scopes and recent use, then issue a least-privilege replacement outside the client bundle.' },
  { name: 'Slack token', severity: 'high', confidence: 'High', regex: /\bxox[aboprs]-[A-Za-z0-9-]{20,}\b/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Revoke the Slack token, inspect workspace audit logs, and move the integration credential to a protected backend.' },
  { name: 'Slack webhook', severity: 'high', confidence: 'High', regex: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Revoke the Slack webhook and issue a replacement that is called only from a protected backend.' },
  { name: 'Discord webhook', severity: 'high', confidence: 'High', regex: /https:\/\/(?:discord(?:app)?\.com)\/api\/webhooks\/\d+\/[A-Za-z0-9_-]{20,}/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Delete or regenerate the exposed Discord webhook and proxy webhook calls through a protected backend.' },
  { name: 'OpenAI-style API key', severity: 'high', confidence: 'High', regex: /\bsk-(?!ant-)(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Revoke the API key, inspect provider usage logs, apply spending limits, and keep the replacement exclusively in server-side secret storage.' },
  { name: 'Anthropic API key', severity: 'high', confidence: 'High', regex: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Revoke the Anthropic key, inspect recent usage, and move all model requests behind a protected server-side endpoint.' },
  { name: 'SendGrid API key', severity: 'high', confidence: 'High', regex: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{20,}\b/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Revoke the SendGrid key, review email activity, and replace it with a restricted key stored only on the server.' },
  { name: 'npm access token', severity: 'high', confidence: 'High', regex: /\bnpm_[A-Za-z0-9]{36,}\b/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Revoke the npm token, review package publication activity, and use a least-privilege automation token outside client code.' },
  { name: 'Hugging Face access token', severity: 'high', confidence: 'High', regex: /\bhf_[A-Za-z0-9]{30,}\b/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Revoke the Hugging Face token, review repository access, and keep the replacement in protected server-side storage.' },
  { name: 'Google OAuth client secret', severity: 'high', confidence: 'High', regex: /\bGOCSPX-[A-Za-z0-9_-]{20,}\b/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Rotate the OAuth client secret, review authorized redirect URIs and recent activity, and move the secret to a protected backend.' },
  { name: 'AWS secret access key', severity: 'high', confidence: 'High', valueGroup: 1,
    regex: /(?:AWS_SECRET_ACCESS_KEY|awsSecretAccessKey)\s*["']?\s*[:=]\s*["'`]([A-Za-z0-9/+=]{32,})["'`]/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Deactivate the AWS access-key pair, inspect CloudTrail for unauthorized use, and replace it with a least-privilege server-side role or credential.' },
  { name: 'Azure Storage account key', severity: 'critical', confidence: 'High', valueGroup: 1,
    regex: /(?:AccountKey|AZURE_STORAGE_KEY)\s*["']?\s*[:=]\s*["'`]([A-Za-z0-9+/]{40,}={0,2})["'`]/g,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Rotate the storage account key, review storage access logs and network rules, and replace direct browser access with scoped, short-lived access issued by a backend.' },
  { name: 'Generic hard-coded secret', severity: 'medium', confidence: 'Medium', valueGroup: 1,
    regex: /(?:api[_-]?secret|client[_-]?secret|secret[_-]?key|service[_-]?role[_-]?key|database[_-]?password|db[_-]?password)\s*["']?\s*[:=]\s*["'`]([^"'`\s\\]{16,})["'`]/gi,
    reference: 'CWE-798: Use of Hard-coded Credentials', remediation: 'Verify the credential, rotate it if active, remove the literal from the client bundle, and use a protected server-side secret store.' },
];

const GOOGLE_API_KEY = /\bAIza[0-9A-Za-z_-]{30,}\b/g;
const JWT = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g;
const PUBLIC_CLIENT_VALUE = /^(?:pk_(?:live|test)_|pi_[A-Za-z0-9]+_secret_|seti_[A-Za-z0-9]+_secret_|sb_publishable_)/;

function sameAuthorizedOrigin(url, domain) {
  return url.protocol === 'https:' && (url.hostname === domain || url.hostname === `www.${domain}` || `www.${url.hostname}` === domain);
}

function discoverScripts(text, base, domain) {
  const scripts = new Map();
  const add = (raw) => {
    try {
      const url = new URL(raw, base);
      url.hash = '';
      if (!sameAuthorizedOrigin(url, domain) || !/\.(?:js|mjs)(?:$|\?)/i.test(url.pathname)) return;
      scripts.set(url.toString(), url);
    } catch {
      // Ignore malformed source-provided URLs.
    }
  };
  for (const match of text.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) add(match[1]);
  for (const match of text.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+\.(?:js|mjs)(?:\?[^"']*)?)["'][^>]*>/gi)) add(match[1]);
  for (const match of text.matchAll(/["'`]([^"'`\s]+\.(?:js|mjs)(?:\?[^"'`]*)?)["'`]/gi)) add(match[1]);
  return [...scripts.values()];
}

function lineNumber(text, index) {
  let line = 1;
  for (let position = 0; position < index; position += 1) if (text.charCodeAt(position) === 10) line += 1;
  return line;
}

function plausibleSecret(value) {
  if (!value || value.length < 16 || PUBLIC_CLIENT_VALUE.test(value)) return false;
  if (/(?:example|replace|your[_-]|changeme|placeholder|undefined|null|process\.env|import\.meta\.env|\$\{)/i.test(value)) return false;
  const classes = [/[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  return classes >= 2;
}

function maskSecret(value, name) {
  if (name === 'Private key') return '[private key material redacted]';
  if (value.length <= 10) return '[redacted]';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function serviceRoleJwt(text) {
  const matches = [];
  for (const match of text.matchAll(JWT)) {
    try {
      const payload = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString('utf8'));
      if (payload?.role === 'service_role') matches.push(match);
    } catch {
      // Non-JSON and malformed JWT-like strings are ignored.
    }
  }
  return matches;
}

function safeUrlLabel(raw) {
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`;
  } catch {
    return raw;
  }
}

function scanDocument(text, source, seenSecrets) {
  const secrets = [];
  const advisories = [];
  const addSecret = (pattern, match, value = match[0]) => {
    if (pattern.valueGroup && !plausibleSecret(value)) return;
    const digest = createHash('sha256').update(value).digest('hex');
    if (seenSecrets.has(digest)) return;
    seenSecrets.add(digest);
    secrets.push({
      ...pattern, source: safeUrlLabel(source), line: lineNumber(text, match.index || 0), preview: maskSecret(value, pattern.name),
    });
  };
  for (const pattern of SECRET_PATTERNS) {
    for (const match of text.matchAll(pattern.regex)) addSecret(pattern, match, match[pattern.valueGroup || 0]);
  }
  for (const match of serviceRoleJwt(text)) {
    addSecret({ name: 'Supabase service_role key', severity: 'critical', confidence: 'High',
      reference: 'Supabase: Securing your data', remediation: 'Rotate the service_role key immediately, audit its use, remove it from the browser bundle, and replace it with a publishable or anon key protected by correctly tested RLS policies.' }, match);
  }
  for (const match of text.matchAll(GOOGLE_API_KEY)) {
    const digest = createHash('sha256').update(match[0]).digest('hex');
    if (seenSecrets.has(digest)) continue;
    seenSecrets.add(digest);
    advisories.push({ name: 'Client-side Google API key', source: safeUrlLabel(source), line: lineNumber(text, match.index || 0), preview: maskSecret(match[0], 'Google API key') });
  }
  return { secrets, advisories };
}

export async function runClientSourceSecurityScan({ domain, safeFetch, readLimitedText, makeFinding, signal }) {
  const findings = [];
  const seenSecrets = new Set();
  const queued = [];
  const queuedSet = new Set();
  const allSecrets = [];
  const allAdvisories = [];
  let scriptsDiscovered = 0;
  let scriptsScanned = 0;
  let documentsScanned = 0;
  let bytesScanned = 0;
  let truncatedAssets = 0;

  const enqueue = (urls) => {
    for (const url of urls) {
      if (queuedSet.has(url.toString()) || queued.length >= MAX_SCRIPTS) continue;
      queuedSet.add(url.toString());
      queued.push(url);
    }
    scriptsDiscovered = queuedSet.size;
  };

  const homepageUrl = `https://${domain}/`;
  const homepageResponse = await safeFetch(homepageUrl, domain, { headers: { Accept: 'text/html,*/*;q=0.5' } });
  const homepage = await readLimitedText(homepageResponse, MAX_DOCUMENT_BYTES);
  bytesScanned += Buffer.byteLength(homepage);
  documentsScanned += 1;
  const initial = scanDocument(homepage, homepageUrl, seenSecrets);
  allSecrets.push(...initial.secrets);
  allAdvisories.push(...initial.advisories);
  enqueue(discoverScripts(homepage, homepageUrl, domain));

  while (queued.length && scriptsScanned < MAX_SCRIPTS && bytesScanned < MAX_TOTAL_BYTES) {
    if (signal?.aborted) throw new Error('Scan cancelled.');
    const url = queued.shift();
    try {
      const response = await safeFetch(url, domain, { headers: { Accept: 'application/javascript,text/javascript,*/*;q=0.5' } });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || /text\/html/i.test(contentType)) {
        await response.body?.cancel();
        continue;
      }
      const remaining = Math.min(MAX_DOCUMENT_BYTES, MAX_TOTAL_BYTES - bytesScanned);
      const body = await readLimitedText(response, remaining);
      const bodyBytes = Buffer.byteLength(body);
      if (bodyBytes >= remaining) truncatedAssets += 1;
      bytesScanned += bodyBytes;
      documentsScanned += 1;
      scriptsScanned += 1;
      const result = scanDocument(body, url.toString(), seenSecrets);
      allSecrets.push(...result.secrets);
      allAdvisories.push(...result.advisories);
      enqueue(discoverScripts(body, url, domain));
    } catch {
      // Inaccessible source assets reduce coverage but are not vulnerabilities.
    }
  }

  for (const [index, secret] of allSecrets.entries()) {
    const item = makeFinding(`SRC-SECRET-${String(index + 1).padStart(3, '0')}`, `${secret.name} exposed in client-side source`, secret.severity,
      `${secret.source}:${secret.line}`,
      `Pentor found a high-confidence ${secret.name.toLowerCase()} pattern in a publicly delivered client asset at line ${secret.line}. Masked preview: ${secret.preview}. The complete value was neither retained nor written to the report.`,
      'Anyone who can load the website can inspect its delivered HTML and JavaScript. An active server credential may permit unauthorized API access, data access, account actions, or unexpected charges.',
      `1. Revoke or rotate the exposed value immediately.\n2. ${secret.remediation}\n3. Remove it from frontend environment variables and generated bundles.\n4. Rebuild and redeploy the site, then purge CDN caches.\n5. Review provider audit and usage logs from the earliest possible exposure time.\n6. Rerun Pentor and confirm the pattern is absent.`,
      'Client-side source and credential security');
    item.confidence = secret.confidence;
    item.references = [secret.reference];
    findings.push(item);
  }

  for (const [index, advisory] of allAdvisories.entries()) {
    const item = makeFinding(`SRC-KEY-${String(index + 1).padStart(3, '0')}`, `${advisory.name} requires restriction review`, 'info',
      `${advisory.source}:${advisory.line}`,
      `A browser-visible Google API key was detected at line ${advisory.line}. Masked preview: ${advisory.preview}. Client exposure can be intentional, so this is not classified as a leaked secret.`,
      'An unrestricted client API key can be copied and abused against enabled APIs, potentially causing data exposure, quota exhaustion, or unexpected charges.',
      'Restrict the key to the required APIs and approved HTTP referrers or application identifiers, apply quotas and billing alerts, and rotate it if unrestricted use is suspected.',
      'Client-side source and credential security');
    item.confidence = 'Medium';
    item.references = ['Google Cloud: API key best practices'];
    findings.push(item);
  }

  if (!allSecrets.length) {
    findings.push(makeFinding('SRC-SECRET-000', 'No high-confidence client-side secret exposure detected', 'passed', domain,
      `Pentor inspected ${documentsScanned} public HTML or JavaScript document(s), including ${scriptsScanned} same-origin script asset(s), without finding a high-confidence server credential pattern.`,
      'Keeping server credentials out of browser-delivered source prevents straightforward credential theft from public bundles.',
      'No action required. Continue using server-side secret storage and scan every production build.',
      'Client-side source and credential security', true));
  }

  return { findings, coverage: {
    documentsScanned, scriptsDiscovered, scriptsScanned, bytesScanned, truncatedAssets,
    secretFindings: allSecrets.length, advisoryFindings: allAdvisories.length,
  } };
}
