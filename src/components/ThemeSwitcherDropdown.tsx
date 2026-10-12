import React, { useState, useRef, useEffect } from 'react';
import { useTheme, THEME_OPTIONS, AppThemeId } from '../context/ThemeContext';
import {
  Palette,
  Moon,
  Sun,
  Check,
  Sparkles,
} from 'lucide-react';

interface Props {
  lang: 'ar' | 'en';
}

export const ThemeSwitcherDropdown: React.FC<Props> = ({ lang }) => {
  const { theme, setTheme, isDark, toggleDarkMode, activeThemeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
        {/* Quick Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-200/70 transition-colors cursor-pointer"
          title={
            isDark
              ? (lang === 'ar' ? 'التبديل إلى الوضع النهاري' : 'Switch to Light Mode')
              : (lang === 'ar' ? 'التبديل إلى الوضع الداكن (Dark Mode)' : 'Switch to Dark Mode')
          }
          aria-label="Toggle Dark Mode"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-500 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>

        {/* Theme Palette Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-200/70 transition-colors cursor-pointer"
          title={lang === 'ar' ? 'تخصيص ألوان وثيم الواجهة' : 'Customize UI Theme'}
          aria-expanded={isOpen}
        >
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
            style={{ backgroundColor: activeThemeConfig.accentColor }}
          />
          <span className="hidden xl:inline max-w-[85px] truncate">
            {lang === 'ar' ? activeThemeConfig.nameAr.split(' ')[0] : activeThemeConfig.nameEn.split(' ')[0]}
          </span>
          <Palette className="w-3 h-3 text-slate-500" />
        </button>
      </div>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 ${
            lang === 'ar' ? 'left-0' : 'right-0'
          }`}
        >
          <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{lang === 'ar' ? 'سمات الواجهة والألوان' : 'Select UI Theme'}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {THEME_OPTIONS.length} {lang === 'ar' ? 'ثيمات' : 'themes'}
            </span>
          </div>

          <div className="py-1 space-y-1 max-h-72 overflow-y-auto">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = opt.id === theme;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-right flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100/90 font-bold text-slate-900 border border-slate-300'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                  style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full border-2 border-white shadow-xs shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: opt.accentColor }}
                    />
                    <div className="min-w-0 text-start">
                      <div className="font-semibold text-slate-900 text-xs truncate">
                        {lang === 'ar' ? opt.nameAr : opt.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                        {lang === 'ar' ? opt.descAr : opt.descEn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                        opt.isDark
                          ? 'bg-slate-800 text-slate-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {opt.badge}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-slate-100 px-2 text-[10px] text-slate-400 text-center">
            {lang === 'ar'
              ? 'يُحفظ اختيارك تلقائياً لجميع شاشات النظام'
              : 'Your theme preference is saved automatically'}
          </div>
        </div>
      )}
    </div>
  );
};
