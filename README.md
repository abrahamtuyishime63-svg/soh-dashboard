# 🔋 SoH Battery Intelligence Platform

A full-stack engineering dashboard for **State of Health (SoH) prediction** using 7 machine learning models, with real-time streaming and REST API integration.

---

## 📁 Project Structure

```
soh-dashboard/
├── api/
│   └── server.js              ← Express REST + SSE API server (port 3001)
├── src/
│   ├── components/
│   │   ├── Charts.jsx         ← SVG line/bar charts (no external lib)
│   │   ├── Header.jsx         ← Top navigation bar
│   │   ├── Overview.jsx       ← Dashboard KPIs + leaderboard
│   │   ├── SoHPlots.jsx       ← SoH vs Cycles — all 7 models
│   │   ├── ResistancePlots.jsx← Rint vs Cycles + electrothermal correlations
│   │   ├── ModelMetrics.jsx   ← RMSE/MAE/R² comparison charts + grading
│   │   ├── ElectroThermal.jsx ← Joule heating, temp, stress analysis
│   │   ├── TrainingCurves.jsx ← PSO-SVR learning curves
│   │   └── LivePredict.jsx    ← SSE live stream + POST predict + CSV batch
│   ├── data/                  ← CSV data files (auto-loaded by API)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

---

## 🚀 How to Run Locally

### Step 1 — Install dependencies

```bash
cd soh-dashboard
npm install
```

> Requires Node.js ≥ 18. Check with `node -v`.

### Step 2 — Start both servers

```bash
npm run dev
```

This starts:
- **API server** at `http://localhost:3001`
- **Frontend** at `http://localhost:5173` (opens automatically)

Or start them separately:
```bash
# Terminal 1 — API
node api/server.js

# Terminal 2 — Frontend
npx vite --port 5173 --open
```

---

## 🧠 7 Models Explained

| Model | R² | RMSE | Type |
|---|---|---|---|
| **Improved PSO-SVR ★** | 99.95% | 0.0008 | Support Vector Regression + Particle Swarm Optimization |
| Random Forest | 94.90% | 0.0082 | Ensemble tree-based |
| PSO-LSTM | 93.37% | 0.0093 | Long Short-Term Memory + PSO |
| PSO-CNN | 79.89% | 0.0162 | 1D Convolutional NN + PSO |
| Phys-Informed PSO-LSTM-Attn | 76.69% | 0.0175 | Physics-constrained LSTM + Attention |
| XGB | 76.48% | 0.0176 | Extreme Gradient Boosting |
| GRU | 50.07% | 0.0256 | Gated Recurrent Unit |

---

## 🔌 API Reference

### Base URL: `http://localhost:3001`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/batteries` | List all battery IDs |
| GET | `/api/predictions?battery=<id>` | Full SoH series, all 7 models |
| GET | `/api/metrics` | Model comparison (RMSE, MAE, R²) |
| GET | `/api/resistance` | Internal resistance & temperature data |
| GET | `/api/electrothermal` | Coupled electrothermal summary |
| GET | `/api/training` | PSO-SVR learning curves |
| **GET** | **`/api/stream?battery=<id>`** | **Live SSE stream (new cycle every 2s)** |
| **POST** | **`/api/predict`** | **Predict SoH from new sensor data** |

### POST /api/predict

**Request body:**
```json
{
  "battery_name": "SJV1.1BAK45A2025-0014",
  "cycle": 370,
  "voltage": 3.65,
  "current": 2.5,
  "temperature": 30
}
```

**Response:**
```json
{
  "ok": true,
  "battery_name": "SJV1.1BAK45A2025-0014",
  "cycle": 370,
  "soh_actual": 0.7976,
  "cloud": { "fc": 35840, "rc": 18930, "soc": 56, "curr": 0, "tv": 76830, "rated_capacity": 4500 },
  "voc": 83.74,
  "vt": 76.83,
  "r_internal": 0.0000,
  "predictions": {
    "PSO-LSTM": 0.7977,
    "PSO-CNN": 0.7981,
    "Improved PSO-SVR": 0.7972,
    "XGB": 0.7990,
    "GRU": 0.7901,
    "RF": 0.7975,
    "Phys-Informed PSO-LSTM-Attn": 0.7976
  },
  "ensemble_soh": 0.7976,
  "alert": "NOMINAL",
  "timestamp": "2026-06-02T19:30:00.000Z"
}
```

---

## 📡 Real-Time Streaming (SSE)

The `/api/stream` endpoint uses **Server-Sent Events (SSE)**. The frontend connects to it via the browser's `EventSource` API.

### How to connect from your own code:

```javascript
const es = new EventSource('http://localhost:3001/api/stream?battery=SJV1.1BAK45A2025-0014')

es.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('New cycle:', data.cycle, 'SoH predictions:', data['Improved PSO-SVR'])
}

es.onerror = () => es.close()
```

### Connecting to a Real BMS API

To replace the simulated stream with real data from a Battery Management System:

1. **Option A — Replace the SSE source:**
   In `LivePredict.jsx`, change:
   ```javascript
   const es = new EventSource(`/api/stream?battery=...`)
   ```
   to your real BMS WebSocket or SSE endpoint.

2. **Option B — Push from external system:**
   Have your BMS/IoT system `POST` to `/api/predict` every time a new cycle completes:
   ```bash
   curl -X POST http://localhost:3001/api/predict \
     -H "Content-Type: application/json" \
     -d '{"battery_name":"BAT001","cycle":500,"voltage":3.60,"temperature":32}'
   ```

3. **Option C — CSV upload:**
   Use the "CSV Batch Prediction" panel in the Live Predict tab to upload historical or streamed data.

---

## 📊 Dashboard Tabs

| Tab | Contents |
|---|---|
| **Overview** | KPI cards, quick SoH chart, model leaderboard, full comparison table |
| **SoH vs Cycles** | Interactive multi-model SoH curves, model toggles, cycle range filter |
| **Rint vs Cycles** | Internal resistance derived from each model, temperature proxy, correlations |
| **Model Metrics** | Bar charts for RMSE/MAE/R²/MAPE, graded comparison table |
| **Electrothermal** | Joule heating, temperature rise, electrothermal stress, cross-battery table |
| **Training Curves** | PSO-SVR learning curves: loss/RMSE/MAE vs training fraction |
| **Live Predict** | SSE live stream, manual POST form, CSV batch prediction |

---

## 🔧 Connecting to Production IoT/API

For production integration, update `api/server.js`:

```javascript
// Replace CSV reading with database or IoT API call:
app.get('/api/predictions', async (req, res) => {
  const data = await yourDatabaseOrAPI.query({
    battery: req.query.battery,
    // ...
  })
  res.json({ ok: true, data })
})

// For SSE stream, replace setInterval with real event listener:
app.get('/api/stream', (req, res) => {
  // ... SSE headers ...
  yourBMSClient.on('new_cycle', (cycleData) => {
    const predictions = runAllModels(cycleData) // call your Python model microservice
    res.write(`data: ${JSON.stringify(predictions)}\n\n`)
  })
})
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Charts | Custom SVG (no external lib) |
| API Server | Node.js + Express |
| Data | CSV files → in-memory |
| Streaming | Server-Sent Events (SSE) |
| Styling | Pure CSS with CSS variables |
| Fonts | Space Mono + Syne |
