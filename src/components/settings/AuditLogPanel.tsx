import React from 'react';
import { Search } from 'lucide-react';
import type { AuditLog } from '../../types/attendance';
import {
  getAuditDetails,
  translateAuditAction,
  translateAuditRole,
  translateAuditValue,
} from '../../utils/auditLogI18n';

export interface AuditLogPanelProps {
  filteredLogs: AuditLog[];
  lang: 'ar' | 'en';
  searchAudit: string;
  onSearchChange: (value: string) => void;
  auditFilter: string;
  onFilterChange: (value: string) => void;
}

export const AuditLogPanel: React.FC<AuditLogPanelProps> = ({
  filteredLogs,
  lang,
  searchAudit,
  onSearchChange,
  auditFilter,
  onFilterChange,
}) => (
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
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pr-8 pl-3 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <select
                value={auditFilter}
                onChange={(e) => onFilterChange(e.target.value)}
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
            <table className={`w-full text-xs ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 align-middle whitespace-nowrap">{lang === 'ar' ? 'التوقيت والتاريخ' : 'Timestamp'}</th>
                  <th className="py-2.5 px-3 align-middle">{lang === 'ar' ? 'المنفّذ / الدور' : 'Performer / Role'}</th>
                  <th className="py-2.5 px-3 align-middle text-center">{lang === 'ar' ? 'نوع العملية' : 'Action Type'}</th>
                  <th className="py-2.5 px-3 align-middle">{lang === 'ar' ? 'تفاصيل الإجراء' : 'Action Details'}</th>
                  <th className="py-2.5 px-3 align-middle text-center">{lang === 'ar' ? 'التغيير (السابق / الجديد)' : 'Change (Before / After)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      {lang === 'ar' ? 'لا توجد سجلات مطابقة' : 'No matching log entries'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 align-middle font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')}
                      </td>
                      <td className="py-2.5 px-3 align-middle">
                        <div className="font-semibold text-slate-900">{log.performerName}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({translateAuditRole(log.performerRole, lang)})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-middle text-center">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                          {translateAuditAction(log.action, lang)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-middle text-slate-800 leading-relaxed min-w-[16rem] max-w-md">
                        {getAuditDetails(log, lang)}
                      </td>
                      <td className="py-2.5 px-3 align-middle text-[11px]">
                        {log.previousValue || log.newValue ? (
                          <div className="flex items-center justify-center gap-1.5 font-mono whitespace-nowrap">
                            <span className="line-through text-slate-400">{translateAuditValue(log.previousValue, lang) || '---'}</span>
                            <span>→</span>
                            <span className="text-emerald-700 font-bold">{translateAuditValue(log.newValue, lang) || '---'}</span>
                          </div>
                        ) : (
                          <span className="block text-center text-slate-400">---</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
);
