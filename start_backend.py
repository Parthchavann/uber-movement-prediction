#!/usr/bin/env python3
"""
Simple backend API server for the UberFlow Analytics dashboard
This script starts the FastAPI server with mock data endpoints.
"""

import sys
import os
import subprocess

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import fastapi
        import uvicorn
        print("✓ FastAPI and Uvicorn are installed")
        return True
    except ImportError:
        print("⚠ Missing dependencies. Installing FastAPI and Uvicorn...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "fastapi", "uvicorn"])
            print("✓ Dependencies installed successfully")
            return True
        except subprocess.CalledProcessError:
            print("❌ Failed to install dependencies. Please run:")
            print("   pip install fastapi uvicorn")
            return False

def main():
    print("🚀 Starting UberFlow Analytics Backend API")
    print("=" * 50)
    
    if not check_dependencies():
        return 1
    
    # Start the mock API server
    script_dir = os.path.dirname(os.path.abspath(__file__))
    mock_api_path = os.path.join(script_dir, "mock_api_server.py")
    
    if os.path.exists(mock_api_path):
        print("Starting mock API server on http://localhost:8001")
        print("The frontend will connect to this API for data")
        print("Press Ctrl+C to stop the server")
        print("-" * 50)
        
        try:
            subprocess.run([sys.executable, mock_api_path])
        except KeyboardInterrupt:
            print("\n👋 API server stopped")
    else:
        print(f"❌ Mock API server not found at: {mock_api_path}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())