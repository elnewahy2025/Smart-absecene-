import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Student } from '../../types/attendance';
import { useAttendance } from '../../context/AttendanceContext';
import { Printer, Download, X, Layers, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { downloadNativePdfFromHtml, printNativePdfFromHtml } from '../../utils/pdfExport';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
}

export const BatchPrintCenterModal: React.FC<Props> = ({ isOpen, onClose, students }) => {
  const { currentTenant, schoolProfile, lang } = useAttendance();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<'attendance_sheet' | 'warning_notice' | 'roster'>('attendance_sheet');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });

  if (!isOpen) return null;

  const classNames = Array.from(new Set(students.map((s) => s.className).filter(Boolean))).sort();

  const filteredStudents = students.filter((s) => {
    if (selectedClass !== 'all' && s.className !== selectedClass) return false;
    if (selectedDocType === 'warning_notice') return s.totalAbsences >= 3;
    return true;
  });

  const todayStr = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    const html = printAreaRef.current.innerHTML;
    const title = `${schoolProfile.schoolName || currentTenant.name} - طباعة مجمعة (${selectedDocType})`;
    const filename = `طباعة_مجمعة_${currentTenant.code}_${Date.now()}.pdf`;

    await downloadNativePdfFromHtml({
      htmlContent: html,
      title,
      filename,
    });
    setIsGeneratingPdf(false);
  };

  const handlePrint = () => {
    if (!printAreaRef.current) return;
    const html = printAreaRef.current.innerHTML;
    const title = `${schoolProfile.schoolName || currentTenant.name} - طباعة مجمعة (${selectedDocType})`;
    printNativePdfFromHtml({
      htmlContent: html,
      title,
    });
  };

  const content = (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 z-50 animate-in fade-in duration-150"
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-right">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {lang === 'ar' ? 'مركز الطباعة المجمعة للمستندات المدرسية' : 'Batch Print Center'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {schoolProfile.schoolName || currentTenant.name} · استخراج وتصدير مستندات متعددة دفعة واحدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>تنزيل PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة مباشرة</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Strip */}
        <div className="p-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div>
              <label className="text-slate-500 block mb-0.5 text-[10px]">نوع المستند:</label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800"
              >
                <option value="attendance_sheet">كشف رصد الحضور الأسبوعي</option>
                <option value="warning_notice">إشعارات الإنذار الخطي (3+ أيام)</option>
                <option value="roster">مسير الطلاب الرسمي الشامل</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 block mb-0.5 text-[10px]">نطاق الفصل:</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800"
              >
                <option value="all">كافة الفصول ({students.length} طالب)</option>
                {classNames.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            المستندات الجاهزة: <strong className="text-primary">{filteredStudents.length}</strong> سجل
          </div>
        </div>

        {/* Printable Canvas */}
        <div ref={printAreaRef} className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between text-xs">
            <div className="text-right space-y-0.5">
              <div className="font-bold whitespace-pre-line text-slate-900">
                {schoolProfile.ministryHeaderAr || 'المملكة العربية السعودية\nوزارة التعليم'}
              </div>
              <div className="font-semibold text-slate-800">{schoolProfile.schoolName || currentTenant.name}</div>
            </div>
            <div className="text-center">
              <h2 className="font-bold text-sm text-slate-900">
                {selectedDocType === 'attendance_sheet' && 'كشف متابعة الحضور والغياب الأسبوعي'}
                {selectedDocType === 'warning_notice' && 'إشعارات إنذار الغياب المجمعة'}
                {selectedDocType === 'roster' && 'مسير الطلاب المقيدين الرسمي'}
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">التاريخ: {todayStr}</span>
            </div>
            <div className="text-left font-mono text-slate-600" dir="ltr">
              <div>كود: {schoolProfile.schoolCode || currentTenant.code}</div>
              <div>العام: {schoolProfile.academicYear?.hijriYear || currentTenant.academicYear}</div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-right text-xs border border-slate-300 border-collapse">
            <thead className="bg-slate-100 text-slate-800 text-[11px] font-bold">
              <tr>
                <th className="p-2 border border-slate-300 w-10 text-center">م</th>
                <th className="p-2 border border-slate-300">اسم الطالب</th>
                <th className="p-2 border border-slate-300">الرقم المدرسي</th>
                <th className="p-2 border border-slate-300">الفصل</th>
                <th className="p-2 border border-slate-300 text-center">أيام الغياب</th>
                <th className="p-2 border border-slate-300 text-center">نسبة الحضور</th>
                <th className="p-2 border border-slate-300">ولي الأمر / الهاتف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {filteredStudents.map((s, index) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-200 text-center font-mono text-slate-500">{index + 1}</td>
                  <td className="p-2 border border-slate-200 font-bold text-slate-900">{s.fullName}</td>
                  <td className="p-2 border border-slate-200 font-mono text-slate-700">{s.studentNumber}</td>
                  <td className="p-2 border border-slate-200">{s.className}</td>
                  <td className="p-2 border border-slate-200 text-center font-bold font-mono">
                    <span className={s.totalAbsences >= 5 ? 'text-rose-700' : 'text-slate-800'}>
                      {s.totalAbsences}
                    </span>
                  </td>
                  <td className="p-2 border border-slate-200 text-center font-bold font-mono">{s.attendanceRate}%</td>
                  <td className="p-2 border border-slate-200 font-mono text-slate-600" dir="ltr">{s.guardianPhone}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legal Signatures */}
          <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs border-t border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">وكيل شؤون الطلاب</span>
              <span className="text-[11px] text-slate-500">
                {schoolProfile.leadership?.vicePrincipalStudentAffairsName || 'أ. فهد بن إبراهيم المنصور'}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-800 block">ختم المدرسة</span>
              <span className="text-[10px] text-slate-400">معتمد إلكترونياً</span>
            </div>
            <div>
              <span className="font-bold text-slate-800 block">مدير المدرسة</span>
              <span className="text-[11px] text-slate-500">
                {schoolProfile.leadership?.principalName || 'أ. عبد الرحمن السعدي'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};
