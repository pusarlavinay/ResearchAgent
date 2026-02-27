import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Lightbulb,
  Close,
  TipsAndUpdates,
} from '@mui/icons-material';

const SmartSuggestions = ({ suggestions, onSelectSuggestion, onDismiss }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        border: '1px solid',
        borderColor: 'primary.main',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TipsAndUpdates color="primary" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Suggested Questions
          </Typography>
        </Box>
        {onDismiss && (
          <IconButton size="small" onClick={onDismiss}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {suggestions.map((suggestion, index) => (
          <Chip
            key={index}
            label={suggestion}
            onClick={() => onSelectSuggestion(suggestion)}
            clickable
            color="primary"
            variant="outlined"
            sx={{
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
              },
            }}
          />
        ))}
      </Box>
    </Paper>
  );
};

export default SmartSuggestions;
