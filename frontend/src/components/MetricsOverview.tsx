import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Speed,
  Traffic,
  Timeline,
  TrendingUp,
  TrendingDown,
  AccessTime,
  LocationOn,
  ModelTraining,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface MetricItemProps {
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

const MetricItem: React.FC<MetricItemProps> = ({
  label,
  value,
  change,
  unit,
  color = 'primary',
}) => {
  const theme = useTheme();
  const hasChange = change !== undefined;
  const isPositive = change ? change > 0 : false;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 500 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: `${color}.main`,
          }}
        >
          {value}
        </Typography>
        {unit && (
          <Typography variant="body2" color="text.secondary">
            {unit}
          </Typography>
        )}
      </Box>
      {hasChange && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          {isPositive ? (
            <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
          ) : (
            <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
          )}
          <Typography
            variant="caption"
            sx={{
              color: isPositive ? 'success.main' : 'error.main',
              fontWeight: 500,
            }}
          >
            {isPositive ? '+' : ''}{change}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            vs last hour
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const ProgressMetric: React.FC<{
  label: string;
  value: number;
  max: number;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}> = ({ label, value, max, color }) => {
  const percentage = (value / max) * 100;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {value}/{max}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={color}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: alpha(color === 'primary' ? '#1976d2' : '#ff9800', 0.1),
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {percentage.toFixed(1)}% utilization
      </Typography>
    </Box>
  );
};

const MetricsOverview: React.FC = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({
    realTimeSpeed: 23.4,
    avgDailySpeed: 25.8,
    peakHourSpeed: 18.2,
    offPeakSpeed: 28.6,
    totalPredictions: 1284,
    activeSegments: 156,
    modelAccuracy: 89.2,
    responseTime: 45,
    dataPoints: 25600,
    lastUpdate: new Date(),
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        realTimeSpeed: Math.max(5, Math.min(50, prev.realTimeSpeed + (Math.random() - 0.5) * 3)),
        totalPredictions: prev.totalPredictions + Math.floor(Math.random() * 15),
        responseTime: Math.max(20, Math.min(100, prev.responseTime + (Math.random() - 0.5) * 10)),
        lastUpdate: new Date(),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Real-time Metrics
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Last updated: {metrics.lastUpdate.toLocaleTimeString()}
              </Typography>
              <Chip label="Live" color="success" size="small" variant="outlined" />
            </Box>
          </Box>

          <Divider />

          <Grid container>
            <Grid item xs={12} sm={6} md={4}>
              <MetricItem
                label="Current Avg Speed"
                value={metrics.realTimeSpeed.toFixed(1)}
                unit="mph"
                change={2.3}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricItem
                label="Daily Average"
                value={metrics.avgDailySpeed.toFixed(1)}
                unit="mph"
                change={-1.8}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricItem
                label="Peak Hour Speed"
                value={metrics.peakHourSpeed.toFixed(1)}
                unit="mph"
                change={-4.2}
                color="warning"
              />
            </Grid>
          </Grid>

          <Divider />

          <Grid container>
            <Grid item xs={12} sm={6} md={4}>
              <MetricItem
                label="Predictions Made"
                value={metrics.totalPredictions.toLocaleString()}
                change={15.6}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricItem
                label="Active Segments"
                value={metrics.activeSegments}
                change={0.6}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricItem
                label="Response Time"
                value={metrics.responseTime.toFixed(0)}
                unit="ms"
                change={-8.4}
                color="primary"
              />
            </Grid>
          </Grid>

          <Divider />

          <Grid container>
            <Grid item xs={12} md={6}>
              <ProgressMetric
                label="Model Accuracy"
                value={89}
                max={100}
                color="success"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ProgressMetric
                label="System Load"
                value={67}
                max={100}
                color="warning"
              />
            </Grid>
          </Grid>

          <Divider />

          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Model Performance
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: alpha(theme.palette.primary.main, 0.05) }}>
                  <ModelTraining sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    LSTM
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    MAE: 3.2 mph
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, background: alpha(theme.palette.secondary.main, 0.05) }}>
                  <LocationOn sx={{ fontSize: 32, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                    GNN
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    MAE: 2.9 mph
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricsOverview;