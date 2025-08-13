import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';

interface TrafficMapProps {
  selectedCity?: string;
}

const TrafficMap: React.FC<TrafficMapProps> = ({ selectedCity = 'san_francisco' }) => {
  const theme = useTheme();
  const [segments] = useState([
    { id: 0, city: selectedCity, speed: 24.8, prediction: 26.1 },
    { id: 1, city: selectedCity, speed: 18.3, prediction: 19.7 },
    { id: 2, city: selectedCity, speed: 31.2, prediction: 29.8 },
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card sx={{ height: 600, position: 'relative', overflow: 'hidden' }}>
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {selectedCity === 'san_francisco' ? 'San Francisco Traffic Map' :
             selectedCity === 'new_york' ? 'New York Traffic Map' :
             selectedCity === 'london' ? 'London Traffic Map' : 
             'Traffic Map'}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Chip 
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
          </Box>

          {/* Mock Map */}
          <Box
            sx={{
              flexGrow: 1,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
                : 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Typography variant="h4" sx={{ color: 'white', opacity: 0.8 }}>
              🗺️ Interactive Traffic Map
            </Typography>
            
            {/* Mock segments */}
            {segments.map((segment, index) => (
              <Box
                key={segment.id}
                sx={{
                  position: 'absolute',
                  top: `${20 + index * 30}%`,
                  left: `${10 + index * 25}%`,
                  width: 40,
                  height: 8,
                  background: segment.speed < 20 ? theme.palette.error.main : 
                            segment.speed < 30 ? theme.palette.warning.main : 
                            theme.palette.success.main,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: 'white', fontSize: '0.6rem' }}>
                  {segment.speed.toFixed(0)}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TrafficMap;