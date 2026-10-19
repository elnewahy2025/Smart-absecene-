import React, { useState } from 'react';
import {
  Users2,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  Search,
  Filter,
  Edit2,
  Trash2,
  BookOpen,
  School,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types/attendance';
import { UserEditModal } from './UserEditModal';

interface Props {
  users: UserProfile[];
  onCreateUser: (data: Omit<UserProfile, 'id' | 'tenantId'>) => Promise<{
    success: boolean;
    message: string;
    temporaryPassword?: string;
  }>;
  onUpdateUser: (userId: string, data: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>;
  onDeleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  canManageUsers: boolean;
  availableClasses?: string[];
  availableSubjects?: string[];
  lang: 'ar' | 'en';
}

export const UserManagementTab: React.FC<Props> = ({
  users,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  canManageUsers,
  availableClasses: propClasses,
  availableSubjects: propSubjects,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [accountNotice, setAccountNotice] = useState<{ email: string; password: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fallbackClasses = Array.from(new Set(users.flatMap((u) => u.assignedClasses || []))).filter(Boolean);
  const availableClasses = propClasses && propClasses.length > 0 ? propClasses : fallbackClasses;
  const fallbackSubjects = Array.from(new Set(users.flatMap((u) => u.assignedSubjects || []))).filter(Boolean);
  const availableSubjects = propSubjects && propSubjects.length > 0 ? propSubjects : fallbackSubjects;

  const roleLabels: Record<UserRole, { ar: string; en: string; badge: string }> = {
    super_admin: { ar: 'مالك المنصة', en: 'Platform Owner', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
    admin: { ar: 'مدير المدرسة', en: 'Principal (Admin)', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
    registrar: { ar: 'شؤون الطلاب', en: 'Registrar / Counselor', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    teacher: { ar: 'معلم الفصل', en: 'Teacher', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    parent: { ar: 'ولي أمر', en: 'Parent', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  };

  const filteredUsers = users.filter((u) => {
    // STEALTH: The Owner / super_admin is NEVER displayed in standard school staff lists
    if (u.role === 'super_admin') return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: UserProfile) => {
    if (!window.confirm(lang === 'ar' ? `هل أنت متأكد من حذف المستخدم (${user.name}) نهائياً؟` : `Delete user (${user.name})?`)) {
      return;
    }
    const res = await onDeleteUser(user.id);
    setFeedbackMsg({ text: res.message, error: !res.success });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleSaveModal = async (data: Omit<UserProfile, 'id' | 'tenantId'>) => {
    setIsSaving(true);
    try {
      const res = editingUser ? await onUpdateUser(editingUser.id, data) : await onCreateUser(data);
      setFeedbackMsg({ text: res.message, error: !res.success });
      setTimeout(() => setFeedbackMsg(null), 6000);

      const created = res as { temporaryPassword?: string };
      if (!editingUser && res.success && created.temporaryPassword) {
        setAccountNotice({ email: data.email, password: created.temporaryPassword });
      }
      return res;
    } catch (err: any) {
      const message = err?.message || (lang === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected error');
      setFeedbackMsg({ text: message, error: true });
      return { success: false, message };
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>{lang === 'ar' ? 'إدارة المستخدمين وصلاحيات المعلمين (RBAC)' : 'User Management & Teacher Roles'}</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            {lang === 'ar'
              ? `إجمالي منسوبي المدرسة في النظام (${users.length}) مستخدم · التحكم بالصلاحيات وإسناد الفصول والمواد`
              : `Total school staff: ${users.length} · Control roles and assign teacher classes/subjects`}
          </p>
        </div>

        {canManageUsers && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}</span>
          </button>
        )}
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            feedbackMsg.error ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {feedbackMsg.error ? <XCircle className="w-4 h-4 text-rose-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {accountNotice && (
        <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-900 text-xs space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              {lang === 'ar' ? 'بيانات دخول الموظف الجديد' : 'New staff login credentials'}
            </span>
            <button
              type="button"
              onClick={() => setAccountNotice(null)}
              className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="font-mono text-[11px] space-y-0.5" dir="ltr">
            <div>email: {accountNotice.email}</div>
            <div>password: {accountNotice.password}</div>
          </div>
          <p className="text-[11px] text-indigo-700">
            {lang === 'ar'
              ? 'سلّم هذه البيانات للموظف الآن. يمكن تغيير الدور والصلاحيات لاحقاً من نفس الصفحة.'
              : 'Share these credentials with the staff member now.'}
          </p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-medium">{lang === 'ar' ? 'تصفية بالدور:' : 'Filter Role:'}</span>
          {(['all', 'admin', 'registrar', 'teacher', 'parent'] as const).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                roleFilter === r
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {r === 'all'
                ? lang === 'ar' ? 'الكل' : 'All'
                : lang === 'ar' ? roleLabels[r].ar : roleLabels[r].en}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'بحث بالاسم، البريد، أو الهاتف...' : 'Search name, email, phone...'}
            className="w-full bg-white border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'اسم المستخدم' : 'Name'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'الدور والصلاحية' : 'Role'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'البريد والهاتف' : 'Contact'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'الفصول والمواد المسندة' : 'Assigned Classes & Subjects'}</th>
                <th className="py-3 px-4 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-4 text-center">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    {lang === 'ar' ? 'لا يوجد مستخدمين مطابقين لمعايير البحث' : 'No users found'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      {u.jobTitle && <div className="text-[11px] text-slate-500">{u.jobTitle}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleLabels[u.role].badge}`}>
                        {lang === 'ar' ? roleLabels[u.role].ar : roleLabels[u.role].en}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 space-y-0.5">
                      <div className="font-semibold text-slate-800">{u.email}</div>
                      <div className="text-[11px] text-slate-400" dir="ltr">{u.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'teacher' ? (
                        <div className="space-y-1 max-w-xs">
                          {u.assignedClasses && u.assignedClasses.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <School className="w-3 h-3 text-indigo-500 shrink-0" />
                              {u.assignedClasses.map((c) => (
                                <span key={c} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">لا توجد فصول مسندة</span>
                          )}

                          {u.assignedSubjects && u.assignedSubjects.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <BookOpen className="w-3 h-3 text-emerald-500 shrink-0" />
                              {u.assignedSubjects.map((s) => (
                                <span key={s} className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded text-[10px]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {u.role === 'parent' ? 'صلاحية أبناء فقط' : 'صلاحية مدرسية شاملة'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'inactive' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.status === 'inactive' ? (lang === 'ar' ? 'معطل' : 'Inactive') : (lang === 'ar' ? 'نشط' : 'Active')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          disabled={!canManageUsers}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer disabled:opacity-40"
                          title="تعديل المستخدم والصلاحيات"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          disabled={!canManageUsers}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer disabled:opacity-40"
                          title="حذف المستخدم"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <UserEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={editingUser}
        onSave={handleSaveModal}
        isSaving={isSaving}
        availableClasses={availableClasses}
        availableSubjects={availableSubjects}
        lang={lang}
      />
    </div>
  );
};
