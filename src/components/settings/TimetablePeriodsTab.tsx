import React, { useState } from 'react';
import { TenantSchoolProfile, TimetablePeriod } from '../../types/attendance';
import { Clock, Plus, Trash2, CheckCircle2, ShieldCheck, Sun, Coffee } from 'lucide-react';

interface Props {
  profile: TenantSchoolProfile;
  onChange: (updates: Partial<TenantSchoolProfile>) => void;
  onAutoSave?: (updates: Partial<TenantSchoolProfile>) => Promise<void> | void;
  disabled?: boolean;
}

export const TimetablePeriodsTab: React.FC<Props> = ({
  profile,
  onChange,
  onAutoSave,
  disabled,
}) => {
  const timetablePeriods = profile.timetablePeriods || [];
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const triggerAutoSave = async (updatedPeriods: TimetablePeriod[], msg?: string) => {
    onChange({ timetablePeriods: updatedPeriods });
    if (onAutoSave) {
      await onAutoSave({ timetablePeriods: updatedPeriods });
    }
    if (msg) {
      setFeedbackMsg(msg);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handlePeriodChange = async (id: string, field: keyof TimetablePeriod, value: any) => {
    const updatedPeriods = timetablePeriods.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    await triggerAutoSave(updatedPeriods);
  };

  const handlePeriodBlur = async () => {
    await triggerAutoSave(timetablePeriods, 'تم حفظ تعديلات توقيت الحصص بنجاح ✓');
  };

  const handleAddPeriod = async () => {
    const nextNumber = timetablePeriods.length;
    const newPeriod: TimetablePeriod = {
      id: `period-${Date.now()}`,
      periodNumber: nextNumber,
      nameAr: `الحصة ${nextNumber}`,
      startTime: '08:00',
      endTime: '08:45',
      type: 'lesson',
    };
    const updatedPeriods = [...timetablePeriods, newPeriod];
    await triggerAutoSave(updatedPeriods, `تمت إضافة الفترة (${newPeriod.nameAr}) بنجاح ✓`);
  };

  const handleDeletePeriod = async (id: string) => {
    const target = timetablePeriods.find((p) => p.id === id);
    const updatedPeriods = timetablePeriods.filter((p) => p.id !== id);
    await triggerAutoSave(
      updatedPeriods,
      target ? `تم حذف (${target.nameAr}) وحفظ التعديلات بنجاح ✓` : 'تم حذف الفترة بنجاح ✓'
    );
  };

  const lessonCount = timetablePeriods.filter((p) => p.type === 'lesson').length;
  const assemblyCount = timetablePeriods.filter((p) => p.type === 'assembly').length;
  const recessCount = timetablePeriods.filter((p) => p.type === 'recess').length;
  const prayerCount = timetablePeriods.filter((p) => p.type === 'prayer').length;

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="settings-group-header flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border font-bold shadow-2xs gap-2">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 shrink-0 text-purple-600" />
          <span className="text-sm">توقيت الحصص اليومية والجدول الزمني المدرسي</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {lessonCount} حصص دراسية
          </span>
          {assemblyCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {assemblyCount} اصطفاف
            </span>
          )}
          {recessCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {recessCount} فسح
            </span>
          )}
          {prayerCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {prayerCount} صلاة
            </span>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Timetable Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>جدول الفترات والحصص اليومية المعتمدة ({timetablePeriods.length} فترات):</span>
          </h4>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddPeriod}
              className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حصة / فترة جديدة</span>
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                <th className="p-2.5 text-center w-12">الرقم</th>
                <th className="p-2.5">اسم الحصة / الفترة</th>
                <th className="p-2.5">النوع والتصنيف</th>
                <th className="p-2.5">وقت البدء</th>
                <th className="p-2.5">وقت الانتهاء</th>
                {!disabled && <th className="p-2.5 text-center w-14">إجراء</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timetablePeriods.length === 0 ? (
                <tr>
                  <td colSpan={disabled ? 5 : 6} className="p-6 text-center text-slate-400">
                    لم يتم تسجيل فترات زمنية أو حصص بعد. انقر على "إضافة حصة / فترة جديدة" للبدء.
                  </td>
                </tr>
              ) : (
                timetablePeriods.map((period) => (
                  <tr key={period.id} className="hover:bg-slate-50/50">
                    <td className="p-2 font-mono font-bold text-slate-700 text-center w-12">
                      {period.periodNumber}
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={disabled}
                        value={period.nameAr}
                        onChange={(e) => handlePeriodChange(period.id, 'nameAr', e.target.value)}
                        onBlur={handlePeriodBlur}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-900 font-semibold focus:bg-white"
                      />
                    </td>
                    <td className="p-2 w-36">
                      <select
                        disabled={disabled}
                        value={period.type}
                        onChange={(e) => handlePeriodChange(period.id, 'type', e.target.value as any)}
                        onBlur={handlePeriodBlur}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:bg-white"
                      >
                        <option value="assembly">اصطفاف صباحي</option>
                        <option value="lesson">حصة دراسية</option>
                        <option value="recess">فسحة مدرسية</option>
                        <option value="prayer">صلاة الظهر</option>
                      </select>
                    </td>
                    <td className="p-2 w-28">
                      <input
                        type="time"
                        disabled={disabled}
                        value={period.startTime}
                        onChange={(e) => handlePeriodChange(period.id, 'startTime', e.target.value)}
                        onBlur={handlePeriodBlur}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-slate-800 focus:bg-white"
                      />
                    </td>
                    <td className="p-2 w-28">
                      <input
                        type="time"
                        disabled={disabled}
                        value={period.endTime}
                        onChange={(e) => handlePeriodChange(period.id, 'endTime', e.target.value)}
                        onBlur={handlePeriodBlur}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-slate-800 focus:bg-white"
                      />
                    </td>
                    {!disabled && (
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeletePeriod(period.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                          title="حذف الفترة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
