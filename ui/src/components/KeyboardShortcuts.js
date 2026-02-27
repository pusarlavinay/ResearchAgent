import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  Grid,
  IconButton,
  Divider,
} from '@mui/material';
import { Close, Keyboard } from '@mui/icons-material';

const KeyboardShortcuts = ({ open, onClose }) => {
  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Ctrl', 'K'], description: 'Open command palette' },
        { keys: ['Ctrl', '1'], description: 'Go to Query Interface' },
        { keys: ['Ctrl', '2'], description: 'Go to Resume Analyzer' },
        { keys: ['Ctrl', '3'], description: 'Go to Upload' },
        { keys: ['Ctrl', '4'], description: 'Go to Metrics' },
      ],
    },
    {
      category: 'Query Interface',
      items: [
        { keys: ['Ctrl', 'Enter'], description: 'Send query' },
        { keys: ['Ctrl', 'L'], description: 'Clear conversation' },
        { keys: ['Ctrl', 'U'], description: 'Upload document' },
        { keys: ['Esc'], description: 'Cancel current action' },
      ],
    },
    {
      category: 'General',
      items: [
        { keys: ['Ctrl', '/'], description: 'Show shortcuts' },
        { keys: ['Ctrl', 'D'], description: 'Toggle dark mode' },
        { keys: ['Ctrl', 'S'], description: 'Save conversation' },
        { keys: ['Ctrl', 'E'], description: 'Export data' },
      ],
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Keyboard color="primary" />
            <Typography variant="h6">Keyboard Shortcuts</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {shortcuts.map((section, index) => (
          <Box key={section.category} sx={{ mb: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}
            >
              {section.category}
            </Typography>
            <Grid container spacing={2}>
              {section.items.map((shortcut, idx) => (
                <Grid item xs={12} key={idx}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 1,
                      backgroundColor: 'rgba(148, 163, 184, 0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(148, 163, 184, 0.1)',
                      },
                    }}
                  >
                    <Typography variant="body2">{shortcut.description}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {shortcut.keys.map((key) => (
                        <Chip
                          key={key}
                          label={key}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            backgroundColor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
            {index < shortcuts.length - 1 && <Divider sx={{ mt: 3 }} />}
          </Box>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcuts;
