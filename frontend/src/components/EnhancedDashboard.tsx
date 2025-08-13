import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Avatar,
  Tooltip,
  Badge,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Drawer,
  useTheme,
  alpha,
  LinearProgress,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Speed,
  Timeline,
  Map,
  Analytics,
  Settings,
  Refresh,
  FilterList,
  Search,
  NotificationsActive,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  PlayArrow,
  Pause,
  Fullscreen,
  Download,
  Share,
  Brightness4,
  Brightness7,
  CloudSync,
  ModelTraining,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ScatterChart,
  Scatter,
} from 'recharts';

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

interface Metrics {
  totalPredictions: number;
  accuracy: number;
  avgResponseTime: number;
  activeSegments: number;
  citiesMonitored: number;
  lastUpdated: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff7f', '#dc143c'];

const EnhancedDashboard: React.FC = () => {
  const theme = useTheme();
  const [darkMode, setDarkMode] = useState(false);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [viewMode, setViewMode] = useState('overview');
  
  // Data states
  const [cities, setCities] = useState<City[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<'healthy' | 'error' | 'offline'>('offline');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const API_BASE = 'http://localhost:8002';

  // Enhanced API calls with error handling and caching
  const fetchWithRetry = async (url: string, retries = 3): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return await response.json();
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Parallel API calls for better performance
      const [
        citiesData,
        predictionsData,
        metricsData,
        historicalDataResponse,
        realtimeData
      ] = await Promise.allSettled([
        fetchWithRetry(`${API_BASE}/cities`),
        fetchWithRetry(`${API_BASE}/predictions?limit=100`),
        fetchWithRetry(`${API_BASE}/analytics/metrics`),
        fetchWithRetry(`${API_BASE}/analytics/historical?hours=24`),
        fetchWithRetry(`${API_BASE}/traffic/realtime`)
      ]);

      // Process results
      if (citiesData.status === 'fulfilled') {
        setCities(citiesData.value);
      }
      
      if (predictionsData.status === 'fulfilled') {
        setPredictions(predictionsData.value);
      }
      
      if (metricsData.status === 'fulfilled') {
        setMetrics(metricsData.value);
      }
      
      if (historicalDataResponse.status === 'fulfilled') {
        setHistoricalData(historicalDataResponse.value);
      }
      
      if (realtimeData.status === 'fulfilled') {
        setRealTimeData(realtimeData.value.slice(0, 30)); // Limit for performance
      }

      setApiStatus('healthy');
      
      // Add success notification
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        message: 'Data refreshed successfully',
        timestamp: new Date().toISOString()
      }]);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setApiStatus('error');
      
      // Add error notification
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: 'Failed to load data from API',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE]);

  // Real-time updates
  useEffect(() => {
    loadAllData();
    
    const interval = setInterval(() => {
      if (realTimeMode && apiStatus === 'healthy') {
        loadAllData();
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [loadAllData, realTimeMode, apiStatus]);

  // Enhanced metric cards with animations
  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down' | 'stable';
    loading?: boolean;
  }> = ({ title, value, change, icon, color, trend, loading = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.7)})`,
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" sx={{ 
                color: 'text.secondary', 
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                {title}
              </Typography>
              <Box display="flex" alignItems="baseline" gap={1} mt={1}>
                {loading ? (
                  <Skeleton variant="text" width={80} height={40} />
                ) : (
                  <Typography variant="h4" sx={{ 
                    fontWeight: 700, 
                    color: color,
                    lineHeight: 1.2
                  }}>
                    {value}
                  </Typography>
                )}
              </Box>
              {change !== undefined && !loading && (
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  {trend === 'up' ? (
                    <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                  ) : trend === 'down' ? (
                    <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                  ) : null}
                  <Typography variant="caption" sx={{
                    color: trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary',
                    fontWeight: 600
                  }}>
                    {change > 0 ? '+' : ''}{change}% vs last hour
                  </Typography>
                </Box>
              )}
            </Box>
            <Avatar sx={{ 
              bgcolor: alpha(color, 0.1), 
              color: color,
              width: 56,
              height: 56
            }}>
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Enhanced chart with animations
  const AnimatedChart: React.FC<{
    title: string;
    data: any[];
    type: 'line' | 'area' | 'bar' | 'pie';
    height?: number;
  }> = ({ title, data, type, height = 300 }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ 
        borderRadius: 3,
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Chip 
              label="Live" 
              color="success" 
              size="small" 
              variant="outlined"
              sx={{ animation: realTimeMode ? 'pulse 2s infinite' : 'none' }}
            />
          </Box>
          
          {type === 'line' && (
            <ResponsiveContainer width="100%" height={height}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis 
                  dataKey="timestamp" 
                  stroke={theme.palette.text.secondary}
                  fontSize={12}
                />
                <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{
                    backgroundColor: alpha(theme.palette.background.paper, 0.95),
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    borderRadius: 8,
                    backdropFilter: 'blur(20px)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_speed" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          
          {type === 'area' && (
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis dataKey="timestamp" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip />
                <Area 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#82ca9d" 
                  fill={alpha('#82ca9d', 0.3)}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
          
          {type === 'bar' && (
            <ResponsiveContainer width="100%" height={height}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.2)} />
                <XAxis dataKey="city" stroke={theme.palette.text.secondary} />
                <YAxis stroke={theme.palette.text.secondary} />
                <RechartsTooltip />
                <Bar dataKey="current_speed" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // Status indicator with pulse animation
  const StatusIndicator: React.FC = () => (
    <motion.div
      animate={{
        scale: apiStatus === 'healthy' ? [1, 1.1, 1] : 1,
      }}
      transition={{
        duration: 2,
        repeat: apiStatus === 'healthy' ? Infinity : 0,
      }}
    >
      <Chip
        icon={
          apiStatus === 'healthy' ? <CheckCircle /> : 
          apiStatus === 'error' ? <ErrorIcon /> : <Warning />
        }
        label={`API ${apiStatus.toUpperCase()}`}
        color={
          apiStatus === 'healthy' ? 'success' : 
          apiStatus === 'error' ? 'error' : 'warning'
        }
        variant="filled"
      />
    </motion.div>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
      position: 'relative'
    }}>
      {/* Floating Action Button with Speed Dial */}
      <SpeedDial
        ariaLabel="Dashboard Actions"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<Refresh />}
          tooltipTitle="Refresh Data"
          onClick={loadAllData}
        />
        <SpeedDialAction
          icon={<Download />}
          tooltipTitle="Export Data"
          onClick={() => {/* Export functionality */}}
        />
        <SpeedDialAction
          icon={<Settings />}
          tooltipTitle="Settings"
          onClick={() => setSettingsOpen(true)}
        />
      </SpeedDial>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          p: 3, 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(20px)'
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  width: 48,
                  height: 48
                }}>
                  <DashboardIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    UberFlow Analytics
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Real-time Traffic Intelligence Dashboard
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box>
              <Box display="flex" alignItems="center" gap={2}>
                <StatusIndicator />
                
                <FormControlLabel
                  control={
                    <Switch 
                      checked={realTimeMode} 
                      onChange={(e) => setRealTimeMode(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Live Updates"
                />
                
                <Badge badgeContent={notifications.length} color="error">
                  <IconButton>
                    <NotificationsActive />
                  </IconButton>
                </Badge>
                
                <Tooltip title="Toggle Dark Mode">
                  <IconButton onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? <Brightness7 /> : <Brightness4 />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        {/* Metrics Overview */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3, mb: 4 }}>
          <MetricCard
            title="Total Predictions"
            value={metrics?.totalPredictions?.toLocaleString() || '0'}
            change={5.2}
            trend="up"
            icon={<ModelTraining />}
            color={theme.palette.primary.main}
            loading={isLoading}
          />
          
          <MetricCard
            title="Model Accuracy"
            value={`${metrics?.accuracy || 0}%`}
            change={2.1}
            trend="up"
            icon={<Analytics />}
            color={theme.palette.success.main}
            loading={isLoading}
          />
          
          <MetricCard
            title="Active Segments"
            value={metrics?.activeSegments?.toLocaleString() || '0'}
            change={-1.3}
            trend="down"
            icon={<Map />}
            color={theme.palette.info.main}
            loading={isLoading}
          />
          
          <MetricCard
            title="Response Time"
            value={`${metrics?.avgResponseTime || 0}ms`}
            change={0.8}
            trend="stable"
            icon={<Speed />}
            color={theme.palette.warning.main}
            loading={isLoading}
          />
        </Box>

        {/* Charts Section */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, mb: 4 }}>
          <AnimatedChart
            title="Historical Traffic Trends"
            data={historicalData}
            type="line"
            height={400}
          />
          
          <AnimatedChart
            title="Model Performance"
            data={historicalData}
            type="area"
            height={400}
          />
        </Box>

        {/* Real-time Data */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          <AnimatedChart
            title="Live Traffic by City"
            data={realTimeData.reduce((acc: any[], curr) => {
              const existing = acc.find(item => item.city === curr.city);
              if (existing) {
                existing.current_speed = (existing.current_speed + curr.current_speed) / 2;
              } else {
                acc.push({
                  city: curr.city.replace('_', ' ').toUpperCase(),
                  current_speed: curr.current_speed
                });
              }
              return acc;
            }, [])}
            type="bar"
            height={300}
          />
          
          <Box>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{ 
                height: 360,
                borderRadius: 3,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(20px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Live Predictions Feed
                  </Typography>
                  
                  <Box sx={{ maxHeight: 280, overflow: 'auto' }}>
                    <AnimatePresence>
                      {predictions.slice(0, 8).map((prediction, index) => (
                        <motion.div
                          key={`${prediction.city}-${prediction.segment_id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              p: 2,
                              mb: 1,
                              background: alpha(theme.palette.background.default, 0.5),
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                            }}
                          >
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {prediction.city.replace('_', ' ').toUpperCase()} - Segment {prediction.segment_id}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(prediction.timestamp).toLocaleTimeString()}
                              </Typography>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={2}>
                              <Chip
                                label={`${prediction.predicted_speed.toFixed(1)} mph`}
                                color={prediction.predicted_speed > 25 ? 'success' : prediction.predicted_speed > 15 ? 'warning' : 'error'}
                                size="small"
                                variant="outlined"
                              />
                              
                              {prediction.is_rush_hour && (
                                <Chip
                                  label="Rush Hour"
                                  color="error"
                                  size="small"
                                />
                              )}
                            </Box>
                          </Box>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Box>
        </Box>
      </Box>

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      >
        <Box sx={{ width: 320, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Dashboard Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={realTimeMode} 
                onChange={(e) => setRealTimeMode(e.target.checked)}
              />
            }
            label="Real-time Updates"
            sx={{ mb: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={darkMode} 
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            }
            label="Dark Mode"
            sx={{ mb: 2 }}
          />
        </Box>
      </Drawer>

      {/* Loading Overlay */}
      {isLoading && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: alpha(theme.palette.background.default, 0.8),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Box textAlign="center">
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }}>
              Loading Analytics Data...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Global CSS for animations */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        .pulse-animation {
          animation: pulse 2s infinite;
        }
      `}</style>
    </Box>
  );
};

export default EnhancedDashboard;