import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  Search,
  Psychology,
  CloudUpload,
  Analytics,
  Dashboard,
  DarkMode,
  LightMode,
  FileDownload,
  Clear,
} from '@mui/icons-material';

const CommandPalette = ({ open, onClose, onToggleTheme, onExport, onClearChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const commands = [
    {
      id: 'dashboard',
      label: 'Go to Dashboard',
      icon: <Dashboard />,
      action: () => navigate('/dashboard'),
      keywords: ['home', 'overview', 'main'],
    },
    {
      id: 'query',
      label: 'Go to Query Interface',
      icon: <Search />,
      action: () => navigate('/query'),
      keywords: ['search', 'ask', 'chat', 'documents'],
    },
    {
      id: 'resume',
      label: 'Go to Resume Analyzer',
      icon: <Psychology />,
      action: () => navigate('/resume'),
      keywords: ['cv', 'job', 'skills', 'analyze'],
    },
    {
      id: 'upload',
      label: 'Go to Upload',
      icon: <CloudUpload />,
      action: () => navigate('/upload'),
      keywords: ['add', 'documents', 'files'],
    },
    {
      id: 'metrics',
      label: 'Go to System Metrics',
      icon: <Analytics />,
      action: () => navigate('/metrics'),
      keywords: ['stats', 'performance', 'analytics'],
    },
    {
      id: 'theme',
      label: 'Toggle Dark Mode',
      icon: <DarkMode />,
      action: onToggleTheme,
      keywords: ['theme', 'light', 'dark', 'appearance'],
    },
    {
      id: 'export',
      label: 'Export Data',
      icon: <FileDownload />,
      action: onExport,
      keywords: ['download', 'save', 'backup'],
    },
    {
      id: 'clear',
      label: 'Clear Chat History',
      icon: <Clear />,
      action: onClearChat,
      keywords: ['delete', 'remove', 'reset'],
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const search = searchTerm.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(search) ||
      cmd.keywords.some((keyword) => keyword.includes(search))
    );
  });

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      executeCommand(filteredCommands[selectedIndex]);
    }
  };

  const executeCommand = (command) => {
    command.action();
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedIndex(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '20%',
          m: 0,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Type a command or search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          variant="outlined"
          autoComplete="off"
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                border: 'none',
              },
            },
          }}
        />
      </Box>

      <List sx={{ maxHeight: 400, overflow: 'auto', pb: 1 }}>
        {filteredCommands.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No commands found
            </Typography>
          </Box>
        ) : (
          filteredCommands.map((command, index) => (
            <ListItem
              key={command.id}
              button
              selected={index === selectedIndex}
              onClick={() => executeCommand(command)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{command.icon}</ListItemIcon>
              <ListItemText primary={command.label} />
            </ListItem>
          ))
        )}
      </List>

      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          justifyContent: 'center',
        }}
      >
        <Chip label="↑↓ Navigate" size="small" variant="outlined" />
        <Chip label="Enter Select" size="small" variant="outlined" />
        <Chip label="Esc Close" size="small" variant="outlined" />
      </Box>
    </Dialog>
  );
};

export default CommandPalette;
