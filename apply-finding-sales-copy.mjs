import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('./src/components/FindingsTable.tsx', import.meta.url);
let source = await readFile(path, 'utf8');

const replacements = [
  ["  hardening_recommendation: 'Hardening recommendation',", "  hardening_recommendation: 'Security finding',"],
  ["    title: 'Security hardening opportunity identified',", "    title: 'Security weakness detected',"],
  ["    text: 'An additional defensive control could reduce exposure. This is not a confirmed vulnerability.',", "    text: 'A security control is missing or incomplete. Unlock the full report to see the affected control, evidence, impact, and recommended fix.',"],
  ["{filtered.length === 1 ? 'observation' : 'observations'}", "{filtered.length === 1 ? 'finding' : 'findings'}"],
  ["No observations match your filters.", "No findings match your filters."],
  ["{filteredLocked.length === 1 ? 'observation' : 'observations'} detected", "{filteredLocked.length === 1 ? 'finding' : 'findings'} detected"],
  ["Each observation is classified by evidence strength, not severity alone.", "Unlock the vulnerability details, technical evidence, business impact, and remediation steps."],
  ["Observation details are locked", "Finding details are locked"],
  ["Unlock This Observation", "Unlock This Finding"],
  ["more observations in the full Pro report", "more findings in the full Pro report"],
  ["See which observations are confirmed, which require validation, and which are defense-in-depth recommendations.", "Unlock all security findings, technical evidence, affected endpoints, business impact, and step-by-step remediation."],
];

for (const [before, after] of replacements) {
  if (!source.includes(before)) throw new Error(`[sales copy patch] expected text not found: ${before}`);
  source = source.replaceAll(before, after);
}

// Keep the evidence taxonomy internally for scoring and reports, but remove the
// academic classification chip from locked Free cards. Severity and category remain visible.
source = source.replace(
  "                        {finding.findingClass && <span className=\"rounded border border-ink-600 bg-ink-800/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400\">{findingClassLabels[finding.findingClass]}</span>}\n",
  '',
);

await writeFile(path, source);
console.log('[PENTOR] Finding-focused sales copy applied.');
