import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  Bell,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  FileCheck2,
  User,
  ShieldCheck,
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
} from 'lucide-react';

interface ParentPortalViewProps {
  onOpenExcuseForm?: (studentId: string, date: string) => void;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({ onOpenExcuseForm }) => {
  const {
    students,
    notifications,
    sessions,
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
  const childNotifications = activeStudent
    ? notifications.filter(
        (n) => n.studentId === activeStudent.id || n.recipientPhone === activeStudent.guardianPhone
      )
    : [];

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'absence' | 'late' | 'warning' | 'broadcast'>('all');

  const filteredNotifs = childNotifications.filter((n) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'absence') return n.statusType === 'absent' || n.category === 'absence';
    if (categoryFilter === 'late') return n.statusType === 'late' || n.category === 'late';
    if (categoryFilter === 'warning') return n.category === 'warning';
    if (categoryFilter === 'broadcast') return n.category === 'broadcast';
    return true;
  });

  // Collect attendance history strictly for this student across all sessions
  const studentSessionHistory: {
    sessionId: string;
    date: string;
    subject?: string;
    sessionType: 'daily' | 'period';
    periodNumber?: number;
    className: string;
    status: string;
    minutesLate?: number;
    note?: string;
  }[] = [];

  if (activeStudent) {
    sessions.forEach((sess) => {
      const rec = sess.records.find((r) => r.studentId === activeStudent.id);
      if (rec) {
        studentSessionHistory.push({
          sessionId: sess.id,
          date: sess.date,
          subject: sess.subject,
          sessionType: sess.sessionType,
          periodNumber: sess.periodNumber,
          className: sess.className,
          status: rec.status,
          minutesLate: rec.minutesLate,
          note: rec.note,
        });
      }
    });
  }

  // Sort by date descending
  studentSessionHistory.sort((a, b) => b.date.localeCompare(a.date));

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
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'ar' ? 'بوابة ولي الأمر الذكية · خصوصية تامة للأبناء' : 'Smart Parent Portal · Strict Child Privacy'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {lang === 'ar' ? `مرحباً، ${currentUser.name}` : `Welcome, ${currentUser.name}`}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90">
              {lang === 'ar'
                ? `متابعة حية وفورية لحضور وغياب أبنائك حصراً دون أي اطلاع على بيانات الطلاب الآخرين`
                : `Real-time attendance tracking strictly for your child, isolated from all other student data.`}
            </p>
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

