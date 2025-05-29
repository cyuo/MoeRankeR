'use client';
import React, { useMemo, createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { createAppTheme } from './theme';
import { PaletteMode } from '@mui/material';

// 创建主题上下文
type ThemeContextType = {
  mode: PaletteMode;
  toggleTheme: () => void;
  isClient: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
  isClient: false,
});

// 自定义钩子，用于访问主题上下文
export function useThemeMode() {
  return useContext(ThemeContext);
}

// 主题提供者组件
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>('light'); 
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const savedMode = localStorage.getItem('themeMode') as PaletteMode;
      if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
        setMode(savedMode);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setMode('dark');
      }
    }
  }, [isClient]);

  const toggleTheme = () => {
    if (!isClient) return;
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
    // console.log("Theme toggling (partially restored) disabled for debugging hydration mismatch.");
  };

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, isClient }}>
      <AppRouterCacheProvider options={{ key: 'mui' }}>
        <MuiThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </AppRouterCacheProvider>
    </ThemeContext.Provider>
  );
}

// 主题注册组件，作为应用的入口点
export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}