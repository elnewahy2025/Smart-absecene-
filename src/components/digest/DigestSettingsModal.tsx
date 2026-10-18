import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useAttendance } from '../../context/AttendanceContext';
import { DailyEmailDigestConfig } from '../../types/attendance';
import { X, Settings, CheckCircle2, Mail, Plus, Trash2, Clock, ShieldAlert } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface DigestSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DigestSettingsModal: React.FC<DigestSettingsModalProps> = ({ isOpen, onClose }) => {
  const { digestConfig, updateDigestConfig, lang, schoolProfile } = useAttendance();
  const isAr = lang === 'ar';

  const [formConfig, setFormConfig] = useState<DailyEmailDigestConfig>(digestConfig);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });

  if (!isOpen) return null;

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newRecipientEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (formConfig.recipients.includes(email)) return;

    setFormConfig((prev) => ({
      ...prev,
      recipients: [...prev.recipients, email],
    }));
    setNewRecipientEmail('');
  };

  const handleRemoveRecipient = (email: string) => {
    setFormConfig((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== email),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDigestConfig(formConfig);
    setSuccessMsg(isAr ? 'تم حفظ إعدادات النشرة وجدولة الإرسال بنجاح!' : 'Settings updated successfully!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1500);
  };

  return ReactDOM.createPortal(
        <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Daily digest settings" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--app-card-bg)',
          borderColor: 'var(--app-card-border)',
        }}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                {isAr ? 'إعدادات وجدولة النشرة الصباحية الذكية' : 'Daily Morning Digest Settings'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'تخصيص توقيت الإرسال الآلي، المستلمين، وحدود التنبيه المبكر' : 'Configure automated delivery schedule and recipients'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5 scrollbar-thin">
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {isAr ? 'تفعيل الإرسال اليومي التلقائي قبل الدوام' : 'Enable Automated Daily Dispatch'}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'إرسال ملخص الحضور التنبؤي لإدارة المدرسة آلياً قبل بدء الاصطفاف الصباحي.'
                  : 'Send morning predictive digest automatically before morning assembly.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formConfig.enabled}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Time & Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{isAr ? 'وقت الإرسال الصباحي المعتمد:' : 'Scheduled Dispatch Time:'}</span>
              </label>
              <select
                value={formConfig.scheduledTime}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, scheduledTime: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="06:15">06:15 ص (مبكر جداً)</option>
                <option value="06:30">06:30 ص</option>
                <option value="06:45">06:45 ص (الموصى به - قبل الطابور)</option>
                <option value="07:00">07:00 ص</option>
                <option value="07:15">07:15 ص (قبل الحصة الأولى)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>{isAr ? 'عتبة كشف شذوذ غياب الشعبة:' : 'Class Spike Threshold:'}</span>
              </label>
              <select
                value={formConfig.anomalySpikePercentage}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, anomalySpikePercentage: Number(e.target.value) }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value={15}>15% (حساسية عالية جداً)</option>
                <option value={20}>20% (حساسية مرتفعة)</option>
                <option value={25}>25% (المعيار الوزاري الموصى به)</option>
                <option value={30}>30% (حالات الشذوذ الشديدة)</option>
              </select>
            </div>
          </div>

          {/* Email Recipients */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>{isAr ? 'قائمة البريد الإلكتروني للمستلمين (مدير المدرسة والوكلاء):' : 'Recipients Email List:'}</span>
            </label>

            <div className="flex gap-2">
              <input
                type="email"
                value={newRecipientEmail}
                onChange={(e) => setNewRecipientEmail(e.target.value)}
                placeholder={isAr ? 'أدخل البريد الإلكتروني (مثال: principal@school.edu.sa)' : 'Enter email address...'}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={handleAddRecipient}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة' : 'Add'}</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {formConfig.recipients.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <span className="font-mono text-slate-700 dark:text-slate-300">{email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(email)}
                    className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                    title={isAr ? 'حذف المستلم' : 'Remove recipient'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {formConfig.recipients.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">
                  {isAr ? 'لا يوجد مستلمون مسجلون حالياً' : 'No recipients configured'}
                </p>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer shadow-xs"
            >
              {isAr ? 'حفظ التعديلات' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
