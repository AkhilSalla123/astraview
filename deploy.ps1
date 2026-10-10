# AstraView - One-Click Deployment Script for PowerShell
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "       AstraView Deployment Launcher      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if Docker is installed
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop/ to run containerized deployment." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternatively, refer to DEPLOYMENT.md for manual or cloud deployment steps." -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Checking environment configuration..." -ForegroundColor Green
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example" -ForegroundColor Green
}

Write-Host "[2/3] Building and starting all containers..." -ForegroundColor Green
docker compose up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "[3/3] AstraView services are starting!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend URL:     http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Backend API:      http://localhost:8080/api/health" -ForegroundColor Cyan
    Write-Host "Orbit Service:    http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To view real-time logs, run: docker compose logs -f" -ForegroundColor White
} else {
    Write-Host "[ERROR] Docker compose failed to start. Check the logs above." -ForegroundColor Red
}
