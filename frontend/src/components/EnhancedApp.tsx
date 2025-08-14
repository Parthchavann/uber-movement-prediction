import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Chip,
  Badge,
  Menu,
  MenuItem,
  useTheme,
  ThemeProvider,
  createTheme,
  alpha,
  CssBaseline,
  Container,
  Fab,
  Zoom,
  Paper,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Map as MapIcon,
  Analytics,
  Timeline,
  Settings,
  Notifications,
  AccountCircle,
  Brightness4,
  Brightness7,
  CloudSync,
  Speed,
  ModelTraining,
  TrendingUp,
  Fullscreen,
  Download,
  Share,
  Refresh,
  Help,
  Info,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// Import our enhanced components
import EnhancedDashboard from './EnhancedDashboard';
import EnhancedTrafficMap from './EnhancedTrafficMap';

interface NavigationItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  description: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Analytics Dashboard',
    icon: <DashboardIcon />,
    component: EnhancedDashboard,
    description: 'Real-time traffic analytics and insights',
  },
  {
    id: 'map',
    title: 'Traffic Map',
    icon: <MapIcon />,
    component: EnhancedTrafficMap,
    description: 'Interactive traffic visualization',
  },
  {
    id: 'analytics',
    title: 'Advanced Analytics',
    icon: <Analytics />,
    component: EnhancedDashboard, // Could be a separate component
    description: 'Deep dive analytics and reports',
  },
  {
    id: 'models',
    title: 'AI Models',
    icon: <ModelTraining />,
    component: EnhancedDashboard, // Could be a separate component
    description: 'Model performance and configuration',
  },
];

const EnhancedApp: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [apiStatus, setApiStatus] = useState<'healthy' | 'error' | 'offline'>('offline');
  const [realTimeMode, setRealTimeMode] = useState(true);

  // Create dynamic theme
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2563eb',
        light: '#60a5fa',
        dark: '#1d4ed8',
      },
      secondary: {
        main: '#7c3aed',
        light: '#a78bfa',
        dark: '#5b21b6',
      },
      background: {
        default: darkMode ? '#0f172a' : '#f8fafc',
        paper: darkMode ? '#1e293b' : '#ffffff',
      },
      success: {
        main: '#059669',
      },
      warning: {
        main: '#d97706',
      },
      error: {
        main: '#dc2626',
      },
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.025em',
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  // Check API status
  // Remove duplicate health checking - API status is managed by App.tsx
  // Initialize
  useEffect(() => {
    // API status will be managed by the parent App component
    setApiStatus('healthy'); // Initialize as healthy, will be updated by parent
  }, []);

  // Handle navigation
  const handleViewChange = (viewId: string) => {
    setCurrentView(viewId);
    setDrawerOpen(false);
  };

  // Get current component
  const getCurrentComponent = () => {
    const item = navigationItems.find(item => item.id === currentView);
    if (!item) return EnhancedDashboard;
    return item.component;
  };

  const CurrentComponent = getCurrentComponent();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* App Bar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            color: theme.palette.text.primary,
            zIndex: theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

            <Box display="flex" alignItems="center" gap={2} sx={{ flexGrow: 1 }}>
              <motion.div
                animate={{ rotate: realTimeMode ? [0, 360] : 0 }}
                transition={{ 
                  duration: 2, 
                  repeat: realTimeMode ? Infinity : 0, 
                  ease: "linear" 
                }}
              >
                <Avatar sx={{ 
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  width: 40,
                  height: 40
                }}>
                  <Speed />
                </Avatar>
              </motion.div>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  UberFlow Analytics
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {navigationItems.find(item => item.id === currentView)?.title}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {/* API Status */}
              <motion.div
                animate={{
                  scale: apiStatus === 'healthy' ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: apiStatus === 'healthy' ? Infinity : 0,
                }}
              >
                <Chip
                  icon={<CloudSync />}
                  label={`API ${apiStatus.toUpperCase()}`}
                  color={
                    apiStatus === 'healthy' ? 'success' : 
                    apiStatus === 'error' ? 'error' : 'warning'
                  }
                  size="small"
                  variant="outlined"
                />
              </motion.div>

              {/* Real-time Toggle */}
              <FormControlLabel
                control={
                  <Switch 
                    checked={realTimeMode} 
                    onChange={(e) => setRealTimeMode(e.target.checked)}
                    size="small"
                  />
                }
                label="Live"
                sx={{ mr: 1 }}
              />

              {/* Notifications */}
              <Badge badgeContent={notifications.length} color="error">
                <IconButton>
                  <Notifications />
                </IconButton>
              </Badge>

              {/* Dark Mode Toggle */}
              <Tooltip title="Toggle Theme">
                <IconButton onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>

              {/* User Menu */}
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                <AccountCircle />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Navigation Drawer */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              width: 280,
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(20px)',
              border: 'none',
            }
          }}
        >
          <Toolbar />
          
          <Box sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
              Navigation
            </Typography>
          </Box>

          <List sx={{ px: 2 }}>
            {navigationItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navigationItems.indexOf(item) * 0.1 }}
              >
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => handleViewChange(item.id)}
                    selected={currentView === item.id}
                    sx={{
                      borderRadius: 2,
                      '&.Mui-selected': {
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
                        '&:hover': {
                          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.secondary.main, 0.15)})`,
                        }
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: currentView === item.id ? 'primary.main' : 'text.secondary' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      secondary={item.description}
                      primaryTypographyProps={{
                        fontWeight: currentView === item.id ? 600 : 400
                      }}
                    />
                    {item.badge && (
                      <Chip 
                        label={item.badge} 
                        size="small" 
                        color="primary" 
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              </motion.div>
            ))}
          </List>

          <Divider sx={{ mx: 2, my: 2 }} />

          <List sx={{ px: 2 }}>
            <ListItem disablePadding>
              <ListItemButton sx={{ borderRadius: 2 }}>
                <ListItemIcon>
                  <Settings />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding>
              <ListItemButton sx={{ borderRadius: 2 }}>
                <ListItemIcon>
                  <Help />
                </ListItemIcon>
                <ListItemText primary="Help & Support" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            minHeight: '100vh',
            pt: { xs: 7, sm: 8 },
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{ height: '100%' }}
            >
              <CurrentComponent />
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }
          }}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>
            <AccountCircle sx={{ mr: 2 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <Settings sx={{ mr: 2 }} />
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => setAnchorEl(null)}>
            <Info sx={{ mr: 2 }} />
            About
          </MenuItem>
        </Menu>

        {/* Floating Speed Dial */}
        <SpeedDial
          ariaLabel="Quick Actions"
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24,
            '& .MuiFab-primary': {
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }
          }}
          icon={<SpeedDialIcon />}
        >
          <SpeedDialAction
            icon={<Refresh />}
            tooltipTitle="Refresh Data"
            onClick={() => window.location.reload()}
          />
          <SpeedDialAction
            icon={<Download />}
            tooltipTitle="Export Data"
            onClick={() => {/* Export functionality */}}
          />
          <SpeedDialAction
            icon={<Share />}
            tooltipTitle="Share Dashboard"
            onClick={() => {/* Share functionality */}}
          />
          <SpeedDialAction
            icon={<Fullscreen />}
            tooltipTitle="Fullscreen"
            onClick={() => {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
              }
            }}
          />
        </SpeedDial>

        {/* Global Styles */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
          
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}</style>
      </Box>
    </ThemeProvider>
  );
};

export default EnhancedApp;