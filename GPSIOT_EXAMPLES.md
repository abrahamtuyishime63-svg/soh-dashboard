# GPS IoT Integration - Practical Examples

## Table of Contents
1. [cURL Command Examples](#curl-commands)
2. [JavaScript/Node.js Examples](#javascript)
3. [Python Examples](#python)
4. [React Component Examples](#react)
5. [Real-world Scenarios](#scenarios)

---

## cURL Commands

### 1. Check Integration Status

```bash
curl http://localhost:3001/api/gpsiot/status
```

**Response:**
```json
{
  "ok": true,
  "status": {
    "enabled": true,
    "connected": false,
    "apiKey": "abc1****",
    "pollInterval": 5000,
    "baseUrl": "https://api.gpsiot.net"
  }
}
```

### 2. Start Monitoring

```bash
curl -X POST http://localhost:3001/api/gpsiot/start \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your_api_key_here",
    "apiSecret": "your_api_secret_here",
    "pollInterval": 5000
  }'
```

### 3. Stop Monitoring

```bash
curl -X POST http://localhost:3001/api/gpsiot/stop
```

### 4. List Assets

```bash
curl http://localhost:3001/api/gpsiot/assets
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
    }
  ]
}
```

### 5. Get All Real-time Readings

```bash
curl http://localhost:3001/api/gpsiot/readings
```

### 6. Get Readings for Specific Asset

```bash
curl "http://localhost:3001/api/gpsiot/asset/ASSET-001/readings"
```

### 7. Generate SoH Prediction

```bash
curl -X POST http://localhost:3001/api/gpsiot/predict-from-asset \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "ASSET-001",
    "cycle": 100
  }'
```

### 8. Continuous Monitoring (Every 10 seconds)

```bash
while true; do
  echo "=== $(date) ==="
  curl -s http://localhost:3001/api/gpsiot/readings | jq '.readings[0].latestReading'
  sleep 10
done
```

### 9. Export Readings to JSON

```bash
curl -s http://localhost:3001/api/gpsiot/readings | \
  jq '.readings[] | {asset: .asset.name, data: .latestReading}' | \
  tee readings_$(date +%Y%m%d_%H%M%S).json
```

### 10. Filter Assets by Client

```bash
curl -s http://localhost:3001/api/gpsiot/assets | \
  jq '.assets[] | select(.client == "Customer ABC")'
```

---

## JavaScript / Node.js

### 1. Simple Status Check

```javascript
const fetch = require('node-fetch');

async function checkStatus() {
  const response = await fetch('http://localhost:3001/api/gpsiot/status');
  const data = await response.json();
  console.log('GPS IoT Status:', data.status);
}

checkStatus();
```

### 2. Start Monitoring

```javascript
async function startMonitoring(apiKey, apiSecret) {
  const response = await fetch('http://localhost:3001/api/gpsiot/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      apiSecret,
      pollInterval: 5000
    })
  });

  const data = await response.json();
  if (data.ok) {
    console.log('✓ Monitoring started');
    console.log(`  Assets: ${data.status.assets}`);
  } else {
    console.error('✗ Failed to start monitoring:', data.error);
  }
}

startMonitoring('your_api_key', 'your_api_secret');
```

### 3. Fetch and Process All Readings

```javascript
async function getAllReadings() {
  const response = await fetch('http://localhost:3001/api/gpsiot/readings');
  const { readings } = await response.json();

  readings.forEach(item => {
    const { asset, latestReading, recordCount } = item;
    
    console.log(`\n📍 ${asset.name}`);
    console.log(`   Client: ${asset.client}`);
    console.log(`   Records: ${recordCount}`);
    
    if (latestReading) {
      console.log(`   🌡️ Temp: ${latestReading.temperature}°C`);
      console.log(`   ⚙️ Load: ${latestReading.engineLoad}%`);
      console.log(`   💨 Speed: ${latestReading.vehicleSpeed} km/h`);
      console.log(`   🔧 RPM: ${latestReading.rpm}`);
    }
  });
}

getAllReadings();
```

### 4. Get Predictions for All Assets

```javascript
async function getPredictionsForAll() {
  // Get all assets
  const assetsRes = await fetch('http://localhost:3001/api/gpsiot/assets');
  const { assets } = await assetsRes.json();

  // Get prediction for each
  const predictions = {};
  
  for (const asset of assets) {
    try {
      const predRes = await fetch('http://localhost:3001/api/gpsiot/predict-from-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: asset.id,
          cycle: 100
        })
      });

      const pred = await predRes.json();
      predictions[asset.name] = {
        soh: pred.predictions.ensemble_soh,
        alert: pred.predictions.alert,
        temp: pred.asset_data.temperature
      };
    } catch (error) {
      console.error(`Failed to predict for ${asset.name}:`, error.message);
    }
  }

  return predictions;
}

getPredictionsForAll().then(console.table);
```

### 5. Monitoring Loop with Alerts

```javascript
async function monitorAndAlert() {
  const alertThreshold = 0.8;

  while (true) {
    const assetsRes = await fetch('http://localhost:3001/api/gpsiot/assets');
    const { assets } = await assetsRes.json();

    for (const asset of assets) {
      const predRes = await fetch('http://localhost:3001/api/gpsiot/predict-from-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: asset.id })
      });

      const pred = await predRes.json();
      const soh = pred.predictions.ensemble_soh;

      if (soh < alertThreshold) {
        console.warn(`⚠️ ALERT: ${asset.name} - SoH=${soh.toFixed(2)}`);
        // Send notification, alert, etc.
      } else {
        console.log(`✓ ${asset.name} - SoH=${soh.toFixed(2)}`);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 30000)); // 30s
  }
}

monitorAndAlert();
```

### 6. Real-time Stream with Polling

```javascript
class GPSIoTMonitor {
  constructor(updateInterval = 10000) {
    this.interval = updateInterval;
    this.isRunning = false;
    this.data = {};
  }

  async start() {
    this.isRunning = true;
    console.log('Starting GPS IoT monitor...');
    
    while (this.isRunning) {
      try {
        const response = await fetch('http://localhost:3001/api/gpsiot/readings');
        const result = await response.json();
        
        if (result.ok) {
          this.data = result.readings;
          this.onUpdate(this.data);
        }
      } catch (error) {
        this.onError(error);
      }
      
      await new Promise(resolve => setTimeout(resolve, this.interval));
    }
  }

  stop() {
    this.isRunning = false;
    console.log('GPS IoT monitor stopped');
  }

  onUpdate(data) {
    console.log(`Updated: ${data.length} assets`);
  }

  onError(error) {
    console.error('Monitor error:', error.message);
  }
}

// Usage
const monitor = new GPSIoTMonitor(5000);
monitor.start();

// Stop after 1 hour
setTimeout(() => monitor.stop(), 3600000);
```

---

## Python

### 1. Check Status

```python
import requests

response = requests.get('http://localhost:3001/api/gpsiot/status')
data = response.json()
print('Status:', data['status'])
```

### 2. Start Monitoring

```python
import requests

def start_monitoring(api_key, api_secret):
    response = requests.post(
        'http://localhost:3001/api/gpsiot/start',
        json={
            'apiKey': api_key,
            'apiSecret': api_secret,
            'pollInterval': 5000
        }
    )
    return response.json()

result = start_monitoring('your_key', 'your_secret')
print('Started:', result['ok'])
```

### 3. Get Predictions and Export to CSV

```python
import requests
import csv
from datetime import datetime

def export_predictions_to_csv():
    # Get assets
    assets_res = requests.get('http://localhost:3001/api/gpsiot/assets')
    assets = assets_res.json()['assets']
    
    # Get predictions
    predictions = []
    for asset in assets:
        pred_res = requests.post(
            'http://localhost:3001/api/gpsiot/predict-from-asset',
            json={'assetId': asset['id']}
        )
        pred = pred_res.json()
        
        predictions.append({
            'Asset': asset['name'],
            'AssetID': asset['id'],
            'SoH': pred['predictions']['ensemble_soh'],
            'Alert': pred['predictions']['alert'],
            'Temperature': pred['asset_data']['temperature'],
            'EngineLoad': pred['asset_data']['engine_load'],
            'Timestamp': pred['predictions']['timestamp']
        })
    
    # Export to CSV
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'predictions_{timestamp}.csv'
    
    with open(filename, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=predictions[0].keys())
        writer.writeheader()
        writer.writerows(predictions)
    
    print(f'✓ Exported {len(predictions)} predictions to {filename}')
    return predictions

predictions = export_predictions_to_csv()
```

### 4. Monitoring with Alerts

```python
import requests
import time
from datetime import datetime

def monitor_with_alerts(alert_threshold=0.8, interval=30):
    print(f'Starting monitoring (threshold: {alert_threshold}, interval: {interval}s)')
    
    while True:
        try:
            # Get readings
            res = requests.get('http://localhost:3001/api/gpsiot/readings')
            readings = res.json()['readings']
            
            for item in readings:
                asset = item['asset']
                reading = item['latestReading']
                
                # Get prediction
                pred_res = requests.post(
                    'http://localhost:3001/api/gpsiot/predict-from-asset',
                    json={'assetId': asset['id']}
                )
                pred = pred_res.json()
                soh = pred['predictions']['ensemble_soh']
                
                # Check alert
                status = '✓' if soh >= alert_threshold else '⚠️'
                print(f"{status} {asset['name']:20} | SoH: {soh:.3f} | Temp: {reading['temperature']}°C")
                
                if soh < alert_threshold:
                    # Send alert (email, slack, etc.)
                    send_alert(asset['name'], soh, reading['temperature'])
        
        except Exception as e:
            print(f'Error: {e}')
        
        time.sleep(interval)

def send_alert(asset_name, soh, temp):
    print(f'\n🚨 ALERT: {asset_name} - SoH={soh:.2%} at {temp}°C')
    # Implement actual alert mechanism here

monitor_with_alerts()
```

---

## React Components

### 1. GPS IoT Status Card

```jsx
import { useEffect, useState } from 'react';

export function GPSIoTStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch('/api/gpsiot/status')
      .then(r => r.json())
      .then(setStatus);
  }, []);

  if (!status) return <div>Loading...</div>;

  return (
    <div className="card">
      <h3>GPS IoT Integration</h3>
      <p>Enabled: {status.status.enabled ? '✓' : '✗'}</p>
      <p>Connected: {status.status.connected ? '✓' : '✗'}</p>
      <p>Poll Interval: {status.status.pollInterval}ms</p>
    </div>
  );
}
```

### 2. Assets List Component

```jsx
import { useEffect, useState } from 'react';

export function AssetsList() {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    const fetchAssets = async () => {
      const res = await fetch('/api/gpsiot/assets');
      const data = await res.json();
      setAssets(data.assets || []);
    };

    fetchAssets();
    const interval = setInterval(fetchAssets, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="assets-list">
      <h3>Monitored Assets ({assets.length})</h3>
      <ul>
        {assets.map(asset => (
          <li key={asset.id}>
            <strong>{asset.name}</strong>
            <p>Client: {asset.client}</p>
            <p>IMEI: {asset.imei}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3. Real-time Readings Dashboard

```jsx
import { useEffect, useState } from 'react';

export function ReadingsDashboard() {
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    const fetchReadings = async () => {
      const res = await fetch('/api/gpsiot/readings');
      const data = await res.json();
      setReadings(data.readings || []);
    };

    fetchReadings();
    const interval = setInterval(fetchReadings, 5000); // 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="readings-dashboard">
      <h2>Real-Time Fleet Data</h2>
      <div className="grid">
        {readings.map(item => (
          <div key={item.asset.id} className="reading-card">
            <h4>{item.asset.name}</h4>
            {item.latestReading && (
              <>
                <div className="metric">
                  <span className="label">🌡️ Temperature:</span>
                  <span className="value">{item.latestReading.temperature}°C</span>
                </div>
                <div className="metric">
                  <span className="label">⚙️ Engine Load:</span>
                  <span className="value">{item.latestReading.engineLoad}%</span>
                </div>
                <div className="metric">
                  <span className="label">💨 Speed:</span>
                  <span className="value">{item.latestReading.vehicleSpeed} km/h</span>
                </div>
                <div className="metric">
                  <span className="label">🔧 RPM:</span>
                  <span className="value">{item.latestReading.rpm}</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. SoH Predictions Component

```jsx
import { useEffect, useState } from 'react';

export function SoHPredictions() {
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      const assetsRes = await fetch('/api/gpsiot/assets');
      const { assets } = await assetsRes.json();

      const newPredictions = {};
      for (const asset of assets) {
        const predRes = await fetch('/api/gpsiot/predict-from-asset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetId: asset.id })
        });
        const pred = await predRes.json();
        newPredictions[asset.id] = {
          name: asset.name,
          soh: pred.predictions.ensemble_soh,
          alert: pred.predictions.alert
        };
      }
      setPredictions(newPredictions);
      setLoading(false);
    };

    fetchPredictions();
    const interval = setInterval(fetchPredictions, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading predictions...</div>;

  return (
    <div className="predictions">
      <h2>Battery SoH Predictions</h2>
      <table>
        <thead>
          <tr>
            <th>Asset</th>
            <th>SoH</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(predictions).map(pred => (
            <tr key={pred.name} className={`alert-${pred.alert.toLowerCase()}`}>
              <td>{pred.name}</td>
              <td>{(pred.soh * 100).toFixed(1)}%</td>
              <td>{pred.alert}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5. Combined Integration Component

```jsx
import { useEffect, useState } from 'react';
import GPSIoTStatus from './GPSIoTStatus';
import AssetsList from './AssetsList';
import ReadingsDashboard from './ReadingsDashboard';
import SoHPredictions from './SoHPredictions';

export default function GPSIoTIntegration() {
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check server connectivity
    fetch('/api/gpsiot/status')
      .catch(() => setError('Cannot connect to GPS IoT API server'));
  }, []);

  if (error) {
    return <div className="error">❌ {error}</div>;
  }

  return (
    <div className="gpsiot-integration">
      <h1>🌐 GPS IoT Integration Dashboard</h1>
      
      <div className="grid">
        <div className="section">
          <GPSIoTStatus />
        </div>
        <div className="section">
          <AssetsList />
        </div>
      </div>

      <div className="section">
        <ReadingsDashboard />
      </div>

      <div className="section">
        <SoHPredictions />
      </div>
    </div>
  );
}
```

---

## Real-world Scenarios

### Scenario 1: Fleet Health Monitoring

Monitor an entire fleet and get alerts when any vehicle's battery is degrading:

```javascript
async function fleetHealthMonitor() {
  const CRITICAL_SOH = 0.75;
  
  while (true) {
    const predictions = await getPredictionsForAll();
    
    for (const [assetName, pred] of Object.entries(predictions)) {
      if (pred.soh < CRITICAL_SOH) {
        // Send alert to maintenance team
        sendSlackAlert(
          `🚨 ${assetName} battery needs maintenance\nSoH: ${pred.soh.toFixed(2)}%`
        );
        
        // Log to database
        await logPredictionToDatabase(assetName, pred);
      }
    }
    
    await sleep(60000); // Check every minute
  }
}
```

### Scenario 2: Predictive Maintenance Planning

Plan maintenance based on SoH trends:

```javascript
async function maintenancePlanning() {
  const predictions = await getPredictionsForAll();
  
  const maintenanceSchedule = Object.entries(predictions)
    .filter(([_, pred]) => pred.soh < 0.85)
    .sort((a, b) => a[1].soh - b[1].soh)
    .map(([name, pred]) => ({
      asset: name,
      soh: pred.soh,
      priority: pred.soh < 0.75 ? 'URGENT' : 'SOON',
      scheduledDate: calculateServiceDate(pred.soh)
    }));
  
  // Generate maintenance report
  return maintenanceSchedule;
}
```

### Scenario 3: Thermal Analysis

Correlate temperature with degradation:

```javascript
async function thermalAnalysis() {
  const readings = await fetch('/api/gpsiot/readings').then(r => r.json());
  
  const thermalData = readings.readings.map(item => ({
    asset: item.asset.name,
    temperature: item.latestReading.temperature,
    engineLoad: item.latestReading.engineLoad,
    degradationFactor: calculateDegradationFactor(
      item.latestReading.temperature
    )
  }));
  
  // Find high-risk thermal conditions
  return thermalData.filter(d => d.temperature > 50);
}
```

---

**These examples provide a complete foundation for integrating GPS IoT data into your battery prediction system!**
