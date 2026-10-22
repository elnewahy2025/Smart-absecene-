import { useCallback, useEffect, useMemo, useState } from 'react';
import { localCache } from '../utils/localCache';
import { evaluateSubscription, normalizeSubscription } from '../config/subscription';
import { REGISTRY_TENANTS } from './attendanceContextSupport';
import type { TenantSubscription } from '../config/subscription';
import type { TenantDomainConfig } from '../config/tenantRegistry';
import type { Tenant } from '../types/attendance';

/** Tenant registry sync + subscription polling for the current school. */
export function useTenantSubscription(tenantId: string) {
  const [dynamicTenants, setDynamicTenants] = useState<TenantDomainConfig[]>(() => {
    if (typeof localCache !== 'undefined') {
      try {
        const saved = localCache.getItem('school_dynamic_tenants');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Error reading dynamic tenants:', e);
      }
    }
    return [];
  });

  const [tenantSubscription, setTenantSubscription] = useState<TenantSubscription | null>(null);

  const refreshSubscription = useCallback(async () => {
    try {
      const res = await fetch(`/api/tenant/resolve?tenant=${encodeURIComponent(tenantId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.status === 'resolved' && data.config) {
        setTenantSubscription(normalizeSubscription((data.config as any)?.subscription));
      }
    } catch (err) {
      console.warn('Could not load tenant subscription:', err);
    }
  }, [tenantId]);

  useEffect(() => {
    void refreshSubscription();
    // The owner can suspend a school from another session; re-check when the tab
    // regains focus and periodically so the gate appears without a hard reload.
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshSubscription();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const interval = window.setInterval(refreshWhenVisible, 60000);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearInterval(interval);
    };
  }, [refreshSubscription]);

  const subscriptionAccess = useMemo(
    () => evaluateSubscription(tenantSubscription),
    [tenantSubscription]
  );

  const syncTenantsWithServer = useCallback(async () => {
    try {
      const res = await fetch('/api/tenants');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tenants)) {
          setDynamicTenants((prev) => {
            const map = new Map<string, TenantDomainConfig>();
            for (const t of data.tenants) {
              if (t && t.tenantId) map.set(t.tenantId, t);
            }
            for (const t of prev) {
              if (t && t.tenantId && !map.has(t.tenantId)) map.set(t.tenantId, t);
            }
            const merged = Array.from(map.values());
            if (typeof localCache !== 'undefined') {
              localCache.setItem('school_dynamic_tenants', JSON.stringify(merged));
            }
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('Could not sync dynamic tenants from server:', err);
    }
  }, []);

  useEffect(() => {
    syncTenantsWithServer();
  }, [syncTenantsWithServer]);

  const tenants: Tenant[] = useMemo(() => {
    const list: Tenant[] = [...REGISTRY_TENANTS];
    for (const dt of dynamicTenants) {
      if (!list.some((t) => t.id === dt.tenantId)) {
        list.push({
          id: dt.tenantId,
          name: dt.nameAr,
          code: dt.code,
          city: dt.cityAr,
          academicYear: dt.academicYear,
          currentTerm: dt.currentTerm,
          schoolType: dt.schoolType,
        });
      }
    }
    return list;
  }, [dynamicTenants]);

  return {
    dynamicTenants,
    setDynamicTenants,
    tenants,
    tenantSubscription,
    subscriptionAccess,
    refreshSubscription,
    syncTenantsWithServer,
  };
}
