import React from 'react';
import { Filter, Search, X, Zap } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, Student } from '../../types/attendance';

export interface SessionRosterRow {
  record: AttendanceRecord;
  student: Student;
}

interface SessionRosterPanelProps {
  lang: 'ar' | 'en';
  sessionStudents: SessionRosterRow[];
  canEdit: boolean;
  sessionStatus: 'draft' | 'submitted' | 'reopened';
  searchStudent: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  selectedStudentIdsForGroup: string[];
  onToggleStudent: (studentId: string) => void;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onMinutesLateChange: (studentId: string, minutes: number) => void;
  onNoteChange: (studentId: string, status: AttendanceStatus, minutesLate: number | undefined, note: string) => void;
  onRequestQuickMarkPresent: () => void;
  onGroupMarkAsAbsent: () => void;
}

export const SessionRosterPanel: React.FC<SessionRosterPanelProps> = ({
  lang,
  sessionStudents,
  canEdit,
  sessionStatus,
  searchStudent,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedStudentIdsForGroup,
  onToggleStudent,
  onToggleSelectAll,
  onClearSelection,
  onStatusChange,
  onMinutesLateChange,
  onNoteChange,
  onRequestQuickMarkPresent,
  onGroupMarkAsAbsent,
}) => {
  // Status badges config
  const statusLabels: Record<AttendanceStatus, { ar: string; en: string; bg: string; text: string }> = {
    present: { ar: 'حاضر', en: 'Present', bg: 'bg-emerald-50 border-emerald-300 text-emerald-800', text: 'text-emerald-700' },
    absent: { ar: 'غائب', en: 'Absent', bg: 'bg-rose-50 border-rose-300 text-rose-800', text: 'text-rose-700' },
    late: { ar: 'متأخر', en: 'Late', bg: 'bg-amber-50 border-amber-300 text-amber-800', text: 'text-amber-700' },
    excused_leave: { ar: 'مستأذن', en: 'Leave', bg: 'bg-sky-50 border-sky-300 text-sky-800', text: 'text-sky-700' },
    excused_absence: { ar: 'غياب بعذر', en: 'Excused', bg: 'bg-indigo-50 border-indigo-300 text-indigo-800', text: 'text-indigo-700' },
    under_review: { ar: 'عذر قيد المراجعة', en: 'Under Review', bg: 'bg-violet-50 border-violet-300 text-violet-800', text: 'text-violet-700' },
    rejected_excuse: { ar: 'مرفوض العذر', en: 'Rejected', bg: 'bg-stone-100 border-stone-300 text-stone-800', text: 'text-stone-700' },
  };

  return (
    <>
    {/* Filter & Search Bar */}
    <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center gap-3">
      {/* Search input */}
      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        <input
          type="text"
          placeholder={lang === 'ar' ? 'بحث باسم الطالب أو السجل...' : 'Search student...'}
          value={searchStudent}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
        />
      </div>

      {/* Filter by status directly beside the search box */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          {lang === 'ar' ? 'تصفية:' : 'Filter:'}
        </span>
        {[
          { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
          { id: 'present', label: lang === 'ar' ? 'حاضر' : 'Present' },
          { id: 'absent', label: lang === 'ar' ? 'غائب' : 'Absent' },
          { id: 'late', label: lang === 'ar' ? 'متأخر' : 'Late' },
          { id: 'excused_absence', label: lang === 'ar' ? 'بعذر' : 'Excused' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => onStatusFilterChange(f.id)}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
              statusFilter === f.id
                ? 'bg-slate-800 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>

    {/* Students Roster Table */}
    <div className="overflow-x-auto">
      <table className="w-full text-right text-xs">
        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
          <tr>
            <th className="py-3 px-3 w-10 text-center">
              <input
                type="checkbox"
                aria-label="تحديد الكل"
                checked={
                  sessionStudents.length > 0 &&
                  sessionStudents.every((s) => selectedStudentIdsForGroup.includes(s.record.studentId))
                }
                onChange={onToggleSelectAll}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                title={lang === 'ar' ? 'تحديد الكل للتحضير السريع كـ مجموعة' : 'Select all for group action'}
              />
            </th>
            <th className="py-3 px-4">#</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'اسم الطالب / الرقم المدرسي' : 'Student'}</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'السجل المدني' : 'ID'}</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'حالة الحضور في هذه الحصة' : 'Status Toggle'}</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'التأخر / ملاحظة المعلم' : 'Notes / Delay'}</th>
            <th className="py-3 px-4">{lang === 'ar' ? 'سجل المواظبة' : 'Total Absences'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sessionStudents.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-slate-500">
                {lang === 'ar' ? 'لا يوجد طلاب مطابقين للبحث' : 'No students found'}
              </td>
            </tr>
          ) : (
            sessionStudents.map(({ record, student }, index) => {
              const isSessionSubmitted = sessionStatus === 'submitted';
              const isSelected = selectedStudentIdsForGroup.includes(record.studentId);

              return (
                <tr
                  key={record.studentId}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isSelected ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      aria-label={`تحديد ${student.fullName}`}
                      checked={isSelected}
                      onChange={() => onToggleStudent(record.studentId)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{student.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {lang === 'ar' ? 'رقم:' : 'No:'} {student.studentNumber}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{student.nationalId}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(['present', 'absent', 'late', 'excused_leave'] as AttendanceStatus[]).map((st) => {
                        const active = record.status === st;
                        const cfg = statusLabels[st];
                        return (
                          <button
                            key={st}
                            disabled={!canEdit}
                            onClick={() => onStatusChange(record.studentId, st)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                              active
                                ? `${cfg.bg} font-bold ring-2 ring-emerald-500/20`
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            {lang === 'ar' ? cfg.ar : cfg.en}
                          </button>
                        );
                      })}

                      {/* Extra badge if excuse approved or under review */}
                      {(record.status === 'excused_absence' || record.status === 'under_review') && (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${statusLabels[record.status].bg}`}>
                          {lang === 'ar' ? statusLabels[record.status].ar : statusLabels[record.status].en}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {record.status === 'late' && (
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] text-amber-800">
                          <span>{lang === 'ar' ? 'تأخر:' : 'Late:'}</span>
                          <input
                            type="number"
                            min="1"
                            max="45"
                            disabled={!canEdit}
                            value={record.minutesLate || 10}
                            onChange={(e) =>
                              onMinutesLateChange(record.studentId, parseInt(e.target.value) || 10)
                            }
                            className="w-10 bg-white border border-amber-300 text-center rounded px-1 py-0.5 font-bold"
                          />
                          <span>{lang === 'ar' ? 'دقيقة' : 'm'}</span>
                        </div>
                      )}

                      <input
                        type="text"
                        disabled={!canEdit}
                        placeholder={lang === 'ar' ? 'ملاحظة خاصة...' : 'Note...'}
                        value={record.note || ''}
                        onChange={(e) =>
                          onNoteChange(
                            record.studentId,
                            record.status,
                            record.minutesLate,
                            e.target.value
                          )
                        }
                        className="bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-500 focus:outline-hidden text-xs text-slate-700 px-1 py-0.5 w-36 sm:w-48 placeholder:text-slate-400"
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          student.totalAbsences >= 5 ? 'text-rose-600' : 'text-slate-700'
                        }`}
                      >
                        {student.totalAbsences} {lang === 'ar' ? 'غياب' : 'absences'}
                      </span>
                      {student.totalAbsences >= 5 && (
                        <span
                          title="تنبيه: تجاوز حد الغياب المسموح"
                          className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"
                        />
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

    {/* Floating Group Bulk Actions Toolbar */}
    {selectedStudentIdsForGroup.length > 0 && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 min-w-[320px] max-w-xl animate-in fade-in slide-in-from-bottom-3 duration-150">
        <div className="flex items-center gap-2.5 text-xs font-semibold">
          <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center">
            {selectedStudentIdsForGroup.length}
          </span>
          <span>{lang === 'ar' ? 'طالب محدد في المجموعة' : 'Students Selected'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRequestQuickMarkPresent}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تعيين كـ حاضر (Quick Mark)' : 'Quick Mark Present'}</span>
          </button>

          <button
            type="button"
            onClick={onGroupMarkAsAbsent}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تعيين كـ غائب' : 'Mark Absent'}</span>
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            {lang === 'ar' ? 'إلغاء' : 'Clear'}
          </button>
        </div>
      </div>
    )}
    </>
  );
};
