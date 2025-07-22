import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Avatar,
  Chip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  Settings,
  Brightness7,
  Brightness4,
  AccountCircle,
  TrendingUp,
  Speed,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface HeaderProps {
  darkMode: boolean;
  onDarkModeToggle: () => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  darkMode,
  onDarkModeToggle,
  sidebarOpen,
  onSidebarToggle,
  selectedCity,
  onCityChange,
}) => {
  
  const cities = [
    { id: 'all', name: 'All Cities', emoji: '🌍' },
    { id: 'san_francisco', name: 'San Francisco', emoji: '🌉' },
    { id: 'new_york', name: 'New York', emoji: '🗽' },
    { id: 'london', name: 'London', emoji: '🇬🇧' },
  ];
  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        backgroundColor: 'transparent',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
        zIndex: 1200,
      }}
    >
      <Toolbar sx={{ px: 3 }}>
        <IconButton
          edge="start"
          onClick={onSidebarToggle}
          sx={{ mr: 2, color: 'text.primary' }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
                background: darkMode 
                  ? 'linear-gradient(45deg, #00bcd4, #33c9dc)'
                  : 'linear-gradient(45deg, #1976d2, #42a5f5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mr: 3,
              }}
            >
              🌊 FlowCast AI
            </Typography>
            
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 180, 
                mr: 2,
                '& .MuiOutlinedInput-root': {
                  background: alpha(darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', 0.8),
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                }
              }}
            >
              <InputLabel>🌍 City</InputLabel>
              <Select
                value={selectedCity}
                label="🌍 City"
                onChange={(e) => onCityChange(e.target.value)}
                sx={{
                  color: 'text.primary',
                  '& .MuiSelect-icon': {
                    color: 'text.primary',
                  },
                }}
              >
                {cities.map((city) => (
                  <MenuItem key={city.id} value={city.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{city.emoji}</span>
                      <span>{city.name}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </motion.div>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Chip
              icon={<TrendingUp />}
              label="System Active"
              color="success"
              variant="outlined"
              size="small"
              sx={{ 
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
                fontWeight: 500,
              }}
            />
            <Chip
              icon={<Speed />}
              label="Models Online"
              color="primary"
              variant="outlined"
              size="small"
              sx={{ 
                borderRadius: 2,
                backdropFilter: 'blur(10px)',
                fontWeight: 500,
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={onDarkModeToggle}
                icon={<Brightness7 sx={{ fontSize: 16 }} />}
                checkedIcon={<Brightness4 sx={{ fontSize: 16 }} />}
                sx={{
                  '& .MuiSwitch-thumb': {
                    background: darkMode 
                      ? 'linear-gradient(45deg, #00bcd4, #33c9dc)'
                      : 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  },
                }}
              />
            }
            label=""
            sx={{ mr: 1 }}
          />

          <IconButton
            sx={{ 
              color: 'text.primary',
              '&:hover': { background: 'rgba(255,255,255,0.1)' }
            }}
          >
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton
            sx={{ 
              color: 'text.primary',
              '&:hover': { background: 'rgba(255,255,255,0.1)' }
            }}
          >
            <Settings />
          </IconButton>

          <Avatar
            sx={{
              width: 32,
              height: 32,
              ml: 1,
              background: darkMode 
                ? 'linear-gradient(45deg, #00bcd4, #33c9dc)'
                : 'linear-gradient(45deg, #1976d2, #42a5f5)',
            }}
          >
            <AccountCircle />
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;