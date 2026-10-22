import React from 'react';
import { Calendar, CheckCircle2, Clock, User } from 'lucide-react';
import type { InfractionRecordData } from './parentRecordDetailTypes';

interface BehaviourRecordDetailsProps {
  data: InfractionRecordData;
}

export const BehaviourRecordDetails: React.FC<BehaviourRecordDetailsProps> = ({data}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div>
          <span className="text-[11px] text-slate-500 block mb-0.5">عنوان الواقعة</span>
          <h4 className="font-bold text-slate-900 text-sm">{data.title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              data.type === 'positive'
                ? 'bg-emerald-100 text-emerald-800'
                : data.severity === 'major'
                ? 'bg-rose-100 text-rose-800'
                : data.severity === 'moderate'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {data.type === 'positive'
              ? 'سلوك إيجابي متميز (+)'
              : data.severity === 'major'
              ? 'مخالفة جسيمة (درجة ثالثة)'
              : data.severity === 'moderate'
              ? 'مخالفة متوسطة (درجة ثانية)'
              : 'مخالفة بسيطة (درجة أولى)'}
          </span>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
              data.points >= 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {data.points > 0 ? `+${data.points}` : data.points} نقطة
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-1">التاريخ</span>
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {data.date}
          </span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-1">الوقت</span>
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {data.time || 'صباحاً'}
          </span>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-500 block mb-1">المسؤول عن الرصد</span>
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            {data.recordedBy}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
        <span className="font-bold text-xs text-slate-900 block">وصف وتفاصيل الواقعة:</span>
        <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
          {data.description}
        </p>
      </div>

      {data.actionTaken && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-1">
          <span className="font-bold text-xs text-amber-950 block">
            الإجراء الإداري / التربوي المتخذ:
          </span>
          <p className="text-amber-900 text-xs sm:text-sm leading-relaxed">
            {data.actionTaken}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>إشعار ولي الأمر بالواقعة:</span>
        <span
          className={`font-semibold flex items-center gap-1 ${
            data.guardianNotified ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {data.guardianNotified
            ? 'تم إرسال إشعار رسمي لولي الأمر'
            : 'لم يُرسل إشعار خارجي'}
        </span>
      </div>
    </div>
  );
};
