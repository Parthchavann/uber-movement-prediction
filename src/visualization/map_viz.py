"""
Interactive map visualizations for traffic speed data using Folium and KeplerGL.
"""

import folium
from folium import plugins
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import logging
from typing import Dict, List, Optional, Tuple
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrafficMapVisualizer:
    """Create interactive maps for traffic speed visualization."""
    
    def __init__(self, 
                 center_lat: float = 37.7749,
                 center_lon: float = -122.4194,
                 zoom_start: int = 11):
        self.center_lat = center_lat
        self.center_lon = center_lon
        self.zoom_start = zoom_start
        
    def create_speed_heatmap(self, 
                           traffic_data: pd.DataFrame,
                           output_path: str = "traffic_heatmap.html"):
        """Create a heatmap showing traffic speeds across the city."""
        
        # Create base map
        m = folium.Map(
            location=[self.center_lat, self.center_lon],
            zoom_start=self.zoom_start,
            tiles='OpenStreetMap'
        )
        
        # Prepare data for heatmap
        heat_data = []
        for _, row in traffic_data.iterrows():
            # Use start coordinates and speed for heatmap
            lat = row['start_lat']
            lon = row['start_lon']
            speed = row['speed_mph']
            
            # Normalize speed to 0-1 for heatmap intensity
            intensity = speed / 60.0  # Assuming max speed of 60 mph
            heat_data.append([lat, lon, intensity])
        
        # Add heatmap layer
        if heat_data:
            heatmap = plugins.HeatMap(heat_data, radius=15, blur=10)
            heatmap.add_to(m)
        
        # Add color scale legend
        colormap = folium.LinearColormap(
            colors=['red', 'yellow', 'green'],
            vmin=0, vmax=60,
            caption='Traffic Speed (mph)'
        )
        colormap.add_to(m)
        
        # Save map
        m.save(output_path)
        logger.info(f"Speed heatmap saved to {output_path}")
        
        return m
    
    def create_segment_map(self, 
                          traffic_data: pd.DataFrame,
                          segments_data: pd.DataFrame,
                          timestamp: Optional[str] = None,
                          output_path: str = "segment_map.html"):
        """Create a map showing individual road segments colored by speed."""
        
        # Create base map
        m = folium.Map(
            location=[self.center_lat, self.center_lon],
            zoom_start=self.zoom_start,
            tiles='CartoDB positron'
        )
        
        # Filter data for specific timestamp if provided
        if timestamp:
            traffic_data = traffic_data[traffic_data['timestamp'] == timestamp]
        else:
            # Use latest timestamp
            traffic_data = traffic_data[traffic_data['timestamp'] == traffic_data['timestamp'].max()]
        
        # Merge with segments data
        merged_data = traffic_data.merge(segments_data, on='segment_id', how='left')
        
        # Define color mapping for speeds
        def get_color(speed):
            if speed < 15:
                return 'red'
            elif speed < 25:
                return 'orange'
            elif speed < 35:
                return 'yellow'
            else:
                return 'green'
        
        # Add segments to map
        for _, row in merged_data.iterrows():
            if pd.notna(row['start_lat']) and pd.notna(row['end_lat']):
                # Create line for segment
                line = folium.PolyLine(
                    locations=[[row['start_lat'], row['start_lon']], 
                              [row['end_lat'], row['end_lon']]],
                    weight=5,
                    color=get_color(row['speed_mph']),
                    opacity=0.8,
                    popup=folium.Popup(
                        f"Segment {row['segment_id']}<br>"
                        f"Speed: {row['speed_mph']:.1f} mph<br>"
                        f"Time: {row.get('timestamp', 'N/A')}",
                        max_width=200
                    )
                )
                line.add_to(m)
        
        # Add legend
        legend_html = '''
        <div style="position: fixed; 
                    bottom: 50px; left: 50px; width: 150px; height: 90px; 
                    background-color: white; border:2px solid grey; z-index:9999; 
                    font-size:14px; padding: 10px">
        <h4>Speed Legend</h4>
        <p><i class="fa fa-minus" style="color:red"></i> < 15 mph (Congested)</p>
        <p><i class="fa fa-minus" style="color:orange"></i> 15-25 mph (Slow)</p>
        <p><i class="fa fa-minus" style="color:yellow"></i> 25-35 mph (Moderate)</p>
        <p><i class="fa fa-minus" style="color:green"></i> > 35 mph (Fast)</p>
        </div>
        '''
        m.get_root().html.add_child(folium.Element(legend_html))
        
        # Save map
        m.save(output_path)
        logger.info(f"Segment map saved to {output_path}")
        
        return m
    
    def create_time_series_animation(self, 
                                   traffic_data: pd.DataFrame,
                                   segments_data: pd.DataFrame,
                                   output_path: str = "traffic_animation.html"):
        """Create an animated map showing traffic changes over time."""
        
        # Ensure timestamp is datetime
        traffic_data['timestamp'] = pd.to_datetime(traffic_data['timestamp'])
        
        # Merge with segments data
        merged_data = traffic_data.merge(segments_data, on='segment_id', how='left')
        
        # Group by timestamp
        timestamps = sorted(merged_data['timestamp'].unique())
        
        # Create base map
        m = folium.Map(
            location=[self.center_lat, self.center_lon],
            zoom_start=self.zoom_start,
            tiles='CartoDB positron'
        )
        
        # Prepare data for time animation
        features = []
        
        for timestamp in timestamps:
            timestamp_data = merged_data[merged_data['timestamp'] == timestamp]
            
            for _, row in timestamp_data.iterrows():
                if pd.notna(row['start_lat']) and pd.notna(row['end_lat']):
                    feature = {
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [row['start_lon'], row['start_lat']],
                                [row['end_lon'], row['end_lat']]
                            ]
                        },
                        "properties": {
                            "times": [timestamp.isoformat()],
                            "speed": row['speed_mph'],
                            "segment_id": row['segment_id'],
                            "style": {
                                "color": self._get_color_hex(row['speed_mph']),
                                "weight": 5,
                                "opacity": 0.8
                            },
                            "popup": f"Segment {row['segment_id']}: {row['speed_mph']:.1f} mph"
                        }
                    }
                    features.append(feature)
        
        # Add timestamped geojson
        if features:
            plugins.TimestampedGeoJson({
                "type": "FeatureCollection",
                "features": features
            }, period="PT1H", add_last_point=True).add_to(m)
        
        # Save map
        m.save(output_path)
        logger.info(f"Animated map saved to {output_path}")
        
        return m
    
    def _get_color_hex(self, speed: float) -> str:
        """Get hex color based on speed."""
        if speed < 15:
            return '#FF0000'  # Red
        elif speed < 25:
            return '#FF8C00'  # Orange
        elif speed < 35:
            return '#FFD700'  # Yellow
        else:
            return '#32CD32'  # Green
    
    def create_prediction_comparison_map(self, 
                                       actual_data: pd.DataFrame,
                                       predicted_data: pd.DataFrame,
                                       segments_data: pd.DataFrame,
                                       output_path: str = "prediction_comparison.html"):
        """Create side-by-side maps comparing actual vs predicted speeds."""
        
        # Create subplots
        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=('Actual Speeds', 'Predicted Speeds'),
            specs=[[{"secondary_y": False}, {"secondary_y": False}]],
            horizontal_spacing=0.1
        )
        
        # Merge data with segments
        actual_merged = actual_data.merge(segments_data, on='segment_id', how='left')
        predicted_merged = predicted_data.merge(segments_data, on='segment_id', how='left')
        
        # Create scatter plots for both actual and predicted
        for i, (data, title) in enumerate([(actual_merged, 'Actual'), (predicted_merged, 'Predicted')]):
            fig.add_trace(
                go.Scattermapbox(
                    lat=data['start_lat'],
                    lon=data['start_lon'],
                    mode='markers',
                    marker=dict(
                        size=8,
                        color=data['speed_mph'],
                        colorscale='RdYlGn',
                        cmin=0,
                        cmax=60,
                        colorbar=dict(
                            title=f"{title} Speed (mph)",
                            x=0.45 if i == 0 else 1.02
                        )
                    ),
                    text=[f"Segment {sid}: {speed:.1f} mph" 
                          for sid, speed in zip(data['segment_id'], data['speed_mph'])],
                    hovertemplate="%{text}<extra></extra>",
                    name=title
                ),
                row=1, col=i+1
            )
        
        # Update layout
        fig.update_layout(
            mapbox1=dict(
                style="open-street-map",
                center=dict(lat=self.center_lat, lon=self.center_lon),
                zoom=self.zoom_start
            ),
            mapbox2=dict(
                style="open-street-map", 
                center=dict(lat=self.center_lat, lon=self.center_lon),
                zoom=self.zoom_start
            ),
            height=600,
            title="Traffic Speed Prediction Comparison"
        )
        
        # Save plot
        fig.write_html(output_path)
        logger.info(f"Prediction comparison map saved to {output_path}")
        
        return fig

class KeplerGLVisualizer:
    """Create advanced visualizations using KeplerGL."""
    
    def __init__(self):
        try:
            from keplergl import KeplerGl
            self.KeplerGl = KeplerGl
            self.available = True
        except ImportError:
            logger.warning("KeplerGL not available. Install with: pip install keplergl")
            self.available = False
    
    def create_kepler_visualization(self, 
                                  traffic_data: pd.DataFrame,
                                  segments_data: pd.DataFrame,
                                  output_path: str = "kepler_traffic.html"):
        """Create advanced visualization using KeplerGL."""
        
        if not self.available:
            logger.error("KeplerGL not available")
            return None
        
        # Prepare data for KeplerGL
        traffic_data['timestamp'] = pd.to_datetime(traffic_data['timestamp'])
        
        # Merge with segments
        viz_data = traffic_data.merge(segments_data, on='segment_id', how='left')
        
        # Create KeplerGL map
        config = {
            "version": "v1",
            "config": {
                "mapState": {
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "zoom": 11
                },
                "visState": {
                    "layers": [
                        {
                            "type": "line",
                            "config": {
                                "dataId": "traffic",
                                "label": "Traffic Speed",
                                "color": [255, 0, 0],
                                "columns": {
                                    "lat0": "start_lat",
                                    "lng0": "start_lon", 
                                    "lat1": "end_lat",
                                    "lng1": "end_lon"
                                },
                                "visConfig": {
                                    "colorRange": {
                                        "colors": ["#FF0000", "#FF8C00", "#FFD700", "#32CD32"]
                                    },
                                    "strokeColorField": {
                                        "name": "speed_mph",
                                        "type": "real"
                                    },
                                    "strokeColorScale": "quantile",
                                    "sizeRange": [2, 10],
                                    "targetColor": [255, 0, 0]
                                }
                            }
                        }
                    ]
                }
            }
        }
        
        # Create map
        map_viz = self.KeplerGl(height=600, data={"traffic": viz_data}, config=config)
        
        # Save to HTML
        map_viz.save_to_html(file_name=output_path)
        logger.info(f"KeplerGL visualization saved to {output_path}")
        
        return map_viz

