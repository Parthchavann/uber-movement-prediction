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
  Tooltip,
  LinearProgress,
  Avatar,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Timeline,
  ShowChart,
  BarChart,
  Refresh,
  PlayArrow,
  Pause,
  TrendingUp,
  TrendingDown,
  Speed,
  Traffic,
  Warning,
  CheckCircle,
  RadioButtonChecked,
  Waves,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DataPoint {
  time: string;
  speed: number;
  prediction: number;
  congestion: number;
  volume: number;
  efficiency: number;
  timestamp: number;
}

interface SpeedGaugeProps {
  speed: number;
  maxSpeed: number;
  label: string;
}

const SpeedGauge: React.FC<SpeedGaugeProps> = ({ speed, maxSpeed, label }) => {
  const theme = useTheme();
  const percentage = (speed / maxSpeed) * 100;
  
  const getSpeedColor = (speed: number) => {
    if (speed >= 25) return theme.palette.success.main;
    if (speed >= 15) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const data = [{ value: percentage, fill: getSpeedColor(speed) }];

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ 
        height: 140, 
        background: `linear-gradient(135deg, ${alpha(getSpeedColor(speed), 0.1)}, ${alpha(getSpeedColor(speed), 0.05)})`,
        border: `1px solid ${alpha(getSpeedColor(speed), 0.2)}`,
      }}>
        <CardContent sx={{ p: 2, textAlign: 'center' }}>
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            <ResponsiveContainer width={80} height={80}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                barSize={8}
                data={data}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={4}
                  fill={getSpeedColor(speed)}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: getSpeedColor(speed) }}>
                {speed.toFixed(1)}
              </Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {label}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface TrafficFlowVisualizerProps {
  data: DataPoint[];
}

