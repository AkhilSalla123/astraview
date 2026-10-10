#!/usr/bin/env bash
set -e

echo "=========================================="
echo "       AstraView Deployment Launcher      "
echo "=========================================="

if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH."
    echo "Please install Docker from https://docs.docker.com/get-docker/ to run containerized deployment."
    echo "Alternatively, check DEPLOYMENT.md for manual or cloud deployment steps."
    exit 1
fi

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "[INFO] Created .env from .env.example"
fi

echo "[INFO] Building and starting all containers..."
docker compose up --build -d

echo ""
echo "[SUCCESS] AstraView services are running!"
echo "Frontend URL:     http://localhost:3000"
echo "Backend API:      http://localhost:8080/api/health"
echo "Orbit Service:    http://localhost:8000/docs"
echo ""
echo "To view real-time logs, run: docker compose logs -f"
