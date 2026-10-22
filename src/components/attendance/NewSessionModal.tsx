import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SchoolClassSummary, TenantSchoolProfile } from '../../types/attendance';
import type { OffDayCheckResult } from '../../utils/holidayUtils';

interface NewSessionModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  schoolProfile: TenantSchoolProfile;
  classesStats: SchoolClassSummary[];
  isOffDay: (dateStr: string) => OffDayCheckResult;
  createNewSession: (
    sessionType: 'daily' | 'period',
    periodNumber: number,
    subject: string,
    className: string,
    classId: string,
    grade: string
  ) => { id: string };
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  lang,
  schoolProfile,
  classesStats,
  isOffDay,
  createNewSession,
  onClose,
  onCreated,
}) => {
  // Configured timetable periods & subjects from Settings
  const configuredLessonPeriods = (schoolProfile?.timetablePeriods || []).filter(
    (p) => p.type === 'lesson'
  );
  const configuredSubjects = (schoolProfile?.subjects || []).map((s) => s.name);

  // New session form state bound to Settings defaults
  const [newSessionType, setNewSessionType] = useState<'daily' | 'period'>('period');
  const [newPeriodNum, setNewPeriodNum] = useState<number>(
    configuredLessonPeriods[0]?.periodNumber || 1
  );
  const [newSubject, setNewSubject] = useState<string>(
    configuredSubjects[0] || 'اللغة العربية'
  );
  const [newClass, setNewClass] = useState<string>(classesStats[0]?.className || '');

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const offCheck = isOffDay(today);
    if (offCheck.isOff) {
      const proceed = confirm(
        lang === 'ar'
          ? `تنبيه: اليوم يوافق ${offCheck.reason || 'إجازة رسمية'} المعتمد في صفحة الإعدادات. هل أنت متأكد من إنشاء كشف حضور في يوم إجازة رسمية؟`
          : `Today is an official off-day (${offCheck.reason || 'official off-day'}). Are you sure you want to create a session?`
      );
      if (!proceed) return;
    }

    const matchedClass = classesStats.find((c) => c.className === newClass);
    const targetClassId = matchedClass?.classId || `class-${newClass.replace(/[^a-zA-Z0-9]/g, '')}`;
    const targetGrade = matchedClass?.grade || 'المرحلة الدراسية';

    const created = createNewSession(
      newSessionType,
      newPeriodNum,
      newSubject,
      newClass,
      targetClassId,
      targetGrade
    );
    onClose();
    onCreated(created.id);
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base">
            {lang === 'ar' ? 'إنشاء كشف حصة جديد' : 'New Attendance Session'}
          </h3>
          <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateSession} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {lang === 'ar' ? 'نوع الكشف:' : 'Session Type:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewSessionType('period')}
                className={`py-2 px-3 rounded-lg border text-center font-medium cursor-pointer ${
                  newSessionType === 'period'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {lang === 'ar' ? 'كشف حصة دراسية' : 'Period Session'}
              </button>
              <button
                type="button"
                onClick={() => setNewSessionType('daily')}
                className={`py-2 px-3 rounded-lg border text-center font-medium cursor-pointer ${
                  newSessionType === 'daily'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {lang === 'ar' ? 'كشف الحضور الصباحي اليومي' : 'Daily Roll-Call'}
              </button>
            </div>
          </div>

          {newSessionType === 'period' && (
            <>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {lang === 'ar' ? 'الحصة الدراسية (وفق الجدول المعتمد بالإعدادات):' : 'Period:'}
                </label>
                <select
                  value={newPeriodNum}
                  onChange={(e) => setNewPeriodNum(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                >
                  {configuredLessonPeriods.length > 0 ? (
                    configuredLessonPeriods.map((p) => (
                      <option key={p.id} value={p.periodNumber}>
                        {p.nameAr || `الحصة ${p.periodNumber}`} ({p.startTime} - {p.endTime})
                      </option>
                    ))
                  ) : (
                    [1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <option key={num} value={num}>
                        {lang === 'ar' ? `الحصة رقم (${num})` : `Period ${num}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {lang === 'ar' ? 'المادة الدراسية (المعتمدة بالإعدادات):' : 'Subject:'}
                </label>
                {configuredSubjects.length > 0 ? (
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                  >
                    {configuredSubjects.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="مثال: الرياضيات، الأحياء، اللغة الإنجليزية..."
                  />
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {lang === 'ar' ? 'الفصل الدراسي:' : 'Class:'}
            </label>
            <select
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
            >
              {classesStats.map((c) => (
                <option key={c.className} value={c.className}>
                  {c.className} ({c.grade}) - {c.activeStudents} {lang === 'ar' ? 'طالب' : 'students'}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
            >
              {lang === 'ar' ? 'إنشاء الكشف' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
