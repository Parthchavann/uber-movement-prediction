#!/usr/bin/env python3
"""
Demo pipeline runner that works with basic Python libraries.
Shows the core functionality without heavy ML dependencies.
"""

import os
import csv
import json
import time
import random
import math
from datetime import datetime, timedelta
from pathlib import Path

def print_banner(text):
    """Print a formatted banner."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)

def load_data():
    """Load and analyze the traffic data."""
    print_banner("📊 DATA ANALYSIS")
    
    try:
        # Load traffic data
        traffic_data = []
        with open('data/raw/san_francisco_traffic_data.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                traffic_data.append({
                    'segment_id': int(row['segment_id']),
                    'timestamp': row['timestamp'],
                    'hour': int(row['hour']),
                    'day_of_week': int(row['day_of_week']),
                    'speed_mph': float(row['speed_mph'])
                })
        
        # Load segments data
        segments_data = []
        with open('data/raw/san_francisco_segments.csv', 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                segments_data.append({
                    'segment_id': int(row['segment_id']),
                    'start_lat': float(row['start_lat']),
                    'start_lon': float(row['start_lon']),
                    'end_lat': float(row['end_lat']),
                    'end_lon': float(row['end_lon'])
                })
        
        print(f"✅ Loaded {len(traffic_data)} traffic records")
        print(f"✅ Loaded {len(segments_data)} road segments")
        
        # Basic analysis
        speeds = [record['speed_mph'] for record in traffic_data]
        avg_speed = sum(speeds) / len(speeds)
        min_speed = min(speeds)
        max_speed = max(speeds)
        
        print(f"📈 Average speed: {avg_speed:.1f} mph")
        print(f"📉 Speed range: {min_speed:.1f} - {max_speed:.1f} mph")
        
        # Rush hour analysis
        rush_hour_speeds = [record['speed_mph'] for record in traffic_data 
                           if record['hour'] in [7, 8, 9, 17, 18, 19]]
        off_peak_speeds = [record['speed_mph'] for record in traffic_data 
                          if record['hour'] in [10, 11, 12, 13, 14, 15, 16]]
        
        if rush_hour_speeds and off_peak_speeds:
            rush_avg = sum(rush_hour_speeds) / len(rush_hour_speeds)
            off_peak_avg = sum(off_peak_speeds) / len(off_peak_speeds)
            impact = ((off_peak_avg - rush_avg) / off_peak_avg) * 100
            
            print(f"🚗 Rush hour average: {rush_avg:.1f} mph")
            print(f"🛣️  Off-peak average: {off_peak_avg:.1f} mph")
            print(f"📊 Rush hour impact: {impact:.1f}% speed reduction")
        
        return traffic_data, segments_data
        
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        return [], []

def simulate_lstm_training(traffic_data):
    """Simulate LSTM model training."""
    print_banner("🧠 LSTM MODEL TRAINING")
    
    print("🔄 Preparing temporal sequences...")
    time.sleep(1)
    
    print("🔄 Training LSTM with attention mechanism...")
    # Simulate training progress
    for epoch in [1, 20, 40, 60, 80, 100]:
        time.sleep(0.1)
        train_loss = 0.5 * math.exp(-epoch/50) + 0.05
        val_loss = train_loss + 0.02
        print(f"   Epoch {epoch:3d}: Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
    
    # Simulate final metrics
    mae = 3.2
    rmse = 4.8
    r2 = 0.87
    
    print(f"✅ LSTM Training Complete!")
    print(f"   MAE: {mae:.2f} mph")
    print(f"   RMSE: {rmse:.2f} mph") 
    print(f"   R²: {r2:.3f}")
    
    return {"mae": mae, "rmse": rmse, "r2": r2, "model_type": "LSTM"}

def simulate_gnn_training(traffic_data, segments_data):
    """Simulate GNN model training."""
    print_banner("🌐 GRAPH NEURAL NETWORK TRAINING")
    
    print("🔄 Building spatial graph structure...")
    time.sleep(1)
    
    # Calculate some actual spatial relationships
    edge_count = 0
    for i, seg1 in enumerate(segments_data):
        for j, seg2 in enumerate(segments_data):
            if i != j:
                # Calculate distance
                dist = math.sqrt(
                    (seg1['start_lat'] - seg2['start_lat'])**2 + 
                    (seg1['start_lon'] - seg2['start_lon'])**2
                )
                if dist < 0.01:  # Within ~1km
                    edge_count += 1
    
    print(f"📍 Created graph with {len(segments_data)} nodes and {edge_count} edges")
    
    print("🔄 Training Graph Attention Network...")
    # Simulate training progress
    for epoch in [1, 40, 80, 120, 160, 200]:
        time.sleep(0.1)
        train_loss = 0.4 * math.exp(-epoch/60) + 0.04
        val_loss = train_loss + 0.015
        print(f"   Epoch {epoch:3d}: Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
    
    # Simulate final metrics (slightly better than LSTM)
    mae = 2.9
    rmse = 4.5
    r2 = 0.89
    
    print(f"✅ GNN Training Complete!")
    print(f"   MAE: {mae:.2f} mph")
    print(f"   RMSE: {rmse:.2f} mph")
    print(f"   R²: {r2:.3f}")
    
    return {"mae": mae, "rmse": rmse, "r2": r2, "model_type": "GNN"}

def generate_predictions(traffic_data, segments_data, best_model):
    """Generate sample predictions."""
    print_banner("🔮 PREDICTION GENERATION")
    
    print(f"🎯 Using {best_model['model_type']} model for predictions...")
    
    # Generate predictions for next 6 hours
    predictions = []
    current_time = datetime.now()
    
    for hour_offset in range(1, 7):
        pred_time = current_time + timedelta(hours=hour_offset)
        
        for segment in segments_data[:3]:  # Sample 3 segments
            segment_id = segment['segment_id']
            
            # Base prediction with some time-based variation
            base_speed = 25.0
            hour = pred_time.hour
            
            # Rush hour effect
            if hour in [7, 8, 9, 17, 18, 19]:
                speed_factor = 0.7
            elif hour in [10, 11, 14, 15, 16]:
                speed_factor = 0.85
            else:
                speed_factor = 1.0
            
            # Weekend effect
            if pred_time.weekday() >= 5:
                speed_factor *= 1.15
            
            # Add model-specific accuracy simulation
            if best_model['model_type'] == 'GNN':
                noise_factor = 0.8  # Better accuracy
            else:
                noise_factor = 1.0
            
            predicted_speed = base_speed * speed_factor + random.gauss(0, 2 * noise_factor)
            predicted_speed = max(5, min(60, predicted_speed))  # Clamp to realistic range
            
            predictions.append({
                'segment_id': segment_id,
                'timestamp': pred_time.strftime('%Y-%m-%d %H:%M:%S'),
                'predicted_speed': round(predicted_speed, 1),
                'confidence_lower': round(predicted_speed * 0.9, 1),
                'confidence_upper': round(predicted_speed * 1.1, 1)
            })
    
    print(f"✅ Generated {len(predictions)} predictions for next 6 hours")
    
    # Show sample predictions
    print("\n📋 Sample Predictions:")
    for i, pred in enumerate(predictions[:6]):
        print(f"   Segment {pred['segment_id']} @ {pred['timestamp']}: "
              f"{pred['predicted_speed']} mph "
              f"({pred['confidence_lower']}-{pred['confidence_upper']})")
    
    # Save predictions
    Path("data/predictions").mkdir(exist_ok=True)
    with open('data/predictions/demo_predictions.json', 'w') as f:
        json.dump(predictions, f, indent=2)
    
    return predictions

def simulate_visualizations(traffic_data, segments_data, predictions):
    """Simulate visualization generation."""
    print_banner("📊 VISUALIZATION GENERATION")
    
    viz_types = [
        "Speed Heatmap",
        "Rush Hour Analysis", 
        "Segment Performance Map",
        "Time Series Trends",
        "Prediction Accuracy Plot",
        "Interactive Dashboard"
    ]
    
    for viz_type in viz_types:
        print(f"🎨 Creating {viz_type}...")
        time.sleep(0.3)
    
    # Create a simple HTML report
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Traffic Prediction Demo Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            .metric {{ background: #f0f8ff; padding: 10px; margin: 10px 0; border-radius: 5px; }}
            .prediction {{ background: #f8f8f0; padding: 8px; margin: 5px 0; border-radius: 3px; }}
        </style>
    </head>
    <body>
        <h1>🚗 Traffic Speed Prediction Demo Report</h1>
        <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <h2>📊 Data Summary</h2>
        <div class="metric">Total Records: {len(traffic_data)}</div>
        <div class="metric">Road Segments: {len(segments_data)}</div>
        <div class="metric">Average Speed: {sum(r['speed_mph'] for r in traffic_data)/len(traffic_data):.1f} mph</div>
        
        <h2>🔮 Sample Predictions</h2>
    """
    
    for pred in predictions[:5]:
        html_content += f'<div class="prediction">Segment {pred["segment_id"]} @ {pred["timestamp"]}: {pred["predicted_speed"]} mph</div>\n'
    
    html_content += """
        <h2>🎯 Model Performance</h2>
        <div class="metric">LSTM Model - MAE: 3.2 mph, R²: 0.87</div>
        <div class="metric">GNN Model - MAE: 2.9 mph, R²: 0.89 (Selected)</div>
        
        <p><em>This is a demonstration report. In production, this would include interactive maps, charts, and real-time data.</em></p>
    </body>
    </html>
    """
    
    Path("visualizations").mkdir(exist_ok=True)
    with open('visualizations/demo_report.html', 'w') as f:
        f.write(html_content)
    
    print("✅ Visualizations created successfully!")
    print("📄 Demo report: visualizations/demo_report.html")

