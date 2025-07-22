#!/usr/bin/env python3
"""
UberFlow Analytics Demo Runner
This script runs a simplified demo without requiring all dependencies
"""

import os
import json
import random
from datetime import datetime, timedelta
import webbrowser
import subprocess
import time

def print_banner():
    banner = """
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║     🌊 UberFlow Analytics - Traffic Prediction Platform 🌊    ║
    ║                                                               ║
    ║     Real-time traffic speed prediction using AI models        ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """
    print("\033[96m" + banner + "\033[0m")

def generate_sample_data():
    """Generate sample traffic data for demo"""
    print("\n📊 Generating sample traffic data...")
    
    segments = []
    for i in range(10):
        segments.append({
            "segment_id": i + 1,
            "name": f"Market Street Segment {i+1}",
            "start_lat": 37.7749 + random.uniform(-0.01, 0.01),
            "start_lon": -122.4194 + random.uniform(-0.01, 0.01),
            "end_lat": 37.7749 + random.uniform(-0.01, 0.01),
            "end_lon": -122.4194 + random.uniform(-0.01, 0.01),
            "length_miles": round(random.uniform(0.1, 0.5), 2)
        })
    
    traffic_data = []
    base_time = datetime.now() - timedelta(hours=24)
    
    for hour in range(24):
        for segment in segments:
            # Simulate rush hour patterns
            is_rush_hour = hour in [7, 8, 9, 17, 18, 19]
            base_speed = 25 if is_rush_hour else 35
            
            traffic_data.append({
                "segment_id": segment["segment_id"],
                "timestamp": (base_time + timedelta(hours=hour)).isoformat(),
                "speed_mph": base_speed + random.uniform(-5, 5),
                "hour": hour,
                "is_rush_hour": is_rush_hour
            })
    
    return segments, traffic_data

def create_simple_api():
    """Create a simple API simulation"""
    api_code = '''
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import random
from datetime import datetime

class TrafficAPIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = """
            <html>
            <head>
                <title>UberFlow Analytics API</title>
                <style>
                    body { font-family: Arial; margin: 40px; background: #0a0e27; color: white; }
                    h1 { color: #00bcd4; }
                    .endpoint { background: #1a1d3a; padding: 10px; margin: 10px 0; border-radius: 5px; }
                    code { background: #2a2d5a; padding: 2px 5px; border-radius: 3px; }
                </style>
            </head>
            <body>
                <h1>🌊 UberFlow Analytics API</h1>
                <p>Real-time traffic prediction service is running!</p>
                <h2>Available Endpoints:</h2>
                <div class="endpoint">
                    <code>GET /predict?segment_id=1</code> - Get prediction for a segment
                </div>
                <div class="endpoint">
                    <code>GET /status</code> - Check API status
                </div>
                <div class="endpoint">
                    <code>GET /segments</code> - List all segments
                </div>
            </body>
            </html>
            """
            self.wfile.write(html.encode())
            
        elif self.path == '/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            status = {
                "status": "operational",
                "models": {
                    "lstm": {"status": "ready", "accuracy": 0.87},
                    "gnn": {"status": "ready", "accuracy": 0.89}
                },
                "timestamp": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(status).encode())
            
        elif self.path.startswith('/predict'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # Simulate prediction
            is_rush = datetime.now().hour in [7, 8, 9, 17, 18, 19]
            base_speed = 25 if is_rush else 35
            
            prediction = {
                "segment_id": 1,
                "current_speed": base_speed + random.uniform(-5, 5),
                "predicted_speed": base_speed + random.uniform(-3, 3),
                "confidence": round(random.uniform(0.85, 0.95), 2),
                "model_used": "lstm",
                "timestamp": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(prediction).encode())
            
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        return  # Suppress logs

print("🚀 Starting UberFlow Analytics API on http://localhost:8000")
server = HTTPServer(('localhost', 8000), TrafficAPIHandler)
server.serve_forever()
'''
    
    with open('simple_api.py', 'w') as f:
        f.write(api_code)

