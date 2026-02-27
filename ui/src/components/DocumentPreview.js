import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import { Close, Description, CalendarToday, Storage } from '@mui/icons-material';

const DocumentPreview = ({ open, onClose, document }) => {
  if (!document) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" />
            <Typography variant="h6">Document Details</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {document.filename}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <Chip
              icon={<CalendarToday />}
              label={`Uploaded: ${new Date(document.created_at).toLocaleDateString()}`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<Storage />}
              label={`ID: ${document.id}`}
              size="small"
              variant="outlined"
            />
            {document.file_type && (
              <Chip
                label={document.file_type.toUpperCase()}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Document Statistics
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Chunks Created
                </Typography>
                <Typography variant="h6" color="primary.main">
                  {document.chunks_count || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Processing Status
                </Typography>
                <Typography variant="h6" color="success.main">
                  Indexed
                </Typography>
              </Box>
            </Box>
          </Box>

          {document.metadata && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Metadata
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: 'rgba(148, 163, 184, 0.05)',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                  }}
                >
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(document.metadata, null, 2)}
                  </pre>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentPreview;
