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
} from '@mui/material';
import {
  Timeline,
  ShowChart,
  BarChart,
  Refresh,
  PlayArrow,
  Pause,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

interface DataPoint {
  time: string;
  speed: number;
  prediction: number;
  segment1: number;
  segment2: number;
  segment3: number;
  rush_hour: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const theme = useTheme();
  
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          background: theme.palette.mode === 'dark' 
            ? 'rgba(26, 29, 58, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          borderRadius: 2,
          p: 2,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: entry.color,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {entry.name}:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {entry.value.toFixed(1)} mph
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

const RealTimeChart: React.FC = () => {
  const theme = useTheme();
  const [chartType, setChartType] = useState('line');
  const [isPlaying, setIsPlaying] = useState(true);
  const [data, setData] = useState<DataPoint[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate initial data
  useEffect(() => {
    const generateInitialData = () => {
      const now = new Date();
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 1;
      const interval = timeRange === '24h' ? 1 : timeRange === '7d' ? 6 : 0.25;
      
      const newData: DataPoint[] = [];
      
      for (let i = hours; i >= 0; i -= interval) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = time.getHours();
        const isRushHour = hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19;
        
        // Base speed with rush hour and random variations
        let baseSpeed = 25;
        if (isRushHour) baseSpeed *= 0.7;
        if (time.getDay() === 0 || time.getDay() === 6) baseSpeed *= 1.15;
        
        const speed = Math.max(5, Math.min(50, baseSpeed + Math.sin(hour / 24 * Math.PI * 2) * 5 + (Math.random() - 0.5) * 8));
        const prediction = speed + (Math.random() - 0.5) * 3;
        
        newData.push({
          time: timeRange === '1h' ? time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                timeRange === '24h' ? time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          speed: Math.round(speed * 10) / 10,
          prediction: Math.round(prediction * 10) / 10,
          segment1: Math.max(5, Math.min(50, speed + (Math.random() - 0.5) * 6)),
          segment2: Math.max(5, Math.min(50, speed + (Math.random() - 0.5) * 6)),
          segment3: Math.max(5, Math.min(50, speed + (Math.random() - 0.5) * 6)),
          rush_hour: isRushHour,
        });
      }
      
      return newData.slice(-50); // Keep last 50 points for performance
    };

    setData(generateInitialData());
  }, [timeRange]);

  // Real-time updates
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setData(prevData => {
          const now = new Date();
          const hour = now.getHours();
          const isRushHour = hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19;
          
          let baseSpeed = 25;
          if (isRushHour) baseSpeed *= 0.7;
          if (now.getDay() === 0 || now.getDay() === 6) baseSpeed *= 1.15;
          
          const speed = Math.max(5, Math.min(50, baseSpeed + Math.sin(hour / 24 * Math.PI * 2) * 5 + (Math.random() - 0.5) * 8));
          const prediction = speed + (Math.random() - 0.5) * 3;
          
          const newPoint: DataPoint = {
            time: timeRange === '1h' ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                  now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            speed: Math.round(speed * 10) / 10,
            prediction: Math.round(prediction * 10) / 10,
            segment1: Math.max(5, Math.min(50, speed + (Math.random() - 0.5) * 6)),
            segment2: Math.max(5, Math.min(50, speed + (Math.random() - 0.5) * 6)),
            segment3: Math.max(5, Math.min(50, speed + (Math.random() - 0.5) * 6)),
            rush_hour: isRushHour,
          };
          
          return [...prevData.slice(-49), newPoint];
        });
      }, timeRange === '1h' ? 2000 : 5000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, timeRange]);

  const handleChartTypeChange = (event: React.MouseEvent<HTMLElement>, newType: string) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const handleTimeRangeChange = (event: React.MouseEvent<HTMLElement>, newRange: string) => {
    if (newRange !== null) {
      setTimeRange(newRange);
    }
  };

  const currentSpeed = data.length > 0 ? data[data.length - 1].speed : 0;
  const previousSpeed = data.length > 1 ? data[data.length - 2].speed : currentSpeed;
  const speedChange = currentSpeed - previousSpeed;

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
            <XAxis 
              dataKey="time" 
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.2) }}
            />
            <YAxis 
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.2) }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="speed"
              stroke={theme.palette.primary.main}
              fillOpacity={1}
              fill="url(#speedGradient)"
              strokeWidth={2}
              name="Actual Speed"
            />
            <Area
              type="monotone"
              dataKey="prediction"
              stroke={theme.palette.secondary.main}
              fillOpacity={1}
              fill="url(#predictionGradient)"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Predicted Speed"
            />
            <ReferenceLine y={20} stroke={theme.palette.warning.main} strokeDasharray="3 3" label="Congestion Threshold" />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <RechartsBarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
            <XAxis 
              dataKey="time" 
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.2) }}
            />
            <YAxis 
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.2) }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="speed" fill={theme.palette.primary.main} name="Actual Speed" radius={[2, 2, 0, 0]} />
            <Bar dataKey="prediction" fill={theme.palette.secondary.main} name="Predicted Speed" radius={[2, 2, 0, 0]} />
          </RechartsBarChart>
        );
      
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
            <XAxis 
              dataKey="time" 
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.2) }}
            />
            <YAxis 
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              axisLine={{ stroke: alpha(theme.palette.divider, 0.2) }}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="speed"
              stroke={theme.palette.primary.main}
              strokeWidth={3}
              dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: theme.palette.primary.main }}
              name="Actual Speed"
            />
            <Line
              type="monotone"
              dataKey="prediction"
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: theme.palette.secondary.main, strokeWidth: 2, r: 3 }}
              name="Predicted Speed"
            />
            <Line
              type="monotone"
              dataKey="segment1"
              stroke={alpha(theme.palette.info.main, 0.6)}
              strokeWidth={1}
              dot={false}
              name="Segment 1"
            />
            <Line
              type="monotone"
              dataKey="segment2"
              stroke={alpha(theme.palette.success.main, 0.6)}
              strokeWidth={1}
              dot={false}
              name="Segment 2"
            />
            <Line
              type="monotone"
              dataKey="segment3"
              stroke={alpha(theme.palette.warning.main, 0.6)}
              strokeWidth={1}
              dot={false}
              name="Segment 3"
            />
            <ReferenceLine y={20} stroke={theme.palette.error.main} strokeDasharray="3 3" label="Congestion Threshold" />
          </LineChart>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card sx={{ height: 500 }}>
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Real-time Traffic Analysis
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  icon={speedChange >= 0 ? <TrendingUp /> : <TrendingDown />}
                  label={`${currentSpeed.toFixed(1)} mph`}
                  color={speedChange >= 0 ? 'success' : 'warning'}
                  variant="outlined"
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  Current average speed
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ToggleButtonGroup
                value={timeRange}
                exclusive
                onChange={handleTimeRangeChange}
                size="small"
              >
                <ToggleButton value="1h">1H</ToggleButton>
                <ToggleButton value="24h">24H</ToggleButton>
                <ToggleButton value="7d">7D</ToggleButton>
              </ToggleButtonGroup>
              
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={handleChartTypeChange}
                size="small"
              >
                <ToggleButton value="line">
                  <ShowChart />
                </ToggleButton>
                <ToggleButton value="area">
                  <Timeline />
                </ToggleButton>
                <ToggleButton value="bar">
                  <BarChart />
                </ToggleButton>
              </ToggleButtonGroup>
              
              <IconButton
                onClick={() => setIsPlaying(!isPlaying)}
                color={isPlaying ? 'primary' : 'default'}
                size="small"
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              
              <IconButton size="small">
                <Refresh />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AnimatePresence mode="wait">
                <motion.div
                  key={chartType}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%', height: '100%' }}
                >
                  {renderChart()}
                </motion.div>
              </AnimatePresence>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RealTimeChart;