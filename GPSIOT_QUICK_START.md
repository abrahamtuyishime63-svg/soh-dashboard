# GPS IoT Integration - Quick Start

## ⚡ 5-Minute Setup

### 1. Add Your Credentials to `.env`

Open or create `soh-dashboard/.env`:

```env
GPSIOT_API_KEY=YOUR_WEB_API_KEY
GPSIOT_API_SECRET=YOUR_WEB_SECRET_KEY
GPSIOT_ENABLED=true
GPSIOT_POLL_INTERVAL=5000
```

### 2. Start the Server

```bash
npm run start
```

### 3. Test the Integration

```bash
# Check status
curl http://localhost:3001/api/gpsiot/status

# Get monitored assets
curl http://localhost:3001/api/gpsiot/assets

# Get real-time readings
curl http://localhost:3001/api/gpsiot/readings
```

---

## 📊 Real-Time Predictions

Get SoH predictions from vehicle data:

```bash
curl -X POST http://localhost:3001/api/gpsiot/predict-from-asset \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "YOUR_ASSET_ID",
    "cycle": 100
  }'
```

---

## 🔧 Manual Start/Stop

If auto-start doesn't work:

### Start Monitoring

```bash
curl -X POST http://localhost:3001/api/gpsiot/start \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "YOUR_WEB_API_KEY",
    "apiSecret": "YOUR_WEB_SECRET_KEY",
    "pollInterval": 5000
  }'
```

### Stop Monitoring

```bash
curl -X POST http://localhost:3001/api/gpsiot/stop
```

---

## 🎯 Dashboard Integration

To display GPS IoT data in your React dashboard, add this component:

```jsx
// src/components/GPSIoTData.jsx
import { useEffect, useState } from 'react';

export default function GPSIoTData() {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/gpsiot/readings');
        const data = await res.json();
        if (data.ok) {
          setReadings(data.readings);
        }
      } catch (err) {
        console.error('Failed to fetch GPS IoT data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading GPS IoT data...</div>;

  return (
    <div className="gpsiot-container">
      <h2>📍 GPS IoT Fleet Data</h2>
      {readings.map(item => (
        <div key={item.asset.id} className="asset-card">
          <h3>{item.asset.name}</h3>
          <p>🌡️ Temperature: {item.latestReading?.temperature}°C</p>
          <p>⚙️ Engine Load: {item.latestReading?.engineLoad}%</p>
          <p>💨 Speed: {item.latestReading?.vehicleSpeed} km/h</p>
          <p>🔧 RPM: {item.latestReading?.rpm}</p>
        </div>
      ))}
    </div>
  );
}
```

Then add to your App.jsx:

```jsx
import GPSIoTData from './components/GPSIoTData';

// In your JSX:
<GPSIoTData />
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Not active" | Run: `curl -X POST http://localhost:3001/api/gpsiot/start ...` |
| "Invalid credentials" | Check API key/secret with GPS IoT support |
| "No assets" | Verify assets are assigned to your account |
| Empty readings | Wait 5-10 seconds, check polling interval |

---

## 📚 Full Documentation

See [GPSIOT_INTEGRATION_GUIDE.md](./GPSIOT_INTEGRATION_GUIDE.md) for complete API reference and advanced configuration.

---

## 🚀 Next Steps

1. ✅ Credentials in `.env`
2. ✅ Run `npm run start`
3. ✅ Test endpoints with curl
4. ✅ Add component to dashboard
5. ✅ Monitor predictions in real-time

---

**Ready to predict!** Your system will now fetch real vehicle telemetry and generate battery SoH predictions automatically.
