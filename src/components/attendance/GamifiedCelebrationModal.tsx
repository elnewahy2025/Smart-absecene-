import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PartyPopper, Sparkles, Award } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  attendanceRate: number;
  totalPresent: number;
  totalStudents: number;
  lang: 'ar' | 'en';
}

export const GamifiedCelebrationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  classNameTitle,
  attendanceRate,
  totalPresent,
  totalStudents,
  lang,
}) => {
  const [activeParticles, setActiveParticles] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      setActiveParticles(Array.from({ length: 24 }, (_, i) => i));
      const timer = setTimeout(() => {
        onClose();
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  const dialogRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, containerRef: dialogRef });

  if (!isOpen) return null;

  const isFullAttendance = attendanceRate >= 100;

  const content = (
    <div
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200"
      onClick={onClose}
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Confetti Sparkle Dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {activeParticles.map((p) => {
            const left = (p * 17) % 100;
            const delay = (p * 0.12).toFixed(2);
            const colors = ['bg-amber-400', 'bg-emerald-400', 'bg-purple-400', 'bg-rose-400', 'bg-cyan-400'];
            const color = colors[p % colors.length];

            return (
              <span
                key={p}
                className={`absolute w-2 h-2 rounded-full ${color} animate-ping`}
                style={{
                  left: `${left}%`,
                  top: `${(p * 23) % 90}%`,
                  animationDuration: '1.6s',
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>

        {/* Celebration Trophy/Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-950 flex items-center justify-center shadow-lg shadow-amber-300/40 animate-bounce">
          {isFullAttendance ? <PartyPopper className="w-8 h-8" /> : <Award className="w-8 h-8" />}
        </div>

        {/* Text */}
        <div className="space-y-1 relative">
          <h3 className="font-extrabold text-slate-900 text-lg">
            {isFullAttendance
              ? (lang === 'ar' ? '🎉 إنجاز رائع! حضور كامل 100%' : '100% Full Attendance!')
              : (lang === 'ar' ? '✨ تم اعتماد كشف الحضور بنجاح' : 'Session Submitted Successfully')}
          </h3>
          <p className="text-xs text-slate-500">
            {classNameTitle} · {totalPresent} حاضر من أصل {totalStudents} طالب
          </p>
        </div>

        {/* Streak/Badge Tag */}
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">
            {isFullAttendance
              ? (lang === 'ar' ? 'تم منح وسام المثالية لفصل اليوم 🏆' : 'Class Exemplary Streak +1 🏆')
              : (lang === 'ar' ? 'نسبة حضور مشرفة: ' + attendanceRate + '%' : 'Attendance Rate: ' + attendanceRate + '%')}
          </span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
        >
          {lang === 'ar' ? 'استمرار' : 'Continue'}
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};
