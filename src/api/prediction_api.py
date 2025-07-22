"""
FastAPI-based real-time traffic speed prediction API.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd
import torch
import pickle
import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
import yaml
import uvicorn
from contextlib import asynccontextmanager

# Import model classes
import sys
sys.path.append('..')
from models.lstm_model import LSTMTrainer, LSTMTrafficPredictor
from models.gnn_model import GNNTrainer, GNNTrafficPredictor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for API
class TrafficDataPoint(BaseModel):
    segment_id: int
    timestamp: datetime
    speed_mph: float
    hour: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(..., ge=0, le=6)
    is_weekend: bool = False
    is_rush_hour: bool = False

class PredictionRequest(BaseModel):
    segment_id: int
    timestamp: Optional[datetime] = None
    historical_data: Optional[List[TrafficDataPoint]] = None
    prediction_horizon: int = Field(default=1, ge=1, le=24)

class BatchPredictionRequest(BaseModel):
    segment_ids: List[int]
    timestamp: Optional[datetime] = None
    prediction_horizon: int = Field(default=1, ge=1, le=24)

class PredictionResponse(BaseModel):
    segment_id: int
    timestamp: datetime
    predicted_speed: float
    confidence_interval: Optional[Dict[str, float]] = None
    model_used: str

class BatchPredictionResponse(BaseModel):
    predictions: List[PredictionResponse]
    total_segments: int
    timestamp: datetime

class ModelStatus(BaseModel):
    model_type: str
    is_loaded: bool
    last_updated: Optional[datetime]
    metrics: Optional[Dict[str, float]]

# Global model instances
class ModelManager:
    """Manage loaded models and their state."""
    
    def __init__(self):
        self.lstm_model = None
        self.gnn_model = None
        self.lstm_trainer = None
        self.gnn_trainer = None
        self.active_model = "lstm"  # Default
        self.model_info = {}
        self.segments_data = None
        
    async def load_models(self):
        """Load all available models."""
        try:
            # Load LSTM model
            self.lstm_trainer = LSTMTrainer()
            lstm_path = "models/lstm_traffic_predictor.pth"
            if Path(lstm_path).exists():
                self.lstm_trainer.load_model(lstm_path)
                self.model_info['lstm'] = {
                    'loaded': True,
                    'path': lstm_path,
                    'last_updated': datetime.now()
                }
                logger.info("LSTM model loaded successfully")
            else:
                logger.warning(f"LSTM model not found at {lstm_path}")
            
            # Load GNN model
            self.gnn_trainer = GNNTrainer()
            gnn_path = "models/gnn_traffic_predictor.pth"
            if Path(gnn_path).exists():
                self.gnn_trainer.load_model(gnn_path)
                self.model_info['gnn'] = {
                    'loaded': True,
                    'path': gnn_path,
                    'last_updated': datetime.now()
                }
                logger.info("GNN model loaded successfully")
            else:
                logger.warning(f"GNN model not found at {gnn_path}")
            
            # Load segments data
            segments_path = "data/raw/san_francisco_segments.csv"
            if Path(segments_path).exists():
                self.segments_data = pd.read_csv(segments_path)
                logger.info(f"Loaded {len(self.segments_data)} segments")
            
            # Load production model info if available
            prod_info_path = "models/production_model_info.txt"
            if Path(prod_info_path).exists():
                with open(prod_info_path, 'r') as f:
                    content = f.read()
                    if "LSTM" in content:
                        self.active_model = "lstm"
                    elif "GNN" in content:
                        self.active_model = "gnn"
                logger.info(f"Active model set to: {self.active_model}")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    def get_active_model(self):
        """Get the currently active model."""
        if self.active_model == "lstm" and self.lstm_trainer:
            return self.lstm_trainer
        elif self.active_model == "gnn" and self.gnn_trainer:
            return self.gnn_trainer
        else:
            raise ValueError("No active model available")
    
    def predict_single(self, request: PredictionRequest) -> PredictionResponse:
        """Make a single prediction."""
        try:
            model = self.get_active_model()
            
            # Use current time if not provided
            timestamp = request.timestamp or datetime.now()
            
            # Create feature sequence (simplified for demo)
            if request.historical_data:
                # Use provided historical data
                features = []
                for data_point in request.historical_data[-24:]:  # Use last 24 hours
                    features.append([
                        data_point.speed_mph,
                        data_point.hour,
                        data_point.day_of_week,
                        int(data_point.is_weekend),
                        int(data_point.is_rush_hour)
                    ])
                
                if len(features) < 24:
                    # Pad with average values if not enough history
                    avg_speed = np.mean([f[0] for f in features]) if features else 25.0
                    while len(features) < 24:
                        features.insert(0, [avg_speed, 12, 1, 0, 0])
                        
                sequence = np.array(features)
            else:
                # Generate synthetic sequence based on segment
                avg_speed = 25.0  # Default average
                if self.segments_data is not None:
                    # Could use segment-specific averages here
                    pass
                
                sequence = []
                for i in range(24):
                    hour = (timestamp.hour - 24 + i) % 24
                    day_of_week = timestamp.weekday()
                    is_weekend = day_of_week >= 5
                    is_rush_hour = hour in [7, 8, 9, 17, 18, 19]
                    
                    # Add some variation based on time
                    speed_var = avg_speed
                    if is_rush_hour:
                        speed_var *= 0.7
                    if is_weekend:
                        speed_var *= 1.1
                    
                    sequence.append([speed_var, hour, day_of_week, int(is_weekend), int(is_rush_hour)])
                
                sequence = np.array(sequence)
            
            # Make prediction
            if isinstance(model, LSTMTrainer):
                predicted_speed = model.predict(sequence)
                model_used = "LSTM"
            else:
                # For GNN, would need graph structure - simplified here
                predicted_speed = 25.0  # Placeholder
                model_used = "GNN"
            
            # Calculate confidence interval (simplified)
            confidence_interval = {
                "lower": float(predicted_speed * 0.9),
                "upper": float(predicted_speed * 1.1)
            }
            
            return PredictionResponse(
                segment_id=request.segment_id,
                timestamp=timestamp,
                predicted_speed=float(predicted_speed),
                confidence_interval=confidence_interval,
                model_used=model_used
            )
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Initialize model manager
model_manager = ModelManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    # Startup
    logger.info("Starting up Traffic Prediction API...")
    await model_manager.load_models()
    yield
    # Shutdown
    logger.info("Shutting down Traffic Prediction API...")

# Create FastAPI app
app = FastAPI(
    title="UberFlow Analytics API",
    description="Real-time traffic speed prediction using LSTM and GNN models",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """API root endpoint."""
    return {
        "message": "Traffic Speed Prediction API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "models_loaded": len(model_manager.model_info),
        "active_model": model_manager.active_model
    }

@app.get("/models/status", response_model=Dict[str, ModelStatus])
async def get_model_status():
    """Get status of all loaded models."""
    status = {}
    
    for model_type in ['lstm', 'gnn']:
        info = model_manager.model_info.get(model_type, {})
        status[model_type] = ModelStatus(
            model_type=model_type,
            is_loaded=info.get('loaded', False),
            last_updated=info.get('last_updated'),
            metrics=info.get('metrics')
        )
    
    return status

@app.post("/predict", response_model=PredictionResponse)
async def predict_speed(request: PredictionRequest):
    """Predict traffic speed for a single segment."""
    return model_manager.predict_single(request)

@app.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_speeds_batch(request: BatchPredictionRequest):
    """Predict traffic speeds for multiple segments."""
    try:
        predictions = []
        timestamp = request.timestamp or datetime.now()
        
        for segment_id in request.segment_ids:
            pred_request = PredictionRequest(
                segment_id=segment_id,
                timestamp=timestamp,
                prediction_horizon=request.prediction_horizon
            )
            
            prediction = model_manager.predict_single(pred_request)
            predictions.append(prediction)
        
        return BatchPredictionResponse(
            predictions=predictions,
            total_segments=len(request.segment_ids),
            timestamp=timestamp
        )
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

@app.get("/segments")
async def get_segments():
    """Get list of available road segments."""
    if model_manager.segments_data is not None:
        return {
            "segments": model_manager.segments_data.to_dict('records'),
            "total_count": len(model_manager.segments_data)
        }
    else:
        return {"segments": [], "total_count": 0}

@app.get("/segments/{segment_id}")
async def get_segment_info(segment_id: int):
    """Get information about a specific segment."""
    if model_manager.segments_data is not None:
        segment = model_manager.segments_data[
            model_manager.segments_data['segment_id'] == segment_id
        ]
        
        if len(segment) > 0:
            return segment.iloc[0].to_dict()
        else:
            raise HTTPException(status_code=404, detail="Segment not found")
    else:
        raise HTTPException(status_code=503, detail="Segments data not available")

@app.post("/models/switch/{model_type}")
async def switch_active_model(model_type: str):
    """Switch the active prediction model."""
    if model_type not in ['lstm', 'gnn']:
        raise HTTPException(status_code=400, detail="Invalid model type")
    
    if model_type not in model_manager.model_info or not model_manager.model_info[model_type].get('loaded'):
        raise HTTPException(status_code=404, detail=f"Model {model_type} not loaded")
    
    model_manager.active_model = model_type
    
    return {
        "message": f"Active model switched to {model_type}",
        "active_model": model_manager.active_model,
        "timestamp": datetime.now()
    }

@app.get("/predict/demo/{segment_id}")
async def demo_prediction(segment_id: int):
    """Demo endpoint with sample prediction."""
    try:
        # Create a demo request
        demo_request = PredictionRequest(
            segment_id=segment_id,
            timestamp=datetime.now()
        )
        
        prediction = model_manager.predict_single(demo_request)
        
        return {
            "demo": True,
            "prediction": prediction,
            "note": "This is a demo prediction using synthetic data"
        }
        
    except Exception as e:
        logger.error(f"Demo prediction error: {e}")
        # Return synthetic response for demo
        return {
            "demo": True,
            "prediction": PredictionResponse(
                segment_id=segment_id,
                timestamp=datetime.now(),
                predicted_speed=25.0,
                confidence_interval={"lower": 22.5, "upper": 27.5},
                model_used="Demo"
            ),
            "note": "This is a fallback demo response",
            "error": str(e)
        }

# Background task for model retraining
async def retrain_models():
    """Background task to retrain models with new data."""
    logger.info("Starting model retraining...")
    # Implementation would go here
    # This could be triggered periodically or by new data arrival
    pass

@app.post("/models/retrain")
async def trigger_retrain(background_tasks: BackgroundTasks):
    """Trigger model retraining."""
    background_tasks.add_task(retrain_models)
    return {
        "message": "Model retraining started",
        "timestamp": datetime.now()
    }

if __name__ == "__main__":
    uvicorn.run(
        "prediction_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )