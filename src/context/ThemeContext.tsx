'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type Theme = 'dark' | 'light';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  isDark: boolean;
}

const THEME_STORAGE_KEY = 'dot_theme';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  const applyTheme = (t: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (t === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      if (document.body) {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      }
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      if (document.body) {
        document.body.classList.remove('light');
        document.body.classList.add('dark');
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
        applyTheme(saved);
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initial: Theme = prefersDark ? 'dark' : 'light';
        setThemeState(initial);
        applyTheme(initial);
      }
    } catch {
      applyTheme('dark');
    }
  }, []);

  // Listen for OS system theme changes if not explicitly overridden by user
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      try {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (!saved) {
          const sysTheme: Theme = e.matches ? 'dark' : 'light';
          setThemeState(sysTheme);
          applyTheme(sysTheme);
        }
      } catch {
        // Ignore storage error
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage error
    }
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const isDark = theme === 'dark';

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      theme,
      toggleTheme,
      setTheme,
      isDark,
    }),
    [theme, isDark]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
