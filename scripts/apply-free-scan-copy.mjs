import { readFile, writeFile } from 'node:fs/promises';

async function patchFile(path, patches) {
  let source = await readFile(path, 'utf8');
  let changed = false;

  for (const patch of patches) {
    if (source.includes(patch.after)) {
      console.log(`[PENTOR] ${patch.label} already applied.`);
      continue;
    }
    if (!source.includes(patch.before)) {
      throw new Error(`[PENTOR] ${patch.label}: expected source block not found`);
    }
    source = source.replace(patch.before, patch.after);
    changed = true;
    console.log(`[PENTOR] ${patch.label} applied.`);
  }

  if (changed) await writeFile(path, source);
}

await patchFile(new URL('../src/pages/LandingPage.tsx', import.meta.url), [
  {
    label: 'Free Scan landing copy',
    before: `          <p className="text-sm text-gray-400">
            Pentor only tests domains after authorization is confirmed by email verification. No testing occurs without your explicit approval.
          </p>`,
    after: `          <p className="text-sm text-gray-400">
            Free Scan starts immediately after you confirm ownership or explicit authorization and accept the responsible-use terms. Email verification remains reserved for Pro and Deep Scan.
          </p>`,
  },
]);

await patchFile(new URL('../src/pages/ReportPage.tsx', import.meta.url), [
  {
    label: 'Free Fresh Scan authorization payload',
    before: `        domain: report.domain, testType: report.tier ?? 'Free Scan', forceRescan: true,
        acceptedAdvancedRisk: isDeep, termsVersion: '1.0', acceptedAt: new Date().toISOString(),`,
    after: `        domain: report.domain, testType: report.tier ?? 'Free Scan', forceRescan: true,
        authorized: true, acceptedTerms: true,
        acceptedAdvancedRisk: isDeep, termsVersion: '1.0', acceptedAt: new Date().toISOString(),`,
  },
]);
