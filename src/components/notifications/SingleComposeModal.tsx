import React, { useState } from 'react';
import { MessageSquare, Send, Smartphone, X } from 'lucide-react';
import { Student } from '../../types/attendance';

interface SingleComposeModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  students: Student[];
  classesStats: { className: string }[];
  uniqueClasses: string[];
  onClose: () => void;
  onSentAlert: (message: string, autoDismissMs: number) => void;
  sendCustomParentNotification: (params: {
    studentIds: string[];
    messageText: string;
    channel: 'SMS' | 'WhatsApp';
    category?: 'absence' | 'late' | 'warning' | 'broadcast' | 'excuse_approved';
    absenceDate?: string;
  }) => number;
}

export const SingleComposeModal: React.FC<SingleComposeModalProps> = ({
  isOpen,
  lang,
  students,
  classesStats,
  uniqueClasses,
  onClose,
  onSentAlert,
  sendCustomParentNotification,
}) => {
  const [singleTargetType, setSingleTargetType] = useState<'student' | 'class'>('student');
  const [singleStudentId, setSingleStudentId] = useState<string>(students[0]?.id || '');
  const [singleClass, setSingleClass] = useState<string>(
    classesStats[0]?.className || students[0]?.className || ''
  );
  const [composeChannel, setComposeChannel] = useState<'SMS' | 'WhatsApp'>('SMS');
  const [composeCategory, setComposeCategory] = useState<'absence' | 'late' | 'warning' | 'broadcast'>('absence');
  const [composeMessage, setComposeMessage] = useState('');

  const handleSend = () => {
    if (!composeMessage.trim()) return;

    let targetIds: string[] = [];
    if (singleTargetType === 'student') {
      targetIds = [singleStudentId];
    } else {
      targetIds = students.filter((s) => s.className === singleClass).map((s) => s.id);
    }

    if (targetIds.length === 0) return;

    const count = sendCustomParentNotification({
      studentIds: targetIds,
      messageText: composeMessage,
      channel: composeChannel,
      category: composeCategory,
    });

    onClose();
    setComposeMessage('');
    onSentAlert(
      lang === 'ar'
        ? `تم إدراج ${count} رسالة في الطابور وسيُرسَل عبر بوابة المدرسة المُهيأة.`
        : `Queued ${count} message(s); dispatching through the school's configured gateway.`,
      5000
    );
  };
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {lang === 'ar' ? 'إرسال إشعار فردي أو تعميم' : 'Single / Class Notification'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? 'إرسال رسالة مخصصة مع إدراج آلي في طابور الإرسال' : 'Direct custom notification'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onClose()}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                {lang === 'ar' ? 'المستهدف بالإشعار:' : 'Target Recipient:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSingleTargetType('student')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                    singleTargetType === 'student'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'ar' ? 'طالب محدد' : 'Single Student'}
                </button>
                <button
                  type="button"
                  onClick={() => setSingleTargetType('class')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                    singleTargetType === 'class'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'ar' ? 'فصل دراسي كامل' : 'Entire Class'}
                </button>
              </div>

              {singleTargetType === 'student' ? (
                <div className="pt-1">
                  <select
                    value={singleStudentId}
                    onChange={(e) => setSingleStudentId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.className}) - ولي الأمر: {s.guardianName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="pt-1">
                  <select
                    value={singleClass}
                    onChange={(e) => setSingleClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {uniqueClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        فصل {cls} ({students.filter((s) => s.className === cls).length} طالب)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Channel & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'ar' ? 'القناة:' : 'Channel:'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setComposeChannel('SMS')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      composeChannel === 'SMS'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposeChannel('WhatsApp')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      composeChannel === 'WhatsApp'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'ar' ? 'التصنيف:' : 'Category:'}
                </label>
                <select
                  value={composeCategory}
                  onChange={(e) => setComposeCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium cursor-pointer"
                >
                  <option value="absence">{lang === 'ar' ? 'تذكير غياب' : 'Absence'}</option>
                  <option value="late">{lang === 'ar' ? 'تنبيه تأخر' : 'Tardiness'}</option>
                  <option value="warning">{lang === 'ar' ? 'إنذار غياب رسمي' : 'Warning'}</option>
                  <option value="broadcast">{lang === 'ar' ? 'تعميم عام' : 'Broadcast'}</option>
                </select>
              </div>
            </div>

            {/* Message Textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {lang === 'ar' ? 'نص الرسالة:' : 'Message:'}
              </label>
              <textarea
                rows={3}
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'اكتب نص الإشعار هنا... يمكنك استخدام {student_name} لاستبدال الاسم تلقائياً.'
                    : 'Write notification text here... use {student_name} for auto-replacement.'
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-sans leading-relaxed"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onClose()}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!composeMessage.trim()}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إرسال' : 'Send'}</span>
              </button>
            </div>
          </div>
        </div>
  );
};
