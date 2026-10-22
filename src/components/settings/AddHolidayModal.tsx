import React, { useState } from 'react';
import { AlertCircle, Palmtree } from 'lucide-react';
import type { HolidayType, OfficialHoliday } from '../../types/attendance';

interface AddHolidayModalProps {
  lang: 'ar' | 'en';
  isSaving: boolean;
  onClose: () => void;
  onSave: (holiday: OfficialHoliday) => Promise<void>;
}

export const AddHolidayModal: React.FC<AddHolidayModalProps> = ({
  lang,
  isSaving,
  onClose,
  onSave,
}) => {
  const [newHoliday, setNewHoliday] = useState<Partial<OfficialHoliday>>({
    nameAr: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'official',
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Add new holiday
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newHoliday.nameAr?.trim()) {
      setFormError(lang === 'ar' ? 'يرجى إدخال اسم العطلة أو المناسبة الرسمية.' : 'Please enter the name of the holiday or official occasion.');
      return;
    }
    if (!newHoliday.startDate) {
      setFormError(lang === 'ar' ? 'يرجى تحديد تاريخ بداية الإجازة.' : 'Please specify the holiday start date.');
      return;
    }

    const start = newHoliday.startDate;
    const end = newHoliday.endDate || start;

    if (end < start) {
      setFormError(lang === 'ar' ? 'تاريخ نهاية الإجازة لا يمكن أن يكون قبل تاريخ البداية.' : 'The holiday end date cannot be before the start date.');
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

    setFormError(null);
    onClose();
    await onSave(created);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{lang === 'ar' ? 'إضافة عطلة / مناسبة رسمية جديدة للمدرسة' : 'Add a new holiday / official occasion for the school'}</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              {lang === 'ar' ? 'اسم العطلة أو المناسبة الرسمية (بالعربية) *:' : 'Holiday or official occasion name (in Arabic) *:'}
            </label>
            <input
              type="text"
              required
              placeholder={lang === 'ar' ? 'مثال: إجازة منتصف العام الدراسي، يوم التأسيس، تعليق الدراسة...' : 'e.g. Mid-year school vacation, Founding Day, class suspension...'}
              value={newHoliday.nameAr}
              onChange={(e) => setNewHoliday({ ...newHoliday, nameAr: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-medium"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {lang === 'ar' ? 'الاسم بالإنجليزية (اختياري):' : 'English name (optional):'}
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
                {lang === 'ar' ? 'تاريخ البدء *:' : 'Start date *:'}
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
                {lang === 'ar' ? 'تاريخ النهاية *:' : 'End date *:'}
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
              {lang === 'ar' ? 'تصنيف الإجازة:' : 'Holiday classification:'}
            </label>
            <select
              value={newHoliday.type}
              onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as HolidayType })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="national">{lang === 'ar' ? 'مناسبة وطنية رسمية (اليوم الوطني، يوم التأسيس)' : 'Official national occasion (National Day, Founding Day)'}</option>
              <option value="religious">{lang === 'ar' ? 'عطلة دينية (عيد الفطر، عيد الأضحى)' : 'Religious holiday (Eid al-Fitr, Eid al-Adha)'}</option>
              <option value="extended_weekend">{lang === 'ar' ? 'إجازة نهاية أسبوع مطولة' : 'Extended weekend'}</option>
              <option value="official">{lang === 'ar' ? 'عطلة رسمية عامة' : 'General official holiday'}</option>
              <option value="emergency">{lang === 'ar' ? 'تعليق دراسة طارئ (أحوال جوية / طوارئ)' : 'Emergency class suspension (weather / emergencies)'}</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-semibold block mb-1">
              {lang === 'ar' ? 'ملاحظات أو قرار الاعتماد الوزاري:' : 'Notes or the ministerial approval decision:'}
            </label>
            <textarea
              rows={2}
              placeholder={lang === 'ar' ? 'مثال: بناءً على التعميم الوزاري رقم ... للتقويم الدراسي المعتمد' : 'e.g. Based on ministerial circular No. ... for the approved academic calendar'}
              value={newHoliday.notes || ''}
              onChange={(e) => setNewHoliday({ ...newHoliday, notes: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ واعتماد العطلة' : 'Save and approve holiday')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
