import React from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent, useTheme } from '@mui/material';
import { useQuery } from 'react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  ResponsiveContainer,
} from 'recharts';
import {
  Description,
  DataUsage,
  AutoGraph,
  GroupWork,
  Storage,
  Memory,
  Verified,
} from '@mui/icons-material';
import { queryAPI } from '../services/api';
import Footer from '../components/Footer';

const SystemMetrics = () => {
  const theme = useTheme();
  
  const { data: stats } = useQuery('stats', queryAPI.getStats, {
    refetchInterval: 5000,
  });

  const { data: quantumData } = useQuery('quantum', queryAPI.getQuantumCoherence, {
    refetchInterval: 3000,
  });

  const { data: swarmData } = useQuery('swarm', queryAPI.getSwarmStatistics, {
    refetchInterval: 3000,
  });

  const { data: holographicData } = useQuery('holographic', queryAPI.getHolographicEfficiency, {
    refetchInterval: 5000,
  });

  const { data: neuromorphicData } = useQuery('neuromorphic', queryAPI.getNeuromorphicMemory, {
    refetchInterval: 5000,
  });

  const performanceData = [
    { name: 'Retrieval', efficiency: quantumData ? Math.round(quantumData.coherence_threshold * 100) : 85, color: theme.palette.primary.main },
    { name: 'Memory', efficiency: neuromorphicData?.synaptic_weights ? Math.min(100, neuromorphicData.synaptic_weights) : 78, color: theme.palette.success.main },
    { name: 'Storage', efficiency: holographicData?.hologram_density != null ? Math.round(holographicData.hologram_density) : 73, color: theme.palette.warning.main },
    { name: 'Consensus', efficiency: swarmData?.consensus_threshold ? Math.round(swarmData.consensus_threshold * 100) : 92, color: theme.palette.primary.light },
    { name: 'Timeline', efficiency: 67, color: theme.palette.info?.main || '#38bdf8' },
    { name: 'Verification', efficiency: 88, color: theme.palette.error.main },
  ];

  const MetricCard = ({ title, value, subtitle, color, icon }) => (
    <Card
      sx={{
        background: `linear-gradient(45deg, ${color}20, ${color}10)`,
        border: `1px solid ${color}40`,
        height: '100%',
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Box sx={{ color: color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
          <Typography variant="h6" sx={{ color: color, fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ color: color, fontWeight: 'bold' }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ pt: 8, minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box sx={{ flex: 1, p: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>
        System Metrics
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Documents"
            value={stats?.documents ?? 'Loading...'}
            subtitle="Total processed"
            color={theme.palette.success.main}
            icon={<Description fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Chunks"
            value={stats?.chunks ?? 'Loading...'}
            subtitle="Vector embeddings"
            color={theme.palette.primary.main}
            icon={<DataUsage fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Retrieval Quality"
            value={quantumData ? `${Math.round(quantumData.coherence_threshold * 100)}%` : 'Loading...'}
            subtitle="Signal stability"
            color={theme.palette.primary.main}
            icon={<AutoGraph fontSize="small" />}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard
            title="Active Agents"
            value={swarmData?.total_agents ?? 'Loading...'}
            subtitle="Consensus network"
            color={theme.palette.warning.main}
            icon={<GroupWork fontSize="small" />}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, mb: 2 }}>
              Service Performance
            </Typography>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper, 
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8
                    }} 
                  />
                  <Bar dataKey="efficiency" fill={theme.palette.primary.main} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
                <Typography variant="body2" color="text.secondary">Loading performance data...</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.warning.main, mb: 2 }}>
              Agent Distribution
            </Typography>
            {swarmData ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Explorer',
                        value: swarmData.specialization_distribution?.explorer || 20,
                        fill: theme.palette.primary.main,
                      },
                      {
                        name: 'Exploiter',
                        value: swarmData.specialization_distribution?.exploiter || 20,
                        fill: theme.palette.success.main,
                      },
                      {
                        name: 'Scout',
                        value: swarmData.specialization_distribution?.scout || 10,
                        fill: theme.palette.warning.main,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper, 
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 320 }}>
                <Typography variant="body2" color="text.secondary">Loading agent data...</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.success.main }}>
              Memory System
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Synaptic Weights</Typography>
                <Typography variant="h5" sx={{ color: theme.palette.success.main }}>
                  {neuromorphicData?.synaptic_weights ?? 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Associations</Typography>
                <Typography variant="h5" sx={{ color: theme.palette.success.main }}>
                  {neuromorphicData?.associations ?? 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Decay Rate</Typography>
                <Typography variant="h5" sx={{ color: theme.palette.success.main }}>
                  {neuromorphicData?.decay_rate ?? 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Plasticity Window</Typography>
                <Typography variant="h5" sx={{ color: theme.palette.success.main }}>
                  {neuromorphicData?.plasticity_window ?? 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
              Storage System
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Documents Stored</Typography>
                <Typography variant="h5" sx={{ color: theme.palette.primary.main }}>
                  {holographicData?.documents_stored ?? 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Matrix Size</Typography>
                <Typography variant="h5" sx={{ color: theme.palette.primary.main }}>
                  {holographicData?.matrix_size_mb ? `${holographicData.matrix_size_mb}MB` : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Compression Ratio</Typography>
                <Typography variant="h5" sx={{ color: theme.palette.primary.main }}>
                  {holographicData?.compression_ratio ? `${holographicData.compression_ratio}:1` : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Hologram Density</Typography>
                <Typography variant="h5" sx={{ color: theme.palette.primary.main }}>
                  {holographicData?.hologram_density != null ? `${holographicData.hologram_density}%` : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3, 
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(45deg, #171b22, #1f2430)' 
                : 'linear-gradient(45deg, #f8fafc, #e2e8f0)',
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
              System Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <Box textAlign="center">
                  <AutoGraph fontSize="large" sx={{ color: quantumData ? theme.palette.success.main : theme.palette.grey[500] }} />
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {quantumData ? 'Retrieval Active' : 'Retrieval Offline'}
                  </Typography>
                  {quantumData && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {Math.round(quantumData.coherence_threshold * 100)}%
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box textAlign="center">
                  <Memory fontSize="large" sx={{ color: neuromorphicData ? theme.palette.success.main : theme.palette.grey[500] }} />
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {neuromorphicData ? 'Memory Learning' : 'Memory Offline'}
                  </Typography>
                  {neuromorphicData && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {neuromorphicData.synaptic_weights} weights
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box textAlign="center">
                  <Storage fontSize="large" sx={{ color: holographicData ? theme.palette.success.main : theme.palette.grey[500] }} />
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {holographicData ? 'Storage Ready' : 'Storage Offline'}
                  </Typography>
                  {holographicData && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {holographicData.documents_stored} docs
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box textAlign="center">
                  <GroupWork fontSize="large" sx={{ color: swarmData ? theme.palette.success.main : theme.palette.grey[500] }} />
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {swarmData ? 'Agents Online' : 'Agents Offline'}
                  </Typography>
                  {swarmData && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {swarmData.total_agents} active
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box textAlign="center">
                  <AutoGraph fontSize="large" sx={{ color: stats ? theme.palette.success.main : theme.palette.grey[500] }} />
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {stats ? 'Timeline Signals' : 'Timeline Offline'}
                  </Typography>
                  {stats && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {stats.chunks} chunks
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box textAlign="center">
                  <Verified fontSize="large" sx={{ color: stats ? theme.palette.success.main : theme.palette.grey[500] }} />
                  <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {stats ? 'Verification Ready' : 'Verification Offline'}
                  </Typography>
                  {stats && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {stats.documents} verified
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
      </Box>
      <Footer />
    </Box>
  );
};

export default SystemMetrics;
