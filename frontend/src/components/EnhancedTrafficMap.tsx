import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge,
  Fab,
  useTheme,
  alpha,
  TextField,
  InputAdornment,
  ButtonGroup,
  Button,
  Paper,
  Divider,
} from '@mui/material';
import {
  Map as MapIcon,
  Layers,
  FilterList,
  Search,
  MyLocation,
  Fullscreen,
  Settings,
  Timeline,
  Speed,
  Warning,
  CheckCircle,
  Traffic,
  Navigation,
  Satellite,
  Terrain,
  LocationOn,
  TrendingUp,
  TrendingDown,
  Refresh,
  PlayArrow,
  Pause,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TrafficSegment {
  id: number;
  city: string;
  lat: number;
  lon: number;
  current_speed: number;
  predicted_speed: number;
  confidence_lower: number;
  confidence_upper: number;
  is_rush_hour: boolean;
  status: 'normal' | 'congested' | 'heavy';
  timestamp: string;
}

interface MapFilters {
  minSpeed: number;
  maxSpeed: number;
  showRushHour: boolean;
  showPredictions: boolean;
  selectedCity: string;
  trafficLevel: 'all' | 'normal' | 'congested' | 'heavy';
}

const CITY_CENTERS = {
  all: [39.8283, -98.5795] as [number, number],
  san_francisco: [37.7749, -122.4194] as [number, number],
  new_york: [40.7128, -74.0060] as [number, number],
  london: [51.5074, -0.1278] as [number, number],
};

const MAP_STYLES = [
  { name: 'Streets', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
  { name: 'Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  { name: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' },
];

const getSpeedColor = (speed: number, isRushHour: boolean): string => {
  if (isRushHour) {
    return speed < 10 ? '#d32f2f' : speed < 20 ? '#f57c00' : '#689f38';
  }
  return speed < 15 ? '#d32f2f' : speed < 25 ? '#f57c00' : '#2e7d32';
};

const getTrafficStatus = (speed: number): 'normal' | 'congested' | 'heavy' => {
  if (speed < 10) return 'heavy';
  if (speed < 20) return 'congested';
  return 'normal';
};

// Map Controls Component
const MapControls: React.FC<{
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCenter: () => void;
  onToggleFullscreen: () => void;
}> = ({ onZoomIn, onZoomOut, onCenter, onToggleFullscreen }) => (
  <Box sx={{
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 1
  }}>
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <ButtonGroup orientation="vertical" size="small">
        <Button onClick={onZoomIn}><ZoomIn /></Button>
        <Button onClick={onZoomOut}><ZoomOut /></Button>
        <Button onClick={onCenter}><MyLocation /></Button>
        <Button onClick={onToggleFullscreen}><Fullscreen /></Button>
      </ButtonGroup>
    </Paper>
  </Box>
);

// Legend Component
const MapLegend: React.FC = () => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper 
        elevation={3}
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          p: 2,
          zIndex: 1000,
          minWidth: 200,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          borderRadius: 2
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
          Traffic Speed Legend
        </Typography>
        
        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              bgcolor: '#2e7d32' 
            }} />
            <Typography variant="caption">Fast (25+ mph)</Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              bgcolor: '#f57c00' 
            }} />
            <Typography variant="caption">Moderate (15-25 mph)</Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ 
              width: 16, 
              height: 16, 
              borderRadius: '50%', 
              bgcolor: '#d32f2f' 
            }} />
            <Typography variant="caption">Slow (&lt;15 mph)</Typography>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

