import { readFile, writeFile } from 'node:fs/promises';

async function patch(path, before, after, label) {
  let source = await readFile(path, 'utf8');
  if (source.includes(after)) {
    console.log(`[PENTOR] ${label} already applied.`);
    return;
  }
  if (!source.includes(before)) throw new Error(`[PENTOR] ${label}: expected source block not found`);
  source = source.replace(before, after);
  await writeFile(path, source);
  console.log(`[PENTOR] ${label} applied.`);
}

await patch('src/services/api.ts',
`    section: 'network' | 'database';`,
`    section: 'ai' | 'network' | 'database';`,
'AI locked finding section type');

await patch('src/services/api.ts',
`    advisoryFindings: number;\n  };`,
`    advisoryFindings: number;\n    aiSignals?: string[];\n    scheme?: 'http' | 'https';\n  };`,
'AI source coverage metadata');

await patch('src/components/FindingsTable.tsx',
`  section: 'network' | 'database';`,
`  section: 'ai' | 'network' | 'database';`,
'AI locked preview section type');

await patch('src/components/FindingsTable.tsx',
`const lockedSectionLabels: Record<LockedFindingPreview['section'], string> = {\n  network: 'Network Security',\n  database: 'Database Security',\n};`,
`const lockedSectionLabels: Record<LockedFindingPreview['section'], string> = {\n  ai: 'AI Security',\n  network: 'Network & Application Security',\n  database: 'Database Security',\n};`,
'AI locked preview labels');

await patch('src/components/FindingsTable.tsx',
`function safeFallback(finding: LockedFindingPreview) {\n  if (finding.findingClass === 'confirmed_vulnerability') return {`,
`function safeFallback(finding: LockedFindingPreview) {\n  if (finding.section === 'ai') return {\n    title: 'AI application exposure detected',\n    text: 'Pentor found a browser-visible AI credential or AI-specific security signal. Provider, evidence, affected asset, and remediation remain locked.',\n  };\n  if (finding.findingClass === 'confirmed_vulnerability') return {`,
'AI locked preview copy');

await patch('src/pages/ReportPage.tsx',
`  Radar, Clock3, Activity, LockKeyhole, Database,`,
`  Radar, Clock3, Activity, LockKeyhole, Database, Bot,`,
'AI report icon import');

await patch('src/pages/ReportPage.tsx',
`  const databaseFindings = activeFindings.filter(isDatabaseFinding);\n  const networkFindings = activeFindings.filter((finding) => !isDatabaseFinding(finding));\n  const lockedDatabaseFindings = lockedFindings.filter((finding) => finding.section === 'database');\n  const lockedNetworkFindings = lockedFindings.filter((finding) => finding.section === 'network');`,
`  const aiFindings = activeFindings.filter(isAiFinding);\n  const databaseFindings = activeFindings.filter(isDatabaseFinding);\n  const networkFindings = activeFindings.filter((finding) => !isDatabaseFinding(finding) && !isAiFinding(finding));\n  const lockedDatabaseFindings = lockedFindings.filter((finding) => finding.section === 'database');\n  const explicitlyLockedAiFindings = lockedFindings.filter((finding) => finding.section === 'ai');\n  const lockedNetworkPool = lockedFindings.filter((finding) => finding.section === 'network');\n  const hiddenAiCount = Math.max(0, (report?.sourceSecurityCoverage?.secretFindings ?? 0) - aiFindings.filter((finding) => finding.status === 'open').length);\n  const inferredLockedAiFindings = explicitlyLockedAiFindings.length ? [] : lockedNetworkPool.slice(0, hiddenAiCount).map((finding) => ({ ...finding, section: 'ai' as const }));\n  const lockedAiFindings = [...explicitlyLockedAiFindings, ...inferredLockedAiFindings];\n  const lockedNetworkFindings = explicitlyLockedAiFindings.length ? lockedNetworkPool : lockedNetworkPool.slice(hiddenAiCount);`,
'AI report finding partition');

await patch('src/pages/ReportPage.tsx',
`      <SecurityFindingsSection\n        title="Network Security"\n        subtitle={report?.sourceSecurityCoverage\n          ? \`TLS, DNS, headers and exposed services · \${report.sourceSecurityCoverage.documentsScanned} client-source documents · \${report.sourceSecurityCoverage.scriptsScanned} JavaScript assets · \${report.sourceSecurityCoverage.secretFindings} exposed secrets.\`\n          : 'TLS, DNS, HTTP headers, exposed services, email security, and the public web surface.'}\n        findings={networkFindings}\n        lockedFindings={lockedNetworkFindings}\n        icon={<ShieldCheck className="w-5 h-5" />}\n      />`,
`      <SecurityFindingsSection\n        title="AI Security"\n        subtitle={report?.sourceSecurityCoverage\n          ? \`\${report.sourceSecurityCoverage.documentsScanned} public client documents · \${report.sourceSecurityCoverage.scriptsScanned} JavaScript assets · \${report.sourceSecurityCoverage.secretFindings} exposed AI or server secrets\${report.sourceSecurityCoverage.aiSignals?.length ? \` · detected stack: \${report.sourceSecurityCoverage.aiSignals.join(', ')}\` : ''}.\`\n          : 'AI provider credentials, browser-exposed secrets, public AI keys, and AI application stack signals.'}\n        findings={aiFindings}\n        lockedFindings={lockedAiFindings}\n        icon={<Bot className="w-5 h-5" />}\n      />\n\n      <SecurityFindingsSection\n        title="Network & Application Security"\n        subtitle="TLS, DNS, HTTP headers, exposed services, email security, and the traditional public web surface."\n        findings={networkFindings}\n        lockedFindings={lockedNetworkFindings}\n        icon={<ShieldCheck className="w-5 h-5" />}\n      />`,
'AI report section');

await patch('src/pages/ReportPage.tsx',
`function isDatabaseFinding(finding: Finding) {`,
`function isAiFinding(finding: Finding) {\n  return /^AI-/i.test(finding.id) || /AI application|AI provider|client-side source and credential/i.test(finding.category);\n}\n\nfunction isDatabaseFinding(finding: Finding) {`,
'AI finding classifier');

await patch('src/pages/ReportPage.tsx',
`  lockedFindings: Array<{ id: string; severity: 'critical' | 'high' | 'medium' | 'low'; section: 'network' | 'database' }>;`,
`  lockedFindings: Array<{ id: string; severity: 'critical' | 'high' | 'medium' | 'low'; section: 'ai' | 'network' | 'database' }>;`,
'AI report locked type');
