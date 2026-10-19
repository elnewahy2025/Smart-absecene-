import React from 'react';
import { TenantSchoolProfile } from '../../types/attendance';
import { Calendar } from 'lucide-react';
import { AcademicTermsCard } from './AcademicTermsCard';
import { HolidaysAndWeekendsCard } from './HolidaysAndWeekendsCard';
import { useAttendance } from '../../context/AttendanceContext';

interface Props {
  profile: TenantSchoolProfile;
  onChange: (updates: Partial<TenantSchoolProfile>) => void;
  onAutoSave?: (updates: Partial<TenantSchoolProfile>) => Promise<void> | void;
  disabled?: boolean;
}

export const AcademicCalendarTab: React.FC<Props> = ({ profile, onChange, onAutoSave, disabled }) => {
  const { lang } = useAttendance();
  const academicYear = profile.academicYear || { code: '', hijriYear: '', gregorianYear: '', terms: [] };

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

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="settings-group-header flex items-center justify-between p-3 rounded-xl border font-bold shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 shrink-0 text-blue-600" />
          <span className="text-sm">{lang === 'ar' ? 'التقويم الدراسي السنوي، الفصول الدراسية والعطلات المعتمدة' : 'Annual academic calendar, academic terms and approved holidays'}</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/40 border border-current font-mono">
          {academicYear.terms?.length || 0} {lang === 'ar' ? 'فصول دراسية' : 'academic terms'}
        </span>
      </div>

      {/* Academic Year Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div>
          <label className="text-slate-600 block mb-1">{lang === 'ar' ? 'رمز العام الدراسي:' : 'Academic year code:'}</label>
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
          <label className="text-slate-600 block mb-1">{lang === 'ar' ? 'العام الدراسي الهجري:' : 'Hijri academic year:'}</label>
          <input
            type="text"
            disabled={disabled}
            value={academicYear.hijriYear}
            onChange={(e) => handleYearChange('hijriYear', e.target.value)}
            onBlur={handleYearBlur}
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
            placeholder={lang === 'ar' ? '1446-1447 هـ' : '1446-1447 AH'}
          />
        </div>
        <div>
          <label className="text-slate-600 block mb-1">{lang === 'ar' ? 'المقابل الميلادي:' : 'Gregorian equivalent:'}</label>
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
        country={profile.address?.country}
        onUpdateMinistryHeader={(header) => {
          onChange({ ministryHeaderAr: header });
          if (onAutoSave) {
            onAutoSave({ ministryHeaderAr: header });
          }
        }}
      />
    </div>
  );
};
