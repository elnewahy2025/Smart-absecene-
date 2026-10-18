import React, { useState, useRef } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { downloadNativePdfFromHtml, printNativePdfFromHtml } from '../utils/pdfExport';
import {
  ShieldAlert,
  Printer,
  Download,
  Loader2,
  CheckCircle2,
  Users,
  AlertTriangle,
  Building,
  Filter,
  Check,
  Search,
  Sparkles,
} from 'lucide-react';

export const EmergencyRosterView: React.FC = () => {
  const { students, sessions, settings, schoolProfile, lang, currentTenant } = useAttendance();
  const rosterContentRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const availableAssemblyPoints = schoolProfile.assemblyPoints?.map((ap) => ap.name) ||
    settings.emergencyAssemblyPoints || ['نقطة التجمع (أ) - الفناء الرئيسي'];

  const [selectedAssemblyPoint, setSelectedAssemblyPoint] = useState<string>(
    availableAssemblyPoints[0] || 'نقطة التجمع (أ) - الفناء الرئيسي'
  );
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Local state to track physical roll-call checklist at evacuation point
  const [verifiedStudentIds, setVerifiedStudentIds] = useState<Set<string>>(new Set());

  // Derive students' status based on the latest submitted session today
  const latestSession = sessions.find((s) => s.status === 'submitted') || sessions[0];

  const studentStatusList = students.map((std) => {
    // Find record in latest session
    const rec = latestSession?.records.find((r) => r.studentId === std.id);
    const status = rec?.status || 'present';
    const isPresentOnCampus = status === 'present' || status === 'late';
    const isVerifiedAtPoint = verifiedStudentIds.has(std.id);

    return {
      student: std,
      lastStatus: status,
      isPresentOnCampus,
      isVerifiedAtPoint,
      note: rec?.note || '',
    };
  });

  const filteredList = studentStatusList.filter((item) => {
    if (selectedClassFilter !== 'all' && item.student.className !== selectedClassFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.student.fullName.toLowerCase().includes(q) ||
        item.student.nationalId.includes(q) ||
        item.student.studentNumber.includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalEnrolled = students.length;
  const totalPresentOnCampus = studentStatusList.filter((i) => i.isPresentOnCampus).length;
  const totalAbsentToday = studentStatusList.filter((i) => i.lastStatus === 'absent' || i.lastStatus === 'excused_absence').length;
  const totalLeftEarly = studentStatusList.filter((i) => i.lastStatus === 'excused_leave').length;
  const totalVerifiedAtPoint = studentStatusList.filter((i) => i.isVerifiedAtPoint).length;

  const toggleVerify = (id: string) => {
    setVerifiedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportVectorPdf = async () => {
    if (!rosterContentRef.current) {
      window.print();
      return;
    }

    setIsExportingPdf(true);
    const html = rosterContentRef.current.innerHTML;
    const today = new Date().toLocaleDateString('ar-SA');
    const reportTitle = `${currentTenant.name} - كشف الإخلاء الميداني وحصر الطوارئ (${selectedAssemblyPoint})`;
    const filename = `كشف_طوارئ_${currentTenant.code}_${today.replace(/\s+/g, '_')}.pdf`;

    await downloadNativePdfFromHtml({
      htmlContent: html,
      title: reportTitle,
      filename,
    });
    setIsExportingPdf(false);
  };

  const handlePrint = () => {
    if (rosterContentRef.current) {
      const html = rosterContentRef.current.innerHTML;
      const reportTitle = `${currentTenant.name} - كشف الإخلاء الميداني وحصر الطوارئ (${selectedAssemblyPoint})`;
      printNativePdfFromHtml({
        htmlContent: html,
        title: reportTitle,
      });
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 print-root-active">
      {/* High-Density Emergency Operational Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-3 sm:px-4 sm:py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-bold">
            {lang === 'ar' ? 'كشف حصر الطوارئ والإخلاء' : 'Emergency Evacuation Headcount'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 font-medium">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            {lang === 'ar' ? 'بالمبنى:' : 'On Campus:'} <strong className="font-mono text-white">{totalPresentOnCampus}</strong>
          </span>
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-lg">
            {lang === 'ar' ? 'غائبون:' : 'Absent:'} <strong className="font-mono text-white">{totalAbsentToday}</strong>
          </span>
          <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg">
            {lang === 'ar' ? 'مستأذنون:' : 'Left Early:'} <strong className="font-mono text-white">{totalLeftEarly}</strong>
          </span>
          <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
            {lang === 'ar' ? 'حُصروا بنقطة الإخلاء:' : 'At Rally Point:'}{' '}
            <strong className="font-mono text-white">{totalVerifiedAtPoint} / {totalPresentOnCampus}</strong>
          </span>
        </div>
      </div>

      {/* Controls & Filter Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Assembly point selector */}
          <div className="flex items-center gap-2 text-xs">
            <Building className="w-4 h-4 text-slate-500" />
            <label htmlFor="assembly-point-select" className="font-semibold text-slate-700">
              {lang === 'ar' ? 'نقطة التجمع:' : 'Assembly Point:'}
            </label>
            <select
              id="assembly-point-select"
              value={selectedAssemblyPoint}
              onChange={(e) => setSelectedAssemblyPoint(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 cursor-pointer"
            >
              {availableAssemblyPoints.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>
          </div>

          {/* Class selector */}
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="class-filter-select" className="font-semibold text-slate-700">
              {lang === 'ar' ? 'الفصل:' : 'Class:'}
            </label>
            <select
              id="class-filter-select"
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-900 cursor-pointer"
            >
              <option value="all">{lang === 'ar' ? 'جميع الفصول' : 'All Classes'}</option>
              {Array.from(new Set(students.map((s) => s.className).filter(Boolean)))
                .sort()
                .map((cName) => (
                  <option key={cName} value={cName}>
                    {cName}
                  </option>
                ))}
            </select>
          </div>

          {/* Search student */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            <input
              type="text"
              placeholder={lang === 'ar' ? 'بحث بالاسم...' : 'Search name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 print:hidden">
          <button
            onClick={handleExportVectorPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="تنزيل كشف الطوارئ كمستند PDF أصلي بنصوص قابلة للنسخ"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{lang === 'ar' ? 'جارٍ إنشاء PDF...' : 'Generating...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تنزيل PDF أصلي' : 'Export Vector PDF'}</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'ar' ? 'طباعة مباشرة' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div ref={rosterContentRef} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {lang === 'ar' ? 'قائمة التحقق الميداني للطوارئ والإخلاء' : 'Emergency Roll-Call Checklist'}
            </h3>
            <div className="text-[11px] text-slate-500 font-mono flex flex-wrap items-center gap-2 mt-0.5">
              <span>{schoolProfile.schoolName || currentTenant.name}</span>
              <span>·</span>
              <span>{latestSession?.subject || 'كشف اليوم'} ({latestSession?.date})</span>
              {schoolProfile.emergencyHotline && (
                <>
                  <span>·</span>
                  <span className="text-rose-700 font-bold font-mono">طوارئ: {schoolProfile.emergencyHotline}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-600">
            {lang === 'ar' ? 'اضغط على السجل لتأكيد الوجود بنقطة التجمع' : 'Click to verify at rally point'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center w-14 whitespace-nowrap">
                  {lang === 'ar' ? 'تم الحصر' : 'Checked'}
                </th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'ar' ? 'اسم الطالب' : 'Student Name'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'ar' ? 'الفصل الدراسي' : 'Class'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'ar' ? 'حالة الحضور الأخيرة' : 'Last Known Status'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'ar' ? 'هاتف ولي الأمر للطوارئ' : 'Emergency Contact'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'ar' ? 'فصيلة الدم / حالات صحية' : 'Medical Flags'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map(({ student, lastStatus, isPresentOnCampus, isVerifiedAtPoint, note }) => {
                return (
                  <tr
                    key={student.id}
                    onClick={() => toggleVerify(student.id)}
                    className={`transition-colors cursor-pointer ${
                      isVerifiedAtPoint
                        ? 'bg-emerald-50/70 hover:bg-emerald-100/70'
                        : isPresentOnCampus
                        ? 'hover:bg-slate-50'
                        : 'bg-rose-50/30 hover:bg-rose-50/60 opacity-80'
                    }`}
                  >
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div
                        className={`w-5 h-5 mx-auto rounded flex items-center justify-center border transition-colors ${
                          isVerifiedAtPoint
                            ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isVerifiedAtPoint && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{student.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">رقم: {student.studentNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">{student.className}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold border leading-none shadow-2xs ${
                          lastStatus === 'present'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : lastStatus === 'late'
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : lastStatus === 'excused_leave'
                            ? 'bg-sky-100 border-sky-300 text-sky-800'
                            : 'bg-rose-100 border-rose-300 text-rose-800'
                        }`}
                      >
                        {lastStatus === 'present'
                          ? 'متواجد (حاضر)'
                          : lastStatus === 'late'
                          ? 'متواجد (متأخر)'
                          : lastStatus === 'excused_leave'
                          ? 'مستأذن (غادر المبنى)'
                          : 'غائب رسميًا'}
                      </span>
                      {note && <div className="text-[10px] text-slate-500 mt-1">{note}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap" dir="ltr">
                      {student.emergencyContact || student.guardianPhone}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {student.bloodType || ''}
                        </span>
                        {student.medicalConditions && (
                          <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            {student.medicalConditions}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
