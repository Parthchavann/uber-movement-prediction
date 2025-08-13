import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  ButtonGroup,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  ExpandMore,
  FilterList,
  Clear,
  Refresh,
  LocationOn,
  Schedule,
  Speed,
  Segment,
  DirectionsCar,
  TrendingUp,
  TrendingDown,
  Remove
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterOptions {
  cities: string[];
  speedRange: [number, number];
  timeRange: {
    start: string;
    end: string;
  };
  rushHourOnly: boolean;
  dayOfWeek: number[];
  segmentIds: number[];
  confidenceThreshold: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  limit: number;
  trafficStatus: string[];
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableCities: Array<{id: string, name: string, country: string}>;
  totalResults: number;
  isLoading?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  filters, 
  onFiltersChange, 
  availableCities, 
  totalResults,
  isLoading = false 
}) => {
  const [expanded, setExpanded] = useState<string | false>('cities');
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.cities.length > 0 && !filters.cities.includes('all')) count++;
    if (filters.speedRange[0] > 0 || filters.speedRange[1] < 70) count++;
    if (filters.rushHourOnly) count++;
    if (filters.dayOfWeek.length > 0 && filters.dayOfWeek.length < 7) count++;
    if (filters.segmentIds.length > 0) count++;
    if (filters.confidenceThreshold > 0) count++;
    if (filters.trafficStatus.length > 0 && filters.trafficStatus.length < 3) count++;
    
    setActiveFiltersCount(count);
  }, [filters]);

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const resetFilters = () => {
    onFiltersChange({
      cities: [],
      speedRange: [0, 70],
      timeRange: { start: '00:00', end: '23:59' },
      rushHourOnly: false,
      dayOfWeek: [],
      segmentIds: [],
      confidenceThreshold: 0,
      sortBy: 'timestamp',
      sortOrder: 'desc',
      limit: 100,
      trafficStatus: []
    });
  };

  const speedMarks = [
    { value: 0, label: '0 mph' },
    { value: 20, label: '20 mph' },
    { value: 40, label: '40 mph' },
    { value: 70, label: '70+ mph' }
  ];

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const trafficStatuses = [
    { value: 'normal', label: 'Normal', color: '#4caf50' },
    { value: 'congested', label: 'Congested', color: '#ff9800' },
    { value: 'heavy', label: 'Heavy Traffic', color: '#f44336' }
  ];

  const sortOptions = [
    { value: 'timestamp', label: 'Time' },
    { value: 'predicted_speed', label: 'Speed' },
    { value: 'city', label: 'City' },
    { value: 'segment_id', label: 'Segment' }
  ];

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Badge badgeContent={activeFiltersCount} color="primary">
              <FilterList />
            </Badge>
            <Typography variant="h6" fontWeight={600}>
              Advanced Filters
            </Typography>
            {totalResults > 0 && (
              <Chip 
                label={`${totalResults} results`} 
                size="small" 
                variant="outlined"
                color="primary"
              />
            )}
          </Box>
          
          <Box display="flex" gap={1}>
            <Button 
              size="small" 
              onClick={resetFilters}
              startIcon={<Clear />}
              disabled={activeFiltersCount === 0}
            >
              Clear All
            </Button>
            <Button 
              size="small" 
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Cities Filter */}
        <Accordion 
          expanded={expanded === 'cities'} 
          onChange={handleAccordionChange('cities')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <LocationOn color="primary" />
              <Typography>Cities</Typography>
              {filters.cities.length > 0 && !filters.cities.includes('all') && (
                <Chip label={filters.cities.length} size="small" color="primary" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormControl fullWidth>
              <InputLabel>Select Cities</InputLabel>
              <Select
                multiple
                value={filters.cities.includes('all') ? ['all'] : filters.cities}
                onChange={(e) => {
                  const value = e.target.value as string[];
                  if (value.includes('all')) {
                    onFiltersChange({ ...filters, cities: ['all'] });
                  } else {
                    onFiltersChange({ ...filters, cities: value });
                  }
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const city = availableCities.find(c => c.id === value);
                      return (
                        <Chip
                          key={value}
                          label={value === 'all' ? 'All Cities' : city?.name || value}
                          size="small"
                          onDelete={value !== 'all' ? () => {
                            const newCities = filters.cities.filter(c => c !== value);
                            onFiltersChange({ ...filters, cities: newCities });
                          } : undefined}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                <MenuItem value="all">🌍 All Cities</MenuItem>
                {availableCities.map((city) => (
                  <MenuItem key={city.id} value={city.id}>
                    📍 {city.name}, {city.country}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>

        {/* Speed Range Filter */}
        <Accordion 
          expanded={expanded === 'speed'} 
          onChange={handleAccordionChange('speed')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Speed color="primary" />
              <Typography>Speed Range</Typography>
              {(filters.speedRange[0] > 0 || filters.speedRange[1] < 70) && (
                <Chip 
                  label={`${filters.speedRange[0]}-${filters.speedRange[1]} mph`}
                  size="small" 
                  color="primary" 
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" gutterBottom>
                Filter predictions by speed range (mph)
              </Typography>
              <Slider
                value={filters.speedRange}
                onChange={(e, newValue) => onFiltersChange({ ...filters, speedRange: newValue as [number, number] })}
                valueLabelDisplay="auto"
                marks={speedMarks}
                min={0}
                max={70}
                sx={{ mt: 3 }}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Time Range Filter */}
        <Accordion 
          expanded={expanded === 'time'} 
          onChange={handleAccordionChange('time')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Schedule color="primary" />
              <Typography>Time Range</Typography>
              {filters.rushHourOnly && (
                <Chip label="Rush Hour Only" size="small" color="warning" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.rushHourOnly}
                    onChange={(e) => onFiltersChange({ ...filters, rushHourOnly: e.target.checked })}
                  />
                }
                label="Rush Hour Only (7-9 AM, 5-7 PM)"
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={filters.timeRange.start}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    timeRange: { ...filters.timeRange, start: e.target.value }
                  })}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={filters.timeRange.end}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    timeRange: { ...filters.timeRange, end: e.target.value }
                  })}
                  fullWidth
                  size="small"
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Days of Week Filter */}
        <Accordion 
          expanded={expanded === 'days'} 
          onChange={handleAccordionChange('days')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <DirectionsCar color="primary" />
              <Typography>Days of Week</Typography>
              {filters.dayOfWeek.length > 0 && filters.dayOfWeek.length < 7 && (
                <Chip label={`${filters.dayOfWeek.length} days`} size="small" color="primary" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {daysOfWeek.map((day) => (
                <Chip
                  key={day.value}
                  label={day.label}
                  clickable
                  color={filters.dayOfWeek.includes(day.value) ? 'primary' : 'default'}
                  variant={filters.dayOfWeek.includes(day.value) ? 'filled' : 'outlined'}
                  onClick={() => {
                    const newDays = filters.dayOfWeek.includes(day.value)
                      ? filters.dayOfWeek.filter(d => d !== day.value)
                      : [...filters.dayOfWeek, day.value];
                    onFiltersChange({ ...filters, dayOfWeek: newDays });
                  }}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Traffic Status Filter */}
        <Accordion 
          expanded={expanded === 'status'} 
          onChange={handleAccordionChange('status')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUp color="primary" />
              <Typography>Traffic Status</Typography>
              {filters.trafficStatus.length > 0 && filters.trafficStatus.length < 3 && (
                <Chip label={`${filters.trafficStatus.length} types`} size="small" color="primary" />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {trafficStatuses.map((status) => (
                <Chip
                  key={status.value}
                  label={status.label}
                  clickable
                  sx={{ 
                    bgcolor: filters.trafficStatus.includes(status.value) ? status.color : 'transparent',
                    color: filters.trafficStatus.includes(status.value) ? 'white' : status.color,
                    borderColor: status.color
                  }}
                  variant="outlined"
                  onClick={() => {
                    const newStatuses = filters.trafficStatus.includes(status.value)
                      ? filters.trafficStatus.filter(s => s !== status.value)
                      : [...filters.trafficStatus, status.value];
                    onFiltersChange({ ...filters, trafficStatus: newStatuses });
                  }}
                />
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Advanced Options */}
        <Accordion 
          expanded={expanded === 'advanced'} 
          onChange={handleAccordionChange('advanced')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Segment color="primary" />
              <Typography>Advanced Options</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Segment IDs (comma separated)"
                value={filters.segmentIds.join(', ')}
                onChange={(e) => {
                  const ids = e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                  onFiltersChange({ ...filters, segmentIds: ids });
                }}
                fullWidth
                size="small"
                helperText="Enter specific segment IDs"
              />
              <FormControl fullWidth size="small">
                <InputLabel>Results Limit</InputLabel>
                <Select
                  value={filters.limit}
                  onChange={(e) => onFiltersChange({ ...filters, limit: e.target.value as number })}
                >
                  <MenuItem value={25}>25 results</MenuItem>
                  <MenuItem value={50}>50 results</MenuItem>
                  <MenuItem value={100}>100 results</MenuItem>
                  <MenuItem value={250}>250 results</MenuItem>
                  <MenuItem value={500}>500 results</MenuItem>
                </Select>
              </FormControl>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Confidence Threshold: {filters.confidenceThreshold}%
                </Typography>
                <Slider
                  value={filters.confidenceThreshold}
                  onChange={(e, newValue) => onFiltersChange({ ...filters, confidenceThreshold: newValue as number })}
                  min={0}
                  max={100}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 50, label: '50%' },
                    { value: 100, label: '100%' }
                  ]}
                />
              </Box>
              <Box display="flex" gap={1} alignItems="center">
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={filters.sortBy}
                    onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
                  >
                    {sortOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <IconButton
                  onClick={() => onFiltersChange({ 
                    ...filters, 
                    sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                  })}
                  color="primary"
                >
                  {filters.sortOrder === 'asc' ? <TrendingUp /> : <TrendingDown />}
                </IconButton>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box mt={2} p={2} bgcolor="grey.50" borderRadius={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Filters ({activeFiltersCount}):
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {filters.cities.length > 0 && !filters.cities.includes('all') && (
                  <Chip size="small" label={`Cities: ${filters.cities.length}`} onDelete={() => onFiltersChange({ ...filters, cities: [] })} />
                )}
                {(filters.speedRange[0] > 0 || filters.speedRange[1] < 70) && (
                  <Chip size="small" label={`Speed: ${filters.speedRange[0]}-${filters.speedRange[1]}`} onDelete={() => onFiltersChange({ ...filters, speedRange: [0, 70] })} />
                )}
                {filters.rushHourOnly && (
                  <Chip size="small" label="Rush Hour" onDelete={() => onFiltersChange({ ...filters, rushHourOnly: false })} />
                )}
                {filters.dayOfWeek.length > 0 && filters.dayOfWeek.length < 7 && (
                  <Chip size="small" label={`Days: ${filters.dayOfWeek.length}`} onDelete={() => onFiltersChange({ ...filters, dayOfWeek: [] })} />
                )}
                {filters.trafficStatus.length > 0 && filters.trafficStatus.length < 3 && (
                  <Chip size="small" label={`Status: ${filters.trafficStatus.length}`} onDelete={() => onFiltersChange({ ...filters, trafficStatus: [] })} />
                )}
              </Box>
            </Box>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default FilterPanel;