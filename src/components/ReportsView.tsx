import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  BarChart3,
  Download,
  Printer,
  AlertTriangle,
  TrendingUp,
  Users,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  FileText,
  Filter,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { OfficialReportModal } from './OfficialReportModal';

export const ReportsView: React.FC = () => {
  const { students, sessions, justifications, lang, currentTenant } = useAttendance();

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [reportType, setReportType] = useState<'full' | 'chronic_only' | 'sessions'>('full');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  // Filtered dataset
  const filteredStudents = students.filter((s) => {
    if (selectedClass !== 'all' && s.className !== selectedClass) return false;
    if (reportType === 'chronic_only') return s.totalAbsences >= 3;
    return true;
  });

  // Calculate overall metrics
  const totalStudents = students.length;
  const averageAttendanceRate =
    totalStudents > 0
      ? (students.reduce((acc, s) => acc + s.attendanceRate, 0) / totalStudents).toFixed(1)
      : '100';

  // Chronic absence risk tiers
  const tier3Plus = students.filter((s) => s.totalAbsences >= 3 && s.totalAbsences < 5);
  const tier5Plus = students.filter((s) => s.totalAbsences >= 5 && s.totalAbsences < 8);
  const tier8Plus = students.filter((s) => s.totalAbsences >= 8);

  // Group by Class
  const classBreakdown: Record<string, { total: number; absentSum: number; avgRate: number }> = {};
  students.forEach((s) => {
    if (!classBreakdown[s.className]) {
      classBreakdown[s.className] = { total: 0, absentSum: 0, avgRate: 0 };
    }
    classBreakdown[s.className].total += 1;
    classBreakdown[s.className].absentSum += s.totalAbsences;
  });

  Object.keys(classBreakdown).forEach((cName) => {
    const item = classBreakdown[cName];
    const totalPossibleDays = 20 * item.total;
    const rate = totalPossibleDays > 0 ? ((totalPossibleDays - item.absentSum) / totalPossibleDays) * 100 : 100;
    item.avgRate = parseFloat(rate.toFixed(1));
  });

  // 1. Download formatted Excel Workbook (.xls with native styling & RTL)
  const handleDownloadExcelWorkbook = () => {
    const studentsList = filteredStudents;
    const today = new Date().toISOString().split('T')[0];

    const rowsHtml = studentsList
      .sort((a, b) => b.totalAbsences - a.totalAbsences)
      .map(
        (s, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${s.studentNumber}</td>
          <td><b>${s.fullName}</b></td>
          <td>${s.nationalId}</td>
          <td>${s.grade}</td>
          <td>${s.className}</td>
          <td style="color:${s.totalAbsences >= 8 ? '#dc2626' : s.totalAbsences >= 5 ? '#d97706' : '#1e293b'};font-weight:bold;">${s.totalAbsences}</td>
          <td>${s.totalLates}</td>
          <td style="font-weight:bold;color:#047857;">${s.attendanceRate}%</td>
          <td>${s.totalAbsences >= 8 ? 'حرج (8+ أيام - إنذار نهائي)' : s.totalAbsences >= 5 ? 'مرتفع (5+ أيام - إنذار ثان)' : s.totalAbsences >= 3 ? 'تنبيه أولي' : 'منضبط'}</td>
          <td>${s.guardianName}</td>
          <td dir="ltr">${s.guardianPhone}</td>
          <td>${s.bloodType || 'O+'}</td>
        </tr>
      `
      )
      .join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>كشف الحضور المدرسي</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; }
          table { border-collapse: collapse; width: 100%; direction: rtl; }
          th { background-color: #047857; color: white; border: 1px solid #065f46; padding: 10px; font-weight: bold; text-align: right; }
          td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
          .title-header { font-size: 18px; font-weight: bold; color: #047857; text-align: center; }
          .sub-header { font-size: 13px; color: #475569; text-align: center; }
          .summary-card { background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="13" class="title-header">${currentTenant.name} - تقرير الحضور والانضباط المدرسي</td>
          </tr>
          <tr>
            <td colspan="13" class="sub-header">العام الدراسي: ${currentTenant.academicYear} | ${currentTenant.currentTerm} | التاريخ: ${today}</td>
          </tr>
          <tr><td colspan="13"></td></tr>
          <tr class="summary-card">
            <td colspan="3">إجمالي الطلاب: ${studentsList.length}</td>
            <td colspan="4">متوسط الحضور: ${avgRate}%</td>
            <td colspan="3">إنذار 5+ أيام: ${studentsList.filter((s) => s.totalAbsences >= 5).length}</td>
            <td colspan="3">إنذار نهائي 8+ أيام: ${studentsList.filter((s) => s.totalAbsences >= 8).length}</td>
          </tr>
          <tr><td colspan="13"></td></tr>
          <thead>
            <tr>
              <th>#</th>
              <th>الرقم المدرسي</th>
              <th>اسم الطالب</th>
              <th>السجل المدني</th>
              <th>المرحلة</th>
              <th>الفصل</th>
              <th>أيام الغياب</th>
              <th>التأخر (مرات)</th>
              <th>نسبة الحضور %</th>
              <th>التصنيف الإجرائي</th>
              <th>ولي الأمر</th>
              <th>هاتف التواصل</th>
              <th>فصيلة الدم</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_حضور_${currentTenant.code}_${today}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccessMsg('تم تنزيل مستند Excel (.xls) المنسق بنجاح وجاهز للأرشفة الخارجية.');
    setTimeout(() => setDownloadSuccessMsg(null), 5000);
  };

  // 2. Download standard CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = [
      'الرقم المدرسي',
      'اسم الطالب',
      'السجل المدني',
      'المرحلة',
      'الفصل',
      'إجمالي الغياب',
      'إجمالي التأخر',
      'نسبة الحضور %',
      'مستوى الخطورة',
      'ولي الأمر',
      'هاتف ولي الأمر',
      'فصيلة الدم',
    ];

    const rows = filteredStudents.map((s) => [
      `"${s.studentNumber}"`,
      `"${s.fullName}"`,
      `"${s.nationalId}"`,
      `"${s.grade}"`,
      `"${s.className}"`,
      s.totalAbsences,
      s.totalLates,
      `"${s.attendanceRate}%"`,
      `"${s.totalAbsences >= 8 ? 'حرج (8+ أيام)' : s.totalAbsences >= 5 ? 'مرتفع (5+ أيام)' : 'طبيعي'}"`,
      `"${s.guardianName}"`,
      `"${s.guardianPhone}"`,
      `"${s.bloodType || 'O+'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_حضور_${currentTenant.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccessMsg('تم تنزيل ملف CSV المعتمد بترميز UTF-8 بنجاح.');
    setTimeout(() => setDownloadSuccessMsg(null), 5000);
  };

  const avgRate =
    filteredStudents.length > 0
      ? (
          filteredStudents.reduce((acc, s) => acc + s.attendanceRate, 0) /
          filteredStudents.length
        ).toFixed(1)
      : '100';

  return (
    <div className="space-y-6">
      {/* Download Confirmation Toast */}
      {downloadSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{downloadSuccessMsg}</span>
          </div>
          <button onClick={() => setDownloadSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* External Record-Keeping Download Center Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 rounded-2xl p-6 text-white shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              مركز تنزيل وتصدير التقارير
            </span>
            <span className="text-slate-400 text-xs">· للأرشفة الرسمية وسجلات الوزارة</span>
          </div>
          <h2 className="text-xl font-bold">
            {lang === 'ar' ? 'تصدير بيانات الحضور والمواظبة (PDF & Excel)' : 'Export Attendance Records'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            {lang === 'ar'
              ? 'أداة مخصصة لمديري المدارس ومسؤولي شؤون الطلبة لاستخراج كشوف الحضور كوثيقة PDF رسمية موقعة أو جداول بيانات Excel مجهزة بالكامل للأرشفة الخارجية والتقارير الرقابية.'
              : 'Download complete school attendance records as official printable PDF documents or formatted Excel spreadsheets.'}
          </p>

          {/* Filtering controls inside center */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-slate-300">الفصل:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="all" className="text-slate-900">جميع الفصول</option>
                <option value="10 / أ" className="text-slate-900">10 / أ</option>
                <option value="10 / ب" className="text-slate-900">10 / ب</option>
                <option value="11 / أ" className="text-slate-900">11 / أ</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-slate-300">نوع الكشف:</span>
              <select
                value={reportType}
                onChange={(e: any) => setReportType(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="full" className="text-slate-900">كشف الحضور الشامل لجميع الطلاب</option>
                <option value="chronic_only" className="text-slate-900">حالات الغياب المتكرر والإنذارات فقط</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons: PDF & Excel */}
        <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0">
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            <FileText className="w-4 h-4 text-slate-950" />
            <span>{lang === 'ar' ? 'تنزيل مستند PDF رسمي معتمد' : 'Download Official PDF Report'}</span>
          </button>

          <button
            onClick={handleDownloadExcelWorkbook}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-5 py-2.5 rounded-xl border border-white/20 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>{lang === 'ar' ? 'تنزيل ملف إكسل منسق (Excel .xls)' : 'Download Formatted Excel (.xls)'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تنزيل بصيغة CSV خام (UTF-8)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">
              {lang === 'ar' ? 'متوسط نسبة الحضور العامة' : 'Average Attendance Rate'}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700">{averageAttendanceRate}%</span>
            <span className="text-xs text-slate-500">من المستهدف 95%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">
              {lang === 'ar' ? 'إجمالي المقيدين' : 'Total Students'}
            </span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalStudents}</span>
            <span className="text-xs text-slate-500">طالب في المدرسة</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-700">
              {lang === 'ar' ? 'إنذار مرحلة ثانية (5+ أيام)' : 'Tier 2 Risk (5+ Days)'}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">{tier5Plus.length}</span>
            <span className="text-xs text-slate-500">بحاجة لإنذار خطي</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700">
              {lang === 'ar' ? 'حالات حرجة (8+ أيام غياب)' : 'Critical (8+ Days)'}
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700">{tier8Plus.length}</span>
            <span className="text-xs text-rose-600 font-semibold">تحويل للمرشد الطلابي</span>
          </div>
        </div>
      </div>

      {/* Class Comparison and Risk Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Class Attendance Breakdown Bar visualization */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">
            {lang === 'ar' ? 'مقارنة نسبة الحضور حسب الفصول الدراسية' : 'Attendance by Class'}
          </h3>

          <div className="space-y-3.5">
            {Object.entries(classBreakdown).map(([cName, data]) => (
              <div key={cName} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{cName}</span>
                  <div className="space-x-2 space-x-reverse">
                    <span className="font-mono font-bold text-slate-900">{data.avgRate}%</span>
                    <span className="text-slate-400">({data.total} طلاب)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      data.avgRate >= 95
                        ? 'bg-emerald-500'
                        : data.avgRate >= 88
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(10, data.avgRate))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chronic Absence Warning Table */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{lang === 'ar' ? 'سجل متابعة الغياب المتكرر والإنذارات' : 'Chronic Absence Interventions'}</span>
            </h3>
            <span className="text-[11px] text-slate-500">حسب لائحة المواظبة</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {students
              .filter((s) => s.totalAbsences >= 3)
              .sort((a, b) => b.totalAbsences - a.totalAbsences)
              .map((s) => {
                const isCritical = s.totalAbsences >= 8;
                const isWarning = s.totalAbsences >= 5;

                return (
                  <div key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">{s.fullName}</div>
                      <div className="text-[11px] text-slate-500">
                        {s.className} · ولي الأمر: {s.guardianName} ({s.guardianPhone})
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                          isCritical
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                            : isWarning
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-slate-100 border-slate-300 text-slate-800'
                        }`}
                      >
                        {s.totalAbsences} {lang === 'ar' ? 'أيام غياب' : 'absences'}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {isCritical
                          ? 'إحالة للتوجيه والإنذار النهائي'
                          : isWarning
                          ? 'إنذار خطي لولي الأمر'
                          : 'إشعار متابعة أول'}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Official PDF Document Modal */}
      {isPdfModalOpen && (
        <OfficialReportModal
          selectedClassFilter={selectedClass}
          reportType={reportType}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}
    </div>
  );
};
