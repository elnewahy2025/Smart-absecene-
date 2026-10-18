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
      'smart-absecene-drul.vercel.app',
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

import DYNAMIC_TENANTS_LIST from './dynamicTenants.json';

let runtimeDynamicTenants: TenantDomainConfig[] | null = null;
let runtimeTenantDocs: TenantDomainConfig[] | null = null;

/**
 * Server-side overlay: lets the Node process apply tenants written to disk after
 * module load without a restart. Ignored in the browser (the localStorage merge
 * below still applies there).
 */
export function setRuntimeDynamicTenants(list: TenantDomainConfig[]): void {
  runtimeDynamicTenants = Array.isArray(list) ? list : null;
}


/**
 * Firestore-backed tenant documents, loaded by the server and merged over the
 * JSON/static registry. Browser callers ignore this overlay.
 */
export function setRuntimeTenantDocs(list: TenantDomainConfig[]): void {
  runtimeTenantDocs = Array.isArray(list) ? list : null;
}
export function getActiveTenantRegistry(): Record<string, TenantDomainConfig> {
  const registry: Record<string, TenantDomainConfig> = { ...TENANT_REGISTRY };

  // 1. Merge persistent dynamic tenants (the runtime overlay wins over the static import)
  const dynamicSource = runtimeDynamicTenants ?? (Array.isArray(DYNAMIC_TENANTS_LIST) ? DYNAMIC_TENANTS_LIST : []);
  if (Array.isArray(dynamicSource)) {
    dynamicSource.forEach((dt: any) => {
      if (dt && dt.tenantId) {
        registry[dt.tenantId] = dt as TenantDomainConfig;
      }
    });
  }


  // 1b. Firestore tenant documents win over the JSON overlay
  if (Array.isArray(runtimeTenantDocs)) {
    runtimeTenantDocs.forEach((dt) => {
      if (dt && dt.tenantId) {
        registry[dt.tenantId] = dt;
      }
    });
  }
  // 2. Merge browser localStorage if available on current origin
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('school_dynamic_tenants');
      if (saved) {
        const dynamicList: TenantDomainConfig[] = JSON.parse(saved);
        dynamicList.forEach((dt) => {
          registry[dt.tenantId] = dt;
        });
      }
    } catch (e) {
      console.warn('Failed to parse dynamic tenants from localStorage:', e);
    }
  }
  return registry;
}

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
 * [TESTING / DEV ONLY - TO BE REMOVED/DISABLED IN PRODUCTION]
 * Checks if the incoming hostname is a local development machine or local Wi-Fi/LAN testing IP.
 */
export function isLocalDevelopmentHost(rawHostname: string): boolean {
  const host = normalizeHostname(rawHostname);
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)
  );
}

/**
 * [TESTING / DEV ONLY - TO BE REMOVED/DISABLED IN PRODUCTION]
 * Returns all active tenants for development/testing quick switching.
 */
export function getDevTestTenants(): TenantDomainConfig[] {
  const registry = getActiveTenantRegistry();
  return Object.values(registry).filter((t) => t.isActive);
}

/**
 * [TESTING / DEV ONLY - TO BE REMOVED/DISABLED IN PRODUCTION]
 * Programmatically switches active tenant on dev / LAN hosts.
 */
export function switchDevTestTenant(targetTenantId: string): void {
  if (typeof window === 'undefined') return;
  const host = window.location.hostname;
  if (!isLocalDevelopmentHost(host)) {
    console.warn('[DEV ONLY] Tenant switching is strictly restricted to local dev/testing environments.');
    return;
  }

  const registry = getActiveTenantRegistry();
  const matched =
    registry[targetTenantId] ||
    Object.values(registry).find(
      (t) =>
        t.tenantId.toLowerCase() === targetTenantId.toLowerCase() ||
        t.subdomain.toLowerCase() === targetTenantId.toLowerCase()
    );

  const finalId = matched ? matched.tenantId : targetTenantId;

  try {
    localStorage.setItem('school_dev_selected_tenant', finalId);
    // Clear user authentication state to avoid cross-tenant session residue during testing
    localStorage.removeItem('school_user_authenticated');
  } catch (e) {
    console.warn('Failed to save dev tenant to localStorage:', e);
  }

  const url = new URL(window.location.href);
  url.searchParams.set('school', finalId);
  window.location.href = url.toString();
}

/**
 * Resolves tenant configuration from a normalized hostname.
 * In the pure Canvas LMS / Slack model:
 * - Every verified domain/subdomain maps strictly to that single school.
 * - Localhost dev fallback directly resolves to the primary school (school-1) or query/stored dev selection.
 * - Unknown or invalid domains are rejected with 'unknown_domain'.
 */
export function resolveTenantFromHostname(
  rawHostname: string,
  searchOrQuery?: string
): TenantResolutionResult {
  const host = normalizeHostname(rawHostname);

  if (!host) {
    return {
      status: 'unknown_domain',
      normalizedHostname: host,
    };
  }

  const activeRegistry = getActiveTenantRegistry();

  // Local development host fallback: Default to dev query, localStorage, or primary school
  // Supports: localhost, 127.0.0.1, 0.0.0.0, .local, and private LAN IP ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const isLocalDevHost = isLocalDevelopmentHost(host);

  if (isLocalDevHost) {
    // [TESTING / DEV ONLY - TO BE REMOVED/DISABLED IN PRODUCTION]
    // 1. Check URL query parameters (?school=... or ?tenant=...)
    let queryTenant: string | null = null;
    const search =
      searchOrQuery !== undefined
        ? searchOrQuery
        : typeof window !== 'undefined'
        ? window.location.search
        : '';

    if (search) {
      try {
        const params = new URLSearchParams(search);
        queryTenant = params.get('school') || params.get('tenant');
      } catch (e) {
        // ignore
      }
    }

    if (queryTenant) {
      const normalizedQuery = queryTenant.trim().toLowerCase();
      const matched =
        activeRegistry[normalizedQuery] ||
        Object.values(activeRegistry).find(
          (t) =>
            t.tenantId.toLowerCase() === normalizedQuery ||
            t.subdomain.toLowerCase() === normalizedQuery
        );

      if (matched) {
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('school_dev_selected_tenant', matched.tenantId);
          } catch (e) {}
        }
        return {
          status: matched.isActive ? 'resolved' : 'inactive_tenant',
          tenantId: matched.tenantId,
          config: matched,
          normalizedHostname: host,
        };
      }
    }

    // 2. Check localStorage on dev / LAN hosts
    if (typeof localStorage !== 'undefined') {
      try {
        const savedTenantId = localStorage.getItem('school_dev_selected_tenant');
        if (savedTenantId && activeRegistry[savedTenantId]) {
          const savedTenant = activeRegistry[savedTenantId];
          return {
            status: savedTenant.isActive ? 'resolved' : 'inactive_tenant',
            tenantId: savedTenant.tenantId,
            config: savedTenant,
            normalizedHostname: host,
          };
        }
      } catch (e) {}
    }

    // 3. Fallback to default primary school
    const defaultTenant = activeRegistry['school-1'] || TENANT_REGISTRY['school-1'];
    return {
      status: 'resolved',
      tenantId: defaultTenant.tenantId,
      config: defaultTenant,
      normalizedHostname: host,
    };
  }

  // 2. Check for exact custom domain match
  for (const tenant of Object.values(activeRegistry)) {
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
    for (const tenant of Object.values(activeRegistry)) {
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
