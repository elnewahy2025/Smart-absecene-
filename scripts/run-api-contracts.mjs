#!/usr/bin/env node
/**
 * Phase 5 API Contract Testing Suite using Newman
 * Executes real requests against the live server using real emulator tokens.
 */

import fs from 'node:fs';
import path from 'node:path';
import newman from 'newman';

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

console.log('Acquiring real emulator ID tokens for Phase 5 Contract Tests...');
const teacherToken = await getIdToken('fahad.teacher@andalus-school.edu.sa');
const adminToken = await getIdToken('principal@andalus-school.edu.sa');
const ownerToken = await getIdToken('owner@smartschool.platform');
console.log('Tokens acquired successfully.');

const collection = {
  info: {
    name: 'Smart School Attendance API Contracts (Phase 5)',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  item: [
    // --- 1. Public Endpoints ---
    {
      name: '1.1 Public - GET /api/health',
      request: {
        method: 'GET',
        url: '{{baseUrl}}/api/health',
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
              'pm.test("Status is ok and services reporting", function () {',
              '  var json = pm.response.json();',
              '  pm.expect(json.status).to.eql("ok");',
              '  pm.expect(json.services.firebaseAdmin).to.be.true;',
              '  pm.expect(json.services.pdfPuppeteer).to.be.true;',
              '});',
              'pm.test("Cache control headers enforced", function () {',
              '  pm.expect(pm.response.headers.get("Cache-Control")).to.include("no-store");',
              '});',
            ],
          },
        },
      ],
    },
    {
      name: '1.2 Public - GET /api/readyz',
      request: {
        method: 'GET',
        url: '{{baseUrl}}/api/readyz',
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
              'pm.test("Service ready", function () {',
              '  var json = pm.response.json();',
              '  pm.expect(json.status).to.eql("ready");',
              '});',
            ],
          },
        },
      ],
    },
    {
      name: '1.3 Public - GET /api/tenants (Sanitized Projection)',
      request: {
        method: 'GET',
        url: '{{baseUrl}}/api/tenants',
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
              'pm.test("Sanitized projection strips sensitive metadata", function () {',
              '  var json = pm.response.json();',
              '  pm.expect(json.tenants).to.be.an("array");',
              '  if (json.tenants.length > 0) {',
              '    var first = json.tenants[0];',
              '    pm.expect(first).to.have.property("tenantId");',
              '    pm.expect(first).to.not.have.property("code");',
              '    pm.expect(first).to.not.have.property("academicYear");',
              '  }',
              '});',
            ],
          },
        },
      ],
    },
    {
      name: '1.4 Public - GET /api/tenant/resolve',
      request: {
        method: 'GET',
        url: '{{baseUrl}}/api/tenant/resolve',
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
              'pm.test("Resolution payload schema", function () {',
              '  var json = pm.response.json();',
              '  pm.expect(json).to.have.property("status");',
              '});',
            ],
          },
        },
      ],
    },

    // --- 2. Negative Security Contracts ---
    {
      name: '2.1 Negative - POST /api/pdf/generate (Anonymous 401)',
      request: {
        method: 'POST',
        url: '{{baseUrl}}/api/pdf/generate',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: { mode: 'raw', raw: JSON.stringify({ htmlContent: '<h1>Unauthenticated</h1>' }) },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 401", function () { pm.response.to.have.status(401); });',
            ],
          },
        },
      ],
    },
    {
      name: '2.2 Negative - POST /api/chat (Anonymous 401)',
      request: {
        method: 'POST',
        url: '{{baseUrl}}/api/chat',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: { mode: 'raw', raw: JSON.stringify({ message: 'Hello AI' }) },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 401", function () { pm.response.to.have.status(401); });',
            ],
          },
        },
      ],
    },
    {
      name: '2.3 Negative - POST /api/users (Anonymous 401)',
      request: {
        method: 'POST',
        url: '{{baseUrl}}/api/users',
        header: [{ key: 'Content-Type', value: 'application/json' }],
        body: { mode: 'raw', raw: JSON.stringify({ email: 'test@school.com', role: 'teacher' }) },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 401", function () { pm.response.to.have.status(401); });',
            ],
          },
        },
      ],
    },
    {
      name: '2.4 Negative - POST /api/pdf/generate (Invalid Token 401)',
      request: {
        method: 'POST',
        url: '{{baseUrl}}/api/pdf/generate',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer invalid_tampered_token_xyz' },
        ],
        body: { mode: 'raw', raw: JSON.stringify({ htmlContent: '<h1>probe</h1>' }) },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 401", function () { pm.response.to.have.status(401); });',
            ],
          },
        },
      ],
    },

    // --- 3. RBAC & Escalation Denial Contracts ---
    {
      name: '3.1 RBAC - Teacher hitting Owner-only /api/tenants/provision (403)',
      request: {
        method: 'POST',
        url: '{{baseUrl}}/api/tenants/provision',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{teacherToken}}' },
        ],
        body: { mode: 'raw', raw: JSON.stringify({ tenantId: 'rogue-tenant' }) },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 403 Forbidden", function () { pm.response.to.have.status(403); });',
            ],
          },
        },
      ],
    },
    {
      name: '3.2 RBAC - Teacher hitting Owner-only /api/tenants/school-1/subscription (403)',
      request: {
        method: 'GET',
        url: '{{baseUrl}}/api/tenants/school-1/subscription',
        header: [
          { key: 'Authorization', value: 'Bearer {{teacherToken}}' },
        ],
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 403 Forbidden", function () { pm.response.to.have.status(403); });',
            ],
          },
        },
      ],
    },
    {
      name: '3.3 RBAC - Teacher with header injection x-user-role: super_admin blocked (403)',
      request: {
        method: 'POST',
        url: '{{baseUrl}}/api/tenant/ai-config',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{teacherToken}}' },
          { key: 'x-user-role', value: 'super_admin' },
        ],
        body: { mode: 'raw', raw: JSON.stringify({}) },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 403 Forbidden", function () { pm.response.to.have.status(403); });',
              'pm.test("Error message verifies role is teacher, ignoring injected header", function () {',
              '  var json = pm.response.json();',
              '  pm.expect(json.error).to.include("teacher");',
              '});',
            ],
          },
        },
      ],
    },

    // --- 4. Authenticated Valid Role Contracts ---
    {
      name: '4.1 Authenticated Teacher - POST /api/pdf/generate (200 Base64 JSON Payload)',
      request: {
        method: 'POST',
        url: '{{baseUrl}}/api/pdf/generate',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{teacherToken}}' },
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            htmlContent: '<!DOCTYPE html><html><body><h1>Contract Test PDF</h1></body></html>',
            title: 'contract-test',
          }),
        },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
              'pm.test("Payload contains valid base64 PDF and metadata", function () {',
              '  var json = pm.response.json();',
              '  pm.expect(json.success).to.be.true;',
              '  pm.expect(json.pdfBase64).to.be.a("string");',
              '  pm.expect(json.pdfBase64.length).to.be.above(100);',
              '  pm.expect(json).to.have.property("filename");',
              '});',
            ],
          },
        },
      ],
    },
    {
      name: '4.2 Authenticated Admin - POST /api/chat with empty body (400 Bad Request)',
      request: {
        method: 'POST',
        url: '{{baseUrl}}/api/chat',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{adminToken}}' },
        ],
        body: { mode: 'raw', raw: JSON.stringify({}) },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 400 Bad Request", function () { pm.response.to.have.status(400); });',
            ],
          },
        },
      ],
    },
    {
      name: '4.3 Authenticated Admin - POST /api/students input validation (400 Bad Request on empty)',
      request: {
        method: 'POST',
        url: '{{baseUrl}}/api/students',
        header: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Authorization', value: 'Bearer {{adminToken}}' },
        ],
        body: { mode: 'raw', raw: JSON.stringify({}) },
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 400 Bad Request", function () { pm.response.to.have.status(400); });',
            ],
          },
        },
      ],
    },
    {
      name: '4.4 Authenticated Owner - GET /api/tenants/school-1/subscription (200 Schema Valid)',
      request: {
        method: 'GET',
        url: '{{baseUrl}}/api/tenants/school-1/subscription',
        header: [
          { key: 'Authorization', value: 'Bearer {{ownerToken}}' },
        ],
      },
      event: [
        {
          listen: 'test',
          script: {
            exec: [
              'pm.test("Status code is 200 OK", function () { pm.response.to.have.status(200); });',
              'pm.test("Subscription schema fields present", function () {',
              '  var json = pm.response.json();',
              '  pm.expect(json.success).to.be.true;',
              '  pm.expect(json).to.have.property("subscription");',
              '  pm.expect(json).to.have.property("summary");',
              '  pm.expect(json.summary).to.have.property("plan");',
              '  pm.expect(json.summary).to.have.property("status");',
              '  pm.expect(json.summary).to.have.property("effectiveStatus");',
              '  pm.expect(json.summary).to.have.property("accessEnabled");',
              '});',
            ],
          },
        },
      ],
    },
  ],
};

