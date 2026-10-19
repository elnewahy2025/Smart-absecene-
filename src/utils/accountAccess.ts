export interface AccountActor {
  uid?: string;
  role?: string;
  tenantId?: string;
  email?: string;
}

export interface AccountProfileLike {
  tenantId?: string;
  role?: string;
  status?: string;
}

export interface ExistingAccountInfo {
  exists?: boolean;
  profile?: AccountProfileLike | null;
  isPlatformAdminDoc?: boolean;
}

export const isPlatformOwnerClaim = (actor: AccountActor | null | undefined): boolean =>
  Boolean(actor && actor.role === 'super_admin');

/**
 * A school admin may manage accounts inside their own tenant. A registrar may
 * manage non-admin accounts, but must never be able to demote, deactivate or
 * otherwise take over a school administrator. Only the platform owner may act
 * across tenants or touch a protected owner profile.
 */
export function accountPatchDenial(
  actor: AccountActor,
  existing: AccountProfileLike
): string | null {
  if (!actor?.uid || !actor.role || !actor.tenantId) {
    return 'Authentication is required.';
  }
  if (existing.role === 'super_admin' && !isPlatformOwnerClaim(actor)) {
    return 'Platform owner accounts are protected.';
  }
  if (!isPlatformOwnerClaim(actor) && existing.tenantId !== actor.tenantId) {
    return 'The account belongs to another school.';
  }
  if (!isPlatformOwnerClaim(actor) && existing.role === 'admin' && actor.role !== 'admin') {
    return 'Only an administrator can modify another administrator.';
  }
  return null;
}

export function accountRoleChangeDenial(
  actor: AccountActor,
  existing: AccountProfileLike,
  nextRole: string
): string | null {
  if (!nextRole || nextRole === existing.role) return null;
  if (!['admin', 'registrar', 'teacher', 'parent'].includes(nextRole)) {
    return 'role must be one of admin, registrar, teacher, parent.';
  }
  if (!isPlatformOwnerClaim(actor) && actor.role !== 'admin') {
    return 'Only an administrator can change roles.';
  }
  return null;
}

/**
 * An email lookup is global in Firebase Auth. Creating a "new" member must
 * therefore never silently take over an existing login (especially the owner's
 * or a member of another school). Existing logins are only reopened when the
 * caller explicitly opts in (owner re-provisioning) and the tenant matches.
 */
export function accountUpsertDenial(
  existing: ExistingAccountInfo,
  targetTenantId: string,
  allowExisting: boolean
): string | null {
  if (existing.isPlatformAdminDoc || existing.profile?.role === 'super_admin') {
    return 'Platform owner accounts are protected.';
  }
  if (existing.profile?.tenantId && existing.profile.tenantId !== targetTenantId) {
    return 'This email is already registered to another school.';
  }
  if (existing.exists && !allowExisting) {
    return 'An account with this email already exists. Edit the existing member instead.';
  }
  return null;
}
