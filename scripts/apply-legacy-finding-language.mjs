import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../src/components/FindingsTable.tsx', import.meta.url);
let source = await readFile(path, 'utf8');

const replacements = [
  [
    "const findingClassLabels: Record<FindingClass, string> = {\n  confirmed_vulnerability: 'Confirmed vulnerability',\n  potential_vulnerability: 'Requires validation',\n  security_misconfiguration: 'Security misconfiguration',\n  hardening_recommendation: 'Hardening recommendation',\n};\n\n",
    '',
  ],
  [
    "  if (finding.findingClass === 'hardening_recommendation') return {\n    title: 'Security hardening opportunity identified',\n    text: 'An additional defensive control could reduce exposure. This is not a confirmed vulnerability.',\n  };",
    "  if (finding.findingClass === 'hardening_recommendation') return {\n    title: finding.section === 'database' ? 'Database security weakness detected' : 'Security weakness detected',\n    text: 'Pentor identified a security control that requires attention. Full technical details and remediation are locked.',\n  };",
  ],
  [
    "        {filtered.length} visible {filtered.length === 1 ? 'observation' : 'observations'}",
    "        {filtered.length} visible {filtered.length === 1 ? 'finding' : 'findings'}",
  ],
  [
    'No observations match your filters.',
    'No findings match your filters.',
  ],
  [
    "{filteredLocked.length} additional security {filteredLocked.length === 1 ? 'observation' : 'observations'} detected",
    "{filteredLocked.length} additional security {filteredLocked.length === 1 ? 'finding' : 'findings'} detected",
  ],
  [
    'Each observation is classified by evidence strength, not severity alone.',
    'Unlock the full report to see the affected area, technical evidence, impact, and remediation.',
  ],
  [
    "                        {finding.findingClass && <span className=\"rounded border border-ink-600 bg-ink-800/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400\">{findingClassLabels[finding.findingClass]}</span>}\n",
    '',
  ],
  [
    'Observation details are locked',
    'Finding details are locked',
  ],
  [
    'Unlock This Observation',
    'Unlock This Finding',
  ],
  [
    "more observations in the full Pro report",
    "more findings in the full Pro report",
  ],
  [
    'See which observations are confirmed, which require validation, and which are defense-in-depth recommendations.',
    'Unlock every vulnerability, technical evidence, remediation step, and the complete security report.',
  ],
];

let changed = false;
for (const [before, after] of replacements) {
  if (source.includes(before)) {
    source = source.replace(before, after);
    changed = true;
  }
}

// Preserve provider-specific locked preview copy returned by the API. Older builds
// deliberately replaced these fields with a generic fallback, making every AI card
// look identical even though the backend returned distinct provider findings.
const genericPreview = `            const fallback = safeFallback(finding);\n            const title = fallback.title;\n            const text = fallback.text;`;
const providerPreview = `            const fallback = safeFallback(finding);\n            const title = finding.previewTitle || fallback.title;\n            const text = finding.previewText || fallback.text;`;
if (source.includes(genericPreview)) {
  source = source.replace(genericPreview, providerPreview);
  changed = true;
}

if (!source.includes('const title = finding.previewTitle || fallback.title;') ||
    !source.includes('const text = finding.previewText || fallback.text;')) {
  throw new Error('[PENTOR] Provider-specific locked finding copy verification failed.');
}

if (changed) {
  await writeFile(path, source);
  console.log('[PENTOR] Finding-focused report language applied with provider-specific previews preserved.');
} else {
  console.log('[PENTOR] Finding-focused report language already applied; provider-specific previews preserved.');
}
