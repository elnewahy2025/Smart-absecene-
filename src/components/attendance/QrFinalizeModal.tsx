import React from 'react';
import { Check, CheckCircle2, Clock, UserCheck, X } from 'lucide-react';
import { AttendanceSession, Student } from '../../types/attendance';

interface QrFinalizeModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  activeSession?: AttendanceSession;
  currentClassStudents: Student[];
  unscannedStudents: Student[];
  unscannedSettings: Record<string, { status: 'absent' | 'late'; minutesLate: number }>;
  onToggleUnscannedStatus: (studentId: string, status: 'absent' | 'late') => void;
  onChangeUnscannedMinutes: (studentId: string, minutesLate: number) => void;
  onFinalize: () => void;
  onClose: () => void;
}

export const QrFinalizeModal: React.FC<QrFinalizeModalProps> = ({
  isOpen,
  lang,
  activeSession,
  currentClassStudents,
  unscannedStudents,
  unscannedSettings,
  onToggleUnscannedStatus,
  onChangeUnscannedMinutes,
  onFinalize,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-5 space-y-4 my-auto max-h-[92dvh] overflow-y-auto animate-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                {lang === 'ar' ? 'إنهاء جلسة المسح واعتماد الغياب النهائي' : 'Finalize Session & Commit Absences'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ar' ? `فصل: ${activeSession?.className} · مراجعة الطلاب غير الممسوحين` : `Class: ${activeSession?.className}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats summary cards */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 dark:text-slate-400">{lang === 'ar' ? 'إجمالي الفصل' : 'Total'}</div>
            <div className="text-base font-bold text-slate-900 dark:text-white font-mono">{currentClassStudents.length}</div>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="text-[10px] text-emerald-700 dark:text-emerald-300">{lang === 'ar' ? 'حاضرون بالمسح' : 'Scanned'}</div>
            <div className="text-base font-bold text-emerald-800 dark:text-emerald-200 font-mono">
              {currentClassStudents.length - unscannedStudents.length}
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
            <div className="text-[10px] text-amber-700 dark:text-amber-300">{lang === 'ar' ? 'لم يمسحوا (متبقين)' : 'Unscanned'}</div>
            <div className="text-base font-bold text-amber-800 dark:text-amber-200 font-mono">
              {unscannedStudents.length}
            </div>
          </div>
        </div>

        {/* Unscanned Students Review List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {lang === 'ar' ? 'الطلاب غير الممسوحين (تحديد المتأخرين قبل الاعتماد):' : 'Unscanned Students (Flag late arrivals):'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {unscannedStudents.length} {lang === 'ar' ? 'طالب' : 'students'}
            </span>
          </div>

          {unscannedStudents.length === 0 ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="font-bold">{lang === 'ar' ? 'مكتمل بنسبة 100%!' : '100% Complete!'}</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                {lang === 'ar' ? 'جميع طلاب الفصل حاضرون وتم مسح بطاقاتهم بالكامل.' : 'All students checked in successfully.'}
              </p>
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/50">
              {unscannedStudents.map((std) => {
                const currentSetting = unscannedSettings[std.id] || { status: 'absent', minutesLate: 15 };
                const isLate = currentSetting.status === 'late';
                return (
                  <div
                    key={std.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="truncate">
                      <span className="font-bold text-slate-900 dark:text-white block sm:inline">{std.fullName}</span>
                      <span className="text-[10px] text-slate-400 sm:mr-1.5 font-mono">({std.studentNumber})</span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* Status Toggle Buttons */}
                      <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => onToggleUnscannedStatus(std.id, 'absent')}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                            !isLate
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          {lang === 'ar' ? 'غائب' : 'Absent'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleUnscannedStatus(std.id, 'late')}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                            isLate
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{lang === 'ar' ? 'متأخر' : 'Late'}</span>
                        </button>
                      </div>

                      {/* Minutes selector if late */}
                      {isLate && (
                        <select
                          value={currentSetting.minutesLate}
                          onChange={(e) => onChangeUnscannedMinutes(std.id, Number(e.target.value))}
                          className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-md px-1.5 py-1 text-[10px] font-bold text-amber-900 dark:text-amber-200 cursor-pointer"
                          title={lang === 'ar' ? 'دقائق التأخير' : 'Minutes Late'}
                        >
                          <option value={5}>5 د</option>
                          <option value={10}>10 د</option>
                          <option value={15}>15 د</option>
                          <option value={20}>20 د</option>
                          <option value={30}>30 د</option>
                          <option value={45}>45 د</option>
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onClose()}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer text-center"
          >
            {lang === 'ar' ? 'العودة للمسح (متابعة استقبال الطلاب)' : 'Return to Scanning'}
          </button>

          <button
            type="button"
            onClick={onFinalize}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{lang === 'ar' ? 'اعتماد الغياب النهائي وإنهاء الجلسة' : 'Commit & Finalize Attendance'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
