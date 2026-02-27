import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, useMediaQuery } from '@mui/material';
import { ThemeModeProvider, useThemeMode } from './contexts/ThemeContext';
import { AppProvider, useAppContext } from './contexts/AppContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import QueryInterface from './pages/QueryInterface';
import SystemMetrics from './pages/SystemMetrics';
import DocumentUpload from './pages/DocumentUpload';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import LoadingScreen from './components/LoadingScreen';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import CommandPalette from './components/CommandPalette';
import ExportDialog from './components/ExportDialog';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      cacheTime: 300000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { theme, toggleMode } = useThemeMode();
  const { conversations, setConversations, resumeData } = useAppContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      document.body.classList.add('app-loaded');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K - Command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // Ctrl+/ or Cmd+/ - Show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen(true);
      }
      // Ctrl+D or Cmd+D - Toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleMode();
      }
      // Ctrl+B or Cmd+B - Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      // Ctrl+E or Cmd+E - Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setExportOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar 
            open={sidebarOpen} 
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            isMobile={isMobile}
          />
          
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              minHeight: '100vh',
              backgroundColor: 'background.default',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <Routes>
                <Route path="/" element={<Box sx={{ p: { xs: 2, sm: 3 }, height: '100%', overflow: 'auto' }}><Dashboard /></Box>} />
                <Route path="/dashboard" element={<Box sx={{ p: { xs: 2, sm: 3 }, height: '100%', overflow: 'auto' }}><Dashboard /></Box>} />
                <Route path="/query" element={<QueryInterface />} />
                <Route path="/resume" element={<Box sx={{ p: { xs: 2, sm: 3 }, height: '100%', overflow: 'auto' }}><ResumeAnalyzer /></Box>} />
                <Route path="/metrics" element={<Box sx={{ p: { xs: 2, sm: 3 }, height: '100%', overflow: 'auto' }}><SystemMetrics /></Box>} />
                <Route path="/upload" element={<Box sx={{ p: { xs: 2, sm: 3 }, height: '100%', overflow: 'auto' }}><DocumentUpload /></Box>} />
              </Routes>
            </Box>
            
            <KeyboardShortcuts 
              open={shortcutsOpen} 
              onClose={() => setShortcutsOpen(false)} 
            />
            
            <CommandPalette
              open={commandPaletteOpen}
              onClose={() => setCommandPaletteOpen(false)}
              onToggleTheme={toggleMode}
              onExport={() => {
                setCommandPaletteOpen(false);
                setExportOpen(true);
              }}
              onClearChat={() => {
                setConversations([]);
                setCommandPaletteOpen(false);
              }}
            />
            
            <ExportDialog
              open={exportOpen}
              onClose={() => setExportOpen(false)}
              conversations={conversations}
              resumeAnalysis={resumeData?.analysis}
            />
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeModeProvider>
    </QueryClientProvider>
  );
}

export default App;
