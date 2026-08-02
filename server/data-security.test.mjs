import test from 'node:test';
import assert from 'node:assert/strict';
import { runDataSecurityScan } from './data-security.mjs';

function makeFinding(id, title, severity, affectedArea, observed, impact, recommendation, category, passed = false) {
  return { id, title, severity, affectedArea, observed, impact, recommendation, category, confidence: 'High', status: passed ? 'fixed' : 'open', references: [] };
}

const readLimitedText = (response) => response.text();

test('Free data scan safely probes one public parameter', async () => {
  let requests = 0;
  const safeFetch = async () => {
    requests += 1;
    return new Response('<a href="/search?id=1">Search</a>');
  };
  const result = await runDataSecurityScan({ domain: 'example.com', tier: 'free', safeFetch, readLimitedText, makeFinding });
  assert.equal(requests, 4);
  assert.equal(result.coverage.tested, 1);
  assert.equal(result.coverage.quoteChecks, 1);
  assert.equal(result.coverage.booleanChecks, 0);
  assert.equal(result.coverage.noSqlChecks, 0);
  assert.ok(result.findings.some((item) => item.id === 'INJ-FREE-ERR-000'));
});

test('Pro scan reports a new database error caused by a safe quote probe', async () => {
  const safeFetch = async (input) => {
    const url = new URL(input);
    if (url.pathname === '/') return new Response('<a href="/search?id=1">Search</a>');
    if (url.searchParams.get('id')?.endsWith("'")) return new Response('SQLSTATE[42601] syntax error at or near quote', { status: 500 });
    return new Response('normal result');
  };
  const result = await runDataSecurityScan({ domain: 'example.com', tier: 'pro', safeFetch, readLimitedText, makeFinding });
  assert.equal(result.coverage.errorSignals, 1);
  assert.ok(result.findings.some((item) => item.id === 'INJ-PRO-ERR-1' && item.severity === 'high'));
});

test('Pro scan requires a repeatable boolean differential', async () => {
  const safeFetch = async (input) => {
    const url = new URL(input);
    if (url.pathname === '/') return new Response('<a href="/record?id=1">Record</a>');
    const value = url.searchParams.get('id') || '';
    if (value.includes('1=2')) return new Response('not-found'.repeat(80));
    return new Response('record-found');
  };
  const result = await runDataSecurityScan({ domain: 'example.com', tier: 'pro', safeFetch, readLimitedText, makeFinding });
  assert.equal(result.coverage.booleanSignals, 1);
  assert.ok(result.findings.some((item) => item.id === 'INJ-PRO-BOOL-1' && item.confidence === 'Medium'));
});

test('Pro scan validates a NoSQL operator differential against an invalid control', async () => {
  const safeFetch = async (input) => {
    const url = new URL(input);
    if (url.pathname === '/') return new Response('<a href="/search?q=books">Search</a>');
    if (url.searchParams.has('q[$ne]')) return new Response('expanded-result'.repeat(100));
    return new Response('normal-result');
  };
  const result = await runDataSecurityScan({ domain: 'example.com', tier: 'pro', safeFetch, readLimitedText, makeFinding });
  assert.equal(result.coverage.noSqlSignals, 1);
  assert.ok(result.findings.some((item) => item.id === 'INJ-PRO-NOSQL-1' && item.confidence === 'Medium'));
});

test('Pro scan does not treat an arbitrary numeric cache value as a NoSQL filter', async () => {
  const safeFetch = async (input) => {
    const url = new URL(input);
    if (url.pathname === '/') return new Response('<a href="/lookup?x=123">Lookup</a>');
    return new Response('normal-result');
  };
  const result = await runDataSecurityScan({ domain: 'example.com', tier: 'pro', safeFetch, readLimitedText, makeFinding });
  assert.equal(result.coverage.noSqlEligible, 0);
  assert.equal(result.coverage.noSqlChecks, 0);
});

test('Pro scan excludes versioned static assets from database input discovery', async () => {
  const safeFetch = async (input) => {
    const url = new URL(input);
    if (url.pathname === '/') {
      return new Response([
        '<link rel="icon" href="/favicon.ico?v=4">',
        '<img src="/apple-touch-icon.png?v=9">',
        '<script src="/app.js?v=12"></script>',
        '<a href="/search?q=books">Search</a>',
      ].join(''));
    }
    return new Response('normal-result');
  };
  const result = await runDataSecurityScan({ domain: 'example.com', tier: 'pro', safeFetch, readLimitedText, makeFinding });
  assert.equal(result.coverage.discovered, 1);
  assert.equal(result.coverage.tested, 1);
  assert.equal(result.coverage.noSqlChecks, 1);
  assert.equal(result.coverage.noSqlSignals, 0);
});
