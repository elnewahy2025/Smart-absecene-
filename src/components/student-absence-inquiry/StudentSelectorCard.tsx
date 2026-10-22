import type { Student } from '../../types/attendance';
import { Filter, Search, X } from 'lucide-react';

interface StudentSelectorCardProps {
  isAr: boolean;
  gradesList: string[];
  classesList: string[];
  filteredStudents: Student[];
  selectedGrade: string;
  selectedClass: string;
  searchQuery: string;
  selectedStudentId: string | null;
  onGradeChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSelectStudent: (id: string) => void;
  onClearSelection: () => void;
}

export function StudentSelectorCard({
  isAr,
  gradesList,
  classesList,
  filteredStudents,
  selectedGrade,
  selectedClass,
  searchQuery,
  selectedStudentId,
  onGradeChange,
  onClassChange,
  onSearchChange,
  onSelectStudent,
  onClearSelection,
}: StudentSelectorCardProps) {
  return (
    <div
      className="app-card rounded-2xl border p-4 shadow-2xs space-y-4"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
        <Filter className="w-4 h-4 text-primary" />
        <span>{isAr ? 'تحديد واختيار الطالب:' : 'Select Student:'}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Select Grade */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            {isAr ? '1. اختر الصف الدراسي:' : '1. Grade:'}
          </label>
          <div className="relative">
            <select
              value={selectedGrade}
              onChange={(e) => onGradeChange(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              style={{ color: 'var(--app-text-main)' }}
            >
              <option value="all">{isAr ? 'جميع الصفوف الدراسية' : 'All Grades'}</option>
              {gradesList.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Select Class */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            {isAr ? '2. اختر الفصل / الشعبة:' : '2. Class / Section:'}
          </label>
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              style={{ color: 'var(--app-text-main)' }}
            >
              <option value="all">{isAr ? 'جميع الفصول والشعب' : 'All Classes'}</option>
              {classesList.map((c) => (
                <option key={c} value={c}>
                  {isAr ? `فصل ${c}` : `Class ${c}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Instant Search Box */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            {isAr ? '3. أو ابحث مباشرة بالاسم أو الهوية:' : '3. Or Search by Name / ID:'}
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={isAr ? 'اكتب اسم الطالب أو رقم الهوية...' : 'Type student name or ID...'}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl ps-9 pe-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              style={{ color: 'var(--app-text-main)' }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute end-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Student Selector Structured Table */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {isAr
              ? `قائمة الطلاب (${filteredStudents.length} طالب) — انقر على أي طالب لعرض ملفه:`
              : `Student Roster (${filteredStudents.length} students) — Click any row to view record:`}
          </span>
          {selectedStudentId && (
            <button
              onClick={onClearSelection}
              className="text-primary hover:underline text-[11px] font-bold cursor-pointer"
            >
              {isAr ? 'إلغاء التحديد' : 'Clear selection'}
            </button>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="max-h-64 overflow-y-auto scrollbar-thin">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3 text-start w-10">#</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'اسم الطالب' : 'Student Name'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الصف / الفصل' : 'Grade & Class'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'الهوية الوطنية' : 'National ID'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'نسبة الحضور' : 'Rate'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'إجمالي الغياب' : 'Absences'}</th>
                  <th className="py-2.5 px-3 text-center w-24">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((s, idx) => {
                  const isSelected = s.id === selectedStudentId;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => onSelectStudent(s.id)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-primary/10 dark:bg-primary/20 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                              isSelected
                                ? 'bg-primary text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {s.fullName?.charAt(0) || 'ط'}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {s.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {s.grade} • فصل {s.className}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px]">
                        {s.nationalId || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span
                          className={
                            (s.attendanceRate || 100) >= 90
                              ? 'text-primary'
                              : (s.attendanceRate || 100) >= 80
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          %{s.attendanceRate || 100}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {s.totalAbsences || 0} {isAr ? 'يوم' : 'd'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                            {isAr ? 'محدد حالياً' : 'Selected'}
                          </span>
                        ) : (s.totalAbsences || 0) >= 5 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            {isAr ? 'حرج' : 'Critical'}
                          </span>
                        ) : (s.totalAbsences || 0) >= 3 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            {isAr ? 'إنذار' : 'Warning'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                            {isAr ? 'منضبط' : 'Good'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      {isAr ? 'لا يوجد طلاب مطابقون لشروط البحث المحددة.' : 'No students found matching your criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