const TrafficFlowVisualizer: React.FC<TrafficFlowVisualizerProps> = ({ data }) => {
  const theme = useTheme();
  
  const latestData = data.slice(-10);
  
  return (
    <Card sx={{ height: 200, overflow: 'hidden', position: 'relative' }}>
      <CardContent sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Traffic Flow Pattern
        </Typography>
        
        <Box sx={{ position: 'relative', height: '100%' }}>
          {/* Animated Traffic Lanes */}
          {[0, 1, 2].map((lane) => (
            <Box
              key={lane}
              sx={{
                position: 'absolute',
                top: `${30 + lane * 25}%`,
                left: 0,
                right: 0,
                height: 8,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              {latestData.map((point, index) => {
                const speed = point.speed + (lane * 3) + (Math.random() - 0.5) * 5;
                const intensity = speed > 20 ? 1 : speed > 10 ? 0.6 : 0.3;
                
                return (
                  <motion.div
                    key={`${lane}-${index}`}
                    style={{
                      position: 'absolute',
                      width: 12,
                      height: 6,
                      backgroundColor: speed > 20 
                        ? theme.palette.success.main 
                        : speed > 10 
                        ? theme.palette.warning.main 
                        : theme.palette.error.main,
                      borderRadius: 3,
                      top: 1,
                      opacity: intensity,
                    }}
                    animate={{
                      left: ['0%', '100%'],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: 'linear',
                    }}
                  />
                );
              })}
            </Box>
          ))}
          
          {/* Speed Legend */}
          <Box sx={{ position: 'absolute', bottom: 10, right: 10 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                <Typography variant="caption">Fast</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main' }} />
                <Typography variant="caption">Slow</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                <Typography variant="caption">Jammed</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const EnhancedRealTimeChart: React.FC = () => {
  const theme = useTheme();
  const [data, setData] = useState<DataPoint[]>([]);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('6h');
  const [chartType, setChartType] = useState<'area' | 'line' | 'composed'>('composed');
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'speed' | 'congestion' | 'volume'>('speed');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate enhanced mock data with more realistic patterns
  const generateEnhancedData = (hours: number) => {
    const points = hours === 1 ? 30 : hours === 6 ? 72 : 144;
    const interval = hours === 1 ? 2 : hours === 6 ? 5 : 10; // minutes
    const newData: DataPoint[] = [];
    
    const now = new Date();
    
    for (let i = 0; i < points; i++) {
      const time = new Date(now.getTime() - (points - i) * interval * 60000);
      const hour = time.getHours();
      const dayOfWeek = time.getDay();
      
      // Traffic patterns
      const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isNight = hour >= 22 || hour <= 5;
      
      // Base speed calculation
      let baseSpeed = 28;
      if (isNight) baseSpeed = 35;
      else if (isRushHour && !isWeekend) baseSpeed = 15;
      else if (isWeekend) baseSpeed = 30;
      
      // Add realistic variations
      const variation = Math.sin((hour / 24) * Math.PI * 2) * 4 + (Math.random() - 0.5) * 6;
      const speed = Math.max(5, Math.min(45, baseSpeed + variation));
      
      // Traffic metrics
      const congestion = Math.max(0, Math.min(100, 100 - (speed / 45) * 100));
      const volume = isRushHour ? 80 + Math.random() * 20 : 30 + Math.random() * 40;
      const efficiency = (speed / 45) * 100;
      
      newData.push({
        time: hours === 1 
          ? time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        speed: Math.round(speed * 10) / 10,
        prediction: Math.round((speed + (Math.random() - 0.5) * 2) * 10) / 10,
        congestion: Math.round(congestion * 10) / 10,
        volume: Math.round(volume * 10) / 10,
        efficiency: Math.round(efficiency * 10) / 10,
        timestamp: time.getTime(),
      });
    }
    
    return newData;
  };

  // Load historical data
  const loadHistoricalData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/analytics/historical?hours=${timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24}`);
      
      if (response.ok) {
        const historicalData = await response.json();
        const enhancedData = historicalData.map((point: any, index: number) => ({
          time: new Date(point.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          speed: point.avg_speed || 25,
          prediction: (point.avg_speed || 25) + (Math.random() - 0.5) * 3,
          congestion: Math.max(0, 100 - ((point.avg_speed || 25) / 45) * 100),
          volume: 50 + Math.random() * 50,
          efficiency: ((point.avg_speed || 25) / 45) * 100,
          timestamp: Date.now() + index,
        }));
        setData(enhancedData);
      } else {
        // Fallback to generated data
        setData(generateEnhancedData(timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24));
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
      setData(generateEnhancedData(timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24));
    }
  };

  // Initial load
  useEffect(() => {
    loadHistoricalData();
  }, [timeRange]);

  // Real-time updates
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setData(prevData => {
          const now = new Date();
          const hour = now.getHours();
          const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
          
          let baseSpeed = 28;
          if (isRushHour) baseSpeed = 18;
          if (now.getDay() === 0 || now.getDay() === 6) baseSpeed = 30;
          
          const speed = Math.max(5, Math.min(45, baseSpeed + (Math.random() - 0.5) * 8));
          const congestion = Math.max(0, 100 - (speed / 45) * 100);
          const volume = isRushHour ? 70 + Math.random() * 30 : 30 + Math.random() * 40;
          
          const newPoint: DataPoint = {
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            speed: Math.round(speed * 10) / 10,
            prediction: Math.round((speed + (Math.random() - 0.5) * 2) * 10) / 10,
            congestion: Math.round(congestion * 10) / 10,
            volume: Math.round(volume * 10) / 10,
            efficiency: Math.round((speed / 45) * 100 * 10) / 10,
            timestamp: now.getTime(),
          };
          
          return [...prevData.slice(-99), newPoint];
        });
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, timeRange]);

  const latestPoint = data.length > 0 ? data[data.length - 1] : null;
  const previousPoint = data.length > 1 ? data[data.length - 2] : null;
  
  const getMetricChange = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 2, bgcolor: alpha(theme.palette.background.paper, 0.95) }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Time: {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: entry.color,
                }}
              />
              <Typography variant="body2">
                {entry.name}: {entry.value?.toFixed(1)}
                {entry.dataKey === 'speed' || entry.dataKey === 'prediction' ? ' mph' : 
                 entry.dataKey === 'congestion' || entry.dataKey === 'efficiency' ? '%' : ''}
              </Typography>
            </Box>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <Box>
      {/* Header Controls */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Real-Time Traffic Analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live traffic patterns with AI predictions and congestion analysis
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(_, value) => value && setTimeRange(value)}
            size="small"
          >
            <ToggleButton value="1h">1H</ToggleButton>
            <ToggleButton value="6h">6H</ToggleButton>
            <ToggleButton value="24h">24H</ToggleButton>
          </ToggleButtonGroup>
          
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(_, value) => value && setChartType(value)}
            size="small"
          >
            <ToggleButton value="area">
              <ShowChart />
            </ToggleButton>
            <ToggleButton value="line">
              <Timeline />
            </ToggleButton>
            <ToggleButton value="composed">
              <BarChart />
            </ToggleButton>
          </ToggleButtonGroup>
          
          <IconButton
            onClick={() => setIsPlaying(!isPlaying)}
            color={isPlaying ? 'success' : 'default'}
            sx={{ bgcolor: alpha(theme.palette.background.paper, 0.8) }}
          >
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          
          <IconButton onClick={loadHistoricalData}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Speed Gauges */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <SpeedGauge
              speed={latestPoint?.speed || 0}
              maxSpeed={50}
              label="Current Speed"
            />
            <SpeedGauge
              speed={latestPoint?.prediction || 0}
              maxSpeed={50}
              label="Predicted Speed"
            />
          </Box>
        </Grid>

        {/* Main Chart */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ height: 400 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Traffic Metrics Over Time
                  </Typography>
                  
                  <ToggleButtonGroup
                    value={selectedMetric}
                    exclusive
                    onChange={(_, value) => value && setSelectedMetric(value)}
                    size="small"
                  >
                    <ToggleButton value="speed">Speed</ToggleButton>
                    <ToggleButton value="congestion">Congestion</ToggleButton>
                    <ToggleButton value="volume">Volume</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                
                <ResponsiveContainer width="100%" height={320}>
                  {chartType === 'area' ? (
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                      <XAxis 
                        dataKey="time" 
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey={selectedMetric}
                        stroke={theme.palette.primary.main}
                        fillOpacity={1}
                        fill="url(#speedGradient)"
                        strokeWidth={2}
                      />
                      {selectedMetric === 'speed' && (
                        <Area
                          type="monotone"
                          dataKey="prediction"
                          stroke={theme.palette.secondary.main}
                          fillOpacity={1}
                          fill="url(#predictionGradient)"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                        />
                      )}
                    </AreaChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                      <XAxis 
                        dataKey="time" 
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey={selectedMetric}
                        stroke={theme.palette.primary.main}
                        strokeWidth={3}
                        dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: theme.palette.primary.main, strokeWidth: 2 }}
                      />
                      {selectedMetric === 'speed' && (
                        <Line
                          type="monotone"
                          dataKey="prediction"
                          stroke={theme.palette.secondary.main}
                          strokeWidth={2}
                          strokeDasharray="8 8"
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      )}
                    </LineChart>
                  ) : (
                    <ComposedChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                      <XAxis 
                        dataKey="time" 
                        stroke={theme.palette.text.secondary}
                        fontSize={12}
                        interval="preserveStartEnd"
                      />
                      <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="volume" fill={alpha(theme.palette.info.main, 0.6)} />
                      <Line
                        type="monotone"
                        dataKey="speed"
                        stroke={theme.palette.primary.main}
                        strokeWidth={3}
                      />
                      <Line
                        type="monotone"
                        dataKey="prediction"
                        stroke={theme.palette.secondary.main}
                        strokeWidth={2}
                        strokeDasharray="8 8"
                      />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Traffic Flow Visualizer */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <TrafficFlowVisualizer data={data} />
        </Grid>

        {/* Metrics Cards */}
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={2}>
            {[
              { 
                title: 'Average Speed', 
                value: `${latestPoint?.speed?.toFixed(1) || '0'} mph`, 
                change: getMetricChange(latestPoint?.speed || 0, previousPoint?.speed || 0),
                icon: <Speed />,
                color: 'primary' as const
              },
              { 
                title: 'Traffic Volume', 
                value: `${Math.round(latestPoint?.volume || 0)}%`, 
                change: getMetricChange(latestPoint?.volume || 0, previousPoint?.volume || 0),
                icon: <Traffic />,
                color: 'info' as const
              },
              { 
                title: 'Congestion Level', 
                value: `${Math.round(latestPoint?.congestion || 0)}%`, 
                change: getMetricChange(latestPoint?.congestion || 0, previousPoint?.congestion || 0),
                icon: <Warning />,
                color: 'warning' as const
              },
              { 
                title: 'Efficiency', 
                value: `${Math.round(latestPoint?.efficiency || 0)}%`, 
                change: getMetricChange(latestPoint?.efficiency || 0, previousPoint?.efficiency || 0),
                icon: <CheckCircle />,
                color: 'success' as const
              },
            ].map((metric, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card sx={{ 
                    height: 120,
                    background: `linear-gradient(135deg, ${alpha(theme.palette[metric.color].main, 0.1)}, ${alpha(theme.palette[metric.color].main, 0.05)})`,
                    border: `1px solid ${alpha(theme.palette[metric.color].main, 0.2)}`,
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette[metric.color].main, 0.2), width: 32, height: 32 }}>
                          {metric.icon}
                        </Avatar>
                        <Chip
                          icon={metric.change >= 0 ? <TrendingUp /> : <TrendingDown />}
                          label={`${metric.change >= 0 ? '+' : ''}${metric.change.toFixed(1)}%`}
                          color={metric.change >= 0 ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: metric.color + '.main' }}>
                        {metric.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {metric.title}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedRealTimeChart;