import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../src/pages/ReportPage.tsx', import.meta.url);
let source = await readFile(path, 'utf8');

const before = `        domain: report.domain, testType: report.tier ?? 'Free Scan', forceRescan: true,
        acceptedAdvancedRisk: isDeep, termsVersion: '1.0', acceptedAt: new Date().toISOString(),`;

const after = `        domain: report.domain, testType: report.tier ?? 'Free Scan', forceRescan: true,
        authorized: true, acceptedTerms: true,
        acceptedAdvancedRisk: isDeep, termsVersion: '1.0', acceptedAt: new Date().toISOString(),`;

if (source.includes(after)) {
  console.log('[PENTOR] Free Fresh Scan authorization payload already applied.');
} else if (source.includes(before)) {
  source = source.replace(before, after);
  await writeFile(path, source);
  console.log('[PENTOR] Free Fresh Scan authorization payload applied.');
} else {
  throw new Error('[fresh scan patch] expected ReportPage request block not found');
}
