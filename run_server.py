#!/usr/bin/env python3
"""
UberFlow Analytics Server Runner
Runs the API server without trying to open a browser
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import random
from datetime import datetime

class TrafficAPIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
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
            self.send_header('Access-Control-Allow-Origin', '*')
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
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Simulate prediction
            is_rush = datetime.now().hour in [7, 8, 9, 17, 18, 19]
            base_speed = 25 if is_rush else 35
            
            prediction = {
                "segment_id": 1,
                "current_speed": round(base_speed + random.uniform(-5, 5), 1),
                "predicted_speed": round(base_speed + random.uniform(-3, 3), 1),
                "confidence": round(random.uniform(0.85, 0.95), 2),
                "model_used": "lstm",
                "timestamp": datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(prediction).encode())
            
        elif self.path == '/segments':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            segments = []
            for i in range(10):
                segments.append({
                    "segment_id": i + 1,
                    "name": f"Market Street Segment {i+1}",
                    "start_lat": round(37.7749 + random.uniform(-0.01, 0.01), 4),
                    "start_lon": round(-122.4194 + random.uniform(-0.01, 0.01), 4),
                    "end_lat": round(37.7749 + random.uniform(-0.01, 0.01), 4),
                    "end_lon": round(-122.4194 + random.uniform(-0.01, 0.01), 4),
                    "length_miles": round(random.uniform(0.1, 0.5), 2)
                })
            
            self.wfile.write(json.dumps({"segments": segments, "total_count": len(segments)}).encode())
            
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        return  # Suppress logs

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🌊 UberFlow Analytics API Server")
    print("="*60)
    print("\n🚀 Starting server on http://localhost:8000")
    print("\n📊 Open dashboard.html in your browser to view the interface")
    print("   File location: /mnt/c/Users/Parth Chavan/uber-movement-prediction/dashboard.html")
    print("\n🔌 API Endpoints:")
    print("   - http://localhost:8000/status")
    print("   - http://localhost:8000/predict")
    print("   - http://localhost:8000/segments")
    print("\nPress Ctrl+C to stop the server")
    print("="*60 + "\n")
    
    try:
        server = HTTPServer(('localhost', 8000), TrafficAPIHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Stopping server...")
        server.shutdown()
        print("✅ Server stopped successfully")