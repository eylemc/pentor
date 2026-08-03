import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('./index.mjs', import.meta.url);
let source = await readFile(path, 'utf8');

const oldAuthorization = `      const body = await readJson(req);
      const domain = normalizeDomain(body.domain);
      const verification = domain ? verifications.get(domain) : null;
      if (!domain || !verification?.verified) return send(res, 403, { error: 'Domain verification is required.' }, origin);`;

const strictAuthorization = `      const body = await readJson(req);
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
      }`;

const newAuthorization = `      const body = await readJson(req);
      const domain = normalizeDomain(body.domain);
      const requestedType = String(body.testType || 'Free Scan').toLowerCase();
      const tier = requestedType.includes('pro') || requestedType.includes('advanced') ? 'pro' : 'free';
      const verification = domain ? verifications.get(domain) : null;
      if (!domain) return send(res, 400, { error: 'Enter a valid domain name.' }, origin);
      if (tier === 'pro' && !verification?.verified) {
        return send(res, 403, { error: 'Domain email verification is required for Pro and Deep Scan.' }, origin);
      }
      if (tier === 'free' && (String(body.termsVersion || '') !== '1.0' || !body.acceptedAt)) {
        return send(res, 400, { error: 'Free Scan requires acceptance of Terms v1.0.' }, origin);
      }`;

const duplicateTierBlock = `      const requestedType = String(body.testType || 'Free Scan').toLowerCase();
      const tier = requestedType.includes('pro') || requestedType.includes('advanced') ? 'pro' : 'free';`;

if (source.includes(newAuthorization)) {
  console.log('[PENTOR] Free Scan no-email authorization patch already applied.');
} else if (source.includes(strictAuthorization)) {
  source = source.replace(strictAuthorization, newAuthorization);
  await writeFile(path, source);
  console.log('[PENTOR] Free Fresh Scan terms-only authorization patch applied.');
} else if (source.includes(oldAuthorization)) {
  source = source.replace(oldAuthorization, newAuthorization);
  const first = source.indexOf(duplicateTierBlock);
  const second = source.indexOf(duplicateTierBlock, first + duplicateTierBlock.length);
  if (second !== -1) source = source.slice(0, second) + source.slice(second + duplicateTierBlock.length + 1);
  await writeFile(path, source);
  console.log('[PENTOR] Free Scan no-email authorization patch applied.');
} else {
  throw new Error('[free scan patch] expected scan authorization block not found');
}
