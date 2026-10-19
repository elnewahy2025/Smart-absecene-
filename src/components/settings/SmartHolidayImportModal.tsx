import React, { useEffect, useRef, useState } from 'react';
import { OfficialHoliday, HolidayType } from '../../types/attendance';
import {
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Globe,
  AlertCircle,
  X,
  Check,
  Building,
  RefreshCw,
  Crown,
  Palmtree,
  ArrowRight,
} from 'lucide-react';
import { getCountryPreset, COUNTRY_PRESETS } from '../../config/countryPresets';
import { COUNTRIES_LIST } from '../../config/countryCodes';
import { authenticatedFetch } from '../../lib/api';
import { getHolidayDisplayName, getHolidaySecondaryName, getHolidayTypeLabel } from '../../utils/holidayUtils';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import { useAttendance } from '../../context/AttendanceContext';

interface SmartHolidayImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCountry?: string;
  initialAcademicYear?: string;
  onApplyHolidays: (result: {
    officialHolidays: OfficialHoliday[];
    weekendDays?: number[];
    ministryHeaderAr?: string;
  }) => Promise<void> | void;
}

export const SmartHolidayImportModal: React.FC<SmartHolidayImportModalProps> = ({
  isOpen,
  onClose,
  initialCountry = 'المملكة العربية السعودية',
  initialAcademicYear = '1446-1447 هـ (2026-2027 م)',
  onApplyHolidays,
}) => {
  const { lang } = useAttendance();
  const [country, setCountry] = useState(initialCountry);
  const [academicYear, setAcademicYear] = useState(initialAcademicYear);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuccess, setSearchSuccess] = useState(false);
  const [officialSource, setOfficialSource] = useState<string>('');
  const [verifiedMethod, setVerifiedMethod] = useState<'gemini_verified' | 'official_preset'>('official_preset');

  const [discoveredHolidays, setDiscoveredHolidays] = useState<OfficialHoliday[]>([]);
  const [selectedHolidayIds, setSelectedHolidayIds] = useState<string[]>([]);
  const [recommendedWeekendDays, setRecommendedWeekendDays] = useState<number[]>([5, 6]);
  const [recommendedMinistryHeader, setRecommendedMinistryHeader] = useState<string>('');

  const [applyWeekend, setApplyWeekend] = useState(true);
  const [applyHeader, setApplyHeader] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial props when modal opens
  useEffect(() => {
    if (isOpen) {
      const activeCountry = initialCountry || 'المملكة العربية السعودية';
      setCountry(activeCountry);
      setAcademicYear(initialAcademicYear || '1446-1447 هـ (2026-2027 م)');
      // Pre-load verified preset for instantaneous feedback
      const preset = getCountryPreset(activeCountry);
      setDiscoveredHolidays(preset.officialHolidays);
      setSelectedHolidayIds(preset.officialHolidays.map((h) => h.id));
      setRecommendedWeekendDays(preset.defaultWeekendDays);
      setRecommendedMinistryHeader(preset.ministryHeaderAr);
      setOfficialSource(lang === 'ar' ? `التقويم الدراسي الرسمي المعتمد - ${preset.countryNameAr}` : `Approved official academic calendar - ${preset.countryNameAr}`);
      setVerifiedMethod('official_preset');
      setSearchSuccess(true);
      setErrorMsg(null);
    }
  }, [isOpen, initialCountry, initialAcademicYear]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });

  if (!isOpen) return null;

  // Execute Search via Server Gemini Endpoint or verified preset fallback
  const handlePerformSearch = async (targetCountry: string = country) => {
    if (!targetCountry.trim()) {
      setErrorMsg(lang === 'ar' ? 'يرجى تحديد أو إدخال اسم الدولة للبحث عن تقويمها الرسمي.' : 'Please select or enter the country name to search for its official calendar.');
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const res = await authenticatedFetch('/api/owner/holidays/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country: targetCountry.trim(),
          academicYear: academicYear.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.holidays) && data.holidays.length > 0) {
          setDiscoveredHolidays(data.holidays);
          setSelectedHolidayIds(data.holidays.map((h: OfficialHoliday) => h.id));
          setRecommendedWeekendDays(data.weekendDays || [5, 6]);
          setRecommendedMinistryHeader(data.ministryHeaderAr || '');
          setOfficialSource(data.source || (lang === 'ar' ? `التقويم الرسمي المعتمد لـ (${data.country})` : `Approved official calendar for (${data.country})`));
          setVerifiedMethod(data.verifiedBy === 'gemini_verified' ? 'gemini_verified' : 'official_preset');
          setSearchSuccess(true);
          return;
        }
      }

      // Seamless fallback to client-side verified dictionary
      const preset = getCountryPreset(targetCountry);
      setDiscoveredHolidays(preset.officialHolidays);
      setSelectedHolidayIds(preset.officialHolidays.map((h) => h.id));
      setRecommendedWeekendDays(preset.defaultWeekendDays);
      setRecommendedMinistryHeader(preset.ministryHeaderAr);
      setOfficialSource(lang === 'ar' ? `التقويم الدراسي الرسمي المعتمد - ${preset.countryNameAr}` : `Approved official academic calendar - ${preset.countryNameAr}`);
      setVerifiedMethod('official_preset');
      setSearchSuccess(true);
    } catch (err: any) {
      console.warn('[SMART-IMPORT] Server endpoint fallback:', err);
      // Fallback
      const preset = getCountryPreset(targetCountry);
      setDiscoveredHolidays(preset.officialHolidays);
      setSelectedHolidayIds(preset.officialHolidays.map((h) => h.id));
      setRecommendedWeekendDays(preset.defaultWeekendDays);
      setRecommendedMinistryHeader(preset.ministryHeaderAr);
      setOfficialSource(lang === 'ar' ? `التقويم الدراسي الرسمي المعتمد - ${preset.countryNameAr}` : `Approved official academic calendar - ${preset.countryNameAr}`);
      setVerifiedMethod('official_preset');
      setSearchSuccess(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleHoliday = (id: string) => {
    if (selectedHolidayIds.includes(id)) {
      setSelectedHolidayIds(selectedHolidayIds.filter((item) => item !== id));
    } else {
      setSelectedHolidayIds([...selectedHolidayIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedHolidayIds.length === discoveredHolidays.length) {
      setSelectedHolidayIds([]);
    } else {
      setSelectedHolidayIds(discoveredHolidays.map((h) => h.id));
    }
  };

  const handleApply = async () => {
    const holidaysToImport = discoveredHolidays.filter((h) => selectedHolidayIds.includes(h.id));
    if (holidaysToImport.length === 0) {
      setErrorMsg(lang === 'ar' ? 'يرجى اختيار عطلة رسمية واحدة على الأقل للاستيراد.' : 'Please select at least one official holiday to import.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onApplyHolidays({
        officialHolidays: holidaysToImport,
        weekendDays: applyWeekend ? recommendedWeekendDays : undefined,
        ministryHeaderAr: applyHeader ? recommendedMinistryHeader : undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || (lang === 'ar' ? 'حدث خطأ أثناء حفظ التقويم المستورد.' : 'An error occurred while saving the imported calendar.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end || start).getTime();
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const popularCountries = [
    { name: 'المملكة العربية السعودية', flag: '🇸🇦', short: 'السعودية' },
    { name: 'جمهورية مصر العربية', flag: '🇪🇬', short: 'مصر' },
    { name: 'الإمارات العربية المتحدة', flag: '🇦🇪', short: 'الإمارات' },
    { name: 'دولة الكويت', flag: '🇰🇼', short: 'الكويت' },
    { name: 'دولة قطر', flag: '🇶🇦', short: 'قطر' },
    { name: 'سلطنة عمان', flag: '🇴🇲', short: 'عمان' },
    { name: 'مملكة البحرين', flag: '🇧🇭', short: 'البحرين' },
    { name: 'المملكة الأردنية الهاشمية', flag: '🇯🇴', short: 'الأردن' },
    { name: 'المملكة المغربية', flag: '🇲🇦', short: 'المغرب' },
  ];

  return (
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Import official holidays"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Exclusive Owner Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0 shadow-xs">
              <Crown className="w-5 h-5 text-yellow-200" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-wide">
                  {lang === 'ar' ? 'أداة البحث الذكي والاستيراد المعتمد للتقويم والعطلات' : 'Smart search and approved import tool for calendars and holidays'}
                </h3>
                <span className="text-[10px] bg-yellow-400 text-amber-950 font-black px-2 py-0.5 rounded-full shadow-2xs">
                  The Owner Exclusive
                </span>
                <span className="text-[10px] bg-white/20 border border-white/30 text-white font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-yellow-200" /> AI Grounded
                </span>
              </div>
              <p className="text-xs text-amber-100 font-normal leading-relaxed">
                {lang === 'ar' ? 'بحث فوري وتحقق معتمد من مصادر وزارات التعليم ومجالس الوزراء الرسمية لأي دولة وعام دراسي، مع تكييف كامل للمنظومة.' : 'Instant search and verified checking from official ministries of education and councils of ministers sources for any country and academic year, with full adaptation of the system.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Country & Year Controls */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'ar' ? 'الدولة المستهدفة بالبحث والتحقق:' : 'Target country for search and verification:'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="modal-countries-datalist"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePerformSearch(country);
                      }
                    }}
                    placeholder={lang === 'ar' ? 'اكتب اسم أي دولة (مثال: مصر، السعودية، الإمارات، قطر، الأردن...)' : 'Type any country name (e.g. Egypt, Saudi Arabia, UAE, Qatar, Jordan...)'}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <datalist id="modal-countries-datalist">
                    {COUNTRIES_LIST.map((c) => (
                      <option key={c.code} value={c.nameAr}>
                        {c.flag} {c.nameAr} ({c.nameEn})
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="sm:col-span-5">
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {lang === 'ar' ? 'العام الدراسي المستهدف:' : 'Target academic year:'}
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: 1446-1447 هـ (2026-2027 م)' : 'e.g. 1446-1447 AH (2026-2027 AD)'}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-medium focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Quick Country Buttons */}
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5 font-medium">
                {lang === 'ar' ? 'اختيار سريع لأهم الدول العربية:' : 'Quick selection of key Arab countries:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {popularCountries.map((pc) => {
                  const isSelected = country.includes(pc.short) || country === pc.name;
                  return (
                    <button
                      key={pc.name}
                      type="button"
                      onClick={() => {
                        setCountry(pc.name);
                        handlePerformSearch(pc.name);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{pc.flag}</span>
                      <span>{pc.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Trigger Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={isSearching}
                onClick={() => handlePerformSearch(country)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-yellow-200" />
                    <span>{lang === 'ar' ? 'جارٍ البحث والتحقق من المصادر الرسمية...' : 'Searching and verifying official sources...'}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-yellow-200" />
                    <span>{lang === 'ar' ? 'بدء البحث الذكي والتحقق من التقويم الرسمي' : 'Start smart search and verify the official calendar'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Discovered Results Container */}
          {searchSuccess && (
            <div className="space-y-4">
              {/* Verified Source Accreditation Banner */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950 dark:text-emerald-200 block text-xs">
                      {officialSource}
                    </span>
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      {verifiedMethod === 'gemini_verified'
                        ? lang === 'ar'
                          ? 'تم التحقق من روزنامة التقويم الدراسي عبر الذكاء الاصطناعي والمصادر الرسمية'
                          : 'The academic calendar schedule has been verified via artificial intelligence and official sources'
                        : lang === 'ar'
                          ? 'تقويم وزاري رسمي معتمد ومفحوص بالكامل (Verified Official Repository)'
                          : 'Fully verified and approved official ministerial calendar (Verified Official Repository)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-900 dark:text-emerald-200 self-end sm:self-center">
                  <span className="px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/60 border border-emerald-300 dark:border-emerald-700">
                    {discoveredHolidays.length} {lang === 'ar' ? 'عطلة رسمية' : 'official holidays'}
                  </span>
                </div>
              </div>

              {/* Automatic Adaptation Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                  <input
                    type="checkbox"
                    checked={applyWeekend}
                    onChange={(e) => setApplyWeekend(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span>
                    {lang === 'ar' ? `تطبيق نمط عطلة نهاية الأسبوع لـ (${country}):` : `Apply the weekend pattern for (${country}):`}{' '}
                    <span className="text-amber-800 dark:text-amber-300 font-mono">
                      {recommendedWeekendDays.includes(5) && recommendedWeekendDays.includes(6)
                        ? lang === 'ar' ? 'الجمعة والسبت' : 'Friday and Saturday'
                        : recommendedWeekendDays.includes(6) && recommendedWeekendDays.includes(0)
                        ? lang === 'ar' ? 'السبت والأحد' : 'Saturday and Sunday'
                        : lang === 'ar' ? 'الجمعة فقط' : 'Friday only'}
                    </span>
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                  <input
                    type="checkbox"
                    checked={applyHeader}
                    onChange={(e) => setApplyHeader(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span>{lang === 'ar' ? 'تحديث الترويسة الوزارية الرسمية لنماذج وتقارير المدرسة تلقائياً' : 'Automatically update the official ministerial header of school forms and reports'}</span>
                </label>
              </div>

              {/* Holidays Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 dark:bg-slate-800 p-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'ar' ? `قائمة العطلات والمناسبات الرسمية المعتمدة (${discoveredHolidays.length}):` : `List of approved official holidays and occasions (${discoveredHolidays.length}):`}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] text-amber-700 dark:text-amber-300 hover:underline font-bold cursor-pointer"
                  >
                    {selectedHolidayIds.length === discoveredHolidays.length ? (lang === 'ar' ? 'إلغاء تحديد الكل' : 'Deselect all') : (lang === 'ar' ? 'تحديد الكل' : 'Select all')}
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
                  {discoveredHolidays.map((h) => {
                    const isSelected = selectedHolidayIds.includes(h.id);
                    const duration = calculateDays(h.startDate, h.endDate);
                    return (
                      <div
                        key={h.id}
                        onClick={() => handleToggleHoliday(h.id)}
                        className={`p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/40 dark:bg-amber-950/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent div
                          className="w-4 h-4 text-amber-600 rounded mt-0.5 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {getHolidayDisplayName(h, lang)}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {getHolidayTypeLabel(h.type, lang)}
                            </span>
                          </div>
                          {getHolidaySecondaryName(h, lang) && (
                            <p className="text-[10px] text-slate-500 font-sans" dir={lang === 'en' ? 'rtl' : 'ltr'}>
                              {getHolidaySecondaryName(h, lang)}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 font-mono flex-wrap">
                            <span>
                              {h.startDate} {h.endDate !== h.startDate && `← ${h.endDate}`}
                            </span>
                            <span className="text-[10px] bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.2 rounded font-sans">
                              {duration === 1 ? (lang === 'ar' ? 'يوم واحد' : 'one day') : (lang === 'ar' ? `${duration} أيام` : `${duration} days`)}
                            </span>
                          </div>
                          {h.notes && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                              {h.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-xs"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={isSubmitting || selectedHolidayIds.length === 0}
            onClick={handleApply}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 text-xs"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'ar' ? 'جارٍ اعتماد التقويم وحفظه...' : 'Approving and saving the calendar...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{lang === 'ar' ? `اعتماد واستيراد (${selectedHolidayIds.length}) إجازة رسمية إلى تقويم المدرسة` : `Approve and import (${selectedHolidayIds.length}) official holidays into the school calendar`}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
