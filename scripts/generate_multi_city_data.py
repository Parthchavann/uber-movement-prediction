#!/usr/bin/env python3
"""
Generate realistic multi-city traffic data for SF, NYC, and London.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.download_data import UberMovementDownloader
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Generate realistic multi-city traffic data."""
    downloader = UberMovementDownloader()
    
    logger.info("🌍 Generating realistic multi-city traffic data...")
    all_city_data = downloader.generate_realistic_multi_city_data()
    
    # Summary statistics
    total_records = 0
    total_segments = 0
    
    for city_name, city_data in all_city_data.items():
        traffic_df = city_data['traffic']
        segments_df = city_data['segments']
        
        total_records += len(traffic_df)
        total_segments += len(segments_df)
        
        print(f"\n=== {city_name.upper()} TRAFFIC DATA ===")
        print(f"📈 Traffic Records: {len(traffic_df):,}")
        print(f"🛣️  Road Segments: {len(segments_df):,}")
        print(f"⚡ Average Speed: {traffic_df['speed_mph'].mean():.1f} mph")
        
        # Rush hour analysis
        rush_hour_data = traffic_df[traffic_df['is_rush_hour'] == True]
        off_peak_data = traffic_df[traffic_df['is_rush_hour'] == False]
        
        if len(rush_hour_data) > 0:
            rush_avg = rush_hour_data['speed_mph'].mean()
            off_peak_avg = off_peak_data['speed_mph'].mean()
            reduction = (off_peak_avg - rush_avg) / off_peak_avg * 100
            
            print(f"🚦 Rush Hour Impact: {reduction:.1f}% speed reduction")
    
    print(f"\n🎯 TOTAL DATASET:")
    print(f"📊 Total Records: {total_records:,}")
    print(f"🌍 Total Segments: {total_segments:,}")
    print(f"🏙️  Cities: San Francisco, New York, London")
    
    logger.info("✅ Multi-city data generation complete!")
    return all_city_data

if __name__ == "__main__":
    main()