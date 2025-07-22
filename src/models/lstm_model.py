"""
LSTM model for traffic speed prediction using temporal patterns.
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from typing import Tuple, Dict, List, Optional
import pickle
import logging
import yaml
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TrafficDataset(Dataset):
    """PyTorch Dataset for traffic speed prediction."""
    
    def __init__(self, sequences: np.ndarray, targets: np.ndarray):
        self.sequences = torch.FloatTensor(sequences)
        self.targets = torch.FloatTensor(targets)
    
    def __len__(self):
        return len(self.sequences)
    
    def __getitem__(self, idx):
        return self.sequences[idx], self.targets[idx]

class LSTMTrafficPredictor(nn.Module):
    """LSTM model for traffic speed prediction."""
    
    def __init__(self, 
                 input_size: int = 5,
                 hidden_size: int = 128,
                 num_layers: int = 2,
                 dropout: float = 0.2,
                 output_size: int = 1):
        super(LSTMTrafficPredictor, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout if num_layers > 1 else 0,
            batch_first=True
        )
        
        # Attention mechanism
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size,
            num_heads=8,
            dropout=dropout,
            batch_first=True
        )
        
        # Output layers
        self.dropout = nn.Dropout(dropout)
        self.fc1 = nn.Linear(hidden_size, hidden_size // 2)
        self.fc2 = nn.Linear(hidden_size // 2, output_size)
        self.relu = nn.ReLU()
        
    def forward(self, x):
        batch_size = x.size(0)
        
        # Initialize hidden state
        h0 = torch.zeros(self.num_layers, batch_size, self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, batch_size, self.hidden_size).to(x.device)
        
        # LSTM forward pass
        lstm_out, _ = self.lstm(x, (h0, c0))
        
        # Apply attention
        attn_out, _ = self.attention(lstm_out, lstm_out, lstm_out)
        
        # Use the last output for prediction
        last_output = attn_out[:, -1, :]
        
        # Final prediction layers
        out = self.dropout(last_output)
        out = self.relu(self.fc1(out))
        out = self.dropout(out)
        out = self.fc2(out)
        
        return out

class LSTMTrainer:
    """Training and evaluation for LSTM traffic predictor."""
    
    def __init__(self, config_path: str = "config/config.yaml"):
        self.config = self._load_config(config_path)
        self.model_config = self.config.get('models', {}).get('lstm', {})
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
                    'lstm': {
                        'sequence_length': 24,
                        'hidden_size': 128,
                        'num_layers': 2,
                        'dropout': 0.2,
                        'learning_rate': 0.001,
                        'batch_size': 32,
                        'epochs': 100
                    }
                }
            }
    
    def prepare_data(self, data_path: str) -> Tuple[DataLoader, DataLoader, DataLoader]:
        """Prepare data for training."""
        
        # Load processed data
        df = pd.read_csv(data_path)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values(['segment_id', 'timestamp'])
        
        # Feature columns
        feature_cols = ['speed_mph', 'hour', 'day_of_week', 'is_weekend', 'is_rush_hour']
        
        # Create sequences
        sequences = []
        targets = []
        
        sequence_length = self.model_config.get('sequence_length', 24)
        
        for segment_id in df['segment_id'].unique():
            segment_data = df[df['segment_id'] == segment_id].reset_index(drop=True)
            
            if len(segment_data) < sequence_length + 1:
                continue
                
            for i in range(len(segment_data) - sequence_length):
                # Features sequence
                seq_features = segment_data.iloc[i:i+sequence_length][feature_cols].values
                # Target (next speed)
                target = segment_data.iloc[i+sequence_length]['speed_mph']
                
                sequences.append(seq_features)
                targets.append(target)
        
        sequences = np.array(sequences)
        targets = np.array(targets).reshape(-1, 1)
        
        logger.info(f"Created {len(sequences)} sequences of length {sequence_length}")
        
        # Normalize features
        sequences_norm = self.scaler_features.fit_transform(
            sequences.reshape(-1, sequences.shape[-1])
        ).reshape(sequences.shape)
        
        targets_norm = self.scaler_target.fit_transform(targets).flatten()
        
        # Split data
        train_size = int(0.7 * len(sequences_norm))
        val_size = int(0.15 * len(sequences_norm))
        
        train_sequences = sequences_norm[:train_size]
        train_targets = targets_norm[:train_size]
        
        val_sequences = sequences_norm[train_size:train_size+val_size]
        val_targets = targets_norm[train_size:train_size+val_size]
        
        test_sequences = sequences_norm[train_size+val_size:]
        test_targets = targets_norm[train_size+val_size:]
        
        # Create datasets and dataloaders
        batch_size = self.model_config.get('batch_size', 32)
        
        train_dataset = TrafficDataset(train_sequences, train_targets)
        val_dataset = TrafficDataset(val_sequences, val_targets)
        test_dataset = TrafficDataset(test_sequences, test_targets)
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
        
        return train_loader, val_loader, test_loader
    
    def train_model(self, train_loader: DataLoader, val_loader: DataLoader):
        """Train the LSTM model."""
        
        # Initialize model
        input_size = 5  # Number of features
        self.model = LSTMTrafficPredictor(
            input_size=input_size,
            hidden_size=self.model_config.get('hidden_size', 128),
            num_layers=self.model_config.get('num_layers', 2),
            dropout=self.model_config.get('dropout', 0.2)
        ).to(self.device)
        
        # Loss and optimizer
        criterion = nn.MSELoss()
        optimizer = optim.Adam(
            self.model.parameters(),
            lr=self.model_config.get('learning_rate', 0.001)
        )
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode='min', factor=0.5, patience=10
        )
        
        epochs = self.model_config.get('epochs', 100)
        best_val_loss = float('inf')
        patience = 15
        patience_counter = 0
        
        train_losses = []
        val_losses = []
        
        logger.info(f"Starting training for {epochs} epochs")
        
        for epoch in range(epochs):
            # Training
            self.model.train()
            train_loss = 0.0
            
            for batch_sequences, batch_targets in train_loader:
                batch_sequences = batch_sequences.to(self.device)
                batch_targets = batch_targets.to(self.device)
                
                optimizer.zero_grad()
                outputs = self.model(batch_sequences)
                loss = criterion(outputs.squeeze(), batch_targets)
                loss.backward()
                
                # Gradient clipping
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                
                optimizer.step()
                train_loss += loss.item()
            
            # Validation
            self.model.eval()
            val_loss = 0.0
            
            with torch.no_grad():
                for batch_sequences, batch_targets in val_loader:
                    batch_sequences = batch_sequences.to(self.device)
                    batch_targets = batch_targets.to(self.device)
                    
                    outputs = self.model(batch_sequences)
                    loss = criterion(outputs.squeeze(), batch_targets)
                    val_loss += loss.item()
            
            train_loss /= len(train_loader)
            val_loss /= len(val_loader)
            
            train_losses.append(train_loss)
            val_losses.append(val_loss)
            
            scheduler.step(val_loss)
            
            if epoch % 10 == 0:
                logger.info(f"Epoch {epoch:3d}: Train Loss: {train_loss:.6f}, Val Loss: {val_loss:.6f}")
            
            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                # Save best model
                torch.save(self.model.state_dict(), 'models/best_lstm_model.pth')
            else:
                patience_counter += 1
                
            if patience_counter >= patience:
                logger.info(f"Early stopping at epoch {epoch}")
                break
        
        logger.info("Training completed")
        return train_losses, val_losses
    
    def evaluate_model(self, test_loader: DataLoader) -> Dict:
        """Evaluate the trained model."""
        
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        self.model.eval()
        predictions = []
        actuals = []
        
        with torch.no_grad():
            for batch_sequences, batch_targets in test_loader:
                batch_sequences = batch_sequences.to(self.device)
                outputs = self.model(batch_sequences)
                
                predictions.extend(outputs.cpu().numpy().flatten())
                actuals.extend(batch_targets.numpy())
        
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
        
        logger.info(f"Evaluation Metrics - MAE: {mae:.2f}, RMSE: {rmse:.2f}, R²: {r2:.4f}")
        
        return metrics
    
    def save_model(self, model_path: str = "models/lstm_traffic_predictor.pth"):
        """Save the trained model and scalers."""
        Path(model_path).parent.mkdir(parents=True, exist_ok=True)
        
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'model_config': self.model_config,
            'scaler_features': self.scaler_features,
            'scaler_target': self.scaler_target
        }, model_path)
        
        logger.info(f"Model saved to {model_path}")
    
    def load_model(self, model_path: str):
        """Load a trained model."""
        checkpoint = torch.load(model_path, map_location=self.device)
        
        self.model_config = checkpoint['model_config']
        self.scaler_features = checkpoint['scaler_features']
        self.scaler_target = checkpoint['scaler_target']
        
        input_size = 5
        self.model = LSTMTrafficPredictor(
            input_size=input_size,
            hidden_size=self.model_config.get('hidden_size', 128),
            num_layers=self.model_config.get('num_layers', 2),
            dropout=self.model_config.get('dropout', 0.2)
        ).to(self.device)
        
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()
        
        logger.info(f"Model loaded from {model_path}")
    
    def predict(self, sequence: np.ndarray) -> float:
        """Make a single prediction."""
        if self.model is None:
            raise ValueError("Model not loaded")
        
        # Normalize input
        sequence_norm = self.scaler_features.transform(sequence.reshape(-1, sequence.shape[-1]))
        sequence_norm = sequence_norm.reshape(1, *sequence.shape)
        
        # Convert to tensor
        sequence_tensor = torch.FloatTensor(sequence_norm).to(self.device)
        
        # Predict
        with torch.no_grad():
            prediction = self.model(sequence_tensor)
            prediction_denorm = self.scaler_target.inverse_transform(
                prediction.cpu().numpy().reshape(-1, 1)
            )
        
        return prediction_denorm[0, 0]

def main():
    """Main function to train and evaluate LSTM model."""
    
    # Create models directory
    Path("models").mkdir(exist_ok=True)
    
    trainer = LSTMTrainer()
    
    # Prepare data (using sample data)
    data_path = "data/raw/san_francisco_traffic_data.csv"
    
    try:
        train_loader, val_loader, test_loader = trainer.prepare_data(data_path)
        
        # Train model
        train_losses, val_losses = trainer.train_model(train_loader, val_loader)
        
        # Evaluate model
        metrics = trainer.evaluate_model(test_loader)
        
        # Save model
        trainer.save_model()
        
        print("\n=== LSTM Model Results ===")
        print(f"MAE: {metrics['mae']:.2f} mph")
        print(f"RMSE: {metrics['rmse']:.2f} mph")
        print(f"R²: {metrics['r2']:.4f}")
        
    except Exception as e:
        logger.error(f"Error in LSTM training: {e}")

if __name__ == "__main__":
    main()