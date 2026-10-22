import React from 'react';
import { Save } from 'lucide-react';
import type { SchoolSettings, TenantSchoolProfile } from '../../types/attendance';
import { HolidaysAndWeekendsCard } from './HolidaysAndWeekendsCard';

interface SchoolPolicySettingsFormProps {
  formSettings: SchoolSettings;
  setFormSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
  onSubmit: (e: React.FormEvent) => void;
  lang: 'ar' | 'en';
  canManageSettings: boolean;
  schoolProfile?: TenantSchoolProfile;
  isSuperAdmin: boolean;
}

export const SchoolPolicySettingsForm: React.FC<SchoolPolicySettingsFormProps> = ({
  formSettings,
  setFormSettings,
  onSubmit,
  lang,
  canManageSettings,
  schoolProfile,
  isSuperAdmin,
}) => (
  <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
    <div className="settings-group-header flex items-center justify-between p-3.5 rounded-xl border font-bold shadow-2xs">
      <div>
        <h3 className="font-bold text-sm">
          {lang === 'ar' ? 'إعدادات وقواعد الانضباط المدرسي' : 'School Attendance Policies'}
        </h3>
      </div>
      <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/40 border border-current font-mono">
        {lang === 'ar' ? 'قواعد الحضور' : 'Attendance Rules'}
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
      {/* Mode */}
      <div className="space-y-1">
        <label className="font-semibold text-slate-800 block">
          {lang === 'ar' ? 'نمط تسجيل الحضور المعتمد بالمدرسة:' : 'Attendance Mode:'}
        </label>
        <select
          value={formSettings.attendanceMode}
          onChange={(e: any) =>
            setFormSettings({ ...formSettings, attendanceMode: e.target.value })
          }
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
        >
          <option value="both">{lang === 'ar' ? 'كلاهما (حضور صباحي يومي + حضور حصص دراسية)' : 'Both (daily morning + per-period)'}</option>
          <option value="daily">{lang === 'ar' ? 'حضور يومي صباحي فقط' : 'Daily morning only'}</option>
          <option value="period">{lang === 'ar' ? 'حضور حصص دراسية فقط' : 'Per-period only'}</option>
        </select>
      </div>

      {/* Late Grace Period */}
      <div className="space-y-1">
        <label className="font-semibold text-slate-800 block">
          {lang === 'ar' ? 'حد احتساب التأخر الصباحي (بالدقائق):' : 'Late Grace Minutes:'}
        </label>
        <input
          type="number"
          min="0"
          max="60"
          value={formSettings.lateThresholdMinutes}
          onChange={(e) =>
            setFormSettings({
              ...formSettings,
              lateThresholdMinutes: parseInt(e.target.value) || 0,
            })
          }
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono"
        />
        <span className="text-[11px] text-slate-500">
          {lang === 'ar' ? 'أي حضور بعد هذا الوقت يسجل كطالب "متأخر" في الكشف' : 'Any arrival after this time is recorded as "late" in the sheet'}
        </span>
      </div>

      {/* Chronic Limit */}
      <div className="space-y-1">
        <label className="font-semibold text-slate-800 block">
          {lang === 'ar' ? 'حد إنذار الغياب المتكرر التلقائي (بالأيام):' : 'Chronic Absence Limit (Days):'}
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={formSettings.chronicAbsenceLimit}
          onChange={(e) =>
            setFormSettings({
              ...formSettings,
              chronicAbsenceLimit: parseInt(e.target.value) || 5,
            })
          }
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono"
        />
      </div>

      {/* Preferred Notification Channel */}
      <div className="space-y-1">
        <label className="font-semibold text-slate-800 block">
          {lang === 'ar' ? 'قناة إرسال إشعارات أولياء الأمور الافتراضية:' : 'Default Notification Channel:'}
        </label>
        <select
          value={formSettings.preferredChannel || 'both'}
          onChange={(e: any) =>
            setFormSettings({ ...formSettings, preferredChannel: e.target.value })
          }
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium"
        >
          <option value="both">{lang === 'ar' ? 'كلاهما (SMS و WhatsApp معاً)' : 'Both (SMS and WhatsApp)'}</option>
          <option value="SMS">{lang === 'ar' ? 'رسائل نصية قصيرة (SMS) فقط' : 'SMS only'}</option>
          <option value="WhatsApp">{lang === 'ar' ? 'تطبيق WhatsApp فقط' : 'WhatsApp only'}</option>
        </select>
      </div>

      {/* Notification Templates Section */}
      <div className="pt-2 border-t border-slate-200 space-y-3">
        <h4 className="font-bold text-slate-900 text-xs text-emerald-800">
          {lang === 'ar' ? 'قوالب وصيغ رسائل أولياء الأمور التلقائية:' : 'Notification Message Templates:'}
        </h4>

        {/* Absence Template */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">
            {lang === 'ar' ? 'صيغة رسالة تسجيل الغياب:' : 'Absence Message Template:'}
          </label>
          <textarea
            rows={2}
            value={
              formSettings.absenceMessageTemplate ||
              (lang === 'ar'
                ? 'المكرم ولي أمر الطالب ({student_name}): نفيدكم بتسجيل غياب نجلكم عن ({subject}) بتاريخ {date}. يرجى تقديم العذر عبر الرابط المدرسي.'
                : 'Dear parent of ({student_name}): we are informing you that your child was marked absent from ({subject}) on {date}. Please submit an excuse through the school link.')
            }
            onChange={(e) =>
              setFormSettings({ ...formSettings, absenceMessageTemplate: e.target.value })
            }
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-sans"
          />
          <span className="text-[10px] text-slate-400 block">
          {lang === 'ar' ? 'المتغيرات المتاحة: ' : 'Available variables: '}{`{student_name}`} ، {`{subject}`} ، {`{date}`}
          </span>
        </div>

        {/* Late Template */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">
            {lang === 'ar' ? 'صيغة رسالة التأخر الصباحي:' : 'Tardiness Message Template:'}
          </label>
          <textarea
            rows={2}
            value={
              formSettings.lateMessageTemplate ||
              (lang === 'ar'
                ? 'المكرم ولي أمر الطالب ({student_name}): تم تسجيل تأخر نجلكم ({minutes} دقيقة) عن دوام اليوم بتاريخ {date}.'
                : 'Dear parent of ({student_name}): your child was recorded as late today ({minutes} minutes) on {date}.')
            }
            onChange={(e) =>
              setFormSettings({ ...formSettings, lateMessageTemplate: e.target.value })
            }
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-sans"
          />
          <span className="text-[10px] text-slate-400 block">
            {lang === 'ar' ? 'المتغيرات المتاحة: ' : 'Available variables: '}{`{student_name}`} ، {`{minutes}`} ، {`{date}`}
          </span>
        </div>

        {/* Warning Template */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 block">
            {lang === 'ar' ? 'صيغة إنذار الغياب المتكرر:' : 'Chronic Absence Warning Template:'}
          </label>
          <textarea
            rows={2}
            value={
              formSettings.warningMessageTemplate ||
              (lang === 'ar'
                ? 'إشعار رسمي: المكرم ولي أمر الطالب ({student_name})، نظراً لتجاوز أيام الغياب غير المبررة الحد المسموح، نأمل مراجعة إدارة المدرسة عاجلاً.'
                : 'Official notice: dear parent of ({student_name}), as the unexcused absences have exceeded the permitted limit, please contact the school administration as soon as possible.')
            }
            onChange={(e) =>
              setFormSettings({ ...formSettings, warningMessageTemplate: e.target.value })
            }
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-sans"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formSettings.sendSmsOnAbsent}
            onChange={(e) =>
              setFormSettings({ ...formSettings, sendSmsOnAbsent: e.target.checked })
            }
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-slate-800 font-medium">
            {lang === 'ar' ? 'إرسال رسالة تلقائية لولي الأمر فور اعتماد غياب الطالب' : 'Automatically message the parent as soon as an absence is approved'}
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formSettings.sendSmsOnLate}
            onChange={(e) =>
              setFormSettings({ ...formSettings, sendSmsOnLate: e.target.checked })
            }
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-slate-800 font-medium">
            {lang === 'ar' ? 'إرسال إشعار لولي الأمر عند تسجيل التأخر الصباحي' : 'Notify the parent when a morning tardiness is recorded'}
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formSettings.notifyOnExcuseApproved ?? true}
            onChange={(e) =>
              setFormSettings({ ...formSettings, notifyOnExcuseApproved: e.target.checked })
            }
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-slate-800 font-medium">
            {lang === 'ar' ? 'إرسال رسالة تأكيد لولي الأمر عند قبول واعتماد العذر الطبي' : 'Send a confirmation message to the parent when a medical excuse is approved'}
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formSettings.requireExcuseAttachment}
            onChange={(e) =>
              setFormSettings({
                ...formSettings,
                requireExcuseAttachment: e.target.checked,
              })
            }
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-slate-800 font-medium">
            {lang === 'ar' ? 'إلزامية إرفاق تقرير طبي أو مستند رسمي عند تقديم عذر الغياب' : 'Require a medical report or official document when submitting an absence excuse'}
          </span>
        </label>
      </div>
    </div>

    {/* Official Weekends & Holidays Configuration Card */}
    <HolidaysAndWeekendsCard
      weekendDays={formSettings.weekendDays}
      officialHolidays={formSettings.officialHolidays}
      onChange={(updates) => setFormSettings({ ...formSettings, ...updates })}
      disabled={!canManageSettings}
      country={schoolProfile?.address?.country}
      isSuperAdmin={isSuperAdmin}
    />

    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
      {!canManageSettings ? (
        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
          {lang === 'ar'
            ? 'تنبيه الصلاحيات: عرض الإعدادات للقراءة فقط. تعديل القواعد والحدود محصور بمدير المدرسة.'
            : 'Notice: Read-only access. Policy changes are restricted to school administrators.'}
        </span>
      ) : <div />}

      {canManageSettings && (
        <button
          type="submit"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>{lang === 'ar' ? 'حفظ وتطبيق القواعد المدرسية' : 'Save Policies'}</span>
        </button>
      )}
    </div>
  </form>
);