class TrafficDashboard:
    """Create comprehensive traffic analytics dashboard."""
    
    def __init__(self):
        self.map_viz = TrafficMapVisualizer()
        self.kepler_viz = KeplerGLVisualizer()
    
    def create_dashboard_plots(self, 
                             traffic_data: pd.DataFrame,
                             segments_data: pd.DataFrame,
                             predictions_data: Optional[pd.DataFrame] = None):
        """Create comprehensive dashboard plots."""
        
        plots = {}
        
        # 1. Speed distribution by hour
        fig_hourly = px.box(
            traffic_data, 
            x='hour', 
            y='speed_mph',
            title='Speed Distribution by Hour of Day',
            labels={'speed_mph': 'Speed (mph)', 'hour': 'Hour of Day'}
        )
        plots['hourly_distribution'] = fig_hourly
        
        # 2. Speed trends over time
        daily_avg = traffic_data.groupby('timestamp')['speed_mph'].mean().reset_index()
        fig_trends = px.line(
            daily_avg,
            x='timestamp',
            y='speed_mph', 
            title='Average Speed Trends Over Time',
            labels={'speed_mph': 'Average Speed (mph)', 'timestamp': 'Time'}
        )
        plots['speed_trends'] = fig_trends
        
        # 3. Segment performance comparison
        segment_stats = traffic_data.groupby('segment_id').agg({
            'speed_mph': ['mean', 'std', 'min', 'max']
        }).round(2)
        segment_stats.columns = ['avg_speed', 'std_speed', 'min_speed', 'max_speed']
        segment_stats = segment_stats.reset_index()
        
        fig_segments = px.scatter(
            segment_stats,
            x='avg_speed',
            y='std_speed',
            size='max_speed',
            hover_data=['segment_id', 'min_speed'],
            title='Segment Performance: Average vs Variability',
            labels={'avg_speed': 'Average Speed (mph)', 'std_speed': 'Speed Variability (mph)'}
        )
        plots['segment_performance'] = fig_segments
        
        # 4. Rush hour analysis
        traffic_data['rush_hour'] = traffic_data['hour'].apply(
            lambda x: 'Morning Rush' if 7 <= x <= 9 
            else 'Evening Rush' if 17 <= x <= 19
            else 'Off Peak'
        )
        
        fig_rush = px.violin(
            traffic_data,
            x='rush_hour',
            y='speed_mph',
            title='Speed Distribution by Rush Hour Periods',
            labels={'speed_mph': 'Speed (mph)', 'rush_hour': 'Time Period'}
        )
        plots['rush_hour_analysis'] = fig_rush
        
        # 5. Prediction accuracy (if predictions provided)
        if predictions_data is not None:
            comparison_data = traffic_data.merge(
                predictions_data[['segment_id', 'timestamp', 'predicted_speed']], 
                on=['segment_id', 'timestamp'], 
                how='inner'
            )
            
            fig_accuracy = px.scatter(
                comparison_data,
                x='speed_mph',
                y='predicted_speed',
                title='Prediction Accuracy: Actual vs Predicted Speeds',
                labels={'speed_mph': 'Actual Speed (mph)', 'predicted_speed': 'Predicted Speed (mph)'}
            )
            # Add perfect prediction line
            min_speed = min(comparison_data['speed_mph'].min(), comparison_data['predicted_speed'].min())
            max_speed = max(comparison_data['speed_mph'].max(), comparison_data['predicted_speed'].max())
            fig_accuracy.add_shape(
                type="line",
                x0=min_speed, x1=max_speed,
                y0=min_speed, y1=max_speed,
                line=dict(color="red", dash="dash")
            )
            plots['prediction_accuracy'] = fig_accuracy
        
        return plots
    
    def save_all_visualizations(self, 
                              traffic_data: pd.DataFrame,
                              segments_data: pd.DataFrame,
                              predictions_data: Optional[pd.DataFrame] = None,
                              output_dir: str = "visualizations"):
        """Save all visualizations to output directory."""
        
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # Create dashboard plots
        plots = self.create_dashboard_plots(traffic_data, segments_data, predictions_data)
        
        # Save plotly figures
        for name, fig in plots.items():
            fig.write_html(output_path / f"{name}.html")
            logger.info(f"Saved {name} plot to {output_path / name}.html")
        
        # Create maps
        self.map_viz.create_speed_heatmap(
            traffic_data, 
            str(output_path / "speed_heatmap.html")
        )
        
        self.map_viz.create_segment_map(
            traffic_data, 
            segments_data,
            output_path=str(output_path / "segment_map.html")
        )
        
        self.map_viz.create_time_series_animation(
            traffic_data,
            segments_data, 
            output_path=str(output_path / "traffic_animation.html")
        )
        
        # Create KeplerGL visualization if available
        if self.kepler_viz.available:
            self.kepler_viz.create_kepler_visualization(
                traffic_data,
                segments_data,
                output_path=str(output_path / "kepler_traffic.html")
            )
        
        logger.info(f"All visualizations saved to {output_dir}")

def main():
    """Main function to create sample visualizations."""
    
    # Load sample data
    traffic_data = pd.read_csv("data/raw/san_francisco_traffic_data.csv")
    segments_data = pd.read_csv("data/raw/san_francisco_segments.csv")
    
    # Create dashboard
    dashboard = TrafficDashboard()
    
    # Save all visualizations
    dashboard.save_all_visualizations(traffic_data, segments_data)
    
    print("Visualizations created successfully!")
    print("Check the 'visualizations' directory for output files.")

if __name__ == "__main__":
    main()