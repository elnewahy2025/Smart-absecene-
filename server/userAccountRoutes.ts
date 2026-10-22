import admin from 'firebase-admin';
import type { Express, Request, RequestHandler } from 'express';
import type { TenantSubscription } from '../src/config/subscription';
import type {
  AuthenticatedUser,
  ManagedAccountInput,
  ManagedAccountOptions,
  ManagedAccountResult,
} from './types';
import {
  releaseUserSeat,
  reserveUserSeat,
  USER_SEAT_LIMIT_CODE,
} from '../src/utils/tenantUserSeats';

interface UserAccountRouteDeps {
  app: Express;
  isFirebaseAdminReady: () => boolean;
  requireRole: (allowedRoles: string[]) => RequestHandler;
  isPlatformOwner: (user: AuthenticatedUser | undefined) => boolean;
  emailPattern: RegExp;
  tenantIdPattern: RegExp;
  validRoles: Set<string>;
  loadTenantSubscription: (tenantId: string) => Promise<TenantSubscription>;
  findAuthUserByEmail: (email: string) => Promise<admin.auth.UserRecord | null>;
  upsertManagedAccount: (input: ManagedAccountInput, options?: ManagedAccountOptions) => Promise<ManagedAccountResult>;
  accountPatchDenial: (actor: AuthenticatedUser, existing: Record<string, unknown>) => string | null;
  accountRoleChangeDenial: (actor: AuthenticatedUser, existing: Record<string, unknown>, nextRole: string) => string | null;
}

