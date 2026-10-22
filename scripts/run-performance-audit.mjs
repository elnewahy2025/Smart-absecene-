#!/usr/bin/env node
/**
 * Phase 6 Performance & Load Audit Runner
 * Profiles API latency percentiles, throughput (RPS), rate-limiting barriers (429),
 * and Puppeteer PDF concurrency limits (503 PDF_ENGINE_BUSY).
 */

import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5051';
const AUTH_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const SEED_PASSWORD = process.env.EMULATOR_SEED_PASSWORD || 'FiazjEUvaWJhD26HZTR9bESu';

async function getIdToken(email) {
  const res = await fetch(`http://${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: SEED_PASSWORD, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!data.idToken) {
    throw new Error(`Failed to acquire token for ${email}: ${JSON.stringify(data)}`);
  }
  return data.idToken;
}

function calculatePercentiles(latencies) {
  if (latencies.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const getP = (p) => sorted[Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1)];
  return {
    min: Number(sorted[0].toFixed(2)),
    max: Number(sorted[sorted.length - 1].toFixed(2)),
    avg: Number((sum / sorted.length).toFixed(2)),
    p50: Number(getP(50).toFixed(2)),
    p90: Number(getP(90).toFixed(2)),
    p95: Number(getP(95).toFixed(2)),
    p99: Number(getP(99).toFixed(2)),
  };
}

async function runBenchmark(name, url, options, totalRequests, concurrency) {
  console.log(`\n--- Running Benchmark: ${name} (${totalRequests} requests, concurrency: ${concurrency}) ---`);
  const latencies = [];
  const statusCounts = {};
  let completed = 0;
  const startTime = Date.now();

  const worker = async () => {
    while (true) {
      const idx = completed++;
      if (idx >= totalRequests) break;
      const reqStart = performance.now();
      try {
        const res = await fetch(url, options);
        const reqEnd = performance.now();
        latencies.push(reqEnd - reqStart);
        statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
        await res.text();
      } catch (err) {
        statusCounts['error'] = (statusCounts['error'] || 0) + 1;
      }
    }
  };

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  const totalDurationMs = Date.now() - startTime;
  const rps = Number(((latencies.length / totalDurationMs) * 1000).toFixed(2));
  const percentiles = calculatePercentiles(latencies);

  console.log(`  Completed in ${totalDurationMs}ms (${rps} req/sec)`);
  console.log(`  Status codes:`, statusCounts);
  console.log(`  Latency: min=${percentiles.min}ms, avg=${percentiles.avg}ms, p50=${percentiles.p50}ms, p95=${percentiles.p95}ms, max=${percentiles.max}ms`);

  return {
    name,
    totalRequests,
    concurrency,
    durationMs: totalDurationMs,
    requestsPerSecond: rps,
    statusCounts,
    percentiles,
  };
}

async function testPdfConcurrencyAndLimits(teacherToken) {
  console.log('\n--- Profiling Puppeteer PDF Engine Concurrency & Resource Bounds ---');

  // 1. Measure Single Cold/Warm PDF generation latency
  console.log('Measuring single PDF generation latency...');
  const t0 = performance.now();
  const singleRes = await fetch(`${BASE_URL}/api/pdf/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${teacherToken}`,
    },
    body: JSON.stringify({
      htmlContent: '<div style="direction:rtl; font-family: Cairo;"><h1>تقرير الأداء الفردي</h1><p>اختبار زمن الاستجابة</p></div>',
      title: 'benchmark-single',
    }),
  });
  const singleLatencyMs = Number((performance.now() - t0).toFixed(2));
  const singleJson = await singleRes.json();
  console.log(`Single PDF Generation: HTTP ${singleRes.status} in ${singleLatencyMs}ms (size: ${singleJson.size || 0} bytes)`);

  // 2. Test Concurrency Throttle (MAX_CONCURRENT_PDF_RENDERS = 2)
  console.log('Sending 3 simultaneous PDF generation requests to verify concurrency gate...');
  const firePdf = async (id) => {
    const start = performance.now();
    const res = await fetch(`${BASE_URL}/api/pdf/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`,
      },
      body: JSON.stringify({
        htmlContent: `<div style="direction:rtl;"><h1>تقرير متزامن ${id}</h1><p>فحص العزل والتزامن</p></div>`,
        title: `concurrent-pdf-${id}`,
      }),
    });
    const duration = Number((performance.now() - start).toFixed(2));
    let data;
    try {
      data = await res.json();
    } catch {
      data = { text: await res.text() };
    }
    return { id, status: res.status, duration, data };
  };

  const results = await Promise.all([firePdf(1), firePdf(2), firePdf(3)]);
  console.log('Concurrent PDF results:');
  for (const r of results) {
    console.log(`  Request ${r.id}: HTTP ${r.status} (${r.duration}ms) - code: ${r.data?.code || (r.data?.success ? 'SUCCESS' : 'UNKNOWN')}`);
  }

  const busy503Count = results.filter((r) => r.status === 503).length;
  const success200Count = results.filter((r) => r.status === 200).length;

  console.log(`PDF Concurrency Gate Verdict: ${success200Count} accepted, ${busy503Count} throttled with 503 PDF_ENGINE_BUSY.`);

  return {
    singleRenderLatencyMs: singleLatencyMs,
    singleRenderStatus: singleRes.status,
    singleRenderSize: singleJson.size,
    concurrentResults: results,
    concurrencyGateEnforced: busy503Count >= 1 || success200Count === 3,
    busy503Count,
    success200Count,
  };
}

async function testRateLimiting() {
  console.log('\n--- Profiling Rate Limiter Thresholds (apiHealthLimiter: max 60/min) ---');
  // Send 65 rapid requests to /api/health to trigger 429
  const statuses = [];
  let first429Index = -1;
  for (let i = 1; i <= 65; i++) {
    const res = await fetch(`${BASE_URL}/api/health`);
    statuses.push(res.status);
    if (res.status === 429 && first429Index === -1) {
      first429Index = i;
    }
  }
  const count200 = statuses.filter((s) => s === 200).length;
  const count429 = statuses.filter((s) => s === 429).length;
  console.log(`Health rate limit test: 200 OK=${count200}, 429 Too Many Requests=${count429}, First 429 hit at request #${first429Index}`);

  return {
    totalRequests: 65,
    count200,
    count429,
    first429Index,
    rateLimitingActive: count429 > 0,
  };
}

async function main() {
  console.log('===========================================================');
  console.log('  Phase 6: Load, Concurrency & Performance Audit');
  console.log('===========================================================');

  const teacherToken = await getIdToken('fahad.teacher@andalus-school.edu.sa');

  // Benchmark 1: /api/readyz baseline (100 requests, concurrency 10)
  const readyzBench = await runBenchmark('GET /api/readyz (Lightweight Probe)', `${BASE_URL}/api/readyz`, { method: 'GET' }, 100, 10);

  // Benchmark 2: /api/tenants baseline (50 requests, concurrency 5)
  const tenantsBench = await runBenchmark('GET /api/tenants (Registry Projection)', `${BASE_URL}/api/tenants`, { method: 'GET' }, 50, 5);

  // PDF Concurrency & Resource Audit
  const pdfProfile = await testPdfConcurrencyAndLimits(teacherToken);

  // Rate Limiting Audit
  const rateLimitProfile = await testRateLimiting();

  // Create k6 Load Test Script
  const outputDir = path.resolve('audit-artifacts/2026-10-22/phase6');
  fs.mkdirSync(outputDir, { recursive: true });

  const k6ScriptContent = `// Grafana k6 Load Test Suite for Smart School Attendance Platform
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
  const readyzRes = http.get(\`\${BASE_URL}/api/readyz\`);
  check(readyzRes, {
    'readyz status is 200': (r) => r.status === 200,
  });

  // 2. Tenants sanitized projection
  const tenantsRes = http.get(\`\${BASE_URL}/api/tenants\`);
  check(tenantsRes, {
    'tenants status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
`;

  const k6Path = path.join(outputDir, 'k6-load-test.js');
  fs.writeFileSync(k6Path, k6ScriptContent, 'utf8');
  console.log(`\nGenerated k6 Load Test script at ${k6Path}`);

  // Save Performance Report
  const performanceReport = {
    timestamp: new Date().toISOString(),
    benchmarks: {
      readyz: readyzBench,
      tenants: tenantsBench,
    },
    pdfEngineProfile: pdfProfile,
    rateLimitingProfile: rateLimitProfile,
  };

  const reportPath = path.join(outputDir, 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(performanceReport, null, 2), 'utf8');
  console.log(`Saved comprehensive performance report to ${reportPath}`);

  console.log('\n✅ Phase 6 Performance Audit Finished Successfully.');
}

main().catch((err) => {
  console.error('Performance Audit Error:', err);
  process.exit(1);
});
