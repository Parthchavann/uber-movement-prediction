# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive ML/Data Science project for traffic speed prediction using Uber Movement data. It features:
- Dual-model architecture: LSTM for temporal patterns and Graph Neural Networks (GNN) for spatial relationships
- Big data processing with Apache Spark
- Real-time prediction API using FastAPI
- React TypeScript dashboard for visualization
- Apache Airflow for pipeline orchestration

## Common Development Commands

### Backend Development

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the complete pipeline
python scripts/run_full_pipeline.py

# Train models individually
python src/models/lstm_model.py
python src/models/gnn_model.py

# Start the prediction API
python scripts/start_api.py  # Runs on port 8000

# Run linting and formatting
black src/ tests/
flake8 src/ tests/
mypy src/

# Run tests (when implemented)
pytest tests/ --cov=src
```

### Frontend Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start  # Default port 3001
npm run start:3000  # Alternative port 3000

# Build for production
npm run build

# Run tests
npm test
npm run test:coverage
```

### Airflow Pipeline

```bash
# Start Airflow with Docker
cd airflow
docker-compose up -d

# Access UI at http://localhost:8080 (admin/admin)
```

### Data Processing with Spark

```bash
# Download initial data
python scripts/download_data.py

# Process data for specific city
python -c "from src.data_processing.spark_processor import SparkTrafficProcessor; processor = SparkTrafficProcessor(); processor.process_city_data('san_francisco')"
```

## Architecture Overview

### Directory Structure
- `src/`: Core Python source code
  - `data_processing/`: Spark-based data processing pipelines
  - `models/`: LSTM and GNN model implementations
  - `api/`: FastAPI service for predictions
  - `visualization/`: Map and dashboard generation
  - `evaluation/`: Model evaluation framework
- `frontend/`: React TypeScript dashboard (port 3001)
- `airflow/`: Pipeline orchestration DAGs
- `config/`: Configuration files (config.yaml)
- `data/`: Data storage (raw, processed, predictions)
- `models/`: Trained model artifacts

### Key Configuration
Main configuration is in `config/config.yaml`:
- Model hyperparameters (LSTM: 24-hour sequences, GNN: 3 layers)
- Spark settings (4GB executor memory, 2GB driver memory)
- API settings (port 8000, 4 workers)
- Airflow scheduling (every 6 hours)

### Model Architecture
- **LSTM**: Multi-layer with attention, handles temporal sequences
- **GNN**: Graph Attention Network (GAT), models spatial relationships
- Both models can be selected dynamically via the API

### API Endpoints
- `POST /predict`: Single segment prediction
- `POST /predict/batch`: Batch predictions
- `GET /models/status`: Model health metrics
- `POST /models/switch/{model_type}`: Switch between LSTM/GNN
- API documentation available at http://localhost:8000/docs

### Testing Strategy
- Unit tests go in `tests/` directory
- Test files should follow pattern `test_*.py`
- Frontend tests use React Testing Library
- Use pytest for backend, Jest for frontend

### Development Notes
- Python 3.8+ required
- Java 8+ needed for Spark operations
- GPU support available for model training (check CUDA with `torch.cuda.is_available()`)
- Frontend uses Material-UI components and Leaflet for maps
- Production deployment supports Docker and Kubernetes