import React from 'react';
import { Calendar, CheckCircle2, Clock, MessageSquare, Smartphone } from 'lucide-react';
import type { NotificationRecordData } from './parentRecordDetailTypes';

interface NotificationRecordDetailsProps {
  data: NotificationRecordData;
}

export const NotificationRecordDetails: React.FC<NotificationRecordDetailsProps> = ({data}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              data.category === 'warning'
                ? 'bg-rose-100 text-rose-800'
                : data.statusType === 'absent'
                ? 'bg-rose-50 text-rose-700'
                : data.statusType === 'late'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-sky-50 text-sky-700'
            }`}
          >
            {data.category === 'warning'
              ? 'إنذار أكاديمي رسمي'
              : data.statusType === 'absent'
              ? 'إشعار غياب فوري'
              : data.statusType === 'late'
              ? 'تنبيه تأخر صباحي'
              : data.category === 'excuse_approved'
              ? 'اعتماد عذر طبي'
              : 'تعميم مدرسي'}
          </span>
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            {data.channel === 'WhatsApp' ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> واتساب
              </span>
            ) : (
              <span className="text-sky-600 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> رسالة نصية SMS
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>تم التسليم بنجاح</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-1">وقت وتاريخ الإرسال</span>
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {new Date(data.createdAt).toLocaleString('ar-SA', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-1">تاريخ الغياب / الواقعة</span>
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {data.absenceDate}
          </span>
        </div>
      </div>

      {/* Message Bubble Preview */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-slate-900 block">نص الرسالة المرسلة:</span>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs font-sans text-slate-800 text-sm leading-relaxed">
          {data.messageText}
        </div>
      </div>

      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
        <span>
          المستلم: <strong>{data.recipientName}</strong>
        </span>
        <span className="font-mono text-slate-500">{data.recipientPhone}</span>
      </div>
    </div>
  );
};
