import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('./index.mjs', import.meta.url);
let source = await readFile(path, 'utf8');

function replaceOnce(label, before, after) {
  if (!source.includes(before)) throw new Error(`[taxonomy patch] ${label}: expected source block not found`);
  source = source.replace(before, after);
}

replaceOnce(
  'cache version',
  "const reportCacheVersion = 'reports-v14-blurred-free-preview';",
  "const reportCacheVersion = 'reports-v15-evidence-taxonomy';",
);

replaceOnce(
  'finding factory',
  `function finding(id, title, severity, area, observed, impact, recommendation, category, passed = false) {
  return {
    id, title, severity, confidence: 'High', affectedArea: area, observed, impact, recommendation,
    references: ['Pentor Free Scan v1'], detectedAt: new Date().toISOString(), status: passed ? 'no_action' : 'open', category,
  };
}`,
  `const FINDING_CLASSES = {
  CONFIRMED: 'confirmed_vulnerability',
  POTENTIAL: 'potential_vulnerability',
  MISCONFIGURATION: 'security_misconfiguration',
  HARDENING: 'hardening_recommendation',
  INFORMATIONAL: 'informational',
  COVERAGE: 'coverage_limitation',
  PASSED: 'control_passed',
};

function classifyFinding(id, title, severity, passed) {
  if (passed || severity === 'passed') return { findingClass: FINDING_CLASSES.PASSED, confidence: 'High' };
  if (/^(?:SCAN-|TOOL-COVERAGE|SRC-SCAN|RLS-.*-EMPTY)/i.test(id)) return { findingClass: FINDING_CLASSES.COVERAGE, confidence: 'High' };
  if (severity === 'info' || /^(?:TECH-|FILE-|DNS-CAA|DNS-MX|DATA-TECH)/i.test(id)) return { findingClass: FINDING_CLASSES.INFORMATIONAL, confidence: 'High' };

  // Direct evidence of exposed credentials, cross-user data access, a public database
  // service, or an independently reproduced SQL injection point is treated as confirmed.
  if (/^(?:SRC-SECRET|RLS-.*-001|TOOL-NMAP-DB-001|TOOL-SQLMAP-001)/i.test(id)) {
    return { findingClass: FINDING_CLASSES.CONFIRMED, confidence: 'High' };
  }

  // Differential and template-based signals require validation before the word
  // “vulnerability” is used without qualification.
  if (/^(?:INJ-|NUCLEI-)/i.test(id) || /potential|signal|requires validation/i.test(title)) {
    return { findingClass: FINDING_CLASSES.POTENTIAL, confidence: /NUCLEI-/i.test(id) ? 'Medium' : 'Medium' };
  }

  // Missing optional defensive controls are recommendations, not vulnerabilities.
  if (/^(?:HDR-|INF-|DNS-EMAIL-|DNS-CAA-|FILE-)/i.test(id)) {
    return { findingClass: FINDING_CLASSES.HARDENING, confidence: 'High' };
  }

  // Observable configuration states with plausible security effect, but without
  // demonstrated exploitation, are tracked separately from vulnerabilities.
  if (/^(?:TLS-|SES-|CORS-|DATA-ERR-)/i.test(id)) {
    return { findingClass: FINDING_CLASSES.MISCONFIGURATION, confidence: id === 'SES-001' ? 'Medium' : 'High' };
  }

  return { findingClass: FINDING_CLASSES.POTENTIAL, confidence: 'Medium' };
}

function finding(id, title, severity, area, observed, impact, recommendation, category, passed = false) {
  const taxonomy = classifyFinding(id, title, severity, passed);
  return {
    id, title, severity, confidence: taxonomy.confidence, findingClass: taxonomy.findingClass,
    affectedArea: area, observed, impact, recommendation,
    references: ['Pentor Assessment Methodology v2'], detectedAt: new Date().toISOString(),
    status: passed ? 'no_action' : 'open', category,
  };
}

const CLASS_SCORE_MULTIPLIER = {
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
}

function taxonomyCounts(findings) {
  const counts = {
    confirmed_vulnerability: 0,
    potential_vulnerability: 0,
    security_misconfiguration: 0,
    hardening_recommendation: 0,
    informational: 0,
    coverage_limitation: 0,
    control_passed: 0,
  };
  for (const item of findings) if (item.findingClass in counts) counts[item.findingClass] += 1;
  return counts;
}

function previewForFinding(item) {
  const section = /^(?:DATA|INJ|TOOL|RLS)-/i.test(item.id) || /database|injection|row-level security|public database/i.test(item.category)
    ? 'database'
    : 'network';
  const byClass = {
    confirmed_vulnerability: {
      title: section === 'database' ? 'Verified data-security exposure detected' : 'Verified security exposure detected',
      text: 'Pentor reproduced direct technical evidence. The affected component and proof remain locked.',
    },
    potential_vulnerability: {
      title: section === 'database' ? 'Database-security signal requires validation' : 'Potential vulnerability requires validation',
      text: 'A repeatable automated signal was observed, but manual validation is required before treating it as confirmed.',
    },
    security_misconfiguration: {
      title: section === 'database' ? 'Data-access configuration requires review' : 'Security configuration requires review',
      text: 'An observable configuration state may weaken a security boundary, without proving successful exploitation.',
    },
    hardening_recommendation: {
      title: section === 'database' ? 'Database hardening opportunity identified' : 'Security hardening opportunity identified',
      text: 'An additional defensive control could reduce exposure. This is not classified as a confirmed vulnerability.',
    },
  };
  return { section, ...(byClass[item.findingClass] || byClass.potential_vulnerability) };
}`,
);

