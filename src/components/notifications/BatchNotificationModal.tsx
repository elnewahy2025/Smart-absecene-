import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, MessageSquare, RotateCcw, Search, Send, Smartphone, Sparkles, Users, X } from 'lucide-react';
import { Student } from '../../types/attendance';
import { absenceTemplates } from '../../data/absenceNotificationTemplates';

interface BatchNotificationModalProps {
  isOpen: boolean;
  lang: 'ar' | 'en';
  students: Student[];
  uniqueClasses: string[];
  currentTenantName: string;
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

export const BatchNotificationModal: React.FC<BatchNotificationModalProps> = ({
  isOpen,
  lang,
  students,
  uniqueClasses,
  currentTenantName,
  onClose,
  onSentAlert,
  sendCustomParentNotification,
}) => {
  // ==========================================
  // BATCH NOTIFICATION FEATURE STATE
  // ==========================================
  const [batchSelectedIds, setBatchSelectedIds] = useState<string[]>([]);
  const [batchClassFilter, setBatchClassFilter] = useState<string>('all');
  const [batchAbsenceFilter, setBatchAbsenceFilter] = useState<'all_absent' | 'chronic' | 'all'>('all_absent');
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [batchChannel, setBatchChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [batchSelectedTemplateIndex, setBatchSelectedTemplateIndex] = useState<number>(0);
  const [batchCustomMessage, setBatchCustomMessage] = useState<string>('');
  const [batchIsSending, setBatchIsSending] = useState(false);
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setBatchSelectedIds(students.filter((s) => (s.totalAbsences || 0) > 0).map((s) => s.id));
      setBatchAbsenceFilter('all_absent');
      setBatchClassFilter('all');
      setBatchSearchQuery('');
      setBatchSelectedTemplateIndex(0);
      setBatchCustomMessage(absenceTemplates[0].text);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, students]);

  const currentBatchMessage =
    batchCustomMessage || absenceTemplates[batchSelectedTemplateIndex]?.text || '';
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

      onClose();
      onSentAlert(
        lang === 'ar'
          ? `تم إدراج ${count} تذكير في الطابور وسيُرسَل عبر بوابة المدرسة المُهيأة.`
          : `Queued ${count} reminder(s); dispatching through the school's configured gateway.`,
        6000
      );
    } catch (err) {
      console.error('Batch send error:', err);
    } finally {
      setBatchIsSending(false);
    }
  };
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
      .replace(/\{school_name\}/g, currentTenantName);
  }, [currentBatchMessage, firstSelectedStudent, currentTenantName]);
  if (!isOpen) return null;

  return (
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
                onClick={() => onClose()}
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
                  onClick={() => onClose()}
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
  );
};
