import React from 'react';
import { DailyEmailDigestConfig } from '../../types/attendance';
import { Mail, Plus, Trash2 } from 'lucide-react';

interface DigestSchedulerSettingsTabProps {
  formConfig: DailyEmailDigestConfig;
  newRecipientEmail: string;
  onFormConfigChange: React.Dispatch<React.SetStateAction<DailyEmailDigestConfig>>;
  onNewRecipientEmailChange: (email: string) => void;
  onAddRecipient: (e: React.FormEvent) => void;
  onRemoveRecipient: (email: string) => void;
  onSaveSettings: (e: React.FormEvent) => void;
  lang: string;
}

export const DigestSchedulerSettingsTab: React.FC<DigestSchedulerSettingsTabProps> = ({
  formConfig,
  newRecipientEmail,
  onFormConfigChange,
  onNewRecipientEmailChange,
  onAddRecipient,
  onRemoveRecipient,
  onSaveSettings,
  lang,
}) => {
  return (
    <form onSubmit={onSaveSettings} className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {lang === 'ar' ? 'إعدادات الجدولة التلقائية وقنوات التنبيه' : 'Automated Scheduler Settings'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ar'
              ? 'ضبط مواعيد التوليد التلقائي ومستلمي النشرة من قيادات المدرسة وحدود كشف الشذوذات'
              : 'Configure dispatch schedule, recipients list, and anomaly detection thresholds.'}
          </p>
        </div>

        {/* Toggle Active */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="space-y-0.5">
            <span className="font-bold text-xs text-slate-900">
              {lang === 'ar' ? 'تفعيل الإرسال اليومي التلقائي قبل الدوام' : 'Enable Automated Daily Dispatch'}
            </span>
            <p className="text-xs text-slate-500">
              {lang === 'ar'
                ? 'إرسال النشرة الصباحية آلياً في الموعد المحدد لكافة المستلمين المعتمدين.'
                : 'Dispatches morning digest email automatically before the school bell.'}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formConfig.enabled}
              onChange={(e) => onFormConfigChange((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Schedule Time Picker & Days */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'ar' ? 'وقت الإرسال الصباحي المعتمد' : 'Scheduled Delivery Time'}
            </label>
            <select
              value={formConfig.scheduledTime}
              onChange={(e) => onFormConfigChange((prev) => ({ ...prev, scheduledTime: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="06:15">06:15 ص (مبكر جداً - للمدارس النائية)</option>
              <option value="06:30">06:30 ص</option>
              <option value="06:45">06:45 ص (الموصى به - قبل انطلاق الطابور بـ 45 دقيقة)</option>
              <option value="07:00">07:00 ص</option>
              <option value="07:15">07:15 ص (قبل الحصة الأولى مباشرة)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'ar'
                ? 'يضمن وصول البيانات لإدارة المدرسة قبل توافد الطلاب والطابور الصباحي.'
                : 'Ensures data reaches administration before students arrive.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'ar' ? 'أيام العمل الأسبوعية (الإرسال النشط)' : 'Active School Days'}
            </label>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
              {lang === 'ar'
                ? 'الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس (أسبوع الدراسة الوزاري)'
                : 'Sunday to Thursday (Ministry Academic Schedule)'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'ar'
                ? 'تتوقف النشرة آلياً يومي الجمعة والسبت والإجازات الرسمية.'
                : 'Automatically paused on weekends and official holidays.'}
            </p>
          </div>
        </div>

        {/* Recipients List Manager */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800">
            {lang === 'ar'
              ? 'قائمة المستلمين المعتمدين (قيادات المدرسة والمشرفين)'
              : 'Authorized Administrator Recipients'}
          </label>

          {/* Add Recipient */}
          <div className="flex gap-2">
            <input
              type="email"
              value={newRecipientEmail}
              onChange={(e) => onNewRecipientEmailChange(e.target.value)}
              placeholder="name@andalus-school.edu.sa"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={onAddRecipient}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'إضافة مستلم' : 'Add'}</span>
            </button>
          </div>

          {/* List */}
          <div className="space-y-2">
            {formConfig.recipients.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold text-slate-800">{email}</span>
                  {email.includes('principal') && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.2 rounded font-bold">
                      {lang === 'ar' ? 'مدير المدرسة' : 'Principal'}
                    </span>
                  )}
                  {email.includes('counselor') && (
                    <span className="bg-sky-100 text-sky-800 text-[10px] px-2 py-0.2 rounded font-bold">
                      {lang === 'ar' ? 'الموجه الطلابي' : 'Counselor'}
                    </span>
                  )}
                </div>
                {formConfig.recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveRecipient(email)}
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    title={lang === 'ar' ? 'حذف' : 'Remove'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detection Thresholds */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800">
            {lang === 'ar' ? 'معايير وحساسية رصد الشذوذات والغياب المتكرر' : 'Anomaly Sensitivity & Thresholds'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-600">
                {lang === 'ar' ? 'حد الغياب الحرج (أيام)' : 'Critical Absence Limit (Days)'}
              </span>
              <input
                type="number"
                min="3"
                max="10"
                value={formConfig.chronicAbsenceThreshold}
                onChange={(e) =>
                  onFormConfigChange((prev) => ({
                    ...prev,
                    chronicAbsenceThreshold: parseInt(e.target.value) || 5,
                  }))
                }
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
              />
              <p className="text-[10px] text-slate-400">
                {lang === 'ar' ? 'إدراج الطالب ضمن القائمة الحرجة للنشرة' : 'Include student in chronic high-risk table'}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-600">
                {lang === 'ar' ? 'حد الغياب المتتالي (أيام)' : 'Consecutive Days Limit'}
              </span>
              <input
                type="number"
                min="1"
                max="5"
                value={formConfig.consecutiveAbsenceDaysThreshold}
                onChange={(e) =>
                  onFormConfigChange((prev) => ({
                    ...prev,
                    consecutiveAbsenceDaysThreshold: parseInt(e.target.value) || 2,
                  }))
                }
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
              />
              <p className="text-[10px] text-slate-400">
                {lang === 'ar' ? 'تنبيه الغياب المتوالي دون إشعار' : 'Flag consecutive unexcused absences'}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="text-[11px] font-semibold text-slate-600">
                {lang === 'ar' ? 'نسبة قفزة غياب الشعبة (%)' : 'Class Spike Threshold (%)'}
              </span>
              <input
                type="number"
                min="10"
                max="50"
                value={formConfig.anomalySpikePercentage}
                onChange={(e) =>
                  onFormConfigChange((prev) => ({
                    ...prev,
                    anomalySpikePercentage: parseInt(e.target.value) || 25,
                  }))
                }
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
              />
              <p className="text-[10px] text-slate-400">
                {lang === 'ar' ? 'رصد شذوذ الشعبة إذا تجاوزت النسبة' : 'Trigger anomaly if class exceeds rate'}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Features Toggle */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800">
                {lang === 'ar'
                  ? 'تضمين التحليل التنفيذي للذكاء الاصطناعي (Gemini Briefing)'
                  : 'Include Gemini AI Executive Synthesis'}
              </span>
              <p className="text-[11px] text-slate-500">
                {lang === 'ar'
                  ? 'صياغة موجز تنفيذي يحدد الأولويات الثلاث العاجلة قبل الحصة الأولى.'
                  : 'Generates strategic briefing with top 3 priorities before first period.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={formConfig.includeGeminiBriefing}
              onChange={(e) =>
                onFormConfigChange((prev) => ({
                  ...prev,
                  includeGeminiBriefing: e.target.checked,
                }))
              }
              className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800">
                {lang === 'ar'
                  ? 'إرسال إشعار SMS/WhatsApp ملخص لهاتف مدير المدرسة'
                  : 'Send SMS/WhatsApp notification to School Principal'}
              </span>
              <p className="text-[11px] text-slate-500">
                {lang === 'ar'
                  ? 'إشعار سريع بالرقم المباشر لمدير المدرسة يحتوي رابط النشرة الصباحية.'
                  : 'Sends instant alert with quick link to morning digest.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={formConfig.notifyViaWhatsAppToo}
              onChange={(e) =>
                onFormConfigChange((prev) => ({
                  ...prev,
                  notifyViaWhatsAppToo: e.target.checked,
                }))
              }
              className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'حفظ وتطبيق إعدادات النشرة' : 'Save Scheduler Settings'}
          </button>
        </div>
      </div>
    </form>
  );
};
