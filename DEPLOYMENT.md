# 🚀 UberFlow Analytics - Free Deployment Guide

## Quick Start (Recommended): Railway Deployment

### 1. One-Click Railway Deployment 🚂
**Deploys both frontend and backend together**

1. Visit [railway.app](https://railway.app) and sign up with GitHub
2. Click "Deploy from GitHub repo"
3. Select `Parthchavann/uber-movement-prediction`
4. Railway will automatically:
   - Detect your FastAPI backend
   - Build and serve your React frontend
   - Provide HTTPS URL
   - Auto-deploy on git pushes

**Cost:** Free $5/month credits (enough for development)
**URL:** `https://your-app-name.railway.app`

---

## Alternative Free Options

### Option A: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel:
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo: `Parthchavann/uber-movement-prediction`
3. Configure build settings:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
4. Add environment variable:
   - `REACT_APP_API_URL`: `https://your-backend.railway.app`

#### Backend on Railway:
1. Create new Railway project
2. Connect GitHub repo
3. Set start command: `python real_api_server.py`
4. Use environment file: `requirements-deploy.txt`

### Option B: Netlify (Frontend) + Render (Backend)

#### Frontend on Netlify:
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repo
3. Build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/build`
4. Update `netlify.toml` with your backend URL

#### Backend on Render:
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Settings:
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements-deploy.txt`
   - **Start Command:** `uvicorn real_api_server:app --host 0.0.0.0 --port $PORT`

---

## Environment Configuration

### Backend Environment Variables:
```bash
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=["https://your-frontend-url.vercel.app"]
```

### Frontend Environment Variables:
```bash
REACT_APP_API_URL=https://your-backend-url.railway.app
```

---

## Post-Deployment Steps

### 1. Update API URLs
After backend deployment, update frontend API base URL:
```typescript
// In frontend/src/services/dataService.ts
const baseUrl = 'https://your-backend-url.railway.app';
```

### 2. CORS Configuration
Ensure your backend allows frontend domain:
```python
# In real_api_server.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-url.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Test Deployment
1. Visit your frontend URL
2. Check API Status indicator
3. Test filters and real-time updates
4. Verify data export functionality

---

## Troubleshooting

### Common Issues:

**CORS Errors:**
- Update backend CORS origins with frontend URL
- Redeploy backend after changes

**API Not Loading:**
- Check backend deployment logs
- Verify environment variables
- Ensure requirements-deploy.txt is used

**Build Failures:**
- Use Node.js 18+ for frontend builds
- Check package.json scripts
- Verify all dependencies are listed

**Data Not Loading:**
- Ensure CSV files are included in deployment
- Check file paths in real_api_server.py
- Verify data directory structure

---

## Free Tier Limitations

### Railway:
- $5/month credits
- Sleeps after 30min inactivity
- 512MB RAM limit

### Vercel:
- 100GB bandwidth/month
- No sleep mode
- Excellent performance

### Netlify:
- 100GB bandwidth/month
- 300 build minutes/month
- Form submissions included

### Render:
- 512MB RAM
- Sleeps after 15min inactivity
- 750 hours/month

---

## Recommended Production Setup

**Best Performance:**
- Frontend: Vercel (excellent CDN, no sleep)
- Backend: Railway (generous limits, easy setup)

**Most Reliable:**
- Frontend: Netlify (great uptime)
- Backend: Railway (stable, auto-scaling)

**All-in-One:**
- Railway (simplest setup, single deployment)

Choose based on your needs and usage patterns!