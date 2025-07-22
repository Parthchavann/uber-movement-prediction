#!/bin/bash

# Traffic AI Dashboard Startup Script
echo "🚗 Starting Traffic AI Dashboard..."
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Navigate to frontend directory
cd frontend

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🚀 Starting React development server..."
echo ""
echo "📱 Dashboard will be available at:"
echo "   🌐 Local:            http://localhost:3001"
echo "   🌐 Network:          http://[your-ip]:3001"
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
echo ""

# Start the React app
npm start