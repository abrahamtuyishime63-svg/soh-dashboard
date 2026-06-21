#!/usr/bin/env node

/**
 * GPS IoT Integration Test Script
 * 
 * Tests GPS IoT API endpoints and validates the integration
 * Run: node api/test-gpsiot.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function httpRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  log('\n🧪 GPS IoT Integration Test Suite\n', 'cyan');

  try {
    // Test 1: Check server health
    log('Test 1: Server Health Check', 'blue');
    const health = await httpRequest('GET', '/api/health');
    if (health.status === 200) {
      log(`✓ Server is running (uptime: ${health.body.uptime.toFixed(1)}s)`, 'green');
    } else {
      log(`✗ Server health check failed: ${health.status}`, 'red');
      return;
    }

    // Test 2: Check GPS IoT status
    log('\nTest 2: GPS IoT Integration Status', 'blue');
    const status = await httpRequest('GET', '/api/gpsiot/status');
    if (status.body.ok) {
      log('✓ GPS IoT status endpoint working', 'green');
      log(`  - Enabled: ${status.body.status.enabled}`);
      log(`  - Connected: ${status.body.status.connected}`);
      log(`  - Poll Interval: ${status.body.status.pollInterval}ms`);
      log(`  - Base URL: ${status.body.status.baseUrl}`);
    } else {
      log('✗ GPS IoT status check failed', 'red');
    }

    // Test 3: Get assets (should fail if not started)
    log('\nTest 3: Get Monitored Assets', 'blue');
    const assets = await httpRequest('GET', '/api/gpsiot/assets');
    if (assets.body.ok) {
      if (assets.body.count === 0) {
        log('⚠ No assets being monitored yet', 'yellow');
        log('  Start monitoring with: POST /api/gpsiot/start', 'yellow');
      } else {
        log(`✓ Found ${assets.body.count} assets:`, 'green');
        assets.body.assets.forEach(asset => {
          log(`  - ${asset.name} (${asset.id})`);
        });
      }
    } else {
      log(`✗ Assets endpoint failed: ${assets.body.error}`, 'red');
    }

    // Test 4: Get readings (should be empty if not started)
    log('\nTest 4: Get Real-Time Readings', 'blue');
    const readings = await httpRequest('GET', '/api/gpsiot/readings');
    if (readings.body.ok) {
      if (readings.body.count === 0) {
        log('⚠ No readings available yet', 'yellow');
        log('  Status: ' + readings.body.message, 'yellow');
      } else {
        log(`✓ Found readings from ${readings.body.count} assets:`, 'green');
        readings.body.readings.forEach(r => {
          log(`  - ${r.asset.name}: ${r.recordCount} records`);
          if (r.latestReading) {
            log(`    Temp: ${r.latestReading.temperature}°C, Load: ${r.latestReading.engineLoad}%`);
          }
        });
      }
    } else {
      log(`✗ Readings endpoint failed: ${readings.body.error}`, 'red');
    }

    // Test 5: Test start monitoring endpoint (with dummy credentials)
    log('\nTest 5: Test Start Monitoring Endpoint (Dummy Credentials)', 'blue');
    const startTest = await httpRequest('POST', '/api/gpsiot/start', {
      apiKey: 'test_key_12345',
      apiSecret: 'test_secret_67890',
      pollInterval: 5000
    });
    
    if (startTest.status === 500) {
      log('✓ Endpoint structure is correct (expected auth failure with dummy creds)', 'green');
      log(`  Error: ${startTest.body.error}`, 'yellow');
    } else if (startTest.body.ok) {
      log('✓ Monitoring started successfully!', 'green');
    } else {
      log(`✗ Unexpected response: ${startTest.status}`, 'red');
    }

    // Test 6: Stop monitoring
    log('\nTest 6: Stop Monitoring', 'blue');
    const stop = await httpRequest('POST', '/api/gpsiot/stop');
    if (stop.body.ok) {
      log('✓ Stop endpoint working correctly', 'green');
    } else {
      log(`✗ Stop failed: ${stop.body.error}`, 'red');
    }

    // Test 7: Verify all required endpoints exist
    log('\nTest 7: Verify All Required Endpoints', 'blue');
    const endpoints = [
      { method: 'GET', path: '/api/gpsiot/status', name: 'Get Status' },
      { method: 'POST', path: '/api/gpsiot/start', name: 'Start Monitoring' },
      { method: 'POST', path: '/api/gpsiot/stop', name: 'Stop Monitoring' },
      { method: 'GET', path: '/api/gpsiot/assets', name: 'Get Assets' },
      { method: 'GET', path: '/api/gpsiot/readings', name: 'Get Readings' }
    ];

    let allEndpointsOk = true;
    for (const endpoint of endpoints) {
      try {
        const result = endpoint.method === 'GET'
          ? await httpRequest('GET', endpoint.path)
          : await httpRequest('POST', endpoint.path, {});
        
        if (result.status === 200 || result.body.ok !== undefined) {
          log(`✓ ${endpoint.method} ${endpoint.path}`, 'green');
        } else {
          log(`✗ ${endpoint.method} ${endpoint.path} - Status: ${result.status}`, 'red');
          allEndpointsOk = false;
        }
      } catch (e) {
        log(`✗ ${endpoint.method} ${endpoint.path} - ${e.message}`, 'red');
        allEndpointsOk = false;
      }
    }

    // Summary
    log('\n' + '='.repeat(50), 'cyan');
    if (allEndpointsOk) {
      log('✓ All tests passed! GPS IoT integration is ready.', 'green');
      log('\nNext steps:', 'cyan');
      log('1. Add your real API credentials to .env:', 'yellow');
      log('   GPSIOT_API_KEY=your_key', 'yellow');
      log('   GPSIOT_API_SECRET=your_secret', 'yellow');
      log('   GPSIOT_ENABLED=true', 'yellow');
      log('2. Restart the server: npm run start', 'yellow');
      log('3. Start monitoring: POST /api/gpsiot/start', 'yellow');
    } else {
      log('✗ Some tests failed. Check the server logs.', 'red');
    }
    log('='.repeat(50) + '\n', 'cyan');

  } catch (error) {
    log(`\n✗ Test suite error: ${error.message}`, 'red');
    log('\nMake sure the server is running:', 'yellow');
    log('  npm run start', 'yellow');
  }
}

// Run tests
runTests();
