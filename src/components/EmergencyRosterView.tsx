import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  ShieldAlert,
  Printer,
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
  const { students, sessions, settings, lang, currentTenant } = useAttendance();

  const [selectedAssemblyPoint, setSelectedAssemblyPoint] = useState<string>(
    settings.emergencyAssemblyPoints[0] || 'نقطة التجمع (أ) - الفناء الرئيسي'
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer / Architectural Note Banner as required by spec */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 shadow-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-amber-950">
            {lang === 'ar'
              ? 'كشف آخر حالة حضور مسجلة (مخصص لإجراءات الطوارئ والسلامة المدرسية)'
              : 'Last Recorded Attendance Roster for Emergencies'}
          </h4>
          <p className="leading-relaxed">
            {lang === 'ar'
              ? 'تنويه تنظيمي: يعكس هذا الكشف آخر تحديث معتمد في كشوف الحضور للحصص. يُستخدم كمرجع أساسي لحصر أعداد المتواجدين والغائبين عند الإخلاء، ويلزم التحقق الميداني المباشر من كل طالب في نقطة التجمع.'
              : 'Regulatory Notice: This roster reflects the latest submitted class attendance session for headcounts during evacuation. Physical verification at the assembly point is required.'}
          </p>
        </div>
      </div>

      {/* Overview Headcount KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">{lang === 'ar' ? 'إجمالي المقيدين' : 'Total Enrolled'}</span>
          <span className="text-2xl font-bold text-slate-900">{totalEnrolled}</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-emerald-700 block font-semibold">
            {lang === 'ar' ? 'المتواجدون بالمبنى (آخر كشف)' : 'On Campus'}
          </span>
          <span className="text-2xl font-bold text-emerald-800">{totalPresentOnCampus}</span>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-rose-700 block font-semibold">
            {lang === 'ar' ? 'غائبون رسميًا اليوم' : 'Absent Today'}
          </span>
          <span className="text-2xl font-bold text-rose-800">{totalAbsentToday}</span>
        </div>

        <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-sky-700 block font-semibold">
            {lang === 'ar' ? 'مستأذنون / انصراف مبكر' : 'Left Early'}
          </span>
          <span className="text-2xl font-bold text-sky-800">{totalLeftEarly}</span>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl shadow-xs col-span-2 md:col-span-1">
          <span className="text-xs text-indigo-700 block font-semibold">
            {lang === 'ar' ? 'تم حصرهم بنقطة الإخلاء' : 'Verified at Rally Point'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-indigo-800">{totalVerifiedAtPoint}</span>
            <span className="text-xs text-indigo-600 font-mono">/ {totalPresentOnCampus}</span>
          </div>
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
              {settings.emergencyAssemblyPoints.map((pt) => (
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
              <option value="10 / أ">10 / أ</option>
              <option value="10 / ب">10 / ب</option>
              <option value="11 / أ">11 / أ</option>
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

        {/* Print button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>{lang === 'ar' ? 'طباعة كشف الإخلاء الفوري' : 'Print Roster'}</span>
        </button>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {lang === 'ar' ? 'قائمة التحقق الميداني للطوارئ' : 'Emergency Roll-Call Checklist'}
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              {currentTenant.name} · {latestSession?.subject || 'كشف اليوم'} ({latestSession?.date})
            </span>
          </div>

          <div className="text-xs text-slate-600">
            {lang === 'ar' ? 'اضغط على السجل لتأكيد الوجود بنقطة التجمع' : 'Click to verify at rally point'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center w-14">
                  {lang === 'ar' ? 'تم الحصر' : 'Checked'}
                </th>
                <th className="py-3 px-4">{lang === 'ar' ? 'اسم الطالب' : 'Student Name'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'الفصل الدراسي' : 'Class'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'حالة الحضور الأخيرة' : 'Last Known Status'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'هاتف ولي الأمر للطوارئ' : 'Emergency Contact'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'فصيلة الدم / حالات صحية' : 'Medical Flags'}</th>
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
                    <td className="py-3 px-4 text-center">
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
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{student.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">رقم: {student.studentNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{student.className}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
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
                      {note && <div className="text-[10px] text-slate-500 mt-0.5">{note}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700" dir="ltr">
                      {student.emergencyContact || student.guardianPhone}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {student.bloodType || 'O+'}
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
