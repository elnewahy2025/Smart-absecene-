import React, { useState } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import {
  Sliders,
  Save,
  CheckCircle2,
  User,
  History,
  Building2,
  UserCog,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { SchoolIdentityTab } from './settings/SchoolIdentityTab';
import { SchoolContactTab } from './settings/SchoolContactTab';
import { SchoolLeadershipTab } from './settings/SchoolLeadershipTab';
import { AcademicCalendarTab } from './settings/AcademicCalendarTab';
import { GradesAndClassesTab } from './settings/GradesAndClassesTab';
import { TimetablePeriodsTab } from './settings/TimetablePeriodsTab';
import { EmergencyPolicyTab } from './settings/EmergencyPolicyTab';
import { UserManagementTab } from './settings/UserManagementTab';
import { SchoolAIGeminiTab } from './settings/SchoolAIGeminiTab';
import { HolidaysAndWeekendsCard } from './settings/HolidaysAndWeekendsCard';
import { SchoolMessagingGatewaysTab } from './settings/SchoolMessagingGatewaysTab';
import { AuditLogPanel } from './settings/AuditLogPanel';
import { getAuditSearchHaystack } from '../utils/auditLogI18n';
import { SchoolPolicySettingsForm } from './settings/SchoolPolicySettingsForm';

export const AuditSettingsView: React.FC = () => {
  const {
    auditLogs,
    settings,
    updateSettings,
    schoolProfile,
    updateSchoolProfile,
    messagingGateway,
    updateMessagingGateway,
    lang,
    currentTenant,
    currentUser,
    isSuperAdmin,
    canManageSettings,
    users,
    createUser,
    updateUser,
    deleteUser,
    classesStats,
  } = useAttendance();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'settings' | 'gateways' | 'users' | 'ai' | 'audit'>('profile');
  const [activeProfileTab, setActiveProfileTab] = useState<'identity' | 'contact' | 'leadership' | 'calendar' | 'grades-classes' | 'timetable' | 'emergency'>('identity');
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
      return getAuditSearchHaystack(log).includes(q);
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
    setSaveSuccessMsg(
      lang === 'ar'
        ? 'تم حفظ وتطبيق قواعد المدرسة والعطلات الرسمية بنجاح وتوثيق التحديث في سجل التدقيق.'
        : 'School policies and official holidays were saved and applied successfully; the change was recorded in the audit log.'
    );
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
    setSaveSuccessMsg(
      lang === 'ar'
        ? 'تم حفظ وتطبيق الملف التعريفي والتقويم المدرسي بنجاح وتوثيق التحديث في سجل التدقيق.'
        : 'The school profile and calendar were saved and applied successfully; the change was recorded in the audit log.'
    );
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
          onClick={() => setActiveSubTab('gateways')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'gateways'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-500" />
          <span>{lang === 'ar' ? 'بوابات المراسلة والواتساب (Gateways)' : 'Messaging & WhatsApp Gateways'}</span>
          <span className="text-[10px] bg-emerald-700 text-emerald-100 px-1.5 py-0.2 rounded font-mono">
            {isSuperAdmin ? (lang === 'ar' ? 'تحكم المالك' : 'Owner') : (lang === 'ar' ? 'للقراءة فقط' : 'Read-only')}
          </span>
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
              {lang === 'ar' ? 'الهوية والترخيص' : 'Identity & Licensing'}
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
              {lang === 'ar' ? 'العنوان والاتصال' : 'Address & Contact'}
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
              {lang === 'ar' ? 'القيادة والتوقيعات (الوكيلان + الموجه)' : 'Leadership & Signatures (Deputies + Counselor)'}
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
              {lang === 'ar' ? 'التقويم الدراسي' : 'Academic Calendar'}
            </button>
            <button
              type="button"
              onClick={() => setActiveProfileTab('grades-classes')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeProfileTab === 'grades-classes'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {lang === 'ar' ? 'المراحل والفصول الدراسية' : 'Grades & Classes'}
            </button>
            <button
              type="button"
              onClick={() => setActiveProfileTab('timetable')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                activeProfileTab === 'timetable'
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {lang === 'ar' ? 'توقيت الحصص اليومية' : 'Daily Period Timetable'}
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
              {lang === 'ar' ? 'نقاط التجمع وهوامش التقارير' : 'Assembly Points & Report Margins'}
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
                  setSaveSuccessMsg(
                    lang === 'ar'
                      ? 'تم حفظ وتطبيق تحديثات التقويم المدرسي بنجاح وتوثيقها في سجل التدقيق.'
                      : 'Academic calendar updates were saved and applied successfully; the change was recorded in the audit log.'
                  );
                  setTimeout(() => setSaveSuccessMsg(null), 4000);
                }}
                disabled={!canManageSettings}
              />
            )}
            {activeProfileTab === 'grades-classes' && (
              <GradesAndClassesTab
                profile={formProfile}
                onChange={(updates) => setFormProfile((prev) => ({ ...prev, ...updates }))}
                onAutoSave={async (updates) => {
                  const merged = { ...formProfile, ...updates };
                  setFormProfile(merged);
                  await updateSchoolProfile(merged);
                  setSaveSuccessMsg(
                    lang === 'ar'
                      ? 'تم حفظ وتحديث المراحل والفصول والمواد بنجاح وتوثيقها في سجل التدقيق.'
                      : 'Grades, classes and subjects were saved successfully; the change was recorded in the audit log.'
                  );
                  setTimeout(() => setSaveSuccessMsg(null), 4000);
                }}
                disabled={!canManageSettings}
              />
            )}
            {activeProfileTab === 'timetable' && (
              <TimetablePeriodsTab
                profile={formProfile}
                onChange={(updates) => setFormProfile((prev) => ({ ...prev, ...updates }))}
                onAutoSave={async (updates) => {
                  const merged = { ...formProfile, ...updates };
                  setFormProfile(merged);
                  await updateSchoolProfile(merged);
                  setSaveSuccessMsg(
                    lang === 'ar'
                      ? 'تم حفظ وتحديث جدول الحصص اليومية بنجاح وتوثيقه في سجل التدقيق.'
                      : 'The daily period timetable was saved successfully; the change was recorded in the audit log.'
                  );
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
        <AuditLogPanel
          filteredLogs={filteredLogs}
          lang={lang}
          searchAudit={searchAudit}
          onSearchChange={setSearchAudit}
          auditFilter={auditFilter}
          onFilterChange={setAuditFilter}
        />
      )}

      {/* SUB-TAB 2: SETTINGS */}
      {activeSubTab === 'settings' && (
        <SchoolPolicySettingsForm
          formSettings={formSettings}
          setFormSettings={setFormSettings}
          onSubmit={handleSaveSettings}
          lang={lang}
          canManageSettings={canManageSettings}
          schoolProfile={schoolProfile}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* SUB-TAB: SCHOOL MESSAGING GATEWAYS & WHATSAPP (EXCLUSIVE TO OWNER) */}
      {activeSubTab === 'gateways' && (
        <SchoolMessagingGatewaysTab
          gatewayConfig={messagingGateway}
          onSave={updateMessagingGateway}
          isSuperAdmin={isSuperAdmin}
          schoolName={schoolProfile.schoolName || currentTenant.name}
          defaultCallingCode={schoolProfile.countryCallingCode || schoolProfile.address?.countryCallingCode || '+966'}
        />
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
