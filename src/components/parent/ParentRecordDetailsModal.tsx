import React, { useRef } from 'react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  User,
  MessageSquare,
  Smartphone,
  Sparkles,
  FileCheck2,
  ExternalLink,
  Info,
  Award,
} from 'lucide-react';
import {
  Justification,
  NotificationOutboxItem,
  StudentBehaviourIncident,
  AttendanceStatus,
} from '../../types/attendance';

export type SelectedRecordType =
  | {
      type: 'absence_late';
      data: {
        sessionId: string;
        date: string;
        subject?: string;
        sessionType: 'daily' | 'period';
        periodNumber?: number;
        className: string;
        status: AttendanceStatus | string;
        minutesLate?: number;
        note?: string;
        teacherName?: string;
        justification?: Justification;
      };
    }
  | {
      type: 'infraction';
      data: StudentBehaviourIncident;
    }
  | {
      type: 'justification';
      data: Justification;
    }
  | {
      type: 'notification';
      data: NotificationOutboxItem;
    };

interface ParentRecordDetailsModalProps {
  record: SelectedRecordType | null;
  onClose: () => void;
  onOpenExcuseForm?: (studentId: string, date: string) => void;
  studentId?: string;
}

export const ParentRecordDetailsModal: React.FC<ParentRecordDetailsModalProps> = ({
  record,
  onClose,
  onOpenExcuseForm,
  studentId,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen: true, onClose, containerRef: dialogRef });
  if (!record) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            {record.type === 'absence_late' && (
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            )}
            {record.type === 'infraction' && (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  record.data.type === 'positive'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {record.data.type === 'positive' ? (
                  <Award className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
            )}
            {record.type === 'justification' && (
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
            )}
            {record.type === 'notification' && (
              <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 id="record-details-title" className="font-bold text-base text-slate-900">
                {record.type === 'absence_late' && 'تفاصيل قيد الحضور والغياب'}
                {record.type === 'infraction' &&
                  (record.data.type === 'positive'
                    ? 'تفاصيل السلوك الإيجابي والتميز'
                    : 'تفاصيل المخالفة السلوكية')}
                {record.type === 'justification' && 'تفاصيل العذر والتقرير الطبي'}
                {record.type === 'notification' && 'تفاصيل الإشعار والرسالة الموجهة'}
              </h3>
              <p className="text-xs text-slate-500">
                سجل رسمي معتمد وموثق في قاعدة بيانات المدرسة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* 1. Absence / Late Details */}
          {record.type === 'absence_late' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block mb-1">تاريخ اليوم</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {record.data.date}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block mb-1">الحصة / المادة</span>
                  <span className="font-bold text-slate-800">
                    {record.data.subject ||
                      (record.data.sessionType === 'daily'
                        ? 'حضور يومي شامل'
                        : `الحصة ${record.data.periodNumber || 1}`)}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block mb-1">الفصل الدراسي</span>
                  <span className="font-bold text-slate-800">{record.data.className}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">حالة القيد المسجلة:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      record.data.status === 'absent'
                        ? 'bg-rose-100 text-rose-800'
                        : record.data.status === 'late'
                        ? 'bg-amber-100 text-amber-800'
                        : record.data.status === 'excused_absence'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {record.data.status === 'absent'
                      ? 'غياب غير مبرر'
                      : record.data.status === 'late'
                      ? `تأخر (${record.data.minutesLate || 15} دقيقة)`
                      : record.data.status === 'excused_absence'
                      ? 'غياب بعذر رسمي مقبول'
                      : 'حاضر'}
                  </span>
                </div>
                {record.data.note && (
                  <div className="mt-2 text-xs bg-white p-3 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900 block mb-0.5">
                      ملاحظة المعلم / الراصد:
                    </span>
                    {record.data.note}
                  </div>
                )}
              </div>

              {/* Linked Justification info or action */}
              {record.data.justification ? (
                <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4 text-teal-600" />
                      <span className="font-bold text-teal-950 text-xs">
                        تم تقديم عذر لهذا الغياب
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        record.data.justification.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : record.data.justification.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {record.data.justification.status === 'approved'
                        ? 'معتمد ✅'
                        : record.data.justification.status === 'rejected'
                        ? 'مرفوض ❌'
                        : 'قيد المراجعة ⏳'}
                    </span>
                  </div>
                  <p className="text-xs text-teal-900 leading-relaxed">
                    {record.data.justification.guardianExplanation}
                  </p>
                </div>
              ) : (
                record.data.status === 'absent' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-900 text-xs block">
                        لم يتم تقديم عذر طبي بعد لهذا الغياب
                      </span>
                      <p className="text-[11px] text-amber-800">
                        يمكنكم رفع التقرير الطبي أو تبرير الغياب لتقوم إدارة المدرسة بمراجعته واعتماده.
                      </p>
                    </div>
                    {onOpenExcuseForm && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenExcuseForm(studentId || '', record.data.date);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors shrink-0 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FileCheck2 className="w-4 h-4" />
                        <span>تقديم عذر الآن</span>
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          {/* 2. Infraction / Behaviour Incident Details */}
          {record.type === 'infraction' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">عنوان الواقعة</span>
                  <h4 className="font-bold text-slate-900 text-sm">{record.data.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      record.data.type === 'positive'
                        ? 'bg-emerald-100 text-emerald-800'
                        : record.data.severity === 'major'
                        ? 'bg-rose-100 text-rose-800'
                        : record.data.severity === 'moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {record.data.type === 'positive'
                      ? 'سلوك إيجابي متميز (+)'
                      : record.data.severity === 'major'
                      ? 'مخالفة جسيمة (درجة ثالثة)'
                      : record.data.severity === 'moderate'
                      ? 'مخالفة متوسطة (درجة ثانية)'
                      : 'مخالفة بسيطة (درجة أولى)'}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                      record.data.points >= 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {record.data.points > 0 ? `+${record.data.points}` : record.data.points} نقطة
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block mb-1">التاريخ</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {record.data.date}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block mb-1">الوقت</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {record.data.time || 'صباحاً'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block mb-1">المسؤول عن الرصد</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {record.data.recordedBy}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-xs text-slate-900 block">وصف وتفاصيل الواقعة:</span>
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {record.data.description}
                </p>
              </div>

              {record.data.actionTaken && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-1">
                  <span className="font-bold text-xs text-amber-950 block">
                    الإجراء الإداري / التربوي المتخذ:
                  </span>
                  <p className="text-amber-900 text-xs sm:text-sm leading-relaxed">
                    {record.data.actionTaken}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>إشعار ولي الأمر بالواقعة:</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    record.data.guardianNotified ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {record.data.guardianNotified
                    ? 'تم إرسال إشعار رسمي لولي الأمر'
                    : 'لم يُرسل إشعار خارجي'}
                </span>
              </div>
            </div>
          )}

          {/* 3. Justification Details */}
          {record.type === 'justification' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">نوع العذر والتبرير</span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {record.data.reasonType === 'medical'
                      ? 'تقرير / إجازة طبية مرضية'
                      : record.data.reasonType === 'family'
                      ? 'ظرف أسري طارئ'
                      : record.data.reasonType === 'travel'
                      ? 'سفر واضطرار'
                      : 'عذر آخر'}
                  </h4>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    record.data.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : record.data.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {record.data.status === 'approved'
                    ? 'معتمد ومقبول رسمياً ✅'
                    : record.data.status === 'rejected'
                    ? 'عذر مرفوض ❌'
                    : 'قيد المراجعة والتدقيق ⏳'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block mb-1">تاريخ الغياب</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {record.data.absenceDate}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block mb-1">تاريخ التقديم</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(record.data.submittedAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block mb-1">المرفق المسجل</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {record.data.attachmentName || 'لا يوجد ملف مرفق'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-xs text-slate-900 block">شرح وتوضيح ولي الأمر:</span>
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {record.data.guardianExplanation}
                </p>
              </div>

              {/* AI Analysis Summary if present */}
              {record.data.aiAnalysis && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs text-slate-900">
                        نتيجة تدقيق الذكاء الاصطناعي (Gemini Medical Audit)
                      </span>
                    </div>
                    {record.data.aiAnalysis.integrityScore && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        الموثوقية: {record.data.aiAnalysis.integrityScore}%
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {record.data.aiAnalysis.issuerName && (
                      <div>
                        <span className="text-slate-500 block text-[11px]">الجهة المصدرة:</span>
                        <span className="font-semibold text-slate-800">
                          {record.data.aiAnalysis.issuerName}
                        </span>
                      </div>
                    )}
                    {record.data.aiAnalysis.physicianName && (
                      <div>
                        <span className="text-slate-500 block text-[11px]">الطبيب الممارس:</span>
                        <span className="font-semibold text-slate-800">
                          {record.data.aiAnalysis.physicianName}
                        </span>
                      </div>
                    )}
                    {record.data.aiAnalysis.reasonOrDiagnosis && (
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block text-[11px]">التشخيص / الراحة:</span>
                        <span className="font-semibold text-slate-800">
                          {record.data.aiAnalysis.reasonOrDiagnosis}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* School Reviewer info */}
              {record.data.reviewedBy && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-semibold text-emerald-950">
                    <span>المعتمد: {record.data.reviewedBy}</span>
                    <span>
                      {record.data.reviewedAt &&
                        new Date(record.data.reviewedAt).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  {record.data.reviewerNotes && (
                    <p className="text-emerald-900 leading-relaxed pt-1">
                      {record.data.reviewerNotes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. Notification Details */}
          {record.type === 'notification' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      record.data.category === 'warning'
                        ? 'bg-rose-100 text-rose-800'
                        : record.data.statusType === 'absent'
                        ? 'bg-rose-50 text-rose-700'
                        : record.data.statusType === 'late'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    {record.data.category === 'warning'
                      ? 'إنذار أكاديمي رسمي'
                      : record.data.statusType === 'absent'
                      ? 'إشعار غياب فوري'
                      : record.data.statusType === 'late'
                      ? 'تنبيه تأخر صباحي'
                      : record.data.category === 'excuse_approved'
                      ? 'اعتماد عذر طبي'
                      : 'تعميم مدرسي'}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                    {record.data.channel === 'WhatsApp' ? (
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
                    {new Date(record.data.createdAt).toLocaleString('ar-SA', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 block mb-1">تاريخ الغياب / الواقعة</span>
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {record.data.absenceDate}
                  </span>
                </div>
              </div>

              {/* Message Bubble Preview */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-900 block">نص الرسالة المرسلة:</span>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs font-sans text-slate-800 text-sm leading-relaxed">
                  {record.data.messageText}
                </div>
              </div>

              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                <span>
                  المستلم: <strong>{record.data.recipientName}</strong>
                </span>
                <span className="font-mono text-slate-500">{record.data.recipientPhone}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
