import { readFile, writeFile } from 'node:fs/promises';

const path = './index.mjs';
let source = await readFile(path, 'utf8');

if (source.includes('function lockedPreviewForFinding(item)')) {
  console.log('[PENTOR] Distinct locked finding previews already applied.');
  process.exit(0);
}

const marker = `function createFreePreviewReport(fullReport) {`;
if (!source.includes(marker)) {
  throw new Error('[PENTOR] Could not locate createFreePreviewReport.');
}

const helper = `function lockedPreviewForFinding(item) {
  const title = String(item.title || 'Security finding detected');
  const id = String(item.id || '');
  const category = String(item.category || '');
  const combined = \`${'${id} ${title} ${category}'}\`.toLowerCase();

  if (/openai/.test(combined)) return {
    previewTitle: 'OpenAI API credential exposed in client code',
    previewText: 'A browser-delivered asset contains an OpenAI credential pattern that may permit unauthorized API usage and direct billing impact.',
    findingClass: 'confirmed_vulnerability',
  };
  if (/anthropic|claude/.test(combined)) return {
    previewTitle: 'Anthropic API credential exposed to site visitors',
    previewText: 'A client-side asset exposes an Anthropic credential pattern that may allow unauthorized model requests and consumption of the account quota.',
    findingClass: 'confirmed_vulnerability',
  };
  if (/groq/.test(combined)) return {
    previewTitle: 'Groq API key may enable unauthorized model usage',
    previewText: 'A Groq credential pattern is present in browser-accessible code, creating a risk of third-party inference usage and unexpected cost.',
    findingClass: 'confirmed_vulnerability',
  };
  if (/supabase/.test(combined) && /service|secret|privileg/.test(combined)) return {
    previewTitle: 'Privileged Supabase backend credential exposed',
    previewText: 'A privileged Supabase credential pattern appears in public client code and may bypass normal application access boundaries.',
    findingClass: 'confirmed_vulnerability',
  };
  if (/stripe/.test(combined) && /secret/.test(combined)) return {
    previewTitle: 'Stripe secret key exposed in browser-delivered code',
    previewText: 'A Stripe secret credential pattern is publicly accessible and may permit unauthorized API operations against the payment account.',
    findingClass: 'confirmed_vulnerability',
  };
  if (/database|postgres|mysql|mongodb|redis|connection string/.test(combined)) return {
    previewTitle: 'Database credential or connection string exposed',
    previewText: 'Public client code contains a database access pattern that may disclose infrastructure details or enable unauthorized connection attempts.',
    findingClass: 'confirmed_vulnerability',
  };
  if (/private key|pem/.test(combined)) return {
    previewTitle: 'Private cryptographic key material exposed',
    previewText: 'Browser-accessible content contains private-key material that may compromise authentication, signing, or encrypted communications.',
    findingClass: 'confirmed_vulnerability',
  };
  if (/^ai-/i.test(id) || /ai provider|client-side source and credential/.test(combined)) return {
    previewTitle: title,
    previewText: 'Pentor identified a provider-specific AI application exposure. Technical evidence, affected asset, and remediation remain available in the full report.',
    findingClass: 'security_misconfiguration',
  };
  return {
    previewTitle: title,
    previewText: item.impact || 'Pentor identified a distinct security weakness. Evidence, affected area, business impact, and remediation remain locked.',
    findingClass: item.findingClass || 'potential_vulnerability',
  };
}

`;

source = source.replace(marker, helper + marker);

const before = `  const locked = actionable.map((item, index) => ({
    id: \`LOCKED-${'${index + 1}'}\`,
    severity: item.severity,
    section: /^(?:DATA|INJ|TOOL|RLS)-/i.test(item.id) || /database|injection|row-level security|public database/i.test(item.category)
      ? 'database'
      : 'network',
  }));`;

const after = `  const locked = actionable.map((item, index) => ({
    id: \`LOCKED-${'${index + 1}'}\`,
    severity: item.severity,
    section: /^AI-/i.test(item.id) || /AI application|AI provider|client-side source and credential/i.test(item.category)
      ? 'ai'
      : /^(?:DATA|INJ|TOOL|RLS)-/i.test(item.id) || /database|injection|row-level security|public database/i.test(item.category)
        ? 'database'
        : 'network',
    ...lockedPreviewForFinding(item),
  }));`;

if (!source.includes(before)) {
  throw new Error('[PENTOR] Could not locate locked finding mapper.');
}
source = source.replace(before, after);

if (!source.includes('previewTitle:') || !source.includes("section: /^AI-/i.test(item.id)")) {
  throw new Error('[PENTOR] Locked preview verification failed.');
}

await writeFile(path, source);
console.log('[PENTOR] Distinct locked finding previews applied.');
