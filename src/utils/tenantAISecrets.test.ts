import { describe, it, expect, beforeEach } from 'vitest';
import {
  setTenantApiKey,
  getTenantApiKey,
  getTenantAIConfig,
  removeTenantApiKey,
  maskApiKey,
} from './tenantAISecrets';

describe('Tenant AI Secrets Encryption & Management', () => {
  const tenantA = 'school-alpha';
  const tenantB = 'school-beta';
  const testKeyA = 'TEST_MOCK_GEMINI_KEY_A_1234567890';
  const testKeyB = 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S';

  beforeEach(() => {
    removeTenantApiKey(tenantA);
    removeTenantApiKey(tenantB);
  });

  it('correctly masks API keys for display', () => {
    const masked = maskApiKey(testKeyA);
    expect(masked.startsWith('AQ.Ab8R')).toBe(true);
    expect(masked.endsWith('oNw')).toBe(true);
    expect(masked).toContain('••••');
    expect(masked).not.toBe(testKeyA);
  });

  it('encrypts, stores and retrieves tenant key accurately', () => {
    setTenantApiKey(tenantA, testKeyA, 'gemini-3.5-flash');

    const decrypted = getTenantApiKey(tenantA);
    expect(decrypted).toBe(testKeyA);

    const safeConfig = getTenantAIConfig(tenantA);
    expect(safeConfig.hasCustomKey).toBe(true);
    expect(safeConfig.maskedKey.startsWith('AQ.Ab8R')).toBe(true);
    // Raw key must never be in config
    expect((safeConfig as any).plainKey).toBeUndefined();
  });

  it('isolates keys strictly between different schools/tenants', () => {
    setTenantApiKey(tenantA, testKeyA);
    setTenantApiKey(tenantB, testKeyB);

    expect(getTenantApiKey(tenantA)).toBe(testKeyA);
    expect(getTenantApiKey(tenantB)).toBe(testKeyB);

    removeTenantApiKey(tenantA);
    expect(getTenantApiKey(tenantA)).toBeNull();
    expect(getTenantApiKey(tenantB)).toBe(testKeyB);
  });
});
