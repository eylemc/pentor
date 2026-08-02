const DATABASE_ERRORS = [
  ['PostgreSQL', /(?:SQLSTATE\[[0-9A-Z]+\]|syntax error at or near|pg_query\(|Postgres(?:QL)? error)/i],
  ['MySQL/MariaDB', /(?:you have an error in your sql syntax|mysql_fetch|mysqli?_(?:query|fetch)|MariaDB server version)/i],
  ['Microsoft SQL Server', /(?:unclosed quotation mark after the character string|SQL Server Native Client|ODBC SQL Server|Microsoft OLE DB Provider for SQL Server)/i],
  ['Oracle', /(?:ORA-\d{5}|Oracle error|quoted string not properly terminated)/i],
  ['SQLite', /(?:SQLITE_ERROR|SQLite3?::|sqlite error|unrecognized token:)/i],
  ['MongoDB/NoSQL', /(?:MongoServerError|MongoError|BSONError|CastError: Cast to|unknown operator: \$)/i],
  ['Prisma ORM', /(?:PrismaClientKnownRequestError|PrismaClientValidationError|Invalid `prisma\.)/i],
  ['Generic database', /(?:database query failed|invalid query syntax|unterminated quoted string|JDBCException|Doctrine\\DBAL)/i],
];

const SKIP_PATH = /(?:logout|signout|delete|remove|destroy|checkout|payment|billing|unsubscribe|admin)/i;
const LIKELY_ID = /^(?:id|uid|user(?:id)?|account(?:id)?|product(?:id)?|item(?:id)?|order(?:id)?|record(?:id)?|page)$/i;
const LIKELY_FILTER = /^(?:id|uid|q|query|search|filter|where|sort|category|tag|name|email|username|status|type|page|limit|offset|cursor|user(?:id)?|account(?:id)?|product(?:id)?|item(?:id)?|order(?:id)?|record(?:id)?)$/i;
const DISCOVERY_PATHS = ['/openapi.json', '/swagger.json', '/api/openapi.json'];

function databaseErrors(body) {
  return DATABASE_ERRORS.filter(([, pattern]) => pattern.test(body)).map(([name]) => name);
}

function normalizeLength(body) {
  return body.replace(/\b\d{4}-\d\d?-\d\d?[^<\s]*/g, '').replace(/\b[0-9a-f]{16,}\b/gi, '').length;
}

function fingerprint(status, body, contentType) {
  return { status, length: normalizeLength(body), contentType: String(contentType || '').split(';')[0] };
}

function materiallyDifferent(left, right) {
  if (left.status !== right.status) return true;
  const largest = Math.max(left.length, right.length, 1);
  return Math.abs(left.length - right.length) >= Math.max(80, largest * 0.22);
}

function closeTo(left, right) {
  if (left.status !== right.status) return false;
  return Math.abs(left.length - right.length) <= Math.max(40, Math.max(left.length, right.length, 1) * 0.08);
}

function sameAuthorizedOrigin(candidate, domain) {
  return candidate.protocol === 'https:' && (candidate.hostname === domain || candidate.hostname === `www.${domain}` || `www.${candidate.hostname}` === domain);
}

function addCandidate(collection, raw, base, domain) {
  try {
    const candidate = new URL(raw, base);
    candidate.hash = '';
    if (!sameAuthorizedOrigin(candidate, domain) || SKIP_PATH.test(candidate.pathname) || !candidate.searchParams.size) return;
    const key = `${candidate.origin}${candidate.pathname}?${[...candidate.searchParams.keys()].sort().join('&')}`;
    if (!collection.has(key)) collection.set(key, candidate);
  } catch {
    // Ignore malformed page-provided URLs.
  }
}

function discoverCandidates(html, base, domain) {
  const candidates = new Map();
  const attributes = /\b(?:href|action)\s*=\s*["']([^"']+)["']/gi;
  const scriptCalls = /\b(?:fetch|axios\.(?:get|request))\s*\(\s*["'`]([^"'`]+)["'`]/gi;
  for (const pattern of [attributes, scriptCalls]) {
    for (const match of html.matchAll(pattern)) addCandidate(candidates, match[1], base, domain);
  }
  const forms = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  for (const match of html.matchAll(forms)) {
    const attributesText = match[1];
    const method = /\bmethod\s*=\s*["']?([^\s"'>]+)/i.exec(attributesText)?.[1]?.toLowerCase() || 'get';
    if (method !== 'get') continue;
    const action = /\baction\s*=\s*["']([^"']+)["']/i.exec(attributesText)?.[1] || base;
    try {
      const url = new URL(action, base);
      for (const input of match[2].matchAll(/\bname\s*=\s*["']([^"']+)["']/gi)) {
        if (!/^(?:csrf|token|authenticity)/i.test(input[1])) url.searchParams.set(input[1], 'pentor');
      }
      addCandidate(candidates, url.toString(), base, domain);
    } catch {
      // Ignore malformed form actions.
    }
  }
  return [...candidates.values()];
}

function discoveryUrls(html, base, domain) {
  const urls = new Map();
  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) {
    try {
      const url = new URL(match[1], base);
      url.hash = '';
      if (!sameAuthorizedOrigin(url, domain) || SKIP_PATH.test(url.pathname)) continue;
      const isAsset = /\.(?:js|mjs)(?:$|\?)/i.test(url.pathname);
      const isPage = !/\.(?:css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|pdf|zip)(?:$|\?)/i.test(url.pathname);
      if (isAsset || isPage) urls.set(url.toString(), url);
    } catch {
      // Ignore malformed links.
    }
  }
  return [...urls.values()];
}

function openApiCandidates(document, base, domain) {
  const candidates = [];
  if (!document || typeof document !== 'object' || !document.paths) return candidates;
  for (const [path, operations] of Object.entries(document.paths)) {
    const operation = operations?.get;
    if (!operation || SKIP_PATH.test(path) || path.includes('{')) continue;
    try {
      const url = new URL(path, base);
      const parameters = [...(operations.parameters || []), ...(operation.parameters || [])];
      for (const parameter of parameters) {
        if (parameter?.in !== 'query' || !parameter.name) continue;
        const schema = parameter.schema || {};
        const value = parameter.example ?? schema.example ?? schema.default ?? (schema.type === 'integer' ? '1' : 'pentor');
        url.searchParams.set(parameter.name, String(value));
      }
      if (url.searchParams.size && sameAuthorizedOrigin(url, domain)) candidates.push(url);
    } catch {
      // Ignore malformed OpenAPI paths.
    }
  }
  return candidates;
}

function candidateKey(candidate) {
  return `${candidate.origin}${candidate.pathname}?${[...candidate.searchParams.keys()].sort().join('&')}`;
}

async function expandDiscovery(homepage, domain, safeFetch, readLimitedText, signal) {
  const collection = new Map(discoverCandidates(homepage.body, `https://${domain}/`, domain).map((candidate) => [candidateKey(candidate), candidate]));
  let discoveryRequests = 0;
  for (const url of discoveryUrls(homepage.body, `https://${domain}/`, domain).slice(0, 6)) {
    try {
      const response = await snapshot(url, domain, safeFetch, readLimitedText, signal);
      discoveryRequests += 1;
      for (const candidate of discoverCandidates(response.body, url, domain)) collection.set(candidateKey(candidate), candidate);
    } catch {
      // Discovery failures do not become security findings.
    }
  }
  let openApiDocuments = 0;
  for (const path of DISCOVERY_PATHS) {
    try {
      const response = await snapshot(`https://${domain}${path}`, domain, safeFetch, readLimitedText, signal);
      discoveryRequests += 1;
      const document = JSON.parse(response.body);
      const candidates = openApiCandidates(document, `https://${domain}/`, domain);
      if (candidates.length) openApiDocuments += 1;
      for (const candidate of candidates) collection.set(candidateKey(candidate), candidate);
    } catch {
      // Missing or non-JSON API documents are expected.
    }
  }
  return { candidates: [...collection.values()], discoveryRequests, openApiDocuments };
}

function detectDataPlatforms(html) {
  const platforms = [];
  if (/https:\/\/[a-z0-9-]+\.supabase\.co/i.test(html) || /supabase-js/i.test(html)) platforms.push('Supabase');
  if (/(?:firebaseio\.com|firebaseapp\.com|firestore\.googleapis\.com)/i.test(html)) platforms.push('Firebase/Firestore');
  if (/(?:\/graphql\b|graphql-request|apollo-client)/i.test(html)) platforms.push('GraphQL');
  if (/(?:prisma|planetscale|neon\.tech)/i.test(html)) platforms.push('Managed SQL/ORM');
  return [...new Set(platforms)];
}

async function snapshot(url, domain, safeFetch, readLimitedText, signal) {
  if (signal?.aborted) throw new Error('Scan cancelled.');
  const response = await safeFetch(url, domain, { headers: { Accept: 'text/html,application/json;q=0.9,*/*;q=0.5' } });
  const contentType = response.headers.get('content-type') || '';
  const body = await readLimitedText(response, 96_000);
  return { body, errors: databaseErrors(body), fingerprint: fingerprint(response.status, body, contentType) };
}

function safeRecommendation(kind) {
  if (kind === 'error') return [
    '1. Reproduce the request in staging and identify the controller or API handler that consumes the affected parameter.',
    '2. Replace string-built queries with parameterized queries or the framework ORM query API.',
    '3. Apply server-side allowlist validation appropriate to the expected parameter type.',
    '4. Return a generic client error and keep database exceptions only in protected server logs.',
    '5. Add a regression test using quote and metacharacter inputs, deploy to staging, then rerun Pentor.',
  ].join('\n');
  return [
    '1. Reproduce the response difference in staging with database query logging enabled.',
    '2. Confirm that the parameter is bound as data rather than concatenated into a query or ORM filter.',
    '3. Enforce a strict server-side type and allowlist for the parameter.',
    '4. Add true/false differential regression tests and verify both receive equivalent authorization checks.',
    '5. Deploy the fix to staging and rerun Pentor before production release.',
  ].join('\n');
}

function finalize(findings, coverage) {
  for (const item of findings) {
    if (!item.references?.length || item.references[0] === 'Pentor Free Scan v1') {
      item.references = ['Pentor Data & Injection Security v1'];
    }
  }
  return { findings, coverage };
}

export async function runDataSecurityScan({ domain, tier, safeFetch, readLimitedText, makeFinding, signal, onProgress = () => {} }) {
  const findings = [];
  const homepage = await snapshot(`https://${domain}/`, domain, safeFetch, readLimitedText, signal);
  const platforms = detectDataPlatforms(homepage.body);
  const expanded = tier === 'free'
    ? { candidates: discoverCandidates(homepage.body, `https://${domain}/`, domain), discoveryRequests: 0, openApiDocuments: 0 }
    : await expandDiscovery(homepage, domain, safeFetch, readLimitedText, signal);
  const discovered = expanded.candidates;
  const limits = tier === 'advanced'
    ? { candidates: 10, parametersPerCandidate: 3, booleanChecks: 8, noSqlChecks: 10, quoteVariants: ["'", '"'] }
    : tier === 'pro'
      ? { candidates: 8, parametersPerCandidate: 3, booleanChecks: 6, noSqlChecks: 8, quoteVariants: ["'", '"'] }
      : { candidates: 1, parametersPerCandidate: 1, booleanChecks: 0, noSqlChecks: 0, quoteVariants: ["'"] };

  if (platforms.length) {
    findings.push(makeFinding('DATA-TECH-001', `${platforms.join(', ')} data technology signal detected`, 'info', 'Public application surface',
      `Public application content contained implementation signals associated with: ${platforms.join(', ')}. No credentials or secret values were retained.`,
      'Technology context helps select relevant data-security controls but is not itself a vulnerability.',
      'Review this fingerprint if the application data architecture changes.', 'Data and injection security'));
  }

  if (homepage.errors.length) {
    findings.push(makeFinding('DATA-ERR-001', 'Database error details exposed on public page', 'medium', `https://${domain}/`,
      `The normal public response exposed ${homepage.errors.join(', ')} error characteristics. Pentor did not retain response contents.`,
      'Database and ORM errors can reveal implementation details that make injection and targeted exploitation easier.',
      'Return generic client errors, retain detailed exceptions only in protected server logs, and review the failing query path.', 'Data and injection security'));
  } else {
    findings.push(makeFinding('DATA-ERR-001', 'No database error leakage observed on the main page', 'passed', `https://${domain}/`,
      'The main public response did not contain recognized SQL, NoSQL, or ORM exception signatures.',
      'Suppressing backend exceptions reduces reconnaissance value.', 'Maintain generic production error handling and protected server-side logging.',
      'Data and injection security', true));
  }

  const candidates = discovered.slice(0, limits.candidates);
  let requests = 1 + expanded.discoveryRequests;
  let parametersTested = 0;
  let errorSignals = 0;
  let booleanSignals = 0;
  let booleanChecksRun = 0;
  let noSqlChecksRun = 0;
  let noSqlEligible = 0;
  let noSqlSignals = 0;
  let quoteChecksRun = 0;
  const tierId = tier.toUpperCase();
  onProgress('Testing public data inputs with safe probes');

  for (const candidate of candidates) {
    if (signal?.aborted) throw new Error('Scan cancelled.');
    let baseline;
    try {
      baseline = await snapshot(candidate, domain, safeFetch, readLimitedText, signal);
      requests += 1;
    } catch {
      continue;
    }
    for (const [parameter, original] of [...candidate.searchParams.entries()].slice(0, limits.parametersPerCandidate)) {
      parametersTested += 1;
      for (const quoteCharacter of limits.quoteVariants) {
        const quoteUrl = new URL(candidate);
        quoteUrl.searchParams.set(parameter, `${original}${quoteCharacter}`);
        try {
          const quote = await snapshot(quoteUrl, domain, safeFetch, readLimitedText, signal);
          await new Promise((resolve) => setTimeout(resolve, 120));
          const quoteConfirmation = await snapshot(quoteUrl, domain, safeFetch, readLimitedText, signal);
          requests += 2;
          quoteChecksRun += 1;
          const newErrors = quote.errors.filter((name) => !baseline.errors.includes(name) && quoteConfirmation.errors.includes(name));
          if (newErrors.length) {
            errorSignals += 1;
            findings.push(makeFinding(`INJ-${tierId}-ERR-${errorSignals}`, 'Potential error-based injection detected', 'high', `${candidate.pathname}?${parameter}=…`,
              `A non-destructive ${quoteCharacter === "'" ? 'single' : 'double'}-quote probe introduced a repeatable ${newErrors.join(', ')} error characteristic that was absent from the baseline response. Status ${baseline.fingerprint.status} changed to ${quote.fingerprint.status}; no database content was retrieved or retained.`,
              'Input reaching a database or ORM interpreter without safe binding may permit unauthorized data access or modification.',
              safeRecommendation('error'), 'Data and injection security'));
            findings.at(-1).references = ['OWASP WSTG - Testing for SQL Injection', 'OWASP Top 10:2025 A05 Injection'];
            break;
          }
        } catch {
          // A network or application failure alone is not injection evidence.
        }
      }

      if (limits.booleanChecks && booleanChecksRun < limits.booleanChecks && (LIKELY_FILTER.test(parameter) || /^\d+$/.test(original))) {
        try {
          const truthyUrl = new URL(candidate);
          const falseyUrl = new URL(candidate);
          const numeric = LIKELY_ID.test(parameter) && /^\d+$/.test(original);
          truthyUrl.searchParams.set(parameter, numeric ? `${original} AND 1=1` : `${original}' AND '1'='1`);
          falseyUrl.searchParams.set(parameter, numeric ? `${original} AND 1=2` : `${original}' AND '1'='2`);
          const truthy = await snapshot(truthyUrl, domain, safeFetch, readLimitedText, signal);
          await new Promise((resolve) => setTimeout(resolve, 120));
          const falsey = await snapshot(falseyUrl, domain, safeFetch, readLimitedText, signal);
          await new Promise((resolve) => setTimeout(resolve, 120));
          const confirmation = await snapshot(falseyUrl, domain, safeFetch, readLimitedText, signal);
          requests += 3;
          booleanChecksRun += 1;
          if (closeTo(baseline.fingerprint, truthy.fingerprint) && materiallyDifferent(truthy.fingerprint, falsey.fingerprint) &&
              materiallyDifferent(truthy.fingerprint, confirmation.fingerprint) && closeTo(falsey.fingerprint, confirmation.fingerprint)) {
            booleanSignals += 1;
            const item = makeFinding(`INJ-${tierId}-BOOL-${booleanSignals}`, 'Potential boolean-based injection behavior', 'medium', `${candidate.pathname}?${parameter}=…`,
              `Two controlled true/false comparisons produced a repeatable response differential for numeric parameter ${parameter}. Pentor compared status and normalized response length only; no response data was retained.`,
              'A repeatable boolean differential can indicate that user input influences a backend query, but manual validation is required before treating it as confirmed injection.',
              safeRecommendation('boolean'), 'Data and injection security');
            item.confidence = 'Medium';
            item.references = ['OWASP WSTG - Testing for SQL Injection'];
            findings.push(item);
          }
        } catch {
          // Do not convert timeouts or transient failures into findings.
        }
      }

      const isNoSqlEligible = LIKELY_FILTER.test(parameter) || /^\d+$/.test(original);
      if (tier !== 'free' && isNoSqlEligible) noSqlEligible += 1;
      if (limits.noSqlChecks && noSqlChecksRun < limits.noSqlChecks && isNoSqlEligible) {
        try {
          const operatorUrl = new URL(candidate);
          const controlUrl = new URL(candidate);
          operatorUrl.searchParams.delete(parameter);
          controlUrl.searchParams.delete(parameter);
          operatorUrl.searchParams.set(`${parameter}[$ne]`, '__pentor_nonexistent__');
          controlUrl.searchParams.set(`${parameter}[$pentor_invalid]`, '__pentor_nonexistent__');
          const operator = await snapshot(operatorUrl, domain, safeFetch, readLimitedText, signal);
          await new Promise((resolve) => setTimeout(resolve, 120));
          const control = await snapshot(controlUrl, domain, safeFetch, readLimitedText, signal);
          await new Promise((resolve) => setTimeout(resolve, 120));
          const confirmation = await snapshot(operatorUrl, domain, safeFetch, readLimitedText, signal);
          requests += 3;
          noSqlChecksRun += 1;
          if (materiallyDifferent(baseline.fingerprint, operator.fingerprint) && materiallyDifferent(control.fingerprint, operator.fingerprint) && closeTo(operator.fingerprint, confirmation.fingerprint)) {
            noSqlSignals += 1;
            const item = makeFinding(`INJ-${tierId}-NOSQL-${noSqlSignals}`, 'Potential NoSQL operator injection behavior', 'medium', `${candidate.pathname}?${parameter}=…`,
              `A controlled $ne-style operator probe produced a repeatable response differential that was not reproduced by an invalid control operator. Pentor compared response metadata only and did not retain returned records.`,
              'Unsafe parsing of user-controlled query operators can alter database filters and authorization behavior.',
              safeRecommendation('boolean'), 'Data and injection security');
            item.confidence = 'Medium';
            item.references = ['OWASP WSTG - Testing for NoSQL Injection'];
            findings.push(item);
          }
        } catch {
          // Transient failures are not findings.
        }
      }
    }
  }

  if (!errorSignals) {
    findings.push(makeFinding(`INJ-${tierId}-ERR-000`, 'No error-based injection signal observed', 'passed', domain,
      `${parametersTested} public parameter(s) across ${candidates.length} same-origin route(s) received controlled quote probes. No new database or ORM error signature was observed.`,
      'This reduces evidence of simple error-based injection but does not prove that every authenticated or hidden input is secure.',
      'Continue using parameterized queries, strict server-side validation, and authenticated testing for protected routes.', 'Data and injection security', true));
  }
  if (tier !== 'free' && !booleanSignals) {
    findings.push(makeFinding(`INJ-${tierId}-BOOL-000`, 'No repeatable boolean injection differential observed', 'passed', domain,
      `Eligible numeric identifier parameters were tested within a strict request budget; ${booleanSignals} repeatable differential signal(s) were validated.`,
      'No public boolean-based injection signal was confirmed within the observed surface.',
      'For broader coverage, provide a staging target, OpenAPI definition, and dedicated test accounts.', 'Data and injection security', true));
  }
  if (tier !== 'free' && !noSqlSignals) {
    findings.push(makeFinding(`INJ-${tierId}-NOSQL-000`, 'No repeatable NoSQL operator injection differential observed', 'passed', domain,
      `${noSqlChecksRun} eligible public input(s) received controlled operator and invalid-control comparisons; no repeatable NoSQL-style filter differential was confirmed.`,
      'No public NoSQL operator-injection signal was confirmed within the observed surface.',
      'Continue rejecting user-controlled query operators and enforce server-side filter schemas.', 'Data and injection security', true));
  }
  if (!candidates.length) {
    findings.push(makeFinding('DATA-SCOPE-002', 'No public parameterized routes discovered', 'info', domain,
      'The public landing page did not expose same-origin GET routes with query parameters. Pentor did not guess or brute-force hidden application routes.',
      'Client-side, authenticated, or undocumented APIs may still expose data inputs.',
      'Provide an OpenAPI document or authenticated test account for deeper Pro coverage.', 'Data and injection security'));
  }

  return finalize(findings, {
    tier, discovered: discovered.length, tested: parametersTested, requests, platforms, errorSignals, booleanSignals, noSqlSignals,
    quoteChecks: quoteChecksRun, booleanChecks: booleanChecksRun, noSqlChecks: noSqlChecksRun, noSqlEligible,
    discoveryRequests: expanded.discoveryRequests, openApiDocuments: expanded.openApiDocuments,
    toolTargets: candidates.map((candidate) => candidate.toString()),
  });
}
