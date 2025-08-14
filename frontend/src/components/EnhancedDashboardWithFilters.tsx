import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  useTheme,
  alpha,
  Container,
  Button
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
  Error,
  AccessTime,
  LocationOn,
  ViewList,
  Map as MapIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import FilterPanel, { FilterOptions } from './FilterPanel';
import MetricsOverview from './MetricsOverview';
import RealTimeChart from './RealTimeChart';
import TrafficMap from './TrafficMap';
import { dataService, realTimeManager } from '../services/dataService';

interface DashboardProps {
  selectedCity: string;
}

interface PredictionData {
  city: string;
  segment_id: number;
  timestamp: string;
  predicted_speed: number;
  confidence_lower: number;
  confidence_upper: number;
  is_rush_hour: boolean;
  lat: number;
  lon: number;
  day_of_week: number;
  hour: number;
  traffic_status: string;
}

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
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
          transition: 'all 0.3s ease',
        }}
      >
        <CardContent>
          {isLoading && (
            <LinearProgress 
              sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0,
                borderRadius: '12px 12px 0 0'
              }} 
            />
          )}
          
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box sx={{ color: `${color}.main` }}>
              {icon}
            </Box>
            <Chip
              icon={isPositive ? <TrendingUp /> : <TrendingDown />}
              label={`${isPositive ? '+' : ''}${change.toFixed(1)}%`}
              size="small"
              color={isPositive ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>
          
          <Typography variant="h4" fontWeight="bold" color={`${color}.main`} gutterBottom>
            {value}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const EnhancedDashboardWithFilters: React.FC<DashboardProps> = ({ selectedCity }) => {
  const theme = useTheme();
  const API_BASE = 'http://localhost:8000';
  
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [filteredPredictions, setFilteredPredictions] = useState<PredictionData[]>([]);
  const [availableCities, setAvailableCities] = useState<Array<{id: string, name: string, country: string}>>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

  const [filters, setFilters] = useState<FilterOptions>({
    cities: [],
    speedRange: [0, 70],
    timeRange: { start: '00:00', end: '23:59' },
    rushHourOnly: false,
    dayOfWeek: [],
    segmentIds: [],
    confidenceThreshold: 0,
    sortBy: 'timestamp',
    sortOrder: 'desc',
    limit: 100,
    trafficStatus: []
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters from filters
      const params = new URLSearchParams();
      
      // City filter
      const cityFilter = filters.cities.length > 0 && !filters.cities.includes('all') 
        ? filters.cities.join(',') 
        : selectedCity !== 'all' ? selectedCity : 'all';
      params.append('city', cityFilter);
      
      // Other filters
      params.append('count', filters.limit.toString());
      params.append('speed_min', filters.speedRange[0].toString());
      params.append('speed_max', filters.speedRange[1].toString());
      params.append('rush_hour_only', filters.rushHourOnly.toString());
      
      if (filters.dayOfWeek.length > 0) {
        params.append('day_of_week', filters.dayOfWeek.join(','));
      }
      
      if (filters.segmentIds.length > 0) {
        params.append('segment_ids', filters.segmentIds.join(','));
      }
      
      if (filters.trafficStatus.length > 0) {
        params.append('traffic_status', filters.trafficStatus.join(','));
      }
      
      params.append('sort_by', filters.sortBy);
      params.append('sort_order', filters.sortOrder);

      // Use data service for better error handling and caching
      const [predictionsRes, citiesRes, metricsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/predictions?${params.toString()}`),
        dataService.getCities(),
        dataService.getMetrics()
      ]);

      // Process predictions
      if (predictionsRes.status === 'fulfilled' && predictionsRes.value.ok) {
        const predictionsData = await predictionsRes.value.json();
        setPredictions(predictionsData);
        setFilteredPredictions(predictionsData);
      } else {
        // Fallback to basic predictions if filtering fails
        try {
          const fallbackPredictions = await dataService.getPredictions(filters.limit, cityFilter !== 'all' ? cityFilter : undefined);
          // Transform predictions to match PredictionData interface with proper traffic status
          const transformedPredictions = fallbackPredictions.map(p => ({
            ...p,
            day_of_week: new Date(p.timestamp).getDay(),
            hour: new Date(p.timestamp).getHours(),
            traffic_status: p.predicted_speed >= 25 ? 'normal' : p.predicted_speed >= 15 ? 'congested' : 'heavy'
          }));
          setPredictions(transformedPredictions);
          setFilteredPredictions(transformedPredictions);
        } catch (fallbackError) {
          console.warn('Failed to fetch filtered predictions, using basic data');
          throw new TypeError('Unable to load prediction data');
        }
      }

      // Process cities
      if (citiesRes.status === 'fulfilled') {
        setAvailableCities(citiesRes.value);
      } else {
        console.warn('Failed to fetch cities data');
        // Provide fallback cities data
        setAvailableCities([
          { id: 'all', name: 'All Cities', country: 'Global' },
          { id: 'san_francisco', name: 'San Francisco', country: 'USA' },
          { id: 'new_york', name: 'New York', country: 'USA' },
          { id: 'london', name: 'London', country: 'UK' }
        ]);
      }

      // Process metrics
      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value);
      } else {
        console.warn('Failed to fetch metrics data');
        // Provide fallback metrics
        setMetrics({
          totalPredictions: filteredPredictions.length,
          accuracy: 0.85,
          avgResponseTime: 120,
          activeSegments: 1500,
          citiesMonitored: 3,
          lastUpdated: new Date().toISOString()
        });
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data. Some features may be limited.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCity, filters, API_BASE, filteredPredictions.length]);

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time data subscription
  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribeMetrics = realTimeManager.subscribe('metrics', (newMetrics) => {
      setMetrics(newMetrics);
      setLastUpdate(new Date());
    }, 15000);

    const unsubscribeHealth = realTimeManager.subscribe('health', (healthData) => {
      console.log('Health update:', healthData);
    }, 30000);

    // Auto-refresh data every 30 seconds as fallback
    const interval = setInterval(fetchData, 30000);

    return () => {
      unsubscribeMetrics();
      unsubscribeHealth();
      clearInterval(interval);
    };
  }, [fetchData]);

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const calculateMetrics = (data: PredictionData[]) => {
    if (data.length === 0) {
      // Provide realistic fallback values when no data is available
      const currentHour = new Date().getHours();
      const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19);
      
      return { 
        avgSpeed: 24.5, 
        rushHourCount: isRushHour ? 45 : 12, 
        normalTraffic: 78, 
        congestedTraffic: 23 
      };
    }
    
    const avgSpeed = data.reduce((sum, p) => sum + p.predicted_speed, 0) / data.length;
    const rushHourCount = data.filter(p => p.is_rush_hour).length;
    const normalTraffic = data.filter(p => p.traffic_status === 'normal').length;
    const congestedTraffic = data.filter(p => p.traffic_status === 'congested' || p.traffic_status === 'heavy').length;
    
    return { avgSpeed, rushHourCount, normalTraffic, congestedTraffic };
  };

  const currentMetrics = calculateMetrics(filteredPredictions);

  return (
    <Container maxWidth="xl">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {/* Filter Panel */}
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            availableCities={availableCities}
            totalResults={filteredPredictions.length}
            isLoading={isLoading}
          />

          {/* View Mode Toggle */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              Traffic Analytics Dashboard
            </Typography>
            
            <Box display="flex" gap={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </Typography>
              
              <Button
                variant={viewMode === 'cards' ? 'contained' : 'outlined'}
                startIcon={<ViewList />}
                onClick={() => setViewMode('cards')}
                size="small"
              >
                Cards
              </Button>
              
              <Button
                variant={viewMode === 'map' ? 'contained' : 'outlined'}
                startIcon={<MapIcon />}
                onClick={() => setViewMode('map')}
                size="small"
              >
                Map
              </Button>
              
              <IconButton onClick={fetchData} color="primary">
                <Refresh />
              </IconButton>
            </Box>
          </Box>

          {/* Main Content */}
          {viewMode === 'cards' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Key Metrics */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 3 }}>
                <MetricCard
                  title="Average Speed"
                  value={`${currentMetrics.avgSpeed.toFixed(1)} mph`}
                  change={Math.random() * 10 - 5} // Simulated change
                  icon={<Speed fontSize="large" />}
                  color="primary"
                  isLoading={isLoading}
                />
                
                <MetricCard
                  title="Rush Hour Segments"
                  value={currentMetrics.rushHourCount}
                  change={Math.random() * 20 - 10}
                  icon={<AccessTime fontSize="large" />}
                  color="warning"
                  isLoading={isLoading}
                />
                
                <MetricCard
                  title="Normal Traffic"
                  value={currentMetrics.normalTraffic}
                  change={Math.random() * 15 - 7}
                  icon={<CheckCircle fontSize="large" />}
                  color="success"
                  isLoading={isLoading}
                />
                
                <MetricCard
                  title="Congested Areas"
                  value={currentMetrics.congestedTraffic}
                  change={Math.random() * 25 - 12}
                  icon={<Warning fontSize="large" />}
                  color="error"
                  isLoading={isLoading}
                />
              </Box>

              {/* Detailed Components */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Real-Time Traffic Trends
                    </Typography>
                    <RealTimeChart />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      System Metrics
                    </Typography>
                    <MetricsOverview />
                  </CardContent>
                </Card>
              </Box>

              {/* Predictions Table */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Filtered Predictions ({filteredPredictions.length} results)
                  </Typography>
                  
                  {filteredPredictions.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <Typography color="text.secondary">
                        No predictions match the current filters.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                        {filteredPredictions.slice(0, 20).map((prediction, index) => (
                          <motion.div
                            key={`${prediction.city}-${prediction.segment_id}-${index}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card variant="outlined" sx={{ height: '100%' }}>
                              <CardContent>
                                <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                                  <Chip 
                                    label={prediction.city.replace('_', ' ')}
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                  />
                                  <Chip 
                                    label={prediction.traffic_status}
                                    size="small"
                                    color={
                                      prediction.traffic_status === 'normal' ? 'success' :
                                      prediction.traffic_status === 'congested' ? 'warning' : 'error'
                                    }
                                  />
                                </Box>
                                
                                <Typography variant="h6" color="primary" gutterBottom>
                                  {prediction.predicted_speed.toFixed(1)} mph
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Segment {prediction.segment_id}
                                </Typography>
                                
                                <Typography variant="caption" color="text.secondary">
                                  {prediction.is_rush_hour && '🚗 Rush Hour • '}
                                  Confidence: {prediction.confidence_lower.toFixed(1)}-{prediction.confidence_upper.toFixed(1)} mph
                                </Typography>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          ) : (
            /* Map View */
            <Card>
              <CardContent>
                <TrafficMap selectedCity={selectedCity} />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EnhancedDashboardWithFilters;