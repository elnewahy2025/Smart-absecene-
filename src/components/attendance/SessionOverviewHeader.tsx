import React from 'react';
import { Check, CheckCircle2, RotateCcw, Scan, Sparkles, UserCheck, Users, Zap } from 'lucide-react';
import { AttendanceSession, UserRole } from '../../types/attendance';

interface SessionOverviewHeaderProps {
  lang: 'ar' | 'en';
  session: AttendanceSession;
  currentUserRole: UserRole;
  isQuickMarkMenuOpen: boolean;
  onToggleQuickMarkMenu: () => void;
  onCloseQuickMarkMenu: () => void;
  selectedStudentIdsForGroup: string[];
  onQuickMarkWholeClass: () => void;
  onQuickMarkSelectedGroup: () => void;
  onOpenScanner: () => void;
  onSubmitSession: () => void;
  onOpenReopen: () => void;
}

export const SessionOverviewHeader: React.FC<SessionOverviewHeaderProps> = ({
  lang,
  session,
  currentUserRole,
  isQuickMarkMenuOpen,
  onToggleQuickMarkMenu,
  onCloseQuickMarkMenu,
  selectedStudentIdsForGroup,
  onQuickMarkWholeClass,
  onQuickMarkSelectedGroup,
  onOpenScanner,
  onSubmitSession,
  onOpenReopen,
}) => {
  return (
    <div className="p-5 border-b border-slate-200 bg-slate-50/70">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900">
              {session.subject || 'كشف الحضور الصباحي'}
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                session.status === 'submitted'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : session.status === 'draft'
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-sky-100 border-sky-300 text-sky-800'
              }`}
            >
              {session.status === 'submitted'
                ? lang === 'ar' ? 'معتمد ومرسل رسميًا' : 'Submitted'
                : session.status === 'draft'
                ? lang === 'ar' ? 'مسودة قيد الإدخال' : 'Draft'
                : lang === 'ar' ? 'مُعاد فتحه للتصحيح' : 'Reopened'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
            <span>
              <strong className="text-slate-700">{lang === 'ar' ? 'الفصل:' : 'Class:'}</strong> {session.className} ({session.grade})
            </span>
            <span>·</span>
            <span>
              <strong className="text-slate-700">{lang === 'ar' ? 'المعلم:' : 'Teacher:'}</strong> {session.teacherName}
            </span>
            <span>·</span>
            <span>
              <strong className="text-slate-700">{lang === 'ar' ? 'التاريخ:' : 'Date:'}</strong> {session.date}
            </span>
            {session.submittedAt && (
              <>
                <span>·</span>
                <span>
                  <strong className="text-slate-700">{lang === 'ar' ? 'اعتُمد في:' : 'Submitted at:'}</strong>{' '}
                  {new Date(session.submittedAt).toLocaleTimeString('ar-SA')}
                </span>
              </>
            )}
            {session.reopenedReason && (
              <div className="w-full mt-1 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded text-[11px]">
                <strong>{lang === 'ar' ? 'سبب إعادة الفتح الموثق:' : 'Reopened Reason:'}</strong> {session.reopenedReason} (بواسطة: {session.reopenedBy})
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenScanner()}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="مسح بطاقات الطلاب بالكاميرا لتسجيل الحضور بدون لمس"
          >
            <Scan className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'ar' ? 'قارئ QR بدون لمس' : 'Scan QR'}</span>
          </button>

          {/* Primary Quick Mark Feature Button */}
          <div className="relative">
            <button
              onClick={() => onToggleQuickMarkMenu()}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all cursor-pointer shadow-xs border border-emerald-500/40"
              title="التحضير السريع: تعيين كامل الفصل أو مجموعة محددة كـ حاضر افتراضياً لتوفير الوقت"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'ar' ? 'التحضير السريع (Quick Mark)' : 'Quick Mark'}</span>
              <span className="bg-emerald-950/40 text-emerald-200 text-[10px] px-1.5 py-0.2 rounded font-normal">
                {selectedStudentIdsForGroup.length > 0
                  ? `${selectedStudentIdsForGroup.length} محدد`
                  : lang === 'ar' ? 'الفصل كامل' : 'Whole Class'}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isQuickMarkMenuOpen && (
              <div className="absolute left-0 sm:right-0 sm:left-auto mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'ar' ? 'خيارات التحضير السريع:' : 'Quick Mark Options:'}</span>
                  </span>
                  <button
                    onClick={() => onCloseQuickMarkMenu()}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    ✕
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onQuickMarkWholeClass}
                  className="w-full text-right px-2.5 py-2 hover:bg-emerald-50 rounded-lg text-slate-800 hover:text-emerald-950 transition-colors flex items-start gap-2.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-slate-900">
                      {lang === 'ar' ? 'تعيين كامل الفصل حاضر (افتراضياً)' : 'Mark Whole Class Present'}
                    </strong>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      {lang === 'ar'
                        ? 'تعيين جميع الطلاب كـ حاضر فوراً لضبط الغائبين فقط يدوياً'
                        : 'Default whole roster to Present and adjust absentees manually'}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={onQuickMarkSelectedGroup}
                  disabled={selectedStudentIdsForGroup.length === 0}
                  className="w-full text-right px-2.5 py-2 hover:bg-teal-50 rounded-lg text-slate-800 hover:text-teal-950 transition-colors flex items-start gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Users className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-slate-900">
                      {lang === 'ar'
                        ? `تعيين المجموعة المحددة حاضر (${selectedStudentIdsForGroup.length})`
                        : `Mark Selected Group Present (${selectedStudentIdsForGroup.length})`}
                    </strong>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                      {lang === 'ar'
                        ? 'تطبيق الحضور فقط على الطلاب المحددين في مربعات الاختيار'
                        : 'Apply presence only to checked students'}
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {session.status === 'draft' || session.status === 'reopened' ? (
            <button
              onClick={onSubmitSession}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'ar' ? 'تأكيد واعتماد الكشف نهائياً' : 'Submit & Confirm'}</span>
            </button>
          ) : (
            <>
              <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{lang === 'ar' ? 'كشف مقفل ومحمي من التعديل العشوائي' : 'Locked & Immutable'}</span>
              </div>

              {(currentUserRole === 'admin' || currentUserRole === 'registrar' || currentUserRole === 'super_admin') && (
                <button
                  onClick={() => onOpenReopen()}
                  className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>{lang === 'ar' ? 'إعادة فتح الكشف للتصحيح' : 'Reopen with Audit'}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
