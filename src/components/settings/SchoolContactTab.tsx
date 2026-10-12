import React from 'react';
import { TenantSchoolProfile } from '../../types/attendance';
import { MapPin, Phone, Mail, Globe, AlertTriangle } from 'lucide-react';

interface Props {
  profile: TenantSchoolProfile;
  onChange: (updates: Partial<TenantSchoolProfile>) => void;
  disabled?: boolean;
}

export const SchoolContactTab: React.FC<Props> = ({ profile, onChange, disabled }) => {
  const address = profile.address || ({} as Partial<TenantSchoolProfile['address']>);

  const handleAddressChange = (key: string, value: string) => {
    onChange({
      address: {
        ...address,
        [key]: value,
      } as TenantSchoolProfile['address'],
    });
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="settings-group-header flex items-center justify-between p-3 rounded-xl border font-bold shadow-2xs">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="text-sm">العنوان الجغرافي وقنوات الاتصال والطوارئ الرسمية</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/40 border border-current">
          قنوات الاتصال المعتمدة
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-semibold text-slate-700 block mb-1">الدولة:</label>
          <input
            type="text"
            disabled={disabled}
            value={address.country || ''}
            onChange={(e) => handleAddressChange('country', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-emerald-500"
            placeholder="المملكة العربية السعودية"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">المنطقة الإدارية:</label>
          <input
            type="text"
            disabled={disabled}
            value={address.region || ''}
            onChange={(e) => handleAddressChange('region', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-emerald-500"
            placeholder="منطقة الرياض"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">المدينة / المحافظة:</label>
          <input
            type="text"
            disabled={disabled}
            value={address.city || ''}
            onChange={(e) => handleAddressChange('city', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-emerald-500"
            placeholder="الرياض"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">الحي:</label>
          <input
            type="text"
            disabled={disabled}
            value={address.district || ''}
            onChange={(e) => handleAddressChange('district', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-emerald-500"
            placeholder="حي الأندلس"
          />
        </div>

        <div className="md:col-span-2">
          <label className="font-semibold text-slate-700 block mb-1">الشارع والوصف التفصيلي:</label>
          <input
            type="text"
            disabled={disabled}
            value={address.streetAddress || ''}
            onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-emerald-500"
            placeholder="شارع خالد بن الوليد، مبنى رقم 42"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">الرمز البريدي:</label>
          <input
            type="text"
            disabled={disabled}
            value={address.postalCode || ''}
            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 focus:bg-white focus:border-emerald-500"
            placeholder="13214"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">هاتف المدرسة العام:</label>
          <input
            type="text"
            disabled={disabled}
            value={profile.generalPhone || ''}
            onChange={(e) => onChange({ generalPhone: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 focus:bg-white focus:border-emerald-500"
            placeholder="+966 11 456 7890"
          />
        </div>

        <div>
          <label className="font-semibold text-rose-700 block mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>خط طوارئ الإخلاء والسلامة:</span>
          </label>
          <input
            type="text"
            disabled={disabled}
            value={profile.emergencyHotline || ''}
            onChange={(e) => onChange({ emergencyHotline: e.target.value })}
            className="w-full bg-rose-50/50 border border-rose-300 rounded-lg p-2.5 font-mono font-bold text-rose-900 focus:bg-white focus:border-rose-500"
            placeholder="+966 50 123 4567"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">البريد الإلكتروني الرسمي:</label>
          <input
            type="email"
            disabled={disabled}
            value={profile.officialEmail || ''}
            onChange={(e) => onChange({ officialEmail: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 focus:bg-white focus:border-emerald-500"
            placeholder="info@school.edu.sa"
          />
        </div>

        <div className="md:col-span-2">
          <label className="font-semibold text-slate-700 block mb-1">الموقع الإلكتروني الرسمي للمدرسة:</label>
          <input
            type="url"
            disabled={disabled}
            value={profile.websiteUrl || ''}
            onChange={(e) => onChange({ websiteUrl: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 focus:bg-white focus:border-emerald-500"
            placeholder="https://school.edu.sa"
          />
        </div>
      </div>
    </div>
  );
};
