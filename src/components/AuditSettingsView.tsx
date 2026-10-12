import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  FileText,
  Sliders,
  Shield,
  Save,
  CheckCircle2,
  Clock,
  User,
  History,
  Check,
  Search,
  Filter,
  Building2,
  UserCog,
  Sparkles,
} from 'lucide-react';
import { SchoolIdentityTab } from './settings/SchoolIdentityTab';
import { SchoolContactTab } from './settings/SchoolContactTab';
import { SchoolLeadershipTab } from './settings/SchoolLeadershipTab';
import { AcademicCalendarTab } from './settings/AcademicCalendarTab';
import { EmergencyPolicyTab } from './settings/EmergencyPolicyTab';
import { UserManagementTab } from './settings/UserManagementTab';
import { SchoolAIGeminiTab } from './settings/SchoolAIGeminiTab';
import { HolidaysAndWeekendsCard } from './settings/HolidaysAndWeekendsCard';

export const AuditSettingsView: React.FC = () => {
  const {
    auditLogs,
    settings,
    updateSettings,
    schoolProfile,
    updateSchoolProfile,
    lang,
    currentTenant,
    currentUser,
    canManageSettings,
    users,
    createUser,
    updateUser,
    deleteUser,
    classesStats,
  } = useAttendance();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'settings' | 'users' | 'ai' | 'audit'>('profile');
  const [activeProfileTab, setActiveProfileTab] = useState<'identity' | 'contact' | 'leadership' | 'calendar' | 'emergency'>('identity');
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [searchAudit, setSearchAudit] = useState<string>('');

  // Editable form states
  const [formSettings, setFormSettings] = useState(settings);
  const [formProfile, setFormProfile] = useState(schoolProfile);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync state if tenant or context changes
  React.useEffect(() => {
    setFormProfile(schoolProfile);
  }, [schoolProfile]);

  React.useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const filteredLogs = auditLogs.filter((log) => {
    if (auditFilter !== 'all' && log.entityType !== auditFilter) return false;
    if (searchAudit) {
      const q = searchAudit.toLowerCase();
      return (
        log.performerName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) {
      alert(lang === 'ar' ? 'تعديل الإعدادات محصور بمدير المدرسة فقط.' : 'Only administrators can update settings.');
      return;
    }
    updateSettings(formSettings);
    if (formSettings.weekendDays || formSettings.officialHolidays) {
      updateSchoolProfile({
        weekendDays: formSettings.weekendDays,
        officialHolidays: formSettings.officialHolidays,
      });
    }
    setSaveSuccessMsg('تم حفظ وتطبيق قواعد المدرسة والعطلات الرسمية بنجاح وتوثيق التحديث في سجل التدقيق.');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleSaveProfile = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!canManageSettings) {
      alert(lang === 'ar' ? 'تعديل ملف المدرسة محصور بمدير المدرسة فقط.' : 'Only administrators can update school profile.');
      return;
    }
    await updateSchoolProfile(formProfile);
    if (formProfile.weekendDays || formProfile.officialHolidays) {
      updateSettings({
        ...formSettings,
        weekendDays: formProfile.weekendDays,
        officialHolidays: formProfile.officialHolidays,
      });
    }
    setSaveSuccessMsg('تم حفظ وتطبيق الملف التعريفي والتقويم المدرسي بنجاح وتوثيق التحديث في سجل التدقيق.');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>{lang === 'ar' ? 'ملف المدرسة والبيانات القيادية' : 'School Profile & Leadership'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-500" />
          <span>{lang === 'ar' ? 'قواعد وإعدادات الغياب والتأخر' : 'Attendance & Absence Policies'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <UserCog className="w-4 h-4 text-indigo-400" />
          <span>{lang === 'ar' ? 'إدارة المستخدمين والصلاحيات (RBAC)' : 'User Management & Roles'}</span>
          <span className="text-[10px] bg-slate-700 text-slate-100 px-1.5 py-0.2 rounded font-mono">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'ai'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ar' ? 'الذكاء الاصطناعي (Gemini AI)' : 'Gemini AI Engine'}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <History className="w-4 h-4 text-amber-500" />
          <span>{lang === 'ar' ? 'سجل التدقيق والحوكمة' : 'Immutable Audit Log'}</span>
          <span className="text-[10px] bg-slate-700 text-slate-100 px-1.5 py-0.2 rounded font-mono">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* SUB-TAB 0: SCHOOL PROFILE & LEADERSHIP */}
      {activeSubTab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'ar' ? 'الملف التعريفي والقيادي الموحد للمدرسة' : 'School Profile & Leadership Hub'}
              </h3>
              <p className="text-xs text-slate-500">
                {formProfile.schoolName} ({formProfile.schoolCode}) · ترتبط كافة التقارير الرسمية، الإشعارات، وكشوف الطوارئ بهذه البيانات
              </p>
            </div>

            {canManageSettings && (
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-xs shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>{lang === 'ar' ? 'حفظ وتحديث ملف المدرسة' : 'Save School Profile'}</span>
              </button>
            )}
          </div>

          {/* Sub Navigation for Profile Categories */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveProfileTab('identity')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeProfileTab === 'identity'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              الهوية والترخيص
            </button>
            <button
              type="button"
              onClick={() => setActiveProfileTab('contact')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeProfileTab === 'contact'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              العنوان والاتصال
            </button>
            <button
              type="button"
              onClick={() => setActiveProfileTab('leadership')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeProfileTab === 'leadership'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              القيادة والتوقيعات (الوكيلان + الموجه)
            </button>
            <button
              type="button"
              onClick={() => setActiveProfileTab('calendar')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeProfileTab === 'calendar'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              التقويم والفصول والحصص
            </button>
            <button
              type="button"
              onClick={() => setActiveProfileTab('emergency')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeProfileTab === 'emergency'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              نقاط التجمع وهوامش التقارير
            </button>
          </div>

          {/* Active Tab View */}
          <div className="pt-2">
            {activeProfileTab === 'identity' && (
              <SchoolIdentityTab
                profile={formProfile}
                onChange={(updates) => setFormProfile({ ...formProfile, ...updates })}
                disabled={!canManageSettings}
              />
            )}
            {activeProfileTab === 'contact' && (
              <SchoolContactTab
                profile={formProfile}
                onChange={(updates) => setFormProfile({ ...formProfile, ...updates })}
                disabled={!canManageSettings}
              />
            )}
            {activeProfileTab === 'leadership' && (
              <SchoolLeadershipTab
                profile={formProfile}
                onChange={(updates) => setFormProfile({ ...formProfile, ...updates })}
                disabled={!canManageSettings}
              />
            )}
            {activeProfileTab === 'calendar' && (
              <AcademicCalendarTab
                profile={formProfile}
                onChange={(updates) => setFormProfile((prev) => ({ ...prev, ...updates }))}
                onAutoSave={async (updates) => {
                  const merged = { ...formProfile, ...updates };
                  setFormProfile(merged);
                  await updateSchoolProfile(merged);
                  if (updates.weekendDays || updates.officialHolidays) {
                    updateSettings({
                      ...formSettings,
                      weekendDays: updates.weekendDays || formProfile.weekendDays,
                      officialHolidays: updates.officialHolidays || formProfile.officialHolidays,
                    });
                  }
                  setSaveSuccessMsg('تم حفظ وتطبيق تحديثات التقويم المدرسي بنجاح وتوثيقها في سجل التدقيق.');
                  setTimeout(() => setSaveSuccessMsg(null), 4000);
                }}
                disabled={!canManageSettings}
              />
            )}
            {activeProfileTab === 'emergency' && (
              <EmergencyPolicyTab
                profile={formProfile}
                onChange={(updates) => setFormProfile({ ...formProfile, ...updates })}
                disabled={!canManageSettings}
              />
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {!canManageSettings ? (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                {lang === 'ar'
                  ? 'تنبيه: عرض ملف المدرسة للقراءة فقط. التعديل محصور بمدير المدرسة.'
                  : 'Notice: Read-only view. Only school administrators can edit school profile.'}
              </span>
            ) : <div />}

            {canManageSettings && (
              <button
                type="button"
                onClick={handleSaveProfile}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{lang === 'ar' ? 'حفظ وتحديث ملف المدرسة' : 'Save School Profile'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 1: AUDIT LOG */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {lang === 'ar' ? 'سجل التدقيق الإلزامي للحركات والتعديلات الحساسة' : 'Audit Trail Logs'}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === 'ar'
                  ? 'يوثق كافة عمليات اعتماد الكشوف، وإعادة فتحها، واعتماد الأعذار، واستيراد الطلاب، وتعديل القواعد'
                  : 'Immutable record of session submissions, reopenings, excuse approvals, imports, and setting changes.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'بحث بالسجل...' : 'Search logs...'}
                  value={searchAudit}
                  onChange={(e) => setSearchAudit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 cursor-pointer"
              >
                <option value="all">{lang === 'ar' ? 'كافة العمليات' : 'All Entities'}</option>
                <option value="session">{lang === 'ar' ? 'كشوف الحضور' : 'Sessions'}</option>
                <option value="justification">{lang === 'ar' ? 'الأعذار الطبية' : 'Justifications'}</option>
                <option value="student">{lang === 'ar' ? 'استيراد الطلاب' : 'Students'}</option>
                <option value="settings">{lang === 'ar' ? 'الإعدادات' : 'Settings'}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">التوقيت والتاريخ</th>
                  <th className="py-2.5 px-3">المنفّذ / الدور</th>
                  <th className="py-2.5 px-3">نوع العملية</th>
                  <th className="py-2.5 px-3">تفاصيل الإجراء</th>
                  <th className="py-2.5 px-3">التغيير (السابق / الجديد)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      لا توجد سجلات مطابقة
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('ar-SA')}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{log.performerName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({log.performerRole === 'admin' ? 'مدير' : log.performerRole === 'registrar' ? 'شؤون طلبة' : log.performerRole === 'teacher' ? 'معلم' : 'ولي أمر'})
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 leading-relaxed max-w-md">
                        {log.details}
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        {log.previousValue || log.newValue ? (
                          <div className="flex items-center gap-1 font-mono">
                            <span className="line-through text-slate-400">{log.previousValue || '---'}</span>
                            <span>→</span>
                            <span className="text-emerald-700 font-bold">{log.newValue || '---'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">---</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SETTINGS */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
          <div className="settings-group-header flex items-center justify-between p-3.5 rounded-xl border font-bold shadow-2xs">
            <div>
              <h3 className="font-bold text-sm">
                {lang === 'ar' ? 'إعدادات وقواعد الانضباط المدرسي' : 'School Attendance Policies'}
              </h3>
              <p className="text-xs opacity-80 mt-0.5">
                {currentTenant.name} · التغييرات تحفظ في سجل التدقيق مع توثيق اسم المستخدم والتاريخ
              </p>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/40 border border-current font-mono">
              قواعد الحضور
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Mode */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-800 block">
                {lang === 'ar' ? 'نمط تسجيل الحضور المعتمد بالمدرسة:' : 'Attendance Mode:'}
              </label>
              <select
                value={formSettings.attendanceMode}
                onChange={(e: any) =>
                  setFormSettings({ ...formSettings, attendanceMode: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
              >
                <option value="both">كلاهما (حضور صباحي يومي + حضور حصص دراسية)</option>
                <option value="daily">حضور يومي صباحي فقط</option>
                <option value="period">حضور حصص دراسية فقط</option>
              </select>
            </div>

            {/* Late Grace Period */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-800 block">
                {lang === 'ar' ? 'حد احتساب التأخر الصباحي (بالدقائق):' : 'Late Grace Minutes:'}
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={formSettings.lateThresholdMinutes}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    lateThresholdMinutes: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono"
              />
              <span className="text-[11px] text-slate-500">
                أي حضور بعد هذا الوقت يسجل كطالب "متأخر" في الكشف
              </span>
            </div>

            {/* Chronic Limit */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-800 block">
                {lang === 'ar' ? 'حد إنذار الغياب المتكرر التلقائي (بالأيام):' : 'Chronic Absence Limit (Days):'}
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formSettings.chronicAbsenceLimit}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    chronicAbsenceLimit: parseInt(e.target.value) || 5,
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono"
              />
            </div>

            {/* Preferred Notification Channel */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-800 block">
                {lang === 'ar' ? 'قناة إرسال إشعارات أولياء الأمور الافتراضية:' : 'Default Notification Channel:'}
              </label>
              <select
                value={formSettings.preferredChannel || 'both'}
                onChange={(e: any) =>
                  setFormSettings({ ...formSettings, preferredChannel: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium"
              >
                <option value="both">كلاهما (SMS و WhatsApp معاً)</option>
                <option value="SMS">رسائل نصية قصيرة (SMS) فقط</option>
                <option value="WhatsApp">تطبيق WhatsApp فقط</option>
              </select>
            </div>

            {/* Notification Templates Section */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs text-emerald-800">
                {lang === 'ar' ? 'قوالب وصيغ رسائل أولياء الأمور التلقائية:' : 'Notification Message Templates:'}
              </h4>

              {/* Absence Template */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'ar' ? 'صيغة رسالة تسجيل الغياب:' : 'Absence Message Template:'}
                </label>
                <textarea
                  rows={2}
                  value={
                    formSettings.absenceMessageTemplate ||
                    'المكرم ولي أمر الطالب ({student_name}): نفيدكم بتسجيل غياب نجلكم عن ({subject}) بتاريخ {date}. يرجى تقديم العذر عبر الرابط المدرسي.'
                  }
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, absenceMessageTemplate: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-sans"
                />
                <span className="text-[10px] text-slate-400 block">
                  المتغيرات المتاحة: {`{student_name}`} ، {`{subject}`} ، {`{date}`}
                </span>
              </div>

              {/* Late Template */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'ar' ? 'صيغة رسالة التأخر الصباحي:' : 'Tardiness Message Template:'}
                </label>
                <textarea
                  rows={2}
                  value={
                    formSettings.lateMessageTemplate ||
                    'المكرم ولي أمر الطالب ({student_name}): تم تسجيل تأخر نجلكم ({minutes} دقيقة) عن دوام اليوم بتاريخ {date}.'
                  }
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, lateMessageTemplate: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-sans"
                />
                <span className="text-[10px] text-slate-400 block">
                  المتغيرات المتاحة: {`{student_name}`} ، {`{minutes}`} ، {`{date}`}
                </span>
              </div>

              {/* Warning Template */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {lang === 'ar' ? 'صيغة إنذار الغياب المتكرر:' : 'Chronic Absence Warning Template:'}
                </label>
                <textarea
                  rows={2}
                  value={
                    formSettings.warningMessageTemplate ||
                    'إشعار رسمي: المكرم ولي أمر الطالب ({student_name})، نظراً لتجاوز أيام الغياب غير المبررة الحد المسموح، نأمل مراجعة إدارة المدرسة عاجلاً.'
                  }
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, warningMessageTemplate: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 font-sans"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSettings.sendSmsOnAbsent}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, sendSmsOnAbsent: e.target.checked })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 font-medium">
                  إرسال رسالة تلقائية لولي الأمر فور اعتماد غياب الطالب
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSettings.sendSmsOnLate}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, sendSmsOnLate: e.target.checked })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 font-medium">
                  إرسال إشعار لولي الأمر عند تسجيل التأخر الصباحي
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSettings.notifyOnExcuseApproved ?? true}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, notifyOnExcuseApproved: e.target.checked })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 font-medium">
                  إرسال رسالة تأكيد لولي الأمر عند قبول واعتماد العذر الطبي
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSettings.requireExcuseAttachment}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      requireExcuseAttachment: e.target.checked,
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 font-medium">
                  إلزامية إرفاق تقرير طبي أو مستند رسمي عند تقديم عذر الغياب
                </span>
              </label>
            </div>
          </div>

          {/* Official Weekends & Holidays Configuration Card */}
          <HolidaysAndWeekendsCard
            weekendDays={formSettings.weekendDays}
            officialHolidays={formSettings.officialHolidays}
            onChange={(updates) => setFormSettings({ ...formSettings, ...updates })}
            disabled={!canManageSettings}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {!canManageSettings ? (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                {lang === 'ar'
                  ? 'تنبيه الصلاحيات: عرض الإعدادات للقراءة فقط. تعديل القواعد والحدود محصور بمدير المدرسة.'
                  : 'Notice: Read-only access. Policy changes are restricted to school administrators.'}
              </span>
            ) : <div />}

            {canManageSettings && (
              <button
                type="submit"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{lang === 'ar' ? 'حفظ وتطبيق القواعد المدرسية' : 'Save Policies'}</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* SUB-TAB 2: USER MANAGEMENT & RBAC */}
      {activeSubTab === 'users' && (
        <UserManagementTab
          users={users}
          onCreateUser={createUser}
          onUpdateUser={updateUser}
          onDeleteUser={deleteUser}
          canManageUsers={canManageSettings}
          availableClasses={classesStats.map((c) => c.className)}
          availableSubjects={formProfile.subjects?.map((s) => s.name)}
          lang={lang}
        />
      )}

      {/* SUB-TAB 3: SCHOOL AI & GEMINI CONFIGURATION */}
      {activeSubTab === 'ai' && (
        <SchoolAIGeminiTab
          tenantId={currentTenant.id}
          tenantName={currentTenant.name}
          canManageSettings={canManageSettings}
          lang={lang}
        />
      )}
    </div>
  );
};
