import React, { useMemo } from 'react';
import {
  Paper,
  Box,
  Typography,
  Grid,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useAppContext } from '../contexts/AppContext';

const AdvancedVisualizations = () => {
  const theme = useTheme();
  const { conversations, documents } = useAppContext();

  // Confidence distribution data
  const confidenceData = useMemo(() => {
    const ranges = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 };
    conversations.forEach(conv => {
      if (conv.type === 'ai' && conv.confidence) {
        const conf = conv.confidence * 100;
        if (conf <= 20) ranges['0-20']++;
        else if (conf <= 40) ranges['20-40']++;
        else if (conf <= 60) ranges['40-60']++;
        else if (conf <= 80) ranges['60-80']++;
        else ranges['80-100']++;
      }
    });
    return Object.entries(ranges).map(([range, count]) => ({ range, count }));
  }, [conversations]);

  // Response time trend
  const responseTimeData = useMemo(() => {
    return conversations
      .filter(c => c.type === 'ai' && c.responseTime)
      .slice(-10)
      .map((c, idx) => ({
        query: `Q${idx + 1}`,
        time: (c.responseTime / 1000).toFixed(2),
      }));
  }, [conversations]);

  // Document type distribution
  const documentTypeData = useMemo(() => {
    const types = {};
    documents.forEach(doc => {
      const ext = doc.filename.split('.').pop().toUpperCase();
      types[ext] = (types[ext] || 0) + 1;
    });
    return Object.entries(types).map(([type, count]) => ({ type, count }));
  }, [documents]);

  // Activity over time
  const activityData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        queries: 0,
        uploads: 0,
      };
    });

    conversations.forEach(conv => {
      const convDate = new Date(conv.timestamp);
      const dayIndex = Math.floor((new Date() - convDate) / (1000 * 60 * 60 * 24));
      if (dayIndex < 7 && conv.type === 'user') {
        last7Days[6 - dayIndex].queries++;
      }
    });

    documents.forEach(doc => {
      const docDate = new Date(doc.created_at);
      const dayIndex = Math.floor((new Date() - docDate) / (1000 * 60 * 60 * 24));
      if (dayIndex < 7) {
        last7Days[6 - dayIndex].uploads++;
      }
    });

    return last7Days;
  }, [conversations, documents]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Data Insights
      </Typography>

      <Grid container spacing={3}>
        {/* Confidence Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Confidence Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={theme.palette.primary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Document Types */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Document Types
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={documentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {documentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Response Time Trend */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Response Time Trend
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="query" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="time"
                  stroke={theme.palette.success.main}
                  strokeWidth={2}
                  name="Time (seconds)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Activity Over Time */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              7-Day Activity
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="queries"
                  stackId="1"
                  stroke={theme.palette.primary.main}
                  fill={theme.palette.primary.main}
                />
                <Area
                  type="monotone"
                  dataKey="uploads"
                  stackId="1"
                  stroke={theme.palette.success.main}
                  fill={theme.palette.success.main}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdvancedVisualizations;
