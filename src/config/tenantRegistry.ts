import { Tenant } from '../types/attendance';

export interface TenantDomainConfig {
  tenantId: string;
  subdomain: string; // e.g. 'andalus' -> andalus.smartschool.com, andalus.localhost
  customDomains: string[]; // e.g. ['attendance.andalus-school.edu.sa']
  nameAr: string;
  nameEn: string;
  code: string;
  cityAr: string;
  cityEn: string;
  academicYear: string;
  currentTerm: string;
  schoolType: 'boys' | 'girls' | 'mixed';
  primaryColor: string;
  logoText: string;
  isActive: boolean;
}

export type TenantConfig = TenantDomainConfig;

/**
 * Canonical, server & client synchronized registry of verified school domains.
 */
/**
 * Canonical, server & client synchronized registry of verified school domains.
 */
export const TENANT_REGISTRY: Record<string, TenantDomainConfig> = {
  'school-1': {
    tenantId: 'school-1',
    subdomain: 'andalus',
    customDomains: [
      'portal.andalus.edu',
      'portal.andalus.edu.sa',
      'attendance.andalus-school.edu.sa',
      'andalus.smartschool.com',
      'andalus.localhost',
    ],
    nameAr: 'مدرسة الأندلس الثانوية النموذجية',
    nameEn: 'Al-Andalus Model High School',
    code: 'ANDALUS-101',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    academicYear: '1447-1448 هـ / 2026 م',
    currentTerm: 'الفصل الدراسي الأول',
    schoolType: 'boys',
    primaryColor: '#059669', // Emerald
    logoText: 'أ',
    isActive: true,
  },
  'school-2': {
    tenantId: 'school-2',
    subdomain: 'falah',
    customDomains: [
      'portal.falah.edu',
      'portal.falah.edu.sa',
      'attendance.falah-school.edu.sa',
      'falah.smartschool.com',
      'falah.localhost',
    ],
    nameAr: 'مدرسة الفلاح المتوسطة الحديثة',
    nameEn: 'Al-Falah Modern Intermediate School',
    code: 'FALAH-202',
    cityAr: 'جدة',
    cityEn: 'Jeddah',
    academicYear: '1447-1448 هـ / 2026 م',
    currentTerm: 'الفصل الدراسي الأول',
    schoolType: 'boys',
    primaryColor: '#2563eb', // Blue
    logoText: 'ف',
    isActive: true,
  },
};

export type TenantResolutionStatus =
  | 'resolved'
  | 'unknown_domain'
  | 'inactive_tenant';

export interface TenantResolutionResult {
  status: TenantResolutionStatus;
  tenantId?: string;
  config?: TenantDomainConfig;
  normalizedHostname: string;
}

/**
 * Normalizes an incoming hostname:
 * - Strips port numbers (:3000, :5173, etc.)
 * - Trims whitespace and converts to lowercase
 * - Strips trailing dots (DNS absolute FQDN)
 */
export function normalizeHostname(rawHostname: string): string {
  if (!rawHostname) return '';
  let cleaned = rawHostname.trim().toLowerCase();

  // If input contains port, strip it (handling IPv6 brackets if any)
  if (cleaned.startsWith('[') && cleaned.includes(']')) {
    // IPv6
    const bracketIndex = cleaned.indexOf(']');
    cleaned = cleaned.substring(1, bracketIndex);
  } else {
    const colonIndex = cleaned.indexOf(':');
    if (colonIndex !== -1) {
      cleaned = cleaned.substring(0, colonIndex);
    }
  }

  // Strip trailing dot
  if (cleaned.endsWith('.')) {
    cleaned = cleaned.slice(0, -1);
  }

  return cleaned;
}

/**
 * Resolves tenant configuration from a normalized hostname.
 * In the pure Canvas LMS / Slack model:
 * - Every verified domain/subdomain maps strictly to that single school.
 * - Localhost dev fallback directly resolves to the primary school (school-1) with zero multi-school pickers.
 * - Unknown or invalid domains are rejected with 'unknown_domain'.
 */
export function resolveTenantFromHostname(rawHostname: string): TenantResolutionResult {
  const host = normalizeHostname(rawHostname);

  if (!host) {
    return {
      status: 'unknown_domain',
      normalizedHostname: host,
    };
  }

  // Local development host fallback: Default seamlessly to primary school
  // Supports: localhost, 127.0.0.1, 0.0.0.0, .local, and private LAN IP ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const isLocalDevHost =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host);

  if (isLocalDevHost) {
    const defaultTenant = TENANT_REGISTRY['school-1'];
    return {
      status: 'resolved',
      tenantId: defaultTenant.tenantId,
      config: defaultTenant,
      normalizedHostname: host,
    };
  }

  // 2. Check for exact custom domain match
  for (const tenant of Object.values(TENANT_REGISTRY)) {
    if (tenant.customDomains.some((d) => normalizeHostname(d) === host)) {
      if (!tenant.isActive) {
        return {
          status: 'inactive_tenant',
          tenantId: tenant.tenantId,
          config: tenant,
          normalizedHostname: host,
        };
      }
      return {
        status: 'resolved',
        tenantId: tenant.tenantId,
        config: tenant,
        normalizedHostname: host,
      };
    }
  }

  // 3. Check for subdomain prefix match (e.g. andalus.smartschool.com or andalus.localhost)
  // Extract first label before first dot
  const parts = host.split('.');
  if (parts.length >= 2) {
    const subdomain = parts[0];
    for (const tenant of Object.values(TENANT_REGISTRY)) {
      if (tenant.subdomain === subdomain) {
        if (!tenant.isActive) {
          return {
            status: 'inactive_tenant',
            tenantId: tenant.tenantId,
            config: tenant,
            normalizedHostname: host,
          };
        }
        return {
          status: 'resolved',
          tenantId: tenant.tenantId,
          config: tenant,
          normalizedHostname: host,
        };
      }
    }
  }

  // 4. Unknown domain
  return {
    status: 'unknown_domain',
    normalizedHostname: host,
  };
}

/**
 * Converts a TenantDomainConfig to the legacy Tenant interface for backwards compatibility.
 */
export function toTenantInterface(config: TenantDomainConfig): Tenant {
  return {
    id: config.tenantId,
    name: config.nameAr,
    code: config.code,
    city: config.cityAr,
    academicYear: config.academicYear,
    currentTerm: config.currentTerm,
    schoolType: config.schoolType,
  };
}
