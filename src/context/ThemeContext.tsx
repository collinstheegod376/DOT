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
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme] = useState<Theme>('light');

  const applyTheme = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
    if (document.body) {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  };

  useEffect(() => {
    applyTheme();
    try {
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    } catch {
      // Ignore storage error
    }
  }, []);

  const setTheme = (_newTheme: Theme) => {
    applyTheme();
  };

  const toggleTheme = () => {
    // Pure light mode enforcement - no-op or re-affirm light mode
    applyTheme();
  };

  const contextValue = useMemo<ThemeContextType>(
    () => ({
      theme: 'light',
      toggleTheme,
      setTheme,
      isDark: false,
    }),
    []
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
