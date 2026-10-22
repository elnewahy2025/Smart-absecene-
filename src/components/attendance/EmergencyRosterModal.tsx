import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAttendance } from '../../context/AttendanceContext';
import { downloadNativePdfFromHtml, printNativePdfFromHtml } from '../../utils/pdfExport';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import {
  ShieldAlert,
  Printer,
  Download,
  Loader2,
  Check,
  Search,
  X,
  Phone,
  } from 'lucide-react';

interface EmergencyRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyRosterModal: React.FC<EmergencyRosterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { students, sessions, settings, schoolProfile, lang, currentTenant } = useAttendance();
  const rosterContentRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const availableAssemblyPoints =
    schoolProfile?.assemblyPoints?.map((ap) => ap.name) ||
    settings?.emergencyAssemblyPoints || ['نقطة التجمع (أ) - الفناء الرئيسي'];

  const [selectedAssemblyPoint, setSelectedAssemblyPoint] = useState<string>(
    availableAssemblyPoints[0] || 'نقطة التجمع (أ) - الفناء الرئيسي'
  );
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Local state to track physical roll-call checklist at evacuation point
  const [verifiedStudentIds, setVerifiedStudentIds] = useState<Set<string>>(new Set());
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });

  if (!isOpen) return null;

  // Latest submitted session today for campus presence
  const latestSession = sessions.find((s) => s.status === 'submitted') || sessions[0];

  const studentStatusList = students.map((std) => {
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
  const totalAbsentToday = studentStatusList.filter(
    (i) => i.lastStatus === 'absent' || i.lastStatus === 'excused_absence'
  ).length;
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
    const reportTitle = `${schoolProfile?.schoolName || currentTenant.name} - كشف الإخلاء الميداني وحصر الطوارئ (${selectedAssemblyPoint})`;
    const filename = `كشف_طوارئ_${currentTenant.code}_${today.replace(/\s+/g, '_')}.pdf`;

    await downloadNativePdfFromHtml({
      htmlContent: html,
      title: reportTitle,
      filename,
    });
    setIsExportingPdf(false);
  };

  const handlePrintDirect = () => {
    if (rosterContentRef.current) {
      const html = rosterContentRef.current.innerHTML;
      const reportTitle = `${schoolProfile?.schoolName || currentTenant.name} - كشف الإخلاء الميداني وحصر الطوارئ`;
      printNativePdfFromHtml({
        htmlContent: html,
        title: reportTitle,
      });
    } else {
      window.print();
    }
  };

  return ReactDOM.createPortal(
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Emergency roster" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[94vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-300 dark:border-rose-900/50 flex flex-col overflow-hidden">
        {/* Emergency Alert Bar */}
        <div className="bg-rose-600 text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wide">
                  {lang === 'ar' ? 'وضع الطوارئ وحصر الإخلاء الميداني اللحظي' : 'Emergency & Evacuation Roll-Call'}
                </h2>
                <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  {lang === 'ar' ? 'إجراء عاجل' : 'Urgent Protocol'}
                </span>
              </div>
              <p className="text-[11px] text-rose-100 font-medium mt-0.5">
                {schoolProfile?.schoolName || currentTenant.name} • {schoolProfile?.emergencyHotline ? `خط الطوارئ: ${schoolProfile.emergencyHotline}` : 'الدفاع المدني: 998'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportVectorPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{lang === 'ar' ? 'جارٍ التوليد...' : 'Generating...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'تنزيل PDF معتمد' : 'Download PDF'}</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrintDirect}
              className="flex items-center gap-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'طباعة الكشف' : 'Print'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={lang === 'ar' ? 'إغلاق وضع الطوارئ' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin">
          {/* Evacuation Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl text-center">
              <span className="text-[11px] font-bold text-slate-500">{lang === 'ar' ? 'إجمالي المقيدين' : 'Total Enrolled'}</span>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 font-mono">{totalEnrolled}</div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 p-3.5 rounded-2xl text-center">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">{lang === 'ar' ? 'متواجدون بالمدرسة اليوم' : 'On Campus Today'}</span>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono">{totalPresentOnCampus}</div>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-800 p-3.5 rounded-2xl text-center ring-2 ring-indigo-500/20">
              <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-300">{lang === 'ar' ? 'تم حصرهم بنقطة التجمع' : 'Verified at Point'}</span>
              <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-0.5 font-mono">{totalVerifiedAtPoint}</div>
              <span className="text-[10px] text-indigo-600 font-bold">
                %{totalPresentOnCampus > 0 ? Math.round((totalVerifiedAtPoint / totalPresentOnCampus) * 100) : 0}
              </span>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 p-3.5 rounded-2xl text-center">
              <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">{lang === 'ar' ? 'غائبون اليوم' : 'Absent Today'}</span>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5 font-mono">{totalAbsentToday}</div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-3.5 rounded-2xl text-center col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">{lang === 'ar' ? 'مستأذنون رسمياً' : 'Left Early'}</span>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5 font-mono">{totalLeftEarly}</div>
            </div>
          </div>

          {/* Filtering & Point Selector Strip */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {lang === 'ar' ? 'نقطة التجمع الميدانية:' : 'Assembly Point:'}
                </label>
                <select
                  value={selectedAssemblyPoint}
                  onChange={(e) => setSelectedAssemblyPoint(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {availableAssemblyPoints.map((ap) => (
                    <option key={ap} value={ap}>
                      {ap}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {lang === 'ar' ? 'تصفية الفصل:' : 'Class:'}
                </label>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="all">{lang === 'ar' ? 'جميع الفصول' : 'All Classes'}</option>
                  {Array.from(new Set(students.map((s) => s.className))).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-2.5" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث سريع باسم الطالب أو الهوية...' : 'Search student...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl ps-9 pe-3 py-1.5 text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Checklist Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="max-h-[50vh] overflow-y-auto scrollbar-thin">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">{lang === 'ar' ? 'حصر' : 'Check'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'اسم الطالب' : 'Student Name'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'الفصل' : 'Class'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'حالة التواجد اليوم' : 'Presence Status'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'ولي الأمر والهاتف' : 'Guardian Phone'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredList.map((item) => (
                    <tr
                      key={item.student.id}
                      onClick={() => toggleVerify(item.student.id)}
                      className={`cursor-pointer transition-colors ${
                        item.isVerifiedAtPoint
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.isVerifiedAtPoint}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {item.student.fullName}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-semibold">
                        {item.student.className}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            item.isPresentOnCampus
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.lastStatus === 'excused_leave'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.isPresentOnCampus
                            ? lang === 'ar' ? 'متواجد بالمدرسة' : 'On Campus'
                            : item.lastStatus === 'excused_leave'
                            ? lang === 'ar' ? 'مستأذن' : 'Left Early'
                            : lang === 'ar' ? 'غائب اليوم' : 'Absent'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {item.student.guardianName} ({item.student.guardianPhone})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Hidden Printable Roster Template for Vector PDF */}
        <div style={{ display: 'none' }}>
          <div
            ref={rosterContentRef}
            style={{
              padding: '32px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              direction: 'rtl',
              fontFamily: 'Cairo, Tahoma, sans-serif',
              width: '800px',
              margin: '0 auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e11d48', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#e11d48', margin: 0 }}>
                  كشف الإخلاء الميداني وحصر الطوارئ
                </h2>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                  {schoolProfile?.schoolName || currentTenant.name} • كود: {schoolProfile?.schoolCode || currentTenant.code}
                </div>
              </div>
              <div style={{ textAlign: 'left', fontSize: '11px', color: '#64748b' }}>
                <div>تاريخ الحصر: {new Date().toLocaleDateString('ar-SA')}</div>
                <div>نقطة التجمع: {selectedAssemblyPoint}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '16px', textAlign: 'center' }}>
              <div style={{ border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px' }}>
                <div style={{ fontSize: '10px', color: '#64748b' }}>إجمالي المقيدين</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{totalEnrolled}</div>
              </div>
              <div style={{ border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', backgroundColor: '#f0fdf4' }}>
                <div style={{ fontSize: '10px', color: '#166534' }}>متواجدون بالمدرسة</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#15803d' }}>{totalPresentOnCampus}</div>
              </div>
              <div style={{ border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', backgroundColor: '#eff6ff' }}>
                <div style={{ fontSize: '10px', color: '#1e40af' }}>محصورون بنقطة التجمع</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1d4ed8' }}>{totalVerifiedAtPoint}</div>
              </div>
              <div style={{ border: '1px solid #cbd5e1', padding: '8px', borderRadius: '8px', backgroundColor: '#fef2f2' }}>
                <div style={{ fontSize: '10px', color: '#991b1b' }}>غائبون اليوم</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#b91c1c' }}>{totalAbsentToday}</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginTop: '16px', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '6px', border: '1px solid #cbd5e1', width: '30px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '6px', border: '1px solid #cbd5e1' }}>اسم الطالب</th>
                  <th style={{ padding: '6px', border: '1px solid #cbd5e1', width: '70px' }}>الفصل</th>
                  <th style={{ padding: '6px', border: '1px solid #cbd5e1', width: '90px' }}>حالة التواجد</th>
                  <th style={{ padding: '6px', border: '1px solid #cbd5e1', width: '110px' }}>هاتف ولي الأمر</th>
                  <th style={{ padding: '6px', border: '1px solid #cbd5e1', width: '70px', textAlign: 'center' }}>حصر النقطة</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((item, idx) => (
                  <tr key={item.student.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{item.student.fullName}</td>
                    <td style={{ padding: '4px', border: '1px solid #cbd5e1' }}>{item.student.className}</td>
                    <td style={{ padding: '4px', border: '1px solid #cbd5e1' }}>
                      {item.isPresentOnCampus ? 'متواجد' : item.lastStatus === 'excused_leave' ? 'مستأذن' : 'غائب'}
                    </td>
                    <td style={{ padding: '4px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{item.student.guardianPhone}</td>
                    <td style={{ padding: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                      {item.isVerifiedAtPoint ? '✓ تم' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
