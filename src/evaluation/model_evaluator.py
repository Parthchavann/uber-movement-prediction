"""
Comprehensive model evaluation and comparison framework.
"""

import numpy as np
import pandas as pd
import torch
import pickle
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    mean_absolute_percentage_error
)
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from typing import Dict, List, Tuple, Optional, Any
import logging
from pathlib import Path
import yaml
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelEvaluator:
    """Comprehensive model evaluation framework."""
    
    def __init__(self, config_path: str = "config/config.yaml"):
        self.config = self._load_config(config_path)
        self.results = {}
        self.models = {}
        
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from YAML file."""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config file {config_path} not found, using defaults")
            return {}
    
    def load_model_predictions(self, 
                             model_name: str,
                             predictions: np.ndarray,
                             actuals: np.ndarray,
                             metadata: Optional[Dict] = None):
        """Load predictions from a model for evaluation."""
        
        if len(predictions) != len(actuals):
            raise ValueError("Predictions and actuals must have same length")
        
        self.results[model_name] = {
            'predictions': predictions,
            'actuals': actuals,
            'metadata': metadata or {}
        }
        
        logger.info(f"Loaded predictions for {model_name}: {len(predictions)} samples")
    
    def calculate_metrics(self, model_name: str) -> Dict[str, float]:
        """Calculate comprehensive evaluation metrics for a model."""
        
        if model_name not in self.results:
            raise ValueError(f"Model {model_name} not found in results")
        
        predictions = self.results[model_name]['predictions']
        actuals = self.results[model_name]['actuals']
        
        # Basic regression metrics
        mae = mean_absolute_error(actuals, predictions)
        mse = mean_squared_error(actuals, predictions)
        rmse = np.sqrt(mse)
        r2 = r2_score(actuals, predictions)
        
        # Additional metrics
        mape = mean_absolute_percentage_error(actuals, predictions) * 100
        
        # Custom traffic-specific metrics
        # Accuracy within threshold (e.g., within 5 mph)
        threshold_accuracy_5 = np.mean(np.abs(predictions - actuals) <= 5) * 100
        threshold_accuracy_10 = np.mean(np.abs(predictions - actuals) <= 10) * 100
        
        # Rush hour performance (if hour information available)
        rush_hour_mae = None
        off_peak_mae = None
        
        # Direction accuracy (whether prediction captures speed increase/decrease)
        if len(predictions) > 1:
            actual_direction = np.diff(actuals) > 0
            pred_direction = np.diff(predictions) > 0
            direction_accuracy = np.mean(actual_direction == pred_direction) * 100
        else:
            direction_accuracy = None
        
        metrics = {
            'mae': mae,
            'mse': mse,
            'rmse': rmse,
            'r2': r2,
            'mape': mape,
            'threshold_accuracy_5mph': threshold_accuracy_5,
            'threshold_accuracy_10mph': threshold_accuracy_10,
            'direction_accuracy': direction_accuracy,
            'mean_actual': np.mean(actuals),
            'mean_predicted': np.mean(predictions),
            'std_actual': np.std(actuals),
            'std_predicted': np.std(predictions)
        }
        
        # Store metrics
        self.results[model_name]['metrics'] = metrics
        
        return metrics
    
    def calculate_all_metrics(self) -> Dict[str, Dict[str, float]]:
        """Calculate metrics for all loaded models."""
        
        all_metrics = {}
        for model_name in self.results.keys():
            all_metrics[model_name] = self.calculate_metrics(model_name)
        
        return all_metrics
    
    def compare_models(self) -> pd.DataFrame:
        """Create comparison table of all models."""
        
        if not self.results:
            logger.warning("No models loaded for comparison")
            return pd.DataFrame()
        
        # Calculate metrics for all models
        all_metrics = self.calculate_all_metrics()
        
        # Create comparison DataFrame
        comparison_df = pd.DataFrame(all_metrics).T
        comparison_df = comparison_df.round(4)
        
        # Rank models
        comparison_df['mae_rank'] = comparison_df['mae'].rank()
        comparison_df['rmse_rank'] = comparison_df['rmse'].rank()
        comparison_df['r2_rank'] = comparison_df['r2'].rank(ascending=False)
        comparison_df['overall_rank'] = (
            comparison_df['mae_rank'] + 
            comparison_df['rmse_rank'] + 
            comparison_df['r2_rank']
        ) / 3
        
        # Sort by overall rank
        comparison_df = comparison_df.sort_values('overall_rank')
        
        return comparison_df
    
    def create_prediction_plots(self, 
                              model_names: Optional[List[str]] = None,
                              output_dir: str = "evaluation_plots") -> Dict[str, Any]:
        """Create comprehensive prediction visualization plots."""
        
        if model_names is None:
            model_names = list(self.results.keys())
        
        Path(output_dir).mkdir(exist_ok=True)
        plots = {}
        
        # 1. Scatter plot: Actual vs Predicted
        fig_scatter = make_subplots(
            rows=1, cols=len(model_names),
            subplot_titles=model_names,
            shared_yaxes=True
        )
        
        for i, model_name in enumerate(model_names):
            if model_name not in self.results:
                continue
                
            actuals = self.results[model_name]['actuals']
            predictions = self.results[model_name]['predictions']
            
            fig_scatter.add_trace(
                go.Scatter(
                    x=actuals,
                    y=predictions,
                    mode='markers',
                    name=model_name,
                    opacity=0.6,
                    showlegend=(i == 0)
                ),
                row=1, col=i+1
            )
            
            # Add perfect prediction line
            min_val = min(actuals.min(), predictions.min())
            max_val = max(actuals.max(), predictions.max())
            
            fig_scatter.add_trace(
                go.Scatter(
                    x=[min_val, max_val],
                    y=[min_val, max_val],
                    mode='lines',
                    line=dict(color='red', dash='dash'),
                    name='Perfect Prediction' if i == 0 else None,
                    showlegend=(i == 0)
                ),
                row=1, col=i+1
            )
        
        fig_scatter.update_layout(
            title="Actual vs Predicted Speed Comparison",
            height=400
        )
        fig_scatter.update_xaxes(title_text="Actual Speed (mph)")
        fig_scatter.update_yaxes(title_text="Predicted Speed (mph)")
        
        plots['scatter_comparison'] = fig_scatter
        fig_scatter.write_html(f"{output_dir}/scatter_comparison.html")
        
        # 2. Residual plots
        fig_residuals = make_subplots(
            rows=1, cols=len(model_names),
            subplot_titles=model_names,
            shared_yaxes=True
        )
        
        for i, model_name in enumerate(model_names):
            if model_name not in self.results:
                continue
                
            actuals = self.results[model_name]['actuals']
            predictions = self.results[model_name]['predictions']
            residuals = actuals - predictions
            
            fig_residuals.add_trace(
                go.Scatter(
                    x=predictions,
                    y=residuals,
                    mode='markers',
                    name=model_name,
                    opacity=0.6,
                    showlegend=(i == 0)
                ),
                row=1, col=i+1
            )
            
            # Add zero line
            fig_residuals.add_hline(y=0, line_dash="dash", line_color="red", row=1, col=i+1)
        
        fig_residuals.update_layout(
            title="Residual Analysis",
            height=400
        )
        fig_residuals.update_xaxes(title_text="Predicted Speed (mph)")
        fig_residuals.update_yaxes(title_text="Residuals (mph)")
        
        plots['residuals'] = fig_residuals
        fig_residuals.write_html(f"{output_dir}/residuals.html")
        
        # 3. Error distribution
        fig_error_dist = go.Figure()
        
        for model_name in model_names:
            if model_name not in self.results:
                continue
                
            actuals = self.results[model_name]['actuals']
            predictions = self.results[model_name]['predictions']
            errors = np.abs(actuals - predictions)
            
            fig_error_dist.add_trace(
                go.Histogram(
                    x=errors,
                    name=model_name,
                    opacity=0.7,
                    nbinsx=30
                )
            )
        
        fig_error_dist.update_layout(
            title="Absolute Error Distribution",
            xaxis_title="Absolute Error (mph)",
            yaxis_title="Frequency",
            barmode='overlay'
        )
        
        plots['error_distribution'] = fig_error_dist
        fig_error_dist.write_html(f"{output_dir}/error_distribution.html")
        
        # 4. Time series comparison (if time information available)
        fig_timeseries = go.Figure()
        
        for model_name in model_names:
            if model_name not in self.results:
                continue
                
            actuals = self.results[model_name]['actuals']
            predictions = self.results[model_name]['predictions']
            
            # Use first 100 points for clarity
            n_points = min(100, len(actuals))
            x_axis = list(range(n_points))
            
            fig_timeseries.add_trace(
                go.Scatter(
                    x=x_axis,
                    y=actuals[:n_points],
                    mode='lines',
                    name=f'Actual',
                    line=dict(color='blue')
                )
            )
            
            fig_timeseries.add_trace(
                go.Scatter(
                    x=x_axis,
                    y=predictions[:n_points],
                    mode='lines',
                    name=f'{model_name} Predicted',
                    line=dict(dash='dash')
                )
            )
        
        fig_timeseries.update_layout(
            title="Time Series Prediction Comparison (First 100 Points)",
            xaxis_title="Time Step",
            yaxis_title="Speed (mph)"
        )
        
        plots['timeseries'] = fig_timeseries
        fig_timeseries.write_html(f"{output_dir}/timeseries_comparison.html")
        
        return plots
    
    def create_metrics_comparison_plot(self, output_dir: str = "evaluation_plots") -> go.Figure:
        """Create radar chart comparing model metrics."""
        
        comparison_df = self.compare_models()
        
        if comparison_df.empty:
            logger.warning("No models to compare")
            return None
        
        # Select key metrics for radar chart
        metrics_to_plot = ['mae', 'rmse', 'r2', 'mape', 'threshold_accuracy_5mph']
        
        # Normalize metrics for radar chart (0-1 scale)
        normalized_data = comparison_df[metrics_to_plot].copy()
        
        # For metrics where lower is better (mae, rmse, mape)
        for metric in ['mae', 'rmse', 'mape']:
            if metric in normalized_data.columns:
                normalized_data[metric] = 1 - (normalized_data[metric] / normalized_data[metric].max())
        
        # For metrics where higher is better (r2, accuracy)
        for metric in ['r2', 'threshold_accuracy_5mph']:
            if metric in normalized_data.columns:
                normalized_data[metric] = normalized_data[metric] / normalized_data[metric].max()
        
        # Create radar chart
        fig = go.Figure()
        
        for model_name in normalized_data.index:
            fig.add_trace(go.Scatterpolar(
                r=normalized_data.loc[model_name].values,
                theta=metrics_to_plot,
                fill='toself',
                name=model_name
            ))
        
        fig.update_layout(
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, 1]
                )
            ),
            showlegend=True,
            title="Model Performance Comparison (Normalized Metrics)"
        )
        
        Path(output_dir).mkdir(exist_ok=True)
        fig.write_html(f"{output_dir}/metrics_radar.html")
        
        return fig
    
    def statistical_significance_test(self, 
                                    model1_name: str, 
                                    model2_name: str) -> Dict[str, Any]:
        """Perform statistical significance test between two models."""
        
        from scipy import stats
        
        if model1_name not in self.results or model2_name not in self.results:
            raise ValueError("One or both models not found")
        
        errors1 = np.abs(self.results[model1_name]['actuals'] - self.results[model1_name]['predictions'])
        errors2 = np.abs(self.results[model2_name]['actuals'] - self.results[model2_name]['predictions'])
        
        # Paired t-test
        t_stat, p_value = stats.ttest_rel(errors1, errors2)
        
        # Wilcoxon signed-rank test (non-parametric)
        wilcoxon_stat, wilcoxon_p = stats.wilcoxon(errors1, errors2)
        
        # Effect size (Cohen's d)
        pooled_std = np.sqrt((np.var(errors1) + np.var(errors2)) / 2)
        cohens_d = (np.mean(errors1) - np.mean(errors2)) / pooled_std
        
        result = {
            'model1': model1_name,
            'model2': model2_name,
            'model1_mean_error': np.mean(errors1),
            'model2_mean_error': np.mean(errors2),
            'paired_t_test': {
                't_statistic': t_stat,
                'p_value': p_value,
                'significant': p_value < 0.05
            },
            'wilcoxon_test': {
                'statistic': wilcoxon_stat,
                'p_value': wilcoxon_p,
                'significant': wilcoxon_p < 0.05
            },
            'effect_size': {
                'cohens_d': cohens_d,
                'interpretation': self._interpret_cohens_d(cohens_d)
            }
        }
        
        return result
    
    def _interpret_cohens_d(self, d: float) -> str:
        """Interpret Cohen's d effect size."""
        abs_d = abs(d)
        if abs_d < 0.2:
            return "negligible"
        elif abs_d < 0.5:
            return "small"
        elif abs_d < 0.8:
            return "medium"
        else:
            return "large"
    
    def generate_evaluation_report(self, output_path: str = "model_evaluation_report.html"):
        """Generate comprehensive evaluation report."""
        
        comparison_df = self.compare_models()
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Traffic Speed Prediction Model Evaluation Report</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                h1, h2 {{ color: #333; }}
                table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                .best {{ background-color: #d4edda; }}
                .metrics {{ display: flex; flex-wrap: wrap; gap: 20px; }}
                .metric-card {{ 
                    border: 1px solid #ddd; 
                    padding: 15px; 
                    border-radius: 5px; 
                    flex: 1; 
                    min-width: 200px; 
                }}
            </style>
        </head>
        <body>
            <h1>Traffic Speed Prediction Model Evaluation Report</h1>
            <p><strong>Generated:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            
            <h2>Model Comparison Summary</h2>
            <table>
                <tr>
                    <th>Model</th>
                    <th>MAE (mph)</th>
                    <th>RMSE (mph)</th>
                    <th>R²</th>
                    <th>MAPE (%)</th>
                    <th>5mph Accuracy (%)</th>
                    <th>Overall Rank</th>
                </tr>
        """
        
        for i, (model_name, row) in enumerate(comparison_df.iterrows()):
            row_class = "best" if i == 0 else ""
            html_content += f"""
                <tr class="{row_class}">
                    <td><strong>{model_name}</strong></td>
                    <td>{row['mae']:.3f}</td>
                    <td>{row['rmse']:.3f}</td>
                    <td>{row['r2']:.3f}</td>
                    <td>{row['mape']:.1f}</td>
                    <td>{row['threshold_accuracy_5mph']:.1f}</td>
                    <td>{row['overall_rank']:.1f}</td>
                </tr>
            """
        
        html_content += """
            </table>
            
            <h2>Key Findings</h2>
            <div class="metrics">
        """
        
        best_model = comparison_df.index[0]
        best_metrics = comparison_df.iloc[0]
        
        html_content += f"""
                <div class="metric-card">
                    <h3>Best Overall Model</h3>
                    <p><strong>{best_model}</strong></p>
                    <ul>
                        <li>MAE: {best_metrics['mae']:.3f} mph</li>
                        <li>RMSE: {best_metrics['rmse']:.3f} mph</li>
                        <li>R²: {best_metrics['r2']:.3f}</li>
                    </ul>
                </div>
        """
        
        # Add model-specific insights
        for model_name in self.results.keys():
            metrics = self.results[model_name]['metrics']
            html_content += f"""
                <div class="metric-card">
                    <h3>{model_name}</h3>
                    <ul>
                        <li>Direction Accuracy: {metrics.get('direction_accuracy', 'N/A'):.1f}%</li>
                        <li>Mean Prediction: {metrics['mean_predicted']:.1f} mph</li>
                        <li>Prediction Std: {metrics['std_predicted']:.1f} mph</li>
                    </ul>
                </div>
            """
        
        html_content += """
            </div>
            
            <h2>Recommendations</h2>
            <ul>
        """
        
        if len(comparison_df) > 1:
            html_content += f"<li>Use <strong>{best_model}</strong> for production deployment based on overall performance.</li>"
            
            if best_metrics['r2'] < 0.7:
                html_content += "<li>Consider ensemble methods or feature engineering to improve R² score.</li>"
            
            if best_metrics['threshold_accuracy_5mph'] < 80:
                html_content += "<li>Focus on reducing prediction errors within 5mph for practical applications.</li>"
        
        html_content += """
            </ul>
            
            <h2>Technical Notes</h2>
            <p>This evaluation includes multiple metrics to assess different aspects of model performance:</p>
            <ul>
                <li><strong>MAE (Mean Absolute Error):</strong> Average absolute difference between predictions and actual values</li>
                <li><strong>RMSE (Root Mean Square Error):</strong> Square root of average squared differences (penalizes large errors more)</li>
                <li><strong>R² (Coefficient of Determination):</strong> Proportion of variance explained by the model</li>
                <li><strong>MAPE (Mean Absolute Percentage Error):</strong> Average percentage error</li>
                <li><strong>Threshold Accuracy:</strong> Percentage of predictions within specified error threshold</li>
            </ul>
        </body>
        </html>
        """
        
        with open(output_path, 'w') as f:
            f.write(html_content)
        
        logger.info(f"Evaluation report saved to {output_path}")

def main():
    """Demo evaluation with synthetic data."""
    
    # Create synthetic data for demonstration
    np.random.seed(42)
    n_samples = 1000
    
    # Generate synthetic actual speeds
    actual_speeds = np.random.normal(25, 8, n_samples)
    actual_speeds = np.clip(actual_speeds, 5, 60)
    
    # Generate predictions with different characteristics
    lstm_predictions = actual_speeds + np.random.normal(0, 3, n_samples)
    gnn_predictions = actual_speeds + np.random.normal(0, 2.5, n_samples)
    baseline_predictions = np.full(n_samples, np.mean(actual_speeds))
    
    # Initialize evaluator
    evaluator = ModelEvaluator()
    
    # Load model results
    evaluator.load_model_predictions('LSTM', lstm_predictions, actual_speeds)
    evaluator.load_model_predictions('GNN', gnn_predictions, actual_speeds)
    evaluator.load_model_predictions('Baseline', baseline_predictions, actual_speeds)
    
    # Generate comparison
    comparison_df = evaluator.compare_models()
    print("Model Comparison:")
    print(comparison_df[['mae', 'rmse', 'r2', 'overall_rank']])
    
    # Create plots
    plots = evaluator.create_prediction_plots()
    evaluator.create_metrics_comparison_plot()
    
    # Statistical significance test
    sig_test = evaluator.statistical_significance_test('LSTM', 'GNN')
    print(f"\nStatistical Test (LSTM vs GNN):")
    print(f"P-value: {sig_test['paired_t_test']['p_value']:.4f}")
    print(f"Significant: {sig_test['paired_t_test']['significant']}")
    
    # Generate report
    evaluator.generate_evaluation_report()
    
    print("\nEvaluation complete! Check evaluation_plots/ directory and model_evaluation_report.html")

if __name__ == "__main__":
    main()