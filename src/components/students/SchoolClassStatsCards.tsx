import React from 'react';
import { SchoolClassSummary, SchoolEnrollmentStats } from '../../types/attendance';
import { Users, School, UserCheck, ArrowRightLeft, TrendingUp, AlertCircle, ChevronDown, Filter } from 'lucide-react';

interface SchoolClassStatsCardsProps {
  enrollmentStats: SchoolEnrollmentStats;
  classesStats: SchoolClassSummary[];
  selectedClass: string;
  onSelectClass: (className: string) => void;
  statusFilter: 'active' | 'transferred' | 'all';
  onStatusFilterChange: (status: 'active' | 'transferred' | 'all') => void;
  selectedGradeFilter?: string;
  onSelectGradeFilter?: (grade: string) => void;
  lang: 'ar' | 'en';
}

export const SchoolClassStatsCards: React.FC<SchoolClassStatsCardsProps> = ({
  enrollmentStats,
  classesStats,
  selectedClass,
  onSelectClass,
  statusFilter,
  onStatusFilterChange,
  selectedGradeFilter = 'all',
  onSelectGradeFilter,
  lang,
}) => {
  const isAr = lang === 'ar';

  // Group classes by Grade for hierarchical drill-down
  const gradesList = Array.from(new Set(classesStats.map((c) => c.grade))).filter(Boolean);

  // Compute active students attendance rate strictly from active counts
  const attendanceRate = enrollmentStats.schoolAttendanceRate;

  // Find currently selected class summary if one is clicked
  const activeClassSummary = classesStats.find((c) => c.className === selectedClass);

  return (
    <div className="space-y-4">
      {/* 4 Executive KPI Cards - Percentages as Primary, Actual Counts Beside, Clickable Drilldown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Primary Overall Attendance Rate */}
        <div
          onClick={() => {
            onSelectClass('all');
            if (onSelectGradeFilter) onSelectGradeFilter('all');
            onStatusFilterChange('active');
          }}
          className={`bg-white rounded-xl border p-4 shadow-2xs relative overflow-hidden transition-all cursor-pointer hover:shadow-md ${
            selectedClass === 'all' && statusFilter === 'active'
              ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20'
              : 'border-slate-200/80 hover:border-teal-300'
          }`}
          title={isAr ? 'انقر لعرض جميع الطلاب النشطين بالمدرسة' : 'Click to drill down into all active students'}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'معدل الحضور العام بالمدرسة' : 'Overall Attendance'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            {/* Primary Prominent Percentage */}
            <span className="text-3xl font-black text-teal-800 tracking-tight font-mono">
              %{attendanceRate}
            </span>
            {/* Actual count beside it */}
            <span className="text-xs text-slate-500 font-semibold">
              ({enrollmentStats.activeStudentsCount} {isAr ? 'طالب نشط' : 'active'})
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${
                attendanceRate >= 92
                  ? 'bg-emerald-100 text-emerald-800'
                  : attendanceRate >= 85
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {attendanceRate >= 92 ? (isAr ? 'انضباط ممتاز' : 'Excellent') : (isAr ? 'بحاجة لمتابعة' : 'Attention')}
            </span>
            <span className="text-teal-700 font-bold hover:underline">
              {isAr ? 'عرض الكل ←' : 'View all →'}
            </span>
          </div>
        </div>

        {/* Card 2: Student Enrollment Ratio */}
        <div
          onClick={() => onStatusFilterChange('active')}
          className={`bg-white rounded-xl border p-4 shadow-2xs relative overflow-hidden transition-all cursor-pointer hover:shadow-md ${
            statusFilter === 'active'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
              : 'border-slate-200/80 hover:border-emerald-300'
          }`}
          title={isAr ? 'انقر لتصفية الطلاب النشطين' : 'Click to filter active students'}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'نسبة القيد النشط' : 'Active Enrollment'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            {/* Prominent Active Percentage */}
            <span className="text-3xl font-black text-emerald-800 tracking-tight font-mono">
              %{enrollmentStats.totalStudentsCount > 0
                ? Math.round((enrollmentStats.activeStudentsCount / enrollmentStats.totalStudentsCount) * 100)
                : 100}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              ({enrollmentStats.activeStudentsCount} / {enrollmentStats.totalStudentsCount})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{isAr ? 'طالب منتظم بالدراسة' : 'Regular enrolled students'}</span>
            <span className="text-emerald-700 font-bold hover:underline">{isAr ? 'تصفية ←' : 'Filter →'}</span>
          </p>
        </div>

        {/* Card 3: Class Distribution & Average Density */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'الفصول والكثافة الصفية' : 'Class Sections & Density'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-900 tracking-tight font-mono">
              {enrollmentStats.averageClassSize}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {isAr ? 'طالب / فصل (متوسط)' : 'students / class avg'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{isAr ? `عبر ${enrollmentStats.totalClassesCount} شعب دراسية` : `Across ${enrollmentStats.totalClassesCount} sections`}</span>
            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
              {isAr ? 'كثافة نموذجية' : 'Standard'}
            </span>
          </p>
        </div>

        {/* Card 4: Transferred Archive with Percentage */}
        <div
          onClick={() => onStatusFilterChange(statusFilter === 'transferred' ? 'active' : 'transferred')}
          className={`bg-white rounded-xl border p-4 shadow-2xs relative overflow-hidden transition-all cursor-pointer hover:shadow-md ${
            statusFilter === 'transferred'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30'
              : 'border-slate-200/80 hover:border-amber-300'
          }`}
          title={isAr ? 'انقر للانتقال المباشر لأرشيف المنقولين' : 'Click to drill down into transferred student archive'}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'نسبة المنقولين (الأرشيف)' : 'Transferred Out %'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            {/* Percentage of Transferred */}
            <span className="text-3xl font-black text-amber-800 tracking-tight font-mono">
              %{enrollmentStats.totalStudentsCount > 0
                ? Math.round((enrollmentStats.transferredStudentsCount / enrollmentStats.totalStudentsCount) * 100)
                : 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              ({enrollmentStats.transferredStudentsCount} {isAr ? 'طالب منقول' : 'transferred'})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{isAr ? 'مخفيون من التحضير' : 'Archived records'}</span>
            <span className="text-amber-700 font-bold hover:underline">
              {statusFilter === 'transferred' ? (isAr ? 'النشط حالياً' : 'Active') : (isAr ? 'عرض الأرشيف ←' : 'View Archive →')}
            </span>
          </p>
        </div>
      </div>

      {/* Grade Level Breakdown Cards (Drilldown Layer 1: School -> Grade) */}
      {gradesList.length > 0 && onSelectGradeFilter && (
        <div
          className="p-3.5 rounded-xl border transition-colors shadow-2xs"
          style={{
            backgroundColor: 'var(--app-card-bg)',
            borderColor: 'var(--app-border)',
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span
              className="text-xs font-bold flex items-center gap-1.5"
              style={{ color: 'var(--app-text-main)' }}
            >
              <Filter className="w-3.5 h-3.5" style={{ color: 'var(--app-primary)' }} />
              <span>{isAr ? 'توزيع المراحل الدراسية ومعدل حضورها (انقر للتعمق):' : 'Grade Level Attendance Drilldown:'}</span>
            </span>
            {selectedGradeFilter !== 'all' && (
              <button
                onClick={() => onSelectGradeFilter('all')}
                className="text-[11px] font-bold hover:underline cursor-pointer"
                style={{ color: 'var(--app-primary)' }}
              >
                {isAr ? 'إعادة ضبط لكامل المراحل' : 'Reset to all grades'}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {gradesList.map((grade) => {
              const gradeClasses = classesStats.filter((c) => c.grade === grade);
              const gradeActiveStudents = gradeClasses.reduce((acc, c) => acc + c.activeStudents, 0);
              const gradeAvgAttendance =
                gradeActiveStudents > 0
                  ? Math.round(
                      gradeClasses.reduce((acc, c) => acc + c.attendanceRate * c.activeStudents, 0) /
                        gradeActiveStudents
                    )
                  : 100;

              const isSelected = selectedGradeFilter === grade;

              return (
                <div
                  key={grade}
                  onClick={() => onSelectGradeFilter(isSelected ? 'all' : grade)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
                    isSelected
                      ? 'bg-emerald-500/20 text-white border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'hover:border-emerald-500/50'
                  }`}
                  style={{
                    backgroundColor: isSelected ? undefined : 'var(--app-input-bg)',
                    borderColor: isSelected ? undefined : 'var(--app-border)',
                    color: 'var(--app-text-main)',
                  }}
                >
                  <div>
                    <span className="font-bold text-xs block leading-tight">{grade}</span>
                    <span
                      className="text-[10px]"
                      style={{ color: 'var(--app-text-muted)' }}
                    >
                      {gradeClasses.length} {isAr ? 'شعب' : 'sections'} · {gradeActiveStudents} {isAr ? 'طالب' : 'students'}
                    </span>
                  </div>
                  <div className="text-left font-mono">
                    <span
                      className="text-base font-black block leading-none"
                      style={{ color: isSelected ? 'var(--app-primary)' : 'var(--app-text-main)' }}
                    >
                      %{gradeAvgAttendance}
                    </span>
                    <span
                      className="text-[9px]"
                      style={{ color: 'var(--app-text-muted)' }}
                    >
                      {isAr ? 'حضور' : 'attend'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Classroom Sections Grid (Drilldown Layer 2: Grade -> Classroom) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <School className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'الشعب والفصول الدراسية (النسبة هي المؤشر الأبرز مع العدد الفعلي):' : 'Class Sections (Percentage Prominent):'}</span>
          </span>
          <button
            onClick={() => onSelectClass('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedClass === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'عرض جميع الفصول' : 'Show All Classes'}
          </button>
        </div>

        {/* Section Cards with Prominent Percentage + Actual Count + Actionable Status */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {classesStats
            .filter((c) => selectedGradeFilter === 'all' || c.grade === selectedGradeFilter)
            .map((c) => {
              const isSelected = selectedClass === c.className;
              const rate = c.attendanceRate;

              return (
                <div
                  key={c.className}
                  onClick={() => onSelectClass(isSelected ? 'all' : c.className)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:border-emerald-300 hover:bg-white'
                  }`}
                  title={isAr ? `انقر لتحديد طلاب فصل ${c.className}` : `Click to filter students in ${c.className}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs truncate">{c.className}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {c.activeStudents} {isAr ? 'ط' : 's'}
                    </span>
                  </div>

                  {/* Most Prominent Metric: Large Percentage */}
                  <div className="my-1.5 flex items-baseline justify-between">
                    <span
                      className={`text-2xl font-black font-mono tracking-tight ${
                        rate >= 92 ? 'text-emerald-700' : rate >= 85 ? 'text-amber-700' : 'text-rose-700'
                      }`}
                    >
                      %{rate}
                    </span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        rate >= 92
                          ? 'bg-emerald-100 text-emerald-800'
                          : rate >= 85
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {rate >= 92 ? (isAr ? 'منضبط' : 'Good') : (isAr ? 'تدخل' : 'Alert')}
                    </span>
                  </div>

                  {/* Progress bar visual aid */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        rate >= 92 ? 'bg-emerald-500' : rate >= 85 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Drilldown Focus Indicator */}
      {selectedClass !== 'all' && activeClassSummary && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-950 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>
              {isAr
                ? `أنت الآن تستعرض تفاصيل فصل (${activeClassSummary.className}) - ${activeClassSummary.grade}: نسبة الحضور `
                : `Currently drilling down into ${activeClassSummary.className} (${activeClassSummary.grade}): Attendance rate `}
              <strong className="font-mono text-emerald-900 text-sm">%{activeClassSummary.attendanceRate}</strong>
              {' '}({activeClassSummary.activeStudents} {isAr ? 'طالب نشط' : 'active students'})
            </span>
          </div>
          <button
            onClick={() => onSelectClass('all')}
            className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer text-xs"
          >
            {isAr ? 'إلغاء التحديد وعرض كامل المدرسة' : 'Clear & view all school'}
          </button>
        </div>
      )}
    </div>
  );
};
