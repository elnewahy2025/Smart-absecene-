import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ReopenSessionModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  sessionId?: string;
  reopenSession: (sessionId: string, reason: string) => { success: boolean; message: string };
  onClose: () => void;
  onNotify: (message: string | null) => void;
}

export const ReopenSessionModal: React.FC<ReopenSessionModalProps> = ({
  isOpen,
  lang,
  sessionId,
  reopenSession,
  onClose,
  onNotify,
}) => {
  const [reopenReason, setReopenReason] = useState('');

  const handleConfirmReopen = () => {
    if (!sessionId) return;
    const res = reopenSession(sessionId, reopenReason);
    if (res.success) {
      onClose();
      setReopenReason('');
      onNotify(res.message);
      setTimeout(() => onNotify(null), 6000);
    } else {
      alert(res.message);
    }
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-center gap-2 text-amber-600 border-b border-slate-100 pb-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3 className="font-bold text-slate-900 text-base">
            {lang === 'ar' ? 'إعادة فتح كشف حضور معتمد' : 'Reopen Submitted Session'}
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {lang === 'ar'
            ? 'وفق لوائح الحوكمة المدرسية، لا يمكن تعديل كشف حضور بعد اعتماده إلا بتوثيق سبب التعديل رسميًا وتدوينه في سجل التدقيق غير القابل للحذف.'
            : 'According to governance regulations, submitted attendance sessions require a mandatory reason before reopening, which is stored in the audit trail.'}
        </p>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            {lang === 'ar' ? 'سبب إعادة الفتح (إلزامي):' : 'Reopen Reason (Required):'}
          </label>
          <textarea
            rows={3}
            required
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'مثال: تصحيح حضور الطالب فهد بعد التأكد من حضوره متأخرًا بعذر مروري...'
                : 'Reason for modification...'
            }
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onClose()}
            className="px-3.5 py-2 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirmReopen}
            disabled={reopenReason.trim().length < 5}
            className="px-4 py-2 text-xs bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg font-semibold"
          >
            {lang === 'ar' ? 'تأكيد وإعادة الفتح' : 'Confirm & Reopen'}
          </button>
        </div>
      </div>
    </div>
  );
};
