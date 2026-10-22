import React from 'react';
import { Save, Shield } from 'lucide-react';
import type { SchoolMessagingGatewayConfig } from '../../types/attendance';

interface MessagingGatewayAuditFooterProps {
  gatewayConfig: SchoolMessagingGatewayConfig;
  lang: string;
  isSuperAdmin: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const MessagingGatewayAuditFooter: React.FC<MessagingGatewayAuditFooterProps> = ({
  gatewayConfig,
  lang,
  isSuperAdmin,
  onSubmit,
}) => {
  return (
  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
    <div className="flex items-center gap-2">
      <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
      <span>
        {lang === 'ar' ? 'سجل التوثيق: تم الضبط الأخير بواسطة ' : 'Audit log: last configured by '}
        <strong className="text-slate-700 dark:text-slate-300">
          {gatewayConfig.lastConfiguredByRole === 'super_admin'
            ? (lang === 'ar' ? 'مالك المنصة (The Owner)' : 'Platform owner (The Owner)')
            : (lang === 'ar' ? 'مسؤول النظام' : 'System administrator')}
        </strong>
        {gatewayConfig.lastConfiguredByEmail && ` (${gatewayConfig.lastConfiguredByEmail})`}
        {gatewayConfig.lastConfiguredAt && (
          <span className="font-mono mr-1">
            {lang === 'ar' ? 'بتاريخ:' : 'on:'} {new Date(gatewayConfig.lastConfiguredAt).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
          </span>
        )}
      </span>
    </div>

    {isSuperAdmin && (
      <button
        type="button"
        onClick={onSubmit}
        className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-md cursor-pointer transition-colors shadow-2xs self-end sm:self-auto"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{lang === 'ar' ? 'حفظ واعتماد التغييرات' : 'Save and apply changes'}</span>
      </button>
    )}
  </div>
  );
};
