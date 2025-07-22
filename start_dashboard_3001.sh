#!/bin/bash

# Traffic AI Dashboard Startup Script - Port 3001
echo "🚗 Starting Traffic AI Dashboard on Port 3001..."
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Navigate to frontend directory
cd frontend || {
    echo "❌ Frontend directory not found!"
    exit 1
}

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Start the development server on port 3001
echo "🚀 Starting React development server on port 3001..."
echo ""
echo "📱 Dashboard will be available at:"
echo "   🌐 Local:            http://localhost:3001"
echo "   🌐 Network:          http://$(hostname -I | awk '{print $1}'):3001"
echo ""
echo "🔧 Features included:"
echo "   ✨ Real-time traffic analytics"
echo "   🧠 AI model predictions (LSTM & GNN)"
echo "   🗺️  Interactive traffic maps"
echo "   📊 Live performance charts"
echo "   🎨 Dark/Light theme toggle"
echo "   📱 Fully responsive design"
echo ""
echo "⏱️  Starting server (may take 30-60 seconds)..."
echo "💡 Press Ctrl+C to stop the server"
echo ""

# Set port and start
export PORT=3001
npm start