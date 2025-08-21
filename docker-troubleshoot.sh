#!/bin/bash
# Docker troubleshooting script for CODEX

echo "🔍 CODEX Docker Troubleshooting Script"
echo "======================================"

echo "1. Checking Docker installation..."
docker --version || {
    echo "❌ Docker is not installed or not running"
    exit 1
}

echo "2. Checking Docker Compose installation..."
docker-compose --version || {
    echo "❌ Docker Compose is not installed"
    exit 1
}

echo "3. Cleaning up Docker cache..."
docker system prune -f

echo "4. Removing any existing CODEX containers..."
docker-compose down

echo "5. Building with no cache..."
docker-compose build --no-cache

echo "6. If build still fails, try building individually:"
echo "   docker-compose build server"
echo "   docker-compose build frontend"

echo "7. For debugging, you can run:"
echo "   docker-compose build --progress=plain server"

echo "✅ Troubleshooting complete!" 