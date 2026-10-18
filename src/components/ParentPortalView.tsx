import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  Bell,
  AlertTriangle,
  User,
  ShieldCheck,
  Sparkles,
  FileCheck2,
  Award,
} from 'lucide-react';
import { ParentRecordsTable } from './parent/ParentRecordsTable';

interface ParentPortalViewProps {
  onOpenExcuseForm?: (studentId: string, date: string) => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({ onOpenExcuseForm }) => {
  const {
    students,
    notifications,
    sessions,
    justifications,
    behaviourIncidents,
    currentUser,
    currentTenant,
    lang,
  } = useAttendance();

  // In parent mode, 'students' from context is ALREADY restricted strictly to this parent's own children
  const myChildren = students;

  const defaultChild = myChildren.length > 0 ? myChildren[0] : null;
  const [selectedStudentId, setSelectedStudentId] = useState<string>(defaultChild?.id || '');

  const activeStudent = myChildren.find((s) => s.id === selectedStudentId) || defaultChild;

  // Filter notifications belonging strictly to this child / guardian
  const childNotifications = useMemo(() => {
    return activeStudent
      ? notifications.filter(
          (n) => n.studentId === activeStudent.id || n.recipientPhone === activeStudent.guardianPhone
        )
      : [];
  }, [notifications, activeStudent]);

  // Infractions count for this active student
  const childInfractionsCount = useMemo(() => {
    return activeStudent
      ? behaviourIncidents.filter(
          (b) => b.studentId === activeStudent.id && b.type === 'infraction'
        ).length
      : 0;
  }, [behaviourIncidents, activeStudent]);

  // Academic year boundaries from settings
  const academicYearBounds = useMemo(() => {
    const terms = currentTenant.schoolProfile?.academicYear?.terms || [];
    if (terms.length === 0) return { start: '2026-09-01', end: '2027-06-24' };
    const starts = terms.map((t) => t.startDate).filter(Boolean).sort();
    const ends = terms.map((t) => t.endDate).filter(Boolean).sort();
    return {
      start: starts[0] || '2026-09-01',
      end: ends[ends.length - 1] || '2027-06-24',
    };
  }, [currentTenant.schoolProfile?.academicYear?.terms]);

  if (!activeStudent || myChildren.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto shadow-sm">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          {lang === 'ar' ? 'لم يتم العثور على أبناء مرتبطين بحسابكم' : 'No Linked Students Found'}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {lang === 'ar'
            ? `رقم الهاتف المسجل (${currentUser.phone}) غير مرتبط بأي طالب في قاعدة بيانات المدرسة. يرجى التواصل مع إدارة المدرسة لتحديث بيانات ولي الأمر.`
            : `Your registered phone (${currentUser.phone}) is not linked to any student profile. Please contact the school administration.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
              <span>{lang === 'ar' ? 'بوابة ولي الأمر' : 'Parent Portal'}</span>
            </h2>
          </div>

          {/* Child Switcher Dropdown (Strictly lists ONLY this parent's own children) */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl flex items-center gap-3">
            <User className="w-5 h-5 text-emerald-200 shrink-0" />
            <div>
              <span className="text-[11px] block text-emerald-200 font-medium">
                {lang === 'ar'
                  ? myChildren.length > 1
                    ? `اختيار الابن/الابنة للمتابعة (${myChildren.length} أبناء):`
                    : 'الابن المتابع:'
                  : myChildren.length > 1
                  ? `Select Child (${myChildren.length} children):`
                  : 'Active Child:'}
              </span>
              {myChildren.length > 1 ? (
                <select
                  value={activeStudent.id}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="bg-emerald-950/80 text-white font-semibold text-xs rounded-lg px-3 py-1.5 border border-emerald-500/50 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                >
                  {myChildren.map((std) => (
                    <option key={std.id} value={std.id} className="text-slate-900 bg-white">
                      {std.fullName} ({std.className})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-bold text-white bg-emerald-950/60 px-2.5 py-1 rounded-md inline-block">
                  {activeStudent.fullName} ({activeStudent.className})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Child Summary Stats Cards - 5 Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* Attendance Rate */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
            {activeStudent.attendanceRate}%
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">
              {lang === 'ar' ? 'نسبة الحضور الفصلي' : 'Attendance Rate'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {activeStudent.attendanceRate >= 90
                ? lang === 'ar'
                  ? 'ممتاز ومثالي'
                  : 'Excellent'
                : lang === 'ar'
                ? 'بحاجة لمتابعة'
                : 'Needs Attention'}
            </span>
          </div>
        </div>

        {/* Total Absences */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
            {activeStudent.totalAbsences}
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">
              {lang === 'ar' ? 'إجمالي أيام الغياب' : 'Total Absences'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {activeStudent.totalAbsences} {lang === 'ar' ? 'أيام مسجلة' : 'days'}
            </span>
          </div>
        </div>

        {/* Times Late */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
            {activeStudent.totalLates}
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">
              {lang === 'ar' ? 'مرات التأخر الصباحي' : 'Times Late'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {activeStudent.totalLates} {lang === 'ar' ? 'مرات' : 'times'}
            </span>
          </div>
        </div>

        {/* Conduct Infractions */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
            {childInfractionsCount}
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">
              {lang === 'ar' ? 'المخالفات السلوكية' : 'Infractions'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {childInfractionsCount}{' '}
              {lang === 'ar'
                ? childInfractionsCount === 1
                  ? 'مخالفة مرصودة'
                  : 'مخالفات'
                : 'infractions'}
            </span>
          </div>
        </div>

        {/* Messages & Notifications */}
        <div className="col-span-2 sm:col-span-1 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-base shrink-0">
            <Bell className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">
              {lang === 'ar' ? 'إشعارات ورسائل ولي الأمر' : 'Messages'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {childNotifications.length} {lang === 'ar' ? 'رسالة واردة' : 'messages'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Feature: Comprehensive Records & Detailed Table */}
      <ParentRecordsTable
        student={activeStudent}
        sessions={sessions}
        justifications={justifications}
        incidents={behaviourIncidents}
        notifications={notifications}
        onOpenExcuseForm={onOpenExcuseForm}
        academicYearBounds={academicYearBounds}
      />

      {/* AI Excuse Processing Feature Callout */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/80 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-sm text-emerald-950">
              {lang === 'ar'
                ? 'خدمة الفحص والاعتماد الذكي للأعذار الطبية (Gemini AI Audit)'
                : 'Intelligent AI Excuse Processing'}
            </h4>
            <p className="text-xs text-emerald-900/85 leading-relaxed max-w-2xl">
              {lang === 'ar'
                ? 'يمكنكم تصوير التقرير الطبي أو إجازة منصة صحتي ورفعها فوراً لأي يوم غياب. يقوم نموذج الذكاء الاصطناعي بفحص الأختام وتطابق التواريخ وتسهيل الاعتماد الفوري من إدارة المدرسة.'
                : 'Upload medical report photos for automated Gemini AI verification of stamps, dates, and instant approval recommendations.'}
            </p>
          </div>
        </div>

        {onOpenExcuseForm && (
          <button
            onClick={() => onOpenExcuseForm(activeStudent.id, '')}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>{lang === 'ar' ? 'رفع عذر طبي الآن' : 'Submit Excuse Now'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
