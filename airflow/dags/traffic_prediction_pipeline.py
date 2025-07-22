"""
Airflow DAG for Uber Movement traffic prediction pipeline.
"""

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.operators.bash_operator import BashOperator
from airflow.operators.dummy_operator import DummyOperator
from airflow.providers.spark.operators.spark_submit import SparkSubmitOperator
import sys
import os

# Add project root to path
sys.path.append('/opt/airflow/dags/uber-movement-prediction')

default_args = {
    'owner': 'traffic-analytics-team',
    'depends_on_past': False,
    'start_date': datetime(2023, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'catchup': False
}

dag = DAG(
    'traffic_prediction_pipeline',
    default_args=default_args,
    description='End-to-end traffic speed prediction pipeline',
    schedule_interval='0 */6 * * *',  # Every 6 hours
    tags=['traffic', 'prediction', 'uber-movement'],
    max_active_runs=1
)

def download_traffic_data(**context):
    """Download latest traffic data from Uber Movement API."""
    from scripts.download_data import UberMovementDownloader
    
    execution_date = context['execution_date']
    cities = ['san_francisco', 'new_york', 'london']
    
    downloader = UberMovementDownloader()
    
    for city in cities:
        try:
            df = downloader.download_and_save(city)
            if df is not None:
                print(f"Successfully downloaded data for {city}: {len(df)} records")
            else:
                print(f"Failed to download data for {city}")
        except Exception as e:
            print(f"Error downloading data for {city}: {e}")
            raise

def validate_data(**context):
    """Validate downloaded data quality."""
    import pandas as pd
    import numpy as np
    
    cities = ['san_francisco', 'new_york', 'london']
    
    for city in cities:
        try:
            data_file = f"data/raw/{city}_traffic_data.csv"
            if os.path.exists(data_file):
                df = pd.read_csv(data_file)
                
                # Data quality checks
                checks = {
                    'non_empty': len(df) > 0,
                    'no_null_speeds': df['speed_mph'].notna().all(),
                    'speed_range': (df['speed_mph'] >= 0).all() and (df['speed_mph'] <= 100).all(),
                    'valid_coordinates': (
                        df['start_lat'].between(-90, 90).all() and
                        df['start_lon'].between(-180, 180).all()
                    )
                }
                
                failed_checks = [check for check, passed in checks.items() if not passed]
                
                if failed_checks:
                    raise ValueError(f"Data validation failed for {city}: {failed_checks}")
                
                print(f"Data validation passed for {city}")
            else:
                print(f"Data file not found for {city}: {data_file}")
                
        except Exception as e:
            print(f"Error validating data for {city}: {e}")
            raise

def preprocess_data(**context):
    """Run Spark data preprocessing."""
    from src.data_processing.spark_processor import SparkTrafficProcessor
    
    processor = SparkTrafficProcessor()
    
    try:
        cities = ['san_francisco']  # Start with one city
        
        for city in cities:
            results = processor.process_city_data(city)
            stats = processor.get_data_stats(city)
            
            if stats:
                print(f"Preprocessing completed for {city}")
                print(f"Total records: {stats['total_records']}")
                print(f"Unique segments: {stats['unique_segments']}")
            else:
                raise ValueError(f"Preprocessing failed for {city}")
                
    finally:
        processor.close()

def train_lstm_model(**context):
    """Train LSTM model for traffic prediction."""
    from src.models.lstm_model import LSTMTrainer
    
    trainer = LSTMTrainer()
    
    try:
        # Use processed data
        data_path = "data/raw/san_francisco_traffic_data.csv"
        
        train_loader, val_loader, test_loader = trainer.prepare_data(data_path)
        train_losses, val_losses = trainer.train_model(train_loader, val_loader)
        metrics = trainer.evaluate_model(test_loader)
        
        # Save model
        trainer.save_model("models/lstm_latest.pth")
        
        print(f"LSTM training completed")
        print(f"Final metrics - MAE: {metrics['mae']:.2f}, RMSE: {metrics['rmse']:.2f}, R²: {metrics['r2']:.4f}")
        
        # Store metrics in XCom for downstream tasks
        return {
            'mae': metrics['mae'],
            'rmse': metrics['rmse'],
            'r2': metrics['r2']
        }
        
    except Exception as e:
        print(f"Error training LSTM model: {e}")
        raise

def train_gnn_model(**context):
    """Train GNN model for traffic prediction."""
    from src.models.gnn_model import GNNTrainer
    
    trainer = GNNTrainer()
    
    try:
        traffic_path = "data/raw/san_francisco_traffic_data.csv"
        segments_path = "data/raw/san_francisco_segments.csv"
        
        train_data, val_data, test_data = trainer.prepare_graph_data(traffic_path, segments_path)
        trainer.train_model(train_data, val_data)
        metrics = trainer.evaluate_model(test_data)
        
        # Save model
        trainer.save_model("models/gnn_latest.pth")
        
        print(f"GNN training completed")
        print(f"Final metrics - MAE: {metrics['mae']:.2f}, RMSE: {metrics['rmse']:.2f}, R²: {metrics['r2']:.4f}")
        
        return {
            'mae': metrics['mae'],
            'rmse': metrics['rmse'],
            'r2': metrics['r2']
        }
        
    except Exception as e:
        print(f"Error training GNN model: {e}")
        raise

def evaluate_models(**context):
    """Compare model performance and select best model."""
    
    # Get metrics from upstream tasks
    lstm_metrics = context['task_instance'].xcom_pull(task_ids='train_lstm_model')
    gnn_metrics = context['task_instance'].xcom_pull(task_ids='train_gnn_model')
    
    print("Model Performance Comparison:")
    print(f"LSTM - MAE: {lstm_metrics['mae']:.2f}, RMSE: {lstm_metrics['rmse']:.2f}, R²: {lstm_metrics['r2']:.4f}")
    print(f"GNN  - MAE: {gnn_metrics['mae']:.2f}, RMSE: {gnn_metrics['rmse']:.2f}, R²: {gnn_metrics['r2']:.4f}")
    
    # Select best model based on RMSE
    if lstm_metrics['rmse'] < gnn_metrics['rmse']:
        best_model = 'lstm'
        best_metrics = lstm_metrics
    else:
        best_model = 'gnn'
        best_metrics = gnn_metrics
    
    print(f"Best model: {best_model.upper()}")
    
    # Copy best model to production path
    import shutil
    shutil.copy(f"models/{best_model}_latest.pth", "models/production_model.pth")
    
    # Write model info
    with open("models/production_model_info.txt", "w") as f:
        f.write(f"Model Type: {best_model.upper()}\n")
        f.write(f"MAE: {best_metrics['mae']:.2f}\n")
        f.write(f"RMSE: {best_metrics['rmse']:.2f}\n")
        f.write(f"R²: {best_metrics['r2']:.4f}\n")
        f.write(f"Training Date: {context['execution_date']}\n")
    
    return {
        'best_model': best_model,
        'metrics': best_metrics
    }

def generate_predictions(**context):
    """Generate predictions for next time periods."""
    import pandas as pd
    import numpy as np
    from datetime import datetime, timedelta
    
    # Load latest data
    traffic_data = pd.read_csv("data/raw/san_francisco_traffic_data.csv")
    
    # Generate future timestamps
    latest_time = pd.to_datetime(traffic_data['timestamp']).max()
    future_times = [latest_time + timedelta(hours=i) for i in range(1, 25)]  # Next 24 hours
    
    # For demo, create synthetic predictions
    predictions = []
    for segment_id in traffic_data['segment_id'].unique():
        segment_avg = traffic_data[traffic_data['segment_id'] == segment_id]['speed_mph'].mean()
        
        for time in future_times:
            hour = time.hour
            # Simulate rush hour effects
            if hour in [7, 8, 9, 17, 18, 19]:
                predicted_speed = segment_avg * 0.7
            else:
                predicted_speed = segment_avg * np.random.normal(1.0, 0.1)
            
            predictions.append({
                'segment_id': segment_id,
                'timestamp': time,
                'predicted_speed': max(5, min(60, predicted_speed))
            })
    
    # Save predictions
    predictions_df = pd.DataFrame(predictions)
    predictions_df.to_csv("data/predictions/latest_predictions.csv", index=False)
    
    print(f"Generated {len(predictions)} predictions for next 24 hours")

def create_visualizations(**context):
    """Generate updated visualizations."""
    from src.visualization.map_viz import TrafficDashboard
    import pandas as pd
    
    # Load data
    traffic_data = pd.read_csv("data/raw/san_francisco_traffic_data.csv")
    segments_data = pd.read_csv("data/raw/san_francisco_segments.csv")
    
    try:
        predictions_data = pd.read_csv("data/predictions/latest_predictions.csv")
    except:
        predictions_data = None
    
    # Create dashboard
    dashboard = TrafficDashboard()
    
    # Create output directory with timestamp
    execution_date = context['execution_date'].strftime('%Y%m%d_%H%M%S')
    output_dir = f"visualizations/run_{execution_date}"
    
    # Generate all visualizations
    dashboard.save_all_visualizations(
        traffic_data, 
        segments_data, 
        predictions_data,
        output_dir=output_dir
    )
    
    print(f"Visualizations saved to {output_dir}")

def send_notifications(**context):
    """Send completion notifications."""
    
    # Get best model info
    best_model_info = context['task_instance'].xcom_pull(task_ids='evaluate_models')
    
    execution_date = context['execution_date']
    
    message = f"""
    Traffic Prediction Pipeline Completed Successfully
    
    Execution Date: {execution_date}
    Best Model: {best_model_info['best_model'].upper()}
    Performance Metrics:
    - MAE: {best_model_info['metrics']['mae']:.2f} mph
    - RMSE: {best_model_info['metrics']['rmse']:.2f} mph
    - R²: {best_model_info['metrics']['r2']:.4f}
    
    Pipeline Status: SUCCESS
    """
    
    print(message)
    
    # In production, you would send this via email, Slack, etc.
    # For demo, just log it
    with open("logs/pipeline_status.log", "a") as f:
        f.write(f"{datetime.now()}: {message}\n")

# Define tasks
start_task = DummyOperator(
    task_id='start_pipeline',
    dag=dag
)

download_data_task = PythonOperator(
    task_id='download_data',
    python_callable=download_traffic_data,
    dag=dag
)

validate_data_task = PythonOperator(
    task_id='validate_data',
    python_callable=validate_data,
    dag=dag
)

preprocess_data_task = PythonOperator(
    task_id='preprocess_data',
    python_callable=preprocess_data,
    dag=dag
)

train_lstm_task = PythonOperator(
    task_id='train_lstm_model',
    python_callable=train_lstm_model,
    dag=dag
)

train_gnn_task = PythonOperator(
    task_id='train_gnn_model',
    python_callable=train_gnn_model,
    dag=dag
)

evaluate_models_task = PythonOperator(
    task_id='evaluate_models',
    python_callable=evaluate_models,
    dag=dag
)

generate_predictions_task = PythonOperator(
    task_id='generate_predictions',
    python_callable=generate_predictions,
    dag=dag
)

create_visualizations_task = PythonOperator(
    task_id='create_visualizations',
    python_callable=create_visualizations,
    dag=dag
)

send_notifications_task = PythonOperator(
    task_id='send_notifications',
    python_callable=send_notifications,
    dag=dag
)

end_task = DummyOperator(
    task_id='end_pipeline',
    dag=dag
)

# Define task dependencies
start_task >> download_data_task >> validate_data_task >> preprocess_data_task

preprocess_data_task >> [train_lstm_task, train_gnn_task]

[train_lstm_task, train_gnn_task] >> evaluate_models_task

evaluate_models_task >> generate_predictions_task >> create_visualizations_task

create_visualizations_task >> send_notifications_task >> end_task

# Task groups for better visualization
from airflow.utils.task_group import TaskGroup

with TaskGroup("data_ingestion", dag=dag) as data_ingestion_group:
    download_data_task
    validate_data_task
    preprocess_data_task

with TaskGroup("model_training", dag=dag) as model_training_group:
    train_lstm_task
    train_gnn_task
    evaluate_models_task

with TaskGroup("output_generation", dag=dag) as output_group:
    generate_predictions_task
    create_visualizations_task
    send_notifications_task