# GPS IoT Integration - Setup Checklist

## 📋 Pre-Setup Requirements

- [ ] GPS IoT API credentials from support (Web API Key & Secret)
- [ ] Node.js and npm installed
- [ ] Project dependencies installed (`npm install`)
- [ ] Internet connection (to reach https://api.gpsiot.net)

---

## 🚀 Step 1: Configuration (5 minutes)

### 1.1 Create .env file

- [ ] Navigate to `soh-dashboard/` directory
- [ ] Create `.env` file in root
- [ ] Copy from `.env.example` or create new:

```env
GPSIOT_API_KEY=YOUR_WEB_API_KEY
GPSIOT_API_SECRET=YOUR_WEB_SECRET_KEY
GPSIOT_ENABLED=true
GPSIOT_POLL_INTERVAL=5000
NODE_ENV=development
```

### 1.2 Add Your Credentials

- [ ] Replace `YOUR_WEB_API_KEY` with actual API key
- [ ] Replace `YOUR_WEB_SECRET_KEY` with actual secret
- [ ] Save `.env` file
- [ ] **DO NOT** commit `.env` to version control

### 1.3 Verify Configuration

- [ ] Check `.env` file contents: `cat .env`
- [ ] Verify no typos in credentials
- [ ] Confirm `GPSIOT_ENABLED=true`

---

## 🔧 Step 2: Installation & Startup (5 minutes)

### 2.1 Install Dependencies

- [ ] Run: `npm install`
- [ ] Wait for completion
- [ ] Verify no errors

### 2.2 Start the Server

- [ ] Run: `npm run start`
- [ ] Wait for server to start
- [ ] Look for output:
  ```
  🔋 SoH API Server running at http://localhost:3001
  ⚡ Starting GPS IoT monitoring...
  ✓ GPS IoT monitoring started
  ```

- [ ] Server is running if no errors displayed
- [ ] Keep terminal open (don't close)

---

## ✅ Step 3: Test Integration (5 minutes)

### 3.1 Run Automated Tests

Open a **NEW** terminal window:

- [ ] Run: `node api/test-gpsiot.js`
- [ ] All tests should show ✓ (green)
- [ ] Check for any ✗ (red) - troubleshoot if found

### 3.2 Manual Endpoint Tests

Using curl or Postman:

#### 3.2.1 Check Status

```bash
curl http://localhost:3001/api/gpsiot/status
```

- [ ] Response contains `"ok": true`
- [ ] Status shows `"connected": true`

#### 3.2.2 Get Assets

```bash
curl http://localhost:3001/api/gpsiot/assets
```

- [ ] Response contains `"ok": true`
- [ ] Check `"count"` is > 0
- [ ] List shows your assets

#### 3.2.3 Get Readings

```bash
curl http://localhost:3001/api/gpsiot/readings
```

- [ ] Response contains `"ok": true`
- [ ] Check `"count"` > 0
- [ ] Latest readings are present

#### 3.2.4 Get Predictions

```bash
curl -X POST http://localhost:3001/api/gpsiot/predict-from-asset \
  -H "Content-Type: application/json" \
  -d '{"assetId": "ASSET-001"}'
```

- [ ] Response contains `"ok": true`
- [ ] Contains `ensemble_soh` value
- [ ] Contains alert status

---

## 🎯 Step 4: Verify Data Quality (5 minutes)

### 4.1 Check Data Updates

- [ ] Run reading test multiple times with 10s delay
- [ ] Timestamp should change
- [ ] Temperature values should be realistic (20-60°C)
- [ ] Engine load should be 0-100%

### 4.2 Validate Asset Count

- [ ] Assets count should match GPS IoT account
- [ ] Each asset has Name, Client, Reseller
- [ ] IMEI values are populated

### 4.3 Confirm Predictions

- [ ] SoH values are 0.5-1.0
- [ ] Alert status is one of: HEALTHY, DEGRADED, END_OF_LIFE
- [ ] Temperature data maps correctly

---

## 🌐 Step 5: Dashboard Integration (Optional, 10 minutes)

### 5.1 Add GPS IoT Component

- [ ] Create `src/components/GPSIoTDashboard.jsx`
- [ ] Copy component from `GPSIOT_EXAMPLES.md`
- [ ] Save the file

### 5.2 Import in App.jsx

- [ ] Open `src/App.jsx`
- [ ] Add import: `import GPSIoTDashboard from './components/GPSIoTDashboard'`
- [ ] Add component to JSX: `<GPSIoTDashboard />`
- [ ] Save file

### 5.3 Test Frontend

- [ ] Run: `npm run dev`
- [ ] Open http://localhost:5173
- [ ] Look for GPS IoT component
- [ ] Check if data displays correctly

---

## 🐛 Troubleshooting Checklist

### Issue: Server won't start

- [ ] Check Node.js version: `node --version` (need v14+)
- [ ] Check if port 3001 is available: `lsof -i :3001`
- [ ] Check for syntax errors in `.env`
- [ ] Check for missing dependencies: `npm install`
- [ ] Check server logs for error messages

### Issue: Connection refused

- [ ] Verify server is running: `npm run start`
- [ ] Check if port 3001 is correct
- [ ] Check firewall settings
- [ ] Verify localhost is accessible

### Issue: "Invalid credentials" error

- [ ] Verify API key format (no spaces)
- [ ] Verify API secret format (no spaces)
- [ ] Contact GPS IoT support to confirm credentials
- [ ] Check credentials are correct in `.env`
- [ ] Restart server after updating `.env`

### Issue: No assets returned

- [ ] Verify account has assets assigned
- [ ] Check with GPS IoT support
- [ ] Verify monitoring is active
- [ ] Check server logs for auth errors

### Issue: Stale or old readings

- [ ] Check `GPSIOT_POLL_INTERVAL` in `.env`
- [ ] Reduce interval (e.g., from 5000 to 3000ms)
- [ ] Restart server to apply changes
- [ ] Wait 1-2 poll cycles for new data

### Issue: High memory usage

- [ ] Check number of assets being monitored
- [ ] Check if old processes are still running
- [ ] Reduce polling interval to reduce overhead
- [ ] Restart server: stop and `npm run start` again

---

## 📊 Performance Baseline

After setup, check these baseline metrics:

- [ ] Response time to `/api/gpsiot/status`: < 50ms
- [ ] Response time to `/api/gpsiot/assets`: < 200ms
- [ ] Response time to `/api/gpsiot/readings`: < 500ms
- [ ] Response time to `/api/gpsiot/predict-from-asset`: < 1000ms
- [ ] Server memory usage: < 100MB
- [ ] CPU usage when idle: < 5%

---

## 🔒 Security Verification

- [ ] `.env` file is NOT committed to git
- [ ] `.gitignore` includes `.env`
- [ ] Credentials are not in any code files
- [ ] No credentials in console.log() statements
- [ ] HTTPS is used for external APIs (auto-enforced by GPS IoT)

---

## 📚 Documentation Review

After setup, review:

- [ ] Read `GPSIOT_QUICK_START.md` (5 min read)
- [ ] Review `GPSIOT_INTEGRATION_GUIDE.md` (reference)
- [ ] Check `GPSIOT_EXAMPLES.md` for patterns (reference)
- [ ] Understand `GPSIOT_IMPLEMENTATION_SUMMARY.md` (overview)

---

## 🎓 Learning Path

### Day 1 - Setup
- [ ] Configure credentials
- [ ] Start server
- [ ] Run tests
- [ ] Verify data flow

### Day 2 - Integration
- [ ] Review API endpoints
- [ ] Test manual predictions
- [ ] Add to dashboard
- [ ] Check prediction accuracy

### Day 3+ - Optimization
- [ ] Adjust polling interval
- [ ] Monitor performance
- [ ] Set up alerts
- [ ] Historical analysis

---

## 📈 Next Milestones

### Week 1
- [ ] Core integration working
- [ ] All endpoints responding
- [ ] Dashboard displaying data
- [ ] Predictions generating

### Week 2
- [ ] Historical data collection
- [ ] Prediction accuracy validated
- [ ] Alerts configured
- [ ] Performance optimized

### Week 3+
- [ ] Advanced analytics
- [ ] Maintenance planning
- [ ] Multi-user support
- [ ] Production deployment

---

## 🆘 Getting Help

### For Setup Issues
1. Check `GPSIOT_QUICK_START.md`
2. Review "Troubleshooting" section above
3. Check server logs: Look at terminal running `npm run start`
4. Run test suite: `node api/test-gpsiot.js`

### For API Issues
1. Check `GPSIOT_INTEGRATION_GUIDE.md`
2. Review API response in troubleshooting
3. Contact GPS IoT support

### For Integration Questions
1. Review examples in `GPSIOT_EXAMPLES.md`
2. Check React component patterns
3. Adapt examples for your use case

---

## ✨ Success Criteria

Your integration is **COMPLETE** when:

- [x] ✅ `.env` file configured with real credentials
- [x] ✅ Server starts without errors: `npm run start`
- [x] ✅ All tests pass: `node api/test-gpsiot.js`
- [x] ✅ Assets are discovered and listed
- [x] ✅ Real-time readings are updating
- [x] ✅ SoH predictions are generating
- [x] ✅ Alert status is showing correctly
- [x] ✅ Dashboard component is displaying data (optional)

---

## 📞 Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run start` | Start server with GPS IoT monitoring |
| `npm run dev` | Start with dashboard (separate terminal) |
| `node api/test-gpsiot.js` | Run integration tests |
| `curl http://localhost:3001/api/gpsiot/status` | Check status |
| `npm run build` | Build production bundle |

---

## 📅 Maintenance Schedule

- [ ] **Daily:** Monitor server logs
- [ ] **Weekly:** Check API usage and costs
- [ ] **Monthly:** Review prediction accuracy
- [ ] **Quarterly:** Update API keys and refresh credentials
- [ ] **Annually:** Review and optimize architecture

---

**Congratulations! 🎉 Your GPS IoT integration is now active and ready to predict battery degradation from real vehicle telemetry!**

For questions, refer to the documentation files or contact GPS IoT support.
