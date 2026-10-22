import type { Student } from '../../types/attendance';
import { FileText, Loader2, Printer, Send } from 'lucide-react';

interface AbsenceReportHeaderProps {
  currentStudent: Student | null;
  isAr: boolean;
  isGeneratingPdf: boolean;
  onDownloadPdf: () => void;
  onPrint: () => void;
  onSendWarning: () => void;
}

export function AbsenceReportHeader({
  currentStudent,
  isAr,
  isGeneratingPdf,
  onDownloadPdf,
  onPrint,
  onSendWarning,
}: AbsenceReportHeaderProps) {
  return (
    <div className="app-section-header rounded-2xl border p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black" style={{ color: 'var(--app-text-main)' }}>
          {isAr ? 'سجل غياب وانضباط الطالب' : 'Student Attendance & Conduct Record'}
        </h1>
      </div>

      {currentStudent && (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            title="توليد وتنزيل ملف PDF أصلي حقيقي ذو نصوص قابلة للتحديد (Vector PDF)"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{isAr ? 'جارٍ إنشاء مستند PDF...' : 'Generating PDF...'}</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-white" />
                <span>{isAr ? 'تنزيل مستند PDF رسمي معتمد' : 'Download Official PDF Report'}</span>
              </>
            )}
          </button>

          <button
            onClick={onPrint}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-sm"
            title="طباعة مباشرة للمستند الرسمي عبر إطار معزول"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>{isAr ? 'طباعة مباشرة للمستند' : 'Print Document'}</span>
          </button>

          <button
            onClick={onSendWarning}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors shadow-sm"
            title="إرسال إنذار فوري لولي الأمر"
          >
            <Send className="w-4 h-4" />
            <span>{isAr ? 'إرسال إنذار فوري' : 'Send Warning'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
