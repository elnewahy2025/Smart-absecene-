import React, { useState } from 'react';
import { OfficialHoliday, HolidayType } from '../../types/attendance';
import {
  Calendar,
  Palmtree,
  Plus,
  Trash2,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  CalendarOff,
  Sparkles,
  Info,
  Clock,
} from 'lucide-react';
import {
  DEFAULT_WEEKEND_DAYS,
  DEFAULT_OFFICIAL_HOLIDAYS,
  getHolidayTypeLabel,
} from '../../utils/holidayUtils';

interface Props {
  weekendDays?: number[];
  officialHolidays?: OfficialHoliday[];
  onChange: (updates: { weekendDays?: number[]; officialHolidays?: OfficialHoliday[] }) => void;
  onAutoSave?: (updates: { weekendDays?: number[]; officialHolidays?: OfficialHoliday[] }) => Promise<void> | void;
  disabled?: boolean;
}

const WEEK_DAYS = [
  { index: 0, nameAr: 'الأحد', nameEn: 'Sunday' },
  { index: 1, nameAr: 'الإثنين', nameEn: 'Monday' },
  { index: 2, nameAr: 'الثلاثاء', nameEn: 'Tuesday' },
  { index: 3, nameAr: 'الأربعاء', nameEn: 'Wednesday' },
  { index: 4, nameAr: 'الخميس', nameEn: 'Thursday' },
  { index: 5, nameAr: 'الجمعة', nameEn: 'Friday' },
  { index: 6, nameAr: 'السبت', nameEn: 'Saturday' },
];

