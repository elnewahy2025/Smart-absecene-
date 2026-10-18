import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  localCache,
  PERSISTED_CACHE_KEYS,
  LEGACY_SENSITIVE_CACHE_KEYS,
} from './localCache';

interface FakeStorage extends Storage {
  _map: Map<string, string>;
}

function makeFakeStorage(): FakeStorage {
  const map = new Map<string, string>();
  const storage = {
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      map.set(key, String(value));
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: () => null,
    get length() {
      return map.size;
    },
    _map: map,
  };
  return storage as FakeStorage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('localCache (M-7 privacy-safe cache)', () => {
  it('only persists the non-sensitive allowlist to disk', () => {
    expect([...PERSISTED_CACHE_KEYS]).toEqual([
      'school_current_tenant_id',
      'school_current_user_role',
      'school_dynamic_tenants',
    ]);
    for (const key of PERSISTED_CACHE_KEYS) {
      expect(LEGACY_SENSITIVE_CACHE_KEYS).not.toContain(key);
    }
  });

  it('lists every sensitive key a previous version used to persist', () => {
    expect(LEGACY_SENSITIVE_CACHE_KEYS).toEqual(
      expect.arrayContaining([
        'school_students',
        'school_sessions',
        'school_justifications',
        'school_notifications',
        'school_audit_logs',
        'school_users',
        'school_behaviour_incidents',
        'school_settings',
        'tenant_school_profiles',
        'school_digest_config',
        'school_digest_history',
      ])
    );
  });

  it('keeps sensitive values in memory but never writes them to localStorage', () => {
    const storage = makeFakeStorage();
    vi.stubGlobal('localStorage', storage);

    localCache.setItem('school_students', '[{"nationalId":"1"}]');

    expect(storage._map.has('school_students')).toBe(false);
    expect(localCache.getItem('school_students')).toBe('[{"nationalId":"1"}]');

    localCache.removeItem('school_students');
    expect(localCache.getItem('school_students')).toBeNull();
  });

  it('persists allowlisted (non-sensitive) keys to localStorage', () => {
    const storage = makeFakeStorage();
    vi.stubGlobal('localStorage', storage);

    localCache.setItem('school_current_tenant_id', 'school-9');
    expect(storage._map.get('school_current_tenant_id')).toBe('school-9');
    expect(localCache.getItem('school_current_tenant_id')).toBe('school-9');

    localCache.removeItem('school_current_tenant_id');
    expect(storage._map.has('school_current_tenant_id')).toBe(false);
  });

  it('purgeLegacySensitive removes any cleartext PII a prior version left on disk', () => {
    const storage = makeFakeStorage();
    storage.setItem('school_students', 'cached');
    storage.setItem('school_notifications', 'cached');
    storage.setItem('school_current_tenant_id', 'keep-me');
    vi.stubGlobal('localStorage', storage);

    localCache.purgeLegacySensitive();

    expect(storage._map.has('school_students')).toBe(false);
    expect(storage._map.has('school_notifications')).toBe(false);
    expect(storage._map.get('school_current_tenant_id')).toBe('keep-me');
  });

  it('is SSR-safe when localStorage is undefined', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => localCache.setItem('school_students', 'x')).not.toThrow();
    expect(localCache.getItem('school_students')).toBe('x');
  });
});
