import React, { useState, useRef } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Student } from '../types/attendance';
import {
  Users,
  Upload,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  Search,
  Plus,
  X,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ArrowRight,
  Info,
  QrCode,
  Scan,
  Printer,
  Award,
  UserPlus,
  ArrowRightLeft,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { StudentQRCodeModal } from './StudentQRCodeModal';
import { QRScannerModal } from './QRScannerModal';
import { BatchQRModal } from './BatchQRModal';
import { StudentBehaviourModal } from './attendance/StudentBehaviourModal';
import { AddStudentModal } from './students/AddStudentModal';
import { TransferStudentModal } from './students/TransferStudentModal';
import { DeleteStudentConfirmationModal } from './students/DeleteStudentConfirmationModal';

interface ParsedImportRow {
  rowNumber: number;
  fullName: string;
  nationalId: string;
  studentNumber: string;
  grade: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
  bloodType?: string;
  isValid: boolean;
  errorReason?: string;
}

export const StudentManagementView: React.FC = () => {
  const {
    students,
    importStudents,
    addStudent,
    transferStudent,
    restoreStudent,
    deleteStudent,
    classesStats,
    schoolEnrollmentStats,
    lang,
    currentTenant,
    currentUser,
    canImportStudents,
    behaviourIncidents,
    addBehaviourIncident,
  } = useAttendance();

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'transferred' | 'all'>('active');
  const [interventionOnly, setInterventionOnly] = useState<boolean>(false);

  // Intervention count across active school students (rate < 90% or absences >= 3)
  const activeStudentsList = students.filter((s) => s.enrollmentStatus !== 'transferred');
  const interventionStudentsCount = activeStudentsList.filter(
    (s) => s.attendanceRate < 90 || s.totalAbsences >= 3
  ).length;

  // Single Student Modals
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  // 2-Stage Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStage, setImportStage] = useState<1 | 2>(1); // 1 = Input, 2 = Validation Preview
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validatedRows, setValidatedRows] = useState<ParsedImportRow[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'errors'>('all');
  const [importResultSummary, setImportResultSummary] = useState<{ imported: number; duplicates: number } | null>(null);

  // QR Code states
  const [selectedStudentForQR, setSelectedStudentForQR] = useState<Student | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isBatchQRModalOpen, setIsBatchQRModalOpen] = useState(false);

  // Student Behaviour Modal state
  const [selectedStudentForBehaviour, setSelectedStudentForBehaviour] = useState<Student | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample CSV text with deliberate mix of valid and duplicate rows for testing
  const sampleImportText = `الرقم المدرسي,السجل المدني,اسم الطالب,المرحلة,الفصل,ولي الأمر,الهاتف,فصيلة الدم
20260191,1098765491,فيصل بن منصور الحربي,الصف العاشر,10 / أ,منصور الحربي,+966501234567,O+
20260192,1098765492,بدر بن عبد الله الرشيد,الصف العاشر,10 / أ,عبد الله الرشيد,+966502345678,A+
20260101,1098765431,يوسف بن خالد المطيري,الصف العاشر,10 / أ,د. خالد المطيري,+966509990011,O+
20260193,,سعود بن نايف الشمري,الصف العاشر,10 / ب,نايف الشمري,+966503456789,B+
20260194,1098765494,تركي بن فهد السبيعي,الصف العاشر,10 / ب,فهد السبيعي,+966504567890,AB+
20260195,1098765495,مشعل بن إبراهيم التميمي,الصف العاشر,10 / ب,إبراهيم التميمي,+966505678901,A-`;

  // Filter existing students in view
  const filteredStudents = students.filter((s) => {
    if (statusFilter === 'active' && s.enrollmentStatus === 'transferred') return false;
    if (statusFilter === 'transferred' && s.enrollmentStatus !== 'transferred') return false;
    if (interventionOnly && (s.attendanceRate >= 90 && s.totalAbsences < 3)) return false;
    if (selectedGradeFilter !== 'all' && s.grade !== selectedGradeFilter) return false;
    if (selectedClass !== 'all' && s.className !== selectedClass) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.nationalId.includes(q) ||
        s.studentNumber.includes(q) ||
        s.guardianPhone.includes(q) ||
        (s.destinationSchool && s.destinationSchool.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Download official CSV template with UTF-8 BOM
  const handleDownloadTemplate = () => {
    const csvContent =
      '\uFEFF' +
      `الرقم المدرسي,السجل المدني,اسم الطالب,المرحلة,الفصل,ولي الأمر,الهاتف,فصيلة الدم
20260301,1098111221,عبد العزيز بن فهد الدوسري,الصف العاشر,10 / أ,فهد الدوسري,+966501112233,O+
20260302,1098111222,زياد بن ناصر القحطاني,الصف العاشر,10 / أ,ناصر القحطاني,+966502223344,A+
20260303,1098111223,معاذ بن خالد العتيبي,الصف العاشر,10 / ب,خالد العتيبي,+966503334455,B+`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `قالب_استيراد_الطلاب_${currentTenant.code}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download CSV Error Report for rejected rows
  const handleDownloadErrorReport = () => {
    const errorRows = validatedRows.filter((r) => !r.isValid);
    if (errorRows.length === 0) return;

    const headers = ['رقم الصف في الملف', 'اسم الطالب', 'السجل المدني', 'الرقم المدرسي', 'سبب الاستبعاد والخطأ'];
    const rows = errorRows.map((r) => [
      r.rowNumber,
      `"${r.fullName}"`,
      `"${r.nationalId}"`,
      `"${r.studentNumber}"`,
      `"${r.errorReason}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_أخطاء_استيراد_الطلاب_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle uploaded file via input or drop
  const processUploadedFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('يرجى اختيار ملف بصيغة CSV (.csv)');
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawCsvText(text || '');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Helper to split CSV line safely handling quoted fields
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    // Support both comma and semicolon delimiters
    const delimiter = line.includes(';') && !line.includes(',') ? ';' : ',';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  // Stage 1 -> Stage 2 Validation parser
  const handleValidateInput = () => {
    if (!rawCsvText.trim()) return;

    const lines = rawCsvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    const rowsToValidate: ParsedImportRow[] = [];

    // Existing IDs for duplicate check in current school
    const existingNatIds = new Set(students.map((s) => s.nationalId));
    const existingStdNums = new Set(students.map((s) => s.studentNumber));
    const seenInThisFile = new Set<string>();

    let headerIndex = -1;
    let colIndices = {
      studentNumber: 0,
      nationalId: 1,
      fullName: 2,
      grade: 3,
      className: 4,
      guardianName: 5,
      guardianPhone: 6,
      bloodType: 7,
    };

    // Detect headers if present
    if (lines.length > 0) {
      const firstLineParts = parseCsvLine(lines[0]);
      const isHeader = firstLineParts.some(
        (p) =>
          p.includes('اسم') ||
          p.includes('Name') ||
          p.includes('الرقم') ||
          p.includes('Number') ||
          p.includes('السجل') ||
          p.includes('ID')
      );

      if (isHeader) {
        headerIndex = 0;
        // Dynamically map column positions
        firstLineParts.forEach((p, idx) => {
          const clean = p.toLowerCase();
          if (clean.includes('رقم مدرسي') || clean.includes('student no') || clean.includes('student_number')) colIndices.studentNumber = idx;
          else if (clean.includes('سجل') || clean.includes('national') || clean.includes('id')) colIndices.nationalId = idx;
          else if (clean.includes('اسم') || clean.includes('name')) colIndices.fullName = idx;
          else if (clean.includes('مرحلة') || clean.includes('grade')) colIndices.grade = idx;
          else if (clean.includes('فصل') || clean.includes('class') || clean.includes('section')) colIndices.className = idx;
          else if (clean.includes('ولي') || clean.includes('guardian') || clean.includes('parent')) colIndices.guardianName = idx;
          else if (clean.includes('هاتف') || clean.includes('جوال') || clean.includes('phone')) colIndices.guardianPhone = idx;
          else if (clean.includes('دم') || clean.includes('blood')) colIndices.bloodType = idx;
        });
      }
    }

    const dataLines = headerIndex === 0 ? lines.slice(1) : lines;

    dataLines.forEach((line, index) => {
      const parts = parseCsvLine(line);
      if (parts.length < 2) return;

      const studentNumber = parts[colIndices.studentNumber] || '';
      const nationalId = parts[colIndices.nationalId] || '';
      const fullName = parts[colIndices.fullName] || '';
      const grade = parts[colIndices.grade] || classesStats[0]?.grade || 'المرحلة الدراسية';
      const className = parts[colIndices.className] || classesStats[0]?.className || 'غير محدد';
      const guardianName = parts[colIndices.guardianName] || 'ولي أمر الطالب';
      const guardianPhone = parts[colIndices.guardianPhone] || '+966500000000';
      const bloodType = parts[colIndices.bloodType] || 'O+';

      let isValid = true;
      let errorReason: string | undefined = undefined;

      if (!fullName) {
        isValid = false;
        errorReason = 'اسم الطالب مفقود أو فارغ';
      } else if (!nationalId && !studentNumber) {
        isValid = false;
        errorReason = 'السجل المدني والرقم المدرسي كلاهما مفقود';
      } else if (nationalId && existingNatIds.has(nationalId)) {
        isValid = false;
        errorReason = `السجل المدني (${nationalId}) مسجل مسبقاً بالمدرسة (مكرر)`;
      } else if (studentNumber && existingStdNums.has(studentNumber)) {
        isValid = false;
        errorReason = `الرقم المدرسي (${studentNumber}) مسجل مسبقاً بالمدرسة (مكرر)`;
      } else if ((nationalId && seenInThisFile.has(nationalId)) || (studentNumber && seenInThisFile.has(studentNumber))) {
        isValid = false;
        errorReason = 'سجل مكرر أكثر من مرة داخل نفس الملف المرفوع';
      }

      if (nationalId) seenInThisFile.add(nationalId);
      if (studentNumber) seenInThisFile.add(studentNumber);

      rowsToValidate.push({
        rowNumber: index + (headerIndex === 0 ? 2 : 1),
        fullName,
        nationalId,
        studentNumber,
        grade,
        className,
        guardianName,
        guardianPhone,
        bloodType,
        isValid,
        errorReason,
      });
    });

    setValidatedRows(rowsToValidate);
    setImportStage(2);
  };

  // Commit valid rows
  const handleCommitImport = () => {
    const validRows = validatedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const res = importStudents(
      validRows.map((r) => ({
        fullName: r.fullName,
        nationalId: r.nationalId,
        studentNumber: r.studentNumber,
        grade: r.grade,
        className: r.className,
        classId:
          classesStats.find((c) => c.className === r.className)?.classId ||
          `class-${r.className.replace(/[^a-zA-Z0-9]/g, '')}`,
        guardianName: r.guardianName,
        guardianPhone: r.guardianPhone,
        bloodType: r.bloodType,
      }))
    );

    setImportResultSummary(res);
  };

  const handleCloseModal = () => {
    setIsImportModalOpen(false);
    setImportStage(1);
    setRawCsvText('');
    setUploadedFile(null);
    setValidatedRows([]);
    setImportResultSummary(null);
    setPreviewFilter('all');
  };

  const validCount = validatedRows.filter((r) => r.isValid).length;
  const errorCount = validatedRows.filter((r) => !r.isValid).length;

  const previewDisplayRows = validatedRows.filter((r) => {
    if (previewFilter === 'valid') return r.isValid;
    if (previewFilter === 'errors') return !r.isValid;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="app-section-header rounded-xl border p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold">
            {lang === 'ar' ? 'سجل الطلاب المقيدين في المدرسة' : 'Enrolled Students Registry'}
          </h3>
          <p className="text-xs opacity-85 mt-0.5">
            {currentTenant.name} · {schoolEnrollmentStats.activeStudentsCount} طالب نشط ({schoolEnrollmentStats.totalStudentsCount} إجمالي السجلات)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* New Single Student Add Button */}
          <button
            onClick={() => setIsAddStudentModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة طالب' : 'Add Student'}</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>{lang === 'ar' ? 'استيراد CSV' : 'Import CSV'}</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
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
                setRawCsvText(sampleImportText);
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
              {classesStats.map((c) => (
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
              %{activeStudentsList.length > 0
                ? Math.round((interventionStudentsCount / activeStudentsList.length) * 100)
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'اسم الطالب' : 'Student Name'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'الرقم المدرسي' : 'Student No'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'السجل المدني' : 'National ID'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'الفصل الدراسي' : 'Class'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'ولي الأمر' : 'Guardian'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'هاتف التواصل' : 'Phone'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'فصيلة الدم' : 'Blood'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'نسبة الحضور' : 'Attendance %'}</th>
                <th className="py-3 px-4 text-center">{lang === 'ar' ? 'السلوك والمواظبة' : 'Behavior'}</th>
                <th className="py-3 px-4 text-center">{lang === 'ar' ? 'بطاقة الـ QR' : 'QR Badge'}</th>
                <th className="py-3 px-4 text-center">{lang === 'ar' ? 'إدارة القيد' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-slate-500">
                    {lang === 'ar' ? 'لا يوجد طلاب مطابقين للتصفية' : 'No students found'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const studentIncidents = behaviourIncidents.filter((b) => b.studentId === s.id);
                  const pointsSum = studentIncidents.reduce((sum, item) => sum + item.points, 0);
                  const isTransferred = s.enrollmentStatus === 'transferred';

                  return (
                    <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${isTransferred ? 'bg-amber-50/30' : ''}`}>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{s.fullName}</span>
                          {isTransferred && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-amber-300">
                              {lang === 'ar' ? 'منقول' : 'Transferred'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{s.studentNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{s.nationalId}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <div>{s.className}</div>
                        {isTransferred && s.destinationSchool && (
                          <div className="text-[10px] text-amber-800 font-medium truncate max-w-[150px]" title={s.destinationSchool}>
                            ← {s.destinationSchool}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{s.guardianName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600" dir="ltr">{s.guardianPhone}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700 font-bold">
                          {s.bloodType || 'O+'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-bold px-2 py-0.5 rounded-md text-xs inline-block ${
                                s.attendanceRate >= 95
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : s.attendanceRate >= 85
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border border-rose-300 font-black'
                              }`}
                            >
                              %{s.attendanceRate}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium font-mono">
                              ({s.totalAbsences} {lang === 'ar' ? 'غياب' : 'abs'})
                            </span>
                          </div>
                          {s.attendanceRate < 85 || s.totalAbsences >= 5 ? (
                            <span className="text-[10px] text-rose-700 font-bold mt-0.5 flex items-center gap-0.5">
                              ⚠️ {lang === 'ar' ? 'بحاجة لتدخل عاجل' : 'Needs Intervention'}
                            </span>
                          ) : s.attendanceRate < 90 || s.totalAbsences >= 3 ? (
                            <span className="text-[10px] text-amber-700 font-medium mt-0.5">
                              ⚡ {lang === 'ar' ? 'إنذار متابعة' : 'Watch list'}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedStudentForBehaviour(s)}
                          className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                          title="عرض وتدوين سجل السلوك والمكافآت"
                        >
                          <Award className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            {studentIncidents.length > 0
                              ? `${pointsSum >= 0 ? '+' : ''}${pointsSum} (${studentIncidents.length})`
                              : lang === 'ar' ? 'سجل السلوك' : 'Behavior'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedStudentForQR(s)}
                          className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                          title="عرض وتحميل بطاقة الحضور بالـ QR"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                          <span>رمز الـ QR</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isTransferred ? (
                            <>
                              <button
                                onClick={() => restoreStudent(s.id)}
                                className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                                title="إلغاء إجراء النقل واستعادة قيد الطالب للدوام"
                              >
                                <RotateCcw className="w-3 h-3 text-emerald-700" />
                                <span>{lang === 'ar' ? 'استعادة' : 'Restore'}</span>
                              </button>
                              <button
                                onClick={() => setStudentToDelete(s)}
                                className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                                title="حذف نهائي لسجل الطالب"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                                <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setStudentToTransfer(s)}
                                className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                                title="نقل رسمي لمدرسة أخرى وإخفاؤه من كشوف الحضور"
                              >
                                <ArrowRightLeft className="w-3 h-3 text-amber-700" />
                                <span>{lang === 'ar' ? 'نقل لمدرسة' : 'Transfer'}</span>
                              </button>
                              <button
                                onClick={() => setStudentToDelete(s)}
                                className="inline-flex items-center p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="حذف سجل الطالب نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
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
      </div>

      {/* 2-STAGE CSV IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>{lang === 'ar' ? 'استيراد قائمة الطلاب عبر ملف CSV' : 'Import Students via CSV'}</span>
                </h3>
                <span className="text-xs text-slate-500">
                  المرحلة {importStage} من 2: {importStage === 1 ? 'اختيار أو رفع ملف CSV' : 'المعاينة والفحص قبل الحفظ'}
                </span>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STAGE 1: FILE UPLOAD OR TEXT INPUT */}
            {importStage === 1 && (
              <div className="space-y-4 text-xs">
                {/* Guidelines note */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'ar' ? 'تعليمات استيراد ملف CSV:' : 'CSV Guidelines:'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'تنزيل ملف القالب النموذجي' : 'Download Sample CSV'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    يجب أن يحتوي الملف على الأعمدة التالية (الرقم المدرسي، السجل المدني، اسم الطالب، المرحلة، الفصل، ولي الأمر، الهاتف). يدعم النظام ترميز UTF-8 واللغة العربية تلقائياً.
                  </p>
                </div>

                {/* Drag-and-drop file upload box */}
                <div>
                  <label className="font-semibold text-slate-800 block mb-1.5">
                    {lang === 'ar' ? 'اختر أو اسحب ملف CSV من جهازك:' : 'Select or drag CSV file:'}
                  </label>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : uploadedFile
                        ? 'border-emerald-400 bg-emerald-50/20'
                        : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-400'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    {uploadedFile ? (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{uploadedFile.name}</div>
                          <div className="text-slate-500 text-[11px]">
                            حجم الملف: {(uploadedFile.size / 1024).toFixed(1)} كيلوبايت · جاهز للتحقق
                          </div>
                        </div>
                        <div className="pt-1 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedFile(null);
                              setRawCsvText('');
                            }}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold"
                          >
                            إلغاء واختيار ملف آخر
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <div>
                          <span className="font-bold text-slate-800 block">
                            اسحب وأفلت ملف CSV هنا، أو انقر للتصفح
                          </span>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            الملفات المدعومة: CSV (.csv) بترميز UTF-8
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Or paste CSV text directly */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-800">
                      {lang === 'ar' ? 'أو الصق محتوى CSV مباشرةً:' : 'Or paste CSV data directly:'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setRawCsvText(sampleImportText);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline"
                    >
                      {lang === 'ar' ? 'تجربة عينة طلاب نموذجية' : 'Load Demo Sample'}
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={rawCsvText}
                    onChange={(e) => {
                      setRawCsvText(e.target.value);
                      if (uploadedFile) setUploadedFile(null);
                    }}
                    placeholder="الرقم المدرسي,السجل المدني,اسم الطالب,المرحلة,الفصل,ولي الأمر,الهاتف..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleValidateInput}
                    disabled={!rawCsvText.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold cursor-pointer shadow-xs"
                  >
                    <span>{lang === 'ar' ? 'الانتقال للمعاينة والتحقق الآلي' : 'Validate & Preview'}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: VALIDATION PREVIEW */}
            {importStage === 2 && (
              <div className="space-y-4 text-xs">
                {importResultSummary ? (
                  <div className="bg-emerald-50 border border-emerald-300 p-5 rounded-xl text-center space-y-2.5">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-emerald-900 text-base">
                      {lang === 'ar' ? 'تم استيراد واعتماد قائمة الطلاب بنجاح!' : 'Import Completed Successfully!'}
                    </h4>
                    <p className="text-emerald-800 text-xs max-w-md mx-auto leading-relaxed">
                      نجح استيراد وتأسيس <strong>{importResultSummary.imported}</strong> طالب جديد في كشوف المدرسة، وتم استبعاد <strong>{importResultSummary.duplicates}</strong> سجل مكرر لحماية سلامة قاعدة البيانات.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={handleCloseModal}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2 rounded-lg font-bold cursor-pointer shadow-xs"
                      >
                        {lang === 'ar' ? 'إغلاق والعودة لسجل الطلاب' : 'Done'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Validation Summary Cards */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                        <span className="text-[11px] text-slate-500 block">إجمالي الصفوف المفحوصة</span>
                        <span className="text-lg font-bold text-slate-900">{validatedRows.length}</span>
                      </div>
                      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-center">
                        <span className="text-[11px] text-emerald-700 block font-semibold">جاهز للحفظ (صالح)</span>
                        <span className="text-lg font-bold text-emerald-800">{validCount}</span>
                      </div>
                      <div className="bg-rose-50 p-3 rounded-lg border border-rose-200 text-center">
                        <span className="text-[11px] text-rose-700 block font-semibold">أخطاء أو مكرر (مستبعد)</span>
                        <span className="text-lg font-bold text-rose-800">{errorCount}</span>
                      </div>
                    </div>

                    {/* Filter tabs and error report download */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px]">عرض:</span>
                        <button
                          type="button"
                          onClick={() => setPreviewFilter('all')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                            previewFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          الكل ({validatedRows.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewFilter('valid')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                            previewFilter === 'valid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          الصالحة فقط ({validCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewFilter('errors')}
                          className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                            previewFilter === 'errors' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          المستبعدة ({errorCount})
                        </button>
                      </div>

                      {errorCount > 0 && (
                        <button
                          type="button"
                          onClick={handleDownloadErrorReport}
                          className="flex items-center gap-1 text-rose-700 hover:text-rose-900 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تنزيل تقرير الأخطاء CSV</span>
                        </button>
                      )}
                    </div>

                    {/* Preview Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">الصف</th>
                            <th className="py-2.5 px-3">اسم الطالب</th>
                            <th className="py-2.5 px-3">الرقم المدرسي</th>
                            <th className="py-2.5 px-3">السجل المدني</th>
                            <th className="py-2.5 px-3">الفصل</th>
                            <th className="py-2.5 px-3">نتيجة التحقق</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {previewDisplayRows.map((row) => (
                            <tr
                              key={row.rowNumber}
                              className={row.isValid ? 'bg-white' : 'bg-rose-50/60'}
                            >
                              <td className="py-2 px-3 font-mono text-slate-400">{row.rowNumber}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900">{row.fullName}</td>
                              <td className="py-2 px-3 font-mono text-slate-600">{row.studentNumber || '---'}</td>
                              <td className="py-2 px-3 font-mono text-slate-600">{row.nationalId || '---'}</td>
                              <td className="py-2 px-3 text-slate-700">{row.className}</td>
                              <td className="py-2 px-3">
                                {row.isValid ? (
                                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>جاهز للحفظ</span>
                                  </span>
                                ) : (
                                  <span className="text-rose-700 font-semibold flex items-center gap-1" title={row.errorReason}>
                                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate max-w-[200px]">{row.errorReason}</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setImportStage(1)}
                        className="px-3.5 py-2 text-xs border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        {lang === 'ar' ? 'رجوع لتعديل الملف' : 'Back'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCloseModal}
                          className="px-3.5 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCommitImport}
                          disabled={validCount === 0}
                          className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold cursor-pointer shadow-xs"
                        >
                          {lang === 'ar'
                            ? `اعتماد وحفظ (${validCount}) طلاب صالحين`
                            : `Commit (${validCount}) Valid Students`}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
};
