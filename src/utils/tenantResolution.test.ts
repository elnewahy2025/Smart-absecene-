import { describe, it, expect } from 'vitest';
import {
  normalizeHostname,
  resolveTenantFromHostname,
  TENANT_REGISTRY,
} from '../config/tenantRegistry';

describe('Tenant Domain Resolution Service', () => {
  describe('normalizeHostname', () => {
    it('strips standard port numbers', () => {
      expect(normalizeHostname('andalus.smartschool.com:3000')).toBe('andalus.smartschool.com');
      expect(normalizeHostname('falah.localhost:5173')).toBe('falah.localhost');
      expect(normalizeHostname('localhost:8080')).toBe('localhost');
    });

    it('lowercases and trims whitespace', () => {
      expect(normalizeHostname('  ANDALUS.SmartSchool.COM  ')).toBe('andalus.smartschool.com');
      expect(normalizeHostname('FALAH.LocalHost:3000')).toBe('falah.localhost');
    });

    it('strips DNS trailing dots', () => {
      expect(normalizeHostname('andalus.smartschool.com.')).toBe('andalus.smartschool.com');
    });

    it('handles empty input gracefully', () => {
      expect(normalizeHostname('')).toBe('');
    });
  });

  describe('resolveTenantFromHostname', () => {
    it('resolves school-1 from subdomain on smartschool.com', () => {
      const result = resolveTenantFromHostname('andalus.smartschool.com');
      expect(result.status).toBe('resolved');
      expect(result.tenantId).toBe('school-1');
      expect(result.config?.nameAr).toBe('مدرسة الأندلس الثانوية النموذجية');
      expect(result.config?.code).toBe('ANDALUS-101');
    });

    it('resolves school-2 from subdomain on smartschool.com', () => {
      const result = resolveTenantFromHostname('falah.smartschool.com');
      expect(result.status).toBe('resolved');
      expect(result.tenantId).toBe('school-2');
      expect(result.config?.nameAr).toBe('مدرسة الفلاح المتوسطة الحديثة');
      expect(result.config?.code).toBe('FALAH-202');
    });

    it('resolves subdomains on local development host (andalus.localhost:3000)', () => {
      const result = resolveTenantFromHostname('andalus.localhost:3000');
      expect(result.status).toBe('resolved');
      expect(result.tenantId).toBe('school-1');
    });

    it('resolves registered custom domains (attendance.andalus-school.edu.sa & portal.andalus.edu)', () => {
      const result1 = resolveTenantFromHostname('attendance.andalus-school.edu.sa');
      expect(result1.status).toBe('resolved');
      expect(result1.tenantId).toBe('school-1');
      expect(result1.config?.cityAr).toBe('الرياض');

      const result2 = resolveTenantFromHostname('portal.andalus.edu');
      expect(result2.status).toBe('resolved');
      expect(result2.tenantId).toBe('school-1');

      const result3 = resolveTenantFromHostname('portal.falah.edu');
      expect(result3.status).toBe('resolved');
      expect(result3.tenantId).toBe('school-2');
    });

    it('resolves raw localhost in development seamlessly to primary school (school-1)', () => {
      expect(resolveTenantFromHostname('localhost:3000').status).toBe('resolved');
      expect(resolveTenantFromHostname('localhost:3000').tenantId).toBe('school-1');
      expect(resolveTenantFromHostname('127.0.0.1:3000').status).toBe('resolved');
      expect(resolveTenantFromHostname('127.0.0.1:3000').tenantId).toBe('school-1');
      expect(resolveTenantFromHostname('192.168.1.3:3000').status).toBe('resolved');
      expect(resolveTenantFromHostname('192.168.1.3:3000').tenantId).toBe('school-1');
    });

    it('rejects unregistered or unknown domains', () => {
      expect(resolveTenantFromHostname('random-school.com').status).toBe('unknown_domain');
      expect(resolveTenantFromHostname('evil-attacker.smartschool.com').status).toBe('unknown_domain');
      expect(resolveTenantFromHostname('unknown.domain.org:9999').status).toBe('unknown_domain');
    });

    it('handles inactive tenants if deactivated', () => {
      // Temporarily mark tenant as inactive to test guard
      TENANT_REGISTRY['school-2'].isActive = false;
      const result = resolveTenantFromHostname('falah.smartschool.com');
      expect(result.status).toBe('inactive_tenant');
      expect(result.tenantId).toBe('school-2');
      // Restore active state
      TENANT_REGISTRY['school-2'].isActive = true;
    });

    // [TESTING / DEV ONLY - TO BE REMOVED/DISABLED IN PRODUCTION]
    describe('Mobile & LAN Wi-Fi Testing Switcher', () => {
      it('switches tenant via ?school= parameter on local LAN / Wi-Fi IP', () => {
        const result = resolveTenantFromHostname('192.168.1.15:5050', '?school=school-2');
        expect(result.status).toBe('resolved');
        expect(result.tenantId).toBe('school-2');
        expect(result.config?.nameAr).toBe('مدرسة الفلاح المتوسطة الحديثة');
      });

      it('switches tenant via subdomain alias in query param (?school=falah)', () => {
        const result = resolveTenantFromHostname('192.168.1.15:5050', '?school=falah');
        expect(result.status).toBe('resolved');
        expect(result.tenantId).toBe('school-2');
      });

      it('switches tenant via ?tenant= parameter on localhost', () => {
        const result = resolveTenantFromHostname('localhost:3000', '?tenant=school-2');
        expect(result.status).toBe('resolved');
        expect(result.tenantId).toBe('school-2');
      });

      it('strictly ignores ?school= query parameters on production custom/sub domains', () => {
        // Query param must NEVER override real production domains
        const prodResult1 = resolveTenantFromHostname('andalus.smartschool.com', '?school=school-2');
        expect(prodResult1.status).toBe('resolved');
        expect(prodResult1.tenantId).toBe('school-1');

        const prodResult2 = resolveTenantFromHostname('portal.falah.edu', '?school=school-1');
        expect(prodResult2.status).toBe('resolved');
        expect(prodResult2.tenantId).toBe('school-2');
      });
    });
  });
});
