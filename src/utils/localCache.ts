/**
 * Privacy-safe browser cache (M-7).
 *
 * Firestore is the single source of truth. This module exists only so components
 * can keep cheap, synchronous, in-session values without writing personal data
 * (student records, guardian phones, national IDs, medical text, staff emails,
 * audit logs, gateway settings) to cleartext `localStorage`.
 *
 * Only an explicit allowlist of non-sensitive keys is persisted to disk. Every
 * other key lives in an in-memory map for the lifetime of the tab, so behaviour
 * within a session is unchanged while nothing sensitive survives a reload.
 */

const PERSISTED_KEYS = new Set<string>([
  'school_current_tenant_id',
  'school_current_user_role',
  'school_dynamic_tenants',
]);

/**
 * Keys that previous versions wrote to disk in cleartext. Purged on import so an
 * already-compromised device is cleaned up on the next load.
 */
const LEGACY_SENSITIVE_KEYS: string[] = [
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
];

const memory = new Map<string, string>();

function getStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export const localCache = {
  getItem(key: string): string | null {
    if (memory.has(key)) {
      return memory.get(key) ?? null;
    }
    if (PERSISTED_KEYS.has(key)) {
      const storage = getStorage();
      return storage ? storage.getItem(key) : null;
    }
    return null;
  },

  setItem(key: string, value: string): void {
    const stringValue = String(value);
    memory.set(key, stringValue);
    if (PERSISTED_KEYS.has(key)) {
      const storage = getStorage();
      if (storage) {
        try {
          storage.setItem(key, stringValue);
        } catch {
          /* quota or privacy mode - memory copy is enough */
        }
      }
    }
  },

  removeItem(key: string): void {
    memory.delete(key);
    if (PERSISTED_KEYS.has(key)) {
      const storage = getStorage();
      if (storage) {
        try {
          storage.removeItem(key);
        } catch {
          /* ignore */
        }
      }
    }
  },

  /**
   * Removes anything a previous version cached in cleartext, then forgets it.
   * Runs once on module import.
   */
  purgeLegacySensitive(): void {
    const storage = getStorage();
    for (const key of LEGACY_SENSITIVE_KEYS) {
      memory.delete(key);
      if (storage) {
        try {
          storage.removeItem(key);
        } catch {
          /* ignore */
        }
      }
    }
  },
};

localCache.purgeLegacySensitive();

export const PERSISTED_CACHE_KEYS = PERSISTED_KEYS;
export const LEGACY_SENSITIVE_CACHE_KEYS = LEGACY_SENSITIVE_KEYS;
