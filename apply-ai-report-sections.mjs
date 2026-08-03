import { readFile, writeFile } from 'node:fs/promises';

async function transform(path, label, mutate, verify) {
  const source = await readFile(path, 'utf8');
  const next = mutate(source);
  if (!verify(next)) throw new Error(`[PENTOR] ${label}: verification failed`);
  if (next !== source) {
    await writeFile(path, next);
    console.log(`[PENTOR] ${label} applied.`);
  } else {
    console.log(`[PENTOR] ${label} already applied.`);
  }
}

await transform('src/services/api.ts', 'AI report API types', (source) => source
  .replace("section: 'network' | 'database';", "section: 'ai' | 'network' | 'database';")
  .replace(
    '    advisoryFindings: number;\n  };',
    "    advisoryFindings: number;\n    aiSignals?: string[];\n    scheme?: 'http' | 'https';\n  };",
  ), (source) => source.includes("section: 'ai' | 'network' | 'database';") && source.includes('aiSignals?: string[];'));

await transform('src/components/FindingsTable.tsx', 'AI locked finding presentation', (source) => {
  let next = source.replace("section: 'network' | 'database';", "section: 'ai' | 'network' | 'database';");
  next = next.replace(
    /const lockedSectionLabels:[\s\S]*?= \{\n\s*network: 'Network Security',\n\s*database: 'Database Security',\n\};/,
    `const lockedSectionLabels: Record<LockedFindingPreview['section'], string> = {\n  ai: 'AI Security',\n  network: 'Network & Application Security',\n  database: 'Database Security',\n};`,
  );
  if (!next.includes("finding.section === 'ai'")) {
    next = next.replace(
      'function safeFallback(finding: LockedFindingPreview) {',
      `function safeFallback(finding: LockedFindingPreview) {\n  if (finding.section === 'ai') return {\n    title: 'AI application exposure detected',\n    text: 'Pentor found a browser-visible AI credential or AI-specific security signal. Provider, evidence, affected asset, and remediation remain locked.',\n  };`,
    );
  }
  return next;
}, (source) => source.includes("ai: 'AI Security'") && source.includes("finding.section === 'ai'"));

await transform('src/pages/ReportPage.tsx', 'AI Security report section', (source) => {
  let next = source;
  if (!next.includes('Database, Bot,')) {
    next = next.replace('Radar, Clock3, Activity, LockKeyhole, Database,', 'Radar, Clock3, Activity, LockKeyhole, Database, Bot,');
  }

  next = next.replace(
    /  const databaseFindings = activeFindings\.filter\(isDatabaseFinding\);\n  const networkFindings = activeFindings\.filter\(\(finding\) => !isDatabaseFinding\(finding\)\);\n  const lockedDatabaseFindings = lockedFindings\.filter\(\(finding\) => finding\.section === 'database'\);\n  const lockedNetworkFindings = lockedFindings\.filter\(\(finding\) => finding\.section === 'network'\);/,
    `  const aiFindings = activeFindings.filter(isAiFinding);\n  const databaseFindings = activeFindings.filter(isDatabaseFinding);\n  const networkFindings = activeFindings.filter((finding) => !isDatabaseFinding(finding) && !isAiFinding(finding));\n  const lockedDatabaseFindings = lockedFindings.filter((finding) => finding.section === 'database');\n  const explicitlyLockedAiFindings = lockedFindings.filter((finding) => finding.section === 'ai');\n  const lockedNetworkPool = lockedFindings.filter((finding) => finding.section === 'network');\n  const hiddenAiCount = Math.max(0, (report?.sourceSecurityCoverage?.secretFindings ?? 0) - aiFindings.filter((finding) => finding.status === 'open').length);\n  const inferredLockedAiFindings = explicitlyLockedAiFindings.length ? [] : lockedNetworkPool.slice(0, hiddenAiCount).map((finding) => ({ ...finding, section: 'ai' as const }));\n  const lockedAiFindings = [...explicitlyLockedAiFindings, ...inferredLockedAiFindings];\n  const lockedNetworkFindings = explicitlyLockedAiFindings.length ? lockedNetworkPool : lockedNetworkPool.slice(hiddenAiCount);`,
  );

  next = next.replace(
    /      <SecurityFindingsSection\n        title="Network Security"[\s\S]*?        icon=\{<ShieldCheck className="w-5 h-5" \/>\}\n      \/>/,
    `      <SecurityFindingsSection\n        title="AI Security"\n        subtitle={report?.sourceSecurityCoverage\n          ? \`${'${report.sourceSecurityCoverage.documentsScanned}'} public client documents · ${'${report.sourceSecurityCoverage.scriptsScanned}'} JavaScript assets · ${'${report.sourceSecurityCoverage.secretFindings}'} exposed AI or server secrets${'${report.sourceSecurityCoverage.aiSignals?.length ? ` · detected stack: ${report.sourceSecurityCoverage.aiSignals.join(\', \')}` : \'\'}'}.\`\n          : 'AI provider credentials, browser-exposed secrets, public AI keys, and AI application stack signals.'}\n        findings={aiFindings}\n        lockedFindings={lockedAiFindings}\n        icon={<Bot className="w-5 h-5" />}\n      />\n\n      <SecurityFindingsSection\n        title="Network & Application Security"\n        subtitle="TLS, DNS, HTTP headers, exposed services, email security, and the traditional public web surface."\n        findings={networkFindings}\n        lockedFindings={lockedNetworkFindings}\n        icon={<ShieldCheck className="w-5 h-5" />}\n      />`,
  );

  if (!next.includes('function isAiFinding(')) {
    next = next.replace(
      'function isDatabaseFinding(finding: Finding) {',
      `function isAiFinding(finding: Finding) {\n  return /^AI-/i.test(finding.id) || /AI application|AI provider|client-side source and credential/i.test(finding.category);\n}\n\nfunction isDatabaseFinding(finding: Finding) {`,
    );
  }
  next = next.replace(
    /section: 'network' \| 'database' \}>;/,
    "section: 'ai' | 'network' | 'database' }>;",
  );
  return next;
}, (source) => source.includes('title="AI Security"') && source.includes('findings={aiFindings}') && source.includes('function isAiFinding(') && source.includes("section: 'ai' | 'network' | 'database'"));
