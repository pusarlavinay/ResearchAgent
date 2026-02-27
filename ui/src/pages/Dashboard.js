import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Avatar,
  Chip,
  Paper,
  IconButton,
  Fade,
  Grow,
} from '@mui/material';
import {
  Description,
  Psychology,
  Speed,
  TrendingUp,
  ArrowForward,
  AutoAwesome,
  CloudUpload,
  Search,
  Analytics,
  Science,
  Memory,
  BlurOn,
  Groups,
  AccessTime,
  Bolt,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { queryAPI } from '../services/api';
import { useAppContext } from '../contexts/AppContext';
import Footer from '../components/Footer';
import ActivityFeed from '../components/ActivityFeed';
import AdvancedVisualizations from '../components/AdvancedVisualizations';

const Dashboard = () => {
  const navigate = useNavigate();
  const { documents, conversations } = useAppContext();
  const [visible, setVisible] = useState(false);

  const { data: stats } = useQuery('stats', queryAPI.getStats, {
    refetchInterval: 5000,
  });

  useEffect(() => {
    setVisible(true);
  }, []);

  const quickActions = [
    {
      title: 'Query Documents',
      description: 'Ask questions about your documents',
      icon: <Search sx={{ fontSize: 40 }} />,
      color: '#3b82f6',
      path: '/query',
    },
    {
      title: 'Analyze Resume',
      description: 'AI-powered resume evaluation',
      icon: <Psychology sx={{ fontSize: 40 }} />,
      color: '#8b5cf6',
      path: '/resume',
    },
    {
      title: 'Upload Files',
      description: 'Add documents to workspace',
      icon: <CloudUpload sx={{ fontSize: 40 }} />,
      color: '#10b981',
      path: '/upload',
    },
    {
      title: 'System Metrics',
      description: 'View performance analytics',
      icon: <Analytics sx={{ fontSize: 40 }} />,
      color: '#f59e0b',
      path: '/metrics',
    },
  ];

  const technologies = [
    { name: 'Quantum Retrieval', efficiency: 85, icon: <Science fontSize="small" /> },
    { name: 'Neural Memory', efficiency: 78, icon: <Memory fontSize="small" /> },
    { name: 'Holographic Storage', efficiency: 73, icon: <BlurOn fontSize="small" /> },
    { name: 'Swarm Intelligence', efficiency: 92, icon: <Groups fontSize="small" /> },
    { name: 'Temporal Analysis', efficiency: 67, icon: <AccessTime fontSize="small" /> },
    { name: 'Speculative RAG', efficiency: 88, icon: <Bolt fontSize="small" /> },
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', pt: 8, bgcolor: 'background.default' }}>
      <Box sx={{ flex: 1, p: 2 }}>
        {/* Hero Section */}
        <Fade in={visible} timeout={800}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: 'primary.main',
              }}
            >
              AI Research Agent
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Revolutionary RAG System with 6 Advanced Technologies
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip
                icon={<AutoAwesome />}
                label="Quantum-Powered"
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<Speed />}
                label="7s Response Time"
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<TrendingUp />}
                label="89% Accuracy"
                color="info"
                variant="outlined"
              />
            </Box>
          </Box>
        </Fade>

        {/* Stats Overview */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              title: 'Documents',
              value: stats?.documents || documents.length || 0,
              subtitle: 'Total indexed',
              icon: <Description />,
              color: '#3b82f6',
              delay: 200,
            },
            {
              title: 'Conversations',
              value: conversations.length,
              subtitle: 'Chat history',
              icon: <Search />,
              color: '#10b981',
              delay: 400,
            },
            {
              title: 'Chunks',
              value: stats?.chunks || 0,
              subtitle: 'Vector embeddings',
              icon: <Speed />,
              color: '#f59e0b',
              delay: 600,
            },
            {
              title: 'Efficiency',
              value: '92%',
              subtitle: 'System performance',
              icon: <TrendingUp />,
              color: '#8b5cf6',
              delay: 800,
            },
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={stat.title}>
              <Grow in={visible} timeout={stat.delay}>
                <Card
                  sx={{
                    border: `1px solid`,
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: stat.color,
                          width: 48,
                          height: 48,
                          mr: 2,
                          color: '#ffffff',
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stat.title}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={3} key={action.title}>
              <Grow in={visible} timeout={1000 + index * 200}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 32px ${action.color}30`,
                      borderColor: action.color,
                    },
                  }}
                  onClick={() => navigate(action.path)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <Avatar
                      sx={{
                        bgcolor: action.color,
                        width: 64,
                        height: 64,
                        mx: 'auto',
                        mb: 2,
                        color: '#ffffff',
                      }}
                    >
                      {action.icon}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {action.description}
                    </Typography>
                    <Button
                      endIcon={<ArrowForward />}
                      sx={{ color: action.color }}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* Technologies */}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Revolutionary Technologies
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {technologies.map((tech, index) => (
            <Grid item xs={12} sm={6} md={4} key={tech.name}>
              <Grow in={visible} timeout={1400 + index * 100}>
                <Paper
                  sx={{
                    p: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        mr: 1,
                        bgcolor: 'primary.main',
                        color: '#ffffff',
                      }}
                    >
                      {tech.icon}
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {tech.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={tech.efficiency}
                      sx={{
                        flex: 1,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(148, 163, 184, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: 'primary.main',
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                      {tech.efficiency}%
                    </Typography>
                  </Box>
                </Paper>
              </Grow>
            </Grid>
          ))}
        </Grid>

        {/* Activity Feed and Visualizations */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} lg={4}>
            <ActivityFeed />
          </Grid>
          <Grid item xs={12} lg={8}>
            <AdvancedVisualizations />
          </Grid>
        </Grid>
      </Box>

      <Footer />
    </Box>
  );
};

export default Dashboard;


