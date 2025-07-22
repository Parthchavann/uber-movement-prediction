# UberFlow Analytics - Access Instructions

The UberFlow Analytics system is now running!

## 🌐 Access the Dashboard

### Option 1: Open from Windows Explorer
1. Navigate to: `C:\Users\Parth Chavan\uber-movement-prediction\`
2. Double-click on `dashboard.html`

### Option 2: Open from Browser
1. Open your web browser (Chrome, Firefox, Edge)
2. Press `Ctrl+O` (Open File)
3. Navigate to: `C:\Users\Parth Chavan\uber-movement-prediction\dashboard.html`
4. Click Open

### Option 3: Direct Path
Copy and paste this path in your browser's address bar:
```
file:///C:/Users/Parth%20Chavan/uber-movement-prediction/dashboard.html
```

## 🔌 API Server

The API server is running at: `http://localhost:8000`

You can test it by visiting:
- http://localhost:8000 (API homepage)
- http://localhost:8000/status (API status)
- http://localhost:8000/predict (Get a prediction)
- http://localhost:8000/segments (List segments)

## 🛑 Stopping the Server

To stop the server, run:
```bash
pkill -f run_server.py
```

## 🚀 Restarting the Server

To restart the server later:
```bash
cd /mnt/c/Users/Parth\ Chavan/uber-movement-prediction
python3 run_server.py
```

Enjoy using UberFlow Analytics!