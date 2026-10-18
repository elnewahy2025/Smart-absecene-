import { describe, it, expect } from 'vitest';
import { INITIAL_USERS } from '../data/mockData';

describe('Seeded staff data integrity', () => {
  it('gives every account a tenant and an email', () => {
    for (const user of INITIAL_USERS) {
      expect(user.tenantId.length).toBeGreaterThan(0);
      expect(user.email).toContain('@');
    }
  });

  it('keeps emails unique across seeded accounts', () => {
    const emails = INITIAL_USERS.map((user) => user.email.toLowerCase());
    expect(new Set(emails).size).toBe(emails.length);
  });
});
