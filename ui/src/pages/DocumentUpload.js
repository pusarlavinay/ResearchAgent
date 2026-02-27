import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import { CloudUpload, Description, CheckCircle, Error } from '@mui/icons-material';
import { queryAPI } from '../services/api';
import Footer from '../components/Footer';

const DocumentUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFiles = useCallback((selectedFiles) => {
    setFiles(selectedFiles);
    setUploadResults([]);
  }, []);

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragActive(false);
    const droppedFiles = Array.from(event.dataTransfer.files || []);
    handleFiles(droppedFiles);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const results = [];

    for (const file of files) {
      try {
        const result = await queryAPI.uploadDocument(file);
        results.push({
          filename: file.name,
          status: 'success',
          message: result.message,
          documentId: result.document_id,
        });
      } catch (error) {
        results.push({
          filename: file.name,
          status: 'error',
          message: error.response?.data?.detail || error.message,
        });
      }
    }

    setUploadResults(results);
    setUploading(false);
  };

  return (
    <Box sx={{ pt: 8, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', mb: 4 }}>
        Document Upload
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
          Add documents to your workspace
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload PDFs, Word documents, or text files. Each document is indexed for retrieval
          and citation.
        </Typography>

        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'primary.main',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            mb: 3,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: isDragActive ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
            },
          }}
          onClick={() => document.getElementById('file-input').click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag files here or click to browse
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported formats: PDF, DOCX, TXT
          </Typography>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </Box>

        {files.length > 0 && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Selected files ({files.length})
            </Typography>
            <List>
              {files.map((file, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Description />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  />
                  <Chip label={file.type || 'Unknown'} size="small" color="primary" />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          {uploading ? 'Processing...' : 'Upload & Index'}
        </Button>

        {uploading && (
          <Box mt={2}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Indexing documents and preparing citations...
            </Typography>
          </Box>
        )}
      </Paper>

      {uploadResults.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Processing results
          </Typography>
          {uploadResults.map((result, index) => (
            <Alert
              key={index}
              severity={result.status === 'success' ? 'success' : 'error'}
              icon={result.status === 'success' ? <CheckCircle /> : <Error />}
              sx={{ mb: 2 }}
            >
              <Typography variant="subtitle2">{result.filename}</Typography>
              <Typography variant="body2">{result.message}</Typography>
              {result.documentId && (
                <Typography variant="caption" color="text.secondary">
                  Document ID: {result.documentId}
                </Typography>
              )}
            </Alert>
          ))}
        </Paper>
      )}
      </Box>
      <Footer />
    </Box>
  );
};

export default DocumentUpload;
