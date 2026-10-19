import React, { useState, useMemo } from 'react';
import { Student } from '../../types/attendance';
import { Award, Zap, Trophy, Medal, Star, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

import { useAttendance } from '../../context/AttendanceContext';

interface Props {
  students: Student[];
  lang: 'ar' | 'en';
}

interface StudentEngagementMetrics {
  student: Student;
  streakDays: number;
  badgeLevel: 'diamond' | 'gold' | 'silver' | 'bronze' | 'starter';
  badgeTitleAr: string;
  badgeTitleEn: string;
  badgeColor: string;
  points: number;
}

export const StudentEngagementSection: React.FC<Props> = ({ students, lang }) => {
  const { sessions } = useAttendance();
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Submitted sessions sorted chronologically descending for streak computation
  const submittedSessionsDesc = useMemo(() => {
    return sessions
      .filter((s) => s.status === 'submitted')
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions]);

  // Calculate engagement metrics per student from actual session data
  const engagementList: StudentEngagementMetrics[] = students.map((std) => {
    // Calculate actual consecutive attended sessions (streak)
    let streakDays = 0;
    for (const session of submittedSessionsDesc) {
      const rec = session.records?.find((r) => r.studentId === std.id);
      if (rec) {
        if (rec.status === 'present' || rec.status === 'excused_absence' || rec.status === 'excused_leave') {
          streakDays += 1;
        } else {
          break; // Streak ends on unexcused absence or tardiness
        }
      }
    }

    // Engagement points derived from actual attendance rate and attendance streak
    const points = Math.max(0, Math.round(std.attendanceRate * 10 + streakDays * 5 - std.totalAbsences * 10 - std.totalLates * 5));

    let badgeLevel: StudentEngagementMetrics['badgeLevel'] = 'starter';
    let badgeTitleAr = 'بداية الالتزام';
    let badgeTitleEn = 'Commitment Start';
    let badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';

    if (std.totalAbsences === 0 && std.totalLates === 0 && std.attendanceRate >= 99) {
      badgeLevel = 'diamond';
      badgeTitleAr = 'وسام المثالية الماسية';
      badgeTitleEn = 'Diamond Excellence Badge';
      badgeColor = 'bg-cyan-50 text-cyan-800 border-cyan-300';
    } else if (std.attendanceRate >= 95 && std.totalAbsences <= 1) {
      badgeLevel = 'gold';
      badgeTitleAr = 'وسام الانضباط الذهبي';
      badgeTitleEn = 'Gold Discipline Badge';
      badgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
    } else if (std.attendanceRate >= 90 && std.totalAbsences <= 2) {
      badgeLevel = 'silver';
      badgeTitleAr = 'وسام المواظبة الفضي';
      badgeTitleEn = 'Silver Attendance Badge';
      badgeColor = 'bg-slate-100 text-slate-800 border-slate-300';
    } else if (std.attendanceRate >= 85) {
      badgeLevel = 'bronze';
      badgeTitleAr = 'وسام الالتزام البرونزي';
      badgeTitleEn = 'Bronze Commitment Badge';
      badgeColor = 'bg-orange-50 text-orange-800 border-orange-300';
    }

    return {
      student: std,
      streakDays,
      badgeLevel,
      badgeTitleAr,
      badgeTitleEn,
      badgeColor,
      points,
    };
  });

  const filteredList = engagementList.filter((item) => {
    if (gradeFilter !== 'all' && item.student.grade !== gradeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.student.fullName.toLowerCase().includes(q) ||
        item.student.className.toLowerCase().includes(q) ||
        item.student.studentNumber.includes(q)
      );
    }
    return true;
  });

  const diamondCount = engagementList.filter((i) => i.badgeLevel === 'diamond').length;
  const goldCount = engagementList.filter((i) => i.badgeLevel === 'gold').length;
  const perfectStreakCount = engagementList.filter((i) => i.streakDays >= 20).length;

  const grades = Array.from(new Set(students.map((s) => s.grade).filter(Boolean))).sort();

  return (
    <div
      className="app-card rounded-xl border p-5 shadow-xs space-y-4"
      style={{ backgroundColor: 'var(--app-card-bg)', borderColor: 'var(--app-card-border)' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--app-text-main)' }}>
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{lang === 'ar' ? 'لوحة تحفيز وتفاعل الطلاب (Gamification Streak Hub)' : 'Student Engagement & Streaks'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'ar'
              ? 'متابعة أطول سلاسل الحضور المتصل، أوسمة التميز، وشارات المواظبة لتعزيز الانضباط الإيجابي'
              : 'Continuous attendance streaks, motivation badges, and milestone progress'}
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-medium cursor-pointer"
            style={{ color: 'var(--app-text-main)' }}
          >
            <option value="all">{lang === 'ar' ? 'جميع المراحل' : 'All Grades'}</option>
            {grades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold">
            <Medal className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-cyan-800 font-semibold block">{lang === 'ar' ? 'سلسلة مثالية (20+ يوم)' : 'Perfect streak (20+ days)'}</span>
            <span className="text-xl font-bold text-cyan-950 font-mono">
              {perfectStreakCount} {lang === 'ar' ? 'طالب' : perfectStreakCount === 1 ? 'student' : 'students'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-amber-800 font-semibold block">{lang === 'ar' ? 'الحاصلون على وسام التميز' : 'Excellence badge holders'}</span>
            <span className="text-xl font-bold text-amber-950 font-mono">
              {diamondCount + goldCount} {lang === 'ar' ? 'طالب' : diamondCount + goldCount === 1 ? 'student' : 'students'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-primary font-semibold block">{lang === 'ar' ? 'نقاط التحفيز المكتسبة' : 'Motivation points earned'}</span>
            <span className="text-xl font-bold text-primary font-mono">
              {engagementList.reduce((acc, i) => acc + i.points, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Roster Streaks & Progress Bars */}
      <div className="space-y-2">
        <h4 className="font-bold text-xs text-slate-800">
          {lang === 'ar' ? 'قائمة المتصدرين في سلاسل الحضور المتصل:' : 'Leaderboard of continuous attendance streaks:'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
          {filteredList
            .sort((a, b) => b.streakDays - a.streakDays)
            .map((item) => (
              <div
                key={item.student.id}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{item.student.fullName}</span>
                    <span className="text-[11px] text-slate-500">
                      {item.student.className} · {lang === 'ar' ? 'رقم' : 'No.'} {item.student.studentNumber}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                    {lang === 'ar' ? item.badgeTitleAr : item.badgeTitleEn}
                  </span>
                </div>

                {/* Progress bar towards 30-day streak milestone */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>
                        {lang === 'ar' ? 'سلسلة الحضور:' : 'Attendance streak:'}{' '}
                        <strong className="text-slate-900 font-mono">{item.streakDays}</strong> {lang === 'ar' ? 'يوم' : item.streakDays === 1 ? 'day' : 'days'}
                      </span>
                    </span>
                    <span className="font-mono text-primary font-bold">
                      {item.points} {lang === 'ar' ? 'نقطة' : 'pts'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.streakDays >= 20
                          ? 'bg-primary'
                          : item.streakDays >= 10
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(8, (item.streakDays / 25) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
