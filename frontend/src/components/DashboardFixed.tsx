import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Speed,
  TrendingUp,
  TrendingDown,
  Traffic,
  Timeline,
  Refresh,
  Warning,
  CheckCircle,
  AccessTime,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import MetricsOverview from './MetricsOverview';
import RealTimeChart from './RealTimeChart';
import TrafficMap from './TrafficMapFixed';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  isLoading = false,
}) => {
  const theme = useTheme();
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card
        sx={{
          height: '100%',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, rgba(26, 29, 58, 0.9), rgba(26, 29, 58, 0.7))'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
          border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 12px 40px ${alpha(theme.palette[color].main, 0.15)}`,
            border: `1px solid ${alpha(theme.palette[color].main, 0.4)}`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                background: alpha(theme.palette[color].main, 0.1),
                color: theme.palette[color].main,
              }}
            >
              {icon}
            </Box>
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <Refresh sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: `linear-gradient(45deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {isLoading ? (
              <Box sx={{ width: '60%', height: 32 }}>
                <LinearProgress />
              </Box>
            ) : (
              value
            )}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip
              icon={isPositive ? <TrendingUp /> : <TrendingDown />}
              label={`${isPositive ? '+' : ''}${change}%`}
              color={isPositive ? 'success' : 'error'}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem', fontWeight: 500 }}
            />
            <Typography variant="caption" color="text.secondary">
              vs last hour
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StatusCard: React.FC<{
  apiStatus: string;
  selectedCity: string;
  citiesCount: number;
}> = ({ apiStatus, selectedCity, citiesCount }) => {
  const theme = useTheme();
  
  const statusItems = [
    { 
      label: 'API Status', 
      status: apiStatus === 'healthy' ? 'online' : apiStatus === 'offline' ? 'offline' : 'error', 
      icon: apiStatus === 'healthy' ? <CheckCircle /> : <Warning />, 
      color: apiStatus === 'healthy' ? 'success' : apiStatus === 'offline' ? 'warning' : 'error' 
    },
    { label: 'LSTM Model', status: 'active', icon: <CheckCircle />, color: 'success' },
    { label: 'GNN Model', status: 'active', icon: <CheckCircle />, color: 'success' },
    { 
      label: selectedCity === 'all' ? 'Multi-City Data' : 'City Data', 
      status: `${selectedCity === 'all' ? citiesCount : 1} active`, 
      icon: <CheckCircle />, 
      color: 'success' 
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card sx={{ height: '100%' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            System Status
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {statusItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: `${item.color}.main` }}>
                      {item.icon}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Chip
                    label={item.status}
                    color={item.color as any}
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'capitalize', fontSize: '0.75rem' }}
                  />
                </Box>
              </motion.div>
            ))}
          </Box>
          
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              background: alpha(theme.palette.info.main, 0.05),
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AccessTime sx={{ fontSize: 16, color: 'info.main' }} />
              <Typography variant="caption" sx={{ fontWeight: 500, color: 'info.main' }}>
                Last Updated
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {new Date().toLocaleString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface DashboardProps {
  selectedCity?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedCity = "san_francisco" }) => {
  const [metrics] = useState({
    avgSpeed: 20.2,
    totalSegments: 600,
    totalRecords: 432000,
    accuracy: 89.2,
  });

  const [isLoading] = useState(false);
  const [apiStatus] = useState('healthy');
  const citiesCount = 3;

  // Get city display name
  const getCityDisplayName = () => {
    if (selectedCity === 'all') return 'Multi-City Dashboard';
    if (selectedCity === 'san_francisco') return 'San Francisco Dashboard';
    if (selectedCity === 'new_york') return 'New York Dashboard';
    if (selectedCity === 'london') return 'London Dashboard';
    return 'City Dashboard';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {getCityDisplayName()}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {selectedCity === 'all' 
            ? 'Multi-city traffic prediction across San Francisco, New York, and London'
            : 'Real-time traffic analytics and AI-powered forecasting'
          }
        </Typography>
        
        {/* API Status Indicator */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label="API Status: Online"
            color="success"
            size="small"
            icon={<CheckCircle />}
          />
          <Chip
            label={`${citiesCount} Cities Active`}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Metric Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)' 
        }, 
        gap: 3, 
        mb: 4 
      }}>
        <MetricCard
          title="Average Speed"
          value={`${metrics.avgSpeed.toFixed(1)} mph`}
          change={2.4}
          icon={<Speed />}
          color="primary"
          isLoading={isLoading}
        />
        <MetricCard
          title={selectedCity === 'all' ? 'Total Segments' : 'Road Segments'}
          value={metrics.totalSegments.toLocaleString()}
          change={-1.2}
          icon={<Traffic />}
          color="secondary"
          isLoading={isLoading}
        />
        <MetricCard
          title="Traffic Records"
          value={`${(metrics.totalRecords/1000).toFixed(0)}K`}
          change={15.8}
          icon={<Timeline />}
          color="success"
          isLoading={isLoading}
        />
        <MetricCard
          title="Model Accuracy"
          value={`${metrics.accuracy.toFixed(1)}%`}
          change={0.3}
          icon={<TrendingUp />}
          color="info"
          isLoading={isLoading}
        />
      </Box>

      {/* Chart and Status */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        gap: 3,
        mb: 3
      }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <RealTimeChart />
        </motion.div>
        <StatusCard 
          apiStatus={apiStatus}
          selectedCity={selectedCity}
          citiesCount={citiesCount}
        />
      </Box>

      {/* Traffic Map */}
      <Box>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <TrafficMap selectedCity={selectedCity} />
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default Dashboard;