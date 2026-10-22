import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceStatus } from '../types/attendance';
import {
  Calendar,
  PlusCircle,
  CheckCircle2,
  Search,
  Filter,
  X,
  Palmtree,
  ShieldAlert,
} from 'lucide-react';
import { QRScannerModal } from './QRScannerModal';
import { BulkEditConfirmationModal } from './attendance/BulkEditConfirmationModal';
import { ClassCalendarView } from './attendance/ClassCalendarView';
import { GamifiedCelebrationModal } from './attendance/GamifiedCelebrationModal';
import { EmergencyRosterModal } from './attendance/EmergencyRosterModal';
import { NewSessionModal } from './attendance/NewSessionModal';
import { ReopenSessionModal } from './attendance/ReopenSessionModal';
import { SessionRosterPanel } from './attendance/SessionRosterPanel';
import { SessionKpiStats } from './attendance/SessionKpiStats';
import { QuickMarkWorkflowBanner } from './attendance/QuickMarkWorkflowBanner';
import { SessionOverviewHeader } from './attendance/SessionOverviewHeader';
interface AttendanceSessionsViewProps {
  initialOpenEmergencyModal?: boolean;
}

export const AttendanceSessionsView: React.FC<AttendanceSessionsViewProps> = ({
  initialOpenEmergencyModal = false,
}) => {
  const {
    sessions,
    students,
    currentUser,
    lang,
    updateRecord,
    quickMarkGroupAsPresent,
    submitSession,
    reopenSession,
    createNewSession,
    canEditSession,
    classesStats,
    schoolProfile,
    isOffDay,
  } = useAttendance();

  // State
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
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
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [pendingBulkStatus, setPendingBulkStatus] = useState<AttendanceStatus>('absent');
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [celebrationStats, setCelebrationStats] = useState({ rate: 100, present: 0, total: 0 });
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(initialOpenEmergencyModal);

  React.useEffect(() => {
    if (initialOpenEmergencyModal) {
      setIsEmergencyModalOpen(true);
    }
  }, [initialOpenEmergencyModal]);


  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || sessions[0];

  // Filtered session records (excludes transferred students from active roll-call)
  const sessionStudents = (selectedSession?.records ?? []).map((rec) => {
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
    // Hide transferred students from active daily roll-call
    if (item.student.enrollmentStatus === 'transferred') return false;

    const matchesSearch =
      item.student.fullName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      item.student.nationalId.includes(searchStudent) ||
      item.student.studentNumber.includes(searchStudent);

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return item.record.status === statusFilter;
  }) || [];

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!selectedSession || !canEditSession(selectedSession)) {
      alert(
        lang === 'ar'
          ? (selectedSession?.status === 'submitted'
              ? 'الكشف معتمد رسمياً ومقفل. يلزم إعادة فتح الكشف بواسطة الإدارة أولاً لتعديل السجلات.'
              : 'هذا الكشف ليس ضمن الصفوف المسندة لك كمعلم (صلاحية قراءة فقط).')
          : 'You do not have permission to edit this session.'
      );
      return;
    }
    updateRecord(selectedSession.id, studentId, status);
  };

  const handleRestorePresent = (studentId: string) => {
    if (!selectedSession) return;
    updateRecord(selectedSession.id, studentId, 'present');
  };

  const handleMinutesLateChange = (studentId: string, minutes: number) => {
    updateRecord(selectedSession.id, studentId, 'late', minutes);
  };

  // Quick Mark: Mark Whole Class as Present by Default
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIdsForGroup((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  const handleNoteChange = (
    studentId: string,
    status: AttendanceStatus,
    minutesLate: number | undefined,
    note: string
  ) => {
    if (!selectedSession) return;
    updateRecord(selectedSession.id, studentId, status, minutesLate, note);
  };

  const handleQuickMarkWholeClass = () => {
    if (!selectedSession) return;
    if (selectedSession.status === 'submitted') {
      if (currentUser.role === 'admin' || currentUser.role === 'registrar' || currentUser.role === 'super_admin') {
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
    if (selectedSession.status === 'submitted' && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
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

  // Open confirmation before marking as Absent
  const handleGroupMarkAsAbsent = () => {
    if (!selectedSession || selectedStudentIdsForGroup.length === 0) return;
    setPendingBulkStatus('absent');
    setIsBulkConfirmOpen(true);
  };

  // Open confirmation before bulk Quick Mark as Present (if more than 3 students)
  const handleRequestQuickMarkPresent = () => {
    if (!selectedSession || selectedStudentIdsForGroup.length === 0) return;
    if (selectedStudentIdsForGroup.length > 5) {
      setPendingBulkStatus('present');
      setIsBulkConfirmOpen(true);
    } else {
      handleQuickMarkSelectedGroup();
    }
  };

  // Execution after confirmation
  const handleConfirmBulkAction = () => {
    if (!selectedSession || selectedStudentIdsForGroup.length === 0) {
      setIsBulkConfirmOpen(false);
      return;
    }
    const count = selectedStudentIdsForGroup.length;

    if (pendingBulkStatus === 'present') {
      quickMarkGroupAsPresent(selectedSession.id, selectedStudentIdsForGroup);
      setIsQuickMarkActive(true);
      setNotificationBanner(
        lang === 'ar'
          ? `⚡ تم تطبيق التحضير السريع على المجموعة المحددة (${count} طالب) كـ 'حاضر'.`
          : `⚡ Quick Mark applied to ${count} students as Present.`
      );
    } else {
      selectedStudentIdsForGroup.forEach((id) => {
        updateRecord(selectedSession.id, id, pendingBulkStatus);
      });
      setNotificationBanner(
        lang === 'ar'
          ? `تم تحديث حالة ${count} طالب كـ '${pendingBulkStatus === 'absent' ? 'غائب' : 'حاضر'}'.`
          : `Updated ${count} students as ${pendingBulkStatus}.`
      );
    }

    setIsBulkConfirmOpen(false);
    setSelectedStudentIdsForGroup([]);
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
      // Trigger gamified celebration
      const total = selectedSession.records.length;
      const present = selectedSession.records.filter((r) => r.status === 'present').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 100;
      setCelebrationStats({ rate, present, total });
      setIsCelebrationOpen(true);
    } else {
      alert(res.message);
    }
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


      {/* Official Holiday / Weekend Alert Banner when current filter date is an off-day */}
      {(() => {
        const offDayCheck = isOffDay(filterDate);
        if (offDayCheck.isOff) {
          return (
            <div className="bg-purple-50 border border-purple-200 text-purple-950 p-3.5 rounded-xl flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Palmtree className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-purple-900">{offDayCheck.reason}</span>
                    <span className="text-[10px] bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                      {lang === 'ar' ? 'إجازة رسمية معتمدة' : 'Official Off-Day'}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800 mt-0.5">
                    {lang === 'ar'
                      ? `التاريخ المختار (${filterDate}) يوافق عطلة رسمية أو نهاية أسبوع. وفقاً للائحة الانضباط، لا يتم احتساب أي غياب للطلاب ولا يؤثر هذا اليوم على نسب الحضور.`
                      : `Selected date (${filterDate}) is an official holiday or weekend. Absences are not calculated or recorded for students.`}
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-purple-700 bg-white px-2 py-1 rounded-lg border border-purple-200 hidden sm:inline">
                {filterDate}
              </span>
            </div>
          );
        }
        return null;
      })()}

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

          {/* Right: View Mode Toggle & New Session button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'ar' ? 'كشف الحصة' : 'Session Table'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                  viewMode === 'calendar'
                    ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'التقويم الشهري' : 'Calendar'}</span>
              </button>
            </div>

            <button
              onClick={() => setIsNewSessionModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إنشاء كشف حصة جديد' : 'New Session'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEmergencyModalOpen(true)}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
              title={lang === 'ar' ? 'تفعيل وضع الطوارئ وحصر الإخلاء الميداني' : 'Emergency & Evacuation Mode'}
            >
              <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
              <span>{lang === 'ar' ? 'وضع الطوارئ والإخلاء' : 'Emergency Roster'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature #6: Class Calendar View */}
      {viewMode === 'calendar' && (
        <ClassCalendarView
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={(sessId) => {
            setSelectedSessionId(sessId);
            setViewMode('table');
          }}
          lang={lang}
        />
      )}

      {viewMode === 'table' && selectedSession && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Session Overview Header */}
          <SessionOverviewHeader
            lang={lang}
            session={selectedSession}
            currentUserRole={currentUser.role}
            isQuickMarkMenuOpen={isQuickMarkMenuOpen}
            onToggleQuickMarkMenu={() => setIsQuickMarkMenuOpen(!isQuickMarkMenuOpen)}
            onCloseQuickMarkMenu={() => setIsQuickMarkMenuOpen(false)}
            selectedStudentIdsForGroup={selectedStudentIdsForGroup}
            onQuickMarkWholeClass={handleQuickMarkWholeClass}
            onQuickMarkSelectedGroup={handleQuickMarkSelectedGroup}
            onOpenScanner={() => setIsScannerOpen(true)}
            onSubmitSession={handleSubmitSession}
            onOpenReopen={() => setIsReopenModalOpen(true)}
          />

            {/* Quick KPI stats for this session - Prominent Percentages + Actual Headcounts + Instant Drilldown */}
            <SessionKpiStats
              lang={lang}
              session={selectedSession}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            {/* Quick Mark Active Workflow Banner & Absentee Live Adjuster */}
            <QuickMarkWorkflowBanner
              isQuickMarkActive={isQuickMarkActive}
              lang={lang}
              session={selectedSession}
              students={students}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onClose={() => setIsQuickMarkActive(false)}
              onRestorePresent={handleRestorePresent}
            />

          {/* Filter & Search Bar, Students Roster Table & Bulk Actions */}
          <SessionRosterPanel
            lang={lang}
            sessionStudents={sessionStudents}
            canEdit={selectedSession ? canEditSession(selectedSession) : false}
            sessionStatus={selectedSession?.status || 'draft'}
            searchStudent={searchStudent}
            onSearchChange={setSearchStudent}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            selectedStudentIdsForGroup={selectedStudentIdsForGroup}
            onToggleStudent={handleToggleStudent}
            onToggleSelectAll={handleToggleSelectAll}
            onClearSelection={() => setSelectedStudentIdsForGroup([])}
            onStatusChange={handleStatusChange}
            onMinutesLateChange={handleMinutesLateChange}
            onNoteChange={handleNoteChange}
            onRequestQuickMarkPresent={handleRequestQuickMarkPresent}
            onGroupMarkAsAbsent={handleGroupMarkAsAbsent}
          />
        </div>
      )}

      {viewMode === 'table' && !selectedSession && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">
            {lang === 'ar' ? 'لا توجد كشوف حضور مسجلة لهذا اليوم' : 'No attendance sessions found for this date'}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {lang === 'ar'
              ? 'يمكنك إنشاء كشف حضور جديد لبدء رصد الحضور والغياب للطلاب.'
              : 'You can create a new session to begin recording student attendance.'}
          </p>
          <button
            type="button"
            onClick={() => setIsNewSessionModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إنشاء كشف جديد' : 'Create New Session'}</span>
          </button>
        </div>
      )}

      {/* Modal: Create New Session */}
      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        lang={lang}
        schoolProfile={schoolProfile}
        classesStats={classesStats}
        isOffDay={isOffDay}
        createNewSession={createNewSession}
        onClose={() => setIsNewSessionModalOpen(false)}
        onCreated={setSelectedSessionId}
      />

      {/* Modal: Reopen Session with Audit Reason */}
      <ReopenSessionModal
        isOpen={isReopenModalOpen}
        lang={lang}
        sessionId={selectedSession?.id}
        reopenSession={reopenSession}
        onClose={() => setIsReopenModalOpen(false)}
        onNotify={setNotificationBanner}
      />
      {/* Touchless QR Attendance Scanner Modal */}
      {isScannerOpen && (
        <QRScannerModal
          targetSessionId={selectedSession?.id}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* Bulk Edit Confirmation Modal */}
      <BulkEditConfirmationModal
        isOpen={isBulkConfirmOpen}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={handleConfirmBulkAction}
        targetStatus={pendingBulkStatus}
        selectedStudents={students.filter((s) => selectedStudentIdsForGroup.includes(s.id))}
        sessionTitle={`${selectedSession?.subject || 'كشف الحضور'} - ${selectedSession?.className || ''}`}
        lang={lang}
      />

      {/* Gamified Celebration Modal */}
      <GamifiedCelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        classNameTitle={`${selectedSession?.className || ''} - ${selectedSession?.subject || ''}`}
        attendanceRate={celebrationStats.rate}
        totalPresent={celebrationStats.present}
        totalStudents={celebrationStats.total}
        lang={lang}
      />

      {/* Fullscreen Emergency & Evacuation Modal */}
      <EmergencyRosterModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
      />
    </div>
  );
};
