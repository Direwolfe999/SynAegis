"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchPreferences } from '../lib/api';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (mode: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Initial fetch to sync with settings, or just default to true
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) {
        setIsDarkMode(storedTheme === 'dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setDarkMode = (mode: boolean) => {
    setIsDarkMode(mode);
    localStorage.setItem('theme', mode ? 'dark' : 'light');
    if (mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setDarkMode }}>
      <div className={`transition-colors duration-500 min-h-screen ${isDarkMode ? 'dark bg-[#050505] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
