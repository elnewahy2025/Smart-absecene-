import React from 'react';
import { DailyEmailDigestItem } from '../../types/attendance';
import { Check } from 'lucide-react';

interface DigestHistoryTabProps {
  digestHistory: DailyEmailDigestItem[];
  selectedHistoryItem: DailyEmailDigestItem | null;
  onSelectHistoryItem: (item: DailyEmailDigestItem | null) => void;
  lang: string;
}

export const DigestHistoryTab: React.FC<DigestHistoryTabProps> = ({
  digestHistory,
  selectedHistoryItem,
  onSelectHistoryItem,
  lang,
}) => {
  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {lang === 'ar' ? 'سجل النشرات الصباحية المرسلة' : 'Daily Digest Dispatch Log'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === 'ar'
                ? 'أرشيف كامل لكافة النشرات والتقارير الصباحية المرسلة لقيادات المدرسة مع إحصائيات التسليم'
                : 'Historical audit log of all delivered morning digest briefings.'}
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
            {lang === 'ar'
              ? `${digestHistory.length} نشرة مرسلة`
              : `${digestHistory.length} Dispatched`}
          </span>
        </div>

        {digestHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">التاريخ والوقت</th>
                  <th className="py-3 px-3">الموضوع</th>
                  <th className="py-3 px-3">المستلمون</th>
                  <th className="py-3 px-3">الشذوذات</th>
                  <th className="py-3 px-3">الأعذار المعلقة</th>
                  <th className="py-3 px-3">الحالات الحرجة</th>
                  <th className="py-3 px-3">الحالة</th>
                  <th className="py-3 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {digestHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{item.date}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(item.dispatchedAt).toLocaleTimeString('ar-SA', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate font-medium text-slate-800">{item.subject}</td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="font-semibold text-slate-900">
                        {item.recipients.length} {lang === 'ar' ? 'قيادي' : 'leaders'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-red-600">{item.anomaliesCount}</td>
                    <td className="py-3 px-3 font-bold text-sky-600">{item.pendingJustificationsCount}</td>
                    <td className="py-3 px-3 font-bold text-amber-600">{item.highRiskStudentsCount}</td>
                    <td className="py-3 px-3">
                      <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>
                          {item.status === 'delivered'
                            ? lang === 'ar'
                              ? 'تم التسليم'
                              : 'Delivered'
                            : lang === 'ar'
                            ? 'محاكاة ناجحة'
                            : 'Simulated'}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onSelectHistoryItem(item)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        {lang === 'ar' ? 'عرض' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500 text-xs">
            {lang === 'ar'
              ? 'لم يتم إرسال أي نشرات بعد. يمكنك النقر على "إرسال النشرة الصباحية الآن" لتسجيل أول عملية إرسال.'
              : 'No digests sent yet. Click "Send Digest Now" to generate and dispatch the first briefing.'}
          </div>
        )}
      </div>

      {/* History Item Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  {lang === 'ar'
                    ? `أرشيف النشرة الصباحية - ${selectedHistoryItem.date}`
                    : `Digest Archive - ${selectedHistoryItem.date}`}
                </h3>
                <p className="text-xs text-slate-300">
                  {lang === 'ar'
                    ? `أُرسلت إلى: ${selectedHistoryItem.recipients.join('، ')}`
                    : `Dispatched to: ${selectedHistoryItem.recipients.join(', ')}`}
                </p>
              </div>
              <button
                onClick={() => onSelectHistoryItem(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {selectedHistoryItem.htmlContent ? (
                <div
                  dangerouslySetInnerHTML={{ __html: selectedHistoryItem.htmlContent }}
                  className="email-render-container"
                />
              ) : (
                <div className="text-xs text-slate-500">
                  {lang === 'ar'
                    ? 'لا يتوفر كود البريد لهذه النشرة.'
                    : 'No email HTML content recorded for this digest.'}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => onSelectHistoryItem(null)}
                className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-700"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
