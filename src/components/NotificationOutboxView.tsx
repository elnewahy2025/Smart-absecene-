import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { NotificationOutboxItem } from '../types/attendance';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  MessageSquare,
  Clock,
  Smartphone,
  ShieldCheck,
  Search,
  Filter,
  Check,
  Info,
} from 'lucide-react';

export const NotificationOutboxView: React.FC = () => {
  const {
    notifications,
    retryNotification,
    retryAllFailedNotifications,
    lang,
    currentTenant,
  } = useAttendance();

  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'pending' | 'failed'>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = notifications.filter((n) => {
    if (statusFilter !== 'all' && n.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        n.studentName.toLowerCase().includes(q) ||
        n.recipientName.toLowerCase().includes(q) ||
        n.recipientPhone.includes(q) ||
        n.messageText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sentCount = notifications.filter((n) => n.status === 'sent').length;
  const pendingCount = notifications.filter((n) => n.status === 'pending').length;
  const failedCount = notifications.filter((n) => n.status === 'failed').length;

  const handleRetrySingle = async (id: string) => {
    setRetryingId(id);
    await retryNotification(id);
    setRetryingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice Banner */}
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-900 shadow-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-sky-950">
            {lang === 'ar'
              ? 'نمط طابور الإشعارات (Transactional Outbox Pattern) والخصوصية'
              : 'Notification Outbox Pattern & Data Privacy'}
          </h4>
          <p className="leading-relaxed">
            {lang === 'ar'
              ? 'يتم فصل تسجيل الحضور عن خوادم الرسائل النصية لضمان عدم تعطل حفظ الكشف عند انقطاع مزود SMS. الرسائل لا تحتوي على تشخيصات طبية أو بيانات حساسة، وتتضمن فقط إشعاراً عاماً ورابطاً مشفراً لولي الأمر.'
              : 'Attendance persistence is isolated from SMS delivery. SMS content strictly avoids sensitive health data.'}
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">{lang === 'ar' ? 'إجمالي الرسائل' : 'Total Messages'}</span>
          <span className="text-2xl font-bold text-slate-900">{notifications.length}</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-emerald-700 block font-semibold">{lang === 'ar' ? 'تم التسليم' : 'Delivered'}</span>
          <span className="text-2xl font-bold text-emerald-800">{sentCount}</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-amber-700 block font-semibold">{lang === 'ar' ? 'قيد الإرسال' : 'Queued'}</span>
          <span className="text-2xl font-bold text-amber-800">{pendingCount}</span>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-xs">
          <span className="text-xs text-rose-700 block font-semibold">{lang === 'ar' ? 'فشل الإرسال' : 'Failed'}</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-rose-800">{failedCount}</span>
            {failedCount > 0 && (
              <button
                onClick={retryAllFailedNotifications}
                className="text-[11px] bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded cursor-pointer transition-colors"
              >
                {lang === 'ar' ? 'إعادة إرسال الكل' : 'Retry All'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Control Strip & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: lang === 'ar' ? 'الكل' : 'All', count: notifications.length },
            { id: 'sent', label: lang === 'ar' ? 'تم الإرسال' : 'Sent', count: sentCount },
            { id: 'failed', label: lang === 'ar' ? 'فشلت' : 'Failed', count: failedCount },
            { id: 'pending', label: lang === 'ar' ? 'قيد الانتظار' : 'Queued', count: pendingCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder={lang === 'ar' ? 'بحث بالاسم أو الهاتف...' : 'Search recipient or text...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-9 pl-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Outbox Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'ولي الأمر / الطالب' : 'Guardian & Student'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'رقم الهاتف / القناة' : 'Phone & Channel'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'نص الرسالة المرسلة' : 'Message Text'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'تاريخ الغياب' : 'Date'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'حالة الإرسال' : 'Status'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    {lang === 'ar' ? 'لا توجد إشعارات مطابقة' : 'No notifications found'}
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notif, index) => {
                  const isSent = notif.status === 'sent';
                  const isFailed = notif.status === 'failed';
                  const isPending = notif.status === 'pending';
                  const isThisRetrying = retryingId === notif.id;

                  return (
                    <tr key={notif.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{notif.recipientName}</div>
                        <div className="text-[11px] text-slate-500">الطالب: {notif.studentName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800" dir="ltr">{notif.recipientPhone}</div>
                        <span className="inline-block bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-semibold mt-0.5">
                          {notif.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <p className="text-slate-700 text-[11px] line-clamp-2 leading-relaxed">
                          {notif.messageText}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{notif.absenceDate}</td>
                      <td className="py-3 px-4">
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                              isSent
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : isFailed
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : 'bg-amber-50 border-amber-300 text-amber-800'
                            }`}
                          >
                            {isSent ? 'تم التسليم' : isFailed ? 'فشل الإرسال' : 'قيد الانتظار'}
                          </span>

                          {isFailed && notif.errorReason && (
                            <div className="text-[10px] text-rose-700 mt-1 max-w-[150px] truncate" title={notif.errorReason}>
                              {notif.errorReason}
                            </div>
                          )}

                          {notif.retryCount > 0 && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              محاولات: {notif.retryCount}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isFailed ? (
                          <button
                            onClick={() => handleRetrySingle(notif.id)}
                            disabled={isThisRetrying}
                            className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isThisRetrying ? 'animate-spin' : ''}`} />
                            <span>{isThisRetrying ? 'جارٍ الإرسال...' : 'إعادة المحاولة'}</span>
                          </button>
                        ) : isSent ? (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {new Date(notif.sentAt || notif.createdAt).toLocaleTimeString('ar-SA')}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium">في الطابور</span>
                        )}
                      </td>
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
