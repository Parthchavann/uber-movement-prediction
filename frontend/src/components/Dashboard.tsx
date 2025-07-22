import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Speed,
  TrendingUp,
  TrendingDown,
  Traffic,
  Timeline,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  AccessTime,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import MetricsOverview from './MetricsOverview';
import RealTimeChart from './RealTimeChart';
import TrafficMap from './TrafficMap';

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

interface StatusCardProps {
  apiStatus: string;
  selectedCity: string;
  citiesCount: number;
}

const StatusCard: React.FC<StatusCardProps> = ({ apiStatus, selectedCity, citiesCount }) => {
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

interface City {
  id: string;
  name: string;
  country: string;
  center: [number, number];
  timezone: string;
  segments: number;
  traffic_records: number;
  avg_speed: number;
  rush_hour_impact: number;
  status: string;
}

interface Prediction {
  city: string;
  segment_id: number;
  timestamp: string;
  predicted_speed: number;
  confidence_lower: number;
  confidence_upper: number;
  is_rush_hour: boolean;
  lat: number;
  lon: number;
}

interface DashboardProps {
  selectedCity: string;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedCity }) => {
  const [metrics, setMetrics] = useState({
    avgSpeed: 20.2,
    totalSegments: 600,
    totalRecords: 432000,
    accuracy: 89.2,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [apiStatus, setApiStatus] = useState('checking');

  const API_BASE = 'http://localhost:8001';

  // Load city data from API
  const loadCityData = async () => {
    try {
      const response = await fetch(`${API_BASE}/cities`);
      if (response.ok) {
        const cityData = await response.json();
        setCities(cityData);
        
        // Calculate aggregated metrics
        const totalSegments = cityData.reduce((sum: number, city: City) => sum + city.segments, 0);
        const totalRecords = cityData.reduce((sum: number, city: City) => sum + city.traffic_records, 0);
        const avgSpeed = cityData.reduce((sum: number, city: City) => sum + city.avg_speed, 0) / cityData.length;
        
        setMetrics(prev => ({
          ...prev,
          totalSegments,
          totalRecords,
          avgSpeed: Number(avgSpeed.toFixed(1))
        }));
        
        setApiStatus('healthy');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      console.error('Error loading city data:', error);
      setApiStatus('error');
    }
  };

  // Load predictions data
  const loadPredictions = async () => {
    try {
      const response = await fetch(`${API_BASE}/predictions`);
      if (response.ok) {
        const predData = await response.json();
        setPredictions(predData);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    }
  };

  // Check API health
  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`);
      if (response.ok) {
        setApiStatus('healthy');
        return true;
      } else {
        setApiStatus('error');
        return false;
      }
    } catch (error) {
      setApiStatus('offline');
      return false;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        await loadCityData();
        await loadPredictions();
      }
      setIsLoading(false);
    };
    
    initializeData();
  }, []);

  // Filter data based on selected city
  const getFilteredMetrics = () => {
    if (selectedCity === 'all') {
      return metrics;
    }
    
    const city = cities.find(c => c.id === selectedCity);
    if (city) {
      const cityPredictions = predictions.filter(p => p.city === selectedCity);
      return {
        avgSpeed: city.avg_speed,
        totalSegments: city.segments,
        totalRecords: city.traffic_records,
        accuracy: metrics.accuracy
      };
    }
    
    return metrics;
  };
  
  const filteredMetrics = getFilteredMetrics();

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (apiStatus === 'healthy') {
        await loadPredictions();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [apiStatus]);
  
  // Get city display name
  const getCityDisplayName = () => {
    if (selectedCity === 'all') return 'Multi-City Dashboard';
    const city = cities.find(c => c.id === selectedCity);
    return city ? `${city.name} Dashboard` : 'City Dashboard';
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
            label={`API Status: ${apiStatus === 'healthy' ? 'Online' : apiStatus === 'offline' ? 'Offline' : 'Error'}`}
            color={apiStatus === 'healthy' ? 'success' : apiStatus === 'offline' ? 'warning' : 'error'}
            size="small"
            icon={apiStatus === 'healthy' ? <CheckCircle /> : <Warning />}
          />
          {cities.length > 0 && (
            <Chip
              label={`${cities.length} Cities Active`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Average Speed"
            value={`${filteredMetrics.avgSpeed.toFixed(1)} mph`}
            change={2.4}
            icon={<Speed />}
            color="primary"
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title={selectedCity === 'all' ? 'Total Segments' : 'Road Segments'}
            value={filteredMetrics.totalSegments.toLocaleString()}
            change={-1.2}
            icon={<Traffic />}
            color="secondary"
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Traffic Records"
            value={filteredMetrics.totalRecords > 1000 ? `${(filteredMetrics.totalRecords/1000).toFixed(0)}K` : filteredMetrics.totalRecords.toLocaleString()}
            change={15.8}
            icon={<Timeline />}
            color="success"
            isLoading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Model Accuracy"
            value={`${filteredMetrics.accuracy.toFixed(1)}%`}
            change={0.3}
            icon={<TrendingUp />}
            color="info"
            isLoading={isLoading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <RealTimeChart />
          </motion.div>
        </Grid>
        <Grid item xs={12} lg={4}>
          <StatusCard 
            apiStatus={apiStatus}
            selectedCity={selectedCity}
            citiesCount={cities.length}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <TrafficMap />
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default Dashboard;