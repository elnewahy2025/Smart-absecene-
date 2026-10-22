import type { Express, Request, RequestHandler, Response } from 'express';
import {
  applyReactivate,
  applyRenewal,
  applySuspend,
  computeAccessUntilMs,
  evaluateSubscription,
} from '../src/config/subscription';
import type { TenantSubscription } from '../src/config/subscription';

interface SubscriptionRouteDeps {
  app: Express;
  requirePlatformOwner: RequestHandler;
  tenantIdPattern: RegExp;
  loadTenantSubscription: (tenantId: string) => Promise<TenantSubscription>;
  persistTenantSubscription: (
    tenantId: string,
    subscription: TenantSubscription,
    actor: { uid?: string; email?: string } | undefined,
    audit: { action: string; details: string; detailsEn: string }
  ) => Promise<void>;
}

export function registerSubscriptionRoutes({
  app,
  requirePlatformOwner,
  tenantIdPattern,
  loadTenantSubscription,
  persistTenantSubscription,
}: SubscriptionRouteDeps) {
  // --- Tenant subscription & renewal control (platform owner only) -------------
  // The owner can stop, renew, re-activate, and re-plan any school. Every change
  // is written to the audit log and invalidates the enforcement cache immediately.
  function resolveSubscriptionTenantId(req: Request, res: Response): string | null {
    const raw = typeof req.params?.tenantId === 'string' ? req.params.tenantId.trim().toLowerCase() : '';
    if (!tenantIdPattern.test(raw)) {
      res.status(400).json({ success: false, error: 'A valid tenantId is required.' });
      return null;
    }
    return raw;
  }

  const subscriptionActor = (req: Request) => {
    return { uid: req.user?.uid, email: req.user?.email };
  };

  function subscriptionSummary(sub: TenantSubscription) {
    const evaluation = evaluateSubscription(sub);
    return {
      plan: sub.plan,
      status: sub.status,
      effectiveStatus: evaluation.effectiveStatus,
      accessEnabled: evaluation.accessEnabled,
      billingCycle: sub.billingCycle,
      gracePeriodDays: sub.gracePeriodDays,
      autoRenew: sub.autoRenew,
      manuallySuspended: sub.manuallySuspended,
      currentPeriodStart: sub.currentPeriodStart || null,
      currentPeriodEnd: sub.currentPeriodEnd || null,
      daysRemaining: evaluation.daysRemaining,
      graceDaysRemaining: evaluation.graceDaysRemaining,
      lastPaymentAt: sub.lastPaymentAt || null,
      amount: sub.amount ?? null,
      currency: sub.currency || null,
      limits: sub.limits || {},
    };
  }

  app.get('/api/tenants/:tenantId/subscription', requirePlatformOwner, async (req, res) => {
    const tenantId = resolveSubscriptionTenantId(req, res);
    if (!tenantId) return;
    try {
      const sub = await loadTenantSubscription(tenantId);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json({ success: true, tenantId, subscription: sub, summary: subscriptionSummary(sub) });
    } catch (err: unknown) {
      console.error('[SUBSCRIPTION-READ-ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to read the subscription.' });
    }
  });

  app.post('/api/tenants/:tenantId/subscription/suspend', requirePlatformOwner, async (req, res) => {
    const tenantId = resolveSubscriptionTenantId(req, res);
    if (!tenantId) return;
    try {
      const current = await loadTenantSubscription(tenantId);
      const reason =
        typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 300) : '';
      const updated = applySuspend(current, {
        by: subscriptionActor(req).email,
        reason: reason || null,
      });
      await persistTenantSubscription(tenantId, updated, subscriptionActor(req), {
        action: 'subscription.suspend',
        details: `تم إيقاف اشتراك المدرسة${reason ? ` — السبب: ${reason}` : ''}`,
        detailsEn: `School subscription suspended${reason ? ` — reason: ${reason}` : ''}`,
      });
      res.json({ success: true, tenantId, subscription: updated, summary: subscriptionSummary(updated) });
    } catch (err: unknown) {
      console.error('[SUBSCRIPTION-SUSPEND-ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to suspend the subscription.' });
    }
  });

  app.post('/api/tenants/:tenantId/subscription/reactivate', requirePlatformOwner, async (req, res) => {
    const tenantId = resolveSubscriptionTenantId(req, res);
    if (!tenantId) return;
    try {
      const current = await loadTenantSubscription(tenantId);
      const updated = applyReactivate(current, { by: subscriptionActor(req).email });
      await persistTenantSubscription(tenantId, updated, subscriptionActor(req), {
        action: 'subscription.reactivate',
        details: 'تمت إعادة تنشيط اشتراك المدرسة',
        detailsEn: 'School subscription reactivated',
      });
      res.json({ success: true, tenantId, subscription: updated, summary: subscriptionSummary(updated) });
    } catch (err: unknown) {
      console.error('[SUBSCRIPTION-REACTIVATE-ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to reactivate the subscription.' });
    }
  });

  app.post('/api/tenants/:tenantId/subscription/renew', requirePlatformOwner, async (req, res) => {
    const tenantId = resolveSubscriptionTenantId(req, res);
    if (!tenantId) return;
    try {
      const current = await loadTenantSubscription(tenantId);
      const body = req.body || {};
      const cycle = body.cycle === 'monthly' || body.cycle === 'annual' ? body.cycle : undefined;
      const months = typeof body.months === 'number' && body.months > 0 ? Math.min(Math.floor(body.months), 60) : undefined;
      const periodEnd = typeof body.periodEnd === 'string' && !Number.isNaN(new Date(body.periodEnd).getTime())
        ? body.periodEnd
        : undefined;
      const updated = applyRenewal(current, {
        cycle,
        months,
        periodEnd,
        amount: typeof body.amount === 'number' ? body.amount : undefined,
        currency: typeof body.currency === 'string' ? body.currency.slice(0, 8) : undefined,
        updatedBy: subscriptionActor(req).email,
      });
      await persistTenantSubscription(tenantId, updated, subscriptionActor(req), {
        action: 'subscription.renew',
        details: `تم تجديد اشتراك المدرسة حتى ${updated.currentPeriodEnd}`,
        detailsEn: `School subscription renewed until ${updated.currentPeriodEnd}`,
      });
      res.json({ success: true, tenantId, subscription: updated, summary: subscriptionSummary(updated) });
    } catch (err: unknown) {
      console.error('[SUBSCRIPTION-RENEW-ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to renew the subscription.' });
    }
  });

  app.patch('/api/tenants/:tenantId/subscription', requirePlatformOwner, async (req, res) => {
    const tenantId = resolveSubscriptionTenantId(req, res);
    if (!tenantId) return;
    try {
      const current = await loadTenantSubscription(tenantId);
      const body = req.body || {};
      const updated: TenantSubscription = { ...current };

      if (typeof body.plan === 'string' && body.plan.trim()) updated.plan = body.plan.trim().slice(0, 40);
      if (body.billingCycle === 'monthly' || body.billingCycle === 'annual') updated.billingCycle = body.billingCycle;
      if (typeof body.gracePeriodDays === 'number' && body.gracePeriodDays >= 0) {
        updated.gracePeriodDays = Math.min(Math.floor(body.gracePeriodDays), 365);
      }
      if (typeof body.autoRenew === 'boolean') updated.autoRenew = body.autoRenew;
      if (typeof body.currentPeriodEnd === 'string') {
        updated.currentPeriodEnd =
          body.currentPeriodEnd === '' ? null : body.currentPeriodEnd;
      }
      if (typeof body.amount === 'number') updated.amount = body.amount;
      if (typeof body.currency === 'string') updated.currency = body.currency.slice(0, 8);
      if (typeof body.notes === 'string') updated.notes = body.notes.slice(0, 500);
      if (body.limits && typeof body.limits === 'object') {
        updated.limits = {
          maxStudents: typeof body.limits.maxStudents === 'number' ? body.limits.maxStudents : updated.limits?.maxStudents,
          maxUsers: typeof body.limits.maxUsers === 'number' ? body.limits.maxUsers : updated.limits?.maxUsers,
        };
      }
      updated.updatedAt = new Date().toISOString();
      updated.updatedBy = subscriptionActor(req).email || null;
      updated.accessUntilMs = computeAccessUntilMs(updated);

      await persistTenantSubscription(tenantId, updated, subscriptionActor(req), {
        action: 'subscription.update',
        details: 'تم تحديث سياسة اشتراك المدرسة',
        detailsEn: 'School subscription policy updated',
      });
      res.json({ success: true, tenantId, subscription: updated, summary: subscriptionSummary(updated) });
    } catch (err: unknown) {
      console.error('[SUBSCRIPTION-UPDATE-ERROR]', err);
      res.status(500).json({ success: false, error: 'Failed to update the subscription.' });
    }
  });

}
