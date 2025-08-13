# Multi-stage Docker build for production deployment
FROM python:3.9-slim as backend

# Set working directory
WORKDIR /app

# Copy backend requirements and install
COPY requirements-deploy.txt .
RUN pip install --no-cache-dir -r requirements-deploy.txt

# Copy backend files
COPY real_api_server.py .
COPY data/ data/

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "real_api_server:app", "--host", "0.0.0.0", "--port", "8000"]

# Frontend build stage
FROM node:18-alpine as frontend

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production

COPY frontend/ .
RUN npm run build

# Production stage
FROM python:3.9-slim

WORKDIR /app

# Copy backend
COPY --from=backend /app .
COPY --from=backend /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages

# Copy frontend build
COPY --from=frontend /app/frontend/build ./static

# Serve both frontend and backend
CMD ["uvicorn", "real_api_server:app", "--host", "0.0.0.0", "--port", "8000"]