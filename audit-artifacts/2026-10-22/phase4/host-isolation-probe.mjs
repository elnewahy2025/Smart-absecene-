import 'dotenv/config';
import http from 'node:http';

const APP = { host: '127.0.0.1', port: 5051 };
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key';
const email = 'teacher2@falah-school.edu.sa';
const password = process.env.EMULATOR_SEED_PASSWORD;

const signIn = await fetch(AUTH, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email, password, returnSecureToken: true }),
});
if (!signIn.ok) throw new Error(`sign-in failed: ${signIn.status}`);
const { idToken } = await signIn.json();

function request({ method, path, host, body }) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const headers = { host };
  if (idToken) headers.authorization = `Bearer ${idToken}`;
  if (payload !== undefined) {
    headers['content-type'] = 'application/json';
    headers['content-length'] = Buffer.byteLength(payload);
  }
  return new Promise((resolve, reject) => {
    const req = http.request(
      { ...APP, method, path, headers },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(data); } catch {}
          resolve({ status: res.statusCode, code: json?.code, error: json?.error, body: json });
        });
      }
    );
    req.on('error', reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}

const cases = [
  {
    name: 'school-2 teacher on own host',
    method: 'POST',
    path: '/api/pdf/generate',
    host: 'falah.localhost',
    body: {},
    expectNotStatus: 403,
  },
  {
    name: 'school-2 teacher on school-1 host',
    method: 'POST',
    path: '/api/pdf/generate',
    host: 'andalus.localhost',
    body: {},
    expectStatus: 403,
  },
  {
    name: 'school-2 teacher querying school-1 tenant',
    method: 'POST',
    path: '/api/pdf/generate?tenant=school-1',
    host: 'falah.localhost',
    body: {},
    expectStatus: 403,
  },
  {
    name: 'school-2 teacher querying own tenant',
    method: 'POST',
    path: '/api/pdf/generate?tenant=school-2',
    host: 'falah.localhost',
    body: {},
    expectNotStatus: 403,
  },
];

const results = [];
for (const testCase of cases) {
  const result = await request(testCase);
  const pass = testCase.expectStatus
    ? result.status === testCase.expectStatus
    : result.status !== testCase.expectNotStatus;
  results.push({ ...testCase, status: result.status, code: result.code, error: result.error, pass });
  delete results.at(-1).body;
}

console.log(JSON.stringify({ app: APP, executedAt: new Date().toISOString(), results, failures: results.filter((r) => !r.pass).length }, null, 2));
if (results.some((r) => !r.pass)) process.exitCode = 1;
