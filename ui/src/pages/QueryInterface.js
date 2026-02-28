import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Card, CardContent, LinearProgress,
  Chip, Alert, IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
  DialogContentText, Avatar, Grid, Fade, Grow, Container, Checkbox, useTheme
} from '@mui/material';
import {
  Send, Clear, ContentCopy, Description, Delete, Person, SmartToy, Refresh,
  CloudUpload, CheckCircle, Error, ThumbUp, ThumbDown, FolderOpen, AutoAwesome,
  Folder, Chat
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { queryAPI } from '../services/api';
import { useAppContext } from '../contexts/AppContext';

const QueryInterface = () => {
  const theme = useTheme();
  const {
    conversations, setConversations, loading, setLoading, documents, setDocuments,
    selectedDocuments, setSelectedDocuments, documentsLoaded, setDocumentsLoaded,
    addNotification
  } = useAppContext();
  
  const [query, setQuery] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(() => !documentsLoaded);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, document: null });
  const [clearDialog, setClearDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDialog, setUploadDialog] = useState({ open: false, files: [], results: [] });
  const [noSourcesDialog, setNoSourcesDialog] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [visible, setVisible] = useState(false);
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const conversationEndRef = useRef(null);

  const loadingMessages = [
    'Activating quantum retrieval systems...',
    'Engaging neuromorphic memory networks...',
    'Scanning holographic information patterns...',
    'Deploying swarm intelligence agents...',
    'Analyzing temporal causality chains...',
    'Running speculative RAG processes...',
  ];

  useEffect(() => {
    setVisible(true);
    if (!documentsLoaded) fetchDocuments();
    else setLoadingDocs(false);
  }, [documentsLoaded]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, loading]);

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const result = await queryAPI.getDocuments();
      setDocuments(result.documents || []);
      setDocumentsLoaded(true);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    if (selectedDocuments.length === 0) {
      setNoSourcesDialog(true);
      return;
    }
    executeQuery();
  };

  const executeQuery = async () => {
    const currentQuery = query;
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentQuery,
      timestamp: new Date(),
      selectedDocCount: selectedDocuments.length,
    };

    setConversations(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);
    const startTime = Date.now();

    let messageIndex = 0;
    setLoadingMessage(loadingMessages[messageIndex]);
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2000);

    try {
      const result = await queryAPI.query(currentQuery, 'balanced', selectedDocuments);
      const responseTimeMs = Date.now() - startTime;
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: result.answer,
        confidence: result.confidence,
        sources: result.sources || [],
        timestamp: new Date(),
        responseTime: responseTimeMs,
        feedback: null,
        queriedDocCount: selectedDocuments.length,
      };
      setConversations(prev => [...prev, aiMessage]);
      
      addNotification({
        type: 'success',
        title: 'Query Processed',
        message: `Answer generated in ${(responseTimeMs / 1000).toFixed(1)}s`,
      });
    } catch (error) {
      console.error('Query failed:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: 'I apologize, but I encountered an error processing your query. Please try again.',
        confidence: 0,
        sources: [],
        timestamp: new Date(),
        error: true,
      };
      setConversations(prev => [...prev, errorMessage]);
      
      addNotification({
        type: 'error',
        title: 'Query Failed',
        message: 'An error occurred while processing your query',
      });
    } finally {
      clearInterval(messageInterval);
      setLoading(false);
      setLoadingMessage('');
    }
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
          message: result.message || 'Document processed successfully',
        });
        addNotification({
          type: 'success',
          title: 'Document Uploaded',
          message: `${file.name} has been successfully indexed`,
        });
      } catch (error) {
        results.push({
          filename: file.name,
          status: 'error',
          message: error.response?.data?.detail || error.message || 'Upload failed',
        });
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message: `Failed to upload ${file.name}`,
        });
      }
    }
    setUploadDialog(prev => ({ ...prev, results }));
    await fetchDocuments();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.type === 'user';
    
    return (
      <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 3 }}>
        {!isUser && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, mr: 2 }}>
            <SmartToy sx={{ color: '#ffffff' }} />
          </Avatar>
        )}
        
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            maxWidth: '75%',
            bgcolor: isUser ? '#ffffff' : 'background.paper',
            color: isUser ? '#000000' : 'text.primary',
            borderRadius: 3,
            border: '1px solid',
            borderColor: isUser ? '#e0e0e0' : 'divider',
          }}
        >
          {isUser ? (
            <Box>
              <Typography variant="body1" sx={{ lineHeight: 1.7, color: '#000000' }}>
                {message.content}
              </Typography>
              {message.selectedDocCount !== undefined && (
                <Chip
                  size="small"
                  label={`${message.selectedDocCount} source${message.selectedDocCount !== 1 ? 's' : ''}`}
                  sx={{ mt: 1, height: 22, bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#000000', fontWeight: 500 }}
                />
              )}
            </Box>
          ) : (
            <Box>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {message.content}
              </ReactMarkdown>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <IconButton size="small" onClick={() => navigator.clipboard.writeText(message.content)} sx={{ color: 'text.secondary' }}>
                  <ContentCopy fontSize="small" />
                </IconButton>
                <IconButton size="small" color={message.feedback?.type === 'positive' ? 'success' : 'default'} sx={{ color: message.feedback?.type === 'positive' ? 'success.main' : 'text.secondary' }}>
                  <ThumbUp fontSize="small" />
                </IconButton>
                <IconButton size="small" color={message.feedback?.type === 'negative' ? 'error' : 'default'} sx={{ color: message.feedback?.type === 'negative' ? 'error.main' : 'text.secondary' }}>
                  <ThumbDown fontSize="small" />
                </IconButton>
              </Box>
              
              {message.sources && message.sources.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <Description sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    {message.sources.slice(0, expandedSources[message.id] ? message.sources.length : 2).map((source, idx) => (
                      <Paper 
                        key={idx} 
                        sx={{ 
                          p: 1.5, 
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          Source {idx + 1}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.5, color: 'text.primary' }}>
                          {source.content_preview}
                        </Typography>
                      </Paper>
                    ))}
                    {message.sources.length > 2 && (
                      <Button
                        size="small"
                        onClick={() => setExpandedSources(prev => ({ ...prev, [message.id]: !prev[message.id] }))}
                        sx={{ fontSize: '0.75rem', textTransform: 'none', alignSelf: 'flex-start' }}
                      >
                        {expandedSources[message.id] ? '− Show less' : `+ ${message.sources.length - 2} more`}
                      </Button>
                    )}
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </Paper>
        
        {isUser && (
          <Avatar sx={{ bgcolor: 'grey.400', width: 40, height: 40, ml: 2 }}>
            <Person />
          </Avatar>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', pt: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ flex: 1, py: 1 }}>
        <Grid container spacing={2}>
          {/* Documents Section */}
          <Grid item xs={12} md={3}>
            <Grow in={visible} timeout={800}>
              <Card sx={{ height: '85vh', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Folder color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Sources
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        multiple
                        accept=".pdf,.docx,.txt"
                        style={{ display: 'none' }}
                      />
                      <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <CloudUpload />
                      </IconButton>
                      <IconButton size="small" onClick={fetchDocuments}>
                        <Refresh />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {documents.length > 0 && (
                    <Button
                      size="small"
                      onClick={() => setSelectedDocuments(selectedDocuments.length === documents.length ? [] : documents.map(d => d.id))}
                      variant="outlined"
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      {selectedDocuments.length === documents.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}
                </CardContent>
                
                <Box sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 2 }}>
                  {loadingDocs ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <LinearProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">Loading sources...</Typography>
                    </Box>
                  ) : documents.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <CloudUpload sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">No sources uploaded</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      {documents.map((doc) => (
                        <Paper
                          key={doc.id}
                          onClick={() => setSelectedDocuments(prev => 
                            prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                          )}
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            bgcolor: selectedDocuments.includes(doc.id) 
                              ? (theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)')
                              : 'background.paper',
                            border: '1px solid',
                            borderColor: selectedDocuments.includes(doc.id) ? 'primary.main' : 'divider',
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: 'primary.main', transform: 'translateX(4px)' },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Checkbox
                              checked={selectedDocuments.includes(doc.id)}
                              size="small"
                              sx={{ p: 0, color: 'primary.main' }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Description color="primary" sx={{ fontSize: 20 }} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.primary' }}>
                                {doc.filename}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(doc.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteDialog({ open: true, document: { id: doc.id, filename: doc.filename } });
                              }}
                              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Card>
            </Grow>
          </Grid>

          {/* Chat Section */}
          <Grid item xs={12} md={9}>
            <Grow in={visible} timeout={1000}>
              <Card sx={{ height: '85vh', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ pb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chat color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Conversation
                      </Typography>
                    </Box>
                    {conversations.length > 0 && (
                      <IconButton size="small" onClick={() => setClearDialog(true)} color="error">
                        <Clear />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>

                <Box sx={{ flex: 1, overflowY: 'auto', px: 3, pb: 2 }}>
                  {conversations.length === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                      <AutoAwesome sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        Ready to Answer Your Questions
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                        Select your sources and ask anything. I'll provide detailed answers with citations.
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      {conversations.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))}
                      
                      {loading && (
                        <Box sx={{ display: 'flex', mb: 3 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, mr: 2 }}>
                            <SmartToy sx={{ color: '#ffffff' }} />
                          </Avatar>
                          <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse 1.5s ease-in-out infinite' }} />
                              <Typography variant="body2" sx={{ color: 'text.primary' }}>{loadingMessage}</Typography>
                            </Box>
                          </Paper>
                        </Box>
                      )}
                      
                      <div ref={conversationEndRef} />
                    </Box>
                  )}
                </Box>

                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <form onSubmit={handleSubmit}>
                    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                      {selectedDocuments.length > 0 && (
                        <Box sx={{ 
                          px: 2, 
                          py: 1, 
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1 
                        }}>
                          <Description sx={{ fontSize: 16, color: 'primary.main' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.mode === 'dark' ? '#fff' : 'primary.main' }}>
                            {selectedDocuments.length} source{selectedDocuments.length !== 1 ? 's' : ''} selected
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', p: 1.5, gap: 1 }}>
                        <TextField
                          ref={textareaRef}
                          fullWidth
                          multiline
                          maxRows={4}
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmit(e);
                            }
                          }}
                          placeholder="Ask anything about your documents..."
                          variant="standard"
                          disabled={loading}
                          InputProps={{ 
                            disableUnderline: true,
                            sx: { color: 'text.primary' }
                          }}
                          sx={{
                            '& .MuiInputBase-input::placeholder': {
                              color: 'text.secondary',
                              opacity: 0.7
                            }
                          }}
                        />
                        <IconButton
                          type="submit"
                          disabled={loading || !query.trim()}
                          sx={{
                            bgcolor: loading || !query.trim() ? 'action.disabledBackground' : 'primary.main',
                            color: '#ffffff',
                            '&:hover': { bgcolor: 'primary.dark' },
                            width: 40,
                            height: 40,
                          }}
                        >
                          <Send fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  </form>
                </Box>
              </Card>
            </Grow>
          </Grid>
        </Grid>
      </Container>

      {/* Dialogs */}
      <Dialog open={noSourcesDialog} onClose={() => setNoSourcesDialog(false)}>
        <DialogTitle>No Sources Selected</DialogTitle>
        <DialogContent>
          <DialogContentText>
            No sources selected. The AI will search across all uploaded documents. Continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoSourcesDialog(false)}>Cancel</Button>
          <Button onClick={() => { setNoSourcesDialog(false); executeQuery(); }} variant="contained">Continue</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={clearDialog} onClose={() => setClearDialog(false)}>
        <DialogTitle>Clear Chat History</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear the entire chat history? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialog(false)}>Cancel</Button>
          <Button onClick={() => { setConversations([]); setClearDialog(false); }} color="error" variant="contained">Clear Chat</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, document: null })}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.document?.filename}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, document: null })} disabled={deleting}>Cancel</Button>
          <Button
            onClick={async () => {
              setDeleting(true);
              try {
                await queryAPI.deleteDocument(deleteDialog.document.id);
                setSelectedDocuments(prev => prev.filter(id => id !== deleteDialog.document.id));
                await fetchDocuments();
                setDeleteDialog({ open: false, document: null });
              } catch (error) {
                console.error('Failed to delete document:', error);
              } finally {
                setDeleting(false);
              }
            }}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={uploadDialog.open} onClose={() => !uploading && setUploadDialog({ open: false, files: [], results: [] })} maxWidth="sm" fullWidth>
        <DialogTitle>{uploading ? 'Processing Documents' : 'Upload Complete'}</DialogTitle>
        <DialogContent>
          {uploading ? (
            <Box>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Indexing documents and preparing citations...
              </Typography>
              {uploadDialog.files.map((file, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Description sx={{ mr: 1, color: 'primary.main' }} />
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
                  icon={result.status === 'success' ? <CheckCircle /> : <Error />}
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

export default QueryInterface;
