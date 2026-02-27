import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Grid, Button, Chip,
  List, ListItem, ListItemText, Checkbox, Paper, LinearProgress,
  Divider, Avatar, Fade, Grow, useTheme, Alert, IconButton, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Compare, CheckCircle, Cancel, TrendingUp, Difference, Summarize,
  CloudUpload, Refresh, MoreVert, GetApp, Share, Print
} from '@mui/icons-material';
import { useAppContext } from '../contexts/AppContext';
import { queryAPI } from '../services/api';

const DocumentComparison = () => {
  const theme = useTheme();
  const { documents, setDocuments, documentsLoaded, setDocumentsLoaded } = useAppContext();
  const [visible, setVisible] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [uploadDialog, setUploadDialog] = useState({ open: false, files: [], results: [] });
  const fileInputRef = useRef(null);

  useEffect(() => {
    setVisible(true);
    if (!documentsLoaded) {
      fetchDocuments();
    }
  }, [documentsLoaded]);

  const fetchDocuments = async () => {
    try {
      const result = await queryAPI.getDocuments();
      setDocuments(result.documents || []);
      setDocumentsLoaded(true);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setDocuments([]);
    }
  };

  const handleDocSelect = (docId) => {
    setSelectedDocs(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId);
      }
      if (prev.length < 3) {
        return [...prev, docId];
      }
      return prev;
    });
  };

  const handleCompare = async () => {
    if (selectedDocs.length < 2) return;
    
    setComparing(true);
    // Simulate comparison
    setTimeout(() => {
      setComparisonResult({
        similarities: [
          'Both documents discuss AI and machine learning concepts',
          'Common methodology: experimental research approach',
          'Similar citation patterns and academic structure',
        ],
        differences: [
          'Document 1 focuses on theoretical frameworks',
          'Document 2 emphasizes practical applications',
          'Different target audiences and complexity levels',
        ],
        keyInsights: [
          'Documents complement each other well',
          'Combined coverage provides comprehensive view',
          'Potential for cross-referencing in research',
        ],
        overlapScore: 67,
      });
      setComparing(false);
    }, 2000);
  };

  const handleReset = () => {
    setSelectedDocs([]);
    setComparisonResult(null);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadDialog({ open: true, files, results: [] });
    setUploading(true);
    
    const results = [];
    for (const file of files) {
      try {
        const result = await queryAPI.uploadDocument(file);
        results.push({
          filename: file.name,
          status: 'success',
          message: result.message || 'Document uploaded successfully',
        });
      } catch (error) {
        results.push({
          filename: file.name,
          status: 'error',
          message: error.response?.data?.detail || error.message || 'Upload failed',
        });
      }
    }
    setUploadDialog(prev => ({ ...prev, results }));
    await fetchDocuments();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    if (!comparisonResult) return;
    const data = JSON.stringify(comparisonResult, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparison-result.json';
    a.click();
    setAnchorEl(null);
  };

  const handlePrint = () => {
    window.print();
    setAnchorEl(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', pt: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ flex: 1, py: 2 }}>
        <Fade in={visible} timeout={600}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <Compare />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  Document Comparison
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compare up to 3 documents to find similarities, differences, and insights
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>

        <Grid container spacing={2}>
          {/* Document Selection */}
          <Grid item xs={12} md={4}>
            <Grow in={visible} timeout={800}>
              <Card sx={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Select Documents
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Chip 
                        label={`${selectedDocs.length}/3`} 
                        color={selectedDocs.length >= 2 ? 'primary' : 'default'}
                        size="small"
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        multiple
                        accept=".pdf,.docx,.txt"
                        style={{ display: 'none' }}
                      />
                      <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <CloudUpload fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={fetchDocuments}>
                        <Refresh fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                    {documents.length === 0 ? (
                      <Alert severity="info">No documents available. Upload documents first.</Alert>
                    ) : (
                      <List>
                        {documents.map((doc) => (
                          <ListItem
                            key={doc.id}
                            sx={{
                              bgcolor: selectedDocs.includes(doc.id) 
                                ? (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)')
                                : 'transparent',
                              borderRadius: 1,
                              mb: 1,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                            onClick={() => handleDocSelect(doc.id)}
                          >
                            <Checkbox
                              checked={selectedDocs.includes(doc.id)}
                              disabled={!selectedDocs.includes(doc.id) && selectedDocs.length >= 3}
                            />
                            <ListItemText
                              primary={doc.filename}
                              secondary={new Date(doc.created_at).toLocaleDateString()}
                              primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleCompare}
                      disabled={selectedDocs.length < 2 || comparing}
                      startIcon={<Compare />}
                      sx={{ color: '#fff' }}
                    >
                      {comparing ? 'Comparing...' : 'Compare'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleReset}
                      disabled={selectedDocs.length === 0}
                      sx={{ color: 'text.primary', borderColor: 'divider' }}
                    >
                      Reset
                    </Button>
                  </Box>
                  {comparing && <LinearProgress sx={{ mt: 2 }} />}
                </CardContent>
              </Card>
            </Grow>
          </Grid>

          {/* Comparison Results */}
          <Grid item xs={12} md={8}>
            <Grow in={visible} timeout={1000}>
              <Card sx={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Comparison Results
                    </Typography>
                    {comparisonResult && (
                      <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <MoreVert />
                      </IconButton>
                    )}
                  </Box>
                  {!comparisonResult ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Compare sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        Ready to Compare
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Select 2-3 documents and click Compare
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {/* Overlap Score */}
                      <Paper sx={{ p: 3, mb: 3, textAlign: 'center', bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)', border: '1px solid', borderColor: 'primary.main' }}>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                          {comparisonResult.overlapScore}%
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
                          Content Overlap Score
                        </Typography>
                      </Paper>

                      {/* Similarities */}
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <CheckCircle color="success" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Similarities
                          </Typography>
                        </Box>
                        <List>
                          {comparisonResult.similarities.map((item, idx) => (
                            <ListItem key={idx} sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 1, mb: 1, border: '1px solid', borderColor: 'divider' }}>
                              <ListItemText primary={item} primaryTypographyProps={{ fontSize: '0.9rem', color: 'text.primary' }} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Differences */}
                      <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Difference color="warning" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Key Differences
                          </Typography>
                        </Box>
                        <List>
                          {comparisonResult.differences.map((item, idx) => (
                            <ListItem key={idx} sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 1, mb: 1, border: '1px solid', borderColor: 'divider' }}>
                              <ListItemText primary={item} primaryTypographyProps={{ fontSize: '0.9rem', color: 'text.primary' }} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Insights */}
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <TrendingUp color="info" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Key Insights
                          </Typography>
                        </Box>
                        <List>
                          {comparisonResult.keyInsights.map((item, idx) => (
                            <ListItem key={idx} sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 1, mb: 1, border: '1px solid', borderColor: 'divider' }}>
                              <ListItemText primary={item} primaryTypographyProps={{ fontSize: '0.9rem', color: 'text.primary' }} />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        </Grid>
      </Container>

      {/* Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={handleExport}>
          <GetApp sx={{ mr: 1 }} fontSize="small" />
          Export Results
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <Print sx={{ mr: 1 }} fontSize="small" />
          Print
        </MenuItem>
      </Menu>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog.open} onClose={() => !uploading && setUploadDialog({ open: false, files: [], results: [] })} maxWidth="sm" fullWidth>
        <DialogTitle>{uploading ? 'Uploading Documents' : 'Upload Complete'}</DialogTitle>
        <DialogContent>
          {uploading ? (
            <Box>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Processing documents...
              </Typography>
              {uploadDialog.files.map((file, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CloudUpload sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2">{file.name}</Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box>
              {uploadDialog.results.map((result, index) => (
                <Alert
                  key={index}
                  severity={result.status === 'success' ? 'success' : 'error'}
                  icon={result.status === 'success' ? <CheckCircle /> : <Cancel />}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2">{result.filename}</Typography>
                  <Typography variant="body2">{String(result.message)}</Typography>
                </Alert>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog({ open: false, files: [], results: [] })} disabled={uploading}>
            {uploading ? 'Processing...' : 'Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentComparison;
