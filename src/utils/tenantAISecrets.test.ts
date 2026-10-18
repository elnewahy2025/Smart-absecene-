import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Never touch the real tenant-ai-secrets.json from tests.
const testSecretsPath = path.join(os.tmpdir(), `smart-school-tenant-secrets-${process.pid}.json`);
process.env.TENANT_AI_SECRETS_PATH = testSecretsPath;

let secrets: typeof import('./tenantAISecrets');

beforeAll(async () => {
  try {
    fs.unlinkSync(testSecretsPath);
  } catch {
    // no previous temp file
  }
  secrets = await import('./tenantAISecrets');
});

afterAll(() => {
  try {
    fs.unlinkSync(testSecretsPath);
  } catch {
    // already removed
  }
});

describe('Tenant AI Secrets Encryption & Management', () => {
  const tenantA = 'school-alpha';
  const tenantB = 'school-beta';
  const testKeyA = 'TEST_MOCK_GEMINI_KEY_A_1234567890';
  const testKeyB = 'TEST_MOCK_GEMINI_KEY_B_99887766554433221100';

  const reset = () => {
    secrets.removeTenantApiKey(tenantA);
    secrets.removeTenantApiKey(tenantB);
  };

  it('correctly masks API keys for display', () => {
    const masked = secrets.maskApiKey(testKeyA);
    expect(masked.startsWith(testKeyA.slice(0, 7))).toBe(true);
    expect(masked.endsWith(testKeyA.slice(-4))).toBe(true);
    expect(masked).toContain('••••');
    expect(masked).not.toBe(testKeyA);
  });

  it('encrypts, stores and retrieves tenant key accurately', () => {
    reset();
    secrets.setTenantApiKey(tenantA, testKeyA, 'gemini-3.5-flash');

    const decrypted = secrets.getTenantApiKey(tenantA);
    expect(decrypted).toBe(testKeyA);

    const safeConfig = secrets.getTenantAIConfig(tenantA);
    expect(safeConfig.hasCustomKey).toBe(true);
    expect(safeConfig.maskedKey.startsWith(testKeyA.slice(0, 7))).toBe(true);
    expect((safeConfig as any).plainKey).toBeUndefined();
    expect(fs.existsSync(testSecretsPath)).toBe(true);
  });

  it('isolates keys strictly between different schools/tenants', () => {
    reset();
    secrets.setTenantApiKey(tenantA, testKeyA);
    secrets.setTenantApiKey(tenantB, testKeyB);

    expect(secrets.getTenantApiKey(tenantA)).toBe(testKeyA);
    expect(secrets.getTenantApiKey(tenantB)).toBe(testKeyB);

    secrets.removeTenantApiKey(tenantA);
    expect(secrets.getTenantApiKey(tenantA)).toBeNull();
    expect(secrets.getTenantApiKey(tenantB)).toBe(testKeyB);
  });
});
