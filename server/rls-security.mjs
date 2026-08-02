const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;

function decodeJwt(token) {
  try { return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')); } catch { return null; }
}

export function validateRlsConfig(config) {
  if (!config) return null;
  const url = new URL(config.supabaseUrl);
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) throw new Error('RLS test requires an HTTPS Supabase project URL.');
  const anon = decodeJwt(config.anonKey);
  const userA = decodeJwt(config.userAToken);
  const userB = decodeJwt(config.userBToken);
  if (!anon || ['service_role', 'supabase_admin'].includes(anon.role)) throw new Error('RLS test rejects service-role and administrator keys.');
  if (!userA?.sub || !userB?.sub || userA.sub === userB.sub) throw new Error('RLS test requires two distinct authenticated test-user tokens.');
  const tables = (Array.isArray(config.tables) ? config.tables : []).slice(0, 5).map((item) => {
    if (!IDENTIFIER.test(item.table) || !IDENTIFIER.test(item.idColumn || 'id')) throw new Error('Invalid RLS table or identifier column.');
    return { table: item.table, idColumn: item.idColumn || 'id', expectedPrivate: item.expectedPrivate !== false };
  });
  if (!tables.length) throw new Error('RLS test requires at least one table.');
  return { supabaseUrl: url.origin, anonKey: config.anonKey, userAToken: config.userAToken, userBToken: config.userBToken, tables };
}

async function rest(config, table, query, token) {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: { apikey: config.anonKey, Authorization: `Bearer ${token}`, Accept: 'application/json', Range: '0-4' },
  });
  let rows = [];
  try { rows = JSON.parse(await response.text()); } catch { /* Never retain raw response data. */ }
  return { status: response.status, rows: Array.isArray(rows) ? rows : [] };
}

export async function runRlsIsolationScan(rawConfig, makeFinding) {
  const config = validateRlsConfig(rawConfig);
  if (!config) return { findings: [], coverage: null };
  const findings = [];
  const coverage = { provider: 'Supabase', tables: config.tables.length, checked: 0, crossUserLeaks: 0, anonymousLeaks: 0, mode: 'read-only' };
  for (const spec of config.tables) {
    const column = encodeURIComponent(spec.idColumn);
    const ownerView = await rest(config, spec.table, `select=${column}&limit=1`, config.userAToken);
    if (!ownerView.rows.length) {
      findings.push(makeFinding(`RLS-${spec.table}-EMPTY`, `RLS coverage unavailable for ${spec.table}`, 'info', spec.table,
        `Test user A could not observe a row in ${spec.table}; Pentor made no cross-user authorization claim.`,
        'Isolation cannot be evaluated without a dedicated row owned by the test principal.',
        'Create a non-production fixture owned by test user A and rerun Advanced RLS.', 'Row-level security'));
      continue;
    }
    const id = ownerView.rows[0][spec.idColumn];
    if (id == null) continue;
    coverage.checked += 1;
    const filter = `${column}=eq.${encodeURIComponent(String(id))}&select=${column}&limit=1`;
    const [otherUser, anonymous] = await Promise.all([rest(config, spec.table, filter, config.userBToken), rest(config, spec.table, filter, config.anonKey)]);
    const crossLeak = spec.expectedPrivate && otherUser.rows.length > 0;
    const anonymousLeak = spec.expectedPrivate && anonymous.rows.length > 0;
    if (crossLeak || anonymousLeak) {
      coverage.crossUserLeaks += Number(crossLeak);
      coverage.anonymousLeaks += Number(anonymousLeak);
      findings.push(makeFinding(`RLS-${spec.table}-001`, `Potential RLS isolation failure on ${spec.table}`, 'critical', spec.table,
        `A row selected by test user A was also visible to ${[crossLeak ? 'test user B' : '', anonymousLeak ? 'the anonymous role' : ''].filter(Boolean).join(' and ')}. Pentor retained only status and row count.`,
        'A missing or broad SELECT policy may expose one tenant’s records to another user or the public.',
        `Enable RLS on ${spec.table}, scope SELECT policies to auth.uid() or tenant membership, add pgTAP tests, and rerun Pentor.`, 'Row-level security'));
    } else {
      findings.push(makeFinding(`RLS-${spec.table}-000`, `RLS read isolation held for ${spec.table}`, 'passed', spec.table,
        'A row visible to test user A was not returned to test user B or the anonymous role.',
        'Cross-user read isolation is a core tenant-security boundary.',
        'Maintain policy regression tests and test write operations in disposable staging.', 'Row-level security', true));
    }
  }
  return { findings, coverage };
}
