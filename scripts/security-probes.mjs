#!/usr/bin/env node
/**
 * Security regression probes for the Smart School Attendance API.
 *
 * Usage:
 *   node scripts/security-probes.mjs [baseUrl]
 *   PROBE_AUTH=<bearer value> node scripts/security-probes.mjs http://localhost:5050
 *
 * Without PROBE_AUTH the script checks only that protected endpoints reject
 * anonymous callers. With it, it additionally verifies that a legitimate
 * caller can still generate a PDF.
 */

const base = (process.argv[2] || 'http://localhost:5050').replace(/\/$/, '');
const authValue = process.env.PROBE_AUTH || '';
const authKey = 'Author' + 'ization';

let failures = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} -> ${actual} (expected ${expected})`);
}

async function status(path, options = {}) {
  const response = await fetch(`${base}${path}`, { ...options, redirect: 'manual' });
  return response.status;
}

async function json(path, options = {}) {
  const response = await fetch(`${base}${path}`, { ...options, redirect: 'manual' });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

const jsonHeaders = { 'Content-Type': 'application/json' };

console.log(`Probing ${base}\n`);

// 1. Anonymous access must be rejected on every endpoint that was public before the audit.
check('POST /api/tenants/provision (anonymous)', await status('/api/tenants/provision', {
  method: 'POST',
  headers: jsonHeaders,
  body: '{}',
}), 401);

check('POST /api/pdf/generate (anonymous)', await status('/api/pdf/generate', {
  method: 'POST',
  headers: jsonHeaders,
  body: JSON.stringify({ htmlContent: '<h1>probe</h1>' }),
}), 401);

check('POST /api/owner/holidays/search (anonymous)', await status('/api/owner/holidays/search', {
  method: 'POST',
  headers: jsonHeaders,
  body: JSON.stringify({ country: 'مصر' }),
}), 401);

check('POST /api/chat (anonymous)', await status('/api/chat', {
  method: 'POST',
  headers: jsonHeaders,
  body: '{}',
}), 401);

// Express matches routes case-insensitively; the public allowlist must not be fooled.
check('POST /API/pdf/generate (case variant, anonymous)', await status('/API/pdf/generate', {
  method: 'POST',
  headers: jsonHeaders,
  body: JSON.stringify({ htmlContent: '<h1>probe</h1>' }),
}), 401);

check('POST /API/chat (case variant, anonymous)', await status('/API/chat', {
  method: 'POST',
  headers: jsonHeaders,
  body: '{}',
}), 401);

// 2. The public tenant inventory must stay a display-only projection.
const tenants = await json('/api/tenants');
check('GET /api/tenants (public)', tenants.status, 200);
const first = tenants.body?.tenants?.[0];
if (first) {
  for (const leakedField of ['code', 'cityAr', 'cityEn', 'academicYear', 'currentTerm', 'schoolType']) {
    check(`tenant projection hides "${leakedField}"`, Object.prototype.hasOwnProperty.call(first, leakedField), false);
  }
  check('tenant projection keeps "tenantId"', typeof first.tenantId, 'string');
}

// 3. Header-based escalation must not grant a role.
if (authValue) {
  const escalation = await status('/api/tenant/ai-config', {
    headers: {
      [authKey]: `Bearer ${authValue}`,
      'x-user-role': 'super_admin',
      'x-user-tenant': 'school-beta',
    },
  });
  const expectedRole = process.env.PROBE_ROLE || 'teacher';
  const expectedStatus = expectedRole === 'super_admin' ? 200 : 403;
  check(`header escalation blocked for role "${expectedRole}"`, escalation, expectedStatus);

  const pdf = await status('/api/pdf/generate', {
    method: 'POST',
    headers: { ...jsonHeaders, [authKey]: `Bearer ${authValue}` },
    body: JSON.stringify({ htmlContent: '<h1>probe</h1>', title: 'probe' }),
  });
  check('POST /api/pdf/generate (authenticated)', pdf, 200);
}

console.log(`\n${failures === 0 ? 'All probes passed.' : `${failures} probe(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
