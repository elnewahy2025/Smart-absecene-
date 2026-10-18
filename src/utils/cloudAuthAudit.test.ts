import { describe, it, expect } from 'vitest';
import { INITIAL_USERS } from '../data/mockData';

const VALID_ROLES = new Set(['admin', 'registrar', 'teacher', 'parent', 'super_admin']);

describe('Seeded identity data', () => {
  it('contains no password fields after the auth fallback removal', () => {
    for (const user of INITIAL_USERS) {
      expect(Object.prototype.hasOwnProperty.call(user, 'password')).toBe(false);
    }
  });

  it('uses only valid roles', () => {
    for (const user of INITIAL_USERS) {
      expect(VALID_ROLES.has(user.role)).toBe(true);
    }
  });
});
