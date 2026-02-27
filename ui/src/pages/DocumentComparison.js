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
  const { 
    documents, 
    setDocuments, 
    documentsLoaded, 
    setDocumentsLoaded,
    comparisonResult,
    setComparisonResult,
    selectedDocsForComparison,
    setSelectedDocsForComparison
  } = useAppContext();
  const [visible, setVisible] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState(() => selectedDocsForComparison);
  const [comparing, setComparing] = useState(false);
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

  useEffect(() => {
    setSelectedDocsForComparison(selectedDocs);
  }, [selectedDocs, setSelectedDocsForComparison]);

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
    try {
      const selectedDocuments = documents.filter(doc => selectedDocs.includes(doc.id));
      const docNames = selectedDocuments.map(doc => doc.filename).join(', ');
      
      const comparisonPrompt = `Compare the following ${selectedDocs.length} documents and provide:
1. Key similarities between them
2. Major differences
3. Insights from comparing them
4. An overlap score (0-100) indicating content similarity

Documents: ${docNames}`;

      const result = await queryAPI.query(comparisonPrompt, 'balanced', selectedDocs);
      
      // Parse AI response to extract structured data
      const response = result.answer;
      
      // Extract sections from response
      const similarities = extractSection(response, 'similarities', 'similar');
      const differences = extractSection(response, 'differences', 'different');
      const insights = extractSection(response, 'insights', 'insight');
      const overlapScore = extractScore(response);

      setComparisonResult({
        similarities: similarities.length > 0 ? similarities : ['Analysis completed - see full response'],
        differences: differences.length > 0 ? differences : ['Analysis completed - see full response'],
        keyInsights: insights.length > 0 ? insights : ['Analysis completed - see full response'],
        overlapScore: overlapScore,
        fullResponse: response,
      });
    } catch (error) {
      console.error('Comparison failed:', error);
      setComparisonResult({
        similarities: ['Error performing comparison'],
        differences: ['Please try again'],
        keyInsights: ['Comparison service unavailable'],
        overlapScore: 0,
      });
    } finally {
      setComparing(false);
    }
  };

  const formatText = (text) => {
    // Split by colons to detect key-value patterns
    const parts = text.split(':');
    if (parts.length === 2) {
      return (
        <Box component="span">
          <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>{parts[0]}:</Box>
          <Box component="span" sx={{ ml: 0.5 }}>{parts[1].trim()}</Box>
        </Box>
      );
    }
    return text;
  };

  const extractSection = (text, ...keywords) => {
    const lines = text.split('\n').filter(line => line.trim());
    const items = [];
    let inSection = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(kw => lowerLine.includes(kw))) {
        inSection = true;
        continue;
      }
      if (inSection && (line.match(/^[\d\-\*•]/) || line.trim().startsWith('-'))) {
        // Clean up markdown symbols and bullets
        const cleaned = line
          .replace(/^[\d\-\*•\.\)\s]+/, '')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/^[-•]\s*/, '')
          .trim();
        if (cleaned) items.push(cleaned);
      }
      if (items.length >= 5) break;
    }
    return items.slice(0, 5);
  };

  const extractScore = (text) => {
    const scoreMatch = text.match(/(\d{1,3})%|score[:\s]+(\d{1,3})|overlap[:\s]+(\d{1,3})/i);
    if (scoreMatch) {
      return parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
    }
    return 65;
  };

  const handleReset = () => {
    setSelectedDocs([]);
    setComparisonResult(null);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setUploadDialog({ open: true, files, results: [] });
    
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
    
    setUploading(false);
    setUploadDialog(prev => ({ ...prev, results }));
    await fetchDocuments();
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
                <Compare sx={{ color: '#ffffff' }} />
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
                                ? (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')
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
                              primaryTypographyProps={{ 
                                fontSize: '0.9rem', 
                                fontWeight: 500,
                                noWrap: true,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              secondaryTypographyProps={{
                                noWrap: true
                              }}
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
                      sx={{ 
                        bgcolor: theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main',
                        color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark' ? '#e0e0e0' : 'primary.dark',
                          color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff'
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'action.disabledBackground',
                          color: 'text.disabled'
                        },
                        '& .MuiButton-startIcon': {
                          color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff'
                        },
                        '&.Mui-disabled .MuiButton-startIcon': {
                          color: 'text.disabled'
                        }
                      }}
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
                      <Paper sx={{ p: 3, mb: 3, textAlign: 'center', bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)', border: '1px solid', borderColor: 'primary.main' }}>
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
                            <ListItem 
                              key={idx} 
                              sx={{ 
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.05)', 
                                borderRadius: 2, 
                                mb: 1.5, 
                                border: '1px solid', 
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                                py: 2,
                                px: 2.5,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                                  transform: 'translateX(4px)'
                                }
                              }}
                            >
                              <CheckCircle sx={{ color: 'success.main', mr: 2, fontSize: 20 }} />
                              <ListItemText 
                                primary={formatText(item)}
                                primaryTypographyProps={{ 
                                  fontSize: '0.95rem', 
                                  color: 'text.primary',
                                  lineHeight: 1.7,
                                  fontWeight: 400
                                }} 
                              />
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
                            <ListItem 
                              key={idx} 
                              sx={{ 
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(245, 158, 11, 0.05)', 
                                borderRadius: 2, 
                                mb: 1.5, 
                                border: '1px solid', 
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
                                py: 2,
                                px: 2.5,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                                  transform: 'translateX(4px)'
                                }
                              }}
                            >
                              <Difference sx={{ color: 'warning.main', mr: 2, fontSize: 20 }} />
                              <ListItemText 
                                primary={formatText(item)}
                                primaryTypographyProps={{ 
                                  fontSize: '0.95rem', 
                                  color: 'text.primary',
                                  lineHeight: 1.7,
                                  fontWeight: 400
                                }} 
                              />
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
                            <ListItem 
                              key={idx} 
                              sx={{ 
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.05)', 
                                borderRadius: 2, 
                                mb: 1.5, 
                                border: '1px solid', 
                                borderColor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                                py: 2,
                                px: 2.5,
                                transition: 'all 0.2s',
                                '&:hover': {
                                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                                  transform: 'translateX(4px)'
                                }
                              }}
                            >
                              <TrendingUp sx={{ color: 'info.main', mr: 2, fontSize: 20 }} />
                              <ListItemText 
                                primary={formatText(item)}
                                primaryTypographyProps={{ 
                                  fontSize: '0.95rem', 
                                  color: 'text.primary',
                                  lineHeight: 1.7,
                                  fontWeight: 400
                                }} 
                              />
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
