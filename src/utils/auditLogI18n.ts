import { AuditLog, UserRole } from '../types/attendance';

export type AppLang = 'ar' | 'en';

const AUDIT_ACTION_LABELS: Record<AuditLog['action'], { ar: string; en: string }> = {
  create: { ar: 'إنشاء', en: 'Create' },
  update: { ar: 'تعديل', en: 'Update' },
  submit: { ar: 'اعتماد / رفع', en: 'Submit' },
  reopen: { ar: 'إعادة فتح', en: 'Reopen' },
  delete: { ar: 'حذف', en: 'Delete' },
  export: { ar: 'تصدير', en: 'Export' },
};

const AUDIT_ENTITY_LABELS: Record<AuditLog['entityType'], { ar: string; en: string }> = {
  session: { ar: 'كشف الحضور', en: 'Attendance Session' },
  record: { ar: 'سجل حضور طالب', en: 'Attendance Record' },
  justification: { ar: 'عذر طبي', en: 'Justification' },
  student: { ar: 'طالب', en: 'Student' },
  settings: { ar: 'إعدادات', en: 'Settings' },
};

const ROLE_LABELS: Record<UserRole, { ar: string; en: string }> = {
  super_admin: { ar: 'مالك المنصة', en: 'Platform Owner' },
  admin: { ar: 'مدير', en: 'Admin' },
  registrar: { ar: 'شؤون طلبة', en: 'Registrar' },
  teacher: { ar: 'معلم', en: 'Teacher' },
  parent: { ar: 'ولي أمر', en: 'Parent' },
};

// Value translation for the "Change (Before / After)" column and other enum-like cells.
const AUDIT_VALUE_LABELS: Record<string, { ar: string; en: string }> = {
  present: { ar: 'حاضر', en: 'Present' },
  absent: { ar: 'غائب', en: 'Absent' },
  late: { ar: 'متأخر', en: 'Late' },
  excused: { ar: 'بعذر', en: 'Excused' },
  unexcused: { ar: 'بدون عذر', en: 'Unexcused' },
  active: { ar: 'نشط', en: 'Active' },
  inactive: { ar: 'موقوف', en: 'Inactive' },
  pending: { ar: 'قيد المراجعة', en: 'Pending' },
  approved: { ar: 'معتمد', en: 'Approved' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
  submitted: { ar: 'مُعتمد', en: 'Submitted' },
  draft: { ar: 'مسودة', en: 'Draft' },
  reopened: { ar: 'معاد فتحه', en: 'Reopened' },
  positive: { ar: 'إيجابي', en: 'Positive' },
  negative: { ar: 'سلبي', en: 'Negative' },
  daily: { ar: 'يومي', en: 'Daily' },
  period: { ar: 'بالحصص', en: 'Per Period' },
  both: { ar: 'الاثنان معاً', en: 'Both' },
  sms: { ar: 'رسائل SMS', en: 'SMS' },
  whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
  verified: { ar: 'موثّق', en: 'Verified' },
  warning: { ar: 'تحذير', en: 'Warning' },
  irregular: { ar: 'غير منتظم', en: 'Irregular' },
  enabled: { ar: 'مفعّل', en: 'Enabled' },
  disabled: { ar: 'معطّل', en: 'Disabled' },
  true: { ar: 'نعم', en: 'Yes' },
  false: { ar: 'لا', en: 'No' },
  // Free-text before/after values stored at audit-write time.
  'بانتظار مسح الـ QR': { ar: 'بانتظار مسح الـ QR', en: 'Pending QR Scan' },
  'بانتظار مسح الـ QR (جلسة نشطة)': { ar: 'بانتظار مسح الـ QR (جلسة نشطة)', en: 'Pending QR Scan (Active Session)' },
  'غير مؤكد': { ar: 'غير مؤكد', en: 'Unconfirmed' },
  'حاضر للكل': { ar: 'حاضر للكل', en: 'All Present' },
  'جلسة QR نشطة': { ar: 'جلسة QR نشطة', en: 'Active QR Session' },
  'كشف معتمد نهائياً': { ar: 'كشف معتمد نهائياً', en: 'Roster Fully Confirmed' },
  'وضع QR / غائب': { ar: 'وضع QR / غائب', en: 'QR Mode / Absent' },
  'التحضير اليدوي (حاضر للكل)': { ar: 'التحضير اليدوي (حاضر للكل)', en: 'Manual Attendance (All Present)' },
  'معتمد (Submitted)': { ar: 'معتمد (Submitted)', en: 'Submitted' },
  'مُعاد فتحه (Reopened)': { ar: 'مُعاد فتحه (Reopened)', en: 'Reopened' },
  'قيد المراجعة': { ar: 'قيد المراجعة', en: 'Under Review' },
  'معتمد': { ar: 'معتمد', en: 'Approved' },
  'مرفوض': { ar: 'مرفوض', en: 'Rejected' },
};

// Matches statuses like "حاضر (10:45)" while preserving the captured value.
const AUDIT_VALUE_PATTERNS: Array<{ pattern: RegExp; en: (m: RegExpMatchArray) => string }> = [
  { pattern: /^حاضر \((.+)\)$/, en: (m) => `Present (${m[1]})` },
];

export const translateAuditAction = (action: string, lang: AppLang): string => {
  const label = AUDIT_ACTION_LABELS[action as AuditLog['action']];
  return label ? label[lang] : action;
};

export const translateAuditEntity = (entityType: string, lang: AppLang): string => {
  const label = AUDIT_ENTITY_LABELS[entityType as AuditLog['entityType']];
  return label ? label[lang] : entityType;
};

export const translateAuditRole = (role: string, lang: AppLang): string => {
  const label = ROLE_LABELS[role as UserRole];
  return label ? label[lang] : role;
};

/**
 * Translates a single scalar audit value (status/role/mode/flag) for display.
 * Returns the original value untouched when no known label exists, so dates,
 * names, free text and identifiers flow through unchanged.
 */
export const translateAuditValue = (value: string | undefined, lang: AppLang): string => {
  if (value === undefined || value === null) return '';
  const raw = String(value);
  const key = raw.trim().toLowerCase();
  const label = AUDIT_VALUE_LABELS[key] || AUDIT_VALUE_LABELS[raw.trim()] || ROLE_LABELS[key as UserRole];
  if (label) return label[lang];
  if (lang === 'en') {
    const trimmed = raw.trim();
    for (const { pattern, en } of AUDIT_VALUE_PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) return en(match);
    }
  }
  return raw;
};

/**
 * Resolves the localized "Action Details" text for an audit entry.
 * Prefers the stored English translation when present, otherwise keeps the
 * original (typically Arabic) text so no entry is ever left blank.
 */
export const getAuditDetails = (
  log: Pick<AuditLog, 'details' | 'detailsEn'>,
  lang: AppLang
): string => {
  if (lang === 'en' && log.detailsEn) return log.detailsEn;
  return log.details;
};

/** Builds a lowercased haystack covering both languages for audit search. */
export const getAuditSearchHaystack = (log: AuditLog): string =>
  [log.details, log.detailsEn, log.action, log.entityType, log.performerName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
