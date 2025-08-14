#!/usr/bin/env python3
"""
Production startup script for UberFlow Analytics API
"""

import os
import sys
import uvicorn
from pathlib import Path

# Add the src directory to Python path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

def main():
    """Start the production API server"""
    
    # Environment configuration
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    workers = int(os.getenv("API_WORKERS", 4))
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    
    print(f"🚀 Starting UberFlow Analytics API")
    print(f"   Host: {host}")
    print(f"   Port: {port}")
    print(f"   Workers: {workers}")
    print(f"   Log Level: {log_level}")
    print(f"   Environment: {os.getenv('ENVIRONMENT', 'production')}")
    
    # Check if we should use the real API or mock API
    if os.path.exists("mock_api_complete.py") and os.getenv("USE_MOCK_API", "true").lower() == "true":
        print("   Using: Mock API (mock_api_complete.py)")
        # Import and run mock API
        import importlib.util
        spec = importlib.util.spec_from_file_location("mock_api", "mock_api_complete.py")
        mock_api = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mock_api)
        return
    
    # Production API configuration
    config = {
        "app": "api.main:app",  # Assumes FastAPI app is in src/api/main.py
        "host": host,
        "port": port,
        "workers": workers,
        "log_level": log_level,
        "access_log": True,
        "reload": False,
        "loop": "uvloop",
        "http": "httptools",
    }
    
    # Additional production optimizations
    if os.getenv("ENVIRONMENT") == "production":
        config.update({
            "proxy_headers": True,
            "forwarded_allow_ips": "*",
            "timeout_keep_alive": 2,
            "timeout_graceful_shutdown": 30,
        })
    
    try:
        uvicorn.run(**config)
    except KeyboardInterrupt:
        print("\n👋 Shutting down UberFlow Analytics API")
    except Exception as e:
        print(f"❌ Failed to start API: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()