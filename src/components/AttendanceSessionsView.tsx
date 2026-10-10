import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceSession, AttendanceStatus } from '../types/attendance';
import {
  Calendar,
  Clock,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  ChevronRight,
  Info,
  Scan,
  Zap,
  UserCheck,
  Users,
  CheckSquare,
  Square,
} from 'lucide-react';
import { QRScannerModal } from './QRScannerModal';
import { WeeklyAttendanceTrendCard } from './WeeklyAttendanceTrendCard';

export const AttendanceSessionsView: React.FC = () => {
  const {
    sessions,
    students,
    currentUser,
    lang,
    updateRecord,
    setAllPresentInDraft,
    quickMarkGroupAsPresent,
    submitSession,
    reopenSession,
    createNewSession,
  } = useAttendance();

  // State
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    sessions[0]?.id || ''
  );
  const [filterDate, setFilterDate] = useState<string>(
    sessions[0]?.date || new Date().toISOString().split('T')[0]
  );
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Quick Mark & Group Selection state
  const [selectedStudentIdsForGroup, setSelectedStudentIdsForGroup] = useState<string[]>([]);
  const [isQuickMarkActive, setIsQuickMarkActive] = useState<boolean>(false);
  const [isQuickMarkMenuOpen, setIsQuickMarkMenuOpen] = useState<boolean>(false);

  // Modals
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // New session form state
  const [newSessionType, setNewSessionType] = useState<'daily' | 'period'>('period');
  const [newPeriodNum, setNewPeriodNum] = useState<number>(3);
  const [newSubject, setNewSubject] = useState<string>('اللغة العربية');
  const [newClass, setNewClass] = useState<string>('10 / أ');

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Filtered session records
  const sessionStudents = selectedSession?.records.map((rec) => {
    const student = students.find((s) => s.id === rec.studentId);
    return {
      record: rec,
      student: student || {
        id: rec.studentId,
        tenantId: selectedSession.tenantId,
        studentNumber: '---',
        nationalId: '---',
        fullName: 'طالب غير محدد',
        grade: selectedSession.grade,
        className: selectedSession.className,
        classId: selectedSession.classId,
        guardianName: 'غير معروف',
        guardianPhone: '---',
        guardianRelationship: 'الأب',
        attendanceRate: 90,
        totalAbsences: 0,
        totalLates: 0,
      },
    };
  }).filter((item) => {
    const matchesSearch =
      item.student.fullName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      item.student.nationalId.includes(searchStudent) ||
      item.student.studentNumber.includes(searchStudent);

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return item.record.status === statusFilter;
  }) || [];

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (selectedSession?.status === 'submitted' && currentUser.role !== 'admin') {
      alert(
        lang === 'ar'
          ? 'الكشف معتمد رسمياً ومقفل. يلزم إعادة فتح الكشف بواسطة الإدارة أولاً لتعديل السجلات.'
          : 'Session is locked and submitted. Admin must reopen the session before edits can be made.'
      );
      return;
    }
    updateRecord(selectedSession.id, studentId, status);
  };

  const handleMinutesLateChange = (studentId: string, minutes: number) => {
    updateRecord(selectedSession.id, studentId, 'late', minutes);
  };

  // Quick Mark: Mark Whole Class as Present by Default
  const handleQuickMarkWholeClass = () => {
    if (!selectedSession) return;
    if (selectedSession.status === 'submitted') {
      if (currentUser.role === 'admin' || currentUser.role === 'registrar') {
        const proceed = confirm(
          lang === 'ar'
            ? 'الكشف معتمد حالياً. يلزم إعادة فتح الكشف أولاً لاستخدام التحضير السريع. هل تريد فتح نافذة إعادة الفتح؟'
            : 'Session is submitted. Reopen session first?'
        );
        if (proceed) setIsReopenModalOpen(true);
      } else {
        alert(
          lang === 'ar'
            ? 'الكشف معتمد رسمياً ومقفل. يلزم إعادة فتح الكشف بواسطة الإدارة أولاً.'
            : 'Session is locked. Admin must reopen first.'
        );
      }
      return;
    }

    const res = quickMarkGroupAsPresent(selectedSession.id);
    setIsQuickMarkActive(true);
    setIsQuickMarkMenuOpen(false);
    setSelectedStudentIdsForGroup([]);
    setNotificationBanner(
      lang === 'ar'
        ? `⚡ تم تفعيل التحضير السريع: تم تعيين جميع طلاب الفصل (${res.updatedCount} طالب) كـ 'حاضر' افتراضياً بنجاح! يمكنك الآن تعديل الغائبين فقط أدناه.`
        : `⚡ Quick Mark applied: All ${res.updatedCount} students marked Present! You can now adjust absentees below.`
    );
  };

  // Quick Mark: Mark Selected Group of Students as Present
  const handleQuickMarkSelectedGroup = () => {
    if (!selectedSession || selectedStudentIdsForGroup.length === 0) return;
    if (selectedSession.status === 'submitted' && currentUser.role !== 'admin') {
      alert(
        lang === 'ar'
          ? 'الكشف معتمد رسمياً ومقفل. يلزم إعادة فتح الكشف أولاً.'
          : 'Session is locked. Reopen before editing.'
      );
      return;
    }

    const count = selectedStudentIdsForGroup.length;
    const res = quickMarkGroupAsPresent(selectedSession.id, selectedStudentIdsForGroup);
    setIsQuickMarkActive(true);
    setIsQuickMarkMenuOpen(false);
    setSelectedStudentIdsForGroup([]);
    setNotificationBanner(
      lang === 'ar'
        ? `⚡ تم تطبيق التحضير السريع على المجموعة المحددة (${count} طالب) كـ 'حاضر'.`
        : `⚡ Quick Mark applied to ${count} students as Present.`
    );
  };

  // Bulk Mark Selected Students as Absent
  const handleGroupMarkAsAbsent = () => {
    if (!selectedSession || selectedStudentIdsForGroup.length === 0) return;
    const count = selectedStudentIdsForGroup.length;
    selectedStudentIdsForGroup.forEach((id) => {
      updateRecord(selectedSession.id, id, 'absent');
    });
    setSelectedStudentIdsForGroup([]);
    setNotificationBanner(
      lang === 'ar'
        ? `تم تعيين ${count} طالب كـ 'غائب'.`
        : `Marked ${count} students as Absent.`
    );
  };

  // Toggle selection for all currently visible students
  const handleToggleSelectAll = () => {
    if (sessionStudents.length === 0) return;
    const allIds = sessionStudents.map((s) => s.record.studentId);
    const allSelected = allIds.every((id) => selectedStudentIdsForGroup.includes(id));
    if (allSelected) {
      setSelectedStudentIdsForGroup([]);
    } else {
      setSelectedStudentIdsForGroup(allIds);
    }
  };

  const handleSubmitSession = () => {
    if (!selectedSession) return;
    const res = submitSession(selectedSession.id);
    if (res.success) {
      setNotificationBanner(res.message);
      setTimeout(() => setNotificationBanner(null), 6000);
    } else {
      alert(res.message);
    }
  };

  const handleConfirmReopen = () => {
    if (!selectedSession) return;
    const res = reopenSession(selectedSession.id, reopenReason);
    if (res.success) {
      setIsReopenModalOpen(false);
      setReopenReason('');
      setNotificationBanner(res.message);
      setTimeout(() => setNotificationBanner(null), 6000);
    } else {
      alert(res.message);
    }
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const created = createNewSession(
      newSessionType,
      newPeriodNum,
      newSubject,
      newClass,
      newClass === '10 / أ' ? 'class-1a' : 'class-1b',
      'الصف العاشر'
    );
    setIsNewSessionModalOpen(false);
    setSelectedSessionId(created.id);
  };

  // Status badges config
  const statusLabels: Record<AttendanceStatus, { ar: string; en: string; bg: string; text: string }> = {
    present: { ar: 'حاضر', en: 'Present', bg: 'bg-emerald-50 border-emerald-300 text-emerald-800', text: 'text-emerald-700' },
    absent: { ar: 'غائب', en: 'Absent', bg: 'bg-rose-50 border-rose-300 text-rose-800', text: 'text-rose-700' },
    late: { ar: 'متأخر', en: 'Late', bg: 'bg-amber-50 border-amber-300 text-amber-800', text: 'text-amber-700' },
    excused_leave: { ar: 'مستأذن', en: 'Leave', bg: 'bg-sky-50 border-sky-300 text-sky-800', text: 'text-sky-700' },
    excused_absence: { ar: 'غياب بعذر', en: 'Excused', bg: 'bg-indigo-50 border-indigo-300 text-indigo-800', text: 'text-indigo-700' },
    under_review: { ar: 'عذر قيد المراجعة', en: 'Under Review', bg: 'bg-violet-50 border-violet-300 text-violet-800', text: 'text-violet-700' },
    rejected_excuse: { ar: 'مرفوض العذر', en: 'Rejected', bg: 'bg-stone-100 border-stone-300 text-stone-800', text: 'text-stone-700' },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if any */}
      {notificationBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notificationBanner}</span>
          </div>
          <button onClick={() => setNotificationBanner(null)} className="text-emerald-700 hover:text-emerald-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Weekly Daily Attendance Percentage Trends Visualization (Recharts) */}
      <WeeklyAttendanceTrendCard />

      {/* Control Strip: Session Picker & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Filter by date & quick session selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-4 h-4 text-slate-500" />
              <label htmlFor="filter-date-input" className="text-slate-600 font-medium">
                {lang === 'ar' ? 'التاريخ:' : 'Date:'}
              </label>
              <input
                id="filter-date-input"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="session-select" className="text-xs text-slate-600 font-medium">
                {lang === 'ar' ? 'الكشف المختار:' : 'Session:'}
              </label>
              <select
                id="session-select"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.className} - {s.subject || 'حضور يومي'} ({s.sessionType === 'period' ? `الحصة ${s.periodNumber}` : 'يومي'}) - [{s.status === 'submitted' ? 'معتمد' : s.status === 'draft' ? 'مسودة' : 'معاد فتحه'}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: New Session button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewSessionModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إنشاء كشف حصة جديد' : 'New Session'}</span>
            </button>
          </div>
        </div>
      </div>

      {selectedSession && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Session Overview Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/70">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedSession.subject || 'كشف الحضور الصباحي'}
                  </h2>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      selectedSession.status === 'submitted'
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : selectedSession.status === 'draft'
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-sky-100 border-sky-300 text-sky-800'
                    }`}
                  >
                    {selectedSession.status === 'submitted'
                      ? lang === 'ar' ? 'معتمد ومرسل رسميًا' : 'Submitted'
                      : selectedSession.status === 'draft'
                      ? lang === 'ar' ? 'مسودة قيد الإدخال' : 'Draft'
                      : lang === 'ar' ? 'مُعاد فتحه للتصحيح' : 'Reopened'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                  <span>
                    <strong className="text-slate-700">{lang === 'ar' ? 'الفصل:' : 'Class:'}</strong> {selectedSession.className} ({selectedSession.grade})
                  </span>
                  <span>·</span>
                  <span>
                    <strong className="text-slate-700">{lang === 'ar' ? 'المعلم:' : 'Teacher:'}</strong> {selectedSession.teacherName}
                  </span>
                  <span>·</span>
                  <span>
                    <strong className="text-slate-700">{lang === 'ar' ? 'التاريخ:' : 'Date:'}</strong> {selectedSession.date}
                  </span>
                  {selectedSession.submittedAt && (
                    <>
                      <span>·</span>
                      <span>
                        <strong className="text-slate-700">{lang === 'ar' ? 'اعتُمد في:' : 'Submitted at:'}</strong>{' '}
                        {new Date(selectedSession.submittedAt).toLocaleTimeString('ar-SA')}
                      </span>
                    </>
                  )}
                  {selectedSession.reopenedReason && (
                    <div className="w-full mt-1 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded text-[11px]">
                      <strong>{lang === 'ar' ? 'سبب إعادة الفتح الموثق:' : 'Reopened Reason:'}</strong> {selectedSession.reopenedReason} (بواسطة: {selectedSession.reopenedBy})
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
                  title="مسح بطاقات الطلاب بالكاميرا لتسجيل الحضور بدون لمس"
                >
                  <Scan className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'ar' ? 'قارئ QR بدون لمس' : 'Scan QR'}</span>
                </button>

                {/* Primary Quick Mark Feature Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsQuickMarkMenuOpen(!isQuickMarkMenuOpen)}
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
                          onClick={() => setIsQuickMarkMenuOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          ✕
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleQuickMarkWholeClass}
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
                        onClick={handleQuickMarkSelectedGroup}
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

                {selectedSession.status === 'draft' || selectedSession.status === 'reopened' ? (
                  <button
                    onClick={handleSubmitSession}
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

                    {(currentUser.role === 'admin' || currentUser.role === 'registrar') && (
                      <button
                        onClick={() => setIsReopenModalOpen(true)}
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

            {/* Quick KPI stats for this session */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-200">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">{lang === 'ar' ? 'إجمالي المقيدين' : 'Total'}</span>
                <span className="text-lg font-bold text-slate-900">{selectedSession.totalStudents}</span>
              </div>
              <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200">
                <span className="text-[11px] text-emerald-700 block">{lang === 'ar' ? 'حاضرون' : 'Present'}</span>
                <span className="text-lg font-bold text-emerald-800">{selectedSession.presentCount}</span>
              </div>
              <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-200">
                <span className="text-[11px] text-rose-700 block">{lang === 'ar' ? 'غائبون' : 'Absent'}</span>
                <span className="text-lg font-bold text-rose-800">{selectedSession.absentCount}</span>
              </div>
              <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                <span className="text-[11px] text-amber-700 block">{lang === 'ar' ? 'متأخرون' : 'Late'}</span>
                <span className="text-lg font-bold text-amber-800">{selectedSession.lateCount}</span>
              </div>
              <div className="bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-200 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-indigo-700 block">{lang === 'ar' ? 'أعذار ومستأذن' : 'Excused'}</span>
                <span className="text-lg font-bold text-indigo-800">{selectedSession.excusedCount}</span>
              </div>
            </div>

            {/* Quick Mark Active Workflow Banner & Absentee Live Adjuster */}
            {isQuickMarkActive && (
              <div className="mt-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-4 rounded-xl shadow-xs border border-emerald-500/30 space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-emerald-200">
                          {lang === 'ar' ? 'التحضير السريع مفعل: تم تعيين طلاب الفصل حاضرين افتراضياً' : 'Quick Mark Active: All Defaulted to Present'}
                        </h4>
                        <span className="bg-emerald-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {lang === 'ar' ? 'خطوة 1 مكتملة ✓' : 'Step 1 Complete ✓'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                        {lang === 'ar'
                          ? 'الخطوة 2: قم بالنقر المباشر على زر "غائب" أو "متأخر" للطلاب غير الحاضرين فقط في الجدول أدناه لحفظ 80% من وقت الرصد للجلسات الكبيرة.'
                          : 'Step 2: Click "Absent" or "Late" only for students who are not in class to save 80% of session roll-call time.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStatusFilter(statusFilter === 'absent' ? 'all' : 'absent')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                        statusFilter === 'absent'
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                      }`}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>
                        {statusFilter === 'absent'
                          ? (lang === 'ar' ? 'عرض كامل الفصل' : 'Show Full Class')
                          : (lang === 'ar' ? `حصر وتدقيق الغائبين (${selectedSession.absentCount})` : `Inspect Absentees (${selectedSession.absentCount})`)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsQuickMarkActive(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                      title={lang === 'ar' ? 'إغلاق شريط الإرشاد' : 'Close banner'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Live Absentee Adjustment Strip */}
                {selectedSession.absentCount > 0 && (
                  <div className="pt-2 border-t border-emerald-800/60 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-emerald-300 font-bold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                      <span>{lang === 'ar' ? 'الطلاب المعدّلون كـ غائبين حالياً:' : 'Current Absentees:'}</span>
                    </span>
                    {selectedSession.records
                      .filter((r) => r.status === 'absent' || r.status === 'rejected_excuse')
                      .map((r) => {
                        const st = students.find((s) => s.id === r.studentId);
                        return (
                          <span
                            key={r.studentId}
                            className="bg-rose-950/70 border border-rose-500/50 text-rose-200 px-2.5 py-0.5 rounded-md text-[11px] inline-flex items-center gap-1.5"
                          >
                            <span>{st?.fullName || 'طالب'}</span>
                            <button
                              type="button"
                              onClick={() => updateRecord(selectedSession.id, r.studentId, 'present')}
                              className="text-rose-400 hover:text-white cursor-pointer font-bold"
                              title={lang === 'ar' ? 'إعادة إلى حاضر' : 'Restore to Present'}
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث باسم الطالب أو السجل...' : 'Search student...'}
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Filter by status */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'تصفية:' : 'Filter:'}
              </span>
              {[
                { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
                { id: 'present', label: lang === 'ar' ? 'حاضر' : 'Present' },
                { id: 'absent', label: lang === 'ar' ? 'غائب' : 'Absent' },
                { id: 'late', label: lang === 'ar' ? 'متأخر' : 'Late' },
                { id: 'excused_absence', label: lang === 'ar' ? 'بعذر' : 'Excused' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                    statusFilter === f.id
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Students Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="تحديد الكل"
                      checked={
                        sessionStudents.length > 0 &&
                        sessionStudents.every((s) => selectedStudentIdsForGroup.includes(s.record.studentId))
                      }
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title={lang === 'ar' ? 'تحديد الكل للتحضير السريع كـ مجموعة' : 'Select all for group action'}
                    />
                  </th>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'اسم الطالب / الرقم المدرسي' : 'Student'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'السجل المدني' : 'ID'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'حالة الحضور في هذه الحصة' : 'Status Toggle'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'التأخر / ملاحظة المعلم' : 'Notes / Delay'}</th>
                  <th className="py-3 px-4">{lang === 'ar' ? 'سجل المواظبة' : 'Total Absences'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessionStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      {lang === 'ar' ? 'لا يوجد طلاب مطابقين للبحث' : 'No students found'}
                    </td>
                  </tr>
                ) : (
                  sessionStudents.map(({ record, student }, index) => {
                    const isSessionSubmitted = selectedSession.status === 'submitted';
                    const canEdit = !isSessionSubmitted || currentUser.role === 'admin';
                    const isSelected = selectedStudentIdsForGroup.includes(record.studentId);

                    return (
                      <tr
                        key={record.studentId}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            aria-label={`تحديد ${student.fullName}`}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIdsForGroup((prev) => [...prev, record.studentId]);
                              } else {
                                setSelectedStudentIdsForGroup((prev) =>
                                  prev.filter((id) => id !== record.studentId)
                                );
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{student.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {lang === 'ar' ? 'رقم:' : 'No:'} {student.studentNumber}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{student.nationalId}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {(['present', 'absent', 'late', 'excused_leave'] as AttendanceStatus[]).map((st) => {
                              const active = record.status === st;
                              const cfg = statusLabels[st];
                              return (
                                <button
                                  key={st}
                                  disabled={!canEdit}
                                  onClick={() => handleStatusChange(record.studentId, st)}
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                                    active
                                      ? `${cfg.bg} font-bold ring-2 ring-emerald-500/20`
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                  } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                  {lang === 'ar' ? cfg.ar : cfg.en}
                                </button>
                              );
                            })}

                            {/* Extra badge if excuse approved or under review */}
                            {(record.status === 'excused_absence' || record.status === 'under_review') && (
                              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${statusLabels[record.status].bg}`}>
                                {lang === 'ar' ? statusLabels[record.status].ar : statusLabels[record.status].en}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {record.status === 'late' && (
                              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] text-amber-800">
                                <span>{lang === 'ar' ? 'تأخر:' : 'Late:'}</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="45"
                                  disabled={!canEdit}
                                  value={record.minutesLate || 10}
                                  onChange={(e) =>
                                    handleMinutesLateChange(record.studentId, parseInt(e.target.value) || 10)
                                  }
                                  className="w-10 bg-white border border-amber-300 text-center rounded px-1 py-0.5 font-bold"
                                />
                                <span>{lang === 'ar' ? 'دقيقة' : 'm'}</span>
                              </div>
                            )}

                            <input
                              type="text"
                              disabled={!canEdit}
                              placeholder={lang === 'ar' ? 'ملاحظة خاصة...' : 'Note...'}
                              value={record.note || ''}
                              onChange={(e) =>
                                updateRecord(
                                  selectedSession.id,
                                  record.studentId,
                                  record.status,
                                  record.minutesLate,
                                  e.target.value
                                )
                              }
                              className="bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-500 focus:outline-hidden text-xs text-slate-700 px-1 py-0.5 w-36 sm:w-48 placeholder:text-slate-400"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold ${
                                student.totalAbsences >= 5 ? 'text-rose-600' : 'text-slate-700'
                              }`}
                            >
                              {student.totalAbsences} {lang === 'ar' ? 'غياب' : 'absences'}
                            </span>
                            {student.totalAbsences >= 5 && (
                              <span
                                title="تنبيه: تجاوز حد الغياب المسموح"
                                className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Floating Group Bulk Actions Toolbar */}
          {selectedStudentIdsForGroup.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 min-w-[320px] max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-150">
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                  {selectedStudentIdsForGroup.length}
                </span>
                <span>{lang === 'ar' ? 'طالب محدد في المجموعة' : 'Students Selected'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickMarkSelectedGroup}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تعيين كـ حاضر (Quick Mark)' : 'Quick Mark Present'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGroupMarkAsAbsent}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تعيين كـ غائب' : 'Mark Absent'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStudentIdsForGroup([])}
                  className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Clear'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create New Session */}
      {isNewSessionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'ar' ? 'إنشاء كشف حصة جديد' : 'New Attendance Session'}
              </h3>
              <button onClick={() => setIsNewSessionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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
                      {lang === 'ar' ? 'رقم الحصة:' : 'Period Number:'}
                    </label>
                    <select
                      value={newPeriodNum}
                      onChange={(e) => setNewPeriodNum(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <option key={num} value={num}>
                          {lang === 'ar' ? `الحصة رقم (${num})` : `Period ${num}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      {lang === 'ar' ? 'المادة الدراسية:' : 'Subject:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                      placeholder="مثال: الرياضيات، الأحياء، اللغة الإنجليزية..."
                    />
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
                  <option value="10 / أ">10 / أ (الصف العاشر)</option>
                  <option value="10 / ب">10 / ب (الصف العاشر)</option>
                  <option value="11 / أ">11 / أ (الصف الحادي عشر)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSessionModalOpen(false)}
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
      )}

      {/* Modal: Reopen Session with Audit Reason */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-600 border-b border-slate-100 pb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'ar' ? 'إعادة فتح كشف حضور معتمد' : 'Reopen Submitted Session'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {lang === 'ar'
                ? 'وفق لوائح الحوكمة المدرسية، لا يمكن تعديل كشف حضور بعد اعتماده إلا بتوثيق سبب التعديل رسميًا وتدوينه في سجل التدقيق غير القابل للحذف.'
                : 'According to governance regulations, submitted attendance sessions require a mandatory reason before reopening, which is stored in the audit trail.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                {lang === 'ar' ? 'سبب إعادة الفتح (إلزامي):' : 'Reopen Reason (Required):'}
              </label>
              <textarea
                rows={3}
                required
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'مثال: تصحيح حضور الطالب فهد بعد التأكد من حضوره متأخرًا بعذر مروري...'
                    : 'Reason for modification...'
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-3.5 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReopen}
                disabled={reopenReason.trim().length < 5}
                className="px-4 py-2 text-xs bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-semibold"
              >
                {lang === 'ar' ? 'تأكيد وإعادة الفتح' : 'Confirm & Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Touchless QR Attendance Scanner Modal */}
      {isScannerOpen && (
        <QRScannerModal
          targetSessionId={selectedSession?.id}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};
