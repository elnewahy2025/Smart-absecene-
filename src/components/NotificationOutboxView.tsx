import React, { useState, useMemo } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { NotificationOutboxItem, Student } from '../types/attendance';
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
  PlusCircle,
  X,
  Sparkles,
  UserCheck,
  Users,
  CheckSquare,
  Square,
  Bell,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
} from 'lucide-react';
import { openWhatsAppDirect } from '../utils/whatsappUtils';

export const NotificationOutboxView: React.FC = () => {
  const {
    notifications,
    students,
    retryNotification,
    retryAllFailedNotifications,
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

  // Single / Class Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [singleTargetType, setSingleTargetType] = useState<'student' | 'class'>('student');
  const [singleStudentId, setSingleStudentId] = useState<string>(students[0]?.id || '');
  const [singleClass, setSingleClass] = useState<string>(
    classesStats[0]?.className || students[0]?.className || ''
  );
  const [composeChannel, setComposeChannel] = useState<'SMS' | 'WhatsApp'>('SMS');
  const [composeCategory, setComposeCategory] = useState<'absence' | 'late' | 'warning' | 'broadcast'>('absence');
  const [composeMessage, setComposeMessage] = useState('');

  // ==========================================
  // BATCH NOTIFICATION FEATURE STATE
  // ==========================================
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);
  const [batchClassFilter, setBatchClassFilter] = useState<string>('all');
  const [batchAbsenceFilter, setBatchAbsenceFilter] = useState<'all_absent' | 'chronic' | 'all'>('all_absent');
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [batchChannel, setBatchChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [batchSelectedTemplateIndex, setBatchSelectedTemplateIndex] = useState<number>(0);
  const [batchCustomMessage, setBatchCustomMessage] = useState<string>('');
  const [batchIsSending, setBatchIsSending] = useState(false);

  // Available classes in tenant
  const uniqueClasses = useMemo(() => {
    return Array.from(new Set(students.map((s) => s.className))).filter(Boolean);
  }, [students]);

  // Templated Absence Reminders library
  const absenceTemplates = [
    {
      id: 'tpl-daily-absence',
      titleAr: 'تذكير بتقديم عذر طبي لغياب اليوم',
      titleEn: 'Today Absence & Medical Excuse Request',
      badgeAr: 'تذكير يومي',
      badgeEn: 'Daily Reminder',
      category: 'absence' as const,
      text: 'المكرم ولي أمر الطالب ({student_name}): نود إشعاركم بتسجيل غياب نجلكم المقيد بالصف ({class_name}) اليوم. نأمل الدخول إلى بوابة ولي الأمر لتقديم العذر الطبي المعتمد خلال 3 أيام لتفادي حسم درجات المواظبة. مدرسة ({school_name}).',
    },
    {
      id: 'tpl-chronic-warning',
      titleAr: 'إنذار رسمي لتجاوز نصاب أيام الغياب',
      titleEn: 'Official Warning for Repeated Absences',
      badgeAr: 'إنذار رسمي',
      badgeEn: 'Official Warning',
      category: 'warning' as const,
      text: 'إشعار رسمي عاجل: المكرم ولي أمر الطالب ({student_name})، نفيدكم بأن إجمالي أيام غياب نجلكم بلغ ({absences_count}) أيام. نرجو الدخول لبوابة ولي الأمر والمبادرة بتقديم الأعذار المقبولة ومراجعة إدارة مدرسة ({school_name}) حفظاً على مستواه الأكاديمي.',
    },
    {
      id: 'tpl-excuse-deadline',
      titleAr: 'تذكير بانتهاء مهلة رفع التقرير الطبي (3 أيام)',
      titleEn: 'Medical Excuse Deadline Approaching',
      badgeAr: 'مهلة التقرير',
      badgeEn: 'Deadline Notice',
      category: 'absence' as const,
      text: 'المكرم ولي أمر الطالب ({student_name}): نود تذكيركم بقرب انتهاء المهلة النظامية (3 أيام) لرفع العذر الطبي المعتمد لغياب نجلكم. يرجى إرفاق صورة التقرير عبر بوابة ولي الأمر لاعتماده تلقائياً قبل إغلاق الفترة.',
    },
    {
      id: 'tpl-unexcused-alert',
      titleAr: 'تنبيه غياب غير مبرر والتأثير على السلوك والمواظبة',
      titleEn: 'Unexcused Absence Policy Notice',
      badgeAr: 'لائحة المواظبة',
      badgeEn: 'Policy Notice',
      category: 'absence' as const,
      text: 'المكرم ولي أمر الطالب ({student_name}): تم رصد غياب بدون عذر مقبول لنجلكم بالصف ({class_name}). حرصاً على درجات المواظبة والانضباط المدرسي، نرجو مراجعة التوجيه الطلابي بمدرسة ({school_name}).',
    },
    {
      id: 'tpl-custom',
      titleAr: 'صياغة رسالة تذكير مخصصة',
      titleEn: 'Custom Reminder Message',
      badgeAr: 'مخصص',
      badgeEn: 'Custom',
      category: 'absence' as const,
      text: 'المكرم ولي أمر الطالب ({student_name}): نأمل منكم التكرم بتقديم العذر المعتمد لغياب نجلكم بالصف ({class_name}) لدى مدرسة ({school_name}).',
    },
  ];

  // Initialize batch custom message with template 0 on first open
  const currentBatchMessage =
    batchCustomMessage || absenceTemplates[batchSelectedTemplateIndex]?.text || '';

  // Filter students for batch selection
  const filteredBatchStudents = useMemo(() => {
    return students.filter((s) => {
      // Class filter
      if (batchClassFilter !== 'all' && s.className !== batchClassFilter) return false;

      // Absence status filter
      if (batchAbsenceFilter === 'all_absent' && (s.totalAbsences || 0) <= 0) return false;
      if (batchAbsenceFilter === 'chronic' && (s.totalAbsences || 0) < 3) return false;

      // Search query
      if (batchSearchQuery.trim()) {
        const q = batchSearchQuery.toLowerCase();
        const matchName = s.fullName.toLowerCase().includes(q);
        const matchGuardian = s.guardianName.toLowerCase().includes(q);
        const matchPhone = s.guardianPhone.includes(q);
        const matchClass = s.className.toLowerCase().includes(q);
        if (!matchName && !matchGuardian && !matchPhone && !matchClass) return false;
      }

      return true;
    });
  }, [students, batchClassFilter, batchAbsenceFilter, batchSearchQuery]);

  // Open Batch Modal with preselected absent students
  const handleOpenBatchModal = () => {
    // By default, select all students with recorded absences
    const absentIds = students.filter((s) => (s.totalAbsences || 0) > 0).map((s) => s.id);
    setBatchSelectedIds(absentIds);
    setBatchAbsenceFilter('all_absent');
    setBatchClassFilter('all');
    setBatchSearchQuery('');
    setBatchSelectedTemplateIndex(0);
    setBatchCustomMessage(absenceTemplates[0].text);
    setIsBatchModalOpen(true);
  };

  // Toggle single student in batch selection
  const toggleStudentSelection = (id: string) => {
    setBatchSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all or clear in batch
  const handleToggleSelectAllBatch = () => {
    const visibleIds = filteredBatchStudents.map((s) => s.id);
    const allSelected = visibleIds.every((id) => batchSelectedIds.includes(id));

    if (allSelected) {
      setBatchSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setBatchSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Execute Batch Send
  const handleExecuteBatchSend = async () => {
    if (batchSelectedIds.length === 0 || !currentBatchMessage.trim()) return;

    setBatchIsSending(true);

    try {
      const activeTemplate = absenceTemplates[batchSelectedTemplateIndex];
      const count = sendCustomParentNotification({
        studentIds: batchSelectedIds,
        messageText: currentBatchMessage,
        channel: batchChannel,
        category: activeTemplate?.category || 'absence',
      });

      setIsBatchModalOpen(false);
      setSentSuccessAlert(
        lang === 'ar'
          ? `تم إدراج ${count} تذكير في الطابور وسيُرسَل عبر بوابة المدرسة المُهيأة.`
          : `Queued ${count} reminder(s); dispatching through the school's configured gateway.`
      );
      setTimeout(() => setSentSuccessAlert(null), 6000);
    } catch (err) {
      console.error('Batch send error:', err);
    } finally {
      setBatchIsSending(false);
    }
  };

  // Single Compose Send
  const handleSendSingleCustom = () => {
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

    setIsComposeOpen(false);
    setComposeMessage('');
    setSentSuccessAlert(
      lang === 'ar'
        ? `تم إدراج ${count} رسالة في الطابور وسيُرسَل عبر بوابة المدرسة المُهيأة.`
        : `Queued ${count} message(s); dispatching through the school's configured gateway.`
    );
    setTimeout(() => setSentSuccessAlert(null), 5000);
  };

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
  const studentsWithAbsences = students.filter((s) => (s.totalAbsences || 0) > 0);

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

  // First selected student for live variable preview
  const firstSelectedStudent = useMemo(() => {
    if (batchSelectedIds.length > 0) {
      return students.find((s) => s.id === batchSelectedIds[0]) || students[0];
    }
    return students[0];
  }, [batchSelectedIds, students]);

  // Preview message with replaced tokens
  const previewRenderedMessage = useMemo(() => {
    if (!firstSelectedStudent) return currentBatchMessage;
    return currentBatchMessage
      .replace(/\{student_name\}/g, firstSelectedStudent.fullName)
      .replace(/\{guardian_name\}/g, firstSelectedStudent.guardianName)
      .replace(/\{class_name\}/g, firstSelectedStudent.className)
      .replace(/\{absences_count\}/g, String(firstSelectedStudent.totalAbsences || 1))
      .replace(/\{school_name\}/g, currentTenant.name);
  }, [currentBatchMessage, firstSelectedStudent, currentTenant.name]);

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
                  const isPending = notif.status === 'pending';
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
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900">
                      {lang === 'ar' ? 'إرسال تذكيرات غياب جماعية (Batch Absence Reminders)' : 'Batch Absence Reminders'}
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {lang === 'ar' ? 'واتساب / SMS' : 'WhatsApp / SMS'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {lang === 'ar'
                      ? 'حدد عدة طلاب دفعة واحدة وأرسل قوالب تذكير الغياب وطلب العذر الطبي بضغطة واحدة'
                      : 'Select multiple students and dispatch templated absence reminders to guardians'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto space-y-5 pr-1 flex-1">
              {/* SECTION 1: Multi-Student Selector */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <label className="text-xs font-bold text-slate-800">
                      {lang === 'ar' ? 'تحديد الطلاب المستهدفين للتذكير:' : 'Select Target Students:'}
                    </label>
                    <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2 py-0.5 rounded-md">
                      {lang === 'ar'
                        ? `تم تحديد (${batchSelectedIds.length}) من أصل (${filteredBatchStudents.length})`
                        : `Selected (${batchSelectedIds.length}) of (${filteredBatchStudents.length})`}
                    </span>
                  </div>

                  {/* Quick Select / Deselect All */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSelectAllBatch}
                      className="text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors"
                    >
                      {filteredBatchStudents.every((s) => batchSelectedIds.includes(s.id))
                        ? (lang === 'ar' ? 'إلغاء تحديد المعروض' : 'Deselect All')
                        : (lang === 'ar' ? 'تحديد جميع المعروضين' : 'Select All Filtered')}
                    </button>
                  </div>
                </div>

                {/* Filters Strip for Student Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Absence Category Filter */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setBatchAbsenceFilter('all_absent')}
                      className={`flex-1 py-1 px-2 rounded-md font-semibold text-[11px] transition-colors cursor-pointer text-center ${
                        batchAbsenceFilter === 'all_absent'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'ar' ? 'لديهم غياب مسجل' : 'Has Absences'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchAbsenceFilter('chronic')}
                      className={`flex-1 py-1 px-2 rounded-md font-semibold text-[11px] transition-colors cursor-pointer text-center ${
                        batchAbsenceFilter === 'chronic'
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'ar' ? 'غياب متكرر (3+)' : 'High (3+)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchAbsenceFilter('all')}
                      className={`flex-1 py-1 px-2 rounded-md font-semibold text-[11px] transition-colors cursor-pointer text-center ${
                        batchAbsenceFilter === 'all'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'ar' ? 'الكل' : 'All'}
                    </button>
                  </div>

                  {/* Class Filter */}
                  <div>
                    <select
                      value={batchClassFilter}
                      onChange={(e) => setBatchClassFilter(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      <option value="all">{lang === 'ar' ? 'جميع الفصول الدراسية' : 'All Classes'}</option>
                      {uniqueClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          فصل {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'بحث بالاسم أو الفصل...' : 'Filter students...'}
                      value={batchSearchQuery}
                      onChange={(e) => setBatchSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pr-8 pl-2 py-1.5 text-xs"
                    />
                  </div>
                </div>

                {/* Multi-Student Selection Grid / Cards */}
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
                  {filteredBatchStudents.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      {lang === 'ar' ? 'لا يوجد طلاب مطابقين للفلاتر المحددة' : 'No students match filter criteria'}
                    </div>
                  ) : (
                    filteredBatchStudents.map((std) => {
                      const isSelected = batchSelectedIds.includes(std.id);
                      return (
                        <div
                          key={std.id}
                          onClick={() => toggleStudentSelection(std.id)}
                          className={`flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by container onClick
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                            />
                            <div>
                              <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                <span>{std.fullName}</span>
                                <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {std.className}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                <span>ولي الأمر: {std.guardianName}</span>
                                <span className="font-mono text-slate-600" dir="ltr">{std.guardianPhone}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                (std.totalAbsences || 0) >= 3
                                  ? 'bg-rose-100 text-rose-800'
                                  : (std.totalAbsences || 0) > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {std.totalAbsences || 0} {lang === 'ar' ? 'أيام غياب' : 'days absent'}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* SECTION 2: Channel & Templated Reminders */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <label className="text-xs font-bold text-slate-800">
                    {lang === 'ar' ? 'اختيار القناة وقالب تذكير الغياب:' : 'Channel & Absence Reminder Template:'}
                  </label>
                </div>

                {/* WhatsApp vs SMS Gateway Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBatchChannel('WhatsApp')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                      batchChannel === 'WhatsApp'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">WhatsApp Business API</div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          {lang === 'ar' ? 'معدل وصول وتفاعل 98%' : '98% open rate'}
                        </div>
                      </div>
                    </div>
                    {batchChannel === 'WhatsApp' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchChannel('SMS')}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                      batchChannel === 'SMS'
                        ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">بوابة الرسائل النصية (SMS)</div>
                        <div className="text-[10px] text-sky-700 font-medium">
                          {lang === 'ar' ? 'رسائل رسمية مشفرة' : 'Direct cellular delivery'}
                        </div>
                      </div>
                    </div>
                    {batchChannel === 'SMS' && (
                      <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    )}
                  </button>
                </div>

                {/* Predefined Absence Reminder Templates */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-600 block">
                    {lang === 'ar' ? 'اختر قالب تذكير الغياب المعتمد:' : 'Select Templated Absence Reminder:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {absenceTemplates.map((tpl, idx) => {
                      const isSelected = batchSelectedTemplateIndex === idx;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setBatchSelectedTemplateIndex(idx);
                            setBatchCustomMessage(tpl.text);
                          }}
                          className={`p-2.5 rounded-lg border text-right transition-all cursor-pointer space-y-1 ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{lang === 'ar' ? tpl.titleAr : tpl.titleEn}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                isSelected ? 'bg-emerald-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {lang === 'ar' ? tpl.badgeAr : tpl.badgeEn}
                            </span>
                          </div>
                          <p
                            className={`text-[11px] line-clamp-2 leading-relaxed ${
                              isSelected ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {tpl.text}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message Customization Textarea & Dynamic Variable Pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <label className="font-bold">
                      {lang === 'ar' ? 'نص التذكير المعتمد للإرسال:' : 'Message Content to Dispatch:'}
                    </label>
                    <span className="font-mono text-[11px] text-slate-500">
                      {currentBatchMessage.length} {lang === 'ar' ? 'حرف' : 'chars'}
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={currentBatchMessage}
                    onChange={(e) => setBatchCustomMessage(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-sans leading-relaxed"
                  />

                  {/* Dynamic Token Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-semibold text-slate-500">
                      {lang === 'ar' ? 'إدراج متغيرات ذكية:' : 'Insert Variables:'}
                    </span>
                    {[
                      { token: '{student_name}', label: lang === 'ar' ? 'اسم الطالب' : 'Student Name' },
                      { token: '{guardian_name}', label: lang === 'ar' ? 'اسم ولي الأمر' : 'Guardian Name' },
                      { token: '{class_name}', label: lang === 'ar' ? 'الفصل' : 'Class' },
                      { token: '{absences_count}', label: lang === 'ar' ? 'أيام الغياب' : 'Absences Count' },
                      { token: '{school_name}', label: lang === 'ar' ? 'اسم المدرسة' : 'School' },
                    ].map((tok) => (
                      <button
                        key={tok.token}
                        type="button"
                        onClick={() => {
                          setBatchCustomMessage((prev) => (prev ? `${prev} ${tok.token}` : tok.token));
                        }}
                        className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-800 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        + {tok.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Live Realistic Phone Preview */}
              <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {lang === 'ar'
                        ? `معاينة حية للرسالة (للطالب: ${firstSelectedStudent?.fullName || 'عينة'}) عبر (${batchChannel}):`
                        : `Live Preview (${batchChannel}):`}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {firstSelectedStudent?.guardianPhone || '05xxxxxxxx'}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-xl text-xs max-w-lg shadow-xs leading-relaxed ${
                    batchChannel === 'WhatsApp'
                      ? 'bg-emerald-100/90 text-emerald-950 border border-emerald-300 ml-auto'
                      : 'bg-white text-slate-900 border border-slate-300 ml-auto'
                  }`}
                >
                  <p>{previewRenderedMessage}</p>
                  <div className="text-[9px] text-slate-400 text-left font-mono mt-1">
                    {new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer / Dispatch Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 shrink-0">
              <div className="text-xs text-slate-600">
                {lang === 'ar'
                  ? `إجمالي المستهدفين: ${batchSelectedIds.length} ولي أمر`
                  : `Targeting: ${batchSelectedIds.length} guardian(s)`}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="button"
                  onClick={handleExecuteBatchSend}
                  disabled={batchSelectedIds.length === 0 || !currentBatchMessage.trim() || batchIsSending}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {batchIsSending ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>{lang === 'ar' ? 'جارٍ الإرسال للطابور...' : 'Enqueuing...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {lang === 'ar'
                          ? `إرسال الدفعة (${batchSelectedIds.length} تذكير عبر ${batchChannel})`
                          : `Dispatch Batch (${batchSelectedIds.length} reminders)`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SINGLE COMPOSE MODAL (Fallback for single recipient/class) */}
      {/* ======================================================== */}
      {isComposeOpen && (
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
                onClick={() => setIsComposeOpen(false)}
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
                onClick={() => setIsComposeOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSendSingleCustom}
                disabled={!composeMessage.trim()}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'إرسال' : 'Send'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
