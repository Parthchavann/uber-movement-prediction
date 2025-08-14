import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  IconButton,
  useTheme,
  alpha,
  Slider,
  FormControlLabel,
  Switch,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Map as MapIcon,
  Layers,
  LocationOn,
  Speed,
  Traffic,
  Refresh,
  Fullscreen,
  MyLocation,
  FilterList,
  Timeline,
  TrendingUp,
  TrendingDown,
  Warning,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Mock map component since we can't use actual mapping libraries without additional setup
const MockMapComponent: React.FC<{
  segments: any[];
  selectedSegment: number | null;
  onSegmentSelect: (id: number) => void;
  showHeatmap: boolean;
  showPredictions: boolean;
}> = ({ segments, selectedSegment, onSegmentSelect, showHeatmap, showPredictions }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
          : 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'grab',
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      {/* Mock San Francisco street layout */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 300"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Grid pattern for streets */}
        <defs>
          <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 30"
              fill="none"
              stroke={alpha(theme.palette.common.white, 0.2)}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Mock road segments */}
        {segments.map((segment, index) => {
          const x = (segment.id * 47 + 23) % 360 + 20;
          const y = (segment.id * 31 + 17) % 240 + 30;
          const width = 40 + (segment.speed / 60) * 20;
          const height = 8;
          
          let color = theme.palette.success.main;
          if (segment.speed < 15) color = theme.palette.error.main;
          else if (segment.speed < 25) color = theme.palette.warning.main;
          else if (segment.speed < 35) color = theme.palette.info.main;
          
          return (
            <g key={segment.id}>
              {/* Road segment */}
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill={color}
                stroke={selectedSegment === segment.id ? theme.palette.primary.main : 'transparent'}
                strokeWidth={selectedSegment === segment.id ? 2 : 0}
                rx={4}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: showHeatmap ? 0.8 : 1,
                }}
                onClick={() => onSegmentSelect(segment.id)}
              />
              
              {/* Speed indicator */}
              <text
                x={x + width / 2}
                y={y + height + 12}
                textAnchor="middle"
                fontSize="8"
                fill={theme.palette.text.primary}
                style={{ pointerEvents: 'none' }}
              >
                {segment.speed.toFixed(0)}
              </text>
              
              {/* Prediction overlay */}
              {showPredictions && (
                <rect
                  x={x}
                  y={y - 12}
                  width={width * 0.8}
                  height={4}
                  fill={theme.palette.secondary.main}
                  opacity={0.6}
                  rx={2}
                />
              )}
              
              {/* Traffic flow animation */}
              <circle
                r="2"
                fill={theme.palette.common.white}
                opacity={0.7}
              >
                <animateMotion
                  dur={`${4 - segment.speed / 20}s`}
                  repeatCount="indefinite"
                  path={`M${x},${y + height/2} L${x + width},${y + height/2}`}
                />
              </circle>
            </g>
          );
        })}
        
        {/* Location markers */}
        <circle cx="200" cy="150" r="6" fill={theme.palette.primary.main} opacity={0.8} />
        <circle cx="200" cy="150" r="12" fill="none" stroke={theme.palette.primary.main} strokeWidth="2" opacity={0.4}>
          <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      
      {/* Map controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <IconButton
          size="small"
          sx={{
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            '&:hover': {
              background: alpha(theme.palette.background.paper, 0.9),
            },
          }}
        >
          <MyLocation fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          sx={{
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            '&:hover': {
              background: alpha(theme.palette.background.paper, 0.9),
            },
          }}
        >
          <Fullscreen fontSize="small" />
        </IconButton>
      </Box>
      
      {/* Legend */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
          borderRadius: 1,
          p: 1,
          minWidth: 120,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
          Speed Legend
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {[
            { label: '> 35 mph', color: theme.palette.success.main },
            { label: '25-35 mph', color: theme.palette.info.main },
            { label: '15-25 mph', color: theme.palette.warning.main },
            { label: '< 15 mph', color: theme.palette.error.main },
          ].map((item, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 4,
                  background: item.color,
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const SegmentDetails: React.FC<{
  segment: any;
  selectedCity: string;
  onClose: () => void;
}> = ({ segment, selectedCity, onClose }) => {
  const theme = useTheme();
  
  if (!segment) return null;
  
  const speedTrend = Math.random() > 0.5 ? 'up' : 'down';
  const trendValue = (Math.random() * 10 + 1).toFixed(1);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <Paper
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 280,
          height: '100%',
          background: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(20px)',
          borderLeft: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          zIndex: 10,
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Segment Details
            </Typography>
            <IconButton onClick={onClose} size="small">
              ✕
            </IconButton>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Segment ID
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              #{segment.id}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Current Speed
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {segment.speed.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                mph
              </Typography>
              <Chip
                icon={speedTrend === 'up' ? <TrendingUp /> : <TrendingDown />}
                label={`${speedTrend === 'up' ? '+' : '-'}${trendValue}%`}
                color={speedTrend === 'up' ? 'success' : 'error'}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Speed color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Predicted Speed"
                secondary={`${segment.prediction.toFixed(1)} mph`}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Timeline color="secondary" />
              </ListItemIcon>
              <ListItemText
                primary="Congestion Level"
                secondary={segment.speed < 15 ? 'High' : segment.speed < 25 ? 'Moderate' : 'Low'}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <LocationOn color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Location"
                secondary={selectedCity === 'san_francisco' ? 'San Francisco' :
                          selectedCity === 'new_york' ? 'New York' :
                          selectedCity === 'london' ? 'London' :
                          'Multi-City'}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <Traffic color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Traffic Density"
                secondary="Medium"
              />
            </ListItem>
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Recent History
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { time: '10:00 AM', speed: segment.speed + 2.3, status: 'normal' },
                { time: '09:45 AM', speed: segment.speed + 1.1, status: 'normal' },
                { time: '09:30 AM', speed: segment.speed - 0.8, status: 'slow' },
                { time: '09:15 AM', speed: segment.speed - 2.4, status: 'congested' },
              ].map((entry, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    background: alpha(theme.palette.background.default, 0.5),
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {entry.time}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {entry.speed.toFixed(1)} mph
                    </Typography>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: entry.status === 'congested' ? theme.palette.error.main :
                                   entry.status === 'slow' ? theme.palette.warning.main :
                                   theme.palette.success.main,
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
};

interface TrafficMapProps {
  selectedCity?: string;
}

const TrafficMap: React.FC<TrafficMapProps> = ({ selectedCity = 'all' }) => {
  const theme = useTheme();
  const [mapType, setMapType] = useState('speed');
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showPredictions, setShowPredictions] = useState(false);
  const [timeSlider, setTimeSlider] = useState(12); // Hour of day
  const [segments, setSegments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const API_BASE = 'http://localhost:8000';
  
  // Load traffic data from API
  const loadTrafficData = async () => {
    try {
      setIsLoading(true);
      console.log('TrafficMap: Loading data from API...');
      const response = await fetch(`${API_BASE}/predictions`);
      console.log('TrafficMap: API response status:', response.status);
      if (response.ok) {
        const predictions = await response.json();
        console.log('TrafficMap: Loaded predictions:', predictions.length);
        
        // Filter by selected city and convert to segments format
        let filteredPredictions = predictions;
        if (selectedCity !== 'all') {
          filteredPredictions = predictions.filter((p: any) => p.city === selectedCity);
        }
        
        // Convert predictions to segment format for map display
        const segmentObj: Record<string, any> = {};
        filteredPredictions.forEach((pred: any) => {
          const key = `${pred.city}_${pred.segment_id}`;
          if (!segmentObj[key]) {
            segmentObj[key] = {
              id: pred.segment_id,
              city: pred.city,
              speed: pred.predicted_speed,
              prediction: pred.predicted_speed * 1.05, // Slight variation for demo
              lat: pred.lat,
              lon: pred.lon,
            };
          }
        });
        
        setSegments(Object.values(segmentObj).slice(0, 20)); // Limit for display
      }
    } catch (error) {
      console.error('TrafficMap: Error loading traffic data:', error);
      console.log('TrafficMap: Falling back to mock data');
      // Fallback to comprehensive mock data
      const mockSegments = [];
      const cityData: Record<string, { center: [number, number]; baseSpeed: number }> = {
        san_francisco: { center: [37.7749, -122.4194], baseSpeed: 24.8 },
        new_york: { center: [40.7128, -74.0060], baseSpeed: 18.3 },
        london: { center: [51.5074, -0.1278], baseSpeed: 20.1 },
        all: { center: [37.7749, -122.4194], baseSpeed: 21.0 }
      };
      
      const cityInfo = cityData[selectedCity] || cityData.all;
      const [baseLat, baseLon] = cityInfo.center;
      
      for (let i = 0; i < 15; i++) {
        const currentHour = new Date().getHours();
        const isRushHour = currentHour >= 7 && currentHour <= 9 || currentHour >= 17 && currentHour <= 19;
        const speedVariation = (Math.random() - 0.5) * 15;
        const rushHourPenalty = isRushHour ? Math.random() * 8 : 0;
        
        mockSegments.push({
          id: i,
          city: selectedCity,
          speed: Math.max(5, Math.min(55, cityInfo.baseSpeed + speedVariation - rushHourPenalty)),
          prediction: Math.max(5, Math.min(55, cityInfo.baseSpeed + speedVariation + (Math.random() - 0.5) * 3)),
          lat: baseLat + (Math.random() - 0.5) * 0.02,
          lon: baseLon + (Math.random() - 0.5) * 0.02
        });
      }
      
      setSegments(mockSegments);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data when component mounts or city changes
  useEffect(() => {
    loadTrafficData();
  }, [selectedCity]);

  // Real-time updates from API
  useEffect(() => {
    const interval = setInterval(() => {
      loadTrafficData();
    }, 15000); // Update every 15 seconds for more real-time feel

    return () => clearInterval(interval);
  }, []);

  // Separate effect for initial load when city changes
  useEffect(() => {
    console.log('TrafficMap: City changed to:', selectedCity);
    loadTrafficData();
  }, [selectedCity]);

  const handleMapTypeChange = (event: React.MouseEvent<HTMLElement>, newType: string) => {
    if (newType !== null) {
      setMapType(newType);
    }
  };

  const selectedSegmentData = segments.find(s => s.id === selectedSegment);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card sx={{ height: 600, position: 'relative', overflow: 'hidden' }}>
        <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Map Header */}
          <Box sx={{ p: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {selectedCity === 'all' ? 'Multi-City Traffic Map' : 
                 selectedCity === 'san_francisco' ? 'San Francisco Traffic Map' :
                 selectedCity === 'new_york' ? 'New York Traffic Map' :
                 selectedCity === 'london' ? 'London Traffic Map' : 
                 'Traffic Map'}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ToggleButtonGroup
                  value={mapType}
                  exclusive
                  onChange={handleMapTypeChange}
                  size="small"
                >
                  <ToggleButton value="speed">
                    <Speed fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="density">
                    <Traffic fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="predictions">
                    <Timeline fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
                
                <IconButton size="small">
                  <FilterList fontSize="small" />
                </IconButton>
                
                <IconButton size="small" onClick={loadTrafficData}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    size="small"
                  />
                }
                label="Heatmap"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showPredictions}
                    onChange={(e) => setShowPredictions(e.target.checked)}
                    size="small"
                  />
                }
                label="Predictions"
              />
              
              <Box sx={{ flexGrow: 1, ml: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Time: {timeSlider}:00
                </Typography>
                <Slider
                  value={timeSlider}
                  onChange={(e, value) => setTimeSlider(value as number)}
                  min={0}
                  max={23}
                  size="small"
                  sx={{ ml: 1, width: 120 }}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                icon={selectedCity === 'all' ? <span>🌍</span> : 
                      selectedCity === 'san_francisco' ? <span>🌉</span> :
                      selectedCity === 'new_york' ? <span>🗽</span> :
                      selectedCity === 'london' ? <span>🇬🇧</span> : undefined}
                label={`${segments.length} Active Segments`} 
                size="small" 
                variant="outlined" 
              />
              <Chip 
                label={`Avg Speed: ${(segments.reduce((acc, s) => acc + s.speed, 0) / segments.length).toFixed(1)} mph`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              <Chip
                icon={segments.some(s => s.speed < 15) ? <Warning /> : <TrendingUp />}
                label={segments.filter(s => s.speed < 15).length > 0 ? 'Traffic Issues' : 'Normal Flow'}
                size="small"
                color={segments.filter(s => s.speed < 15).length > 0 ? 'warning' : 'success'}
                variant="outlined"
              />
            </Box>
          </Box>
          
          {/* Map Container */}
          <Box sx={{ flexGrow: 1, position: 'relative', mx: 3, mb: 3 }}>
            <MockMapComponent
              segments={segments}
              selectedSegment={selectedSegment}
              onSegmentSelect={setSelectedSegment}
              showHeatmap={showHeatmap}
              showPredictions={showPredictions}
            />
            
            {/* Segment details panel */}
            <AnimatePresence>
              {selectedSegmentData && (
                <SegmentDetails
                  segment={selectedSegmentData}
                  selectedCity={selectedCity}
                  onClose={() => setSelectedSegment(null)}
                />
              )}
            </AnimatePresence>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TrafficMap;