import React from 'react';
import { TenantSchoolProfile } from '../../types/attendance';
import { Users, UserCheck, ShieldAlert, HeartHandshake } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { getCountryPreset, getLocalPhonePlaceholder } from '../../config/countryPresets';
import { resolveCallingCodeForProfile } from '../../config/countryCodes';

interface Props {
  profile: TenantSchoolProfile;
  onChange: (updates: Partial<TenantSchoolProfile>) => void;
  disabled?: boolean;
}

export const SchoolLeadershipTab: React.FC<Props> = ({ profile, onChange, disabled }) => {
  const { lang } = useAttendance();
  const leadership = profile.leadership || ({} as Partial<TenantSchoolProfile['leadership']>);
  const dialCode = resolveCallingCodeForProfile(profile);
  const countryPreset = getCountryPreset(profile.address?.country || dialCode);
  const phonePlaceholder = `${dialCode} ${getLocalPhonePlaceholder(profile.address?.country || dialCode)}`;
  void countryPreset;

  const handleLeadershipChange = (key: string, value: string) => {
    onChange({
      leadership: {
        ...leadership,
        [key]: value,
      } as TenantSchoolProfile['leadership'],
    });
  };

  return (
    <div className="space-y-4 text-xs font-['Cairo',sans-serif]">
      <div className="settings-group-header flex items-center justify-between p-3 rounded-xl border font-bold shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 shrink-0" />
          <span className="text-sm">{lang === 'ar' ? 'الهيئة القيادية والإشرافية المعتمدة (توقيعات التقارير الرسمية)' : 'Approved Leadership & Supervisory Body (Official Report Signatures)'}</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/40 border border-current">
          {lang === 'ar' ? 'الاعتماد والمسؤولية' : 'Accreditation & Responsibility'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Principal */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <UserCheck className="w-4 h-4 text-slate-700" />
            <span>{lang === 'ar' ? 'مدير / مديرة المدرسة' : 'School Principal'}</span>
          </div>
          <div>
            <label htmlFor="schoolleadershiptab-input-1" className="text-slate-600 block mb-1">{lang === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}</label>
            <input id="schoolleadershiptab-input-1" name="schoolleadershiptab-input-1"
              type="text"
              disabled={disabled}
              value={leadership.principalName || ''}
              onChange={(e) => handleLeadershipChange('principalName', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
              placeholder={lang === 'ar' ? 'أدخل اسم مدير المدرسة...' : 'Enter principal full name...'}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="schoolleadershiptab-input-2" className="text-slate-600 block mb-1 flex items-center justify-between">
                <span>{lang === 'ar' ? 'رقم الجوال:' : 'Mobile Number:'}</span>
                <span className="font-mono text-[10px] text-indigo-600 font-normal" dir="ltr">{dialCode}</span>
              </label>
              <input id="schoolleadershiptab-input-2" name="schoolleadershiptab-input-2"
                type="text"
                disabled={disabled}
                value={leadership.principalPhone || ''}
                onChange={(e) => handleLeadershipChange('principalPhone', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                placeholder={phonePlaceholder}
              />
            </div>
            <div>
              <label htmlFor="schoolleadershiptab-input-3" className="text-slate-600 block mb-1">{lang === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</label>
              <input id="schoolleadershiptab-input-3" name="schoolleadershiptab-input-3"
                type="email"
                disabled={disabled}
                value={leadership.principalEmail || ''}
                onChange={(e) => handleLeadershipChange('principalEmail', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                placeholder="principal@school.edu"
              />
            </div>
          </div>
        </div>

        {/* Vice Principal - Student Affairs */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <span>{lang === 'ar' ? 'وكيل شؤون الطلاب (المسؤول المباشر عن الغياب والانضباط)' : 'Vice Principal for Student Affairs (Directly responsible for attendance & discipline)'}</span>
          </div>
          <div>
            <label htmlFor="schoolleadershiptab-input-4" className="text-slate-600 block mb-1">{lang === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}</label>
            <input id="schoolleadershiptab-input-4" name="schoolleadershiptab-input-4"
              type="text"
              disabled={disabled}
              value={leadership.vicePrincipalStudentAffairsName || ''}
              onChange={(e) => handleLeadershipChange('vicePrincipalStudentAffairsName', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
              placeholder={lang === 'ar' ? 'أدخل اسم وكيل شؤون الطلبة...' : 'Enter student affairs vice principal name...'}
            />
          </div>
          <div>
            <label htmlFor="schoolleadershiptab-input-5" className="text-slate-600 block mb-1 flex items-center justify-between">
              <span>{lang === 'ar' ? 'رقم الجوال / التحويلة:' : 'Mobile Number / Extension:'}</span>
              <span className="font-mono text-[10px] text-indigo-600 font-normal" dir="ltr">{dialCode}</span>
            </label>
            <input id="schoolleadershiptab-input-5" name="schoolleadershiptab-input-5"
              type="text"
              disabled={disabled}
              value={leadership.vicePrincipalStudentAffairsPhone || ''}
              onChange={(e) => handleLeadershipChange('vicePrincipalStudentAffairsPhone', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
              placeholder={phonePlaceholder}
            />
          </div>
        </div>

        {/* Vice Principal - Academic Affairs */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'ar' ? 'وكيل الشؤون التعليمية والمدرسية (الجداول والحصص)' : 'Vice Principal for Academic & School Affairs (Timetables & Classes)'}</span>
          </div>
          <div>
            <label htmlFor="schoolleadershiptab-input-6" className="text-slate-600 block mb-1">{lang === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}</label>
            <input id="schoolleadershiptab-input-6" name="schoolleadershiptab-input-6"
              type="text"
              disabled={disabled}
              value={leadership.vicePrincipalAcademicAffairsName || ''}
              onChange={(e) => handleLeadershipChange('vicePrincipalAcademicAffairsName', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
              placeholder={lang === 'ar' ? 'أدخل اسم وكيل الشؤون التعليمية...' : 'Enter academic affairs vice principal name...'}
            />
          </div>
          <div>
            <label htmlFor="schoolleadershiptab-input-7" className="text-slate-600 block mb-1 flex items-center justify-between">
              <span>{lang === 'ar' ? 'رقم الجوال / التحويلة:' : 'Mobile Number / Extension:'}</span>
              <span className="font-mono text-[10px] text-indigo-600 font-normal" dir="ltr">{dialCode}</span>
            </label>
            <input id="schoolleadershiptab-input-7" name="schoolleadershiptab-input-7"
              type="text"
              disabled={disabled}
              value={leadership.vicePrincipalAcademicAffairsPhone || ''}
              onChange={(e) => handleLeadershipChange('vicePrincipalAcademicAffairsPhone', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
              placeholder={phonePlaceholder}
            />
          </div>
        </div>

        {/* Social Worker / Guidance Counselor */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <HeartHandshake className="w-4 h-4 text-rose-600" />
            <span>{lang === 'ar' ? 'الموجه الطلابي / الأخصائي الاجتماعي (متابعة الأعذار ورعاية الطلاب)' : 'Student Counselor / Social Worker (Excuse follow-up & student care)'}</span>
          </div>
          <div>
            <label htmlFor="schoolleadershiptab-input-8" className="text-slate-600 block mb-1">{lang === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}</label>
            <input id="schoolleadershiptab-input-8" name="schoolleadershiptab-input-8"
              type="text"
              disabled={disabled}
              value={leadership.socialWorkerName || ''}
              onChange={(e) => handleLeadershipChange('socialWorkerName', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
              placeholder={lang === 'ar' ? 'أدخل اسم الأخصائي الاجتماعي / الموجه...' : 'Enter social worker / counselor name...'}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="schoolleadershiptab-input-9" className="text-slate-600 block mb-1 flex items-center justify-between">
                <span>{lang === 'ar' ? 'رقم الجوال:' : 'Mobile Number:'}</span>
                <span className="font-mono text-[10px] text-indigo-600 font-normal" dir="ltr">{dialCode}</span>
              </label>
              <input id="schoolleadershiptab-input-9" name="schoolleadershiptab-input-9"
                type="text"
                disabled={disabled}
                value={leadership.socialWorkerPhone || ''}
                onChange={(e) => handleLeadershipChange('socialWorkerPhone', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                placeholder={phonePlaceholder}
              />
            </div>
            <div>
              <label htmlFor="schoolleadershiptab-input-10" className="text-slate-600 block mb-1">{lang === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</label>
              <input id="schoolleadershiptab-input-10" name="schoolleadershiptab-input-10"
                type="email"
                disabled={disabled}
                value={leadership.socialWorkerEmail || ''}
                onChange={(e) => handleLeadershipChange('socialWorkerEmail', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                placeholder="counselor@school.edu"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
