#!/usr/bin/env python3
"""
Complete mock API server for UberFlow Analytics dashboard.
Provides all endpoints needed by the frontend.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import random
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse, parse_qs

class MockAPIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)
        
        # Add CORS headers
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        if path == '/':
            response = {
                "message": "Traffic Speed Prediction API",
                "version": "1.0.0",
                "status": "running",
                "timestamp": datetime.now().isoformat()
            }
        elif path == '/health':
            response = {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "models": {
                    "lstm": {"status": "ready", "accuracy": 0.87},
                    "gnn": {"status": "ready", "accuracy": 0.89}
                },
                "active_model": "lstm"
            }
        elif path == '/cities':
            response = self.get_cities()
        elif path == '/predictions':
            limit = int(query_params.get('limit', ['50'])[0])
            city = query_params.get('city', ['all'])[0]
            response = self.get_predictions(limit, city)
        elif path == '/analytics/metrics':
            response = self.get_metrics()
        elif path == '/analytics/historical':
            hours = int(query_params.get('hours', ['24'])[0])
            response = self.get_historical_data(hours)
        elif path == '/traffic/realtime':
            response = self.get_realtime_traffic()
        elif path == '/models/status':
            response = {
                "lstm": {
                    "model_type": "lstm",
                    "is_loaded": True,
                    "last_updated": datetime.now().isoformat(),
                    "metrics": {"accuracy": 0.87, "loss": 0.23}
                },
                "gnn": {
                    "model_type": "gnn", 
                    "is_loaded": True,
                    "last_updated": datetime.now().isoformat(),
                    "metrics": {"accuracy": 0.89, "loss": 0.19}
                }
            }
        else:
            self.send_error(404)
            return
            
        self.wfile.write(json.dumps(response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def get_cities(self):
        return [
            {
                "id": "san_francisco",
                "name": "San Francisco",
                "country": "USA",
                "center": [37.7749, -122.4194],
                "timezone": "America/Los_Angeles",
                "segments": 1247,
                "traffic_records": 89432,
                "avg_speed": 24.8,
                "rush_hour_impact": 0.32,
                "status": "active"
            },
            {
                "id": "new_york",
                "name": "New York",
                "country": "USA", 
                "center": [40.7128, -74.0060],
                "timezone": "America/New_York",
                "segments": 2341,
                "traffic_records": 156789,
                "avg_speed": 19.2,
                "rush_hour_impact": 0.45,
                "status": "active"
            },
            {
                "id": "london",
                "name": "London", 
                "country": "UK",
                "center": [51.5074, -0.1278],
                "timezone": "Europe/London",
                "segments": 1876,
                "traffic_records": 123456,
                "avg_speed": 22.1,
                "rush_hour_impact": 0.38,
                "status": "active"
            }
        ]

    def get_predictions(self, limit, city):
        cities = self.get_cities()
        predictions = []
        
        for i in range(min(limit, 100)):
            selected_city = random.choice(cities)
            if city != 'all' and selected_city['id'] != city:
                continue
                
            is_rush = datetime.now().hour in [7, 8, 9, 17, 18, 19]
            base_speed = selected_city['avg_speed']
            
            if is_rush:
                base_speed *= (1 - selected_city['rush_hour_impact'])
            
            pred_speed = base_speed + random.uniform(-5, 5)
            
            predictions.append({
                "city": selected_city['name'].lower().replace(' ', '_'),
                "segment_id": random.randint(1, selected_city['segments']),
                "timestamp": datetime.now().isoformat(),
                "predicted_speed": round(pred_speed, 1),
                "confidence_lower": round(pred_speed * 0.9, 1),
                "confidence_upper": round(pred_speed * 1.1, 1),
                "is_rush_hour": is_rush,
                "lat": selected_city['center'][0] + random.uniform(-0.1, 0.1),
                "lon": selected_city['center'][1] + random.uniform(-0.1, 0.1)
            })
            
        return predictions

    def get_metrics(self):
        total_predictions = random.randint(45000, 55000)
        cities = self.get_cities()
        total_segments = sum(city['segments'] for city in cities)
        total_records = sum(city['traffic_records'] for city in cities)
        avg_speed = sum(city['avg_speed'] for city in cities) / len(cities)
        
        accuracy_decimal = round(random.uniform(0.85, 0.92), 3)
        
        return {
            "totalPredictions": total_predictions,
            "total_predictions": total_predictions,  # Frontend compatibility
            "accuracy": round(accuracy_decimal * 100, 1),  # Convert to percentage
            "avgResponseTime": random.randint(120, 180),
            "activeSegments": random.randint(5400, 5500),
            "citiesMonitored": 3,
            "totalSegments": total_segments,
            "totalRecords": total_records,
            "avgSpeed": round(avg_speed, 1),
            "lastUpdated": datetime.now().isoformat()
        }

    def get_historical_data(self, hours):
        historical = []
        for i in range(hours):
            timestamp = datetime.now() - timedelta(hours=i)
            historical.append({
                "timestamp": timestamp.isoformat(),
                "avg_speed": round(random.uniform(18, 30), 1),
                "predictions_made": random.randint(800, 1200),
                "accuracy": round(random.uniform(0.8, 0.95), 3)
            })
        return list(reversed(historical))

    def get_realtime_traffic(self):
        cities = self.get_cities()
        realtime = []
        
        for city in cities:
            for _ in range(random.randint(8, 15)):
                speed = random.uniform(10, 35)
                
                if speed >= 20:
                    status = 'normal'
                elif speed >= 10:
                    status = 'congested' 
                else:
                    status = 'heavy'
                    
                realtime.append({
                    "city": city['name'].lower().replace(' ', '_'),
                    "segment_id": random.randint(1, city['segments']),
                    "current_speed": round(speed, 1),
                    "timestamp": datetime.now().isoformat(),
                    "status": status,
                    "lat": city['center'][0] + random.uniform(-0.1, 0.1),
                    "lon": city['center'][1] + random.uniform(-0.1, 0.1)
                })
        
        return realtime

    def log_message(self, format, *args):
        # Suppress default logging
        pass

if __name__ == "__main__":
    print("🚀 Starting UberFlow Analytics Mock API on http://localhost:8000")
    print("✅ Supports all frontend endpoints with realistic data")
    print("📊 Dashboard should now show 'online' status")
    
    server = HTTPServer(('localhost', 8000), MockAPIHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        server.shutdown()