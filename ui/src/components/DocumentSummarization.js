import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import {
  Summarize,
  AutoAwesome,
} from '@mui/icons-material';

const DocumentSummarization = ({ open, onClose, document, onSummarize }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleSummarize = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSummary = {
        brief: `This document discusses ${document?.filename || 'the topic'} and covers key aspects of the subject matter.`,
        keyPoints: [
          'Main concept and introduction',
          'Detailed analysis and methodology',
          'Results and findings',
          'Conclusions and recommendations',
        ],
        wordCount: 1250,
        readingTime: '5 min',
      };
      
      setSummary(mockSummary);
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Summarize color="primary" />
          <Typography variant="h6">Document Summary</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {!summary && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <AutoAwesome sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Generate AI Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Get a concise summary with key points from {document?.filename}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Summarize />}
              onClick={handleSummarize}
            >
              Generate Summary
            </Button>
          </Box>
        )}

        {loading && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Analyzing document and generating summary...
            </Typography>
          </Box>
        )}

        {summary && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              Summary generated successfully!
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Brief Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {summary.brief}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Key Points
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {summary.keyPoints.map((point, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Chip label={index + 1} size="small" color="primary" />
                    <Typography variant="body2">{point}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip label={`${summary.wordCount} words`} size="small" variant="outlined" />
              <Chip label={`${summary.readingTime} read`} size="small" variant="outlined" />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {summary && (
          <Button variant="contained" onClick={() => navigator.clipboard.writeText(summary.brief)}>
            Copy Summary
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DocumentSummarization;
