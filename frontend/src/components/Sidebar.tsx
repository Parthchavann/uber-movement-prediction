import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ChevronLeft,
  Dashboard,
  Traffic,
  Speed,
  Analytics,
  Help,
  Info,
} from '@mui/icons-material';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
  menuItems: MenuItem[];
}

const DRAWER_WIDTH = 280;

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onToggle,
  currentView,
  onViewChange,
  menuItems,
}) => {
  const theme = useTheme();

  const sidebarVariants: Variants = {
    open: { x: 0 },
    closed: { x: -DRAWER_WIDTH },
  };

  const transition = { type: 'spring' as const, stiffness: 300, damping: 30 };

  return (
    <motion.div
      variants={sidebarVariants}
      animate={open ? 'open' : 'closed'}
      transition={transition}
      style={{ position: 'relative', zIndex: 1300 }}
    >
      <Drawer
        variant="persistent"
        anchor="left"
        open={open}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(180deg, rgba(10, 14, 39, 0.95) 0%, rgba(26, 29, 58, 0.95) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: theme.palette.mode === 'dark' 
              ? '4px 0 20px rgba(0, 0, 0, 0.3)'
              : '4px 0 20px rgba(0, 0, 0, 0.05)',
          },
        }}
      >
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: 3,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #00bcd4, #33c9dc)'
                  : 'linear-gradient(135deg, #1976d2, #42a5f5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                boxShadow: '0 8px 20px rgba(0, 188, 212, 0.3)',
              }}
            >
              <Typography variant="h4" sx={{ color: 'white' }}>
                🌊
              </Typography>
            </Box>
          </motion.div>
          
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: 'text.primary',
              mb: 1,
            }}
          >
            FlowCast AI
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontWeight: 500,
            }}
          >
            Predictive Traffic Management
          </Typography>
        </Box>

        <Divider sx={{ mx: 2, opacity: 0.3 }} />

        <List sx={{ px: 2, py: 1 }}>
          <AnimatePresence>
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => onViewChange(item.id)}
                    selected={currentView === item.id}
                    sx={{
                      borderRadius: 2,
                      minHeight: 48,
                      background: currentView === item.id
                        ? theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(0, 188, 212, 0.2), rgba(51, 201, 220, 0.1))'
                          : 'linear-gradient(135deg, rgba(25, 118, 210, 0.1), rgba(66, 165, 245, 0.05))'
                        : 'transparent',
                      border: currentView === item.id 
                        ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                        : '1px solid transparent',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.04)',
                        transform: 'translateX(4px)',
                      },
                      '&.Mui-selected': {
                        '&:hover': {
                          background: currentView === item.id
                            ? theme.palette.mode === 'dark'
                              ? 'linear-gradient(135deg, rgba(0, 188, 212, 0.25), rgba(51, 201, 220, 0.15))'
                              : 'linear-gradient(135deg, rgba(25, 118, 210, 0.15), rgba(66, 165, 245, 0.1))'
                            : 'transparent',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: currentView === item.id 
                          ? 'primary.main' 
                          : 'text.secondary',
                        minWidth: 40,
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontWeight: currentView === item.id ? 600 : 500,
                          color: currentView === item.id 
                            ? 'primary.main' 
                            : 'text.primary',
                          transition: 'all 0.3s ease',
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>

        <Box sx={{ flexGrow: 1 }} />

        <Divider sx={{ mx: 2, opacity: 0.3 }} />

        <List sx={{ px: 2, py: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              sx={{
                borderRadius: 2,
                minHeight: 40,
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
                <Help />
              </ListItemIcon>
              <ListItemText
                primary="Help & Support"
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              sx={{
                borderRadius: 2,
                minHeight: 40,
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
                <Info />
              </ListItemIcon>
              <ListItemText
                primary="About"
                sx={{
                  '& .MuiListItemText-primary': {
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
            }}
          >
            v1.0.0 • FlowCast AI Platform
          </Typography>
        </Box>
      </Drawer>
    </motion.div>
  );
};

export default Sidebar;