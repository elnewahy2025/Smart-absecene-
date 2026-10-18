import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import {
  ShieldAlert,
  ThumbsUp,
  AlertTriangle,
  PlusCircle,
  X,
  Calendar,
  Clock,
  User,
  Star,
  Award,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { Student, StudentBehaviourIncident, BehaviourType, BehaviourSeverity } from '../../types/attendance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  incidents: StudentBehaviourIncident[];
  onAddIncident: (incident: Omit<StudentBehaviourIncident, 'id' | 'tenantId'>) => void;
  lang: 'ar' | 'en';
  currentUserRole: string;
  currentUserName: string;
}

export const StudentBehaviourModal: React.FC<Props> = ({
  isOpen,
  onClose,
  student,
  incidents,
  onAddIncident,
  lang,
  currentUserRole,
  currentUserName,
}) => {
  const [activeTab, setActiveTab] = useState<'log' | 'new'>('log');
  const [filterType, setFilterType] = useState<'all' | 'positive' | 'infraction'>('all');

  // Form State
  const [type, setType] = useState<BehaviourType>('positive');
  const [severity, setSeverity] = useState<BehaviourSeverity>('minor');
  const [category, setCategory] = useState<string>('academic_excellence');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [points, setPoints] = useState<number>(3);
  const [actionTaken, setActionTaken] = useState<string>('');
  const [guardianNotified, setGuardianNotified] = useState<boolean>(true);
  const [successToast, setSuccessToast] = useState<boolean>(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });

  if (!isOpen) return null;

  const studentIncidents = incidents.filter((i) => i.studentId === student.id);
  const filteredIncidents = studentIncidents.filter((i) => {
    if (filterType === 'all') return true;
    return i.type === filterType;
  });

  const totalPoints = studentIncidents.reduce((acc, curr) => acc + curr.points, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onAddIncident({
      studentId: student.id,
      studentName: student.fullName,
      className: student.className,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      type,
      category,
      title,
      description,
      severity,
      points: type === 'positive' ? Math.abs(points) : -Math.abs(points),
      actionTaken: actionTaken.trim() || undefined,
      recordedBy: currentUserName,
      guardianNotified,
    });

    setTitle('');
    setDescription('');
    setActionTaken('');
    setSuccessToast(true);
    setTimeout(() => {
      setSuccessToast(false);
      setActiveTab('log');
    }, 1200);
  };

  const modalContent = (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Student behaviour record"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{student.fullName}</h3>
                <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  {student.className}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {lang === 'ar' ? 'سجل السلوك والمواظبة والتعزيز الإيجابي' : 'Behavior & Positive Recognition Log'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Points & Tab Bar */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('log')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'log' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lang === 'ar' ? `سجل الوقائع (${studentIncidents.length})` : `Incident Log (${studentIncidents.length})`}
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'new' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'تدوين واقعة جديدة' : 'Record Incident'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{lang === 'ar' ? 'رصيد نقاط السلوك:' : 'Behavior Score:'}</span>
            <span
              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full ${
                totalPoints >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {totalPoints >= 0 ? `+${totalPoints}` : totalPoints} {lang === 'ar' ? 'نقطة' : 'pts'}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'log' ? (
            <div className="space-y-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{lang === 'ar' ? 'تصفية:' : 'Filter:'}</span>
                {(['all', 'positive', 'infraction'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      filterType === t
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t === 'all'
                      ? lang === 'ar' ? 'الكل' : 'All'
                      : t === 'positive'
                      ? lang === 'ar' ? 'تعزيز إيجابي' : 'Positive'
                      : lang === 'ar' ? 'مخالفات' : 'Infractions'}
                  </button>
                ))}
              </div>

              {filteredIncidents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Star className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-xs">
                    {lang === 'ar' ? 'لا توجد وقائع مسجلة لهذا الطالب' : 'No records logged for this student'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                        inc.type === 'positive'
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {inc.type === 'positive' ? (
                            <ThumbsUp className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <h4 className="font-bold text-slate-900">{inc.title}</h4>
                        </div>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            inc.type === 'positive'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inc.points > 0 ? `+${inc.points}` : inc.points} {lang === 'ar' ? 'نقطة' : 'pts'}
                        </span>
                      </div>

                      <p className="text-slate-600 leading-relaxed">{inc.description}</p>

                      {inc.actionTaken && (
                        <div className="bg-white/80 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-700">
                          <span className="font-bold text-slate-900">{lang === 'ar' ? 'الإجراء المتخذ: ' : 'Action: '}</span>
                          {inc.actionTaken}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100/80">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {inc.date} {inc.time || ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {inc.recordedBy}
                          </span>
                        </div>
                        {inc.guardianNotified && (
                          <span className="flex items-center gap-1 text-emerald-700 font-medium">
                            <Bell className="w-3 h-3" />
                            {lang === 'ar' ? 'تم إشعار ولي الأمر' : 'Guardian Notified'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {successToast && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'تم حفظ الواقعة السلوكية بنجاح!' : 'Behavior record saved successfully!'}</span>
                </div>
              )}

              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setType('positive');
                    setPoints(3);
                    setCategory('academic_excellence');
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${
                    type === 'positive'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'تعزيز إيجابي (+)' : 'Positive Reward (+)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('infraction');
                    setPoints(2);
                    setCategory('unexcused_tardiness');
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold cursor-pointer transition-all ${
                    type === 'infraction'
                      ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{lang === 'ar' ? 'مخالفة سلوكية (-)' : 'Infraction (-)'}</span>
                </button>
              </div>

              {/* Title & Points */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700">{lang === 'ar' ? 'عنوان الواقعة' : 'Title'}</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={type === 'positive' ? 'مثال: تميز في التفاعل الصفي' : 'مثال: التأخر عن دخول الحصة'}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">{lang === 'ar' ? 'النقاط' : 'Points'}</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={points}
                    onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">{lang === 'ar' ? 'تفاصيل الواقعة' : 'Description'}</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب وصفاً موجزاً لما حدث...' : 'Describe what happened...'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Action Taken */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">{lang === 'ar' ? 'الإجراء التربوي المتخذ (اختياري)' : 'Action Taken (Optional)'}</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: تنبيه شفهي / شهادة شكر مصغرة' : 'E.g., verbal praise / warning'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Guardian Notified Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={guardianNotified}
                  onChange={(e) => setGuardianNotified(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">
                  {lang === 'ar' ? 'إشعار ولي أمر الطالب تلقائياً عبر الرسائل' : 'Notify guardian automatically'}
                </span>
              </label>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('log')}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer transition-colors"
                >
                  {lang === 'ar' ? 'حفظ الواقعة في السجل' : 'Save Incident'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
