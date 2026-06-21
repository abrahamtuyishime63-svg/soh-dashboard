# GPS IoT API Integration Guide

This document explains how to integrate real-time vehicle telemetry data from the GPS IoT API into your battery State of Health (SoH) prediction system.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup Instructions](#setup-instructions)
4. [API Endpoints](#api-endpoints)
5. [Data Mapping](#data-mapping)
6. [Example Usage](#example-usage)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The GPS IoT integration enables your dashboard to:

- **Fetch real-time vehicle data** from GPS IoT fleet management API
- **Stream CAN bus metrics** (temperature, RPM, engine load, fuel consumption, etc.)
- **Predict battery degradation** based on vehicle operating conditions
- **Monitor multiple assets** simultaneously with automatic polling
- **Map vehicle metrics to battery stress factors** for accurate SoH estimation

### Architecture

```
GPS IoT API
    ↓
gpsiot-client.js (Authentication & Data Fetching)
    ↓
Express Server (api/server.js)
    ↓
Dashboard (React Frontend)
    ↓
SoH Prediction Models
```

---

## Prerequisites

### 1. GPS IoT Account & Credentials

You need to contact GPS IoT support to obtain:
- **Web API Key** (username)
- **Web Secret Key** (password)

These credentials enable token-based authentication with the API.

### 2. Installed Dependencies

All required packages are already in `package.json`:
- `express` - Web server framework
- `cors` - Cross-origin requests
- `dotenv` - Environment variable management
- `csv-parse` - CSV data parsing

### 3. Asset Access

You must have access to assets in the GPS IoT system. Each asset has:
- `AssetId` - Unique asset identifier
- `Name` - Asset name/label
- `IMEI` - Device IMEI
- `Client` - Client name
- `Reseller` - Reseller information

---

## Setup Instructions

### Step 1: Configure Environment Variables

Create a `.env` file in the root project directory:

```bash
# GPS IoT API Configuration
GPSIOT_API_KEY=your_web_api_key_here
GPSIOT_API_SECRET=your_web_secret_key_here
GPSIOT_ENABLED=true
GPSIOT_POLL_INTERVAL=5000
NODE_ENV=development
```

**File location:** `soh-dashboard/.env`

**Important:**
- Never commit `.env` to version control
- Keep API credentials secure
- Use environment-specific credentials for dev/prod

### Step 2: Replace Placeholder Credentials

Edit `.env` with your actual credentials:

```bash
GPSIOT_API_KEY=abc123xyz...
GPSIOT_API_SECRET=secret789...
```

### Step 3: Start the Server

The GPS IoT monitoring will auto-start if credentials are configured:

```bash
npm run start
```

**Expected output:**
```
🔋 SoH API Server running at http://localhost:3001
...
🌐 GPS IoT Integration:
   GET  /api/gpsiot/status
   POST /api/gpsiot/start
   ...
⚡ Starting GPS IoT monitoring (5000ms interval)...
✓ GPS IoT monitoring started
```

---

## API Endpoints

### 1. Check GPS IoT Integration Status

```http
GET /api/gpsiot/status
```

**Response:**
```json
{
  "ok": true,
  "status": {
    "enabled": true,
    "connected": true,
    "apiKey": "abc1****",
    "pollInterval": 5000,
    "baseUrl": "https://api.gpsiot.net"
  }
}
```

### 2. Start GPS IoT Monitoring

```http
POST /api/gpsiot/start
Content-Type: application/json

{
  "apiKey": "your_web_api_key",
  "apiSecret": "your_web_secret_key",
  "pollInterval": 5000
}
```

**Use this if auto-start fails or to change credentials dynamically.**

### 3. Stop GPS IoT Monitoring

```http
POST /api/gpsiot/stop
```

### 4. Get All Monitored Assets

```http
GET /api/gpsiot/assets
```

**Response:**
```json
{
  "ok": true,
  "count": 3,
  "assets": [
    {
      "id": "ASSET-001",
      "name": "Fleet Vehicle 1",
      "imei": 123456789,
      "client": "Customer ABC",
      "reseller": "Partner XYZ"
    },
    ...
  ]
}
```

### 5. Get Latest Readings from All Assets

```http
GET /api/gpsiot/readings
```

**Response:**
```json
{
  "ok": true,
  "count": 3,
  "timestamp": "2026-01-15T10:30:00Z",
  "readings": [
    {
      "asset": {
        "id": "ASSET-001",
        "name": "Fleet Vehicle 1",
        "client": "Customer ABC"
      },
      "latestReading": {
        "assetId": "ASSET-001",
        "timestamp": "2024-01-15T10:29:55Z",
        "temperature": 45,
        "engineLoad": 65,
        "rpm": 1200,
        "fuelRate": 15.3,
        "vehicleSpeed": 60,
        "odometer": 125192000
      },
      "recordCount": 12
    },
    ...
  ]
}
```

### 6. Get Readings for Specific Asset

```http
GET /api/gpsiot/asset/{assetId}/readings
```

Example:
```http
GET /api/gpsiot/asset/ASSET-001/readings
```

### 7. Generate SoH Prediction from Asset Data

```http
POST /api/gpsiot/predict-from-asset
Content-Type: application/json

{
  "assetId": "ASSET-001",
  "cycle": 100
}
```

**Response:**
```json
{
  "ok": true,
  "source": "GPS_IoT_Asset",
  "assetId": "ASSET-001",
  "asset_data": {
    "temperature": 45,
    "engine_load": 65,
    "rpm": 1200,
    "vehicle_speed": 60,
    "odometer": 125192000
  },
  "predictions": {
    "soc": 85,
    "ensemble_soh": 0.92,
    "predictions": {
      "PSO-LSTM": 0.918,
      "PSO-CNN": 0.922,
      "Improved PSO-SVR": 0.920,
      ...
    },
    "alert": "HEALTHY",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## Data Mapping

### GPS IoT CAN Bus Data → Battery Stress Factors

| GPS IoT Field | Battery Indicator | Impact | Mapping |
|---|---|---|---|
| **CTemp** (Temperature) | Cell Temperature | High heat accelerates degradation | Directly used for Arrhenius compensation |
| **EngLoad** (Engine Load %) | Current Draw Proxy | Higher load = higher current = more stress | Scaled 0-100% → approx current (A) |
| **RPM** | System Activity | Indicates battery usage intensity | Logged for correlation analysis |
| **EngFuelRate** | Energy Consumption | Indicator of power demand cycles | Used to estimate C-rate effects |
| **Vehiclespeed** | Operating Conditions | Affects cooling and thermal management | Context for temperature correlation |
| **ObdOdometer** | Usage Pattern | Cumulative stress indicator | Used for cycle estimation |

### Example: Temperature-Based Degradation

```javascript
// GPS IoT provides: CTemp = 45°C
// Battery model applies:
const tempFactor = 1 + (45 - 25) * 0.00002  // Arrhenius equation
const degradationRate = baseRate * tempFactor
// Result: ~0.04% higher degradation per °C above 25°C
```

---

## Example Usage

### Example 1: Complete Integration Flow (JavaScript)

```javascript
// Start monitoring
const startResponse = await fetch('http://localhost:3001/api/gpsiot/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    apiKey: 'your_api_key',
    apiSecret: 'your_api_secret',
    pollInterval: 5000
  })
});

// Get all assets
const assetsResponse = await fetch('http://localhost:3001/api/gpsiot/assets');
const { assets } = await assetsResponse.json();

// For each asset, get prediction
for (const asset of assets) {
  const predResponse = await fetch('http://localhost:3001/api/gpsiot/predict-from-asset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      assetId: asset.id,
      cycle: 100
    })
  });
  
  const prediction = await predResponse.json();
  console.log(`${asset.name}: SoH = ${prediction.predictions.ensemble_soh}`);
}
```

### Example 2: Real-time Dashboard Integration (React)

```jsx
import { useEffect, useState } from 'react';

export function GPSIoTDashboard() {
  const [readings, setReadings] = useState([]);
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    const interval = setInterval(async () => {
      // Get latest readings
      const res = await fetch('http://localhost:3001/api/gpsiot/readings');
      const data = await res.json();
      setReadings(data.readings);

      // Get predictions for each asset
      const newPredictions = {};
      for (const item of data.readings) {
        const predRes = await fetch('http://localhost:3001/api/gpsiot/predict-from-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetId: item.asset.id })
        });
        const pred = await predRes.json();
        newPredictions[item.asset.id] = pred.predictions;
      }
      setPredictions(newPredictions);
    }, 10000);  // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {readings.map(item => (
        <div key={item.asset.id}>
          <h3>{item.asset.name}</h3>
          <p>Temperature: {item.latestReading?.temperature}°C</p>
          <p>Engine Load: {item.latestReading?.engineLoad}%</p>
          {predictions[item.asset.id] && (
            <p>SoH: {(predictions[item.asset.id].ensemble_soh * 100).toFixed(1)}%</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Troubleshooting

### Problem: "GPS IoT monitoring not active"

**Cause:** Monitoring hasn't been started or auto-start failed

**Solution:**
```bash
# 1. Check status
curl http://localhost:3001/api/gpsiot/status

# 2. Manually start monitoring
curl -X POST http://localhost:3001/api/gpsiot/start \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your_key",
    "apiSecret": "your_secret"
  }'
```

### Problem: "Provided credentials are incorrect"

**Cause:** Invalid API key or secret in .env or request

**Solution:**
1. Verify credentials from GPS IoT support
2. Check `.env` file for typos
3. Ensure `GPSIOT_ENABLED=true`
4. Check server logs: `npm run start`

### Problem: No assets returned

**Cause:** 
- Credentials valid but no assets assigned to this account
- Assets exist but API has 409 Conflict error

**Solution:**
1. Contact GPS IoT support to verify asset assignment
2. Check API logs on GPS IoT dashboard
3. Verify IMEI is properly attached to assets

### Problem: Outdated readings

**Cause:** Poll interval too long or API response slow

**Solution:**
```env
# Reduce poll interval (milliseconds)
GPSIOT_POLL_INTERVAL=3000  # 3 seconds instead of 5
```

**Note:** Shorter intervals = more API calls = higher costs

### Problem: High memory usage

**Cause:** Too many historical readings retained

**Solution:** The client keeps last 100 readings per asset. This is by design for performance. To adjust:

Edit [gpsiot-client.js](../gpsiot-client.js), line ~136:
```javascript
// Keep only last 50 readings instead of 100
if (readings.length > 50) {  // Changed from 100
  readings.shift();
}
```

---

## Advanced Configuration

### Token Caching & Expiration

Tokens are automatically cached and refreshed:
- Token validity: 2 hours (7200 seconds)
- Automatic refresh: 5 minutes before expiration
- Manual refresh on first auth failure

### Error Handling

The integration includes:
- ✅ Automatic token refresh
- ✅ Network error recovery
- ✅ Asset list caching (1 minute)
- ✅ Individual asset retry logic
- ✅ Detailed error logging

### Performance Optimization

- Token caching reduces auth calls
- Asset list is refreshed every 60 seconds
- Last 100 readings per asset in memory
- Streaming data without persistent storage (can add later)

---

## Next Steps

1. **Verify credentials** with GPS IoT support
2. **Update `.env` file** with your API credentials
3. **Start the server** and check logs
4. **Test endpoints** using curl or Postman
5. **Integrate with dashboard** using provided examples
6. **Monitor predictions** and adjust thresholds as needed

---

## Support

For GPS IoT API issues:
- **Base URL:** https://api.gpsiot.net
- **Support Contact:** Contact GPS IoT support team

For integration issues:
- Check server logs: `npm run start`
- Review API response status codes
- Verify `.env` configuration
- Test individual endpoints with curl

---

## ☁️ Cloud Deployment

Deploy the SoH prediction system to production cloud infrastructure for scalability and reliability.

### Pre-Deployment Checklist

```
✓ Create .env.production with production credentials
✓ Test locally with npm run start and npm run dev
✓ Run npm test and ensure all tests pass
✓ Build frontend: npm run build
✓ Configure SSL/HTTPS certificates
✓ Set up logging and monitoring
✓ Configure database for predictions (if needed)
✓ Set rate limiting for production
```

### Docker Containerization

**Dockerfile:**
```dockerfile
FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy source code
COPY api/ ./api/
COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.js ./

# Build frontend
RUN npm run build

# Expose ports
EXPOSE 3001 5173

# Environment
ENV NODE_ENV=production

# Start server
CMD ["node", "api/server.js"]
```

**Build & Run:**
```bash
# Build image
docker build -t soh-dashboard:1.0 .

# Run container
docker run -d \
  -p 3001:3001 \
  --env-file .env.production \
  --name soh-dashboard \
  soh-dashboard:1.0

# View logs
docker logs -f soh-dashboard
```

### AWS Deployment

#### Option 1: EC2 + PM2

```bash
# On EC2 instance
ssh ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone your-repo-url
cd soh-dashboard

# Install PM2 globally
sudo npm install -g pm2

# Create .env.production
sudo nano .env.production
# Add: GPSIOT_API_KEY, GPSIOT_API_SECRET, NODE_ENV=production

# Install dependencies
npm ci --production

# Start with PM2
pm2 start api/server.js --name "soh-api" --watch
pm2 start "npx vite preview --port 5173" --name "soh-frontend"

# Setup PM2 startup
pm2 startup
pm2 save

# View status
pm2 list
pm2 logs soh-api
```

#### Option 2: Elastic Beanstalk

```yaml
# .ebextensions/nodejs.config
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "node api/server.js"
    GzipCompression: true

  aws:elasticbeanstalk:application:environment:
    NODE_ENV: "production"
    GPSIOT_API_KEY: "your-key"
    GPSIOT_API_SECRET: "your-secret"

  aws:autoscaling:asg:
    MinSize: 2
    MaxSize: 10
    DesiredCapacity: 2

  aws:ec2:instances:
    InstanceTypes: "t3.medium,t3.large"
```

**Deploy:**
```bash
eb init -p "Node.js 20 running on 64bit Amazon Linux 2"
eb create soh-production
eb deploy
```

#### Option 3: ECS + Fargate

```json
{
  "family": "soh-dashboard",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "soh-api",
      "image": "your-account.dkr.ecr.region.amazonaws.com/soh-dashboard:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "hostPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "GPSIOT_POLL_INTERVAL",
          "value": "5000"
        }
      ],
      "secrets": [
        {
          "name": "GPSIOT_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:gpsiot-api-key"
        },
        {
          "name": "GPSIOT_API_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:gpsiot-api-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/soh-dashboard",
          "awslogs-region": "region",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Platform

#### Cloud Run

```bash
# Create .dockerignore
node_modules
.env
.git

# Deploy to Cloud Run
gcloud run deploy soh-dashboard \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 3600 \
  --set-env-vars NODE_ENV=production,GPSIOT_POLL_INTERVAL=5000 \
  --set-secrets GPSIOT_API_KEY=gpsiot-key:latest,GPSIOT_API_SECRET=gpsiot-secret:latest
```

#### Compute Engine

```bash
# SSH to VM
gcloud compute ssh soh-dashboard --zone us-central1-a

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Start application
pm2 start api/server.js --name "soh-api"
pm2 startup
pm2 save
```

### Microsoft Azure

#### App Service

```yaml
# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'

  - script: |
      npm ci
      npm run build
    displayName: 'Install & Build'

  - task: PublishBuildArtifacts@1
    inputs:
      pathToPublish: '$(Build.ArtifactStagingDirectory)'

  - task: AzureRmWebAppDeployment@4
    inputs:
      azureSubscription: 'Azure Subscription'
      appType: 'webAppLinux'
      appName: 'soh-dashboard'
      package: '$(Build.ArtifactStagingDirectory)'
      RuntimeStack: 'NODE|20-lts'
      StartupCommand: 'node api/server.js'
```

#### Container Instances

```bash
az container create \
  --resource-group soh-group \
  --name soh-dashboard \
  --image soh-dashboard:latest \
  --port 3001 \
  --environment-variables NODE_ENV=production GPSIOT_POLL_INTERVAL=5000 \
  --secure-environment-variables GPSIOT_API_KEY=$API_KEY GPSIOT_API_SECRET=$API_SECRET \
  --cpu 1 \
  --memory 1
```

### Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create soh-dashboard

# Add buildpacks
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/static

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set GPSIOT_API_KEY=your-key
heroku config:set GPSIOT_API_SECRET=your-secret
heroku config:set GPSIOT_POLL_INTERVAL=5000

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

**Procfile:**
```
web: node api/server.js
```

### DigitalOcean App Platform

```yaml
# app.yaml
name: soh-dashboard
services:
  - name: api
    github:
      branch: main
      repo: your-username/soh-dashboard
    build_command: npm ci && npm run build
    run_command: node api/server.js
    environment_slug: node-js
    http_port: 3001
    envs:
      - key: NODE_ENV
        value: production
      - key: GPSIOT_POLL_INTERVAL
        value: "5000"
      - key: GPSIOT_API_KEY
        scope: RUN_TIME
        value: ${GPSIOT_API_KEY}
      - key: GPSIOT_API_SECRET
        scope: RUN_TIME
        value: ${GPSIOT_API_SECRET}
    http_port: 3001
```

### Production Best Practices

#### 1. Environment Management

```bash
# .env.production template
NODE_ENV=production
GPSIOT_API_KEY=${GPSIOT_API_KEY}
GPSIOT_API_SECRET=${GPSIOT_API_SECRET}
GPSIOT_POLL_INTERVAL=5000
GPSIOT_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FILE=/var/log/soh-dashboard/app.log

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 2. Monitoring & Logging

```bash
# Setup with Winston logger
npm install winston winston-daily-rotate-file

# PM2 monitoring
pm2 install pm2-logrotate
pm2 install pm2-auto-pull

# View metrics
pm2 monit
```

#### 3. Scaling Configuration

```javascript
// api/server.js with cluster support
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} exited`);
    cluster.fork();
  });
} else {
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started`);
  });
}
```

#### 4. SSL/HTTPS Setup

```nginx
# nginx configuration
server {
  listen 443 ssl http2;
  server_name api.yourdomain.com;

  ssl_certificate /etc/ssl/certs/fullchain.pem;
  ssl_certificate_key /etc/ssl/private/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  location / {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

#### 5. Cost Optimization

| Platform | Starter | Production | Estimate |
|----------|---------|------------|----------|
| **AWS EC2** | t3.small | t3.medium-large | $10-50/mo |
| **Heroku** | Free tier (limited) | Standard | $15-100/mo |
| **DigitalOcean** | Basic droplet | Standard | $5-30/mo |
| **GCP Cloud Run** | Pay-per-use | Always-on | $10-50/mo |
| **Azure** | Free tier | Standard | $15-80/mo |

### Monitoring Dashboard

Set up health checks and monitoring:

```javascript
// Health endpoint for monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    gpsiot: gpsIoTMonitor ? 'active' : 'inactive',
    environment: process.env.NODE_ENV,
    memory: process.memoryUsage()
  });
});

// Metrics endpoint for monitoring systems
app.get('/api/metrics', (req, res) => {
  const uptime = process.uptime();
  const mem = process.memoryUsage();
  
  res.json({
    uptime_seconds: uptime,
    memory_usage_mb: (mem.heapUsed / 1024 / 1024).toFixed(2),
    memory_limit_mb: (mem.heapTotal / 1024 / 1024).toFixed(2),
    active_assets: gpsIoTMonitor ? gpsIoTMonitor.getAssets().length : 0,
    total_requests: requestCount,
    api_errors: errorCount
  });
});
```

---

## API Reference

**GPS IoT Base URL:** `https://api.gpsiot.net`

### Authentication
- **Endpoint:** `POST /token`
- **Headers:** `Content-Type: application/x-www-form-urlencoded`
- **Body:** `username={API_KEY}&password={API_SECRET}&grant_type=password`
- **Token Lifetime:** 7200 seconds (2 hours)

### Assets
- **Endpoint:** `GET /api/Asset/GetResellerAssets`
- **Headers:** `Authorization: Bearer {access_token}`
- **Response:** Array of asset objects with AssetId, Name, IMEI, Client, Reseller

### CAN Bus Data
- **Endpoint:** `POST /api/Status/v2/GetCanBus`
- **Headers:** `Authorization: Bearer {access_token}`
- **Body:** `{ "AssetId": "string" }`
- **Response:** Object with RPM, Temperature, Fuel, EngLoad, Speed, etc.

---

**Last Updated:** January 2024
**Version:** 1.0
