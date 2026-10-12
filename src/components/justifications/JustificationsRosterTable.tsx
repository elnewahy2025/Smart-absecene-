import React from 'react';
import { Justification } from '../../types/attendance';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Eye,
  AlertCircle,
  ShieldAlert,
  Search,
  Filter,
} from 'lucide-react';

export interface JustificationsRosterTableProps {
  justifications: Justification[];
  isParent: boolean;
  lang: 'ar' | 'en';
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected' | 'irregularities';
  setStatusFilter: (status: 'all' | 'pending' | 'approved' | 'rejected' | 'irregularities') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pendingCount: number;
  irregularCount: number;
  filteredJustifications: Justification[];
  onInspect: (justification: Justification) => void;
}

export const JustificationsRosterTable: React.FC<JustificationsRosterTableProps> = ({
  justifications,
  isParent,
  lang,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  pendingCount,
  irregularCount,
  filteredJustifications,
  onInspect,
}) => {
  return (
    <div className="space-y-4">
      {/* Quick AI Irregularities Alert Card (For School Staff) */}
      {!isParent && irregularCount > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-rose-900 flex items-center gap-1.5">
                <span>
                  {lang === 'ar'
                    ? 'تنبيه تدقيق: تم رصد تناقضات وشبهات في بعض المستندات المرفوعة'
                    : 'Audit Notice: Irregularities Flagged in Excuse Documents'}
                </span>
                <span className="bg-rose-200 text-rose-900 px-2 py-0.2 rounded-full text-[10px] font-bold">
                  {irregularCount} {lang === 'ar' ? 'أعذار مشبوهة' : 'flagged'}
                </span>
              </h4>
              <p className="text-xs text-rose-800 leading-relaxed mt-0.5">
                {lang === 'ar'
                  ? 'رصد محرك الذكاء الاصطناعي عدم تطابق في أسماء الطلاب أو تواريخ التقارير أو غياب الأختام الرسمية المعتمدة. يرجى معاينة الحالات واتخاذ القرار الإداري.'
                  : 'AI detected discrepancies in student names, examination dates, or missing official seals.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter('irregularities')}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'عرض المستندات المشبوهة فقط' : 'View Flagged Only'}</span>
          </button>
        </div>
      )}

      {/* Roster Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isParent
                ? lang === 'ar'
                  ? 'سجل وقرارات أعذار أبنائي'
                  : 'My Children Excuses Tracker'
                : lang === 'ar'
                ? 'كشف مراجعة وتدقيق الأعذار المدرسية'
                : 'Excuses Review & Audit List'}
            </h3>
            <p className="text-xs text-slate-500">
              {isParent
                ? lang === 'ar'
                  ? 'متابعة حالة الاعتماد الرسمية وملاحظات المدرسة للأعذار المرفوعة لأبنائكم'
                  : 'Track review decisions and school notes for submitted excuses'
                : lang === 'ar'
                ? 'فحص الوثائق بالذكاء الاصطناعي لكشف التزوير وتحديث حالة الطالب في كشف الحضور فور الاعتماد'
                : 'Analyze documents with Gemini to flag inconsistencies and update attendance'}
            </p>
          </div>

          {/* Filters Strip */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
              {[
                { id: 'all', label: lang === 'ar' ? 'الكل' : 'All', count: justifications.length },
                { id: 'pending', label: lang === 'ar' ? 'قيد المراجعة' : 'Pending', count: pendingCount },
                { id: 'approved', label: lang === 'ar' ? 'معتمد' : 'Approved' },
                { id: 'rejected', label: lang === 'ar' ? 'مرفوض' : 'Rejected' },
                ...(!isParent && irregularCount > 0
                  ? [{ id: 'irregularities', label: lang === 'ar' ? '⚠️ تنبيهات واشتباهات' : 'Flagged', count: irregularCount }]
                  : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`py-1 px-2.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                    statusFilter === tab.id
                      ? tab.id === 'irregularities'
                        ? 'bg-rose-600 text-white font-bold'
                        : 'bg-slate-900 text-white font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[10px] opacity-80 font-mono">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative w-48">
              <Search className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5" />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث بالطالب أو المستشفى...' : 'Search...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pr-7 pl-2 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'اسم الطالب / الفصل' : 'Student & Class'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'تاريخ الغياب' : 'Absence Date'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'نوع العذر وبيانه' : 'Reason & Statement'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'فحص الذكاء الاصطناعي (Gemini)' : 'AI Verification Status'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'حالة الاعتماد' : 'Decision Status'}</th>
                <th className="py-3 px-4">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJustifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <span>{lang === 'ar' ? 'لا توجد طلبات أعذار مطابقة للفلاتر' : 'No matching excuse requests found'}</span>
                  </td>
                </tr>
              ) : (
                filteredJustifications.map((just, idx) => {
                  const isPending = just.status === 'pending';
                  const isApproved = just.status === 'approved';

                  const analysis = just.aiAnalysis;
                  const isIrregular =
                    analysis?.verificationStatus === 'irregular' ||
                    (analysis?.irregularities && analysis.irregularities.length > 0) ||
                    analysis?.overallRiskLevel === 'high';
                  const isVerified = analysis?.verificationStatus === 'verified' && !isIrregular;

                  return (
                    <tr
                      key={just.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isIrregular ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{just.studentName}</div>
                        <div className="text-[11px] text-slate-500">{just.className}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{just.absenceDate}</td>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="inline-block bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px] mb-1">
                          {just.reasonType === 'medical'
                            ? 'عذر طبي'
                            : just.reasonType === 'family'
                            ? 'ظرف أسري'
                            : 'أخرى'}
                        </span>
                        <p className="line-clamp-2 text-slate-600 text-[11px]">{just.guardianExplanation}</p>
                      </td>

                      {/* AI Verification Tool Result Column */}
                      <td className="py-3 px-4">
                        {analysis ? (
                          <div className="flex flex-col gap-1 text-[11px]">
                            {isIrregular ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 bg-rose-100 border border-rose-300 text-rose-900 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                  <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>
                                    {lang === 'ar' ? '⚠️ رصد تناقض أو اشتباه' : 'Irregularities Flagged'}
                                  </span>
                                </span>
                                {analysis.irregularities && analysis.irregularities[0] && (
                                  <div className="text-[10px] text-rose-700 truncate max-w-[170px]" title={analysis.irregularities[0].titleAr}>
                                    • {analysis.irregularities[0].titleAr}
                                  </div>
                                )}
                              </div>
                            ) : isVerified ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>
                                    {lang === 'ar' ? '✓ موثوق ومطابق' : 'Verified - Low Risk'}
                                  </span>
                                  {analysis.integrityScore && (
                                    <span className="font-mono text-[9px] text-emerald-700">({analysis.integrityScore}%)</span>
                                  )}
                                </span>
                                <span className="text-slate-500 truncate max-w-[170px] block text-[10px]">
                                  {analysis.issuerName || 'منشأة معتمدة'}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-900 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                                  <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>{analysis.recommendedDecision || 'يتطلب مراجعة'}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>{lang === 'ar' ? 'غير مفحوص آلياً' : 'Manual'}</span>
                          </span>
                        )}
                      </td>

                      {/* Decision Status Column */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            isPending
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : isApproved
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-rose-50 border-rose-300 text-rose-800'
                          }`}
                        >
                          {isPending
                            ? lang === 'ar' ? 'قيد المراجعة' : 'Pending'
                            : isApproved
                            ? lang === 'ar' ? 'معتمد ومقبول' : 'Approved'
                            : lang === 'ar' ? 'مرفوض' : 'Rejected'}
                        </span>
                      </td>

                      {/* Action Column */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onInspect(just)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            isIrregular
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {isParent
                              ? lang === 'ar' ? 'عرض التفاصيل' : 'View Details'
                              : isIrregular
                              ? lang === 'ar' ? 'معاينة التناقضات' : 'Inspect Irregularities'
                              : lang === 'ar' ? 'معاينة وفحص' : 'Inspect & Decide'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