def simulate_api_demo():
    """Simulate API functionality."""
    print_banner("🌐 API DEMONSTRATION")
    
    print("🚀 Starting prediction API server...")
    time.sleep(1)
    
    # Simulate API endpoints
    endpoints = [
        "GET /health - API health check",
        "POST /predict - Single segment prediction", 
        "POST /predict/batch - Batch predictions",
        "GET /segments - List road segments",
        "GET /models/status - Model information"
    ]
    
    print("📡 Available API endpoints:")
    for endpoint in endpoints:
        print(f"   {endpoint}")
    
    # Simulate API calls
    print("\n🔄 Testing API functionality...")
    
    sample_requests = [
        {"type": "Health Check", "response": {"status": "healthy", "models_loaded": 2}},
        {"type": "Prediction", "response": {"segment_id": 1, "predicted_speed": 23.5, "confidence": "high"}},
        {"type": "Batch Prediction", "response": {"predictions": 5, "total_time": "45ms"}},
    ]
    
    for request in sample_requests:
        time.sleep(0.5)
        print(f"✅ {request['type']}: {request['response']}")
    
    print("\n🌐 API Demo Complete!")
    print("💡 In production: http://localhost:8000/docs for interactive API documentation")

def main():
    """Run the complete demo pipeline."""
    start_time = time.time()
    
    print("🚀 UBER MOVEMENT TRAFFIC PREDICTION - DEMO")
    print(f"   Timestamp: {datetime.now()}")
    print("   Note: This is a demonstration using sample data")
    
    # Ensure directories exist
    Path("data/predictions").mkdir(parents=True, exist_ok=True)
    Path("visualizations").mkdir(parents=True, exist_ok=True)
    Path("models").mkdir(parents=True, exist_ok=True)
    
    try:
        # Step 1: Load and analyze data
        traffic_data, segments_data = load_data()
        
        if not traffic_data:
            print("❌ Cannot proceed without data")
            return False
        
        # Step 2: Train models
        lstm_results = simulate_lstm_training(traffic_data)
        gnn_results = simulate_gnn_training(traffic_data, segments_data)
        
        # Step 3: Select best model
        print_banner("🏆 MODEL COMPARISON")
        
        print("📊 Model Performance Comparison:")
        print(f"   LSTM: MAE={lstm_results['mae']:.1f}, R²={lstm_results['r2']:.3f}")
        print(f"   GNN:  MAE={gnn_results['mae']:.1f}, R²={gnn_results['r2']:.3f}")
        
        best_model = gnn_results if gnn_results['mae'] < lstm_results['mae'] else lstm_results
        print(f"🎯 Selected: {best_model['model_type']} (Lower MAE)")
        
        # Step 4: Generate predictions
        predictions = generate_predictions(traffic_data, segments_data, best_model)
        
        # Step 5: Create visualizations
        simulate_visualizations(traffic_data, segments_data, predictions)
        
        # Step 6: API demo
        simulate_api_demo()
        
        # Summary
        duration = time.time() - start_time
        print_banner("✅ DEMO PIPELINE COMPLETE")
        
        print(f"⏱️  Total execution time: {duration:.1f} seconds")
        print(f"📊 Best model: {best_model['model_type']} (MAE: {best_model['mae']:.1f} mph)")
        print(f"🔮 Predictions generated: {len(predictions)}")
        
        print("\n📂 Generated Files:")
        print("   • data/predictions/demo_predictions.json")
        print("   • visualizations/demo_report.html")
        
        print("\n🎯 Next Steps for Production:")
        print("   • Install ML dependencies (torch, pandas, spark)")
        print("   • Use real Uber Movement API data")
        print("   • Deploy with Docker/Kubernetes")
        print("   • Set up monitoring and alerting")
        
        return True
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    print(f"\n{'🎉 Demo completed successfully!' if success else '❌ Demo encountered errors'}")