replaceOnce(
  'cookie contextual classification',
  `  if (cookies.length) {
    const insecure = cookies.filter((cookie) => !/;\\s*secure/i.test(cookie) || !/;\\s*httponly/i.test(cookie) || !/;\\s*samesite=/i.test(cookie));
    findings.push(finding('SES-001', insecure.length ? 'Cookie security attributes incomplete' : 'Cookie security attributes configured',
      insecure.length ? 'medium' : 'passed', 'Response cookies', \`${'${cookies.length}'} cookie header(s) observed; ${'${insecure.length}'} lacked one or more of Secure, HttpOnly, or SameSite.\`,
      'Cookie attributes help reduce session theft and cross-site request risks.', insecure.length
        ? 'Review session cookies and apply Secure, HttpOnly, and an appropriate SameSite value.' : 'Maintain the current cookie settings.',
      'Authentication and session risks', insecure.length === 0));
  }`,
  `  if (cookies.length) {
    const insecure = cookies.filter((cookie) => !/;\\s*secure/i.test(cookie) || !/;\\s*httponly/i.test(cookie) || !/;\\s*samesite=/i.test(cookie));
    findings.push(finding('SES-001', insecure.length ? 'Cookie attributes require contextual review' : 'Cookie security attributes configured',
      insecure.length ? 'low' : 'passed', 'Response cookies', \`${'${cookies.length}'} cookie header(s) observed; ${'${insecure.length}'} lacked one or more of Secure, HttpOnly, or SameSite. Pentor cannot determine from an anonymous response whether each cookie contains an authentication token.\`,
      'Missing attributes matter most on session or authentication cookies; analytics and preference cookies have different requirements.', insecure.length
        ? 'Identify which cookies carry authentication or sensitive state, then apply Secure, HttpOnly, and an appropriate SameSite value to those cookies.' : 'Maintain the current cookie settings.',
      'Authentication and session risks', insecure.length === 0));
  }`,
);

replaceOnce(
  'CORS validation',
  `  const unsafeCors = acao === '*' && acac?.toLowerCase() === 'true';
  findings.push(finding('CORS-001', unsafeCors ? 'Potentially unsafe CORS response' : 'No obvious credentialed wildcard CORS',
    unsafeCors ? 'high' : 'passed', 'Cross-origin policy', \`Access-Control-Allow-Origin: ${'${acao || \'not returned\'}'}; credentials: ${'${acac || \'not returned\'}'}.\`,
    'Overly broad credentialed CORS can expose authenticated data cross-origin.', unsafeCors
      ? 'Do not combine wildcard origins with credentialed cross-origin access.' : 'Continue restricting trusted origins explicitly.',
    'Web application exposure', !unsafeCors));`,
  `  const reflectedArbitraryOrigin = acao === 'https://pentor-invalid.example';
  const credentialedReflection = reflectedArbitraryOrigin && acac?.toLowerCase() === 'true';
  findings.push(finding('CORS-001', credentialedReflection ? 'Arbitrary credentialed CORS origin reflected' : 'No arbitrary credentialed CORS reflection observed',
    credentialedReflection ? 'high' : 'passed', 'Cross-origin policy', \`Probe origin: https://pentor-invalid.example; Access-Control-Allow-Origin: ${'${acao || \'not returned\'}'}; credentials: ${'${acac || \'not returned\'}'}.\`,
    'Reflecting an untrusted origin while allowing credentials can expose authenticated responses to attacker-controlled sites.', credentialedReflection
      ? 'Replace dynamic origin reflection with an exact allowlist and do not enable credentials for untrusted origins.' : 'Continue validating allowed origins explicitly on sensitive endpoints.',
    'Web application exposure', !credentialedReflection));`,
);

