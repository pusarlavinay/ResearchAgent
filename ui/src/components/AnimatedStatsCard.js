import React, { useState, useEffect } from 'react';
import { Card, CardContent, Box, Typography, Avatar, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const AnimatedStatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color, 
  trend, 
  trendValue,
  progress,
  delay = 0 
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!visible || typeof value !== 'number') return;

    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, visible]);

  return (
    <Card
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: color, mb: 0.5 }}>
              {typeof value === 'number' ? displayValue : value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Avatar
            sx={{
              bgcolor: color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Box>

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            {trend === 'up' ? (
              <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend === 'up' ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {trendValue}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs last period
            </Typography>
          </Box>
        )}

        {progress !== undefined && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(148, 163, 184, 0.2)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: color,
                },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AnimatedStatsCard;
