import React from 'react';
import { TenantSchoolProfile } from '../../types/attendance';
import { Building, ShieldCheck, Award } from 'lucide-react';
import { getCountryPreset } from '../../config/countryPresets';
import { useAttendance } from '../../context/AttendanceContext';

interface Props {
  profile: TenantSchoolProfile;
  onChange: (updates: Partial<TenantSchoolProfile>) => void;
  disabled?: boolean;
}

export const SchoolIdentityTab: React.FC<Props> = ({ profile, onChange, disabled }) => {
  const { lang } = useAttendance();
  const currentCountry = profile.address?.country || 'المملكة العربية السعودية';
  const preset = getCountryPreset(currentCountry);

  return (
    <div className="space-y-4 text-xs">
      <div className="settings-group-header flex items-center justify-between p-3 rounded-xl border font-bold shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Building className="w-4 h-4 shrink-0" />
          <span className="text-sm">{lang === 'ar' ? 'الهوية المؤسسية والترخيص الوزاري الرسمي' : 'Institutional Identity & Official Ministry Licensing'}</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/40 border border-current font-mono">
          {profile.schoolCode || 'ANDALUS-101'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'اسم المدرسة الرسمي (عربي):' : 'Official School Name (Arabic):'}</label>
          <input
            type="text"
            disabled={disabled}
            value={profile.schoolName}
            onChange={(e) => onChange({ schoolName: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={lang === 'ar' ? 'مثال: ثانوية الأندلس الأهلية للبنين' : 'Example: Andalus Private Secondary School for Boys'}
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'كود / الرقم الإحصائي للمدرسة (الرقم الوزاري):' : 'School Code / Statistical Number (Ministry Number):'}</label>
          <input
            type="text"
            disabled={disabled}
            value={profile.schoolCode}
            onChange={(e) => onChange({ schoolCode: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={lang === 'ar' ? 'مثال: ANDALUS-SEC-101' : 'Example: ANDALUS-SEC-101'}
          />
        </div>

        <div className="md:col-span-2">
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
            <span>{lang === 'ar' ? 'ترويسة الوزارة الرسمية (يظهر بأعلى التقارير ونماذج PDF):' : 'Official Ministry Header (appears atop reports and PDF forms):'}</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">{lang === 'ar' ? `تتكيّف تلقائياً لـ (${preset.countryNameAr})` : `Automatically adapts to (${preset.countryNameAr})`}</span>
          </label>
          <textarea
            rows={2}
            disabled={disabled}
            value={profile.ministryHeaderAr}
            onChange={(e) => onChange({ ministryHeaderAr: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={preset.ministryHeaderAr}
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? preset.directorateLabelAr : 'Affiliated Education Directorate:'}</label>
          <input
            type="text"
            disabled={disabled}
            value={profile.directorateAr}
            onChange={(e) => onChange({ directorateAr: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={lang === 'ar' ? preset.directoratePlaceholderAr : 'Name of the education directorate'}
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? preset.officeLabelAr : 'Affiliated Education Office:'}</label>
          <input
            type="text"
            disabled={disabled}
            value={profile.officeAr}
            onChange={(e) => onChange({ officeAr: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={lang === 'ar' ? preset.officePlaceholderAr : 'Name of the education office'}
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'المرحلة الدراسية:' : 'Educational Stage:'}</label>
          <input
            type="text"
            disabled={disabled}
            value={profile.stageAr}
            onChange={(e) => onChange({ stageAr: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={lang === 'ar' ? 'المرحلة الثانوية' : 'Secondary Stage'}
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'نوع التعليم / الجنس:' : 'Education Type / Gender:'}</label>
          <select
            disabled={disabled}
            value={profile.genderType}
            onChange={(e) => onChange({ genderType: e.target.value as any })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
          >
            <option value="boys">{lang === 'ar' ? 'بنين (مدرسة بنين)' : 'Boys (Boys School)'}</option>
            <option value="girls">{lang === 'ar' ? 'بنات (مدرسة بنات)' : 'Girls (Girls School)'}</option>
            <option value="mixed">{lang === 'ar' ? 'مشترك (مدرسة مشتركة / طفولة مبكرة)' : 'Mixed (Co-ed School / Early Childhood)'}</option>
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'رابط شعار المدرسة (Logo URL):' : 'School Logo URL:'}</label>
          <input
            type="url"
            disabled={disabled}
            value={profile.logoUrl || ''}
            onChange={(e) => onChange({ logoUrl: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'رابط الختم الرسمي الإلكتروني (اختياري للتقارير):' : 'Official Electronic Stamp URL (optional for reports):'}</label>
          <input
            type="url"
            disabled={disabled}
            value={profile.stampUrl || ''}
            onChange={(e) => onChange({ stampUrl: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
};
