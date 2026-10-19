/**
 * Per-school subscription / renewal policy (single source of truth).
 *
 * This module is intentionally dependency-free so it can run unchanged on the
 * Express server (enforcement) and in the browser (banners / gating). The
 * design is a clock-based state machine: the *effective* access state is always
 * derived from the stored plan + dates + manual flags at request time, so expiry
 * happens lazily without a cron job (same pattern used by mature SaaS billing
 * platforms). Storing the raw provider state and computing access on read keeps
 * this ready for a future Stripe-backed automation without a rewrite.
 */

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'grace'
  | 'suspended'
  | 'expired'
  | 'cancelled';

export type BillingCycle = 'monthly' | 'annual';

/** Effective, time-aware access state (what enforcement actually acts on). */
export type EffectiveAccessStatus = 'active' | 'grace' | 'suspended' | 'expired';

export interface SubscriptionLimits {
  maxStudents?: number;
  maxUsers?: number;
}

export interface TenantSubscription {
  plan: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  /** ISO timestamps. A missing currentPeriodEnd means "never expires". */
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  gracePeriodDays: number;
  autoRenew: boolean;
  /** Owner-initiated stop. Takes precedence over every date. */
  manuallySuspended: boolean;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
  suspendReason?: string | null;
  lastPaymentAt?: string | null;
  amount?: number | null;
  currency?: string | null;
  notes?: string | null;
  limits?: SubscriptionLimits;
  /**
   * Denormalized epoch-millis access boundary (period end + grace), or 0 for
   * "never expires". Stored so Firestore Security Rules can enforce the same
   * boundary without date parsing.
   */
  accessUntilMs?: number;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface SubscriptionEvaluation {
  effectiveStatus: EffectiveAccessStatus;
  accessEnabled: boolean;
  isGrace: boolean;
  /** Days until period end (negative once past). Null when no period is set. */
  daysRemaining: number | null;
  /** Days left in the grace window (only meaningful while in grace). */
  graceDaysRemaining: number | null;
  periodEnd: string | null;
  plan: string;
  status: SubscriptionStatus;
}

export const DEFAULT_GRACE_PERIOD_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export const GRANDFATHERED_PLAN = 'legacy';

/** Grandfathered default: an existing school with no subscription doc keeps working. */
export function defaultSubscription(): TenantSubscription {
  return {
    plan: GRANDFATHERED_PLAN,
    status: 'active',
    billingCycle: 'annual',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    gracePeriodDays: DEFAULT_GRACE_PERIOD_DAYS,
    autoRenew: true,
    manuallySuspended: false,
    limits: {},
  };
}

function toDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Coerces arbitrary Firestore data into a well-formed subscription. */
export function normalizeSubscription(raw: unknown): TenantSubscription {
  const base = defaultSubscription();
  if (!raw || typeof raw !== 'object') return base;
  const value = raw as Record<string, unknown>;

  const status = (
    ['trial', 'active', 'grace', 'suspended', 'expired', 'cancelled'] as const
  ).includes(value.status as SubscriptionStatus)
    ? (value.status as SubscriptionStatus)
    : base.status;

  const billingCycle: BillingCycle =
    value.billingCycle === 'monthly' || value.billingCycle === 'annual'
      ? value.billingCycle
      : base.billingCycle;

  const gracePeriodDays =
    typeof value.gracePeriodDays === 'number' && value.gracePeriodDays >= 0
      ? Math.min(Math.floor(value.gracePeriodDays), 365)
      : base.gracePeriodDays;

  const limits: SubscriptionLimits | undefined =
    value.limits && typeof value.limits === 'object'
      ? (() => {
          const parsed: SubscriptionLimits = {};
          const rawLimits = value.limits as Record<string, unknown>;
          if (typeof rawLimits.maxStudents === 'number') {
            parsed.maxStudents = rawLimits.maxStudents;
          }
          if (typeof rawLimits.maxUsers === 'number') {
            parsed.maxUsers = rawLimits.maxUsers;
          }
          return parsed;
        })()
      : base.limits;

  return {
    plan: typeof value.plan === 'string' && value.plan ? value.plan : base.plan,
    status,
    billingCycle,
    currentPeriodStart:
      typeof value.currentPeriodStart === 'string' ? value.currentPeriodStart : null,
    currentPeriodEnd:
      typeof value.currentPeriodEnd === 'string' ? value.currentPeriodEnd : null,
    gracePeriodDays,
    autoRenew: value.autoRenew === undefined ? base.autoRenew : Boolean(value.autoRenew),
    manuallySuspended: Boolean(value.manuallySuspended),
    suspendedAt: typeof value.suspendedAt === 'string' ? value.suspendedAt : null,
    suspendedBy: typeof value.suspendedBy === 'string' ? value.suspendedBy : null,
    suspendReason: typeof value.suspendReason === 'string' ? value.suspendReason : null,
    lastPaymentAt: typeof value.lastPaymentAt === 'string' ? value.lastPaymentAt : null,
    amount: typeof value.amount === 'number' ? value.amount : null,
    currency: typeof value.currency === 'string' ? value.currency : null,
    notes: typeof value.notes === 'string' ? value.notes : null,
    limits,
    // Only include the denormalized boundary when it is actually a number:
    // Firestore rejects documents containing `undefined` field values.
    ...(typeof value.accessUntilMs === 'number' ? { accessUntilMs: value.accessUntilMs } : {}),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
    updatedBy: typeof value.updatedBy === 'string' ? value.updatedBy : null,
  };
}

/**
 * The epoch-millis boundary at which access stops (period end + grace), or 0
 * when the school never expires. Mirrors what Security Rules compare against.
 */
export function computeAccessUntilMs(sub: TenantSubscription): number {
  const periodEnd = toDate(sub.currentPeriodEnd);
  if (!periodEnd) return 0;
  return periodEnd.getTime() + sub.gracePeriodDays * DAY_MS;
}

function daysBetween(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * Derives the effective access state from the stored subscription at `now`.
 *
 * Precedence: explicit stop > terminal status > clock (period end / grace).
 */
export function evaluateSubscription(
  raw: unknown,
  now: Date = new Date()
): SubscriptionEvaluation {
  const sub = normalizeSubscription(raw);
  const periodEnd = toDate(sub.currentPeriodEnd);

  const base = {
    plan: sub.plan,
    status: sub.status,
    periodEnd: periodEnd ? periodEnd.toISOString() : null,
    daysRemaining: periodEnd ? daysBetween(now, periodEnd) : null,
    graceDaysRemaining: null as number | null,
  };

  // 1. Owner-initiated stop always wins.
  if (sub.manuallySuspended || sub.status === 'suspended') {
    return { ...base, effectiveStatus: 'suspended', accessEnabled: false, isGrace: false };
  }

  // 2. Terminal status with no time left.
  if (sub.status === 'expired') {
    return { ...base, effectiveStatus: 'expired', accessEnabled: false, isGrace: false };
  }

  // 3. No period configured: grandfathered / open-ended access.
  if (!periodEnd) {
    const isGrace = sub.status === 'grace' || sub.status === 'cancelled';
    return {
      ...base,
      effectiveStatus: isGrace ? 'grace' : 'active',
      accessEnabled: true,
      isGrace,
    };
  }

  // 4. Clock-based evaluation against the period end + grace window.
  if (now.getTime() <= periodEnd.getTime()) {
    return { ...base, effectiveStatus: 'active', accessEnabled: true, isGrace: false };
  }

  const graceEnd = new Date(periodEnd.getTime() + sub.gracePeriodDays * DAY_MS);
  if (now.getTime() <= graceEnd.getTime()) {
    return {
      ...base,
      effectiveStatus: 'grace',
      accessEnabled: true,
      isGrace: true,
      graceDaysRemaining: daysBetween(now, graceEnd),
    };
  }

  return { ...base, effectiveStatus: 'expired', accessEnabled: false, isGrace: false };
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setMonth(result.getMonth() + months);
  return result;
}

export interface RenewOptions {
  cycle?: BillingCycle;
  months?: number;
  periodEnd?: string;
  amount?: number | null;
  currency?: string | null;
  updatedBy?: string | null;
  now?: Date;
}

/**
 * Extends a subscription. The next period starts from whichever is later:
 * now, or the current period end (so renewing early never loses paid time).
 */
export function applyRenewal(raw: unknown, options: RenewOptions = {}): TenantSubscription {
  const sub = normalizeSubscription(raw);
  const now = options.now || new Date();
  const cycle: BillingCycle = options.cycle || sub.billingCycle;

  const explicitEnd = toDate(options.periodEnd);
  const currentEnd = toDate(sub.currentPeriodEnd);
  const anchor =
    currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;

  const nextEnd =
    explicitEnd ||
    addMonths(anchor, typeof options.months === 'number' ? options.months : cycle === 'monthly' ? 1 : 12);

  const renewed: TenantSubscription = {
    ...sub,
    status: 'active',
    billingCycle: cycle,
    currentPeriodStart: now.toISOString(),
    currentPeriodEnd: nextEnd.toISOString(),
    manuallySuspended: false,
    suspendedAt: null,
    suspendedBy: null,
    suspendReason: null,
    lastPaymentAt: now.toISOString(),
    autoRenew: true,
    amount: options.amount !== undefined ? options.amount : sub.amount,
    currency: options.currency !== undefined ? options.currency : sub.currency,
    updatedAt: now.toISOString(),
    updatedBy: options.updatedBy || sub.updatedBy || null,
  };
  renewed.accessUntilMs = computeAccessUntilMs(renewed);
  return renewed;
}

export function applySuspend(
  raw: unknown,
  options: { by?: string | null; reason?: string | null; now?: Date } = {}
): TenantSubscription {
  const sub = normalizeSubscription(raw);
  const now = options.now || new Date();
  const suspended: TenantSubscription = {
    ...sub,
    status: 'suspended',
    manuallySuspended: true,
    suspendedAt: now.toISOString(),
    suspendedBy: options.by || null,
    suspendReason: options.reason || null,
    updatedAt: now.toISOString(),
    updatedBy: options.by || sub.updatedBy || null,
  };
  suspended.accessUntilMs = computeAccessUntilMs(suspended);
  return suspended;
}

export function applyReactivate(
  raw: unknown,
  options: { by?: string | null; now?: Date } = {}
): TenantSubscription {
  const sub = normalizeSubscription(raw);
  const now = options.now || new Date();
  const reactivated: TenantSubscription = {
    ...sub,
    status: 'active',
    manuallySuspended: false,
    suspendedAt: null,
    suspendedBy: null,
    suspendReason: null,
    updatedAt: now.toISOString(),
    updatedBy: options.by || sub.updatedBy || null,
  };
  reactivated.accessUntilMs = computeAccessUntilMs(reactivated);
  return reactivated;
}
