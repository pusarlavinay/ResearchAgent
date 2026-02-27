import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const getTheme = (mode) => createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#ffffff' : '#000000',
        light: mode === 'dark' ? '#f5f5f5' : '#333333',
        dark: mode === 'dark' ? '#e0e0e0' : '#000000',
      },
      secondary: {
        main: '#64748b',
        light: '#94a3b8',
        dark: '#475569',
      },
      background: {
        default: mode === 'dark' ? '#0f1115' : '#f8fafc',
        paper: mode === 'dark' ? '#1a1d23' : '#ffffff',
      },
      surface: {
        main: mode === 'dark' ? '#252932' : '#f1f5f9',
        light: mode === 'dark' ? '#2f3441' : '#e2e8f0',
        dark: mode === 'dark' ? '#1e2129' : '#cbd5e1',
      },
      text: {
        primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
        secondary: mode === 'dark' ? '#cbd5e1' : '#64748b',
      },
      divider: mode === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.12)',
      success: {
        main: '#10b981',
      },
      warning: {
        main: '#f59e0b',
      },
      error: {
        main: '#ef4444',
      },
    },
    typography: {
      fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: {
        fontSize: '2.25rem',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        fontFamily: '"Space Grotesk", sans-serif',
      },
      h2: {
        fontSize: '1.875rem',
        fontWeight: 600,
        letterSpacing: '-0.025em',
        fontFamily: '"Space Grotesk", sans-serif',
      },
      h3: {
        fontSize: '1.5rem',
        fontWeight: 600,
        fontFamily: '"Space Grotesk", sans-serif',
      },
      h4: {
        fontSize: '1.25rem',
        fontWeight: 600,
        fontFamily: '"Space Grotesk", sans-serif',
      },
      h5: {
        fontSize: '1.125rem',
        fontWeight: 500,
        fontFamily: '"Space Grotesk", sans-serif',
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        fontFamily: '"Space Grotesk", sans-serif',
      },
      body1: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.75rem',
        lineHeight: 1.5,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
      code: {
        fontFamily: '"IBM Plex Mono", "Fira Code", monospace',
        fontSize: '0.875rem',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: '1px solid',
            borderColor: mode === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.12)',
            '&:hover': {
              borderColor: mode === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.2)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 6,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 4,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

  const theme = getTheme(mode);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeModeProvider;