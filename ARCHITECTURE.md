# 🏗️ System Architecture & Real-Time Standards Integration

## Complete System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUD BMS PROVIDERS (External)                   │
├─────────────────────────────────────────────────────────────────────┤
│  Tesla BMS Cloud  │  CATL Cloud  │  LG Chem  │  BYD  │  MQTT Broker │
│  api.tesla.com    │  api.catl.com│  api.lg.. │ .... │  mqtt://...  │
└────────┬──────────┴──────┬───────┴────┬──────┴──────┴─────────┬──────┘
         │ (HTTPS POST/GET)│            │                      │
         └────────┬────────┴────────────┴──────────────────────┘
                  │ Real-Time Data Stream
         ┌────────▼────────────────────────────┐
         │   .env Configuration File            │
         │  (API Keys & Credentials)            │
         │                                      │
         │  TESLA_API_KEY=sk_...              │
         │  CATL_API_KEY=...                  │
         │  MQTT_BROKER_URL=mqtt://...        │
         └────────┬────────────────────────────┘
                  │
         ┌────────▼──────────────────────────────────────────────────┐
         │          API Server (Node.js/Express)                     │
         │          api/server.js                                    │
         ├────────────────────────────────────────────────────────────┤
         │                                                            │
         │  ┌─────────────────────────────────────────────────────┐  │
         │  │  Cloud Integration Module                          │  │
         │  │  - cloud-bms.js (Tesla/CATL/LG/BYD)              │  │
         │  │  - mqtt.js (IoT Broker)                           │  │
         │  │  - custom-api.js (Generic REST)                  │  │
         │  └─────────────────────────────────────────────────────┘  │
         │                          │                                │
         │  ┌──────────────────────▼──────────────────────────────┐  │
         │  │  Real-Time Timestamp Manager                      │  │
         │  │  api/utils/timestamps.js                          │  │
         │  │  - ISO 8601 timestamp normalization              │  │
         │  │  - Time-series bucketing                         │  │
         │  │  - Server uptime tracking                        │  │
         │  └─────────────────────────────────────────────────────┘  │
         │                          │                                │
         │  ┌──────────────────────▼──────────────────────────────┐  │
         │  │  Standards Compliance Module                      │  │
         │  │  routes/standards.js                              │  │
         │  │  - ISO 12405-4 (SoH thresholds)                  │  │
         │  │  - IEC 61960 (Thermal limits)                    │  │
         │  │  - ISO 80000-5 (Units validation)                │  │
         │  │  - Real-time alerts                              │  │
         │  └─────────────────────────────────────────────────────┘  │
         │                          │                                │
         │  ┌──────────────────────▼──────────────────────────────┐  │
         │  │  Database Layer                                   │  │
         │  │  routes/database.js (SQLite)                      │  │
         │  │  - Telemetry storage                             │  │
         │  │  - Historical data (365 days)                    │  │
         │  │  - Daily summaries                               │  │
         │  │  - Compliance logs                               │  │
         │  └─────────────────────────────────────────────────────┘  │
         │                          │                                │
         │  ┌──────────────────────▼──────────────────────────────┐  │
         │  │  API Routes (Endpoints)                           │  │
         │  │                                                   │  │
         │  │  GET  /api/cloud/batteries                       │  │
         │  │  GET  /api/cloud/battery/:id                     │  │
         │  │  GET  /api/battery/:id/history                  │  │
         │  │  POST /api/battery/:id/sync                      │  │
         │  │  GET  /api/health                                │  │
         │  └─────────────────────────────────────────────────────┘  │
         │                                                            │
         └────────┬────────────────────────────────────────────────┘
                  │ HTTP/SSE/WebSocket
         ┌────────▼────────────────────────────────────────────────┐
         │       Frontend (React/Vite)                             │
         │       src/                                              │
         ├────────────────────────────────────────────────────────┤
         │                                                         │
         │  Components with Real-Time Data:                       │
         │  ┌─────────────────────────────────────────────────┐   │
         │  │ Overview.jsx                                  │   │
         │  │ - Displays real-time cloud data              │   │
         │  │ - Shows last sync timestamp                  │   │
         │  │ - Standards compliance badges                │   │
         │  └─────────────────────────────────────────────────┘   │
         │                                                         │
         │  ┌─────────────────────────────────────────────────┐   │
         │  │ AIRecommendations.jsx                         │   │
         │  │ - Real-time SoH tracking                      │   │
         │  │ - Standards-based alerts                      │   │
         │  │ - Live degradation rate calculation           │   │
         │  └─────────────────────────────────────────────────┘   │
         │                                                         │
         │  ┌─────────────────────────────────────────────────┐   │
         │  │ AdminDashboard.jsx                            │   │
         │  │ - Cloud sync controls                         │   │
         │  │ - Real-time battery management                │   │
         │  │ - Data export (CSV/JSON)                      │   │
         │  └─────────────────────────────────────────────────┘   │
         │                                                         │
         │  ┌─────────────────────────────────────────────────┐   │
         │  │ ElectroThermal.jsx                            │   │
         │  │ - Real-time temperature monitoring            │   │
         │  │ - Thermal gradient tracking                   │   │
         │  │ - IEC 61960 compliance checks                 │   │
         │  └─────────────────────────────────────────────────┘   │
         │                                                         │
         └────────────────────────────────────────────────────────┘
                          │
                          │ Browser Display
                          ▼
                   🔋 Live Dashboard
