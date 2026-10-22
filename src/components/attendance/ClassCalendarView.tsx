import React, { useState } from 'react';
import { AttendanceSession } from '../../types/attendance';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';

interface Props {
  sessions: AttendanceSession[];
  selectedSessionId: string;
  onSelectSession: (sessionId: string) => void;
  lang: 'ar' | 'en';
}

export const ClassCalendarView: React.FC<Props> = ({
  sessions,
  selectedSessionId,
  onSelectSession,
  lang,
}) => {
  const { isOffDay } = useAttendance();
  // Calendar month state (default to current month)
  const [currentDate, setCurrentDate] = useState(() => {
    if (sessions.length > 0 && sessions[0].date) {
      return new Date(sessions[0].date);
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // First day of month and total days
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0: Sun, 1: Mon...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Group sessions by ISO date string (YYYY-MM-DD)
  const sessionsByDate: Record<string, AttendanceSession[]> = {};
  sessions.forEach((s) => {
    if (!sessionsByDate[s.date]) {
      sessionsByDate[s.date] = [];
    }
    sessionsByDate[s.date].push(s);
  });

  const weekDayHeaders = [
    { nameAr: 'الأحد', nameEn: 'Sun' },
    { nameAr: 'الإثنين', nameEn: 'Mon' },
    { nameAr: 'الثلاثاء', nameEn: 'Tue' },
    { nameAr: 'الأربعاء', nameEn: 'Wed' },
    { nameAr: 'الخميس', nameEn: 'Thu' },
    { nameAr: 'الجمعة', nameEn: 'Fri' },
    { nameAr: 'السبت', nameEn: 'Sat' },
  ];

  return (
    <div className="bg-[var(--app-card-bg,#ffffff)] rounded-xl border border-[var(--app-border,#e2e8f0)] p-5 shadow-xs space-y-4 text-slate-800 dark:text-slate-100">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            {lang === 'ar' ? 'التقويم الشهري لكشوف الحصص' : 'Monthly Class Sessions Calendar'}
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {monthNamesAr[month]} {year}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {lang === 'ar' ? 'اليوم' : 'Today'}
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="الشهر التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-700 dark:text-slate-300 py-2">
          {weekDayHeaders.map((d, i) => (
            <div key={i} className={i === 5 || i === 6 ? 'text-slate-400 dark:text-slate-500 font-normal' : ''}>
              {lang === 'ar' ? d.nameAr : d.nameEn}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[85px] bg-slate-50/40 dark:bg-slate-900/30 p-1.5" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
            const dayNum = dayIdx + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const daySessions = sessionsByDate[dateStr] || [];
            const offCheck = isOffDay(dateStr);
            const isWeekend = offCheck.type === 'weekend';
            const isHoliday = offCheck.type === 'holiday';

            return (
              <div
                key={dayNum}
                className={`min-h-[85px] p-1.5 flex flex-col justify-between transition-colors ${
                  isHoliday
                    ? 'bg-purple-50/70 border-purple-200/80 dark:bg-purple-950/30 dark:border-purple-900/50'
                    : isWeekend
                    ? 'bg-slate-50/60 dark:bg-slate-900/60'
                    : 'bg-white dark:bg-slate-900/20 hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-xs">{dayNum}</span>
                    {isHoliday && (
                      <span className="text-[9px] bg-purple-200 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 px-1 rounded font-bold" title={offCheck.reason}>
                        عطلة
                      </span>
                    )}
                  </div>
                  {daySessions.length > 0 && (
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1 rounded font-mono">
                      {daySessions.length} كشف
                    </span>
                  )}
                </div>

                {isHoliday && daySessions.length === 0 && (
                  <div className="text-[9px] text-purple-700 dark:text-purple-300 font-semibold truncate leading-tight mb-1" title={offCheck.holidayName}>
                    {offCheck.holidayName || 'عطلة رسمية'}
                  </div>
                )}

                <div className="space-y-1 overflow-y-auto max-h-16">
                  {daySessions.map((sess) => {
                    const isSelected = sess.id === selectedSessionId;
                    const isSubmitted = sess.status === 'submitted';

                    return (
                      <div
                        key={sess.id}
                        onClick={() => onSelectSession(sess.id)}
                        className={`p-1 rounded text-[10px] cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-2xs'
                            : isSubmitted
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                        }`}
                        title={`${sess.className} - ${sess.subject} (${sess.status})`}
                      >
                        <div className="truncate font-semibold">{sess.className} - {sess.subject || 'حضور'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
