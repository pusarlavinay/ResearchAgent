import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Download, FileDownload } from '@mui/icons-material';

const ExportDialog = ({ open, onClose, conversations, resumeAnalysis }) => {
  const [format, setFormat] = useState('json');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      let content = '';
      let filename = '';
      let mimeType = '';

      if (format === 'json') {
        const data = {
          conversations: conversations,
          resumeAnalysis: resumeAnalysis,
          metadata: includeMetadata ? {
            exportDate: new Date().toISOString(),
            totalConversations: conversations.length,
            version: '1.0.0',
          } : undefined,
        };
        content = JSON.stringify(data, null, 2);
        filename = `research-agent-export-${Date.now()}.json`;
        mimeType = 'application/json';
      } else if (format === 'markdown') {
        content = generateMarkdown(conversations, resumeAnalysis, includeMetadata);
        filename = `research-agent-export-${Date.now()}.md`;
        mimeType = 'text/markdown';
      } else if (format === 'txt') {
        content = generatePlainText(conversations, resumeAnalysis, includeMetadata);
        filename = `research-agent-export-${Date.now()}.txt`;
        mimeType = 'text/plain';
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        setExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setExporting(false);
    }
  };

  const generateMarkdown = (conversations, resumeAnalysis, includeMetadata) => {
    let md = '# AI Research Agent Export\n\n';
    
    if (includeMetadata) {
      md += `**Export Date:** ${new Date().toLocaleString()}\n\n`;
      md += `**Total Conversations:** ${conversations.length}\n\n`;
      md += '---\n\n';
    }

    md += '## Conversations\n\n';
    conversations.forEach((msg, index) => {
      md += `### ${msg.type === 'user' ? 'User' : 'AI Assistant'} (${new Date(msg.timestamp).toLocaleString()})\n\n`;
      md += `${msg.content}\n\n`;
      if (msg.confidence) {
        md += `*Confidence: ${Math.round(msg.confidence * 100)}%*\n\n`;
      }
      if (msg.sources && msg.sources.length > 0) {
        md += '**Sources:**\n';
        msg.sources.forEach((source, idx) => {
          md += `- ${source.content_preview}\n`;
        });
        md += '\n';
      }
      md += '---\n\n';
    });

    if (resumeAnalysis) {
      md += '## Resume Analysis\n\n';
      md += `**Overall Score:** ${resumeAnalysis.overall_score || resumeAnalysis.overallScore}%\n\n`;
      md += `**Matched Skills:** ${(resumeAnalysis.matched_skills || resumeAnalysis.matchedSkills || []).join(', ')}\n\n`;
      md += `**Missing Skills:** ${(resumeAnalysis.missing_skills || resumeAnalysis.missingSkills || []).join(', ')}\n\n`;
    }

    return md;
  };

  const generatePlainText = (conversations, resumeAnalysis, includeMetadata) => {
    let txt = 'AI RESEARCH AGENT EXPORT\n';
    txt += '='.repeat(50) + '\n\n';
    
    if (includeMetadata) {
      txt += `Export Date: ${new Date().toLocaleString()}\n`;
      txt += `Total Conversations: ${conversations.length}\n\n`;
      txt += '-'.repeat(50) + '\n\n';
    }

    txt += 'CONVERSATIONS\n\n';
    conversations.forEach((msg, index) => {
      txt += `[${msg.type === 'user' ? 'USER' : 'AI'}] ${new Date(msg.timestamp).toLocaleString()}\n`;
      txt += `${msg.content}\n`;
      if (msg.confidence) {
        txt += `Confidence: ${Math.round(msg.confidence * 100)}%\n`;
      }
      txt += '\n' + '-'.repeat(50) + '\n\n';
    });

    if (resumeAnalysis) {
      txt += 'RESUME ANALYSIS\n\n';
      txt += `Overall Score: ${resumeAnalysis.overall_score || resumeAnalysis.overallScore}%\n`;
      txt += `Matched Skills: ${(resumeAnalysis.matched_skills || resumeAnalysis.matchedSkills || []).join(', ')}\n`;
      txt += `Missing Skills: ${(resumeAnalysis.missing_skills || resumeAnalysis.missingSkills || []).join(', ')}\n`;
    }

    return txt;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileDownload color="primary" />
          <Typography variant="h6">Export Data</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Export your conversations and analysis results for backup or sharing.
          </Alert>

          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ mb: 1 }}>
              Export Format
            </FormLabel>
            <RadioGroup value={format} onChange={(e) => setFormat(e.target.value)}>
              <FormControlLabel
                value="json"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      JSON
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Structured data format, best for re-importing
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="markdown"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Markdown
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Formatted text, great for documentation
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="txt"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Plain Text
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Simple text format, universal compatibility
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
              />
            }
            label="Include metadata (timestamps, confidence scores, etc.)"
          />
        </Box>

        {exporting && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              Preparing export...
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={exporting}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={<Download />}
          disabled={exporting}
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
