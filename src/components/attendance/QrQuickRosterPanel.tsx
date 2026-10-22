import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import type { AttendanceSession, Student } from '../../types/attendance';

export interface RecentScan {
  student: Student;
  time: string;
}

interface QrQuickRosterPanelProps {
  lang: 'ar' | 'en';
  activeSession?: AttendanceSession;
  currentClassStudents: Student[];
  scannedTimestamps: Record<string, string>;
  qrModeActive: boolean;
  recentScans: RecentScan[];
  onScanStudent: (student: Student) => void;
}

export const QrQuickRosterPanel: React.FC<QrQuickRosterPanelProps> = ({
  lang,
  activeSession,
  currentClassStudents,
  scannedTimestamps,
  qrModeActive,
  recentScans,
  onScanStudent,
}) => (
    <div className="md:col-span-5 space-y-3">
      {/* Quick One-Click Check-In Buttons for class students */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">
            {lang === 'ar' ? 'مسح سريع لطلاب الفصل:' : 'One-Click Fast Scan:'}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {currentClassStudents.length} طلاب
          </span>
        </div>

        <div className="max-h-36 sm:max-h-40 overflow-y-auto space-y-1 text-xs">
          {currentClassStudents.map((std) => {
            const isPresentInSession = activeSession?.records?.find(
              (r) => r.studentId === std.id && r.status === 'present'
            );
            const scanTime = scannedTimestamps[std.id];
            return (
              <button
                key={std.id}
                onClick={() => onScanStudent(std)}
                className={`w-full flex items-center justify-between p-2 rounded-lg border text-right transition-colors cursor-pointer text-xs ${
                  isPresentInSession
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className="truncate">
                  <span className="font-bold">{std.fullName}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-1.5 font-mono">({std.studentNumber})</span>
                </div>
                {isPresentInSession ? (
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{lang === 'ar' ? `حاضر ${scanTime ? `(${scanTime})` : '✔'}` : `Present ${scanTime || '✔'}`}</span>
                  </div>
                ) : (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border shrink-0 font-medium ${
                      qrModeActive
                        ? 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                        : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {qrModeActive
                      ? (lang === 'ar' ? '⏳ بانتظار مسح الـ QR' : '⏳ Pending')
                      : (lang === 'ar' ? 'غائب (يدوي)' : 'Absent')}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Scanned Feed */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{lang === 'ar' ? 'سجل الطلاب المرصودين بهذه الجلسة:' : 'Live Scanned Feed:'}</span>
          </span>
          <span className="text-[11px] text-emerald-700 font-bold font-mono">
            {recentScans.length}
          </span>
        </div>

        {recentScans.length === 0 ? (
          <div className="text-center py-3 text-xs text-slate-400">
            {lang === 'ar' ? 'بانتظار مسح بطاقات الطلاب...' : 'Waiting for student QR scans...'}
          </div>
        ) : (
          <div className="max-h-28 sm:max-h-36 overflow-y-auto space-y-1.5 text-xs">
            {recentScans.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 text-emerald-950"
              >
                <div className="truncate">
                  <div className="font-bold truncate">{item.student.fullName}</div>
                  <div className="text-[10px] text-emerald-700">{item.student.className}</div>
                </div>
                <span className="font-mono text-[10px] text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
);
