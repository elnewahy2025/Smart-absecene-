import { describe, it, expect } from 'vitest';
import {
  applyReactivate,
  applyRenewal,
  applySuspend,
  computeAccessUntilMs,
  defaultSubscription,
  evaluateSubscription,
  normalizeSubscription,
} from '../config/subscription';

const NOW = new Date('2026-06-15T12:00:00.000Z');
const day = 24 * 60 * 60 * 1000;

/** Firestore rejects documents containing `undefined`, so the model must be clean. */
function findUndefinedPaths(value: unknown, path = 'root'): string[] {
  if (value === undefined) return [path];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findUndefinedPaths(item, `${path}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      findUndefinedPaths(item, `${path}.${key}`)
    );
  }
  return [];
}

describe('subscription model', () => {
  describe('normalizeSubscription', () => {
    it('returns a grandfathered, never-expiring default for junk input', () => {
      const sub = normalizeSubscription(undefined);
      expect(sub.status).toBe('active');
      expect(sub.plan).toBe('legacy');
      expect(sub.currentPeriodEnd).toBeNull();
      expect(sub.gracePeriodDays).toBe(7);
      expect(sub.manuallySuspended).toBe(false);
    });

    it('never emits undefined fields (Firestore-safe)', () => {
      expect(findUndefinedPaths(normalizeSubscription(defaultSubscription()))).toEqual([]);
      expect(findUndefinedPaths(normalizeSubscription({ limits: {} }))).toEqual([]);
      expect(findUndefinedPaths(normalizeSubscription({ limits: { maxStudents: 50 } }))).toEqual([]);
    });

    it('keeps only the limits the owner actually set', () => {
      expect(normalizeSubscription({ limits: {} }).limits).toEqual({});
      const partial = normalizeSubscription({ limits: { maxStudents: 50 } });
      expect(partial.limits).toEqual({ maxStudents: 50 });
      expect(Object.prototype.hasOwnProperty.call(partial.limits, 'maxUsers')).toBe(false);
    });

    it('coerces unknown enums and clamps the grace window', () => {
      const sub = normalizeSubscription({
        status: 'weird',
        billingCycle: 'weekly',
        gracePeriodDays: 9999,
        plan: '',
      });
      expect(sub.status).toBe('active');
      expect(sub.billingCycle).toBe('annual');
      expect(sub.gracePeriodDays).toBe(365);
      expect(sub.plan).toBe('legacy');
    });
  });

  describe('evaluateSubscription', () => {
    it('treats a missing period as active with no expiry', () => {
      const result = evaluateSubscription(defaultSubscription(), NOW);
      expect(result.effectiveStatus).toBe('active');
      expect(result.accessEnabled).toBe(true);
      expect(result.daysRemaining).toBeNull();
    });

    it('is active before the period end', () => {
      const end = new Date(NOW.getTime() + 10 * day).toISOString();
      const result = evaluateSubscription(
        { status: 'active', currentPeriodEnd: end, gracePeriodDays: 7 },
        NOW
      );
      expect(result.effectiveStatus).toBe('active');
      expect(result.accessEnabled).toBe(true);
      expect(result.daysRemaining).toBe(10);
    });

    it('moves into grace after the period end but keeps access', () => {
      const end = new Date(NOW.getTime() - 3 * day).toISOString();
      const result = evaluateSubscription(
        { status: 'active', currentPeriodEnd: end, gracePeriodDays: 7 },
        NOW
      );
      expect(result.effectiveStatus).toBe('grace');
      expect(result.accessEnabled).toBe(true);
      expect(result.isGrace).toBe(true);
      expect(result.graceDaysRemaining).toBe(4);
      expect(result.daysRemaining).toBe(-3);
    });

    it('expires once the grace window has elapsed', () => {
      const end = new Date(NOW.getTime() - 8 * day).toISOString();
      const result = evaluateSubscription(
        { status: 'active', currentPeriodEnd: end, gracePeriodDays: 7 },
        NOW
      );
      expect(result.effectiveStatus).toBe('expired');
      expect(result.accessEnabled).toBe(false);
    });

    it('honours a zero-day grace window', () => {
      const end = new Date(NOW.getTime() - 1 * day).toISOString();
      const result = evaluateSubscription(
        { status: 'active', currentPeriodEnd: end, gracePeriodDays: 0 },
        NOW
      );
      expect(result.effectiveStatus).toBe('expired');
      expect(result.accessEnabled).toBe(false);
    });

    it('lets an explicit owner stop override a far-future period', () => {
      const end = new Date(NOW.getTime() + 300 * day).toISOString();
      const result = evaluateSubscription(
        { status: 'active', currentPeriodEnd: end, manuallySuspended: true },
        NOW
      );
      expect(result.effectiveStatus).toBe('suspended');
      expect(result.accessEnabled).toBe(false);
    });

    it('treats a terminal expired status as blocked regardless of dates', () => {
      const end = new Date(NOW.getTime() + 300 * day).toISOString();
      const result = evaluateSubscription({ status: 'expired', currentPeriodEnd: end }, NOW);
      expect(result.effectiveStatus).toBe('expired');
      expect(result.accessEnabled).toBe(false);
    });
  });

  describe('state transitions', () => {
    it('renewing from a lapsed subscription starts a fresh period from now', () => {
      const renewed = applyRenewal(
        { status: 'active', currentPeriodEnd: new Date(NOW.getTime() - 40 * day).toISOString() },
        { cycle: 'monthly', now: NOW }
      );
      expect(renewed.status).toBe('active');
      expect(renewed.manuallySuspended).toBe(false);
      expect(new Date(renewed.currentPeriodEnd!).getTime()).toBeGreaterThan(NOW.getTime());
      expect(renewed.accessUntilMs).toBe(computeAccessUntilMs(renewed));
    });

    it('renewing early never loses paid time (anchors on the later period end)', () => {
      const futureEnd = new Date(NOW.getTime() + 10 * day);
      const renewed = applyRenewal(
        { status: 'active', currentPeriodEnd: futureEnd.toISOString() },
        { cycle: 'monthly', now: NOW }
      );
      expect(new Date(renewed.currentPeriodEnd!).getTime()).toBeGreaterThanOrEqual(
        futureEnd.getTime()
      );
    });

    it('accepts an explicit period end for custom terms', () => {
      const explicit = new Date('2027-01-01T00:00:00.000Z').toISOString();
      const renewed = applyRenewal(defaultSubscription(), { periodEnd: explicit, now: NOW });
      expect(renewed.currentPeriodEnd).toBe(explicit);
    });

    it('suspend then reactivate round-trips back to active', () => {
      const suspended = applySuspend(defaultSubscription(), { by: 'owner', reason: 'unpaid', now: NOW });
      expect(findUndefinedPaths(suspended)).toEqual([]);
      expect(suspended.status).toBe('suspended');
      expect(suspended.manuallySuspended).toBe(true);
      expect(evaluateSubscription(suspended, NOW).accessEnabled).toBe(false);

      const reactivated = applyReactivate(suspended, { by: 'owner', now: NOW });
      expect(reactivated.status).toBe('active');
      expect(reactivated.manuallySuspended).toBe(false);
      expect(evaluateSubscription(reactivated, NOW).accessEnabled).toBe(true);
    });
  });

  describe('computeAccessUntilMs', () => {
    it('is zero when the school never expires', () => {
      expect(computeAccessUntilMs(defaultSubscription())).toBe(0);
    });

    it('equals period end plus the grace window', () => {
      const end = '2026-07-01T00:00:00.000Z';
      const ms = computeAccessUntilMs(
        normalizeSubscription({ currentPeriodEnd: end, gracePeriodDays: 7 })
      );
      expect(ms).toBe(new Date(end).getTime() + 7 * day);
    });
  });
});
