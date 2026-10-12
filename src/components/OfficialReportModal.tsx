import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAttendance } from '../context/AttendanceContext';
import { Student } from '../types/attendance';
import { downloadNativePdfFromHtml, printNativePdfFromHtml } from '../utils/pdfExport';
import {
  FileText,
  Printer,
  Download,
  X,
  Building,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Award,
  Loader2,
} from 'lucide-react';

interface OfficialReportModalProps {
  onClose: () => void;
  selectedClassFilter: string;
  reportType: 'full' | 'chronic_only' | 'sessions';
}

export const OfficialReportModal: React.FC<OfficialReportModalProps> = ({
  onClose,
  selectedClassFilter,
  reportType,
}) => {
  const { students, sessions, currentTenant, schoolProfile, lang, currentUser } = useAttendance();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Filter students based on selection
  const filteredStudents = students.filter((s) => {
    if (selectedClassFilter !== 'all' && s.className !== selectedClassFilter) {
      return false;
    }
    if (reportType === 'chronic_only') {
      return s.totalAbsences >= 3;
    }
    return true;
  });

  const totalEnrolled = filteredStudents.length;
  const avgRate =
    totalEnrolled > 0
      ? (
          filteredStudents.reduce((acc, s) => acc + s.attendanceRate, 0) /
          totalEnrolled
        ).toFixed(1)
      : '100';

  const criticalCount = filteredStudents.filter((s) => s.totalAbsences >= 8).length;
  const warningCount = filteredStudents.filter((s) => s.totalAbsences >= 5 && s.totalAbsences < 8).length;

  const todayStr = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleDownloadVectorPdf = async () => {
    if (!printAreaRef.current) {
      window.print();
      return;
    }

    setIsGeneratingPdf(true);
    const html = printAreaRef.current.innerHTML;
    const reportTitle = `${currentTenant.name} - ${
      reportType === 'chronic_only' ? 'تقرير حالات الغياب المتكرر والإنذارات' : 'التقرير الإحصائي الشامل للحضور'
    }`;
    const filename = `تقرير_حضور_${currentTenant.code}_${todayStr.replace(/\s+/g, '_')}.pdf`;

    await downloadNativePdfFromHtml({
      htmlContent: html,
      title: reportTitle,
      filename,
    });
    setIsGeneratingPdf(false);
  };

  const handleBrowserPrint = () => {
    if (printAreaRef.current) {
      const html = printAreaRef.current.innerHTML;
      const reportTitle = `${currentTenant.name} - ${
        reportType === 'chronic_only' ? 'تقرير حالات الغياب المتكرر والإنذارات' : 'التقرير الإحصائي الشامل للحضور'
      }`;
      printNativePdfFromHtml({
        htmlContent: html,
        title: reportTitle,
      });
    } else {
      window.print();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto w-screen h-screen print:p-0 print:bg-white print:static print:block"
      style={{ margin: 0, padding: '0.75rem', left: 0, top: 0, right: 0, bottom: 0 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-h-[94dvh] overflow-y-auto my-auto print:max-h-none print:shadow-none print:p-0 print:overflow-visible border border-slate-200">
        {/* Controls Header (Hidden during Print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden modal-controls-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {lang === 'ar'
                  ? 'معاينة التقرير الرسمي المعتمد (PDF جاهز للطباعة والأرشفة)'
                  : 'Official Attendance Report (Print / PDF Preview)'}
              </h3>
              <p className="text-xs text-slate-500">
                {currentTenant.name} · مستند رسمي مهيأ لسجلات الوزارة والأرشفة الخارجية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadVectorPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
              title="توليد وحفظ ملف PDF أصلي ذو نصوص حقيقية"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'ar' ? 'جارٍ تصدير PDF...' : 'Generating PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تنزيل مستند PDF أصلي' : 'Download Vector PDF'}</span>
                </>
              )}
            </button>

            <button
              onClick={handleBrowserPrint}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة مباشرة' : 'Print'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL REPORT CANVAS */}
        <div
          ref={printAreaRef}
          className="border border-slate-200 rounded-xl p-8 bg-white text-slate-900 space-y-6 print:border-none print:p-0 print:shadow-none"
        >
          {/* Official Ministry / School Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4 text-xs">
            <div className="space-y-1 text-right">
              <div className="font-bold text-sm text-slate-900 whitespace-pre-line">
                {schoolProfile.ministryHeaderAr || 'المملكة العربية السعودية\nوزارة التعليم'}
              </div>
              <div className="text-slate-700 font-semibold">{schoolProfile.schoolName || currentTenant.name}</div>
              <div className="text-[11px] text-slate-500">كود المنشأة: {schoolProfile.schoolCode || currentTenant.code}</div>
              {schoolProfile.directorateAr && (
                <div className="text-[10px] text-slate-500">{schoolProfile.directorateAr}</div>
              )}
            </div>

            <div className="text-center space-y-1">
              {schoolProfile.logoUrl ? (
                <img
                  src={schoolProfile.logoUrl}
                  alt={schoolProfile.schoolName}
                  className="w-12 h-12 rounded-xl object-contain mx-auto shadow-xs border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-sm">
                  ح
                </div>
              )}
              <div className="font-bold text-sm text-slate-900">تقرير الانضباط والحضور المدرسي</div>
              <div className="text-xs text-emerald-800 font-semibold">
                {reportType === 'chronic_only' ? 'كشف حالات الغياب المتكرر والإنذارات' : 'التقرير الإحصائي الشامل للطلاب'}
              </div>
            </div>

            <div className="space-y-1 text-left" dir="ltr">
              <div className="font-mono text-slate-700">التاريخ: {todayStr}</div>
              <div className="font-mono text-slate-700">العام: {schoolProfile.academicYear?.hijriYear || currentTenant.academicYear}</div>
              <div className="font-mono text-slate-700">
                {schoolProfile.academicYear?.terms?.find((t) => t.isActive)?.nameAr || currentTenant.currentTerm}
              </div>
              <div className="text-slate-500 text-[10px]">نطاق الفصل: {selectedClassFilter === 'all' ? 'جميع الفصول' : selectedClassFilter}</div>
            </div>
          </div>

          {/* Report Executive Summary Metrics */}
          <div className="grid grid-cols-4 gap-3 text-xs border border-slate-200 rounded-lg p-3 bg-slate-50/70">
            <div>
              <span className="text-slate-500 block text-[11px]">إجمالي الطلاب المقيدين:</span>
              <strong className="text-base text-slate-900 font-bold">{totalEnrolled} طالب</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">متوسط نسبة الحضور:</span>
              <strong className="text-base text-emerald-700 font-bold">{avgRate}%</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">حالات الإنذار الثاني (5+ أيام):</span>
              <strong className="text-base text-amber-700 font-bold">{warningCount} طالب</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">حالات حرجة (8+ أيام):</span>
              <strong className="text-base text-rose-700 font-bold">{criticalCount} طالب</strong>
            </div>
          </div>

          {/* Students Roster Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-slate-900 flex items-center justify-between">
              <span>كشف بيانات الطلاب والمواظبة:</span>
              <span className="text-[11px] text-slate-500 font-normal">
                (مرتبة حسب معدل الغياب والخطورة)
              </span>
            </h4>

            <table className="w-full text-right text-xs border border-slate-300 divide-y divide-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold text-[11px]">
                <tr>
                  <th className="py-2 px-2.5 border-l border-slate-300 w-10">م</th>
                  <th className="py-2 px-3 border-l border-slate-300">اسم الطالب</th>
                  <th className="py-2 px-2.5 border-l border-slate-300">الرقم المدرسي</th>
                  <th className="py-2 px-2.5 border-l border-slate-300">السجل المدني</th>
                  <th className="py-2 px-2.5 border-l border-slate-300">الفصل</th>
                  <th className="py-2 px-2 border-l border-slate-300 text-center">أيام الغياب</th>
                  <th className="py-2 px-2 border-l border-slate-300 text-center">التأخر</th>
                  <th className="py-2 px-2.5 border-l border-slate-300 text-center">نسبة الحضور</th>
                  <th className="py-2 px-3">التصنيف الإجرائي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                {filteredStudents
                  .sort((a, b) => b.totalAbsences - a.totalAbsences)
                  .map((s, index) => {
                    const isCritical = s.totalAbsences >= 8;
                    const isWarning = s.totalAbsences >= 5;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 border-l border-slate-200 font-mono text-slate-500">{index + 1}</td>
                        <td className="py-2 px-3 border-l border-slate-200 font-bold text-slate-900">{s.fullName}</td>
                        <td className="py-2 px-2.5 border-l border-slate-200 font-mono text-slate-700">{s.studentNumber}</td>
                        <td className="py-2 px-2.5 border-l border-slate-200 font-mono text-slate-700">{s.nationalId}</td>
                        <td className="py-2 px-2.5 border-l border-slate-200">{s.className}</td>
                        <td className="py-2 px-2 border-l border-slate-200 text-center font-bold font-mono">
                          <span className={isCritical ? 'text-rose-700' : isWarning ? 'text-amber-700' : 'text-slate-800'}>
                            {s.totalAbsences}
                          </span>
                        </td>
                        <td className="py-2 px-2 border-l border-slate-200 text-center font-mono text-slate-600">{s.totalLates}</td>
                        <td className="py-2 px-2.5 border-l border-slate-200 text-center font-mono font-bold">
                          {s.attendanceRate}%
                        </td>
                        <td className="py-2 px-3">
                          {isCritical ? (
                            <span className="font-bold text-rose-800">إنذار نهائي وإحالة للتوجيه</span>
                          ) : isWarning ? (
                            <span className="font-semibold text-amber-800">إنذار خطي لولي الأمر</span>
                          ) : s.totalAbsences >= 3 ? (
                            <span className="text-slate-700">إشعار تنبيه أولي</span>
                          ) : (
                            <span className="text-emerald-700">منضبط (حالة ممتازة)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Legal and Regulatory Attestation */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">إقرار ومصادقة إدارة المدرسة:</span>
            <p className="leading-relaxed">
              {schoolProfile.officialReportFooterNote ||
                'تم استخراج هذا الكشف آلياً وفق سجلات الحضور اليومي لكافة الحصص والأنشطة المدرسية، ويعد وثيقة رسمية معتمدة لحساب نسب المواظبة وتطبيق إجراءات الحرمان المنصوص عليها في لائحة السلوك والمواظبة المعتمدة من وزارة التعليم.'}
            </p>
          </div>

          {/* Official Signatures & Seal Section */}
          <div className="pt-6 grid grid-cols-4 gap-4 text-center text-xs border-t border-slate-200">
            <div className="space-y-6">
              <div>
                <span className="font-bold text-slate-800 block">الموجه الطلابي</span>
                <span className="text-[11px] text-slate-500">
                  {schoolProfile.leadership?.socialWorkerName || 'أ. ماجد بن عبد العزيز التميمي'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">التوقيع: ............................</div>
            </div>

            <div className="space-y-6">
              <div>
                <span className="font-bold text-slate-800 block">وكيل شؤون الطلاب</span>
                <span className="text-[11px] text-slate-500">
                  {schoolProfile.leadership?.vicePrincipalStudentAffairsName || 'أ. فهد بن إبراهيم المنصور'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">التوقيع: ............................</div>
            </div>

            <div className="space-y-2">
              {schoolProfile.stampUrl ? (
                <img
                  src={schoolProfile.stampUrl}
                  alt="ختم المدرسة"
                  className="w-16 h-16 object-contain mx-auto"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 mx-auto flex items-center justify-center text-[9px] text-slate-400">
                  ختم المدرسة الرسمي
                </div>
              )}
              <span className="text-[10px] text-slate-500 block">مصادق عليه إلكترونياً</span>
            </div>

            <div className="space-y-6">
              <div>
                <span className="font-bold text-slate-800 block">مدير المدرسة</span>
                <span className="text-[11px] text-slate-500">
                  {schoolProfile.leadership?.principalName || 'أ. عبد الرحمن السعدي'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">التوقيع: ............................</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