def create_dashboard_html():
    """Create a simple HTML dashboard"""
    dashboard_html = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UberFlow Analytics Dashboard</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1d3a 50%, #2a2d5a 100%);
            color: white;
            min-height: 100vh;
        }
        .header {
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            padding: 20px 40px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #00bcd4;
        }
        .container {
            padding: 40px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .metric {
            font-size: 36px;
            font-weight: bold;
            color: #00bcd4;
            margin: 10px 0;
        }
        .label {
            color: #888;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        .status.active {
            background: #4caf50;
            color: white;
        }
        .chart {
            height: 200px;
            background: rgba(0, 188, 212, 0.1);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 20px;
        }
        button {
            background: #00bcd4;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
        }
        button:hover {
            background: #00acc1;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🌊 UberFlow Analytics</div>
        <div>
            <span class="status active">System Active</span>
        </div>
    </div>
    
    <div class="container">
        <h1>Traffic Prediction Dashboard</h1>
        <p style="color: #888;">Real-time traffic insights powered by AI</p>
        
        <div class="grid">
            <div class="card">
                <div class="label">Current Average Speed</div>
                <div class="metric" id="avgSpeed">28.5 mph</div>
                <div class="chart">
                    <span style="color: #888;">Speed Trend Chart</span>
                </div>
            </div>
            
            <div class="card">
                <div class="label">Active Segments</div>
                <div class="metric">156</div>
                <p style="color: #888; margin-top: 20px;">
                    Monitoring traffic across San Francisco
                </p>
            </div>
            
            <div class="card">
                <div class="label">Prediction Accuracy</div>
                <div class="metric">87.3%</div>
                <p style="color: #888; margin-top: 20px;">
                    LSTM Model Performance
                </p>
            </div>
            
            <div class="card">
                <div class="label">API Status</div>
                <div class="metric" style="color: #4caf50;">Online</div>
                <button onclick="checkAPI()" style="margin-top: 20px;">
                    Check API Status
                </button>
            </div>
        </div>
        
        <div class="card" style="margin-top: 30px;">
            <h2>Live Predictions</h2>
            <button onclick="getPrediction()">Get New Prediction</button>
            <div id="predictionResult" style="margin-top: 20px; padding: 20px; background: rgba(0, 188, 212, 0.1); border-radius: 10px; display: none;">
                <p><strong>Segment:</strong> <span id="segmentId"></span></p>
                <p><strong>Current Speed:</strong> <span id="currentSpeed"></span> mph</p>
                <p><strong>Predicted Speed:</strong> <span id="predictedSpeed"></span> mph</p>
                <p><strong>Confidence:</strong> <span id="confidence"></span></p>
            </div>
        </div>
    </div>
    
    <script>
        // Simulate real-time updates
        setInterval(() => {
            const speed = (25 + Math.random() * 10).toFixed(1);
            document.getElementById('avgSpeed').textContent = speed + ' mph';
        }, 3000);
        
        async function checkAPI() {
            try {
                const response = await fetch('http://localhost:8000/status');
                const data = await response.json();
                alert('API Status: ' + data.status + '\\nModels Ready: LSTM & GNN');
            } catch (error) {
                alert('API is starting up. Please wait a moment and try again.');
            }
        }
        
        async function getPrediction() {
            try {
                const response = await fetch('http://localhost:8000/predict?segment_id=1');
                const data = await response.json();
                
                document.getElementById('segmentId').textContent = data.segment_id;
                document.getElementById('currentSpeed').textContent = data.current_speed.toFixed(1);
                document.getElementById('predictedSpeed').textContent = data.predicted_speed.toFixed(1);
                document.getElementById('confidence').textContent = (data.confidence * 100).toFixed(0) + '%';
                document.getElementById('predictionResult').style.display = 'block';
            } catch (error) {
                alert('Please ensure the API is running on port 8000');
            }
        }
    </script>
</body>
</html>
'''
    
    with open('dashboard.html', 'w') as f:
        f.write(dashboard_html)

def main():
    print_banner()
    
    print("\n🚀 Starting UberFlow Analytics Demo...\n")
    
    # Generate sample data
    segments, traffic_data = generate_sample_data()
    print(f"✅ Generated {len(segments)} road segments")
    print(f"✅ Generated {len(traffic_data)} traffic data points")
    
    # Create API and dashboard
    create_simple_api()
    create_dashboard_html()
    print("\n✅ Created demo API server")
    print("✅ Created dashboard interface")
    
    # Start API server in background
    print("\n🌐 Starting API server on http://localhost:8000")
    api_process = subprocess.Popen(['python3', 'simple_api.py'])
    time.sleep(2)  # Give server time to start
    
    # Open dashboard
    print("🌊 Opening dashboard in browser...")
    dashboard_path = os.path.abspath('dashboard.html')
    webbrowser.open(f'file://{dashboard_path}')
    
    print("\n" + "="*60)
    print("✨ UberFlow Analytics is now running!")
    print("="*60)
    print("\n📊 Dashboard: file://" + dashboard_path)
    print("🔌 API: http://localhost:8000")
    print("\nPress Ctrl+C to stop the demo")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n👋 Stopping UberFlow Analytics...")
        api_process.terminate()
        print("✅ Demo stopped successfully")

if __name__ == "__main__":
    main()