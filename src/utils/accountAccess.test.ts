import { describe, expect, it } from 'vitest';
import {
  accountPatchDenial,
  accountRoleChangeDenial,
  accountUpsertDenial,
  isPlatformOwnerClaim,
} from './accountAccess';

const owner = { uid: 'owner', role: 'super_admin', tenantId: 'school-1' };
const admin = { uid: 'admin', role: 'admin', tenantId: 'school-1' };
const registrar = { uid: 'registrar', role: 'registrar', tenantId: 'school-1' };
const teacher = { uid: 'teacher', role: 'teacher', tenantId: 'school-1' };
const otherAdmin = { uid: 'admin2', role: 'admin', tenantId: 'school-2' };

describe('account access guards', () => {
  it('recognises only the super_admin claim as the platform owner', () => {
    expect(isPlatformOwnerClaim(owner)).toBe(true);
    expect(isPlatformOwnerClaim(admin)).toBe(false);
    expect(isPlatformOwnerClaim(null)).toBe(false);
  });

  it('lets an admin manage a member of the same school', () => {
    expect(accountPatchDenial(admin, { tenantId: 'school-1', role: 'teacher' })).toBeNull();
  });

  it('blocks cross-tenant account management', () => {
    expect(accountPatchDenial(admin, { tenantId: 'school-2', role: 'teacher' })).toContain('another school');
    expect(accountPatchDenial(otherAdmin, { tenantId: 'school-1', role: 'teacher' })).toContain('another school');
  });

  it('blocks a registrar from modifying an administrator', () => {
    expect(accountPatchDenial(registrar, { tenantId: 'school-1', role: 'admin' })).toContain('administrator');
  });

  it('blocks a registrar from changing any role', () => {
    expect(accountRoleChangeDenial(registrar, { tenantId: 'school-1', role: 'teacher' }, 'registrar')).toContain('administrator');
  });

  it('allows an admin to promote a member inside the school but never to super_admin', () => {
    expect(accountRoleChangeDenial(admin, { tenantId: 'school-1', role: 'teacher' }, 'registrar')).toBeNull();
    expect(accountRoleChangeDenial(admin, { tenantId: 'school-1', role: 'teacher' }, 'super_admin')).toContain('role must be');
  });

  it('protects the owner profile and owner auth document', () => {
    expect(accountPatchDenial(admin, { tenantId: 'school-1', role: 'super_admin' })).toContain('protected');
    expect(accountUpsertDenial({ exists: true, profile: { tenantId: 'school-1', role: 'super_admin' } }, 'school-1', true)).toContain('protected');
    expect(accountUpsertDenial({ exists: true, isPlatformAdminDoc: true, profile: { tenantId: 'school-1', role: 'admin' } }, 'school-1', true)).toContain('protected');
  });

  it('never reuses an existing email for an ordinary create', () => {
    expect(accountUpsertDenial({ exists: true, profile: { tenantId: 'school-1', role: 'teacher' } }, 'school-1', false)).toContain('already exists');
  });

  it('refuses to move an existing login to another school', () => {
    expect(accountUpsertDenial({ exists: true, profile: { tenantId: 'school-2', role: 'teacher' } }, 'school-1', true)).toContain('another school');
  });

  it('allows the owner to re-provision an existing member of the same school', () => {
    expect(accountUpsertDenial({ exists: true, profile: { tenantId: 'school-1', role: 'teacher' } }, 'school-1', true)).toBeNull();
  });

  it('rejects an unauthenticated actor', () => {
    expect(accountPatchDenial({}, { tenantId: 'school-1', role: 'teacher' })).toContain('Authentication');
  });
});