// Real-time Stats Panel
const StatsPanel: React.FC<{
  segments: TrafficSegment[];
  selectedCity: string;
}> = ({ segments, selectedCity }) => {
  const theme = useTheme();
  
  const stats = useMemo(() => {
    const filteredSegments = selectedCity === 'all' 
      ? segments 
      : segments.filter(s => s.city === selectedCity);
    
    const avgSpeed = filteredSegments.reduce((sum, s) => sum + s.current_speed, 0) / filteredSegments.length || 0;
    const congestedCount = filteredSegments.filter(s => getTrafficStatus(s.current_speed) !== 'normal').length;
    const rushHourCount = filteredSegments.filter(s => s.is_rush_hour).length;
    
    return {
      totalSegments: filteredSegments.length,
      avgSpeed: avgSpeed.toFixed(1),
      congestedCount,
      rushHourCount,
      normalCount: filteredSegments.length - congestedCount
    };
  }, [segments, selectedCity]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          p: 2,
          zIndex: 1000,
          minWidth: 280,
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          borderRadius: 2
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Real-time Stats
        </Typography>
        
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total Segments
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {stats.totalSegments}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="caption" color="text.secondary">
              Avg Speed
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
              {stats.avgSpeed} mph
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="caption" color="text.secondary">
              Congested
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
              {stats.congestedCount}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="caption" color="text.secondary">
              Normal Flow
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
              {stats.normalCount}
            </Typography>
          </Box>
        </Box>
        
        {stats.rushHourCount > 0 && (
          <Box mt={2}>
            <Chip
              icon={<Warning />}
              label={`${stats.rushHourCount} segments in rush hour`}
              color="warning"
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </Paper>
    </motion.div>
  );
};

const EnhancedTrafficMap: React.FC<{
  selectedCity?: string;
  height?: number;
}> = ({ selectedCity = 'all', height = 600 }) => {
  const theme = useTheme();
  const mapRef = useRef<any>(null);
  
  // State management
  const [segments, setSegments] = useState<TrafficSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapStyle, setMapStyle] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<TrafficSegment | null>(null);
  
  const [filters, setFilters] = useState<MapFilters>({
    minSpeed: 0,
    maxSpeed: 60,
    showRushHour: true,
    showPredictions: true,
    selectedCity: selectedCity,
    trafficLevel: 'all'
  });

  const API_BASE = 'http://localhost:8000';

  // Load traffic data
  const loadTrafficData = async () => {
    try {
      setIsLoading(true);
      console.log('EnhancedTrafficMap: Loading traffic data...');
      
      const [predictionsResponse, realtimeResponse] = await Promise.allSettled([
        fetch(`${API_BASE}/predictions?limit=50`),
        fetch(`${API_BASE}/traffic/realtime`)
      ]);

      let trafficData: TrafficSegment[] = [];

      if (predictionsResponse.status === 'fulfilled' && predictionsResponse.value.ok) {
        const predictions = await predictionsResponse.value.json();
        trafficData = predictions.map((pred: any) => ({
          id: pred.segment_id,
          city: pred.city,
          lat: pred.lat,
          lon: pred.lon,
          current_speed: pred.predicted_speed,
          predicted_speed: pred.predicted_speed,
          confidence_lower: pred.confidence_lower,
          confidence_upper: pred.confidence_upper,
          is_rush_hour: pred.is_rush_hour,
          status: getTrafficStatus(pred.predicted_speed),
          timestamp: pred.timestamp
        }));
      }

      if (realtimeResponse.status === 'fulfilled' && realtimeResponse.value.ok) {
        const realtime = await realtimeResponse.value.json();
        const realtimeSegments = realtime.slice(0, 30).map((rt: any) => ({
          id: rt.segment_id,
          city: rt.city,
          lat: rt.lat || (CITY_CENTERS[rt.city as keyof typeof CITY_CENTERS] || CITY_CENTERS.all)[0] + (Math.random() - 0.5) * 0.1,
          lon: rt.lon || (CITY_CENTERS[rt.city as keyof typeof CITY_CENTERS] || CITY_CENTERS.all)[1] + (Math.random() - 0.5) * 0.1,
          current_speed: rt.current_speed,
          predicted_speed: rt.current_speed * 1.05,
          confidence_lower: rt.current_speed * 0.9,
          confidence_upper: rt.current_speed * 1.1,
          is_rush_hour: rt.current_speed < 15,
          status: rt.status || getTrafficStatus(rt.current_speed),
          timestamp: rt.timestamp
        }));
        
        trafficData = [...trafficData, ...realtimeSegments];
      }

      // Remove duplicates based on city and segment_id
      const uniqueSegments = trafficData.reduce((acc: TrafficSegment[], current) => {
        const existing = acc.find(item => item.city === current.city && item.id === current.id);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, []);

      setSegments(uniqueSegments);
      console.log('EnhancedTrafficMap: Loaded', uniqueSegments.length, 'segments');
      
    } catch (error) {
      console.error('EnhancedTrafficMap: Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time updates
  useEffect(() => {
    loadTrafficData();
    
    const interval = setInterval(() => {
      if (realTimeMode) {
        loadTrafficData();
      }
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, [realTimeMode]);

  // Filter segments
  const filteredSegments = useMemo(() => {
    return segments.filter(segment => {
      const matchesCity = filters.selectedCity === 'all' || segment.city === filters.selectedCity;
      const matchesSpeed = segment.current_speed >= filters.minSpeed && segment.current_speed <= filters.maxSpeed;
      const matchesRushHour = !filters.showRushHour || segment.is_rush_hour;
      const matchesTrafficLevel = filters.trafficLevel === 'all' || segment.status === filters.trafficLevel;
      
      return matchesCity && matchesSpeed && matchesRushHour && matchesTrafficLevel;
    });
  }, [segments, filters]);

  // Map event handlers
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleCenter = () => {
    if (mapRef.current) {
      const center = CITY_CENTERS[filters.selectedCity as keyof typeof CITY_CENTERS] || CITY_CENTERS.all;
      mapRef.current.setView(center, 12);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Box sx={{ 
      position: 'relative',
      height: isFullscreen ? '100vh' : height,
      width: '100%',
      ...(isFullscreen && {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: theme.palette.background.default
      })
    }}>
      {/* Header */}
      {!isFullscreen && (
        <Box sx={{ 
          p: 2, 
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)'
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ 
                bgcolor: 'primary.main',
                width: 40,
                height: 40
              }}>
                <MapIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Interactive Traffic Map
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {filteredSegments.length} segments • Updated {new Date().toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={realTimeMode} 
                    onChange={(e) => setRealTimeMode(e.target.checked)}
                    size="small"
                  />
                }
                label="Live"
              />
              
              <Tooltip title="Filters">
                <IconButton onClick={() => setShowFilters(true)}>
                  <FilterList />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Refresh">
                <IconButton onClick={loadTrafficData}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}

      {/* Map Container */}
      <Box sx={{ 
        height: isFullscreen ? '100%' : `calc(100% - ${isFullscreen ? 0 : 80}px)`,
        position: 'relative'
      }}>
        <MapContainer
          center={CITY_CENTERS[filters.selectedCity as keyof typeof CITY_CENTERS] || CITY_CENTERS.all}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url={MAP_STYLES[mapStyle].url}
            attribution="© OpenStreetMap contributors"
          />
          
          {/* Traffic Segments */}
          <AnimatePresence>
            {filteredSegments.map((segment) => (
              <CircleMarker
                key={`${segment.city}-${segment.id}`}
                center={[segment.lat, segment.lon]}
                radius={8}
                fillColor={getSpeedColor(segment.current_speed, segment.is_rush_hour)}
                color="white"
                weight={2}
                opacity={0.9}
                fillOpacity={0.8}
                eventHandlers={{
                  click: () => setSelectedSegment(segment)
                }}
              >
                <Popup>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      {segment.city.replace('_', ' ').toUpperCase()} - Segment {segment.id}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption">Current Speed:</Typography>
                      <Chip 
                        label={`${segment.current_speed.toFixed(1)} mph`}
                        size="small"
                        color={segment.current_speed > 25 ? 'success' : segment.current_speed > 15 ? 'warning' : 'error'}
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption">Predicted:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {segment.predicted_speed.toFixed(1)} mph
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption">Status:</Typography>
                      <Chip 
                        label={segment.status.toUpperCase()}
                        size="small"
                        color={segment.status === 'normal' ? 'success' : segment.status === 'congested' ? 'warning' : 'error'}
                      />
                    </Box>
                    
                    {segment.is_rush_hour && (
                      <Chip 
                        icon={<Warning />}
                        label="Rush Hour"
                        color="warning"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Updated: {new Date(segment.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Popup>
              </CircleMarker>
            ))}
          </AnimatePresence>
        </MapContainer>

        {/* Map Overlays */}
        <StatsPanel segments={filteredSegments} selectedCity={filters.selectedCity} />
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onCenter={handleCenter}
          onToggleFullscreen={toggleFullscreen}
        />
        <MapLegend />

        {/* Loading Overlay */}
        {isLoading && (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: alpha(theme.palette.background.default, 0.8),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <Box textAlign="center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <MapIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              </motion.div>
              <Typography variant="h6">Loading Traffic Data...</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Filters Drawer */}
      <Drawer
        anchor="right"
        open={showFilters}
        onClose={() => setShowFilters(false)}
      >
        <Box sx={{ width: 320, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Map Filters
          </Typography>
          
          <Box mb={3}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Speed Range (mph)</Typography>
            <Slider
              value={[filters.minSpeed, filters.maxSpeed]}
              onChange={(_, newValue) => {
                const [min, max] = newValue as number[];
                setFilters(prev => ({ ...prev, minSpeed: min, maxSpeed: max }));
              }}
              valueLabelDisplay="auto"
              min={0}
              max={60}
              step={5}
            />
          </Box>
          
          <Box mb={3}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>City</Typography>
            <ButtonGroup fullWidth>
              {['all', 'san_francisco', 'new_york', 'london'].map((city) => (
                <Button
                  key={city}
                  variant={filters.selectedCity === city ? 'contained' : 'outlined'}
                  onClick={() => setFilters(prev => ({ ...prev, selectedCity: city }))}
                  size="small"
                >
                  {city === 'all' ? 'All' : city.replace('_', ' ')}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
          
          <Box mb={3}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Traffic Level</Typography>
            <ButtonGroup orientation="vertical" fullWidth>
              {['all', 'normal', 'congested', 'heavy'].map((level) => (
                <Button
                  key={level}
                  variant={filters.trafficLevel === level ? 'contained' : 'outlined'}
                  onClick={() => setFilters(prev => ({ ...prev, trafficLevel: level as any }))}
                  size="small"
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
          
          <FormControlLabel
            control={
              <Switch 
                checked={filters.showRushHour} 
                onChange={(e) => setFilters(prev => ({ ...prev, showRushHour: e.target.checked }))}
              />
            }
            label="Include Rush Hour"
            sx={{ mb: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={filters.showPredictions} 
                onChange={(e) => setFilters(prev => ({ ...prev, showPredictions: e.target.checked }))}
              />
            }
            label="Show Predictions"
            sx={{ mb: 2 }}
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" sx={{ mb: 2 }}>Map Style</Typography>
          <ButtonGroup orientation="vertical" fullWidth>
            {MAP_STYLES.map((style, index) => (
              <Button
                key={style.name}
                variant={mapStyle === index ? 'contained' : 'outlined'}
                onClick={() => setMapStyle(index)}
                size="small"
              >
                {style.name}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Drawer>
    </Box>
  );
};

export default EnhancedTrafficMap;