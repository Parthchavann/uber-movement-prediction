"""
Apache Spark data processing pipeline for Uber Movement traffic data.
"""

from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.sql.window import Window
import pyspark.sql.functions as F
from typing import Dict, List, Optional
import yaml
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SparkTrafficProcessor:
    """Process traffic data using Apache Spark for scalability."""
    
    def __init__(self, config_path: str = "config/config.yaml"):
        self.config = self._load_config(config_path)
        self.spark = self._create_spark_session()
        
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from YAML file."""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config file {config_path} not found, using defaults")
            return {
                'spark': {
                    'app_name': 'UberMovementPrediction',
                    'master': 'local[*]',
                    'executor_memory': '4g',
                    'driver_memory': '2g'
                },
                'data': {
                    'raw_data_path': 'data/raw/',
                    'processed_data_path': 'data/processed/'
                }
            }
    
    def _create_spark_session(self) -> SparkSession:
        """Create and configure Spark session."""
        spark_config = self.config.get('spark', {})
        
        spark = SparkSession.builder \
            .appName(spark_config.get('app_name', 'UberMovementPrediction')) \
            .master(spark_config.get('master', 'local[*]')) \
            .config("spark.executor.memory", spark_config.get('executor_memory', '4g')) \
            .config("spark.driver.memory", spark_config.get('driver_memory', '2g')) \
            .config("spark.sql.adaptive.enabled", "true") \
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
            .getOrCreate()
        
        spark.sparkContext.setLogLevel("WARN")
        logger.info("Spark session created successfully")
        return spark
    
    def load_traffic_data(self, city: str) -> "DataFrame":
        """Load traffic data from CSV files."""
        data_path = f"{self.config['data']['raw_data_path']}{city}_traffic_data.csv"
        
        schema = StructType([
            StructField("segment_id", IntegerType(), True),
            StructField("timestamp", TimestampType(), True),
            StructField("hour", IntegerType(), True),
            StructField("day_of_week", IntegerType(), True),
            StructField("month", IntegerType(), True),
            StructField("speed_mph", DoubleType(), True),
            StructField("start_lat", DoubleType(), True),
            StructField("start_lon", DoubleType(), True),
            StructField("end_lat", DoubleType(), True),
            StructField("end_lon", DoubleType(), True)
        ])
        
        df = self.spark.read \
            .option("header", "true") \
            .schema(schema) \
            .csv(data_path)
        
        logger.info(f"Loaded {df.count()} records for {city}")
        return df
    
    def create_features(self, df: "DataFrame") -> "DataFrame":
        """Create features for machine learning models."""
        
        # Time-based features
        df = df.withColumn("is_weekend", when(col("day_of_week") >= 5, 1).otherwise(0))
        df = df.withColumn("is_rush_hour", 
                          when((col("hour").between(7, 9)) | (col("hour").between(17, 19)), 1)
                          .otherwise(0))
        df = df.withColumn("time_of_day", 
                          when(col("hour").between(6, 11), "morning")
                          .when(col("hour").between(12, 17), "afternoon")
                          .when(col("hour").between(18, 22), "evening")
                          .otherwise("night"))
        
        # Lag features for temporal dependencies
        window_spec = Window.partitionBy("segment_id").orderBy("timestamp")
        
        for lag in [1, 2, 3, 6, 12, 24]:
            df = df.withColumn(f"speed_lag_{lag}h", 
                             lag("speed_mph", lag).over(window_spec))
        
        # Rolling statistics
        window_24h = Window.partitionBy("segment_id") \
                          .orderBy("timestamp") \
                          .rowsBetween(-24, -1)
        
        df = df.withColumn("speed_24h_avg", avg("speed_mph").over(window_24h))
        df = df.withColumn("speed_24h_std", stddev("speed_mph").over(window_24h))
        df = df.withColumn("speed_24h_min", min("speed_mph").over(window_24h))
        df = df.withColumn("speed_24h_max", max("speed_mph").over(window_24h))
        
        # Segment-based features
        segment_stats = df.groupBy("segment_id").agg(
            avg("speed_mph").alias("segment_avg_speed"),
            stddev("speed_mph").alias("segment_std_speed"),
            count("*").alias("segment_observation_count")
        )
        
        df = df.join(segment_stats, on="segment_id", how="left")
        
        # Calculate distance for each segment
        df = df.withColumn("segment_distance_km",
                          acos(
                              sin(radians(col("start_lat"))) * sin(radians(col("end_lat"))) +
                              cos(radians(col("start_lat"))) * cos(radians(col("end_lat"))) *
                              cos(radians(col("end_lon")) - radians(col("start_lon")))
                          ) * 6371.0)  # Earth radius in km
        
        return df
    
    def create_sequences(self, df: "DataFrame", sequence_length: int = 24) -> "DataFrame":
        """Create sequences for LSTM training."""
        
        # Sort by segment and timestamp
        df = df.orderBy("segment_id", "timestamp")
        
        # Create sequence windows
        window_spec = Window.partitionBy("segment_id").orderBy("timestamp")
        
        # Create arrays of features for sequences
        feature_cols = ["speed_mph", "hour", "day_of_week", "is_weekend", "is_rush_hour"]
        
        for col_name in feature_cols:
            # Create sequences using collect_list over window
            sequence_window = Window.partitionBy("segment_id") \
                                   .orderBy("timestamp") \
                                   .rowsBetween(-(sequence_length-1), 0)
            
            df = df.withColumn(f"{col_name}_sequence", 
                             collect_list(col(col_name)).over(sequence_window))
        
        # Filter rows that have complete sequences
        df = df.filter(size(col("speed_mph_sequence")) == sequence_length)
        
        return df
    
    def create_graph_features(self, df: "DataFrame", segments_df: "DataFrame") -> "DataFrame":
        """Create graph-based features for GNN model."""
        
        # Calculate segment adjacency based on geographic proximity
        segments_df = segments_df.withColumn("segment_center_lat", 
                                           (col("start_lat") + col("end_lat")) / 2)
        segments_df = segments_df.withColumn("segment_center_lon",
                                           (col("start_lon") + col("end_lon")) / 2)
        
        # Self-join to find nearby segments
        segments_alias1 = segments_df.alias("s1")
        segments_alias2 = segments_df.alias("s2")
        
        adjacency = segments_alias1.join(segments_alias2, 
                                        col("s1.segment_id") != col("s2.segment_id")) \
            .withColumn("distance_km",
                       acos(
                           sin(radians(col("s1.segment_center_lat"))) * 
                           sin(radians(col("s2.segment_center_lat"))) +
                           cos(radians(col("s1.segment_center_lat"))) * 
                           cos(radians(col("s2.segment_center_lat"))) *
                           cos(radians(col("s2.segment_center_lon")) - 
                               radians(col("s1.segment_center_lon")))
                       ) * 6371.0) \
            .filter(col("distance_km") <= 1.0)  # Adjacent if within 1km
        
        # Create edge list for graph
        edge_list = adjacency.select(
            col("s1.segment_id").alias("source"),
            col("s2.segment_id").alias("target"),
            col("distance_km").alias("weight")
        )
        
        return edge_list
    
    def save_processed_data(self, df: "DataFrame", output_path: str, format: str = "parquet"):
        """Save processed data to specified format."""
        
        if format == "parquet":
            df.write.mode("overwrite").parquet(output_path)
        elif format == "csv":
            df.write.mode("overwrite") \
              .option("header", "true") \
              .csv(output_path)
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        logger.info(f"Saved processed data to {output_path}")
    
    def process_city_data(self, city: str):
        """Complete processing pipeline for a city."""
        
        logger.info(f"Processing data for {city}")
        
        # Load data
        df = self.load_traffic_data(city)
        
        # Create features
        df_features = self.create_features(df)
        
        # Save feature data
        feature_path = f"{self.config['data']['processed_data_path']}{city}_features"
        self.save_processed_data(df_features, feature_path)
        
        # Create sequences for LSTM
        df_sequences = self.create_sequences(df_features, sequence_length=24)
        sequence_path = f"{self.config['data']['processed_data_path']}{city}_sequences"
        self.save_processed_data(df_sequences, sequence_path)
        
        # Load segments and create graph features
        segments_path = f"{self.config['data']['raw_data_path']}{city}_segments.csv"
        segments_df = self.spark.read.option("header", "true").csv(segments_path)
        
        # Convert string columns to appropriate types
        segments_df = segments_df.select(
            col("segment_id").cast("int"),
            col("start_lat").cast("double"),
            col("start_lon").cast("double"), 
            col("end_lat").cast("double"),
            col("end_lon").cast("double")
        )
        
        edge_list = self.create_graph_features(df_features, segments_df)
        graph_path = f"{self.config['data']['processed_data_path']}{city}_graph_edges"
        self.save_processed_data(edge_list, graph_path)
        
        logger.info(f"Completed processing for {city}")
        
        return {
            'features': df_features,
            'sequences': df_sequences,
            'graph_edges': edge_list
        }
    
    def get_data_stats(self, city: str):
        """Get statistics about processed data."""
        
        feature_path = f"{self.config['data']['processed_data_path']}{city}_features"
        
        try:
            df = self.spark.read.parquet(feature_path)
            
            stats = {
                'total_records': df.count(),
                'unique_segments': df.select("segment_id").distinct().count(),
                'date_range': {
                    'min': df.agg(min("timestamp")).collect()[0][0],
                    'max': df.agg(max("timestamp")).collect()[0][0]
                },
                'speed_stats': df.agg(
                    avg("speed_mph").alias("avg"),
                    stddev("speed_mph").alias("std"),
                    min("speed_mph").alias("min"),
                    max("speed_mph").alias("max")
                ).collect()[0].asDict()
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting stats for {city}: {e}")
            return None
    
    def close(self):
        """Close Spark session."""
        if self.spark:
            self.spark.stop()
            logger.info("Spark session closed")

def main():
    """Main function to run data processing."""
    
    processor = SparkTrafficProcessor()
    
    try:
        # Process sample cities
        cities = ["san_francisco"]
        
        for city in cities:
            results = processor.process_city_data(city)
            stats = processor.get_data_stats(city)
            
            if stats:
                print(f"\n=== Processing Stats for {city} ===")
                print(f"Total records: {stats['total_records']}")
                print(f"Unique segments: {stats['unique_segments']}")
                print(f"Date range: {stats['date_range']['min']} to {stats['date_range']['max']}")
                print(f"Speed stats: {stats['speed_stats']}")
        
    finally:
        processor.close()

if __name__ == "__main__":
    main()