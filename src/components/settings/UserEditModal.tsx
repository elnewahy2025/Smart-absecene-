import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import {
  UserCheck,
  ShieldCheck,
  GraduationCap,
  Users2,
  X,
  Check,
  Save,
  BookOpen,
  School,
  AlertCircle,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types/attendance';
import { useAttendance } from '../../context/AttendanceContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null; // null means create new
  onSave: (data: Omit<UserProfile, 'id' | 'tenantId'>) => Promise<{ success: boolean; message?: string }>;
  isSaving?: boolean;
  availableClasses: string[];
  availableSubjects: string[];
  lang: 'ar' | 'en';
}

export const UserEditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  onSave,
  isSaving = false,
  availableClasses,
  availableSubjects,
  lang,
}) => {
  const { schoolProfile } = useAttendance();
  const dialCode = schoolProfile?.countryCallingCode || schoolProfile?.address?.countryCallingCode || '+966';

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [role, setRole] = useState<UserRole>(user?.role || 'teacher');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(user?.status || 'active');
  const [assignedClasses, setAssignedClasses] = useState<string[]>(user?.assignedClasses || []);
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>(user?.assignedSubjects || []);
  const [customSubject, setCustomSubject] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });

  if (!isOpen) return null;

  const toggleClass = (cls: string) => {
    setAssignedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const toggleSubject = (sub: string) => {
    setAssignedSubjects((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const handleAddCustomSubject = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = customSubject.trim();
    if (trimmed && !assignedSubjects.includes(trimmed)) {
      setAssignedSubjects((prev) => [...prev, trimmed]);
      setCustomSubject('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const result = await onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      jobTitle: jobTitle.trim() || undefined,
      status,
      assignedClasses: role === 'teacher' ? assignedClasses : undefined,
      assignedSubjects: role === 'teacher' ? assignedSubjects : undefined,
    });

    if (!result || result.success) {
      onClose();
    }
  };

  const content = (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Edit staff member"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {user ? (lang === 'ar' ? 'تعديل بيانات وصلاحيات المستخدم' : 'Edit User & Role') : (lang === 'ar' ? 'إضافة مستخدم جديد في النظام' : 'Add New User')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'ar' ? 'إدارة الصلاحيات، الفصول المسندة، والمواد التدريسية' : 'Manage roles, class access, and assigned subjects'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Basic Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{lang === 'ar' ? 'الاسم الكامل:' : 'Full Name:'}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === 'ar' ? 'أ. محمد أحمد الغامدي' : 'Mr. Mohammed Ahmed Al-Ghamdi'}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{lang === 'ar' ? 'المسمى الوظيفي:' : 'Job Title:'}</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={lang === 'ar' ? 'معلم أول / موجه طلابي' : 'Senior Teacher / Student Counselor'}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{lang === 'ar' ? 'البريد الإلكتروني المعتمد:' : 'Email Address:'}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@andalus-school.edu.sa"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>


            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span>{lang === 'ar' ? 'رقم الهاتف / الجوال:' : 'Phone Number:'}</span>
                <span className="font-mono text-[10px] text-indigo-600 font-normal" dir="ltr">{dialCode}</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={`${dialCode}500000000`}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{lang === 'ar' ? 'الدور والصلاحية (RBAC):' : 'Role (RBAC):'}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="admin">{lang === 'ar' ? 'مدير المدرسة (Admin - صلاحيات كاملة)' : 'School Principal (Admin - full permissions)'}</option>
                <option value="registrar">{lang === 'ar' ? 'شؤون الطلاب (Registrar - إدارة الطلاب والأعذار)' : 'Student Affairs (Registrar - students & excuses)'}</option>
                <option value="teacher">{lang === 'ar' ? 'معلم (Teacher - تحضير الفصول المسندة فقط)' : 'Teacher (attendance for assigned classes only)'}</option>
                <option value="parent">{lang === 'ar' ? 'ولي أمر (Parent - متابعة الأبناء فقط)' : 'Parent (follow up on children only)'}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">{lang === 'ar' ? 'حالة الحساب:' : 'Account Status:'}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="active">{lang === 'ar' ? 'نشط (مسموح له بالدخول)' : 'Active (allowed to sign in)'}</option>
                <option value="inactive">{lang === 'ar' ? 'معطل (موقوف مؤقتاً)' : 'Inactive (temporarily suspended)'}</option>
              </select>
            </div>
          </div>

          {/* TEACHER ASSIGNMENTS SECTION */}
          {role === 'teacher' && (
            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-3 pt-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold">
                <School className="w-4 h-4 text-indigo-600" />
                <span>{lang === 'ar' ? 'الفصول الدراسية المسندة للمعلم:' : 'Assigned Classes:'}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {lang === 'ar'
                  ? 'يسمح نظام الحماية للمعلم برصد وتعديل كشوف الحضور لهذه الفصول فقط، ويمنعه من الاطلاع على فصول غير مسندة.'
                  : 'Teacher can only access attendance sheets for the selected classes.'}
              </p>

              <div className="flex flex-wrap gap-2">
                {availableClasses.map((cls) => {
                  const isChecked = assignedClasses.includes(cls);
                  return (
                    <button
                      type="button"
                      key={cls}
                      onClick={() => toggleClass(cls)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                      <span>{cls}</span>
                    </button>
                  );
                })}
              </div>

              {/* SUBJECTS ASSIGNMENT */}
              <div className="pt-2 border-t border-indigo-100/80 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>{lang === 'ar' ? 'المواد الدراسية المسندة:' : 'Assigned Subjects:'}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {availableSubjects.map((sub) => {
                    const isChecked = assignedSubjects.includes(sub);
                    return (
                      <button
                        type="button"
                        key={sub}
                        onClick={() => toggleSubject(sub)}
                        className={`px-2.5 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                        <span>{sub}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Subject Tag Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    onKeyDown={handleAddCustomSubject}
                    placeholder={lang === 'ar' ? 'إضافة مادة دراسية أخرى...' : 'Add custom subject...'}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    {lang === 'ar' ? 'إضافة' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? (lang === 'ar' ? 'جارٍ الحفظ…' : 'Saving…') : lang === 'ar' ? 'حفظ التغييرات' : 'Save User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
