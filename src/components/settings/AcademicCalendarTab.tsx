import React from 'react';
import { TenantSchoolProfile, TimetablePeriod } from '../../types/attendance';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import { AcademicTermsCard } from './AcademicTermsCard';
import { HolidaysAndWeekendsCard } from './HolidaysAndWeekendsCard';
import { ClassesManagementCard } from './ClassesManagementCard';
import { SubjectsManagementCard } from './SubjectsManagementCard';

interface Props {
  profile: TenantSchoolProfile;
  onChange: (updates: Partial<TenantSchoolProfile>) => void;
  onAutoSave?: (updates: Partial<TenantSchoolProfile>) => Promise<void> | void;
  disabled?: boolean;
}

export const AcademicCalendarTab: React.FC<Props> = ({ profile, onChange, onAutoSave, disabled }) => {
  const academicYear = profile.academicYear || { code: '', hijriYear: '', gregorianYear: '', terms: [] };
  const timetablePeriods = profile.timetablePeriods || [];
  const classes = profile.classes || [];
  const subjects = profile.subjects || [];

  const handleYearChange = (key: string, value: string) => {
    const updated = {
      ...academicYear,
      [key]: value,
    };
    onChange({ academicYear: updated });
  };

  const handleYearBlur = async () => {
    if (onAutoSave) {
      await onAutoSave({ academicYear });
    }
  };

  const handleTermsChange = (newTerms: typeof academicYear.terms) => {
    onChange({
      academicYear: {
        ...academicYear,
        terms: newTerms,
      },
    });
  };

  const handleTermsAutoSave = async (newTerms: typeof academicYear.terms) => {
    const updatedYear = {
      ...academicYear,
      terms: newTerms,
    };
    onChange({ academicYear: updatedYear });
    if (onAutoSave) {
      await onAutoSave({ academicYear: updatedYear });
    }
  };

  const handlePeriodChange = async (id: string, field: keyof TimetablePeriod, value: any) => {
    const updatedPeriods = timetablePeriods.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    onChange({ timetablePeriods: updatedPeriods });
    if (onAutoSave) {
      await onAutoSave({ timetablePeriods: updatedPeriods });
    }
  };

  const handleAddPeriod = async () => {
    const nextNumber = timetablePeriods.length;
    const newPeriod: TimetablePeriod = {
      id: `period-${Date.now()}`,
      periodNumber: nextNumber,
      nameAr: `الحصة ${nextNumber}`,
      startTime: '08:00',
      endTime: '08:45',
      type: 'lesson',
    };
    const updatedPeriods = [...timetablePeriods, newPeriod];
    onChange({ timetablePeriods: updatedPeriods });
    if (onAutoSave) {
      await onAutoSave({ timetablePeriods: updatedPeriods });
    }
  };

  const handleDeletePeriod = async (id: string) => {
    const updatedPeriods = timetablePeriods.filter((p) => p.id !== id);
    onChange({ timetablePeriods: updatedPeriods });
    if (onAutoSave) {
      await onAutoSave({ timetablePeriods: updatedPeriods });
    }
  };

  const handleClassesAutoSave = async (newClasses: typeof classes) => {
    onChange({ classes: newClasses });
    if (onAutoSave) {
      await onAutoSave({ classes: newClasses });
    }
  };

  const handleSubjectsAutoSave = async (newSubjects: typeof subjects) => {
    onChange({ subjects: newSubjects });
    if (onAutoSave) {
      await onAutoSave({ subjects: newSubjects });
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="settings-group-header flex items-center justify-between p-3 rounded-xl border font-bold shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="text-sm">التقويم الدراسي، الفصول، وتوقيت الحصص اليومية (GibbonEdu Standard)</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/40 border border-current font-mono">
          {timetablePeriods.length} حصص يومية
        </span>
      </div>

      {/* Year Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div>
          <label className="text-slate-600 block mb-1">رمز العام الدراسي:</label>
          <input
            type="text"
            disabled={disabled}
            value={academicYear.code}
            onChange={(e) => handleYearChange('code', e.target.value)}
            onBlur={handleYearBlur}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
            placeholder="1446-1447"
          />
        </div>
        <div>
          <label className="text-slate-600 block mb-1">العام الدراسي الهجري:</label>
          <input
            type="text"
            disabled={disabled}
            value={academicYear.hijriYear}
            onChange={(e) => handleYearChange('hijriYear', e.target.value)}
            onBlur={handleYearBlur}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
            placeholder="1446-1447 هـ"
          />
        </div>
        <div>
          <label className="text-slate-600 block mb-1">المقابل الميلادي:</label>
          <input
            type="text"
            disabled={disabled}
            value={academicYear.gregorianYear}
            onChange={(e) => handleYearChange('gregorianYear', e.target.value)}
            onBlur={handleYearBlur}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
            placeholder="2026-2027"
          />
        </div>
      </div>

      {/* 1. Academic Terms Component */}
      <AcademicTermsCard
        terms={academicYear.terms}
        onChange={handleTermsChange}
        onAutoSave={handleTermsAutoSave}
        disabled={disabled}
      />

      {/* 2. Official Weekends & Holidays (Closed Days) */}
      <HolidaysAndWeekendsCard
        weekendDays={profile.weekendDays}
        officialHolidays={profile.officialHolidays}
        onChange={onChange}
        onAutoSave={onAutoSave}
        disabled={disabled}
      />

      {/* 3. School Classes & Classrooms Management */}
      <ClassesManagementCard
        classes={classes}
        onChange={(newClasses) => onChange({ classes: newClasses })}
        onAutoSave={handleClassesAutoSave}
        disabled={disabled}
      />

      {/* 4. Approved School Subjects */}
      <SubjectsManagementCard
        subjects={subjects}
        onChange={(newSubjects) => onChange({ subjects: newSubjects })}
        onAutoSave={handleSubjectsAutoSave}
        disabled={disabled}
      />

      {/* 4. Daily Timetable Periods */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>جدول الحصص والفترات الزمنية اليومية ({timetablePeriods.length} فترات):</span>
          </h4>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddPeriod}
              className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حصة / فترة جديدة</span>
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                <th className="p-2.5">رقم</th>
                <th className="p-2.5">اسم الحصة / الفترة</th>
                <th className="p-2.5">النوع</th>
                <th className="p-2.5">وقت البدء</th>
                <th className="p-2.5">وقت الانتهاء</th>
                {!disabled && <th className="p-2.5 text-center w-14">إجراء</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timetablePeriods.map((period) => (
                <tr key={period.id} className="hover:bg-slate-50/50">
                  <td className="p-2 font-mono font-bold text-slate-700 text-center w-12">
                    {period.periodNumber}
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      disabled={disabled}
                      value={period.nameAr}
                      onChange={(e) => handlePeriodChange(period.id, 'nameAr', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-900"
                    />
                  </td>
                  <td className="p-2 w-32">
                    <select
                      disabled={disabled}
                      value={period.type}
                      onChange={(e) => handlePeriodChange(period.id, 'type', e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800"
                    >
                      <option value="assembly">اصطفاف</option>
                      <option value="lesson">حصة دراسية</option>
                      <option value="recess">فسحة</option>
                      <option value="prayer">صلاة</option>
                    </select>
                  </td>
                  <td className="p-2 w-28">
                    <input
                      type="time"
                      disabled={disabled}
                      value={period.startTime}
                      onChange={(e) => handlePeriodChange(period.id, 'startTime', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                    />
                  </td>
                  <td className="p-2 w-28">
                    <input
                      type="time"
                      disabled={disabled}
                      value={period.endTime}
                      onChange={(e) => handlePeriodChange(period.id, 'endTime', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-slate-800"
                    />
                  </td>
                  {!disabled && (
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePeriod(period.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="حذف الفترة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
