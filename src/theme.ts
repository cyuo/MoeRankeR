import { createTheme } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// 创建一个主题生成函数，根据模式返回不同的主题
export const createAppTheme = (mode: PaletteMode) => {
  return createTheme({
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
  });
};

// 默认导出亮色主题
const theme = createAppTheme('light');
export default theme;