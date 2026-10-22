import React, { useState, useMemo, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Student } from '../types/attendance';
import {
  Upload,
  AlertTriangle,
  Download,

  Search,  FileSpreadsheet,

  Scan,
  Printer,

  UserPlus,




} from 'lucide-react';
import { StudentQRCodeModal } from './StudentQRCodeModal';
import { QRScannerModal } from './QRScannerModal';
import { BatchQRModal } from './BatchQRModal';
import { StudentBehaviourModal } from './attendance/StudentBehaviourModal';
import { AddStudentModal } from './students/AddStudentModal';
import { TransferStudentModal } from './students/TransferStudentModal';
import { DeleteStudentConfirmationModal } from './students/DeleteStudentConfirmationModal';
import { StudentAbsenceDrawer } from './students/StudentAbsenceDrawer';
import {
  countActiveStudents,
  countInterventionStudents,
  filterStudents,
  resolveConfiguredGrades,
} from '../utils/studentFilters';
import { StudentsRegistryTable } from './students/StudentsRegistryTable';
import {
  StudentImportModal,
  SAMPLE_IMPORT_TEXT,
  downloadStudentImportTemplate,
} from './students/StudentImportModal';

interface StudentManagementViewProps {
  initialStudentId?: string;
}

export const StudentManagementView: React.FC<StudentManagementViewProps> = ({
  initialStudentId,
}) => {
  const {
    students,
    importStudents,
    addStudent,
    transferStudent,
    restoreStudent,
    deleteStudent,
    classesStats,
    schoolEnrollmentStats,
    schoolProfile,
    lang,
    currentTenant,
    currentUser,
    isSuperAdmin,
    canImportStudents,
    tenantSubscription,
    behaviourIncidents,
    addBehaviourIncident,
  } = useAttendance();

  // Deleting a student record is an administrator-only operation server-side
  // (`DELETE /api/students/:id`); keep the UI in step so registrars never get a 403.
  const canDeleteStudents = currentUser.role === 'admin' || isSuperAdmin;

  const maxStudents = tenantSubscription?.limits?.maxStudents;
  const studentLimitReached =
    typeof maxStudents === 'number' &&
    maxStudents > 0 &&
    schoolEnrollmentStats.activeStudentsCount >= maxStudents;
  const remainingStudentSeats =
    typeof maxStudents === 'number' && maxStudents > 0
      ? Math.max(0, maxStudents - schoolEnrollmentStats.activeStudentsCount)
      : Number.POSITIVE_INFINITY;

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'transferred' | 'all'>('active');
  const [interventionOnly, setInterventionOnly] = useState<boolean>(false);

  // Intervention threshold bound strictly to settings (schoolProfile.unexcusedWarningThreshold)
  const warningThreshold = schoolProfile?.unexcusedWarningThreshold ?? 3;
  const activeStudentsCount = countActiveStudents(students);
  const interventionStudentsCount = countInterventionStudents(students, warningThreshold);

  // Configured grades derived directly from Settings Profile as single source of truth
  const configuredGradesList = useMemo(
    () => resolveConfiguredGrades(schoolProfile?.educationalGrades, classesStats),
    [schoolProfile?.educationalGrades, classesStats]
  );

  // Single Student Modals
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [selectedStudentForAbsence, setSelectedStudentForAbsence] = useState<Student | null>(null);

  // 2-Stage Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPrefill, setImportPrefill] = useState<string>('');


  useEffect(() => {
    if (initialStudentId) {
      const match = students.find((s) => s.id === initialStudentId);
      if (match) {
        setSelectedStudentForAbsence(match);
      }
    }
  }, [initialStudentId, students]);
  

  // QR Code states
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isBatchQRModalOpen, setIsBatchQRModalOpen] = useState(false);

  // Student Behaviour Modal state
  const [selectedStudentForBehaviour, setSelectedStudentForBehaviour] = useState<Student | null>(null);


  // Filter existing students in view
  const filteredStudents = filterStudents(students, {
    statusFilter,
    interventionOnly,
    warningThreshold,
    selectedGrade: selectedGradeFilter,
    selectedClass,
    searchQuery,
  });

  const handleRestoreStudent = async (studentId: string) => {
    const result = await restoreStudent(studentId);
    if (!result.success) {
      alert(result.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="app-section-header rounded-xl border p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold">
            {lang === 'ar' ? 'سجل الطلاب المقيدين في المدرسة' : 'Enrolled Students Registry'}
          </h3>
          <p className="text-xs opacity-85 mt-0.5">
            {lang === 'ar'
              ? `${schoolEnrollmentStats.activeStudentsCount} طالب نشط (${schoolEnrollmentStats.totalStudentsCount} سجل إجمالي)`
              : `${schoolEnrollmentStats.activeStudentsCount} Active Students (${schoolEnrollmentStats.totalStudentsCount} Total Records)`}
          </p>
          {studentLimitReached && (
            <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-300 mt-1">
              {lang === 'ar'
                ? `تم بلوغ الحد الأقصى لعدد الطلاب في خطتكم (${maxStudents}).`
                : `Your plan's student limit has been reached (${maxStudents}).`}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* New Single Student Add Button */}
          <button
            onClick={() => setIsAddStudentModalOpen(true)}
            disabled={studentLimitReached}
            title={studentLimitReached ? (lang === 'ar' ? 'تم بلوغ الحد الأقصى لعدد الطلاب' : 'Student limit reached') : undefined}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة طالب' : 'Add Student'}</span>
          </button>

          <button
            onClick={() => {
              setImportPrefill('');
              setIsImportModalOpen(true);
            }}
            disabled={studentLimitReached}
            title={studentLimitReached ? (lang === 'ar' ? 'تم بلوغ الحد الأقصى لعدد الطلاب' : 'Student limit reached') : undefined}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span>{lang === 'ar' ? 'استيراد CSV' : 'Import CSV'}</span>
          </button>

          <button
            onClick={() => downloadStudentImportTemplate(schoolProfile, currentTenant.code)}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title={lang === 'ar' ? 'تحميل قالب ملف CSV الجاهز' : 'Download CSV Template'}
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'ar' ? 'القالب' : 'Template'}</span>
          </button>

          <button
            onClick={() => setIsScannerModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Scan className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'ar' ? 'قارئ QR' : 'Scan QR'}</span>
          </button>

          <button
            onClick={() => setIsBatchQRModalOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>{lang === 'ar' ? 'بطاقات QR' : 'QR Badges'}</span>
          </button>

          {canImportStudents && (
            <button
              onClick={() => {
                setImportPrefill(SAMPLE_IMPORT_TEXT);
                setIsImportModalOpen(true);
              }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer border border-slate-300"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'معاينة عينة استيراد' : 'Test Import'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar with Quick Intervention Drilldown */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs w-full md:w-auto">
          {/* Grade Select Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="student-grade-filter" className="font-semibold text-slate-700">
              {lang === 'ar' ? 'المرحلة:' : 'Grade:'}
            </label>
            <select
              id="student-grade-filter"
              value={selectedGradeFilter}
              onChange={(e) => {
                const newG = e.target.value;
                setSelectedGradeFilter(newG);
                if (newG !== 'all' && selectedClass !== 'all') {
                  const currentCls = classesStats.find((c) => c.className === selectedClass);
                  if (currentCls && currentCls.grade !== newG) {
                    setSelectedClass('all');
                  }
                }
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 cursor-pointer text-xs"
            >
              <option value="all">{lang === 'ar' ? 'جميع المراحل' : 'All Grades'}</option>
              {configuredGradesList.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Class Select */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="student-class-filter" className="font-semibold text-slate-700">
              {lang === 'ar' ? 'الفصل:' : 'Class:'}
            </label>
            <select
              id="student-class-filter"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 cursor-pointer text-xs"
            >
              <option value="all">{lang === 'ar' ? 'جميع الفصول' : 'All Classes'}</option>
              {classesStats
                .filter((c) => selectedGradeFilter === 'all' || c.grade === selectedGradeFilter)
                .map((c) => (
                  <option key={c.className} value={c.className}>
                    {c.className} ({c.activeStudents} {lang === 'ar' ? 'طالب' : 'students'})
                  </option>
                ))}
            </select>
          </div>

          {/* Quick Intervention Filter Button - Percentage Prominent + Count Beside */}
          <button
            onClick={() => setInterventionOnly(!interventionOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              interventionOnly
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-500/20'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
            }`}
            title={lang === 'ar' ? 'تصفية فورية للطلاب المحتاجين للتدخل ومتابعة الغياب' : 'Filter students requiring intervention'}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-current shrink-0" />
            <span>
              {lang === 'ar' ? 'الطلاب بحاجة لتدخل:' : 'Intervention Needed:'}
            </span>
            <span className="font-mono font-black">
              %{activeStudentsCount > 0
                ? Math.round((interventionStudentsCount / activeStudentsCount) * 100)
                : 0}
            </span>
            <span className="text-[11px] opacity-90 font-medium">
              ({interventionStudentsCount})
            </span>
          </button>

          {/* Active Grade Filter indicator if selected */}
          {selectedGradeFilter !== 'all' && (
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-1 rounded-lg text-[11px] font-bold">
              <span>المرحلة: {selectedGradeFilter}</span>
              <button
                onClick={() => setSelectedGradeFilter('all')}
                className="text-indigo-600 hover:text-indigo-900 cursor-pointer text-xs font-black"
                title="إلغاء تصفية المرحلة"
              >
                ✕
              </button>
            </div>
          )}

          {/* Reset all filters if any are applied */}
          {(selectedClass !== 'all' || selectedGradeFilter !== 'all' || interventionOnly || statusFilter !== 'active') && (
            <button
              onClick={() => {
                setSelectedClass('all');
                setSelectedGradeFilter('all');
                setInterventionOnly(false);
                setStatusFilter('active');
                setSearchQuery('');
              }}
              className="text-slate-500 hover:text-slate-900 underline text-[11px] cursor-pointer"
            >
              {lang === 'ar' ? 'إعادة ضبط التصفية' : 'Reset filters'}
            </button>
          )}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder={lang === 'ar' ? 'بحث بالاسم، السجل، المدرسة، أو الهاتف...' : 'Search student...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-9 pl-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Students Table */}
      <StudentsRegistryTable
        lang={lang}
        students={filteredStudents}
        behaviourIncidents={behaviourIncidents}
        canDeleteStudents={canDeleteStudents}
        onOpenAbsence={setSelectedStudentForAbsence}
        onOpenBehaviour={setSelectedStudentForBehaviour}
        onOpenQR={setSelectedStudentForQR}
        onRestore={(studentId) => void handleRestoreStudent(studentId)}
        onTransfer={setStudentToTransfer}
        onDelete={setStudentToDelete}
      />

      {/* 2-STAGE CSV IMPORT MODAL */}
      <StudentImportModal
        isOpen={isImportModalOpen}
        lang={lang}
        students={students}
        schoolProfile={schoolProfile}
        classesStats={classesStats}
        remainingStudentSeats={remainingStudentSeats}
        tenantCode={currentTenant.code}
        importStudents={importStudents}
        prefill={importPrefill}
        onClose={() => setIsImportModalOpen(false)}
      />
      {/* Individual Student QR Badge Modal */}
      {selectedStudentForQR && (
        <StudentQRCodeModal
          student={selectedStudentForQR}
          onClose={() => setSelectedStudentForQR(null)}
          onScanInSession={(std) => {
            setSelectedStudentForQR(null);
            setIsScannerModalOpen(true);
          }}
        />
      )}

      {/* Touchless QR Attendance Scanner Modal */}
      {isScannerModalOpen && (
        <QRScannerModal
          onClose={() => setIsScannerModalOpen(false)}
        />
      )}

      {/* Batch QR Badges Sheet Modal */}
      {isBatchQRModalOpen && (
        <BatchQRModal
          initialClass={selectedClass}
          onClose={() => setIsBatchQRModalOpen(false)}
        />
      )}

      {/* Student Behaviour & Positive Recognition Modal */}
      {selectedStudentForBehaviour && (
        <StudentBehaviourModal
          isOpen={true}
          onClose={() => setSelectedStudentForBehaviour(null)}
          student={selectedStudentForBehaviour}
          incidents={behaviourIncidents}
          onAddIncident={addBehaviourIncident}
          lang={lang}
          currentUserRole={currentUser.role}
          currentUserName={currentUser.name}
        />
      )}

      {/* Add Single Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onAddStudent={addStudent}
        classesStats={classesStats}
        educationalGrades={schoolProfile?.educationalGrades}
        lang={lang}
      />

      {/* Transfer Student to Another School Modal */}
      <TransferStudentModal
        isOpen={!!studentToTransfer}
        student={studentToTransfer}
        onClose={() => setStudentToTransfer(null)}
        onConfirmTransfer={transferStudent}
        lang={lang}
      />

      {/* Permanent Delete Student Confirmation Modal */}
      <DeleteStudentConfirmationModal
        isOpen={!!studentToDelete}
        student={studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirmDelete={deleteStudent}
        lang={lang}
      />

      {/* Student Absence & Conduct Slide-over Drawer */}
      <StudentAbsenceDrawer
        student={selectedStudentForAbsence}
        isOpen={Boolean(selectedStudentForAbsence)}
        onClose={() => setSelectedStudentForAbsence(null)}
      />
    </div>
  );
};
