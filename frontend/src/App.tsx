import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Grid, AppBar, Toolbar, Typography, IconButton, Switch, FormControlLabel } from '@mui/material';
import { Dashboard, Traffic, Speed, Analytics, Settings, Brightness7, Brightness4 } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Import custom components
import DashboardComponent from './components/Dashboard';
import TrafficMap from './components/TrafficMap';
import PredictionPanel from './components/PredictionPanel';
import MetricsOverview from './components/MetricsOverview';
import RealTimeChart from './components/RealTimeChart';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import './App.css';

// Custom theme
const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#00bcd4' : '#1976d2',
      light: mode === 'dark' ? '#33c9dc' : '#42a5f5',
      dark: mode === 'dark' ? '#00acc1' : '#1565c0',
    },
    secondary: {
      main: mode === 'dark' ? '#ff6b35' : '#ff9800',
    },
    background: {
      default: mode === 'dark' ? '#0a0e27' : '#f5f7fa',
      paper: mode === 'dark' ? '#1a1d3a' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#ffffff' : '#2c3e50',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 500,
      letterSpacing: '-0.015em',
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          background: mode === 'dark' 
            ? 'linear-gradient(145deg, rgba(26, 29, 58, 0.8), rgba(26, 29, 58, 0.6))'
            : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7))',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: mode === 'dark' 
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');

  const theme = getTheme(darkMode ? 'dark' : 'light');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Dashboard />, component: DashboardComponent },
    { id: 'map', label: 'Traffic Map', icon: <Traffic />, component: TrafficMap },
    { id: 'predictions', label: 'Predictions', icon: <Speed />, component: PredictionPanel },
    { id: 'analytics', label: 'Analytics', icon: <Analytics />, component: RealTimeChart },
  ];
  
  // Create component with props
  const renderCurrentComponent = () => {
    const currentMenuItem = menuItems.find(item => item.id === currentView);
    const Component = currentMenuItem?.component || DashboardComponent;
    
    // Pass selectedCity prop to components that need it
    const componentProps = ['dashboard', 'map', 'predictions'].includes(currentView) 
      ? { selectedCity } 
      : {};
    
    return React.createElement(Component, componentProps);
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <Sidebar 
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentView={currentView}
          onViewChange={setCurrentView}
          menuItems={menuItems}
        />

        {/* Main Content */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          background: darkMode 
            ? 'linear-gradient(135deg, #0a0e27 0%, #1a1d3a 50%, #2a2d5a 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          minHeight: '100vh',
        }}>
          {/* Header */}
          <Header 
            darkMode={darkMode}
            onDarkModeToggle={() => setDarkMode(!darkMode)}
            sidebarOpen={sidebarOpen}
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
          />

          {/* Main Dashboard Content */}
          <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ height: '100%' }}
              >
                {renderCurrentComponent()}
              </motion.div>
            </AnimatePresence>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
