import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  FileText,
  FileCheck2,
  Eye,
  Printer,
  X,
  Plus,
} from 'lucide-react';
import {
  Student,
  AttendanceSession,
  Justification,
  StudentBehaviourIncident,
  NotificationOutboxItem,
  AttendanceStatus,
} from '../../types/attendance';
import { ParentRecordDetailsModal, SelectedRecordType } from './ParentRecordDetailsModal';
import {
  buildParentRecords,
  filterParentRecords,
  getArabicDayName,
} from '../../utils/parentRecords';

export interface ParentRecordsTableProps {
  student: Student;
  sessions: AttendanceSession[];
  justifications: Justification[];
  incidents: StudentBehaviourIncident[];
  notifications: NotificationOutboxItem[];
  onOpenExcuseForm?: (studentId: string, date: string) => void;
  academicYearBounds?: { start: string; end: string };
}

type TabKey = 'all' | 'absences' | 'infractions' | 'justifications' | 'messages';


export const ParentRecordsTable: React.FC<ParentRecordsTableProps> = ({
  student,
  sessions,
  justifications,
  incidents,
  notifications,
  onOpenExcuseForm,
  academicYearBounds,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unexcused' | 'excused' | 'late'>('all');
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecordType | null>(null);

  const {
    sessionRecords: studentAbsenceAndLateRecords,
    incidents: studentIncidents,
    infractionsOnly: studentInfractionsOnly,
    justifications: studentJustifications,
    notifications: studentNotifications,
    items: unifiedRecords,
  } = useMemo(
    () => buildParentRecords({ student, sessions, justifications, incidents, notifications }),
    [student, sessions, justifications, incidents, notifications]
  );

  // Tab Filtering & Query Search
  const filteredUnifiedRecords = useMemo(
    () => filterParentRecords(unifiedRecords, { tab: activeTab, query: searchQuery, statusFilter }),
    [unifiedRecords, activeTab, searchQuery, statusFilter]
  );


  // Print records handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
      {/* Table Section Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base sm:text-lg text-slate-900">
                سجل المتابعة والتفاصيل الشاملة للطالب
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {student.fullName}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              جدول رسمي موحد يوضح كافة أيام الغياب، التأخر، المخالفات، الأعذار، والرسائل الصادرة بالتواريخ
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenExcuseForm && (
              <button
                onClick={() => onOpenExcuseForm(student.id, '')}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تقديم عذر طبي جديد</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs px-3 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="طباعة السجل الرسمي"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">طباعة السجل</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
          <button
            onClick={() => {
              setActiveTab('all');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>🗂️ السجل الشامل الموحد</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {unifiedRecords.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('absences');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'absences'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50/50'
            }`}
          >
            <span>🚫 أيام الغياب والتأخر</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'absences'
                  ? 'bg-white/20 text-white'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {studentAbsenceAndLateRecords.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('infractions');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'infractions'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-amber-700 hover:bg-amber-50/50'
            }`}
          >
            <span>⚠️ المخالفات السلوكية</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'infractions'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {studentInfractionsOnly.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('justifications');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'justifications'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:bg-teal-50/50'
            }`}
          >
            <span>📑 الأعذار والتقارير الطبية</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'justifications'
                  ? 'bg-white/20 text-white'
                  : 'bg-teal-100 text-teal-800'
              }`}
            >
              {studentJustifications.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('messages');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'messages'
                ? 'bg-sky-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-sky-700 hover:bg-sky-50/50'
            }`}
          >
            <span>💬 الرسائل والإشعارات الواردة</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'messages'
                  ? 'bg-white/20 text-white'
                  : 'bg-sky-100 text-sky-800'
              }`}
            >
              {studentNotifications.length}
            </span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالتاريخ، اسم المادة، نص الرسالة، نوع المخالفة..."
              className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {(activeTab === 'all' || activeTab === 'absences') && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> تصفية الحالة:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">كافة الحالات</option>
                <option value="unexcused">غياب بدون عذر فقط</option>
                <option value="excused">غياب بعذر معتمد</option>
                <option value="late">تأخر صباحي</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 select-none">
              <th className="py-3 px-4 w-32">التاريخ واليوم</th>
              <th className="py-3 px-4 w-28">نوع السجل</th>
              <th className="py-3 px-4">الموضوع / الحصة / العنوان</th>
              <th className="py-3 px-4">التفاصيل والبيانات الموضحة</th>
              <th className="py-3 px-4 w-32 text-center">الحالة / النتيجة</th>
              <th className="py-3 px-4 w-28 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUnifiedRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <FileText className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <p className="font-semibold text-slate-600 text-sm">
                    لا توجد سجلات مطابقة في هذا التصنيف
                  </p>
                  <p className="text-[11px] text-slate-400">
                    لم يُرصد أي حدث أو قيد ضمن المعايير المحددة
                  </p>
                </td>
              </tr>
            ) : (
              filteredUnifiedRecords.map((item) => {
                const dayName = getArabicDayName(item.date);

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedRecord(item.rawRecord)}
                    className="hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                  >
                    {/* 1. Date & Day */}
                    <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.date}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal pr-5">
                        {dayName} {item.time ? `· ${item.time}` : ''}
                      </div>
                    </td>

                    {/* 2. Record Type Pill */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.type === 'absence'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.type === 'late'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : item.type === 'infraction'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : item.type === 'positive'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.type === 'justification'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}
                      >
                        {item.type === 'absence' && 'غياب'}
                        {item.type === 'late' && 'تأخر'}
                        {item.type === 'infraction' && 'مخالفة'}
                        {item.type === 'positive' && 'تميز (+)'}
                        {item.type === 'justification' && 'عذر طبي'}
                        {item.type === 'notification' && 'إشعار وارد'}
                      </span>
                    </td>

                    {/* 3. Title & Subtitle */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </td>

                    {/* 4. Details / Notes */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <p className="text-slate-700 text-xs leading-relaxed line-clamp-2">
                        {item.details}
                      </p>
                      {item.notes && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block mt-1">
                          {item.notes}
                        </span>
                      )}
                    </td>

                    {/* 5. Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.statusBadge.variant === 'danger'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : item.statusBadge.variant === 'warning'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : item.statusBadge.variant === 'success'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.statusBadge.variant === 'info'
                            ? 'bg-sky-100 text-sky-800 border border-sky-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {item.statusBadge.label}
                      </span>
                    </td>

                    {/* 6. Action Button */}
                    <td
                      className="py-3.5 px-4 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.actionRequired && onOpenExcuseForm ? (
                        <button
                          onClick={() => onOpenExcuseForm(student.id, item.date)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] px-2.5 py-1.5 rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>تقديم عذر</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedRecord(item.rawRecord)}
                          className="text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 font-medium text-[11px] px-2.5 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-emerald-200 flex items-center justify-center gap-1 mx-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>التفاصيل</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary Counter */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          إجمالي السجلات المعروضة: <strong>{filteredUnifiedRecords.length}</strong> سجل (من أصل{' '}
          {unifiedRecords.length})
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> غياب غير مبرر
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> تأخر / تنبيه
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> عذر معتمد
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span> رسالة واردة
          </span>
        </div>
      </div>

      {/* Modal for detailed record inspection */}
      {selectedRecord && (
        <ParentRecordDetailsModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onOpenExcuseForm={onOpenExcuseForm}
          studentId={student.id}
        />
      )}
    </div>
  );
};
