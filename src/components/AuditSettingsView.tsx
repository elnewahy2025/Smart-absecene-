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
} from 'lucide-react';

export const AuditSettingsView: React.FC = () => {
  const { auditLogs, settings, updateSettings, lang, currentTenant, currentUser } = useAttendance();

  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'settings'>('audit');
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [searchAudit, setSearchAudit] = useState<string>('');

  // Editable settings form state
  const [formSettings, setFormSettings] = useState(settings);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

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
    updateSettings(formSettings);
    setSaveSuccessMsg('تم حفظ وتطبيق قواعد المدرسة بنجاح وتوثيق التحديث في سجل التدقيق.');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeSubTab === 'audit'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{lang === 'ar' ? 'سجل التدقيق والحوكمة غير القابل للتعديل' : 'Immutable Audit Log'}</span>
          <span className="text-[10px] bg-slate-700 text-slate-100 px-1.5 py-0.2 rounded font-mono">
            {auditLogs.length}
          </span>
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
          <span>{lang === 'ar' ? 'قواعد وإعدادات المدرسة والغياب' : 'School Rules & Settings'}</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
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
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {lang === 'ar' ? 'إعدادات وقواعد الانضباط المدرسي' : 'School Attendance Policies'}
            </h3>
            <p className="text-xs text-slate-500">
              {currentTenant.name} · التغييرات تحفظ في سجل التدقيق مع توثيق اسم المستخدم والتاريخ
            </p>
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
                  إرسال رسالة SMS تلقائية لولي الأمر فور اعتماد غياب الطالب
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
                  إرسال إشعار SMS لولي الأمر عند تسجيل التأخر الصباحي
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

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{lang === 'ar' ? 'حفظ وتطبيق القواعد المدرسية' : 'Save Policies'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
