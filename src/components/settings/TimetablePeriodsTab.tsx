import React, { useState } from 'react';
import {
  TenantSchoolProfile,
  TimetablePeriod,
  TimetableScheduleConfig,
} from '../../types/attendance';
import { Clock, Plus, Trash2, CheckCircle2, Calculator, Sparkles } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import {
  DEFAULT_TIMETABLE_CONFIG,
  TIMETABLE_PRESETS,
  generateTimetablePeriods,
  getPeriodDurationMinutes,
  matchTimetablePresetForStage,
} from '../../utils/timetableCalculator';

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
  const { lang } = useAttendance();
  const timetablePeriods = profile.timetablePeriods || [];
  const config: TimetableScheduleConfig = {
    ...DEFAULT_TIMETABLE_CONFIG,
    ...(profile.timetableConfig || {}),
  };
  const matchedStagePreset = matchTimetablePresetForStage(profile.stageAr);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    matchedStagePreset?.id || 'custom-default'
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showFeedback = (msg?: string) => {
    if (!msg) return;
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const triggerAutoSave = async (
    updates: Partial<TenantSchoolProfile>,
    msg?: string
  ) => {
    onChange(updates);
    if (onAutoSave) {
      await onAutoSave(updates);
    }
    showFeedback(msg);
  };

  const handleConfigUpdate = async (
    patch: Partial<TimetableScheduleConfig>,
    msg?: string
  ) => {
    const nextConfig: TimetableScheduleConfig = { ...config, ...patch };
    const nextPeriods = generateTimetablePeriods(nextConfig);
    await triggerAutoSave(
      { timetableConfig: nextConfig, timetablePeriods: nextPeriods },
      msg ||
        (lang === 'ar'
          ? 'تم إعادة حساب وتحديث توقيت الحصص آلياً وحفظه بنجاح ✓'
          : 'Timetable recalculated and saved automatically ✓')
    );
  };

  const handleApplyPreset = async (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = TIMETABLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    if (preset.fixedPeriods) {
      await triggerAutoSave(
        { timetablePeriods: preset.fixedPeriods },
        lang === 'ar'
          ? `تم تطبيق قالب (${preset.labelAr}) وحفظه بنجاح ✓`
          : `Preset (${preset.labelEn}) applied and saved ✓`
      );
      return;
    }

    if (preset.config) {
      const nextPeriods = generateTimetablePeriods(preset.config);
      await triggerAutoSave(
        { timetableConfig: preset.config, timetablePeriods: nextPeriods },
        lang === 'ar'
          ? `تم تطبيق قالب (${preset.labelAr}) وحفظه بنجاح ✓`
          : `Preset (${preset.labelEn}) applied and saved ✓`
      );
    }
  };

  const handlePeriodChange = async (id: string, field: keyof TimetablePeriod, value: any) => {
    const updatedPeriods = timetablePeriods.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    await triggerAutoSave({ timetablePeriods: updatedPeriods });
  };

  const handlePeriodBlur = async () => {
    await triggerAutoSave(
      { timetablePeriods },
      lang === 'ar' ? 'تم حفظ تعديلات توقيت الحصص بنجاح ✓' : 'Timetable period changes saved successfully ✓'
    );
  };

  const handleAddPeriod = async () => {
    const nextNumber = timetablePeriods.length;
    const lastPeriod = timetablePeriods[timetablePeriods.length - 1];
    const startTime = lastPeriod?.endTime || '08:00';
    const newPeriod: TimetablePeriod = {
      id: `period-${Date.now()}`,
      periodNumber: nextNumber,
      nameAr: `الحصة ${nextNumber}`,
      startTime,
      endTime: startTime,
      type: 'lesson',
    };
    const updatedPeriods = [...timetablePeriods, newPeriod];
    await triggerAutoSave(
      { timetablePeriods: updatedPeriods },
      lang === 'ar'
        ? `تمت إضافة الفترة (${newPeriod.nameAr}) بنجاح ✓`
        : `Period (${newPeriod.nameAr}) added successfully ✓`
    );
  };

  const handleDeletePeriod = async (id: string) => {
    const target = timetablePeriods.find((p) => p.id === id);
    const updatedPeriods = timetablePeriods.filter((p) => p.id !== id);
    await triggerAutoSave(
      { timetablePeriods: updatedPeriods },
      target
        ? lang === 'ar'
          ? `تم حذف (${target.nameAr}) وحفظ التعديلات بنجاح ✓`
          : `(${target.nameAr}) deleted and changes saved successfully ✓`
        : lang === 'ar'
          ? 'تم حذف الفترة بنجاح ✓'
          : 'Period deleted successfully ✓'
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
          <span className="text-sm">{lang === 'ar' ? 'توقيت الحصص اليومية والجدول الزمني المدرسي' : 'Daily lesson times and school timetable'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {lessonCount} {lang === 'ar' ? 'حصص دراسية' : 'lessons'}
          </span>
          {assemblyCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {assemblyCount} {lang === 'ar' ? 'لقاء صباحي' : 'assembly'}
            </span>
          )}
          {recessCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {recessCount} {lang === 'ar' ? 'فرص' : 'breaks'}
            </span>
          )}
          {prayerCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {prayerCount} {lang === 'ar' ? 'صلاة' : 'prayers'}
            </span>
          )}
        </div>
      </div>

      {/* Auto-Calculator & Presets Panel */}
      <div className="bg-purple-50/40 border border-purple-200/80 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-purple-200/60">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-purple-600 shrink-0" />
            <div>
              <h4 className="font-bold text-slate-800 text-xs">
                {lang === 'ar'
                  ? 'حاسبة التوقيتات الآلية وقوالب المراحل الدراسية'
                  : 'Automatic Timetable Calculator & Stage Presets'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {lang === 'ar'
                  ? `عدّل مدة الحصة أو لقاء الصباح أو الفرص ليتم حساب بداية ونهاية كل حصة آلياً${profile.stageAr ? ` (المرحلة الحالية: ${profile.stageAr})` : ''}.`
                  : `Adjust lesson, morning assembly, or break durations to auto-calculate every period${profile.stageAr ? ` (Stage: ${profile.stageAr})` : ''}.`}
              </p>
            </div>
          </div>

          {!disabled && (
            <div className="flex flex-wrap items-center gap-2">
              <select id="timetableperiodstab-select-1" name="timetableperiodstab-select-1"
                value={selectedPresetId}
                onChange={(e) => handleApplyPreset(e.target.value)}
                className="bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {TIMETABLE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {lang === 'ar' ? preset.labelAr : preset.labelEn}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleConfigUpdate({})}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'حساب الجدول آلياً' : 'Auto-Calculate'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <label className="space-y-1">
            <span className="block text-[11px] font-semibold text-slate-700">
              {lang === 'ar' ? 'بداية الطابور' : 'Assembly Start'}
            </span>
            <input id="timetableperiodstab-input-2" name="timetableperiodstab-input-2"
              type="time"
              disabled={disabled}
              value={config.assemblyStartTime}
              onChange={(e) => handleConfigUpdate({ assemblyStartTime: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] font-semibold text-slate-700">
              {lang === 'ar' ? 'مدة الطابور (دقيقة)' : 'Assembly Duration (m)'}
            </span>
            <input id="timetableperiodstab-input-3" name="timetableperiodstab-input-3"
              type="number"
              min={0}
              max={120}
              disabled={disabled}
              value={config.assemblyDurationMinutes}
              onChange={(e) =>
                handleConfigUpdate({ assemblyDurationMinutes: Number(e.target.value) })
              }
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] font-bold text-purple-800">
              {lang === 'ar' ? 'مدة الحصة الدراسية (دقيقة)' : 'Lesson Duration (m)'}
            </span>
            <input id="timetableperiodstab-input-4" name="timetableperiodstab-input-4"
              type="number"
              min={10}
              max={120}
              disabled={disabled}
              value={config.lessonDurationMinutes}
              onChange={(e) =>
                handleConfigUpdate({ lessonDurationMinutes: Number(e.target.value) })
              }
              className="w-full bg-white border-2 border-purple-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-purple-900"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] font-semibold text-slate-700">
              {lang === 'ar' ? 'الفاصل بين الحصص (دقيقة)' : 'Break Between Lessons (m)'}
            </span>
            <input id="timetableperiodstab-input-5" name="timetableperiodstab-input-5"
              type="number"
              min={0}
              max={30}
              disabled={disabled}
              value={config.betweenLessonsMinutes}
              onChange={(e) =>
                handleConfigUpdate({ betweenLessonsMinutes: Number(e.target.value) })
              }
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] font-semibold text-slate-700">
              {lang === 'ar' ? 'عدد الحصص' : 'Lessons Count'}
            </span>
            <input id="timetableperiodstab-input-6" name="timetableperiodstab-input-6"
              type="number"
              min={1}
              max={12}
              disabled={disabled}
              value={config.lessonCount}
              onChange={(e) => handleConfigUpdate({ lessonCount: Number(e.target.value) })}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] font-semibold text-slate-700">
              {lang === 'ar' ? 'الفرصة الأولى (دقيقة)' : '1st Break (m)'}
            </span>
            <input id="timetableperiodstab-input-7" name="timetableperiodstab-input-7"
              type="number"
              min={0}
              max={90}
              disabled={disabled}
              value={config.firstRecessDurationMinutes}
              onChange={(e) =>
                handleConfigUpdate({ firstRecessDurationMinutes: Number(e.target.value) })
              }
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] font-semibold text-slate-700">
              {lang === 'ar' ? 'الفرصة الأولى بعد الحصة' : '1st Break After Lesson'}
            </span>
            <input id="timetableperiodstab-input-8" name="timetableperiodstab-input-8"
              type="number"
              min={1}
              max={11}
              disabled={disabled}
              value={config.firstRecessAfterLesson}
              onChange={(e) =>
                handleConfigUpdate({ firstRecessAfterLesson: Number(e.target.value) })
              }
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] font-semibold text-slate-700">
              {lang === 'ar' ? 'الفرصة الثانية / الصلاة (دقيقة)' : '2nd Break / Prayer (m)'}
            </span>
            <input id="timetableperiodstab-input-9" name="timetableperiodstab-input-9"
              type="number"
              min={0}
              max={90}
              disabled={disabled}
              value={config.secondRecessDurationMinutes}
              onChange={(e) =>
                handleConfigUpdate({ secondRecessDurationMinutes: Number(e.target.value) })
              }
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] font-semibold text-slate-700">
              {lang === 'ar' ? 'الفرصة الثانية بعد الحصة' : '2nd Break After Lesson'}
            </span>
            <input id="timetableperiodstab-input-10" name="timetableperiodstab-input-10"
              type="number"
              min={1}
              max={11}
              disabled={disabled}
              value={config.secondRecessAfterLesson}
              onChange={(e) =>
                handleConfigUpdate({ secondRecessAfterLesson: Number(e.target.value) })
              }
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800"
            />
          </label>
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
            <span>{lang === 'ar' ? `جدول الفترات والحصص اليومية المعتمدة (${timetablePeriods.length} فترات):` : `Approved daily periods and lessons schedule (${timetablePeriods.length} periods):`}</span>
          </h4>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddPeriod}
              className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إضافة حصة / فترة جديدة' : 'Add new lesson / period'}</span>
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                <th className="p-2.5 text-center w-12">{lang === 'ar' ? 'الرقم' : 'No.'}</th>
                <th className="p-2.5">{lang === 'ar' ? 'اسم الحصة / الفترة' : 'Lesson / period name'}</th>
                <th className="p-2.5">{lang === 'ar' ? 'النوع والتصنيف' : 'Type and category'}</th>
                <th className="p-2.5">{lang === 'ar' ? 'وقت البدء' : 'Start time'}</th>
                <th className="p-2.5">{lang === 'ar' ? 'وقت الانتهاء' : 'End time'}</th>
                <th className="p-2.5 text-center w-20">{lang === 'ar' ? 'المدة' : 'Duration'}</th>
                {!disabled && <th className="p-2.5 text-center w-14">{lang === 'ar' ? 'إجراء' : 'Action'}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timetablePeriods.length === 0 ? (
                <tr>
                  <td colSpan={disabled ? 6 : 7} className="p-6 text-center text-slate-400">
                    {lang === 'ar' ? 'لم يتم تسجيل فترات زمنية أو حصص بعد. انقر على "حساب الجدول آلياً" أو "إضافة حصة / فترة جديدة" للبدء.' : 'No time periods or lessons recorded yet. Click "Auto-Calculate" or "Add new lesson / period" to start.'}
                  </td>
                </tr>
              ) : (
                timetablePeriods.map((period) => {
                  const durationMin = getPeriodDurationMinutes(period.startTime, period.endTime);
                  return (
                    <tr key={period.id} className="hover:bg-slate-50/50">
                      <td className="p-2 font-mono font-bold text-slate-700 text-center w-12">
                        {period.periodNumber}
                      </td>
                      <td className="p-2">
                        <input id="timetableperiodstab-input-11" name="timetableperiodstab-input-11"
                          type="text"
                          disabled={disabled}
                          value={period.nameAr}
                          onChange={(e) => handlePeriodChange(period.id, 'nameAr', e.target.value)}
                          onBlur={handlePeriodBlur}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-900 font-semibold focus:bg-white"
                        />
                      </td>
                      <td className="p-2 w-36">
                        <select id="timetableperiodstab-select-12" name="timetableperiodstab-select-12"
                          disabled={disabled}
                          value={period.type}
                          onChange={(e) => handlePeriodChange(period.id, 'type', e.target.value as any)}
                          onBlur={handlePeriodBlur}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:bg-white"
                        >
                          <option value="assembly">{lang === 'ar' ? 'لقاء الصباح' : 'Morning assembly'}</option>
                          <option value="lesson">{lang === 'ar' ? 'حصة دراسية' : 'Lesson'}</option>
                          <option value="recess">{lang === 'ar' ? 'فرصة مدرسية' : 'School break'}</option>
                          <option value="prayer">{lang === 'ar' ? 'فرصة الصلاة' : 'Prayer break'}</option>
                        </select>
                      </td>
                      <td className="p-2 w-28">
                        <input id="timetableperiodstab-input-13" name="timetableperiodstab-input-13"
                          type="time"
                          disabled={disabled}
                          value={period.startTime}
                          onChange={(e) => handlePeriodChange(period.id, 'startTime', e.target.value)}
                          onBlur={handlePeriodBlur}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-slate-800 focus:bg-white"
                        />
                      </td>
                      <td className="p-2 w-28">
                        <input id="timetableperiodstab-input-14" name="timetableperiodstab-input-14"
                          type="time"
                          disabled={disabled}
                          value={period.endTime}
                          onChange={(e) => handlePeriodChange(period.id, 'endTime', e.target.value)}
                          onBlur={handlePeriodBlur}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono text-slate-800 focus:bg-white"
                        />
                      </td>
                      <td className="p-2 text-center w-20">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
                          {durationMin} {lang === 'ar' ? 'د' : 'm'}
                        </span>
                      </td>
                      {!disabled && (
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeletePeriod(period.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                            title={lang === 'ar' ? 'حذف الفترة' : 'Delete period'}
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
    </div>
  );
};
