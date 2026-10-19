import React from 'react';
import { TenantSchoolProfile } from '../../types/attendance';
import { MapPin, Phone, Mail, Globe, AlertTriangle, Flag } from 'lucide-react';
import {
  COUNTRIES_LIST,
  findCountryByName,
  getCallingCodeForCountry,
  cleanDialCode,
  CountryInfo,
} from '../../config/countryCodes';
import { getCountryPreset } from '../../config/countryPresets';
import { useAttendance } from '../../context/AttendanceContext';

interface Props {
  profile: TenantSchoolProfile;
  onChange: (updates: Partial<TenantSchoolProfile>) => void;
  disabled?: boolean;
}

export const SchoolContactTab: React.FC<Props> = ({ profile, onChange, disabled }) => {
  const { lang } = useAttendance();
  const address = profile.address || ({} as Partial<TenantSchoolProfile['address']>);
  const currentCountry = address.country || profile.address?.country || 'المملكة العربية السعودية';
  const preset = getCountryPreset(currentCountry);
  const currentDialCode =
    profile.countryCallingCode ||
    address.countryCallingCode ||
    preset.callingCode ||
    getCallingCodeForCountry(currentCountry, '+966');

  const matchedCountry: CountryInfo | undefined = findCountryByName(currentCountry);

  const handleCountryChange = (countryName: string) => {
    const matched = findCountryByName(countryName);
    const newDialCode = matched ? matched.dialCode : currentDialCode;

    onChange({
      countryCallingCode: newDialCode,
      address: {
        ...address,
        country: countryName,
        countryCallingCode: newDialCode,
      } as TenantSchoolProfile['address'],
    });
  };

  const handleDialCodeChange = (rawCode: string) => {
    const formatted = rawCode.startsWith('+') ? rawCode : `+${rawCode.replace(/[^\d]/g, '')}`;
    onChange({
      countryCallingCode: formatted,
      address: {
        ...address,
        countryCallingCode: formatted,
      } as TenantSchoolProfile['address'],
    });
  };

  const handleAddressChange = (key: string, value: string) => {
    onChange({
      address: {
        ...address,
        [key]: value,
      } as TenantSchoolProfile['address'],
    });
  };

  return (
    <div className="space-y-4 text-xs font-['Cairo',sans-serif]">
      {/* Header Banner */}
      <div className="settings-group-header flex items-center justify-between p-3 rounded-xl border font-bold shadow-2xs">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="text-sm">{lang === 'ar' ? 'العنوان الجغرافي، الدولة، وقنوات الاتصال الرسمية' : 'Geographic Address, Country & Official Contact Channels'}</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/40 border border-current">
          {lang === 'ar' ? 'صالح لجميع الدول العربية والعالمية' : 'Valid for all Arab and international countries'}
        </span>
      </div>

      {/* Country & Calling Code Section */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{lang === 'ar' ? 'بيانات الدولة ومفتاح الاتصال الدولي (International Country & Dial Code)' : 'Country Data & International Dial Code'}</span>
          </div>
          {matchedCountry && (
            <span className="text-sm flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
              <span className="text-base">{matchedCountry.flag}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 text-[11px]">{matchedCountry.nameEn}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Country Name */}
          <div className="lg:col-span-2">
            <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
              {lang === 'ar' ? 'اسم الدولة (قابلة للاختيار أو الكتابة الحرة لأي دولة):' : 'Country Name (select or type freely for any country):'}
            </label>
            <div className="relative">
              <input
                type="text"
                list="countries-datalist"
                disabled={disabled}
                value={address.country || ''}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder={lang === 'ar' ? 'اختر أو اكتب اسم الدولة (مثال: المملكة العربية السعودية، مصر، الإمارات...)' : 'Select or type the country name (e.g., Saudi Arabia, Egypt, UAE...)'}
              />
              <datalist id="countries-datalist">
                {COUNTRIES_LIST.map((c) => (
                  <option key={c.code} value={c.nameAr}>
                    {c.flag} {c.nameAr} ({c.nameEn}) {c.dialCode}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          {/* International Dial Code */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-200 block mb-1 flex items-center justify-between">
              <span>{lang === 'ar' ? 'الكود الدولي للاتصال:' : 'International Dial Code:'}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">{lang === 'ar' ? 'قابل للتعديل' : 'Editable'}</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                disabled={disabled}
                value={currentDialCode}
                onChange={(e) => handleDialCodeChange(e.target.value)}
                dir="ltr"
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-left focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="+966"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Address Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? preset.regionLabelAr : 'Administrative Region:'}</label>
          <input
            type="text"
            disabled={disabled}
            value={address.region || ''}
            onChange={(e) => handleAddressChange('region', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={lang === 'ar' ? preset.regionPlaceholderAr : 'Region / governorate / province'}
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'المدينة:' : 'City:'}</label>
          <input
            type="text"
            disabled={disabled}
            value={address.city || ''}
            onChange={(e) => handleAddressChange('city', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={lang === 'ar' ? preset.cityPlaceholderAr : 'City / town'}
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'الحي / المنطقة السكنية:' : 'District / Residential Area:'}</label>
          <input
            type="text"
            disabled={disabled}
            value={address.district || ''}
            onChange={(e) => handleAddressChange('district', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={lang === 'ar' ? preset.districtPlaceholderAr : 'District / neighborhood'}
          />
        </div>

        <div className="md:col-span-2">
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'الشارع والوصف التفصيلي:' : 'Street & Detailed Description:'}</label>
          <input
            type="text"
            disabled={disabled}
            value={address.streetAddress || ''}
            onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={lang === 'ar' ? 'اسم الشارع، رقم المبنى، والمعلم المجاور' : 'Street name, building number, and nearby landmark'}
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'الرمز البريدي (Postal Code):' : 'Postal Code:'}</label>
          <input
            type="text"
            disabled={disabled}
            value={address.postalCode || ''}
            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder={preset.postalCodePlaceholder}
          />
        </div>

        {/* General School Phone */}
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
            <span>{lang === 'ar' ? 'هاتف المدرسة العام:' : 'General School Phone:'}</span>
            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400" dir="ltr">
              {lang === 'ar' ? `كود الدولة: ${currentDialCode}` : `Country code: ${currentDialCode}`}
            </span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute right-3 font-mono text-xs text-slate-400 dark:text-slate-500 select-none" dir="ltr">
              {currentDialCode}
            </span>
            <input
              type="text"
              disabled={disabled}
              value={profile.generalPhone || ''}
              onChange={(e) => onChange({ generalPhone: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 pr-14 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
              placeholder={preset.phoneExample}
            />
          </div>
        </div>

        {/* Emergency Hotline */}
        <div>
          <label className="font-semibold text-rose-700 dark:text-rose-400 block mb-1 flex items-center gap-1 justify-between">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'خط طوارئ الإخلاء والسلامة:' : 'Evacuation & Safety Emergency Line:'}</span>
            </span>
            <span className="font-mono text-[10px] text-rose-500 dark:text-rose-400 font-normal" dir="ltr">
              {currentDialCode}
            </span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute right-3 font-mono text-xs text-rose-400 select-none" dir="ltr">
              {currentDialCode}
            </span>
            <input
              type="text"
              disabled={disabled}
              value={profile.emergencyHotline || ''}
              onChange={(e) => onChange({ emergencyHotline: e.target.value })}
              className="w-full bg-rose-50/50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-lg p-2.5 pr-14 font-mono font-bold text-rose-900 dark:text-rose-200 focus:bg-white dark:focus:bg-slate-800 focus:border-rose-500"
              placeholder={`${currentDialCode} 50 123 4567`}
            />
          </div>
        </div>

        {/* Official Email */}
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'البريد الإلكتروني الرسمي:' : 'Official Email:'}</label>
          <input
            type="email"
            disabled={disabled}
            value={profile.officialEmail || ''}
            onChange={(e) => onChange({ officialEmail: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder="info@school-portal.com"
          />
        </div>

        {/* Website URL */}
        <div className="md:col-span-3">
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{lang === 'ar' ? 'الموقع الإلكتروني الرسمي للمدرسة:' : 'Official School Website:'}</label>
          <input
            type="url"
            disabled={disabled}
            value={profile.websiteUrl || ''}
            onChange={(e) => onChange({ websiteUrl: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500"
            placeholder="https://school-portal.com"
          />
        </div>
      </div>
    </div>
  );
};