replaceOnce(
  'server disclosure severity',
  "if (serverHeader) findings.push(finding('INF-001', 'Server software disclosed', 'low'",
  "if (serverHeader) findings.push(finding('INF-001', 'Server software disclosed', 'info'",
);

replaceOnce(
  'initial scoring',
  `  const weights = { critical: 30, high: 18, medium: 8, low: 3, info: 0, passed: 0 };
  const score = Math.max(0, 100 - findings.reduce((sum, item) => sum + weights[item.severity], 0));`,
  `  const score = calculateScore(findings);`,
);

replaceOnce(
  'initial report taxonomy counts',
  `    domain, score, severityCounts, findings, generatedAt: new Date().toISOString(), tier: 'Free Scan',`,
  `    domain, score, severityCounts, taxonomyCounts: taxonomyCounts(findings), findings, generatedAt: new Date().toISOString(), tier: 'Free Scan',`,
);

replaceOnce(
  'recalculation scoring',
  `  const weights = { critical: 30, high: 18, medium: 8, low: 3, info: 0, passed: 0 };
  report.score = Math.max(0, 100 - report.findings.reduce((sum, item) => {
    if (item.status !== 'open') return sum;
    return sum + (weights[item.severity] || 0);
  }, 0));`,
  `  report.score = calculateScore(report.findings);`,
);

replaceOnce(
  'recalculation taxonomy counts',
  `  for (const item of report.findings) if (item.severity in report.severityCounts) report.severityCounts[item.severity] += 1;
  report.tier = tier;`,
  `  for (const item of report.findings) if (item.severity in report.severityCounts) report.severityCounts[item.severity] += 1;
  report.taxonomyCounts = taxonomyCounts(report.findings);
  report.tier = tier;`,
);

replaceOnce(
  'summary open set',
  `  const open = report.findings.filter((item) => item.status === 'open' && ['critical', 'high', 'medium', 'low'].includes(item.severity));`,
  `  const open = report.findings.filter((item) => item.status === 'open' &&
    ['confirmed_vulnerability', 'potential_vulnerability', 'security_misconfiguration'].includes(item.findingClass));
  const hardening = report.findings.filter((item) => item.status === 'open' && item.findingClass === 'hardening_recommendation');`,
);

replaceOnce(
  'summary wording',
  `  if (!open.length) {
    sentences.push('Pentor found no actionable issue within the tested public surface.');
  } else if (!serious) {
    sentences.push(\`No critical or high-risk issue was confirmed. Pentor found ${'${issueParts.join(\' and \')}'} issue${'${open.length === 1 ? \'\' : \'s\'}'} that should be reviewed.\`);
  } else {
    sentences.push(\`Pentor found ${'${issueParts.join(\', \')}'} issue${'${open.length === 1 ? \'\' : \'s\'}'}. Address the critical and high-priority findings first.\`);
  }`,
  `  const confirmed = open.filter((item) => item.findingClass === 'confirmed_vulnerability').length;
  const potential = open.filter((item) => item.findingClass === 'potential_vulnerability').length;
  const misconfigurations = open.filter((item) => item.findingClass === 'security_misconfiguration').length;
  if (!open.length) {
    sentences.push('Pentor found no confirmed or potential vulnerability within the tested public surface.');
  } else {
    const classes = [
      confirmed ? \`${'${confirmed}'} confirmed vulnerabilit${'${confirmed === 1 ? \'y\' : \'ies\'}'}\` : '',
      potential ? \`${'${potential}'} signal${'${potential === 1 ? \'\' : \'s\'}'} requiring validation\` : '',
      misconfigurations ? \`${'${misconfigurations}'} security misconfiguration${'${misconfigurations === 1 ? \'\' : \'s\'}'}\` : '',
    ].filter(Boolean);
    sentences.push(\`Pentor identified ${'${classes.join(\', \')}'}. Severity reflects technical impact; taxonomy reflects evidence strength.\`);
  }
  if (hardening.length) sentences.push(\`${'${hardening.length}'} additional hardening recommendation${'${hardening.length === 1 ? \' was\' : \'s were\'}'} identified; these are not classified as confirmed vulnerabilities.\`);`,
);

