#!/usr/bin/env python3
"""
Script to start the traffic prediction API server.
"""

import sys
import os
import uvicorn
import logging
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Start the FastAPI server."""
    
    # Change to project directory
    os.chdir(project_root)
    
    logger.info("Starting Traffic Prediction API...")
    logger.info(f"Project root: {project_root}")
    logger.info("API will be available at: http://localhost:8000")
    logger.info("API documentation: http://localhost:8000/docs")
    
    try:
        uvicorn.run(
            "src.api.prediction_api:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Error starting server: {e}")

if __name__ == "__main__":
    main()