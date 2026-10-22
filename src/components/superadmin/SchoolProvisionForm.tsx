import React, { useState } from 'react';
import { Building2, Sparkles, Palette, Globe, User } from 'lucide-react';
import { SchoolProvisionInput } from '../../types/attendance';
import { COUNTRIES_LIST, findCountryByName } from '../../config/countryCodes';

interface SchoolProvisionFormProps {
  onProvision: (input: SchoolProvisionInput) => Promise<{ success: boolean; message: string }>;
  onProvisioned: (message: string) => void;
  onError: (message: string) => void;
  onCancel: () => void;
}

const PRESET_COLORS = [
  { name: 'Emerald (الأندلس)', value: '#059669' },
  { name: 'Royal Blue (الفلاح)', value: '#2563eb' },
  { name: 'Purple (الريادة)', value: '#7c3aed' },
  { name: 'Amber (التميز)', value: '#d97706' },
  { name: 'Rose (الفرسان)', value: '#e11d48' },
  { name: 'Indigo (النخبة)', value: '#4f46e5' },
  { name: 'Teal (المستقبل)', value: '#0d9488' },
  { name: 'Slate (الدولية)', value: '#475569' },
];

export const SchoolProvisionForm: React.FC<SchoolProvisionFormProps> = ({
  onProvision,
  onProvisioned,
  onError,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);

  const [schoolId, setSchoolId] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [code, setCode] = useState('');
  const [countryAr, setCountryAr] = useState('المملكة العربية السعودية');
  const [countryCallingCode, setCountryCallingCode] = useState('+966');
  const [cityAr, setCityAr] = useState('الرياض');
  const [cityEn, setCityEn] = useState('Riyadh');
  const [subdomain, setSubdomain] = useState('');
  const [schoolType, setSchoolType] = useState<'boys' | 'girls' | 'mixed'>('boys');
  const [academicYear, setAcademicYear] = useState('1447-1448 هـ / 2026 م');
  const [primaryColor, setPrimaryColor] = useState('#7c3aed');
  const [logoText, setLogoText] = useState('');

  // Initial Principal credentials
  const [principalName, setPrincipalName] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');
  const [principalPhone, setPrincipalPhone] = useState('');

  const handleSubdomainChange = (val: string) => {
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(sanitized);
    if (!schoolId) {
      setSchoolId(`school-${sanitized}`);
    }
    if (!principalEmail && sanitized) {
      setPrincipalEmail(`principal@${sanitized}-school.edu.sa`);
    }
  };

  const handleNameArChange = (val: string) => {
    setNameAr(val);
    if (!logoText && val.trim().length > 0) {
      setLogoText(val.trim().charAt(0));
    }
  };

  const handleCountryChange = (val: string) => {
    setCountryAr(val);
    const matched = findCountryByName(val);
    if (matched) {
      setCountryCallingCode(matched.dialCode);
      if (!principalPhone || principalPhone.includes('500000000')) {
        setPrincipalPhone(`${matched.dialCode}500000000`);
      }
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalId = schoolId.trim() || `school-${Date.now()}`;
      const input: SchoolProvisionInput = {
        id: finalId,
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || nameAr.trim(),
        code: code.trim().toUpperCase() || `SCH-${Date.now().toString().slice(-4)}`,
        countryAr: countryAr.trim(),
        countryCallingCode: countryCallingCode.trim() || '+966',
        cityAr: cityAr.trim(),
        cityEn: cityEn.trim() || 'Saudi Arabia',
        subdomain: subdomain.trim(),
        schoolType,
        academicYear,
        primaryColor,
        logoText: logoText.trim() || nameAr.trim().charAt(0) || 'م',
        principalName: principalName.trim(),
        principalEmail: principalEmail.trim().toLowerCase(),
        principalPhone: principalPhone.trim(),
      };

      const result = await onProvision(input);
      if (result.success) {
        onProvisioned(result.message);
        // Reset form
        setNameAr('');
        setNameEn('');
        setCode('');
        setSubdomain('');
        setSchoolId('');
        setCountryAr('المملكة العربية السعودية');
        setCountryCallingCode('+966');
        setPrincipalName('');
        setPrincipalEmail('');
      } else {
        onError(result.message || 'فشل تأسيس المدرسة.');
      }
    } catch (err: any) {
      onError(err?.message || 'حدث خطأ أثناء تأسيس المدرسة.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            تأسيس مدرسة جديدة ينشئ فورياً بيئة معزولة بنسبة 100% مع إعدادات تقويمها وفصولها، وينشئ حساب مدير المدرسة بكلمة مروره الخاصة للبدء فوراً.
          </span>
        </div>

        {/* Section 1: School Identity */}
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>1. بيانات وهوية المدرسة الجديدة</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">اسم المدرسة باللغة العربية *</label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={(e) => handleNameArChange(e.target.value)}
                placeholder="مثال: مدرسة المجد الثانوية الأهلية"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">اسم المدرسة بالإنجليزية</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="Al-Majd Model High School"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">رمز المدرسة الوزاري / الكود *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="MAJD-303"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">اسم الدولة *</label>
              <input
                type="text"
                list="provision-countries-datalist"
                required
                value={countryAr}
                onChange={(e) => handleCountryChange(e.target.value)}
                placeholder="المملكة العربية السعودية / مصر / الإمارات..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <datalist id="provision-countries-datalist">
                {COUNTRIES_LIST.map((c) => (
                  <option key={c.code} value={c.nameAr}>
                    {c.flag} {c.nameAr} ({c.dialCode})
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>الكود الدولي للاتصال *</span>
                <span className="text-[10px] text-amber-400 font-mono">قابل للتعديل</span>
              </label>
              <input
                type="text"
                required
                value={countryCallingCode}
                onChange={(e) => setCountryCallingCode(e.target.value)}
                placeholder="+966"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-left"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">المدينة *</label>
              <input
                type="text"
                required
                value={cityAr}
                onChange={(e) => setCityAr(e.target.value)}
                placeholder="الرياض / مكة / الدمام / القاهرة"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">نوع المدرسة *</label>
              <select
                value={schoolType}
                onChange={(e) => setSchoolType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="boys">بنين (Boys)</option>
                <option value="girls">بنات (Girls)</option>
                <option value="mixed">مشترك / طفولة مبكرة (Mixed)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">العام الدراسي</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Subdomain & Routing */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>2. النطاق والعزل السحابي (Subdomain)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">النطاق الفرعي (Subdomain slug) *</label>
              <div className="flex items-center">
                <input
                  type="text"
                  required
                  value={subdomain}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                  placeholder="majd"
                  className="w-full bg-slate-800 border border-slate-700 rounded-r-xl px-3 py-2 text-xs text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden text-left"
                  dir="ltr"
                />
                <span className="bg-slate-700 border border-l-0 border-slate-600 px-2 py-2 text-[11px] text-slate-300 font-mono rounded-l-xl">
                  .smartschool.com
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">معرّف المدرسة البرمجي (Tenant ID)</label>
              <input
                type="text"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                placeholder="school-majd"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Branding */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            <span>3. السمة واللون المميز للمدرسة</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((col) => (
              <button
                key={col.value}
                type="button"
                onClick={() => setPrimaryColor(col.value)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  primaryColor === col.value
                    ? 'border-white text-white shadow-md ring-1 ring-white'
                    : 'border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.value }} />
                <span>{col.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 4: Initial School Principal */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>4. بيانات مدير المدرسة الجديد (حساب المدير الأول)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">اسم مدير المدرسة *</label>
              <input
                type="text"
                required
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                placeholder="أ. عبد العزيز بن إبراهيم السعدي"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">البريد الإلكتروني لتسجيل الدخول *</label>
              <input
                type="email"
                required
                value={principalEmail}
                onChange={(e) => setPrincipalEmail(e.target.value)}
                placeholder="principal@majd-school.edu.sa"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>رقم جوال المدير:</span>
                <span className="font-mono text-[10px] text-amber-400 font-normal" dir="ltr">{countryCallingCode}</span>
              </label>
              <input
                type="tel"
                value={principalPhone}
                onChange={(e) => setPrincipalPhone(e.target.value)}
                placeholder={`${countryCallingCode}501112233`}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>تأسيس وتشغيل المدرسة فورياً</span>
          </button>
        </div>
      </form>
  );
};
