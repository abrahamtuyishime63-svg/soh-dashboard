/**
 * GPS IoT API Client
 * Handles authentication, asset management, and real-time CAN bus data fetching
 */

const API_BASE_URL = 'https://api.gpsiot.net';
const TOKEN_CACHE = {
  token: null,
  expiresAt: null,
};

/**
 * Get or refresh authentication token
 */
async function getAccessToken(apiKey, apiSecret) {
  const now = Date.now();
  
  // Return cached token if still valid (with 5 min buffer)
  if (TOKEN_CACHE.token && TOKEN_CACHE.expiresAt && now < (TOKEN_CACHE.expiresAt - 300000)) {
    return TOKEN_CACHE.token;
  }

  try {
    const params = new URLSearchParams();
    params.append('username', apiKey);
    params.append('password', apiSecret);
    params.append('grant_type', 'password');

    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Auth failed: ${error.error_description || 'Invalid credentials'}`);
    }

    const data = await response.json();
    TOKEN_CACHE.token = data.access_token;
    TOKEN_CACHE.expiresAt = now + (data.expires_in * 1000);

    console.log(`[GPS IoT] Token obtained, expires in ${data.expires_in}s`);
    return data.access_token;
  } catch (error) {
    console.error('[GPS IoT] Token fetch error:', error);
    throw error;
  }
}

/**
 * Fetch all assets from the API
 */
async function getResellerAssets(apiKey, apiSecret) {
  try {
    const token = await getAccessToken(apiKey, apiSecret);

    const response = await fetch(`${API_BASE_URL}/api/Asset/GetResellerAssets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to fetch assets: ${error.Message || 'Unknown error'}`);
    }

    const assets = await response.json();
    console.log(`[GPS IoT] Fetched ${assets.length} assets`);
    return assets;
  } catch (error) {
    console.error('[GPS IoT] Asset fetch error:', error);
    throw error;
  }
}

/**
 * Get current CAN bus data for an asset
 */
async function getCanBusData(assetId, apiKey, apiSecret) {
  try {
    const token = await getAccessToken(apiKey, apiSecret);

    const response = await fetch(`${API_BASE_URL}/api/Status/v2/GetCanBus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ AssetId: assetId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to fetch CAN bus data: ${error.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      assetId,
      timestamp: new Date().toISOString(),
      ...data,
    };
  } catch (error) {
    console.error(`[GPS IoT] CAN bus fetch error for asset ${assetId}:`, error);
    throw error;
  }
}

/**
 * Parse numeric values from CAN bus data
 * Handles strings like "988.7 l/h", "13°C", "0 %", etc.
 */
function parseCanBusValue(value) {
  if (typeof value !== 'string') return value;
  const num = parseFloat(value);
  return isNaN(num) ? value : num;
}

/**
 * Transform CAN bus data for battery prediction model
 * Maps vehicle metrics to battery degradation indicators
 */
function transformForPrediction(canBusData) {
  const parsed = {};
  
  // Parse all numeric values
  for (const [key, value] of Object.entries(canBusData)) {
    if (key === 'assetId' || key === 'timestamp') {
      parsed[key] = value;
    } else {
      parsed[key] = parseCanBusValue(value);
    }
  }

  // Extract battery-relevant metrics
  return {
    assetId: canBusData.assetId,
    timestamp: canBusData.timestamp,
    // Temperature correlation with battery degradation
    temperature: parsed.CTemp || null,
    // Engine load correlates with current draw
    engineLoad: parsed.EngLoad || null,
    // RPM indicates system activity level
    rpm: parsed.RPM || null,
    // Fuel consumption pattern affects charging cycles
    fuelRate: parsed.EngFuelRate || null,
    vehicleSpeed: parsed.Vehiclespeed || null,
    odometer: parsed.ObdOdometer || null,
    
    // Original values for reference
    rawData: parsed,
  };
}

/**
 * Continuous monitoring of a single asset
 */
async function monitorAsset(assetId, apiKey, apiSecret, interval = 5000) {
  const readings = [];
  
  async function fetchAndStore() {
    try {
      const canData = await getCanBusData(assetId, apiKey, apiSecret);
      const transformed = transformForPrediction(canData);
      readings.push(transformed);
      
      // Keep only last 100 readings
      if (readings.length > 100) {
        readings.shift();
      }
      
      console.log(`[GPS IoT] Asset ${assetId} - Temp: ${transformed.temperature}, Load: ${transformed.engineLoad}`);
      return transformed;
    } catch (error) {
      console.error(`[GPS IoT] Monitoring error for ${assetId}:`, error.message);
      return null;
    }
  }

  // Initial fetch
  const initial = await fetchAndStore();
  
  // Set up polling
  const intervalId = setInterval(fetchAndStore, interval);

  return {
    assetId,
    getLatestReading: () => readings[readings.length - 1] || null,
    getAllReadings: () => [...readings],
    stop: () => clearInterval(intervalId),
  };
}

/**
 * Monitor multiple assets with automatic retry
 */
async function monitorMultipleAssets(apiKey, apiSecret, interval = 5000) {
  const monitors = new Map();
  let lastAssetFetch = 0;
  const assetRefreshInterval = 60000; // Refresh asset list every minute

  async function updateAssets() {
    try {
      const now = Date.now();
      if (now - lastAssetFetch < assetRefreshInterval) {
        return;
      }

      const assets = await getResellerAssets(apiKey, apiSecret);
      
      // Start monitors for new assets
      for (const asset of assets) {
        if (!monitors.has(asset.AssetId)) {
          console.log(`[GPS IoT] Starting monitor for asset: ${asset.Name} (${asset.AssetId})`);
          const monitor = await monitorAsset(asset.AssetId, apiKey, apiSecret, interval);
          monitors.set(asset.AssetId, {
            asset,
            monitor,
            startedAt: new Date(),
          });
        }
      }

      lastAssetFetch = now;
    } catch (error) {
      console.error('[GPS IoT] Asset update error:', error.message);
    }
  }

  // Initial update
  await updateAssets();
  
  // Periodic updates
  const refreshIntervalId = setInterval(updateAssets, assetRefreshInterval);

  return {
    getAssetReadings: (assetId) => {
      const entry = monitors.get(assetId);
      return entry ? entry.monitor.getLatestReading() : null;
    },
    getAllReadings: () => {
      const allReadings = [];
      for (const [assetId, entry] of monitors) {
        allReadings.push({
          asset: entry.asset,
          latestReading: entry.monitor.getLatestReading(),
          allReadings: entry.monitor.getAllReadings(),
          startedAt: entry.startedAt,
        });
      }
      return allReadings;
    },
    getAssets: () => Array.from(monitors.values()).map(e => e.asset),
    stopAll: () => {
      for (const entry of monitors.values()) {
        entry.monitor.stop();
      }
      clearInterval(refreshIntervalId);
    },
  };
}

module.exports = {
  getAccessToken,
  getResellerAssets,
  getCanBusData,
  transformForPrediction,
  monitorAsset,
  monitorMultipleAssets,
};
