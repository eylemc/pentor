import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('./index.mjs', import.meta.url);
let source = await readFile(path, 'utf8');

const before = `const CLASS_SCORE_MULTIPLIER = {
  [FINDING_CLASSES.CONFIRMED]: 1,
  [FINDING_CLASSES.POTENTIAL]: 0.5,
  [FINDING_CLASSES.MISCONFIGURATION]: 0.35,
  [FINDING_CLASSES.HARDENING]: 0.08,
  [FINDING_CLASSES.INFORMATIONAL]: 0,
  [FINDING_CLASSES.COVERAGE]: 0,
  [FINDING_CLASSES.PASSED]: 0,
};

const SEVERITY_SCORE = { critical: 30, high: 18, medium: 8, low: 3, info: 0, passed: 0 };

function findingPenalty(item) {
  if (item.status !== 'open') return 0;
  const base = SEVERITY_SCORE[item.severity] || 0;
  const multiplier = CLASS_SCORE_MULTIPLIER[item.findingClass] ?? 0.5;
  return base * multiplier;
}

function calculateScore(findings) {
  const raw = findings.reduce((sum, item) => sum + findingPenalty(item), 0);
  return Math.max(0, Math.round(100 - raw));
}`;

const after = `const CLASS_SEVERITY_PENALTY = {
  [FINDING_CLASSES.CONFIRMED]: { critical: 40, high: 26, medium: 15, low: 8 },
  [FINDING_CLASSES.POTENTIAL]: { critical: 28, high: 18, medium: 10, low: 5 },
  [FINDING_CLASSES.MISCONFIGURATION]: { critical: 20, high: 13, medium: 7, low: 3 },
  [FINDING_CLASSES.HARDENING]: { critical: 4, high: 3, medium: 2, low: 1 },
};

function findingPenalty(item) {
  if (item.status !== 'open') return 0;
  return CLASS_SEVERITY_PENALTY[item.findingClass]?.[item.severity] || 0;
}

function calculateScore(findings) {
  let materialPenalty = 0;
  let hardeningPenalty = 0;
  for (const item of findings) {
    const penalty = findingPenalty(item);
    if (item.findingClass === FINDING_CLASSES.HARDENING) hardeningPenalty += penalty;
    else materialPenalty += penalty;
  }

  // Missing optional defense-in-depth controls should never make an otherwise
  // clean public site look severely vulnerable. Their combined effect is capped,
  // while confirmed and repeatable technical evidence remains uncapped.
  const raw = materialPenalty + Math.min(8, hardeningPenalty);
  return Math.max(0, Math.round(100 - raw));
}`;

if (!source.includes(before)) {
  throw new Error('[score calibration] expected taxonomy scoring block not found');
}

source = source.replace(before, after);
source = source.replace(
  "const reportCacheVersion = 'reports-v15-evidence-taxonomy';",
  "const reportCacheVersion = 'reports-v16-calibrated-taxonomy';",
);

await writeFile(path, source);
console.log('[PENTOR] Evidence-based score calibration applied.');
