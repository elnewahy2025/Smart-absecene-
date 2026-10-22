#!/usr/bin/env node
import 'dotenv/config';

const APP = 'http://127.0.0.1:5051';
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key';
const password = process.env.EMULATOR_SEED_PASSWORD;

const users = {
  owner: 'owner@smartschool.platform',
  admin: 'principal@andalus-school.edu.sa',
  registrar: 'counselor@andalus-school.edu.sa',
  teacher: 'fahad.teacher@andalus-school.edu.sa',
  parent: 'parent1@example.com',
};

async function tokenFor(email) {
  const res = await fetch(AUTH, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!res.ok) throw new Error(`sign-in failed for ${email}: ${res.status}`);
  const body = await res.json();
  return body.idToken;
}

const cases = [
  { name: 'students create', method: 'POST', path: '/api/students', body: {}, allow: ['admin', 'registrar'] },
  { name: 'students import', method: 'POST', path: '/api/students/import', body: {}, allow: ['admin', 'registrar'] },
  { name: 'student delete', method: 'DELETE', path: '/api/students/std-does-not-exist', allow: ['admin'] },
  { name: 'student transfer', method: 'POST', path: '/api/students/std-does-not-exist/transfer', body: {}, allow: ['admin', 'registrar'] },
  { name: 'user create', method: 'POST', path: '/api/users', body: {}, allow: ['admin', 'registrar'] },
  { name: 'user patch', method: 'PATCH', path: '/api/users/uid-does-not-exist', body: {}, allow: ['admin', 'registrar'] },
  { name: 'user delete', method: 'DELETE', path: '/api/users/uid-does-not-exist', allow: ['admin'] },
  { name: 'ai config read', method: 'GET', path: '/api/tenant/ai-config', allow: ['admin'] },
  { name: 'messaging gateway read', method: 'GET', path: '/api/settings/messaging-gateway', allow: ['owner'] },
  { name: 'messaging gateway write', method: 'PUT', path: '/api/settings/messaging-gateway', body: {}, allow: ['owner'] },
  { name: 'tenant provision', method: 'POST', path: '/api/tenants/provision', body: {}, allow: ['owner'] },
  { name: 'subscription read', method: 'GET', path: '/api/tenants/school-1/subscription', allow: ['owner'] },
  { name: 'pdf generate', method: 'POST', path: '/api/pdf/generate', body: {}, allow: ['admin', 'registrar', 'teacher'] },
  { name: 'notification dispatch empty', method: 'POST', path: '/api/notifications/dispatch', body: {}, allow: ['admin', 'registrar'] },
  { name: 'image analyze empty', method: 'POST', path: '/api/analyze-image', body: {}, allow: ['admin', 'registrar', 'teacher'] },
  { name: 'digest briefing denial probe', method: 'POST', path: '/api/daily-digest/generate-briefing', body: {}, denyOnly: ['teacher', 'parent'] },
];

const tokens = {};
for (const [role, email] of Object.entries(users)) tokens[role] = await tokenFor(email);
const ownerToken = tokens.owner;

async function call(method, path, body, token) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(APP + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, code: json?.code, error: json?.error };
}

const rows = [];
for (const testCase of cases) {
  for (const role of Object.keys(users)) {
    if (testCase.denyOnly && !testCase.denyOnly.includes(role)) continue;
    const result = await call(testCase.method, testCase.path, testCase.body, tokens[role]);
    let pass;
    if (testCase.allow) {
      const permitted = role === 'owner' || testCase.allow.includes(role);
      pass = permitted
        ? result.status !== 401 && result.status !== 403
        : result.status === 403;
    } else {
      pass = result.status === 403;
    }
    rows.push({ case: testCase.name, role, expected: testCase.allow ? ((role === 'owner' || testCase.allow.includes(role)) ? 'allowed' : 'denied') : 'denied', status: result.status, code: result.code, pass });
  }
}

const anon = [];
for (const testCase of cases.filter((c) => !c.denyOnly)) {
  const result = await call(testCase.method, testCase.path, testCase.body, null);
  anon.push({ case: testCase.name, role: 'anonymous', expected: '401', status: result.status, pass: result.status === 401 });
}

const isolation = [];
isolation.push({
  case: 'admin cross-tenant body tenantId',
  ...(await call('POST', '/api/students', { tenantId: 'school-2' }, tokens.admin)),
  expected: 403,
  pass: (await call('POST', '/api/students', { tenantId: 'school-2' }, tokens.admin)).status === 403,
});
isolation.push({
  case: 'admin cross-tenant query tenant',
  ...(await call('GET', '/api/tenant/ai-config?tenant=school-2', undefined, tokens.admin)),
  expected: 403,
  pass: (await call('GET', '/api/tenant/ai-config?tenant=school-2', undefined, tokens.admin)).status === 403,
});
isolation.push({
  case: 'owner cross-tenant query tenant',
  ...(await call('GET', '/api/tenant/ai-config?tenant=school-2', undefined, ownerToken)),
  expected: 'not 403',
  pass: (await call('GET', '/api/tenant/ai-config?tenant=school-2', undefined, ownerToken)).status !== 403,
});

const failures = [...rows, ...anon, ...isolation].filter((r) => !r.pass);
const report = { app: APP, executedAt: new Date().toISOString(), rows, anon, isolation, failures: failures.length };
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
