# AstraView Deployment Guide

AstraView is a full-stack real-time satellite tracking and antenna monitoring system consisting of:
- **Frontend**: React + Vite + CesiumJS (served via Nginx in production)
- **Backend API**: Java 17 + Spring Boot 3
- **Orbit Engine**: Python 3.12 + FastAPI + SGP4
- **Database**: MongoDB (local container or MongoDB Atlas)

---

## Option 1: Docker Compose Deployment (Recommended)

This runs the entire stack (Database + Python Orbit Service + Spring Boot API + React/Cesium UI) in isolated containers with health checks and automatic networking.

### Requirements
- [Docker & Docker Desktop / Docker Engine](https://docs.docker.com/get-docker/)

### Steps

1. Configure `.env` (optional, defaults work out of the box):
   ```bash
   cp .env.example .env
   ```
   If you have an N2YO API key, set it in `.env`. Otherwise, CelesTrak will be used for free.

2. Build and start all services:
   ```bash
   docker compose up --build -d
   ```

3. Open in your browser:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8080/api/health](http://localhost:8080/api/health)
   - **Orbit Service Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

4. Check logs:
   ```bash
   docker compose logs -f
   ```

5. Stop all services:
   ```bash
   docker compose down
   ```

---

## Option 2: Cloud Deployment (Render / Railway)

A blueprint configuration (`render.yaml`) is included in the project for 1-click cloud deployment.

### 1. MongoDB Atlas Setup (Free)
1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free M0 cluster.
3. Under **Database Access**, create a user and password.
4. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`).
5. Copy your connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/astraview?retryWrites=true&w=majority`

### 2. Deploying via Render
1. Push your repository to GitHub or GitLab.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New** -> **Blueprint**.
3. Connect your AstraView repository. Render will automatically read `render.yaml` and configure:
   - `astraview-orbit-service` (Docker Web Service)
   - `astraview-backend` (Docker Web Service with `MONGODB_URI` environment variable)
   - `astraview-frontend` (Docker Web Service serving Nginx on port 80)
4. Set the `MONGODB_URI` environment variable in the backend service to your Atlas connection string.

---

## Option 3: Manual / Local Deployment (Without Docker)

### 1. MongoDB
Start a local MongoDB instance on port `27017` or use MongoDB Atlas.

### 2. Python Orbit Service
```bash
cd orbit-service
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Java Spring Boot Backend
```bash
cd astraview-backend
java -jar target/astraview-backend-1.0.0.jar
```
*(Or with Maven: `mvn spring-boot:run`)*

### 4. React Frontend
```bash
cd astraview-frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## Architecture & Production Ports

| Service | Internal Port | Host Port | Path / Endpoint |
|---|---|---|---|
| **Frontend** | `80` (Nginx) | `3000` | UI & `/api` proxy |
| **Backend** | `8080` | `8080` | REST API (`/api/satellites`, `/api/stations`, etc.) |
| **Orbit Service** | `8000` | `8000` | SGP4 Calculation Engine (`/docs`, `/v1/look`, etc.) |
| **MongoDB** | `27017` | `27017` | Persistent Database |
