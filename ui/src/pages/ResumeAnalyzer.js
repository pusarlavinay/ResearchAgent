import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Psychology,
  TrendingUp,
  Warning,
  CheckCircle,
  School,
  Work,
  Star,
  Lightbulb,
} from '@mui/icons-material';
import api from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import Footer from '../components/Footer';

const ResumeAnalyzer = () => {
  const { resumeData, setResumeData } = useAppContext();
  const fileInputRef = useRef(null);

  const updateResumeData = (updates) => {
    setResumeData(prev => ({ ...prev, ...updates }));
  };

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      updateResumeData({ resume: file });
    } else {
      alert('Please upload a PDF file');
    }
  };

  const analyzeResume = async () => {
    if (!resumeData.resume || !resumeData.jobDescription.trim()) {
      alert('Please upload a resume and enter job description');
      return;
    }

    updateResumeData({ loading: true });
    try {
      const formData = new FormData();
      formData.append('file', resumeData.resume);
      formData.append('job_description', resumeData.jobDescription);

      const response = await api.post('/analyze-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000,
      });

      updateResumeData({ analysis: response.data, loading: false });
    } catch (error) {
      console.error('Analysis failed:', error);
      alert(`Analysis failed: ${error.response?.data?.detail || error.message}`);
      updateResumeData({ loading: false });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', pt: 8, bgcolor: 'background.default' }}>
      <Box sx={{ flex: 1, p: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>
          Resume Analyzer
        </Typography>

        <Grid container spacing={2}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description color="primary" />
                  Upload Resume
                </Typography>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleResumeUpload}
                  accept=".pdf"
                  style={{ display: 'none' }}
                />
                
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => fileInputRef.current?.click()}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Choose PDF File
                </Button>
                
                {resumeData.resume && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      {resumeData.resume.name} uploaded successfully
                    </Typography>
                  </Alert>
                )}
                
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Job Description"
                  placeholder="Paste the job description here..."
                  value={resumeData.jobDescription}
                  onChange={(e) => updateResumeData({ jobDescription: e.target.value })}
                  variant="outlined"
                  sx={{ flex: 1, mb: 2 }}
                />
                
                <Button
                  variant="contained"
                  onClick={analyzeResume}
                  disabled={resumeData.loading || !resumeData.resume || !resumeData.jobDescription.trim()}
                  fullWidth
                >
                  {resumeData.loading ? 'Analyzing...' : 'Analyze Resume'}
                </Button>
                
                {resumeData.loading && <LinearProgress sx={{ mt: 2 }} />}
              </CardContent>
            </Card>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            {resumeData.analysis ? (
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Psychology color="primary" />
                    Analysis Results
                  </Typography>
                  
                  {/* Overall Score */}
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: `${getScoreColor(resumeData.analysis.overall_score || resumeData.analysis.overallScore)}.main`,
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        mx: 'auto',
                        mb: 1,
                      }}
                    >
                      {resumeData.analysis.overall_score || resumeData.analysis.overallScore}%
                    </Avatar>
                    <Typography variant="h6">Overall Match Score</Typography>
                    {resumeData.analysis.analysis_summary && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {resumeData.analysis.analysis_summary}
                      </Typography>
                    )}
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Matched Skills */}
                  <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" fontSize="small" />
                    Matched Skills
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {(resumeData.analysis.matched_skills || resumeData.analysis.matchedSkills || []).map((skillObj, index) => (
                      <Chip
                        key={index}
                        label={typeof skillObj === 'object' ? `${skillObj.skill} (${skillObj.confidence}%)` : skillObj}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                  
                  {/* Missing Skills */}
                  <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="warning" fontSize="small" />
                    Missing Skills
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {(resumeData.analysis.missing_skills || resumeData.analysis.missingSkills || []).map((skillObj, index) => (
                      <Chip
                        key={index}
                        label={typeof skillObj === 'object' ? `${skillObj.skill} (${skillObj.importance})` : skillObj}
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 6, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Psychology sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Ready to Analyze
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload your resume and job description to get started
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Detailed Analysis */}
          {resumeData.analysis && (
            <>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp color="success" />
                      Strengths
                    </Typography>
                    <List dense sx={{ flex: 1, overflow: 'auto' }}>
                      {(resumeData.analysis.strengths || []).map((strengthObj, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Star color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={strengthObj.strength || strengthObj}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Warning color="warning" />
                      Areas for Improvement
                    </Typography>
                    <List dense sx={{ flex: 1, overflow: 'auto' }}>
                      {(resumeData.analysis.weaknesses || resumeData.analysis.skillGaps || []).map((weaknessObj, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Warning color="warning" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={weaknessObj.weakness || weaknessObj}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Lightbulb color="info" />
                      Recommendations
                    </Typography>
                    <List dense sx={{ flex: 1, overflow: 'auto' }}>
                      {(resumeData.analysis.recommendations || []).map((recObj, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Lightbulb color="info" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={recObj.recommendation || recObj}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
      
      <Footer />
    </Box>
  );
};

export default ResumeAnalyzer;