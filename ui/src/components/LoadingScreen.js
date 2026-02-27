import React from 'react';
import { Box, Typography, LinearProgress, Fade } from '@mui/material';

const LoadingScreen = () => {
  const technologies = [
    'Quantum Retrieval',
    'Neural Memory',
    'Holographic Storage',
    'Swarm Intelligence',
    'Temporal Analysis',
    'Speculative Processing',
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Fade in timeout={500}>
        <Box sx={{ textAlign: 'center', maxWidth: 500, px: 3 }}>
          {/* Logo/Brand */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h2"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                mb: 1,
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              Research Agent
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              Document Intelligence Platform
            </Typography>
          </Box>

          {/* Loading Progress */}
          <Box sx={{ mb: 4, width: '100%' }}>
            <LinearProgress
              sx={{
                height: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(148, 163, 184, 0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'primary.main',
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {/* Technology List */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Initializing AI Technologies
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {technologies.map((tech, index) => (
                <Box
                  key={tech}
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    backgroundColor: 'rgba(148, 163, 184, 0.1)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    animation: `fadeInUp 0.5s ease ${index * 0.1}s both`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {tech}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Status */}
          <Typography variant="body2" color="text.secondary">
            Loading workspace...
          </Typography>
        </Box>
      </Fade>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Box>
  );
};

export default LoadingScreen;