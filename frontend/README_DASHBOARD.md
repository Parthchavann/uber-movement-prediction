# 🚗 Traffic AI Dashboard - Frontend

An exquisite React TypeScript dashboard for real-time traffic speed prediction and analytics.

## ✨ Features

### 🎨 **Premium Design**
- **Glassmorphism UI** with blur effects and transparency
- **Dark/Light Theme** with smooth transitions
- **Responsive Design** optimized for all devices
- **Custom Animations** using Framer Motion
- **Material Design 3** components

### 📊 **Interactive Visualizations**
- **Real-time Charts** with live data updates
- **Interactive Traffic Map** with segment details
- **Performance Metrics** with animated counters
- **Prediction Analytics** with confidence intervals
- **Model Comparison** with accuracy metrics

### 🧠 **AI Model Integration**
- **LSTM Model** for temporal pattern analysis
- **GNN Model** for spatial relationship modeling
- **Auto Model Selection** for optimal predictions
- **Real-time Inference** with confidence scoring

### 🔧 **Technical Excellence**
- **TypeScript** for type safety
- **Material-UI** for consistent components
- **Recharts** for data visualization
- **Framer Motion** for smooth animations
- **Responsive Grid** system

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Available Scripts

```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run test suite
npm run eject      # Eject from Create React App
```

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.tsx    # Main dashboard view
│   ├── Header.tsx       # Navigation header
│   ├── Sidebar.tsx      # Navigation sidebar
│   ├── TrafficMap.tsx   # Interactive map
│   ├── RealTimeChart.tsx # Live data charts
│   ├── PredictionPanel.tsx # AI predictions
│   └── MetricsOverview.tsx # Performance metrics
├── App.tsx              # Main application
├── App.css             # Global styles
└── index.tsx           # Application entry point
```

## 🎨 Design System

### Color Palette
- **Primary**: `#00bcd4` (Cyan)
- **Secondary**: `#ff6b35` (Orange)
- **Success**: `#4caf50` (Green)
- **Warning**: `#ff9800` (Amber)
- **Error**: `#f44336` (Red)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700, 800
- **Responsive scaling** across devices

### Animations
- **Entrance**: fadeInUp, slideInLeft
- **Micro-interactions**: hover, click effects
- **Loading states**: skeleton animations
- **Transitions**: smooth easing functions

## 📱 Components Overview

### Dashboard
Main overview with key metrics, charts, and system status.

**Features:**
- Real-time metric cards
- System status indicators
- Performance charts
- Traffic map integration

### Traffic Map
Interactive map showing real-time traffic conditions.

**Features:**
- Segment-level data visualization
- Speed color coding
- Clickable segments with details
- Prediction overlays
- Time slider for historical data

### Prediction Panel
AI-powered prediction interface with model selection.

**Features:**
- Model comparison (LSTM, GNN, Auto)
- Prediction parameters
- Batch predictions
- Accuracy charts
- Historical performance

### Real-time Chart
Live updating charts with multiple visualization options.

**Features:**
- Line, area, and bar charts
- Time range selection
- Play/pause controls
- Multiple data series
- Interactive tooltips

---

**Built with ❤️ for modern traffic management systems**