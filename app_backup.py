#!/usr/bin/env python3
"""
Unified Flask application serving both API and React frontend.
Perfect for single-service deployment on platforms like Render.
"""

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import json
import random
import os
from datetime import datetime, timedelta

app = Flask(__name__, static_folder='frontend/build', static_url_path='')
CORS(app)

# API Routes
@app.route('/api/health')
@app.route('/health')  # Support both endpoints
def health():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models": {
            "lstm": {"status": "ready", "accuracy": 0.87},
            "gnn": {"status": "ready", "accuracy": 0.89}
        },
        "active_model": "lstm"
    })

@app.route('/api/cities')
def get_cities():
    return jsonify([
        {"id": "san_francisco", "name": "San Francisco", "country": "USA", "segments": 2847},
        {"id": "new_york", "name": "New York", "country": "USA", "segments": 4293},
        {"id": "london", "name": "London", "country": "UK", "segments": 3156}
    ])

@app.route('/api/predictions')
def get_predictions():
    limit = int(request.args.get('limit', 50))
    city = request.args.get('city', 'all')
    
    predictions = []
    for i in range(limit):
        predictions.append({
            "segment_id": f"seg_{i:04d}",
            "current_speed": round(random.uniform(15, 85), 2),
            "predicted_speed": round(random.uniform(20, 80), 2),
            "confidence": round(random.uniform(0.7, 0.95), 3),
            "timestamp": (datetime.now() - timedelta(minutes=i)).isoformat(),
            "city": random.choice(['san_francisco', 'new_york', 'london']),
            "coordinates": {
                "lat": round(random.uniform(37.7, 40.8), 6),
                "lng": round(random.uniform(-122.5, -73.9), 6)
            }
        })
    
    return jsonify(predictions)

@app.route('/api/segments')
def get_segments():
    city = request.args.get('city', 'san_francisco')
    segments = []
    
    for i in range(100):
        segments.append({
            "segment_id": f"{city}_seg_{i:04d}",
            "start_lat": round(random.uniform(37.7, 37.8), 6),
            "start_lng": round(random.uniform(-122.5, -122.4), 6),
            "end_lat": round(random.uniform(37.7, 37.8), 6),
            "end_lng": round(random.uniform(-122.5, -122.4), 6),
            "length": round(random.uniform(0.1, 2.5), 2),
            "highway": random.choice(['US-101', 'I-280', 'CA-1', 'I-80'])
        })
    
    return jsonify(segments)

@app.route('/api/realtime')
def get_realtime():
    return jsonify({
        "timestamp": datetime.now().isoformat(),
        "active_predictions": random.randint(450, 550),
        "avg_speed": round(random.uniform(35, 45), 1),
        "congestion_level": random.choice(["Low", "Medium", "High"]),
        "model_accuracy": round(random.uniform(0.85, 0.95), 3)
    })

# Serve React App
@app.route('/')
def serve_react_app():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_react_assets(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)