      {/* Child Summary Stats Cards */}
      {activeStudent && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
              {activeStudent.attendanceRate}%
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">
                {lang === 'ar' ? 'نسبة الحضور الفصلي' : 'Attendance Rate'}
              </span>
              <span className="text-sm font-bold text-slate-900">
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

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-lg shrink-0">
              {activeStudent.totalAbsences}
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">
                {lang === 'ar' ? 'إجمالي أيام الغياب' : 'Total Absences'}
              </span>
              <span className="text-sm font-bold text-slate-900">
                {activeStudent.totalAbsences} {lang === 'ar' ? 'أيام مسجلة' : 'days recorded'}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-lg shrink-0">
              {activeStudent.totalLates}
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">
                {lang === 'ar' ? 'مرات التأخر الصباحي' : 'Times Late'}
              </span>
              <span className="text-sm font-bold text-slate-900">
                {activeStudent.totalLates} {lang === 'ar' ? 'مرات' : 'times'}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-lg shrink-0">
              <Bell className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">
                {lang === 'ar' ? 'إشعارات ولي الأمر' : 'Messages Received'}
              </span>
              <span className="text-sm font-bold text-slate-900">
                {childNotifications.length} {lang === 'ar' ? 'رسالة واردة' : 'messages'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Messages Inbox & Recent Attendance Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Official Notifications & SMS Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Header & Category Filters */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {lang === 'ar' ? 'صندوق رسائل وإشعارات ولي الأمر' : 'Parent Notification Inbox'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ar'
                      ? 'الرسائل النصية وتنبيهات WhatsApp الموجهة لهاتفكم المسجل'
                      : 'SMS & WhatsApp messages sent to your registered phone'}
                  </p>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-lg text-xs">
                {(
                  [
                    { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                    { id: 'absence', labelAr: 'غياب', labelEn: 'Absence' },
                    { id: 'late', labelAr: 'تأخر', labelEn: 'Late' },
                    { id: 'warning', labelAr: 'إنذارات', labelEn: 'Warnings' },
                    { id: 'broadcast', labelAr: 'تعاميم', labelEn: 'Announcements' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      categoryFilter === cat.id
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lang === 'ar' ? cat.labelAr : cat.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Messages List */}
            <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-3">
              {filteredNotifs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Bell className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="text-sm font-medium">
                    {lang === 'ar' ? 'لا توجد إشعارات حالية ضمن هذا التصنيف' : 'No messages found in this category'}
                  </p>
                </div>
              ) : (
                filteredNotifs.map((notif) => {
                  const isAbsence = notif.statusType === 'absent' || notif.category === 'absence';
                  const isWarning = notif.category === 'warning';
                  const isLate = notif.statusType === 'late' || notif.category === 'late';

                  return (
                    <div
                      key={notif.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all space-y-3"
                    >
                      {/* Top Meta info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isWarning
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : isAbsence
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : isLate
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {isWarning
                              ? lang === 'ar'
                                ? 'إنذار أكاديمي'
                                : 'Warning'
                              : isAbsence
                              ? lang === 'ar'
                                ? 'تسجيل غياب'
                                : 'Absence Alert'
                              : isLate
                              ? lang === 'ar'
                                ? 'تسجيل تأخر'
                                : 'Tardiness'
                              : lang === 'ar'
                              ? 'إشعار مدرسي'
                              : 'Notification'}
                          </span>

                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                            {notif.channel === 'WhatsApp' ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                                <MessageSquare className="w-3 h-3 text-emerald-600" /> WhatsApp
                              </span>
                            ) : (
                              <span className="text-sky-700 font-semibold flex items-center gap-0.5">
                                <Smartphone className="w-3 h-3 text-sky-600" /> SMS
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(notif.createdAt).toLocaleTimeString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            {lang === 'ar' ? 'تم الاستلام' : 'Delivered'}
                          </span>
                        </div>
                      </div>

                      {/* Message Bubble */}
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-slate-800 text-sm leading-relaxed shadow-xs font-sans">
                        {notif.messageText}
                      </div>

                      {/* Quick Actions Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                        <span className="text-slate-500 text-[11px]">
                          {lang === 'ar' ? 'المستلم:' : 'Recipient:'}{' '}
                          <span className="font-semibold text-slate-700">{notif.recipientName}</span> (
                          {notif.recipientPhone})
                        </span>

                        {(isAbsence || isWarning) && (
                          <button
                            onClick={() => {
                              if (onOpenExcuseForm) {
                                onOpenExcuseForm(notif.studentId, notif.absenceDate);
                              }
                            }}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer text-xs"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'ar'
                                ? 'تقديم عذر طبي / تبرير لهذا الغياب'
                                : 'Submit Medical Excuse for this Date'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Records Timeline */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {lang === 'ar' ? 'سجل حضور وغياب الطالب' : 'Attendance History'}
              </h3>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {studentSessionHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {lang === 'ar' ? 'لا توجد جلسات مسجلة حتى الآن' : 'No attendance sessions recorded yet'}
                </div>
              ) : (
                studentSessionHistory.map((item, idx) => {
                  const isPresent = item.status === 'present';
                  const isAbsent = item.status === 'absent';
                  const isLate = item.status === 'late';
                  const isExcused = item.status === 'excused_absence';

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900">
                          {item.subject || (item.sessionType === 'daily' ? 'حضور يومي شامل' : 'حصة دراسية')}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{item.date}</span>
                          <span>·</span>
                          <span>{item.className}</span>
                        </div>
                        {item.note && (
                          <p className="text-[10px] text-slate-600 bg-white p-1 rounded border border-slate-200 mt-1">
                            {item.note}
                          </p>
                        )}
                      </div>

                      <div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800'
                              : isAbsent
                              ? 'bg-rose-100 text-rose-800'
                              : isLate
                              ? 'bg-amber-100 text-amber-800'
                              : isExcused
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {isPresent
                            ? lang === 'ar'
                              ? 'حاضر'
                              : 'Present'
                            : isAbsent
                            ? lang === 'ar'
                              ? 'غائب'
                              : 'Absent'
                            : isLate
                            ? lang === 'ar'
                              ? `تأخر ${item.minutesLate || 10} د`
                              : 'Late'
                            : isExcused
                            ? lang === 'ar'
                              ? 'عذر معتمد'
                              : 'Excused'
                            : item.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Info Box for Parents */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              {lang === 'ar' ? 'خدمة الذكاء الاصطناعي لفحص الأعذار' : 'AI Excuse Processing'}
            </h4>
            <p className="text-emerald-800/90 leading-relaxed">
              {lang === 'ar'
                ? 'يمكنكم تصوير التقرير الطبي أو الإشعار وإرفاقه فوراً، حيث يقوم نموذج Gemini الذكي بالتحقق من صحة الأختام والتواريخ وإصدار الاعتماد التلقائي.'
                : 'Upload medical report photos for instant Gemini AI verification of stamps, dates, and recommendations.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
