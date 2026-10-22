import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:5051';
const AUTH_URL =
  __ENV.AUTH_URL ||
  'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key';
const EMAIL = __ENV.EMAIL || 'principal@andalus-school.edu.sa';
const PASSWORD = __ENV.PASSWORD || '';

const errors = new Rate('business_errors');
const apiLatency = new Trend('api_latency');

export const options = {
  scenarios: {
    smoke: {
      executor: 'per-vu-iterations',
      vus: Number(__ENV.VUS || 1),
      iterations: Number(__ENV.ITERATIONS || 1),
      maxDuration: '2m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
    business_errors: ['rate<0.05'],
  },
};

function login() {
  const res = http.post(
    AUTH_URL,
    JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
    { headers: { 'content-type': 'application/json' }, tags: { name: 'auth-login' } }
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  if (res.status !== 200) return null;
  return res.json('idToken');
}

export default function () {
  const publicTenants = http.get(`${BASE_URL}/api/tenants`, { tags: { name: 'public-tenants' } });
  check(publicTenants, {
    'tenants 200': (r) => r.status === 200,
    'tenants json': (r) => r.headers['Content-Type']?.includes('json'),
  });

  const health = http.get(`${BASE_URL}/api/health`, { tags: { name: 'health' } });
  check(health, { 'health 200': (r) => r.status === 200 });

  const token = login();
  if (!token) {
    errors.add(1);
    return;
  }

  const aiConfig = http.get(`${BASE_URL}/api/tenant/ai-config`, {
    headers: { authorization: `Bearer ${token}` },
    tags: { name: 'tenant-ai-config' },
  });
  apiLatency.add(aiConfig.timings.duration);
  const ok = check(aiConfig, {
    'ai-config not 5xx': (r) => r.status < 500,
    'ai-config not unauthorized': (r) => r.status !== 401,
  });
  if (!ok) errors.add(1);
  sleep(0.5);
}
