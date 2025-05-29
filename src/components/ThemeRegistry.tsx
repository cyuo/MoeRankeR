'use client';
import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { useMediaQuery, PaletteMode } from '@mui/material';

// 创建主题上下文
type ThemeContextType = {
  mode: PaletteMode;
  toggleTheme: () => void;
};

const ThemeContext = React.createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

// 自定义钩子，用于访问主题上下文
export function useThemeMode() {
  return React.useContext(ThemeContext);
}

// 参考: https://mui.com/material-ui/integrations/nextjs/#app-router
export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  // 初始状态始终为 'light'，以确保 SSR 和 CSR 首次渲染一致
  const [mode, setMode] = React.useState<PaletteMode>('light');
  
  // useMediaQuery 钩子本身在服务器上可能会返回默认值 (false)
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mounted, setMounted] = React.useState(false);

  // 确保只在客户端进行初始挂载
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 在客户端挂载后，获取保存的主题或系统主题
  React.useEffect(() => {
    if (mounted) {
      const savedMode = localStorage.getItem('themeMode') as PaletteMode;
      if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
        setMode(savedMode);
      } else if (prefersDarkMode) {
        setMode('dark');
      }
    }
  }, [mounted, prefersDarkMode]);

  // 切换主题的函数
  const toggleTheme = React.useCallback(() => {
    if (!mounted) return;
    
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  }, [mode, mounted]);

  // 根据当前模式创建主题
  const theme = React.useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#1976d2' : '#90caf9',
      },
      secondary: {
        main: mode === 'light' ? '#dc004e' : '#f48fb1',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          'html, body': {
            margin: 0,
            padding: 0,
            height: '100%',
            width: '100%',
            transition: 'background-color 0.3s ease, color 0.3s ease',
            backgroundColor: mode === 'light' ? '#f5f5f5' : '#121212',
            color: mode === 'light' ? '#000000' : '#ffffff',
          },
          '#__next': {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: mode === 'light' ? '#f5f5f5' : '#121212',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
    },
  }), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <AppRouterCacheProvider options={{ key: 'mui', enableCssLayer: true }}>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </ThemeContext.Provider>
  );
}

// 如果你需要从 Navbar 或其他地方切换主题，可以创建一个 Context
// export const ThemeUpdateContext = React.createContext({
//   toggleTheme: () => {},
// }); 