replaceOnce(
  'free preview actionable and locked data',
  `  const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
  const actionable = fullReport.findings
    .filter((item) => item.status === 'open' && severityRank[item.severity])
    .sort((left, right) => severityRank[right.severity] - severityRank[left.severity]);
  const visibleFindings = fullReport.findings.filter((item) =>
    item.status !== 'open' || !severityRank[item.severity]
  );
  const locked = actionable.map((item, index) => ({
    id: \`LOCKED-${'${index + 1}'}\`,
    severity: item.severity,
    section: /^(?:DATA|INJ|TOOL|RLS)-/i.test(item.id) || /database|injection|row-level security|public database/i.test(item.category)
      ? 'database'
      : 'network',
  }));`,
  `  const severityRank = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
  const lockableClasses = new Set(['confirmed_vulnerability', 'potential_vulnerability', 'security_misconfiguration', 'hardening_recommendation']);
  const actionable = fullReport.findings
    .filter((item) => item.status === 'open' && lockableClasses.has(item.findingClass))
    .sort((left, right) => {
      const classRank = { confirmed_vulnerability: 4, potential_vulnerability: 3, security_misconfiguration: 2, hardening_recommendation: 1 };
      return (classRank[right.findingClass] - classRank[left.findingClass]) || (severityRank[right.severity] - severityRank[left.severity]);
    });
  const visibleFindings = fullReport.findings.filter((item) => !actionable.includes(item));
  const locked = actionable.map((item, index) => {
    const preview = previewForFinding(item);
    return {
      id: \`LOCKED-${'${index + 1}'}\`, severity: item.severity, findingClass: item.findingClass,
      section: preview.section, previewTitle: preview.title, previewText: preview.text,
    };
  });`,
);

replaceOnce(
  'free preview summary terminology',
  `  const riskSentence = issueCount
    ? \`The scan found ${'${issueParts.join(\', \')}'} issue${'${issueCount === 1 ? \'\' : \'s\'}'} within the tested public surface.\`
    : 'No actionable issue was found within the tested public surface.';
  const lockSentence = locked.length
    ? \`${'${locked.length}'} actionable finding${'${locked.length === 1 ? \' is\' : \'s are\'}'} shown by severity below; unlock the full Pro report to view the affected areas, evidence, business impact and remediation steps.\`
    : 'All findings detected by this scan are shown below.';`,
  `  const taxonomy = fullReport.taxonomyCounts || taxonomyCounts(fullReport.findings);
  const materialCount = taxonomy.confirmed_vulnerability + taxonomy.potential_vulnerability + taxonomy.security_misconfiguration;
  const riskSentence = materialCount
    ? \`The scan identified ${'${taxonomy.confirmed_vulnerability}'} confirmed, ${'${taxonomy.potential_vulnerability}'} validation-required, and ${'${taxonomy.security_misconfiguration}'} misconfiguration observation(s).\`
    : 'No confirmed or potential vulnerability was identified within the tested public surface.';
  const hardeningSentence = taxonomy.hardening_recommendation
    ? \` ${'${taxonomy.hardening_recommendation}'} hardening recommendation${'${taxonomy.hardening_recommendation === 1 ? \' was\' : \'s were\'}'} also identified.\`
    : '';
  const lockSentence = locked.length
    ? \`${'${locked.length}'} security observation${'${locked.length === 1 ? \' is\' : \'s are\'}'} summarized below; unlock the full report for evidence, affected areas and remediation.\`
    : 'All detected observations are shown below.';`,
);

replaceOnce(
  'free preview summary hardening sentence',
  `    summary: \`Pentor completed the standard Network, Application and Database checks used by Pro. ${'${riskSentence}'} ${'${lockSentence}'}\`,`,
  `    summary: \`Pentor completed the standard Network, Application and Database checks used by Pro. ${'${riskSentence}'}${'${hardeningSentence}'} ${'${lockSentence}'}\`,`,
);

replaceOnce(
  'SPF missing classification severity',
  "hasSpf ? 'passed' : 'low'",
  "hasSpf ? 'passed' : 'info'",
);

replaceOnce(
  'DMARC missing classification severity',
  "hasDmarc ? 'passed' : 'medium'",
  "hasDmarc ? 'passed' : (mx.length ? 'low' : 'info')",
);

await writeFile(path, source);
console.log('[PENTOR] Evidence-based finding taxonomy patch applied.');
