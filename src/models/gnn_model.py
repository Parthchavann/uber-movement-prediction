"""
Graph Neural Network model for traffic speed prediction using spatial relationships.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, GATConv, TransformerConv, global_mean_pool
from torch_geometric.data import Data, DataLoader as GeometricDataLoader
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Tuple, Dict, List, Optional
import logging
import yaml
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GraphTrafficDataset:
    """Dataset for graph-based traffic prediction."""
    
    def __init__(self, node_features: np.ndarray, edge_index: np.ndarray, 
                 edge_attr: np.ndarray, targets: np.ndarray):
        self.node_features = torch.FloatTensor(node_features)
        self.edge_index = torch.LongTensor(edge_index)
        self.edge_attr = torch.FloatTensor(edge_attr)
        self.targets = torch.FloatTensor(targets)
    
    def __len__(self):
        return self.node_features.size(0)
    
    def get_graph(self, idx: int) -> Data:
        """Get a single graph for the given timestamp."""
        return Data(
            x=self.node_features[idx],
            edge_index=self.edge_index,
            edge_attr=self.edge_attr,
            y=self.targets[idx]
        )

class GNNTrafficPredictor(nn.Module):
    """Graph Neural Network for traffic speed prediction."""
    
    def __init__(self, 
                 input_dim: int = 6,
                 hidden_dim: int = 64,
                 num_layers: int = 3,
                 dropout: float = 0.1,
                 output_dim: int = 1,
                 gnn_type: str = "GAT"):
        super(GNNTrafficPredictor, self).__init__()
        
        self.num_layers = num_layers
        self.dropout = dropout
        self.gnn_type = gnn_type
        
        # GNN layers
        self.gnn_layers = nn.ModuleList()
        
        if gnn_type == "GCN":
            self.gnn_layers.append(GCNConv(input_dim, hidden_dim))
            for _ in range(num_layers - 1):
                self.gnn_layers.append(GCNConv(hidden_dim, hidden_dim))
        
        elif gnn_type == "GAT":
            self.gnn_layers.append(GATConv(input_dim, hidden_dim, heads=8, dropout=dropout))
            for _ in range(num_layers - 1):
                self.gnn_layers.append(GATConv(hidden_dim * 8, hidden_dim, heads=8, dropout=dropout))
        
        elif gnn_type == "Transformer":
            self.gnn_layers.append(TransformerConv(input_dim, hidden_dim, heads=8, dropout=dropout))
            for _ in range(num_layers - 1):
                self.gnn_layers.append(TransformerConv(hidden_dim, hidden_dim, heads=8, dropout=dropout))
        
        # Temporal attention mechanism
        self.temporal_attention = nn.MultiheadAttention(
            embed_dim=hidden_dim * 8 if gnn_type == "GAT" else hidden_dim,
            num_heads=8,
            dropout=dropout,
            batch_first=True
        )
        
        # Output layers
        final_dim = hidden_dim * 8 if gnn_type == "GAT" else hidden_dim
        self.output_layers = nn.Sequential(
            nn.Linear(final_dim, final_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(final_dim // 2, final_dim // 4),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(final_dim // 4, output_dim)
        )
        
        # Batch normalization
        self.batch_norms = nn.ModuleList([
            nn.BatchNorm1d(hidden_dim * 8 if gnn_type == "GAT" else hidden_dim)
            for _ in range(num_layers)
        ])
    
    def forward(self, data: Data) -> torch.Tensor:
        x, edge_index, edge_attr = data.x, data.edge_index, data.edge_attr
        
        # Apply GNN layers
        for i, gnn_layer in enumerate(self.gnn_layers):
            if self.gnn_type == "GCN":
                x = gnn_layer(x, edge_index)
            else:
                x = gnn_layer(x, edge_index, edge_attr)
            
            # Apply batch norm and activation
            if x.size(0) > 1:  # Only apply batch norm if batch size > 1
                x = self.batch_norms[i](x)
            x = F.relu(x)
            x = F.dropout(x, p=self.dropout, training=self.training)
        
        # Apply temporal attention (treat each node as a sequence element)
        x = x.unsqueeze(0)  # Add batch dimension for attention
        attn_out, _ = self.temporal_attention(x, x, x)
        x = attn_out.squeeze(0)  # Remove batch dimension
        
        # Output prediction for each node
        out = self.output_layers(x)
        
        return out.squeeze(-1)  # Remove last dimension if output_dim=1

class SpatialTemporalGNN(nn.Module):
    """Spatial-Temporal GNN that combines spatial and temporal information."""
    
    def __init__(self, 
                 spatial_dim: int = 4,
                 temporal_dim: int = 24,
                 hidden_dim: int = 64,
                 num_layers: int = 3,
                 dropout: float = 0.1):
        super(SpatialTemporalGNN, self).__init__()
        
        # Spatial GNN
        self.spatial_gnn = GNNTrafficPredictor(
            input_dim=spatial_dim,
            hidden_dim=hidden_dim,
            num_layers=num_layers,
            dropout=dropout,
            output_dim=hidden_dim,
            gnn_type="GAT"
        )
        
        # Temporal LSTM
        self.temporal_lstm = nn.LSTM(
            input_size=temporal_dim,
            hidden_size=hidden_dim,
            num_layers=2,
            dropout=dropout,
            batch_first=True
        )
        
        # Fusion layer
        self.fusion = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, 1)
        )
    
    def forward(self, spatial_data: Data, temporal_data: torch.Tensor) -> torch.Tensor:
        # Spatial features
        spatial_features = self.spatial_gnn(spatial_data)
        
        # Temporal features
        temporal_out, _ = self.temporal_lstm(temporal_data)
        temporal_features = temporal_out[:, -1, :]  # Use last output
        
        # Ensure same number of nodes
        if spatial_features.size(0) != temporal_features.size(0):
            min_size = min(spatial_features.size(0), temporal_features.size(0))
            spatial_features = spatial_features[:min_size]
            temporal_features = temporal_features[:min_size]
        
        # Fusion
        combined = torch.cat([spatial_features, temporal_features], dim=1)
        output = self.fusion(combined)
        
        return output.squeeze(-1)

class GNNTrainer:
    """Training and evaluation for GNN traffic predictor."""
    
    def __init__(self, config_path: str = "config/config.yaml"):
        self.config = self._load_config(config_path)
        self.model_config = self.config.get('models', {}).get('gnn', {})
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        self.scaler_features = StandardScaler()
        self.scaler_target = MinMaxScaler()
        self.model = None
        
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from YAML file."""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            logger.warning(f"Config file {config_path} not found, using defaults")
            return {
                'models': {
                    'gnn': {
                        'hidden_channels': 64,
                        'num_layers': 3,
                        'dropout': 0.1,
                        'learning_rate': 0.001,
                        'batch_size': 16,
                        'epochs': 200
                    }
                }
            }
    
    def prepare_graph_data(self, traffic_data_path: str, segments_data_path: str):
        """Prepare graph data for training."""
        
        # Load traffic data
        traffic_df = pd.read_csv(traffic_data_path)
        traffic_df['timestamp'] = pd.to_datetime(traffic_df['timestamp'])
        traffic_df = traffic_df.sort_values(['timestamp', 'segment_id'])
        
        # Load segments data
        segments_df = pd.read_csv(segments_data_path)
        
        # Create edge index based on spatial proximity
        edge_index = []
        edge_attr = []
        
        for i, seg1 in segments_df.iterrows():
            for j, seg2 in segments_df.iterrows():
                if i != j:
                    # Calculate distance
                    dist = np.sqrt(
                        (seg1['start_lat'] - seg2['start_lat'])**2 + 
                        (seg1['start_lon'] - seg2['start_lon'])**2
                    )
                    
                    # Connect if within threshold
                    if dist < 0.01:  # Approximately 1km
                        edge_index.append([i, j])
                        edge_attr.append([dist])
        
        edge_index = np.array(edge_index).T
        edge_attr = np.array(edge_attr)
        
        # Prepare node features and targets
        timestamps = traffic_df['timestamp'].unique()
        node_features_list = []
        targets_list = []
        
        for timestamp in timestamps[:100]:  # Limit for demo
            timestamp_data = traffic_df[traffic_df['timestamp'] == timestamp]
            
            # Node features: [speed, hour, day_of_week, is_weekend, lat, lon]
            node_features = []
            targets = []
            
            for segment_id in segments_df['segment_id']:
                seg_data = timestamp_data[timestamp_data['segment_id'] == segment_id]
                seg_info = segments_df[segments_df['segment_id'] == segment_id].iloc[0]
                
                if len(seg_data) > 0:
                    row = seg_data.iloc[0]
                    features = [
                        row['speed_mph'],
                        row['hour'],
                        row['day_of_week'],
                        row.get('is_weekend', 0),
                        seg_info['start_lat'],
                        seg_info['start_lon']
                    ]
                    target = row['speed_mph']
                else:
                    # Fill missing data with defaults
                    features = [25.0, 12, 1, 0, seg_info['start_lat'], seg_info['start_lon']]
                    target = 25.0
                
                node_features.append(features)
                targets.append(target)
            
            node_features_list.append(node_features)
            targets_list.append(targets)
        
        node_features = np.array(node_features_list)
        targets = np.array(targets_list)
        
        # Normalize features
        original_shape = node_features.shape
        node_features_flat = node_features.reshape(-1, node_features.shape[-1])
        node_features_norm = self.scaler_features.fit_transform(node_features_flat)
        node_features_norm = node_features_norm.reshape(original_shape)
        
        targets_flat = targets.reshape(-1, 1)
        targets_norm = self.scaler_target.fit_transform(targets_flat)
        targets_norm = targets_norm.reshape(targets.shape)
        
        # Split data
        train_size = int(0.7 * len(node_features_norm))
        val_size = int(0.15 * len(node_features_norm))
        
        train_data = GraphTrafficDataset(
            node_features_norm[:train_size],
            edge_index,
            edge_attr,
            targets_norm[:train_size]
        )
        
        val_data = GraphTrafficDataset(
            node_features_norm[train_size:train_size+val_size],
            edge_index,
            edge_attr,
            targets_norm[train_size:train_size+val_size]
        )
        
        test_data = GraphTrafficDataset(
            node_features_norm[train_size+val_size:],
            edge_index,
            edge_attr,
            targets_norm[train_size+val_size:]
        )
        
        return train_data, val_data, test_data
    
    def train_model(self, train_data: GraphTrafficDataset, val_data: GraphTrafficDataset):
        """Train the GNN model."""
        
        # Initialize model
        input_dim = 6  # speed, hour, day_of_week, is_weekend, lat, lon
        self.model = GNNTrafficPredictor(
            input_dim=input_dim,
            hidden_dim=self.model_config.get('hidden_channels', 64),
            num_layers=self.model_config.get('num_layers', 3),
            dropout=self.model_config.get('dropout', 0.1),
            gnn_type="GAT"
        ).to(self.device)
        
        # Loss and optimizer
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(
            self.model.parameters(),
            lr=self.model_config.get('learning_rate', 0.001)
        )
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode='min', factor=0.5, patience=10
        )
        
        epochs = self.model_config.get('epochs', 200)
        best_val_loss = float('inf')
        patience = 20
        patience_counter = 0
        
        logger.info(f"Starting GNN training for {epochs} epochs")
        
        for epoch in range(epochs):
            # Training
            self.model.train()
            train_losses = []
            
            for i in range(len(train_data)):
                graph = train_data.get_graph(i).to(self.device)
                
                optimizer.zero_grad()
                outputs = self.model(graph)
                loss = criterion(outputs, graph.y)
                loss.backward()
                
                # Gradient clipping
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                
                optimizer.step()
                train_losses.append(loss.item())
            
            # Validation
            self.model.eval()
            val_losses = []
            
            with torch.no_grad():
                for i in range(len(val_data)):
                    graph = val_data.get_graph(i).to(self.device)
                    outputs = self.model(graph)
                    loss = criterion(outputs, graph.y)
                    val_losses.append(loss.item())
            
            train_loss = np.mean(train_losses)
            val_loss = np.mean(val_losses)
            
            scheduler.step(val_loss)
            
            if epoch % 20 == 0:
                logger.info(f"Epoch {epoch:3d}: Train Loss: {train_loss:.6f}, Val Loss: {val_loss:.6f}")
            
            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                # Save best model
                torch.save(self.model.state_dict(), 'models/best_gnn_model.pth')
            else:
                patience_counter += 1
                
            if patience_counter >= patience:
                logger.info(f"Early stopping at epoch {epoch}")
                break
        
        logger.info("GNN training completed")
    
    def evaluate_model(self, test_data: GraphTrafficDataset) -> Dict:
        """Evaluate the trained model."""
        
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        self.model.eval()
        predictions = []
        actuals = []
        
        with torch.no_grad():
            for i in range(len(test_data)):
                graph = test_data.get_graph(i).to(self.device)
                outputs = self.model(graph)
                
                predictions.extend(outputs.cpu().numpy())
                actuals.extend(graph.y.cpu().numpy())
        
        # Denormalize predictions and actuals
        predictions = np.array(predictions).reshape(-1, 1)
        actuals = np.array(actuals).reshape(-1, 1)
        
        predictions_denorm = self.scaler_target.inverse_transform(predictions).flatten()
        actuals_denorm = self.scaler_target.inverse_transform(actuals).flatten()
        
        # Calculate metrics
        mae = mean_absolute_error(actuals_denorm, predictions_denorm)
        mse = mean_squared_error(actuals_denorm, predictions_denorm)
        rmse = np.sqrt(mse)
        r2 = r2_score(actuals_denorm, predictions_denorm)
        
        metrics = {
            'mae': mae,
            'mse': mse,
            'rmse': rmse,
            'r2': r2,
            'predictions': predictions_denorm,
            'actuals': actuals_denorm
        }
        
        logger.info(f"GNN Evaluation Metrics - MAE: {mae:.2f}, RMSE: {rmse:.2f}, R²: {r2:.4f}")
        
        return metrics
    
    def save_model(self, model_path: str = "models/gnn_traffic_predictor.pth"):
        """Save the trained model and scalers."""
        Path(model_path).parent.mkdir(parents=True, exist_ok=True)
        
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'model_config': self.model_config,
            'scaler_features': self.scaler_features,
            'scaler_target': self.scaler_target
        }, model_path)
        
        logger.info(f"GNN model saved to {model_path}")

def main():
    """Main function to train and evaluate GNN model."""
    
    # Create models directory
    Path("models").mkdir(exist_ok=True)
    
    trainer = GNNTrainer()
    
    # Prepare data
    traffic_path = "data/raw/san_francisco_traffic_data.csv"
    segments_path = "data/raw/san_francisco_segments.csv"
    
    try:
        train_data, val_data, test_data = trainer.prepare_graph_data(traffic_path, segments_path)
        
        # Train model
        trainer.train_model(train_data, val_data)
        
        # Evaluate model
        metrics = trainer.evaluate_model(test_data)
        
        # Save model
        trainer.save_model()
        
        print("\n=== GNN Model Results ===")
        print(f"MAE: {metrics['mae']:.2f} mph")
        print(f"RMSE: {metrics['rmse']:.2f} mph")
        print(f"R²: {metrics['r2']:.4f}")
        
    except Exception as e:
        logger.error(f"Error in GNN training: {e}")

if __name__ == "__main__":
    main()