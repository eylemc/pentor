import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('./index.mjs', import.meta.url);
let source = await readFile(path, 'utf8');

const before = `      const body = await readJson(req);
      const domain = normalizeDomain(body.domain);
      const verification = domain ? verifications.get(domain) : null;
      if (!domain || !verification?.verified) return send(res, 403, { error: 'Domain verification is required.' }, origin);
      if (!scanAllowlist.has(domain)) return send(res, 403, { error: 'Real scanning is temporarily restricted to the authorized LiqHeat test domain.' }, origin);
      const scanId = randomUUID();
      const startedAt = new Date().toISOString();
      const requestedType = String(body.testType || 'Free Scan').toLowerCase();
      const tier = requestedType.includes('pro') || requestedType.includes('advanced') ? 'pro' : 'free';`;

const after = `      const body = await readJson(req);
      const domain = normalizeDomain(body.domain);
      const requestedType = String(body.testType || 'Free Scan').toLowerCase();
      const tier = requestedType.includes('pro') || requestedType.includes('advanced') ? 'pro' : 'free';
      const verification = domain ? verifications.get(domain) : null;
      if (!domain) return send(res, 400, { error: 'Enter a valid domain name.' }, origin);
      if (tier === 'pro' && !verification?.verified) {
        return send(res, 403, { error: 'Domain email verification is required for Pro and Deep Scan.' }, origin);
      }
      if (tier === 'free' && (!body.authorized || !body.acceptedTerms || String(body.termsVersion || '') !== '1.0')) {
        return send(res, 400, { error: 'Free Scan requires authorization confirmation and acceptance of Terms v1.0.' }, origin);
      }
      if (!scanAllowlist.has(domain)) return send(res, 403, { error: 'Real scanning is temporarily restricted to the authorized LiqHeat test domain.' }, origin);
      const scanId = randomUUID();
      const startedAt = new Date().toISOString();`;

if (source.includes(after)) {
  console.log('[PENTOR] Free Scan no-email authorization patch already applied.');
} else if (source.includes(before)) {
  source = source.replace(before, after);
  await writeFile(path, source);
  console.log('[PENTOR] Free Scan no-email authorization patch applied.');
} else {
  throw new Error('[free scan patch] expected scan authorization block not found');
}
