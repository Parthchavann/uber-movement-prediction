#!/bin/bash

# UberFlow Analytics Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: local, staging, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-local}
PROJECT_NAME="uberflow-analytics"
COMPOSE_FILE="docker-compose.yml"

echo -e "${BLUE}🚀 UberFlow Analytics Deployment${NC}"
echo -e "${BLUE}Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo "================================"

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi
print_status "Docker is installed"

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi
print_status "Docker Compose is installed"

# Environment-specific configuration
case $ENVIRONMENT in
    "local")
        COMPOSE_FILE="docker-compose.yml"
        API_URL="http://localhost:8000"
        FRONTEND_PORT="80"
        ;;
    "staging")
        COMPOSE_FILE="docker-compose.staging.yml"
        API_URL="https://api-staging.uberflow.com"
        FRONTEND_PORT="80"
        ;;
    "production")
        COMPOSE_FILE="docker-compose.prod.yml"
        API_URL="https://api.uberflow.com"
        FRONTEND_PORT="80"
        ;;
    *)
        print_error "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_warning ".env file not found, creating from template..."
    cp .env.example .env
    echo "REACT_APP_API_URL=$API_URL" >> .env
    echo "ENVIRONMENT=$ENVIRONMENT" >> .env
    print_status "Created .env file"
else
    print_status ".env file exists"
fi

# Build and deploy
echo -e "${BLUE}Building and deploying...${NC}"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down

# Build images
print_status "Building Docker images..."
docker-compose -f $COMPOSE_FILE build --no-cache

# Start services
print_status "Starting services..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 10

# Check backend health
if curl -f http://localhost:8000/health &> /dev/null; then
    print_status "Backend API is healthy"
else
    print_warning "Backend API health check failed"
fi

# Check frontend
if curl -f http://localhost:$FRONTEND_PORT/health &> /dev/null; then
    print_status "Frontend is healthy"
else
    print_warning "Frontend health check failed"
fi

# Display status
echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "================================"
echo -e "Frontend: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo -e "Backend API: ${BLUE}http://localhost:8000${NC}"
echo -e "API Docs: ${BLUE}http://localhost:8000/docs${NC}"

if [ "$ENVIRONMENT" = "local" ]; then
    echo -e "Monitoring: ${BLUE}http://localhost:9090${NC}"
fi

echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "  Stop services: docker-compose -f $COMPOSE_FILE down"
echo "  Restart services: docker-compose -f $COMPOSE_FILE restart"
echo "  Check status: docker-compose -f $COMPOSE_FILE ps"
echo ""