```

---

## 📂 Complete File Structure with Real API Integration

```
soh-dashboard/
│
├── .env ........................... ⭐ YOUR CLOUD CREDENTIALS HERE
│   ├── TESLA_API_KEY
│   ├── CATL_API_KEY
│   ├── MQTT_BROKER_URL
│   ├── CUSTOM_REST_URL
│   ├── DATABASE_TYPE=sqlite
│   └── STANDARDS_COMPLIANCE=true
│
├── .env.example ................... Template (DO NOT EDIT)
│
├── api/
│   ├── server.js .................. Main Express server
│   │   ├── Loads .env config
│   │   ├── Initializes cloud provider
│   │   ├── Sets up database
│   │   └── Defines API routes
│   │
│   ├── routes/ .................... 📍 CREATE THESE FILES
│   │   ├── cloud-bms.js ........... Tesla/CATL/LG/BYD integration
│   │   ├── mqtt.js ................ MQTT IoT broker connection
│   │   ├── custom-api.js .......... Generic REST API client
│   │   ├── database.js ............ SQLite operations
│   │   └── standards.js ........... ISO/IEC compliance checks
│   │
│   ├── config/ .................... 📍 CREATE THESE FILES
│   │   ├── providers.js ........... Provider factory
│   │   └── standards.json ......... Standards definitions
│   │
│   ├── utils/
│   │   └── timestamps.js .......... ✅ CREATED
│   │       ├── getCurrentTimestamp()
│   │       ├── normalizeTimestamp()
│   │       ├── calculateTimeDifference()
│   │       ├── getServerUptime()
│   │       └── addResponseMetadata()
│   │
│   └── data/ ...................... Data directory
│       ├── battery_history.db ..... SQLite database
│       └── *.csv .................. CSV data files
│
├── src/
│   ├── components/
│   │   ├── Overview.jsx ........... ✅ UPDATED
│   │   │   ├── Shows 12-month projections
│   │   │   ├── Fetches /api/cloud/battery/:id
│   │   │   └── Displays real timestamps
│   │   │
│   │   ├── AIRecommendations.jsx .. ✅ UPDATED
│   │   │   ├── Standards-based alerts
│   │   │   └── Real-time SoH tracking
│   │   │
│   │   ├── AdminDashboard.jsx ..... ✅ UPDATED
│   │   │   ├── Cloud sync button
│   │   │   ├── Battery management UI
│   │   │   └── Data export controls
│   │   │
│   │   ├── ElectroThermal.jsx ..... ✅ UPDATED
│   │   │   ├── Real-time temp monitoring
│   │   │   └── Thermal gradient alerts
│   │   │
│   │   └── Header.jsx ............ ✅ UPDATED
│   │       ├── ISO/IEC badge
│   │       └── Language selector
│   │
│   ├── hooks/
│   │   └── useRealtimeData.js .... 📍 CREATE THIS
│   │       └── Custom hook for live updates
│   │
│   └── i18n.js ................... ✅ Internationalization
│       └── 8 languages support
│
├── CLOUD_API_INTEGRATION.md ....... 📘 Full integration guide
│   ├── Provider-specific instructions
│   ├── Database schema
│   ├── Standards compliance details
│   └── Security best practices
│
├── REAL_API_QUICK_START.md ....... 📘 Quick start guide
│   ├── .env configuration
│   ├── File creation checklist
│   ├── Endpoint reference
│   └── Troubleshooting
│
├── ARCHITECTURE.md ............... 📘 This file
│
├── package.json .................. ✅ UPDATED
│   ├── Added: dotenv
│   ├── Added: axios
│   ├── Added: mqtt
│   ├── Added: sqlite3
│   ├── Added: jsonwebtoken
│   └── Added: express-rate-limit
│
├── .gitignore .................... ✅ UPDATED
│   ├── .env (don't commit!)
│   ├── data/
│   ├── logs/
│   └── node_modules/
│
└── README.md ..................... Main documentation
```

---

## 🔄 Real-Time Data Flow

### 1️⃣ Cloud to Server
```
Cloud Provider (Tesla/CATL/MQTT)
         ↓
    .env credentials loaded
         ↓
CloudBMSProvider.getBatteryData()
         ↓
Data normalized to standard schema
         ↓
TimestampManager.normalizeTimestamp()
         ↓
StandardsCompliance.checkCompliance()
         ↓
BatteryDatabase.storeTelemetry()
         ↓
SQLite Database
```

### 2️⃣ Server to Frontend
```
GET /api/cloud/battery/:id
         ↓
CloudProvider.getBatteryData()
         ↓
Add ISO 8601 timestamp
         ↓
Add standards compliance badges
         ↓
Add server metadata (_meta)
         ↓
HTTP Response (JSON)
         ↓
React Component receives data
```

### 3️⃣ Frontend Display
```
Browser Component
         ↓
fetch('/api/cloud/battery/:id')
         ↓
Parse response with timestamp
         ↓
Display with standards badges
         ↓
Auto-update every 5-60 seconds
         ↓
Show real-time status
```

---

## 🎯 Real-Time Timestamp Implementation

### Every Response Includes:
```json
{
  "ok": true,
  "data": {
    "battery_id": "BAT-001",
    "timestamp": "2026-06-18T08:30:45.123Z",
    "cycle_count": 245,
    "soc": 85,
    "soh": 95.2
  },
  "_meta": {
    "timestamp": "2026-06-18T08:30:45.123Z",
    "server_uptime": "2h 30m 45s",
    "iso_8601_compliant": true,
    "real_time": {
      "enabled": true,
      "polling_interval_ms": 1000,
      "last_sync": "2026-06-18T08:30:44.000Z"
    }
  }
}
```

### Standards Compliance Data:
```json
{
  "standards_checks": {
    "iso_12405_4_soh": {
      "status": "PASS",
      "value": 95.2,
      "threshold": 80,
      "message": "✅ SoH 95.2% >= 80% (HEALTHY)"
    },
    "iec_61960_thermal": {
      "status": "PASS",
      "value": 28.5,
      "threshold_min": 0,
      "threshold_max": 60,
      "message": "✅ Temperature 28.5°C within safe range"
    }
  }
}
```

---

## 🔐 Security Layer

```
┌─────────────────────────────────────────┐
│         Request Arrives                 │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    Rate Limiting Check                  │
│    (100 requests/15 min)                │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    JWT/API Key Validation               │
│    (if /api/cloud/* route)              │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    CORS Verification                    │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    Route Handler Execution              │
│    (Cloud Provider Call)                │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    Standards Compliance Check           │
│    (Validate Response Data)             │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    Database Storage (if enabled)        │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│    Response Metadata Added              │
│    (Timestamps + Standards)             │
└────────────────┬────────────────────────┘
                 ▼
┌─────────────────────────────────────────┐
│         Response Sent to Client         │
└─────────────────────────────────────────┘
```

---

## 📊 Standards Compliance Matrix

```
┌──────────────────┬──────────────────┬─────────────────────┐
│   Standard       │   Component      │   Compliance Check  │
├──────────────────┼──────────────────┼─────────────────────┤
│ ISO 12405-4      │ SoH Calculation  │ Thresholds          │
│                  │                  │ - Healthy: ≥80%     │
│                  │                  │ - Caution: 65-80%   │
│                  │                  │ - Degraded: 40-65%  │
│                  │                  │ - EOL: <40%         │
├──────────────────┼──────────────────┼─────────────────────┤
│ IEC 61960        │ Temperature      │ Safe Range          │
│                  │ Monitoring       │ - 0°C to 60°C       │
│                  │                  │ - Ref: 25°C         │
├──────────────────┼──────────────────┼─────────────────────┤
│ ISO 8601         │ Timestamps       │ Format              │
│                  │                  │ YYYY-MM-DDTHH:mm:Z  │
├──────────────────┼──────────────────┼─────────────────────┤
│ ISO 80000-5      │ Units            │ - °C, W, Ω, Wh      │
├──────────────────┼──────────────────┼─────────────────────┤
│ IEC 61850        │ Data Integrity   │ Real-time logs      │
│                  │ & Audit Trail    │                     │
└──────────────────┴──────────────────┴─────────────────────┘
```

---

## 🚀 Deployment Checklist

- [ ] `.env` file created with real API credentials
- [ ] All cloud provider files created in `api/routes/`
- [ ] Database initialized (first run creates tables)
- [ ] `npm install` completed
- [ ] Tests pass with real API
- [ ] Timestamps showing ISO 8601 format
- [ ] Standards badges appearing in UI
- [ ] Historical data persisting to database
- [ ] Rate limiting active
- [ ] Logging enabled
- [ ] Backups configured
- [ ] Monitoring enabled

---

## 📞 Quick Reference

### To Get Real Cloud Data Working:
1. Get API key from cloud provider
2. Fill `.env` with key and URL
3. Create integration files in `api/routes/`
4. Add routes to `api/server.js`
5. Restart: `npm run dev`
6. Test: `curl http://localhost:3001/api/cloud/batteries`

### To Check Real-Time Status:
```bash
# All batteries (real-time)
curl http://localhost:3001/api/cloud/batteries

# Specific battery
curl http://localhost:3001/api/cloud/battery/BAT-001

# Historical data
curl "http://localhost:3001/api/battery/BAT-001/history?hours=24"

# Server uptime
curl http://localhost:3001/api/health
```

### Files You MUST Create:
- ✅ `.env` (copy from `.env.example`)
- ✅ `api/routes/cloud-bms.js`
- ✅ `api/routes/mqtt.js`
- ✅ `api/routes/database.js`
- ✅ `api/routes/standards.js`

### Files Already Created:
- ✅ `api/utils/timestamps.js`
- ✅ `CLOUD_API_INTEGRATION.md`
- ✅ `REAL_API_QUICK_START.md`
