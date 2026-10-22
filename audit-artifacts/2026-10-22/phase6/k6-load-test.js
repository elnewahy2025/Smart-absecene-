// Grafana k6 Load Test Suite for Smart School Attendance Platform
// Generated during Phase 6 Audit
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },  // Ramp-up to 20 VUs
    { duration: '30s', target: 50 },  // Sustain 50 VUs
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms
    http_req_failed: ['rate<0.05'],                 // Failure rate < 5%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5051';

export default function () {
  // 1. Readyz check
  const readyzRes = http.get(`${BASE_URL}/api/readyz`);
  check(readyzRes, {
    'readyz status is 200': (r) => r.status === 200,
  });

  // 2. Tenants sanitized projection
  const tenantsRes = http.get(`${BASE_URL}/api/tenants`);
  check(tenantsRes, {
    'tenants status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
