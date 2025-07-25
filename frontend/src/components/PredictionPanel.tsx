import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  alpha,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  PlayArrow,
  Refresh,
  Download,
  TrendingUp,
  TrendingDown,
  Speed,
  Timeline,
  LocationOn,
  AccessTime,
  ModelTraining,
  ExpandMore,
  CheckCircle,
  Warning,
  Error,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Prediction {
  id: string;
  segmentId: number;
  timestamp: string;
  predictedSpeed: number;
  confidence: number;
  actualSpeed?: number;
  model: 'LSTM' | 'GNN';
  status: 'pending' | 'completed' | 'failed';
}

interface PredictionRequest {
  segmentId: number;
  horizon: number;
  model: 'LSTM' | 'GNN' | 'AUTO';
}

const ModelCard: React.FC<{
  name: string;
  accuracy: number;
  responseTime: number;
  isActive: boolean;
  onSelect: () => void;
}> = ({ name, accuracy, responseTime, isActive, onSelect }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          cursor: 'pointer',
          border: isActive ? `2px solid ${theme.palette.primary.main}` : `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          background: isActive 
            ? alpha(theme.palette.primary.main, 0.05)
            : 'transparent',
          transition: 'all 0.3s ease',
          '&:hover': {
            border: `2px solid ${alpha(theme.palette.primary.main, 0.5)}`,
            background: alpha(theme.palette.primary.main, 0.02),
          },
        }}
        onClick={onSelect}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {name}
            </Typography>
            {isActive && <CheckCircle color="primary" />}
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Accuracy
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                {accuracy}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Response
              </Typography>
              <Typography variant="h6" color="secondary.main" sx={{ fontWeight: 600 }}>
                {responseTime}ms
              </Typography>
            </Grid>
          </Grid>
          
          <LinearProgress
            variant="determinate"
            value={accuracy}
            sx={{ mt: 2, height: 4, borderRadius: 2 }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

const PredictionRow: React.FC<{ prediction: Prediction }> = ({ prediction }) => {
  const theme = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      default: return 'warning';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'failed': return <Error />;
      default: return <CircularProgress size={16} />;
    }
  };
  
  const confidenceColor = prediction.confidence > 80 ? 'success' : 
                         prediction.confidence > 60 ? 'warning' : 'error';
  
  return (
    <TableRow
      sx={{
        '&:hover': {
          background: alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn color="action" fontSize="small" />
          #{prediction.segmentId}
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2">
          {new Date(prediction.timestamp).toLocaleTimeString()}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {prediction.predictedSpeed.toFixed(1)} mph
        </Typography>
      </TableCell>
      <TableCell>
        <Chip
          label={`${prediction.confidence}%`}
          color={confidenceColor as any}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        {prediction.actualSpeed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              {prediction.actualSpeed.toFixed(1)} mph
            </Typography>
            {Math.abs(prediction.predictedSpeed - prediction.actualSpeed) < 2 ? (
              <TrendingUp color="success" fontSize="small" />
            ) : (
              <TrendingDown color="error" fontSize="small" />
            )}
          </Box>
        )}
      </TableCell>
      <TableCell>
        <Chip
          label={prediction.model}
          color={prediction.model === 'GNN' ? 'primary' : 'secondary'}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Chip
          icon={getStatusIcon(prediction.status)}
          label={prediction.status}
          color={getStatusColor(prediction.status) as any}
          size="small"
          variant="outlined"
        />
      </TableCell>
    </TableRow>
  );
};

interface PredictionPanelProps {
  selectedCity?: string;
}

const PredictionPanel: React.FC<PredictionPanelProps> = ({ selectedCity = 'all' }) => {
  const theme = useTheme();
  const [selectedModel, setSelectedModel] = useState<'LSTM' | 'GNN' | 'AUTO'>('AUTO');
  const [selectedSegment, setSelectedSegment] = useState(1);
  const [predictionHorizon, setPredictionHorizon] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [realtimeData, setRealtimeData] = useState<any[]>([]);
  
  const models = [
    { name: 'LSTM', accuracy: 87.2, responseTime: 45, description: 'Temporal pattern recognition' },
    { name: 'GNN', accuracy: 89.1, responseTime: 67, description: 'Spatial relationship modeling' },
    { name: 'AUTO', accuracy: 91.5, responseTime: 52, description: 'Intelligent model selection' },
  ];
  
  // Generate initial predictions
  useEffect(() => {
    const initialPredictions: Prediction[] = [
      {
        id: '1',
        segmentId: 1,
        timestamp: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        predictedSpeed: 24.8,
        confidence: 89,
        actualSpeed: 23.2,
        model: 'GNN',
        status: 'completed',
      },
      {
        id: '2',
        segmentId: 2,
        timestamp: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        predictedSpeed: 18.3,
        confidence: 76,
        actualSpeed: 19.1,
        model: 'LSTM',
        status: 'completed',
      },
      {
        id: '3',
        segmentId: 3,
        timestamp: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
        predictedSpeed: 31.2,
        confidence: 92,
        model: 'GNN',
        status: 'pending',
      },
      {
        id: '4',
        segmentId: 1,
        timestamp: new Date(Date.now() + 1000 * 60 * 120).toISOString(),
        predictedSpeed: 12.5,
        confidence: 84,
        model: 'LSTM',
        status: 'pending',
      },
    ];
    
    setPredictions(initialPredictions);
    
    // Generate realtime chart data
    const chartData = [];
    for (let i = 0; i < 24; i++) {
      const time = new Date(Date.now() - (24 - i) * 60 * 60 * 1000);
      chartData.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        actual: 25 + Math.sin(i / 24 * Math.PI * 2) * 8 + Math.random() * 4,
        predicted: 25 + Math.sin(i / 24 * Math.PI * 2) * 8 + Math.random() * 3,
        confidence: 70 + Math.random() * 25,
      });
    }
    setRealtimeData(chartData);
  }, []);
  
  const handlePredict = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newPrediction: Prediction = {
        id: Date.now().toString(),
        segmentId: selectedSegment,
        timestamp: new Date(Date.now() + predictionHorizon * 60 * 60 * 1000).toISOString(),
        predictedSpeed: 20 + Math.random() * 20,
        confidence: 70 + Math.random() * 25,
        model: selectedModel === 'AUTO' ? (Math.random() > 0.5 ? 'GNN' : 'LSTM') : selectedModel,
        status: 'completed',
      };
      
      setPredictions(prev => [newPrediction, ...prev]);
      setIsLoading(false);
    }, 2000);
  };
  
  const handleBatchPredict = async () => {
    setIsLoading(true);
    
    // Simulate batch prediction
    setTimeout(() => {
      const batchPredictions: Prediction[] = [];
      for (let i = 1; i <= 6; i++) {
        batchPredictions.push({
          id: `${Date.now()}_${i}`,
          segmentId: i,
          timestamp: new Date(Date.now() + predictionHorizon * 60 * 60 * 1000).toISOString(),
          predictedSpeed: 15 + Math.random() * 25,
          confidence: 65 + Math.random() * 30,
          model: selectedModel === 'AUTO' ? (Math.random() > 0.5 ? 'GNN' : 'LSTM') : selectedModel,
          status: 'completed',
        });
      }
      
      setPredictions(prev => [...batchPredictions, ...prev]);
      setIsLoading(false);
    }, 3000);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {selectedCity === 'all' ? 'Multi-City' : 
           selectedCity === 'san_francisco' ? 'San Francisco' :
           selectedCity === 'new_york' ? 'New York' :
           selectedCity === 'london' ? 'London' : 'City'} Traffic Predictions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {selectedCity === 'all' 
            ? 'AI-powered traffic predictions across San Francisco, New York, and London'
            : 'Generate AI-powered traffic speed predictions using LSTM and GNN models'
          }
        </Typography>
        
        {selectedCity !== 'all' && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={`Selected: ${selectedCity === 'san_francisco' ? '🌉 San Francisco' : 
                                selectedCity === 'new_york' ? '🗽 New York' : 
                                selectedCity === 'london' ? '🇬🇧 London' : selectedCity}`}
              variant="outlined"
              color="primary"
            />
          </Box>
        )}
      </Box>
      
      <Grid container spacing={3}>
        {/* Model Selection */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Model Selection
              </Typography>
              
              <Grid container spacing={2}>
                {models.map((model) => (
                  <Grid item xs={12} key={model.name}>
                    <ModelCard
                      name={model.name}
                      accuracy={model.accuracy}
                      responseTime={model.responseTime}
                      isActive={selectedModel === model.name}
                      onSelect={() => setSelectedModel(model.name as any)}
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Prediction Parameters
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Segment ID</InputLabel>
                    <Select
                      value={selectedSegment}
                      onChange={(e) => setSelectedSegment(e.target.value as number)}
                      label="Segment ID"
                    >
                      {[1, 2, 3, 4, 5, 6].map(id => (
                        <MenuItem key={id} value={id}>
                          Segment #{id}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Prediction Horizon (hours)"
                    type="number"
                    value={predictionHorizon}
                    onChange={(e) => setPredictionHorizon(Number(e.target.value))}
                    inputProps={{ min: 1, max: 24 }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={isLoading ? <CircularProgress size={16} /> : <PlayArrow />}
                  onClick={handlePredict}
                  disabled={isLoading}
                  fullWidth
                  size="large"
                >
                  {isLoading ? 'Predicting...' : 'Generate Prediction'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Timeline />}
                  onClick={handleBatchPredict}
                  disabled={isLoading}
                  fullWidth
                >
                  Batch Predict All Segments
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Prediction Results */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Prediction Accuracy Chart
                </Typography>
                <IconButton size="small">
                  <Refresh />
                </IconButton>
              </Box>
              
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={realtimeData}>
                    <defs>
                      <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.1)} />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        background: alpha(theme.palette.background.paper, 0.95),
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderRadius: theme.shape.borderRadius,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke={theme.palette.primary.main}
                      fillOpacity={1}
                      fill="url(#actualGradient)"
                      strokeWidth={2}
                      name="Actual Speed"
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      stroke={theme.palette.secondary.main}
                      fillOpacity={1}
                      fill="url(#predictedGradient)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Predicted Speed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent Predictions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<Download />}
                      size="small"
                      variant="outlined"
                    >
                      Export
                    </Button>
                    <IconButton size="small">
                      <Refresh />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
              
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Segment</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Predicted</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Actual</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {predictions.slice(0, 10).map((prediction) => (
                        <motion.tr
                          key={prediction.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <PredictionRow prediction={prediction} />
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {predictions.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No predictions yet. Generate your first prediction above.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Model Performance Details
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={4}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">LSTM Model</Typography>
                  <Typography variant="body2">
                    Excellent for temporal pattern recognition. Best for rush hour predictions.
                  </Typography>
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  • MAE: 3.2 mph<br/>
                  • RMSE: 4.8 mph<br/>
                  • R²: 0.87
                </Typography>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">GNN Model</Typography>
                  <Typography variant="body2">
                    Superior spatial relationship modeling. Best for network-wide analysis.
                  </Typography>
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  • MAE: 2.9 mph<br/>
                  • RMSE: 4.5 mph<br/>
                  • R²: 0.89
                </Typography>
              </Grid>
              
              <Grid item xs={12} lg={4}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Auto Selection</Typography>
                  <Typography variant="body2">
                    Intelligently selects best model based on context and conditions.
                  </Typography>
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  • Combined MAE: 2.7 mph<br/>
                  • Overall Accuracy: 91.5%<br/>
                  • Adaptive Performance
                </Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Box>
    </motion.div>
  );
};

export default PredictionPanel;