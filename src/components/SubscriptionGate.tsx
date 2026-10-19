import React from 'react';
import { ShieldAlert, CalendarClock, LogOut, Sparkles } from 'lucide-react';
import type { SubscriptionEvaluation } from '../config/subscription';

interface BannerProps {
  access: SubscriptionEvaluation;
  lang: 'ar' | 'en';
}

/**
 * Non-blocking renewal warning. Shown during the grace window and in the last
 * two weeks of a paid period. Access remains allowed until the boundary passes.
 */
export const SubscriptionBanner: React.FC<BannerProps> = ({ access, lang }) => {
  const ar = lang === 'ar';
  if (!access.accessEnabled || access.daysRemaining === null) return null;

  const inGrace = access.isGrace;
  if (!inGrace && access.daysRemaining > 14) return null;

  const days = Math.max(0, inGrace ? access.graceDaysRemaining ?? 0 : access.daysRemaining);
  const title = inGrace
    ? ar
      ? 'انتهت فترة الاشتراك — أنت الآن في فترة السماح'
      : 'Subscription period ended — you are in the grace window'
    : ar
      ? `اشتراك المدرسة ينتهي خلال ${days} يوم`
      : `School subscription ends in ${days} day(s)`;
  const detail = inGrace
    ? ar
      ? `ستنتهي فترة السماح خلال ${days} يوم، وسيتم إيقاف الوصول بعدها. يرجى التواصل مع الجهة المالكة لتجديد الاشتراك.`
      : `Grace ends in ${days} day(s); access will be blocked afterwards. Contact the platform owner to renew.`
    : ar
      ? 'يرجى التواصل مع الجهة المالكة للمنصة لتجديد الاشتراك قبل انتهاء الفترة.'
      : 'Contact the platform owner to renew before the period ends.';

  return (
    <div
      role="status"
      className={`${
        inGrace ? 'bg-rose-600' : 'bg-amber-500'
      } text-white text-xs font-semibold px-4 py-2 flex items-center justify-between gap-3 shadow-xs`}
    >
      <div className="flex items-center gap-2">
        {inGrace ? <ShieldAlert className="w-4 h-4 shrink-0" /> : <CalendarClock className="w-4 h-4 shrink-0" />}
        <div className="flex flex-col leading-tight">
          <span>{title}</span>
          <span className="font-normal text-white/85 mt-0.5">{detail}</span>
        </div>
      </div>
    </div>
  );
};

interface SuspendedProps {
  access: SubscriptionEvaluation;
  lang: 'ar' | 'en';
  schoolName: string;
  onSignOut?: () => void;
}

/**
 * Full-block screen for a stopped or expired school. The platform owner bypasses
 * this gate (enforced in App root) so they can always sign in and renew.
 */
export const SubscriptionSuspendedView: React.FC<SuspendedProps> = ({
  access,
  lang,
  schoolName,
  onSignOut,
}) => {
  const ar = lang === 'ar';
  const suspended = access.effectiveStatus === 'suspended';
  const periodLabel = access.periodEnd
    ? new Date(access.periodEnd).toLocaleDateString(ar ? 'ar-SA' : 'en-GB')
    : null;

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-['Cairo',sans-serif]"
    >
      <div className="w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-amber-500/30 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white font-extrabold text-lg">
              {suspended
                ? ar
                  ? 'تم إيقاف اشتراك المدرسة'
                  : 'School subscription suspended'
                : ar
                  ? 'انتهى اشتراك المدرسة'
                  : 'School subscription expired'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{schoolName}</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            {suspended
              ? ar
                ? 'أوقف مالك المنصة الوصول إلى هذه المدرسة مؤقتاً. لا يمكن حالياً عرض أو تعديل بيانات الحضور.'
                : 'The platform owner has temporarily stopped access to this school. Attendance data cannot be viewed or modified right now.'
              : ar
                ? 'انتهت صلاحية الاشتراك وفترة السماح. لا يمكن حالياً عرض أو تعديل بيانات الحضور.'
                : 'The subscription and its grace window have ended. Attendance data cannot be viewed or modified right now.'}
          </p>

          {periodLabel && (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2">
              <CalendarClock className="w-4 h-4 text-amber-400" />
              <span>
                {ar ? 'انتهت فترة الاشتراك في:' : 'Subscription period ended on:'}{' '}
                <span className="font-mono text-slate-200">{periodLabel}</span>
              </span>
            </div>
          )}

          {access.status === 'suspended' && access.plan && (
            <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl px-3 py-2">
              <Sparkles className="w-4 h-4" />
              <span>
                {ar ? 'الباقة الحالية:' : 'Current plan:'}{' '}
                <span className="font-mono">{access.plan}</span>
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400">
            {ar
              ? 'يرجى التواصل مع الجهة المالكة للمنصة لتجديد الاشتراك أو إعادة تنشيط المدرسة. ستبقى بياناتكم محفوظة بالكامل.'
              : 'Please contact the platform owner to renew the subscription or reactivate the school. Your data remains fully preserved.'}
          </p>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            {ar ? 'رمز الحالة:' : 'Status code:'} {access.effectiveStatus.toUpperCase()}
          </span>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{ar ? 'تسجيل الخروج' : 'Sign out'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
