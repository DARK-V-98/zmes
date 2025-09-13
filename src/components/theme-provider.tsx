
"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"
import type { Mood } from "./mood-provider";

export type Theme = 'theme-blue' | 'theme-green' | 'theme-pink' | 'theme-orange' | 'dark' | 'light' | 'system';

export const THEME_MAP: Record<Mood, string> = {
  happy: 'mood-happy',
  sad: 'mood-sad',
  angry: 'mood-angry',
  love: 'mood-love',
  surprised: 'mood-surprised',
};

interface CustomThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
      document.body.className = savedTheme;
    } else {
      // Respect system preference if no theme is saved
       const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
       const defaultTheme = prefersDark ? 'dark' : 'light';
       setThemeState(defaultTheme);
       document.body.className = defaultTheme;
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.body.className = newTheme;
  };
  
  return (
     <NextThemesProvider {...props}>
      <CustomThemeContext.Provider value={{ theme, setTheme }}>
        {children}
      </CustomThemeContext.Provider>
    </NextThemesProvider>
  )
}


export const useTheme = () => {
  const context = useContext(CustomThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
