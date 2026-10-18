import React from 'react';
import { TenantSchoolProfile } from '../../types/attendance';
import { Building, ShieldCheck, Award } from 'lucide-react';
import { getCountryPreset } from '../../config/countryPresets';

interface Props {
  profile: TenantSchoolProfile;
  onChange: (updates: Partial<TenantSchoolProfile>) => void;
  disabled?: boolean;
}

export const SchoolIdentityTab: React.FC<Props> = ({ profile, onChange, disabled }) => {
  const currentCountry = profile.address?.country || 'المملكة العربية السعودية';
  const preset = getCountryPreset(currentCountry);

  return (
    <div className="space-y-4 text-xs">
      <div className="settings-group-header flex items-center justify-between p-3 rounded-xl border font-bold shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Building className="w-4 h-4 shrink-0" />
          <span className="text-sm">الهوية المؤسسية والترخيص الوزاري الرسمي</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/40 border border-current font-mono">
          {profile.schoolCode || 'ANDALUS-101'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">اسم المدرسة الرسمي (عربي):</label>
          <input
            type="text"
            disabled={disabled}
            value={profile.schoolName}
            onChange={(e) => onChange({ schoolName: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder="مثال: ثانوية الأندلس الأهلية للبنين"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">كود / الرقم الإحصائي للمدرسة (الرقم الوزاري):</label>
          <input
            type="text"
            disabled={disabled}
            value={profile.schoolCode}
            onChange={(e) => onChange({ schoolCode: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder="مثال: ANDALUS-SEC-101"
          />
        </div>

        <div className="md:col-span-2">
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
            <span>ترويسة الوزارة الرسمية (يظهر بأعلى التقارير ونماذج PDF):</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">تتكيّف تلقائياً لـ ({preset.countryNameAr})</span>
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
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{preset.directorateLabelAr}</label>
          <input
            type="text"
            disabled={disabled}
            value={profile.directorateAr}
            onChange={(e) => onChange({ directorateAr: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={preset.directoratePlaceholderAr}
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{preset.officeLabelAr}</label>
          <input
            type="text"
            disabled={disabled}
            value={profile.officeAr}
            onChange={(e) => onChange({ officeAr: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={preset.officePlaceholderAr}
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">المرحلة الدراسية:</label>
          <input
            type="text"
            disabled={disabled}
            value={profile.stageAr}
            onChange={(e) => onChange({ stageAr: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder="المرحلة الثانوية"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">نوع التعليم / الجنس:</label>
          <select
            disabled={disabled}
            value={profile.genderType}
            onChange={(e) => onChange({ genderType: e.target.value as any })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
          >
            <option value="boys">بنين (مدرسة بنين)</option>
            <option value="girls">بنات (مدرسة بنات)</option>
            <option value="mixed">مشترك (مدرسة مشتركة / طفولة مبكرة)</option>
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">رابط شعار المدرسة (Logo URL):</label>
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
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">رابط الختم الرسمي الإلكتروني (اختياري للتقارير):</label>
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
