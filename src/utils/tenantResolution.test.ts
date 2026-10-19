import { describe, it, expect, vi } from 'vitest';
import {
  normalizeHostname,
  resolveTenantFromHostname,
  findTenantByAlias,
  getActiveTenantRegistry,
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
        // The legacy ?school= alias must NEVER override real production domains
        const prodResult1 = resolveTenantFromHostname('andalus.smartschool.com', '?school=school-2');
        expect(prodResult1.status).toBe('resolved');
        expect(prodResult1.tenantId).toBe('school-1');

        const prodResult2 = resolveTenantFromHostname('portal.falah.edu', '?school=school-1');
        expect(prodResult2.status).toBe('resolved');
        expect(prodResult2.tenantId).toBe('school-2');
      });

      it('honours an explicit ?tenant= selection on any host, including production', () => {
        const result = resolveTenantFromHostname('andalus.smartschool.com', '?tenant=school-2');
        expect(result.status).toBe('resolved');
        expect(result.tenantId).toBe('school-2');

        const bySubdomain = resolveTenantFromHostname('smart-absecene-drul.vercel.app', '?tenant=falah');
        expect(bySubdomain.status).toBe('resolved');
        expect(bySubdomain.tenantId).toBe('school-2');
      });

      it('parses ?tenant= from a full original URL (as sent by the API client)', () => {
        const result = resolveTenantFromHostname('andalus.smartschool.com', '/api/users?tenant=school-2');
        expect(result.status).toBe('resolved');
        expect(result.tenantId).toBe('school-2');
      });

      it('ignores an unknown ?tenant= value and falls back to the hostname', () => {
        const result = resolveTenantFromHostname('andalus.smartschool.com', '?tenant=does-not-exist');
        expect(result.status).toBe('resolved');
        expect(result.tenantId).toBe('school-1');
      });

      it('accepts friendly aliases such as school-ANDALUS, andalus, school-falah and MAJD-301', () => {
        expect(resolveTenantFromHostname('smart-absecene-drul.vercel.app', '?tenant=school-ANDALUS').tenantId).toBe('school-1');
        expect(resolveTenantFromHostname('smart-absecene-drul.vercel.app', '?tenant=andalus').tenantId).toBe('school-1');
        expect(resolveTenantFromHostname('smart-absecene-drul.vercel.app', '?tenant=school-falah').tenantId).toBe('school-2');
        expect(resolveTenantFromHostname('smart-absecene-drul.vercel.app', '?tenant=MAJD-301').tenantId).toBe('school-majd');
        expect(resolveTenantFromHostname('smart-absecene-drul.vercel.app', '?tenant=school-majd').tenantId).toBe('school-majd');
      });
    });

    describe('tenant aliases and cached registry safety', () => {
      it('findTenantByAlias tolerates case and a redundant school- prefix', () => {
        const registry = getActiveTenantRegistry();
        expect(findTenantByAlias(registry, 'school-ANDALUS')?.tenantId).toBe('school-1');
        expect(findTenantByAlias(registry, 'SCHOOL-FALAH')?.tenantId).toBe('school-2');
        expect(findTenantByAlias(registry, 'majd')?.tenantId).toBe('school-majd');
        expect(findTenantByAlias(registry, 'nope')).toBeUndefined();
      });

      it('does not let a stale cached tenant erase a verified custom domain', () => {
        const store = new Map<string, string>([
          [
            'school_dynamic_tenants',
            JSON.stringify([
              {
                tenantId: 'school-1',
                subdomain: 'andalus',
                nameAr: 'x',
                nameEn: 'x',
                code: 'x',
                cityAr: '',
                cityEn: '',
                academicYear: '',
                currentTerm: '',
                schoolType: 'boys',
                primaryColor: '#000000',
                logoText: '',
                isActive: true,
                customDomains: ['andalus.localhost'],
              },
            ]),
          ],
        ]);
        vi.stubGlobal('localStorage', {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, value: string) => store.set(key, value),
          removeItem: (key: string) => store.delete(key),
        });

        try {
          const result = resolveTenantFromHostname('smart-absecene-drul.vercel.app');
          expect(result.status).toBe('resolved');
          expect(result.tenantId).toBe('school-1');
        } finally {
          vi.unstubAllGlobals();
        }
      });
    });
  });
});