export const HolidaysAndWeekendsCard: React.FC<Props> = ({
  weekendDays = DEFAULT_WEEKEND_DAYS,
  officialHolidays = DEFAULT_OFFICIAL_HOLIDAYS,
  onChange,
  onAutoSave,
  disabled,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newHoliday, setNewHoliday] = useState<Partial<OfficialHoliday>>({
    nameAr: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'official',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const triggerAutoSave = async (
    updates: { weekendDays?: number[]; officialHolidays?: OfficialHoliday[] },
    msg?: string
  ) => {
    onChange(updates);
    if (onAutoSave) {
      try {
        setIsSaving(true);
        await onAutoSave(updates);
      } finally {
        setIsSaving(false);
      }
    }
    if (msg) {
      setFeedbackMsg(msg);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  // Toggle a weekend day
  const handleToggleWeekendDay = async (dayIndex: number) => {
    if (disabled || isSaving) return;
    const current = weekendDays || [];
    let updated: number[];
    if (current.includes(dayIndex)) {
      if (current.length === 1) {
        alert('يجب الإبقاء على يوم عطلة أسبوعية واحد على الأقل للمدرسة.');
        return;
      }
      updated = current.filter((d) => d !== dayIndex);
    } else {
      updated = [...current, dayIndex].sort((a, b) => a - b);
    }
    const dayName = WEEK_DAYS.find((d) => d.index === dayIndex)?.nameAr || '';
    await triggerAutoSave(
      { weekendDays: updated },
      `تم تحديث أيام العطلة الأسبوعية وحفظها بنجاح (${dayName}) ✓`
    );
  };

  // Presets
  const applyPreset = async (preset: 'saudi' | 'intl' | 'fridayOnly') => {
    if (disabled || isSaving) return;
    let days = [5, 6];
    let label = 'الجمعة والسبت (المملكة)';
    if (preset === 'saudi') {
      days = [5, 6];
      label = 'الجمعة والسبت (النمط السعودي المعتمد)';
    } else if (preset === 'intl') {
      days = [6, 0];
      label = 'السبت والأحد (النمط الدولي)';
    } else if (preset === 'fridayOnly') {
      days = [5];
      label = 'الجمعة فقط';
    }
    await triggerAutoSave({ weekendDays: days }, `تم تطبيق وحفظ إعداد العطلة الأسبوعية: ${label} ✓`);
  };

  // Add new holiday
  const handleAddHoliday = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newHoliday.nameAr?.trim()) {
      setFormError('يرجى إدخال اسم العطلة أو المناسبة الرسمية.');
      return;
    }
    if (!newHoliday.startDate) {
      setFormError('يرجى تحديد تاريخ بداية الإجازة.');
      return;
    }

    const start = newHoliday.startDate;
    const end = newHoliday.endDate || start;

    if (end < start) {
      setFormError('تاريخ نهاية الإجازة لا يمكن أن يكون قبل تاريخ البداية.');
      return;
    }

    const created: OfficialHoliday = {
      id: `hol-${Date.now()}`,
      nameAr: newHoliday.nameAr.trim(),
      nameEn: newHoliday.nameEn?.trim() || undefined,
      startDate: start,
      endDate: end,
      type: (newHoliday.type as HolidayType) || 'official',
      notes: newHoliday.notes?.trim() || undefined,
    };

    setShowAddModal(false);
    setNewHoliday({
      nameAr: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      type: 'official',
      notes: '',
    });
    setFormError(null);
    await triggerAutoSave(
      { officialHolidays: [...officialHolidays, created] },
      `تمت إضافة العطلة الرسمية (${created.nameAr}) وحفظ التقويم بنجاح ✓`
    );
  };

  // Delete holiday
  const handleDeleteHoliday = async (id: string) => {
    if (disabled || isSaving) return;
    const target = officialHolidays.find((h) => h.id === id);
    if (confirm('هل أنت متأكد من حذف هذه العطلة الرسمية؟')) {
      const remaining = officialHolidays.filter((h) => h.id !== id);
      await triggerAutoSave(
        { officialHolidays: remaining },
        target ? `تم حذف (${target.nameAr}) وحفظ التحديثات بنجاح ✓` : 'تم حذف العطلة الرسمية بنجاح ✓'
      );
    }
  };

  // Reset to MOE Official Calendar
  const handleRestoreMOECalendar = async () => {
    if (disabled || isSaving) return;
    if (
      confirm(
        'هل تريد استعادة التقويم الرسمي لوزارة التعليم 1446-1447 هـ؟ سيتم تطبيق العطلات الرسمية المعتمدة للمملكة.'
      )
    ) {
      await triggerAutoSave(
        {
          weekendDays: [5, 6],
          officialHolidays: [...DEFAULT_OFFICIAL_HOLIDAYS],
        },
        'تمت استعادة تقويم وزارة التعليم الرسمي وحفظ كافة العطلات بنجاح ✓'
      );
    }
  };

  // Calculate holiday duration in days
  const getDurationDays = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end || start).getTime();
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const activeWeekendCount = weekendDays.length;
  const activeSchoolDaysCount = 7 - activeWeekendCount;

  return (
    <div className="bg-[var(--app-card-bg,#ffffff)] text-[var(--app-text-main,#0f172a)] dark:text-slate-100 rounded-xl border border-[var(--app-border,#e2e8f0)] p-5 shadow-xs space-y-6 text-xs">
      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Group Header */}
      <div className="settings-group-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border font-bold shadow-2xs">
        <div className="flex items-center gap-2.5">
          <CalendarOff className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-sm">أيام العطلات الأسبوعية الرسمية والإجازات المعتمدة</h4>
            <p className="text-[11px] font-normal opacity-80">
              تُستبعد هذه الأيام تلقائياً من رصد واحتساب غياب الطلاب في كافة شاشات وكشوف وتقارير النظام
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/40 dark:bg-slate-800/60 border border-current font-mono">
            {activeSchoolDaysCount} أيام دوام / {activeWeekendCount} أيام عطلة
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleRestoreMOECalendar}
              className="flex items-center gap-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
              title="استعادة التقويم الرسمي لوزارة التعليم"
            >
              <RotateCcw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>استيراد تقويم وزارة التعليم</span>
            </button>
          )}
        </div>
      </div>

      {/* Critical Policy Banner */}
      <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-emerald-950 dark:text-emerald-200">
        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed text-[11px]">
          <span className="font-bold block text-emerald-900 dark:text-emerald-300">
            الحماية الأكاديمية التلقائية من رصد الغياب في العطلات:
          </span>
          <p className="text-emerald-800 dark:text-emerald-300/90">
            أي يوم يوافق عطلة نهاية أسبوع أو إجازة رسمية (مثل اليوم الوطني، يوم التأسيس، إجازات نهاية الأسبوع المطولة، وأعياد الفطر والأضحى) لن يُحتسب كغياب لأي طالب في المدرسة، ويتم استثناؤه من حساب المعدلات ونسب الانضباط ومؤشرات الخطر.
          </p>
        </div>
      </div>

      {/* 1. Official Weekend Days Selector */}
      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>أيام عطلة نهاية الأسبوع الرسمية (إغلاق المدرسة):</span>
            </h5>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              حدد الأيام التي تُغلق فيها المدرسة أسبوعياً
            </span>
          </div>

          {!disabled && (
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-500 dark:text-slate-400">نماذج جاهزة:</span>
              <button
                type="button"
                onClick={() => applyPreset('saudi')}
                className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                الجمعة والسبت (السعودية)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('intl')}
                className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                السبت والأحد
              </button>
              <button
                type="button"
                onClick={() => applyPreset('fridayOnly')}
                className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                الجمعة فقط
              </button>
            </div>
          )}
        </div>

        {/* 7 Days Selection Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          {WEEK_DAYS.map((day) => {
            const isWeekend = weekendDays.includes(day.index);
            return (
              <button
                key={day.index}
                type="button"
                disabled={disabled}
                onClick={() => handleToggleWeekendDay(day.index)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isWeekend
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-bold shadow-2xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-500 font-medium'
                }`}
              >
                <div className="text-xs mb-1">{day.nameAr}</div>
                <div className="text-[10px] font-mono opacity-60 mb-2">{day.nameEn}</div>
                <div>
                  {isWeekend ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 px-1.5 py-0.5 rounded font-bold">
                      عطلة رسمية
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      يوم دوام
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Official School Holidays & Occasions Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h5 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Palmtree className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>قائمة العطلات الرسمية والأعياد والمناسبات ({officialHolidays.length} عطلة معتمدة):</span>
            </h5>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              الأعياد الدينية، اليوم الوطني، يوم التأسيس، وإجازات نهاية الأسبوع المطولة
            </span>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة إجازة / عطلة رسمية جديدة</span>
            </button>
          )}
        </div>

        {/* Holidays Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">اسم المناسبة / العطلة الرسمية</th>
                <th className="py-2.5 px-3">تصنيف الإجازة</th>
                <th className="py-2.5 px-3">تاريخ البداية</th>
                <th className="py-2.5 px-3">تاريخ النهاية</th>
                <th className="py-2.5 px-3 text-center">المدة</th>
                <th className="py-2.5 px-3">ملاحظات</th>
                {!disabled && <th className="py-2.5 px-3 text-center">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {officialHolidays.length === 0 ? (
                <tr>
                  <td colSpan={disabled ? 6 : 7} className="text-center py-8 text-slate-400 dark:text-slate-500">
                    لا توجد عطلات رسمية مسجلة حالياً. انقر على "استيراد تقويم وزارة التعليم" لتحميل التقويم الرسمي.
                  </td>
                </tr>
              ) : (
                officialHolidays.map((holiday) => {
                  const duration = getDurationDays(holiday.startDate, holiday.endDate);
                  const typeLabel = getHolidayTypeLabel(holiday.type, 'ar');
                  return (
                    <tr key={holiday.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{holiday.nameAr}</div>
                        {holiday.nameEn && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">{holiday.nameEn}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            holiday.type === 'national'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : holiday.type === 'religious'
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                              : holiday.type === 'extended_weekend'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : holiday.type === 'emergency'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {typeLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {holiday.startDate}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {holiday.endDate}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {duration} {duration === 1 ? 'يوم' : 'أيام'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed text-[11px]">
                        {holiday.notes || '---'}
                      </td>
                      {!disabled && (
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="حذف العطلة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Add New Holiday */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Palmtree className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">إضافة عطلة / مناسبة رسمية جديدة للمدرسة</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  اسم العطلة أو المناسبة الرسمية (بالعربية) *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إجازة منتصف العام الدراسي، يوم التأسيس، تعليق الدراسة..."
                  value={newHoliday.nameAr}
                  onChange={(e) => setNewHoliday({ ...newHoliday, nameAr: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  الاسم بالإنجليزية (اختياري):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mid-term Vacation, Founding Day..."
                  value={newHoliday.nameEn || ''}
                  onChange={(e) => setNewHoliday({ ...newHoliday, nameEn: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    تاريخ البدء *:
                  </label>
                  <input
                    type="date"
                    required
                    value={newHoliday.startDate}
                    onChange={(e) => {
                      const start = e.target.value;
                      setNewHoliday({
                        ...newHoliday,
                        startDate: start,
                        endDate: newHoliday.endDate && newHoliday.endDate >= start ? newHoliday.endDate : start,
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                    تاريخ النهاية *:
                  </label>
                  <input
                    type="date"
                    required
                    value={newHoliday.endDate}
                    onChange={(e) => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  تصنيف الإجازة:
                </label>
                <select
                  value={newHoliday.type}
                  onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as HolidayType })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  <option value="national">مناسبة وطنية رسمية (اليوم الوطني، يوم التأسيس)</option>
                  <option value="religious">عطلة دينية (عيد الفطر، عيد الأضحى)</option>
                  <option value="extended_weekend">إجازة نهاية أسبوع مطولة</option>
                  <option value="official">عطلة رسمية عامة</option>
                  <option value="emergency">تعليق دراسة طارئ (أحوال جوية / طوارئ)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
                  ملاحظات أو قرار الاعتماد الوزاري:
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: بناءً على التعميم الوزاري رقم ... للتقويم الدراسي المعتمد"
                  value={newHoliday.notes || ''}
                  onChange={(e) => setNewHoliday({ ...newHoliday, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => handleAddHoliday()}
                  disabled={isSaving}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'جارٍ الحفظ...' : 'حفظ واعتماد العطلة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