export function registerUserAccountRoutes({
  app,
  isFirebaseAdminReady,
  requireRole,
  isPlatformOwner,
  emailPattern,
  tenantIdPattern,
  validRoles,
  loadTenantSubscription,
  findAuthUserByEmail,
  upsertManagedAccount,
  accountPatchDenial,
  accountRoleChangeDenial,
}: UserAccountRouteDeps) {
  // --- Tenant member accounts (create real logins for staff) -------------------
  // Body: { name, email, phone?, role, jobTitle?, assignedClasses?, assignedSubjects?, status?, password? }
  app.post('/api/users', requireRole(['admin', 'registrar']), async (req, res) => {
    try {
      if (!isFirebaseAdminReady()) {
        return res.status(503).json({ success: false, error: 'Authentication is not configured on this server.', code: 'AUTH_NOT_CONFIGURED' });
      }

      const actor = req.user;
      if (!actor) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const body = req.body || {};
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
      const role = typeof body.role === 'string' ? body.role : '';
      const tenantId =
        isPlatformOwner(actor) && typeof body.tenantId === 'string' && body.tenantId.trim()
          ? body.tenantId.trim().toLowerCase()
          : actor.tenantId;

      if (!emailPattern.test(email)) {
        return res.status(400).json({ success: false, error: 'A valid email address is required.' });
      }
      if (!tenantIdPattern.test(tenantId)) {
        return res.status(400).json({ success: false, error: 'A valid tenantId is required.' });
      }
      if (!name) {
        return res.status(400).json({ success: false, error: 'name is required.' });
      }
      if (!validRoles.has(role) || role === 'super_admin') {
        return res.status(400).json({ success: false, error: 'role must be one of admin, registrar, teacher, parent.' });
      }
      if (role === 'admin' && !isPlatformOwner(actor) && actor.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only an administrator can create another administrator.' });
      }

      // Enforce the plan's user-seat limit (only for brand-new accounts; editing
      // an existing member must keep working after the school reaches its cap).
      // The seat is reserved transactionally before Auth user creation and is
      // released if the request fails or turns out to be an update.
      const subscription = await loadTenantSubscription(tenantId);
      const maxUsers = subscription.limits?.maxUsers;
      const limitEnabled = typeof maxUsers === 'number' && maxUsers > 0;

      let releaseSeat: (() => Promise<void>) | null = null;
      try {
        if (limitEnabled) {
          const existingAuthUser = await findAuthUserByEmail(email);
          if (!existingAuthUser) {
            releaseSeat = await reserveUserSeat(admin.firestore(), tenantId, maxUsers);
          }
        }

        const account = await upsertManagedAccount({
          tenantId,
          email,
          name,
          role,
          phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 30) : '',
          jobTitle: typeof body.jobTitle === 'string' ? body.jobTitle.trim().slice(0, 120) : '',
          status: typeof body.status === 'string' ? body.status : 'active',
          assignedClasses: Array.isArray(body.assignedClasses) ? body.assignedClasses.filter((c: unknown) => typeof c === 'string').slice(0, 50) : undefined,
          assignedSubjects: Array.isArray(body.assignedSubjects) ? body.assignedSubjects.filter((s: unknown) => typeof s === 'string').slice(0, 50) : undefined,
          password: typeof body.password === 'string' ? body.password : undefined,
        });

        if (!account.created && releaseSeat) {
          await releaseSeat();
          releaseSeat = null;
        }

        return res.json({
          success: true,
          created: account.created,
          temporaryPassword: account.password,
          user: {
            id: account.uid,
            userId: account.uid,
            tenantId,
            name,
            email,
            role,
            phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 30) : '',
            jobTitle: typeof body.jobTitle === 'string' ? body.jobTitle.trim().slice(0, 120) : '',
            status: typeof body.status === 'string' ? body.status : 'active',
            assignedClasses: Array.isArray(body.assignedClasses) ? body.assignedClasses : undefined,
            assignedSubjects: Array.isArray(body.assignedSubjects) ? body.assignedSubjects : undefined,
          },
        });
      } catch (error) {
        if (releaseSeat) await releaseSeat().catch(() => {});
        throw error;
      }
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string; statusCode?: number };
      console.error('[USERS-CREATE-ERROR]', errorObj?.message || String(err));
      if (errorObj?.code === USER_SEAT_LIMIT_CODE) {
        return res.status(403).json({ success: false, error: errorObj.message, code: USER_SEAT_LIMIT_CODE });
      }
      const status = typeof errorObj?.statusCode === 'number' ? errorObj.statusCode : 500;
      return res.status(status).json({ success: false, error: errorObj?.message || 'Could not create the account.' });
    }
  });

  // Body: partial profile updates. Role changes also refresh the server claims.
  app.patch('/api/users/:uid', requireRole(['admin', 'registrar']), async (req, res) => {
    try {
      if (!isFirebaseAdminReady()) {
        return res.status(503).json({ success: false, error: 'Authentication is not configured on this server.', code: 'AUTH_NOT_CONFIGURED' });
      }

      const actor = req.user;
      if (!actor) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const uid = String(req.params.uid || '');
      const body = req.body || {};

      const snapshot = await admin.firestore().doc(`users/${uid}`).get();
      if (!snapshot.exists) {
        return res.status(404).json({ success: false, error: 'No managed account exists for this member.', code: 'ACCOUNT_NOT_FOUND' });
      }
      const existing = snapshot.data() || {};
      const patchDenial = accountPatchDenial(actor, existing);
      if (patchDenial) {
        return res.status(403).json({ success: false, error: patchDenial });
      }
      if (
        uid === actor.uid &&
        (body.status === 'inactive' ||
          (typeof body.role === 'string' && body.role !== existing.role))
      ) {
        return res.status(400).json({ success: false, error: 'You cannot demote or deactivate your own account.' });
      }

      const updates: Record<string, unknown> = {};
      if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim().slice(0, 120);
      if (typeof body.phone === 'string') updates.phone = body.phone.trim().slice(0, 30);
      if (typeof body.jobTitle === 'string') updates.jobTitle = body.jobTitle.trim().slice(0, 120);
      if (body.status === 'active' || body.status === 'inactive') updates.status = body.status;
      if (Array.isArray(body.assignedClasses)) updates.assignedClasses = body.assignedClasses.filter((c: unknown) => typeof c === 'string').slice(0, 50);
      if (Array.isArray(body.assignedSubjects)) updates.assignedSubjects = body.assignedSubjects.filter((s: unknown) => typeof s === 'string').slice(0, 50);

      let roleChanged = false;
      if (typeof body.role === 'string' && body.role !== existing.role) {
        const roleDenial = accountRoleChangeDenial(actor, existing, body.role);
        if (roleDenial) {
          const status = roleDenial.startsWith('role must be') ? 400 : 403;
          return res.status(status).json({ success: false, error: roleDenial });
        }
        updates.role = body.role;
        roleChanged = true;
      }

      updates.updatedAt = new Date().toISOString();
      await admin.firestore().doc(`users/${uid}`).set(updates, { merge: true });

      const nextRole = (updates.role as string) || existing.role;
      if (roleChanged) {
        await admin.auth().setCustomUserClaims(uid, { role: nextRole, tenantId: existing.tenantId });
        await admin.auth().revokeRefreshTokens(uid).catch(() => {});
      }
      if (updates.status === 'inactive') {
        await admin.auth().updateUser(uid, { disabled: true }).catch(() => {});
        await admin.auth().revokeRefreshTokens(uid).catch(() => {});
      } else if (updates.status === 'active') {
        await admin.auth().updateUser(uid, { disabled: false }).catch(() => {});
      }

      return res.json({ success: true, user: { ...existing, ...updates, id: uid, userId: uid } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[USERS-UPDATE-ERROR]', msg);
      return res.status(500).json({ success: false, error: `Could not update the account: ${msg}` });
    }
  });

  app.delete('/api/users/:uid', requireRole(['admin']), async (req, res) => {
    try {
      if (!isFirebaseAdminReady()) {
        return res.status(503).json({ success: false, error: 'Authentication is not configured on this server.', code: 'AUTH_NOT_CONFIGURED' });
      }

      const actor = req.user;
      if (!actor) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const uid = String(req.params.uid || '');
      if (uid === actor.uid) {
        return res.status(400).json({ success: false, error: 'You cannot delete your own active account.' });
      }

      const snapshot = await admin.firestore().doc(`users/${uid}`).get();
      if (!snapshot.exists) {
        return res.status(404).json({ success: false, error: 'No managed account exists for this member.', code: 'ACCOUNT_NOT_FOUND' });
      }
      const existing = snapshot.data() || {};
      if (!isPlatformOwner(actor) && existing.tenantId !== actor.tenantId) {
        return res.status(403).json({ success: false, error: 'Forbidden: the account belongs to another school.' });
      }
      if (existing.role === 'super_admin' && !isPlatformOwner(actor)) {
        return res.status(403).json({ success: false, error: 'Forbidden: platform owner accounts are protected.' });
      }

      await admin.firestore().doc(`users/${uid}`).delete();
      await admin.auth().deleteUser(uid).catch(() => {});
      if (typeof existing.tenantId === 'string' && existing.tenantId) {
        await releaseUserSeat(admin.firestore(), existing.tenantId).catch((releaseError: unknown) => {
          const msg = releaseError instanceof Error ? releaseError.message : String(releaseError);
          console.warn('[USERS-DELETE] Could not release the user seat:', msg);
        });
      }

      return res.json({ success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[USERS-DELETE-ERROR]', msg);
      return res.status(500).json({ success: false, error: `Could not delete the account: ${msg}` });
    }
  });

}
