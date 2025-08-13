"""
Mock API server for frontend development
Provides sample data for the React dashboard
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random
import uvicorn

app = FastAPI(title="UberFlow Analytics Mock API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://192.168.253.199:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data models
class City(BaseModel):
    id: str
    name: str
    country: str
    center: List[float]
    timezone: str
    segments: int
    traffic_records: int
    avg_speed: float
    rush_hour_impact: float
    status: str

class Prediction(BaseModel):
    city: str
    segment_id: int
    timestamp: str
    predicted_speed: float
    confidence_lower: float
    confidence_upper: float
    is_rush_hour: bool
    lat: float
    lon: float

# Mock cities data
mock_cities = [
    {
        "id": "san_francisco",
        "name": "San Francisco",
        "country": "USA",
        "center": [37.7749, -122.4194],
        "timezone": "America/Los_Angeles",
        "segments": 250,
        "traffic_records": 180000,
        "avg_speed": 24.5,
        "rush_hour_impact": -35.2,
        "status": "active"
    },
    {
        "id": "new_york",
        "name": "New York",
        "country": "USA",
        "center": [40.7128, -74.0060],
        "timezone": "America/New_York",
        "segments": 420,
        "traffic_records": 312000,
        "avg_speed": 18.3,
        "rush_hour_impact": -42.1,
        "status": "active"
    },
    {
        "id": "london",
        "name": "London",
        "country": "UK",
        "center": [51.5074, -0.1278],
        "timezone": "Europe/London",
        "segments": 380,
        "traffic_records": 245000,
        "avg_speed": 20.1,
        "rush_hour_impact": -38.5,
        "status": "active"
    }
]

def generate_predictions(city: str = "all", count: int = 50):
    """Generate mock prediction data"""
    predictions = []
    cities = mock_cities if city == "all" else [c for c in mock_cities if c["id"] == city]
    
    for _ in range(count):
        selected_city = random.choice(cities)
        base_lat = selected_city["center"][0]
        base_lon = selected_city["center"][1]
        
        current_hour = datetime.now().hour
        is_rush = current_hour in [7, 8, 9, 17, 18, 19]
        base_speed = selected_city["avg_speed"]
        
        if is_rush:
            speed_modifier = 0.65  # Rush hour reduction
        else:
            speed_modifier = random.uniform(0.8, 1.2)
        
        predicted_speed = base_speed * speed_modifier + random.uniform(-3, 3)
        
        predictions.append({
            "city": selected_city["id"],
            "segment_id": random.randint(1, selected_city["segments"]),
            "timestamp": (datetime.now() + timedelta(minutes=random.randint(0, 120))).isoformat(),
            "predicted_speed": max(5, min(60, predicted_speed)),
            "confidence_lower": max(5, predicted_speed - random.uniform(2, 5)),
            "confidence_upper": min(60, predicted_speed + random.uniform(2, 5)),
            "is_rush_hour": is_rush,
            "lat": base_lat + random.uniform(-0.05, 0.05),
            "lon": base_lon + random.uniform(-0.05, 0.05)
        })
    
    return predictions

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "lstm": "loaded",
            "gnn": "loaded"
        }
    }

@app.get("/cities")
async def get_cities():
    """Get all available cities"""
    return mock_cities

@app.get("/cities/{city_id}")
async def get_city(city_id: str):
    """Get specific city details"""
    city = next((c for c in mock_cities if c["id"] == city_id), None)
    if not city:
        return {"error": "City not found"}
    return city

@app.get("/predictions")
async def get_predictions(city: str = "all", limit: int = 50):
    """Get traffic predictions"""
    return generate_predictions(city, min(limit, 100))

@app.post("/predict")
async def make_prediction(segment_id: int, horizon: int = 1):
    """Make a single prediction"""
    city = random.choice(mock_cities)
    base_speed = city["avg_speed"]
    predicted_speed = base_speed + random.uniform(-5, 5)
    
    return {
        "segment_id": segment_id,
        "predicted_speed": max(5, min(60, predicted_speed)),
        "confidence": random.uniform(75, 95),
        "horizon": horizon,
        "timestamp": (datetime.now() + timedelta(hours=horizon)).isoformat(),
        "model_used": random.choice(["lstm", "gnn"])
    }

@app.post("/predict/batch")
async def batch_predict(segment_ids: List[int], horizon: int = 1):
    """Make batch predictions"""
    predictions = []
    for seg_id in segment_ids:
        city = random.choice(mock_cities)
        base_speed = city["avg_speed"]
        predicted_speed = base_speed + random.uniform(-5, 5)
        
        predictions.append({
            "segment_id": seg_id,
            "predicted_speed": max(5, min(60, predicted_speed)),
            "confidence": random.uniform(75, 95),
            "horizon": horizon,
            "timestamp": (datetime.now() + timedelta(hours=horizon)).isoformat(),
            "model_used": random.choice(["lstm", "gnn"])
        })
    
    return predictions

@app.get("/models/status")
async def get_model_status():
    """Get model status and metrics"""
    return {
        "lstm": {
            "status": "active",
            "last_trained": datetime.now().isoformat(),
            "accuracy": 87.2,
            "mae": 3.2,
            "rmse": 4.8
        },
        "gnn": {
            "status": "active", 
            "last_trained": datetime.now().isoformat(),
            "accuracy": 89.1,
            "mae": 2.9,
            "rmse": 4.5
        },
        "active_model": "gnn"
    }

@app.post("/models/switch/{model_type}")
async def switch_model(model_type: str):
    """Switch between LSTM and GNN models"""
    if model_type not in ["lstm", "gnn"]:
        return {"error": "Invalid model type"}
    
    return {
        "status": "success",
        "active_model": model_type,
        "message": f"Switched to {model_type.upper()} model"
    }

@app.get("/analytics/metrics")
async def get_analytics_metrics():
    """Get overall analytics metrics"""
    return {
        "total_predictions": 125847,
        "accuracy": 87.3,
        "avg_response_time": 0.12,
        "active_segments": 1050,
        "cities_monitored": 3,
        "last_updated": datetime.now().isoformat()
    }

@app.get("/analytics/historical")
async def get_historical_data(hours: int = 24):
    """Get historical traffic data"""
    data = []
    for i in range(hours):
        timestamp = datetime.now() - timedelta(hours=i)
        data.append({
            "timestamp": timestamp.isoformat(),
            "avg_speed": random.uniform(15, 35),
            "predictions_made": random.randint(50, 200),
            "accuracy": random.uniform(75, 95)
        })
    return sorted(data, key=lambda x: x["timestamp"])

@app.get("/traffic/realtime")
async def get_realtime_traffic():
    """Get real-time traffic updates"""
    updates = []
    for city in mock_cities:
        for _ in range(10):  # 10 updates per city
            segment_id = random.randint(1, city["segments"])
            current_speed = city["avg_speed"] + random.uniform(-8, 8)
            updates.append({
                "city": city["id"],
                "segment_id": segment_id,
                "current_speed": max(5, min(60, current_speed)),
                "timestamp": datetime.now().isoformat(),
                "status": "normal" if current_speed > 15 else "congested"
            })
    return updates

if __name__ == "__main__":
    print("Starting Mock API Server on http://localhost:8001")
    print("This provides sample data for the React dashboard")
    print("Press Ctrl+C to stop")
    uvicorn.run(app, host="0.0.0.0", port=8001)