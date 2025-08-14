import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  Container,
  Chip,
  CircularProgress,
  Avatar,
  Badge,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Fab,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Speed,
  Analytics,
  Map as MapIcon,
  Notifications,
  Brightness4,
  Brightness7,
  Refresh,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  LocationOn,
  Download,
  Share,
  Settings,
  Info,
  PlayArrow,
  Pause,
  AutorenewRounded
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// Import components
import Dashboard from './components/Dashboard';
import EnhancedDashboardWithFilters from './components/EnhancedDashboardWithFilters';
import EnhancedAdvancedAnalytics from './components/EnhancedAdvancedAnalytics';
import TrafficMap from './components/TrafficMap';
import { exportAsJSON, exportAsCSV, exportSummary, ExportData } from './utils/exportUtils';

const createAppTheme = (darkMode: boolean) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: '#2563eb',
    },
    secondary: {
      main: '#7c3aed',
    },
    background: {
      default: darkMode ? '#0a0a0a' : '#f8fafc',
      paper: darkMode ? '#1a1a1a' : '#ffffff',
    },
    text: {
      primary: darkMode ? '#ffffff' : '#1a202c',
      secondary: darkMode ? '#a0aec0' : '#4a5568',
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontWeight: 700, color: darkMode ? '#ffffff' : '#1a202c' },
    h2: { fontWeight: 600, color: darkMode ? '#ffffff' : '#1a202c' },
    h3: { fontWeight: 600, color: darkMode ? '#ffffff' : '#1a202c' },
    h4: { fontWeight: 600, color: darkMode ? '#ffffff' : '#1a202c' },
    h5: { fontWeight: 600, color: darkMode ? '#ffffff' : '#1a202c' },
    h6: { fontWeight: 600, color: darkMode ? '#ffffff' : '#1a202c' },
    body1: { color: darkMode ? '#e2e8f0' : '#2d3748' },
    body2: { color: darkMode ? '#cbd5e0' : '#4a5568' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: darkMode 
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' 
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: 'inherit',
        },
      },
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [apiStatus, setApiStatus] = useState('offline');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [realTimeMode, setRealTimeMode] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Check API status with timeout and stable state management
  const checkApiStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('http://localhost:8000/health', {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const currentStatus = apiStatus;
        setApiStatus('healthy');
        setLastUpdate(new Date());
        
        // Add success notification if status changed
        if (currentStatus !== 'healthy') {
          setNotifications(prev => [...prev, {
            id: Date.now(),
            type: 'success',
            message: 'API connection restored'
          }]);
        }
      } else {
        const currentStatus = apiStatus;
        setApiStatus('error');
        if (currentStatus === 'healthy') {
          setNotifications(prev => [...prev, {
            id: Date.now(),
            type: 'error',
            message: 'API connection error'
          }]);
        }
      }
    } catch (error) {
      const currentStatus = apiStatus;
      // Don't change status if it's just a timeout during healthy state
      if ((error as any).name === 'AbortError' && currentStatus === 'healthy') {
        return; // Keep current healthy status for timeout errors
      }
      
      setApiStatus('offline');
      if (currentStatus === 'healthy') {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'warning',
          message: 'API server offline'
        }]);
      }
    }
  };

  useEffect(() => {
    checkApiStatus();
    setIsLoading(false);
    
    // Set up real-time health checks - reduced frequency to prevent flickering
    const healthInterval = setInterval(checkApiStatus, realTimeMode ? 30000 : 60000);
    
    return () => clearInterval(healthInterval);
  }, [realTimeMode]);

  // Auto-remove notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const StatusChip = () => (
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
      variant="outlined"
      size="small"
    />
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'map':
        return <TrafficMap selectedCity={selectedCity} />;
      case 'enhanced':
        return <EnhancedAdvancedAnalytics />;
      default:
        return <Dashboard selectedCity={selectedCity} />;
    }
  };

  const cities = [
    { id: 'all', name: 'All Cities', icon: '🌍' },
    { id: 'san_francisco', name: 'San Francisco', icon: '🌉' },
    { id: 'new_york', name: 'New York', icon: '🗽' },
    { id: 'london', name: 'London', icon: '🇬🇧' }
  ];

  const getCityName = (cityId: string) => {
    return cities.find(c => c.id === cityId)?.name || 'All Cities';
  };

  const getCityIcon = (cityId: string) => {
    return cities.find(c => c.id === cityId)?.icon || '🌍';
  };

  // Export functionality
  const handleExport = async () => {
    try {
      // Fetch current data for export
      const [predictionsRes, citiesRes, metricsRes] = await Promise.allSettled([
        fetch('http://localhost:8000/predictions?limit=100'),
        fetch('http://localhost:8000/cities'),
        fetch('http://localhost:8000/analytics/metrics')
      ]);

      const exportData: ExportData = {
        predictions: predictionsRes.status === 'fulfilled' && predictionsRes.value.ok 
          ? await predictionsRes.value.json() : [],
        cities: citiesRes.status === 'fulfilled' && citiesRes.value.ok 
          ? await citiesRes.value.json() : [],
        metrics: metricsRes.status === 'fulfilled' && metricsRes.value.ok 
          ? await metricsRes.value.json() : {},
        timestamp: new Date().toISOString(),
        selectedCity
      };

      // Export summary by default
      exportSummary(exportData);
      
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'success',
        message: 'Dashboard data exported successfully!'
      }]);

    } catch (error) {
      console.error('Export error:', error);
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: 'Failed to export data. Please try again.'
      }]);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  const theme = createAppTheme(darkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
        {/* Header */}
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
              <Speed />
            </Avatar>
            
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
              UberFlow Analytics Dashboard
            </Typography>

            <Box display="flex" alignItems="center" gap={2}>
              {/* City Selector */}
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Location</InputLabel>
                <Select
                  value={selectedCity}
                  label="Location"
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  {cities.map(city => (
                    <MenuItem key={city.id} value={city.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <span>{city.icon}</span>
                        <Typography>{city.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <StatusChip />
              
              {/* Real-time Toggle */}
              <FormControlLabel
                control={
                  <Switch 
                    checked={realTimeMode} 
                    onChange={(e) => setRealTimeMode(e.target.checked)}
                    size="small"
                    icon={<Pause />}
                    checkedIcon={<PlayArrow />}
                  />
                }
                label={realTimeMode ? "Live" : "Paused"}
              />
              
              {/* Last Update */}
              <Tooltip title={`Last updated: ${lastUpdate.toLocaleTimeString()}`}>
                <Chip 
                  icon={<AutorenewRounded />}
                  label={lastUpdate.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  variant="outlined"
                  size="small"
                />
              </Tooltip>
              
              {/* Notifications */}
              <Badge badgeContent={notifications.length} color="error">
                <IconButton size="small">
                  <Notifications />
                </IconButton>
              </Badge>
              
              {/* Theme Toggle */}
              <Tooltip title="Toggle Theme">
                <IconButton onClick={() => setDarkMode(!darkMode)} size="small">
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
              
              {/* Manual Refresh */}
              <Tooltip title="Refresh Data">
                <IconButton onClick={checkApiStatus} size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Status Banner */}
        {apiStatus !== 'healthy' && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <Box sx={{ 
              bgcolor: apiStatus === 'error' ? 'error.main' : 'warning.main',
              color: 'white',
              py: 1,
              textAlign: 'center'
            }}>
              <Typography variant="body2">
                {apiStatus === 'error' ? '⚠️ API Connection Issues - Some features may be limited' : '🔄 Connecting to API...'}
              </Typography>
            </Box>
          </motion.div>
        )}

        {/* Navigation */}
        <Container maxWidth="xl" sx={{ py: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" gap={2}>
              <Chip
                icon={<DashboardIcon />}
                label="Basic Dashboard"
                onClick={() => setCurrentView('dashboard')}
                color={currentView === 'dashboard' ? 'primary' : 'default'}
                variant={currentView === 'dashboard' ? 'filled' : 'outlined'}
                clickable
              />
              <Chip
                icon={<Analytics />}
                label="Advanced Analytics"
                onClick={() => setCurrentView('enhanced')}
                color={currentView === 'enhanced' ? 'primary' : 'default'}
                variant={currentView === 'enhanced' ? 'filled' : 'outlined'}
                clickable
              />
              <Chip
                icon={<MapIcon />}
                label="Traffic Map"
                onClick={() => setCurrentView('map')}
                color={currentView === 'map' ? 'primary' : 'default'}
                variant={currentView === 'map' ? 'filled' : 'outlined'}
                clickable
              />
            </Box>
            
            {/* Quick Stats */}
            <Box display="flex" gap={2} alignItems="center">
              <Chip
                label={`${getCityIcon(selectedCity)} ${getCityName(selectedCity)}`}
                variant="outlined"
                size="small"
              />
              {realTimeMode && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Chip 
                    icon={<PlayArrow />} 
                    label="LIVE" 
                    color="success" 
                    size="small"
                  />
                </motion.div>
              )}
            </Box>
          </Box>
        </Container>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ pb: 4 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </Container>

        {/* Footer */}
        <Box component="footer" sx={{ py: 3, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            UberFlow Analytics • Real-time Traffic Intelligence • Powered by AI
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            📍 {getCityName(selectedCity)} • 🔄 {realTimeMode ? 'Live Mode' : 'Static Mode'} • 🕒 Updated {lastUpdate.toLocaleTimeString()}
          </Typography>
        </Box>

        {/* Floating Action Buttons */}
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Tooltip title="Export Data">
            <Fab 
              color="primary" 
              size="medium"
              onClick={handleExport}
            >
              <Download />
            </Fab>
          </Tooltip>
          
          <Tooltip title="Share Dashboard">
            <Fab 
              color="secondary" 
              size="medium"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setNotifications(prev => [...prev, {
                  id: Date.now(),
                  type: 'success',
                  message: 'Dashboard URL copied to clipboard!'
                }]);
              }}
            >
              <Share />
            </Fab>
          </Tooltip>
        </Box>

        {/* Notifications */}
        {notifications.map((notification, index) => (
          <Snackbar
            key={notification.id}
            open={true}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            sx={{ top: `${80 + index * 70}px !important` }}
          >
            <Alert 
              severity={notification.type}
              variant="filled"
              onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        ))}
      </Box>
    </ThemeProvider>
  );
}

export default App;
