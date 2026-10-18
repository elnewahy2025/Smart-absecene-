import React from 'react';
import { TenantSchoolProfile } from '../../types/attendance';
import { Users, UserCheck, ShieldAlert, HeartHandshake } from 'lucide-react';

interface Props {
  profile: TenantSchoolProfile;
  onChange: (updates: Partial<TenantSchoolProfile>) => void;
  disabled?: boolean;
}

export const SchoolLeadershipTab: React.FC<Props> = ({ profile, onChange, disabled }) => {
  const leadership = profile.leadership || ({} as Partial<TenantSchoolProfile['leadership']>);
  const dialCode = profile.countryCallingCode || profile.address?.countryCallingCode || '+966';

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
          <span className="text-sm">الهيئة القيادية والإشرافية المعتمدة (توقيعات التقارير الرسمية)</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/40 border border-current">
          الاعتماد والمسؤولية
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Principal */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <UserCheck className="w-4 h-4 text-slate-700" />
            <span>مدير / مديرة المدرسة</span>
          </div>
          <div>
            <label className="text-slate-600 block mb-1">الاسم الكامل:</label>
            <input
              type="text"
              disabled={disabled}
              value={leadership.principalName || ''}
              onChange={(e) => handleLeadershipChange('principalName', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
              placeholder="أ. عبد الرحمن السعدي"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-600 block mb-1 flex items-center justify-between">
                <span>رقم الجوال:</span>
                <span className="font-mono text-[10px] text-indigo-600 font-normal" dir="ltr">{dialCode}</span>
              </label>
              <input
                type="text"
                disabled={disabled}
                value={leadership.principalPhone || ''}
                onChange={(e) => handleLeadershipChange('principalPhone', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                placeholder={`${dialCode} 50 111 2233`}
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1">البريد الإلكتروني:</label>
              <input
                type="email"
                disabled={disabled}
                value={leadership.principalEmail || ''}
                onChange={(e) => handleLeadershipChange('principalEmail', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                placeholder="principal@school.edu.sa"
              />
            </div>
          </div>
        </div>

        {/* Vice Principal - Student Affairs */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldAlert className="w-4 h-4 text-indigo-600" />
            <span>وكيل شؤون الطلاب (المسؤول المباشر عن الغياب والانضباط)</span>
          </div>
          <div>
            <label className="text-slate-600 block mb-1">الاسم الكامل:</label>
            <input
              type="text"
              disabled={disabled}
              value={leadership.vicePrincipalStudentAffairsName || ''}
              onChange={(e) => handleLeadershipChange('vicePrincipalStudentAffairsName', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
              placeholder="أ. فهد بن إبراهيم المنصور"
            />
          </div>
          <div>
            <label className="text-slate-600 block mb-1 flex items-center justify-between">
              <span>رقم الجوال / التحويلة:</span>
              <span className="font-mono text-[10px] text-indigo-600 font-normal" dir="ltr">{dialCode}</span>
            </label>
            <input
              type="text"
              disabled={disabled}
              value={leadership.vicePrincipalStudentAffairsPhone || ''}
              onChange={(e) => handleLeadershipChange('vicePrincipalStudentAffairsPhone', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
              placeholder={`${dialCode} 50 222 3344`}
            />
          </div>
        </div>

        {/* Vice Principal - Academic Affairs */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>وكيل الشؤون التعليمية والمدرسية (الجداول والحصص)</span>
          </div>
          <div>
            <label className="text-slate-600 block mb-1">الاسم الكامل:</label>
            <input
              type="text"
              disabled={disabled}
              value={leadership.vicePrincipalAcademicAffairsName || ''}
              onChange={(e) => handleLeadershipChange('vicePrincipalAcademicAffairsName', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
              placeholder="أ. سلطان بن خالد القحطاني"
            />
          </div>
          <div>
            <label className="text-slate-600 block mb-1 flex items-center justify-between">
              <span>رقم الجوال / التحويلة:</span>
              <span className="font-mono text-[10px] text-indigo-600 font-normal" dir="ltr">{dialCode}</span>
            </label>
            <input
              type="text"
              disabled={disabled}
              value={leadership.vicePrincipalAcademicAffairsPhone || ''}
              onChange={(e) => handleLeadershipChange('vicePrincipalAcademicAffairsPhone', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
              placeholder={`${dialCode} 50 333 4455`}
            />
          </div>
        </div>

        {/* Social Worker / Guidance Counselor */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <HeartHandshake className="w-4 h-4 text-rose-600" />
            <span>الموجه الطلابي / الأخصائي الاجتماعي (متابعة الأعذار ورعاية الطلاب)</span>
          </div>
          <div>
            <label className="text-slate-600 block mb-1">الاسم الكامل:</label>
            <input
              type="text"
              disabled={disabled}
              value={leadership.socialWorkerName || ''}
              onChange={(e) => handleLeadershipChange('socialWorkerName', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
              placeholder="أ. ماجد بن عبد العزيز التميمي"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-600 block mb-1 flex items-center justify-between">
                <span>رقم الجوال:</span>
                <span className="font-mono text-[10px] text-indigo-600 font-normal" dir="ltr">{dialCode}</span>
              </label>
              <input
                type="text"
                disabled={disabled}
                value={leadership.socialWorkerPhone || ''}
                onChange={(e) => handleLeadershipChange('socialWorkerPhone', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                placeholder={`${dialCode} 50 444 5566`}
              />
            </div>
            <div>
              <label className="text-slate-600 block mb-1">البريد الإلكتروني:</label>
              <input
                type="email"
                disabled={disabled}
                value={leadership.socialWorkerEmail || ''}
                onChange={(e) => handleLeadershipChange('socialWorkerEmail', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                placeholder="counselor@school.edu.sa"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