const outputDir = path.resolve('audit-artifacts/2026-10-22/phase5');
fs.mkdirSync(outputDir, { recursive: true });
const collectionPath = path.join(outputDir, 'postman-collection.json');
fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');
console.log(`Saved Postman Collection to ${collectionPath}`);

console.log('Starting Newman API contract execution against ' + BASE_URL + '...');

newman.run(
  {
    collection,
    environment: {
      values: [
        { key: 'baseUrl', value: BASE_URL, enabled: true },
        { key: 'teacherToken', value: teacherToken, enabled: true },
        { key: 'adminToken', value: adminToken, enabled: true },
        { key: 'ownerToken', value: ownerToken, enabled: true },
      ],
    },
    reporters: ['cli'],
  },
  (err, summary) => {
    if (err) {
      console.error('Newman execution error:', err);
      process.exit(1);
    }
    const failures = summary.run.failures.length;
    console.log(`\nNewman Contract Execution Finished.`);
    console.log(`Executed: ${summary.run.stats.requests.total} requests`);
    console.log(`Assertions: ${summary.run.stats.assertions.total} total, ${failures} failed.`);

    const reportPath = path.join(outputDir, 'newman-summary.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          stats: summary.run.stats,
          failures: summary.run.failures.map((f) => ({
            name: f.source?.name,
            test: f.error?.test,
            message: f.error?.message,
          })),
        },
        null,
        2
      )
    );
    console.log(`Detailed summary saved to ${reportPath}`);
    process.exit(failures === 0 ? 0 : 1);
  }
);
