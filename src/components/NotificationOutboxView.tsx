import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { Student } from '../types/attendance';
import {
  Send,
  CheckCircle2,
  RotateCcw,
  MessageSquare,
  Smartphone,
  ShieldCheck,
  Search,
  Filter,
  PlusCircle,
  X,
  Users,
  CheckSquare,
} from 'lucide-react';
import { openWhatsAppDirect } from '../utils/whatsappUtils';
import { BatchNotificationModal } from './notifications/BatchNotificationModal';
import { SingleComposeModal } from './notifications/SingleComposeModal';

export const NotificationOutboxView: React.FC = () => {
  const {
    notifications,
    students,
    retryNotification,
    sendCustomParentNotification,
    lang,
    currentTenant,
    classesStats,
    schoolProfile,
  } = useAttendance();

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'pending' | 'failed'>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Table Bulk Selection
  const [selectedOutboxIds, setSelectedOutboxIds] = useState<string[]>([]);
  const [isBulkRetrying, setIsBulkRetrying] = useState(false);

  // Success Feedback Alert
  const [sentSuccessAlert, setSentSuccessAlert] = useState<string | null>(null);

  // Single / Class Compose Modal visibility
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Available classes in tenant
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.className))).filter(Boolean);
  }, [students]);


  // Filter students for batch selection
  // Open Batch Modal with preselected absent students
  // Open Batch Modal with preselected absent students
  const handleOpenBatchModal = () => {
    setIsBatchModalOpen(true);
  };


  // Execute Batch Send

  // Single Compose Send

  // Filtered Notifications in Outbox Table
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;
      if (searchQuery.trim()) {
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
  }, [notifications, statusFilter, searchQuery]);

  const sentCount = notifications.filter((n) => n.status === 'sent').length;
  const pendingCount = notifications.filter((n) => n.status === 'pending').length;
  const failedCount = notifications.filter((n) => n.status === 'failed').length;

  // Single Retry
  const handleRetrySingle = async (id: string) => {
    setRetryingId(id);
    await retryNotification(id);
    setRetryingId(null);
  };

  // Bulk Retry Selected Outbox Items
  const handleBulkRetrySelected = async () => {
    if (selectedOutboxIds.length === 0) return;
    setIsBulkRetrying(true);
    for (const id of selectedOutboxIds) {
      await retryNotification(id);
    }
    setIsBulkRetrying(false);
    setSelectedOutboxIds([]);
    setSentSuccessAlert(
      lang === 'ar'
        ? 'تمت إعادة محاولة إرسال الرسائل المحددة بنجاح.'
        : 'Selected messages retried successfully.'
    );
    setTimeout(() => setSentSuccessAlert(null), 4000);
  };

  const toggleSelectOutboxItem = (id: string) => {
    setSelectedOutboxIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVisibleOutbox = () => {
    const visibleIds = filteredNotifications.map((n) => n.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedOutboxIds.includes(id));
    if (allSelected) {
      setSelectedOutboxIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedOutboxIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };


  return (
    <div className="space-y-6">
      {/* Carrier Gateway & RBAC Security Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-200" />
            {lang === 'ar' ? 'بوابة المشغل البرمجية' : 'Gateway Dispatch API'}
          </span>
          <span className="font-medium text-slate-300">
            {lang === 'ar'
              ? 'بوابة إرسال الرسائل محمية بنظام الصلاحيات (RBAC) وتعتمد إيصالات تسليم رقمية لـ WhatsApp Business وSMS.'
              : 'Notification gateway is RBAC-secured and generates verified carrier delivery receipts.'}
          </span>
        </div>
        <span className="text-emerald-400 font-mono text-[11px] hidden sm:inline">
          Meta Cloud API / Unifonic & SMS Hub
        </span>
      </div>



      {/* Success Notification Alert */}
      {sentSuccessAlert && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3.5 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sentSuccessAlert}</span>
          </div>
          <button onClick={() => setSentSuccessAlert(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleOpenBatchModal}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إرسال دفعة جماعية' : 'Batch Reminders'}</span>
          </button>

          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-600" />
            <span>{lang === 'ar' ? 'رسالة فردية' : 'Single Compose'}</span>
          </button>

          <div className="relative w-full sm:w-60">
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
      </div>

      {/* Floating Bulk Action Bar when rows are selected */}
      {selectedOutboxIds.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-medium">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === 'ar'
                ? `تم تحديد ${selectedOutboxIds.length} رسالة من الطابور`
                : `${selectedOutboxIds.length} message(s) selected`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkRetrySelected}
              disabled={isBulkRetrying}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg cursor-pointer transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isBulkRetrying ? 'animate-spin' : ''}`} />
              <span>{isBulkRetrying ? (lang === 'ar' ? 'جارٍ الإرسال...' : 'Retrying...') : (lang === 'ar' ? 'إعادة إرسال المحدد' : 'Retry Selected')}</span>
            </button>
            <button
              onClick={() => setSelectedOutboxIds([])}
              className="text-slate-300 hover:text-white px-2 py-1 rounded cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء التحديد' : 'Clear'}
            </button>
          </div>
        </div>
      )}

      {/* Outbox Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredNotifications.length > 0 &&
                      filteredNotifications.every((n) => selectedOutboxIds.includes(n.id))
                    }
                    onChange={toggleSelectAllVisibleOutbox}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">#</th>
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
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                      <span>{lang === 'ar' ? 'لا توجد إشعارات مطابقة في الطابور' : 'No notifications found'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notif, index) => {
                  const isSent = notif.status === 'sent';
                  const isFailed = notif.status === 'failed';
                  const isThisRetrying = retryingId === notif.id;
                  const isRowSelected = selectedOutboxIds.includes(notif.id);

                  return (
                    <tr
                      key={notif.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isRowSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => toggleSelectOutboxItem(notif.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900">{notif.recipientName}</span>
                          {notif.category === 'absence' && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-bold">تذكير غياب</span>
                          )}
                          {notif.category === 'warning' && (
                            <span className="bg-red-100 text-red-800 text-[9px] px-1.5 py-0.2 rounded font-bold">إنذار غياب</span>
                          )}
                          {notif.category === 'broadcast' && (
                            <span className="bg-blue-100 text-blue-800 text-[9px] px-1.5 py-0.2 rounded font-bold">تعميم</span>
                          )}
                          {notif.category === 'excuse_approved' && (
                            <span className="bg-teal-100 text-teal-800 text-[9px] px-1.5 py-0.2 rounded font-bold">عذر معتمد</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">الطالب: {notif.studentName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800" dir="ltr">{notif.recipientPhone}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {notif.channel === 'WhatsApp' ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              <Smartphone className="w-2.5 h-2.5" /> SMS
                            </span>
                          )}
                        </div>
                        {notif.gatewayReceiptId && (
                          <div
                            className="text-[9px] font-mono text-slate-500 mt-1 truncate max-w-[130px]"
                            title={`إيصال البوابة المعتمد: ${notif.gatewayReceiptId} (${notif.gatewayProvider || ''})`}
                          >
                            🧾 {notif.gatewayReceiptId}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <p className="text-slate-700 text-[11px] line-clamp-2 leading-relaxed font-sans">
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {notif.recipientPhone && (
                            <button
                              type="button"
                              onClick={() => {
                                openWhatsAppDirect(
                                  notif.recipientPhone,
                                  notif.messageText,
                                  schoolProfile?.countryCallingCode || '+966'
                                );
                              }}
                              className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                              title="فتح محادثة واتساب ويب مباشرة مع ولي الأمر"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>واتساب ويب</span>
                            </button>
                          )}

                          {isFailed ? (
                            <button
                              onClick={() => handleRetrySingle(notif.id)}
                              disabled={isThisRetrying}
                              className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded text-xs font-semibold cursor-pointer transition-colors"
                            >
                              <RotateCcw className={`w-3.5 h-3.5 ${isThisRetrying ? 'animate-spin' : ''}`} />
                              <span>{isThisRetrying ? 'جارٍ الإرسال...' : 'إعادة'}</span>
                            </button>
                          ) : isSent ? (
                            <div className="text-[11px] text-slate-400 font-mono">
                              {new Date(notif.sentAt || notif.createdAt).toLocaleTimeString('ar-SA')}
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-700 font-medium">في الطابور</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BATCH NOTIFICATION MODAL (Multi-student + Templated Reminders) */}
      {/* ======================================================== */}
      <BatchNotificationModal
        isOpen={isBatchModalOpen}
        lang={lang}
        students={students}
        uniqueClasses={uniqueClasses}
        currentTenantName={currentTenant.name}
        onClose={() => setIsBatchModalOpen(false)}
        onSentAlert={(message, autoDismissMs) => {
          setSentSuccessAlert(message);
          setTimeout(() => setSentSuccessAlert(null), autoDismissMs);
        }}
        sendCustomParentNotification={sendCustomParentNotification}
      />

      {/* ======================================================== */}
      {/* SINGLE COMPOSE MODAL (Fallback for single recipient/class) */}
      {/* ======================================================== */}
      <SingleComposeModal
        isOpen={isComposeOpen}
        lang={lang}
        students={students}
        classesStats={classesStats}
        uniqueClasses={uniqueClasses}
        onClose={() => setIsComposeOpen(false)}
        onSentAlert={(message, autoDismissMs) => {
          setSentSuccessAlert(message);
          setTimeout(() => setSentSuccessAlert(null), autoDismissMs);
        }}
        sendCustomParentNotification={sendCustomParentNotification}
      />
    </div>
  );
};
