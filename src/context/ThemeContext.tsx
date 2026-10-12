import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppThemeId =
  | 'light-emerald'   // Classic School Mint/Emerald (Default)
  | 'dark-slate'      // Modern Executive Dark Mode (Sleek dark slate / midnight)
  | 'elementary-sky'  // Calm Sky Blue (Great for Elementary / General Schools)
  | 'rose-blossom'    // Soft Rose / Violet Quartz (Great for Girls' Academies / Calm Feminine aesthetics)
  | 'warm-amber';     // Warm Sand / Amber (Warm traditional heritage look)

export interface ThemeOption {
  id: AppThemeId;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  isDark: boolean;
  accentColor: string;
  bgColor: string;
  badge: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'light-emerald',
    nameAr: 'الزمردي الكلاسيكي (الافتراضي)',
    nameEn: 'Classic Emerald (Default)',
    descAr: 'هادئ، رسمي، مناسب لجميع المنشآت والمدارس الثانوية',
    descEn: 'Clean, balanced, standard school theme',
    isDark: false,
    accentColor: '#059669',
    bgColor: '#f8fafc',
    badge: 'نهاري',
  },
  {
    id: 'dark-slate',
    nameAr: 'الوضع الداكن الليلي (Dark Mode)',
    nameEn: 'Midnight Dark Mode',
    descAr: 'مريح للعينين، فخم، مثالي للعمل المسائي وغرف المراقبة',
    descEn: 'Ultra-comfortable contrast, OLED-friendly, reduced eye fatigue',
    isDark: true,
    accentColor: '#10b981',
    bgColor: '#0f172a',
    badge: 'ليلي',
  },
  {
    id: 'elementary-sky',
    nameAr: 'السماوي الهادئ (المدارس والطفولة)',
    nameEn: 'Calm Sky Blue',
    descAr: 'ألوان مشرقة ومريحة تناسب مدارس الطفولة والمرحلة الابتدائية',
    descEn: 'Bright, cheerful, ideal for primary/elementary campuses',
    isDark: false,
    accentColor: '#0284c7',
    bgColor: '#f0f9ff',
    badge: 'ابتدائي',
  },
  {
    id: 'rose-blossom',
    nameAr: 'الوردي الهادئ (أكاديميات وبنات)',
    nameEn: 'Soft Rose Quartz',
    descAr: 'درجات زهرية هادئة وأنيقة لمدارس البنات والأكاديميات التربوية',
    descEn: 'Soft pastel tones, elegant, popular for girls\' institutes',
    isDark: false,
    accentColor: '#e11d48',
    bgColor: '#fff1f2',
    badge: 'أكاديمي',
  },
  {
    id: 'warm-amber',
    nameAr: 'الكهرماني الدافئ (التراث والانضباط)',
    nameEn: 'Warm Amber Heritage',
    descAr: 'ألوان ترابية دافئة تركز على الانضباط والهدوء البصري',
    descEn: 'Warm sand and amber hues, grounded & focused',
    isDark: false,
    accentColor: '#d97706',
    bgColor: '#fffbeb',
    badge: 'تراثي',
  },
];

interface ThemeContextType {
  theme: AppThemeId;
  setTheme: (theme: AppThemeId) => void;
  isDark: boolean;
  toggleDarkMode: () => void;
  activeThemeConfig: ThemeOption;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'smart_school_ui_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppThemeId>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppThemeId;
      if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
        return saved;
      }
    }
    return 'light-emerald';
  });

  const activeThemeConfig = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];
  const isDark = activeThemeConfig.isDark;

  const setTheme = (newTheme: AppThemeId) => {
    setThemeState(newTheme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  };

  const toggleDarkMode = () => {
    if (isDark) {
      setTheme('light-emerald');
    } else {
      setTheme('dark-slate');
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    // Set data-theme attribute
    root.setAttribute('data-theme', theme);
    
    // Toggle standard 'dark' class for Tailwind dark variant support
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme, isDark]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        toggleDarkMode,
        activeThemeConfig,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
