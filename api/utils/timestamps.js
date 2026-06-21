// api/utils/timestamps.js
/**
 * Real-Time Timestamp and Standards Compliance Utilities
 * Handles ISO 8601 timestamps, timezone conversions, and time-series data
 */

const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/;

class TimestampManager {
  constructor() {
    this.startTime = Date.now();
    this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log(`⏰ Timestamp Manager initialized (Timezone: ${this.timezone})`);
  }

  /**
   * Get current ISO 8601 timestamp
   * @returns {string} ISO 8601 formatted timestamp
   */
  getCurrentTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Normalize any timestamp to ISO 8601
   * @param {Date|string|number} input - Timestamp in any format
   * @returns {string} ISO 8601 timestamp or error
   */
  normalizeTimestamp(input) {
    try {
      let date;
      
      if (input instanceof Date) {
        date = input;
      } else if (typeof input === 'string') {
        // Already ISO 8601?
        if (ISO_8601_REGEX.test(input)) {
          return input;
        }
        date = new Date(input);
      } else if (typeof input === 'number') {
        date = new Date(input);
      } else {
        throw new Error(`Invalid timestamp type: ${typeof input}`);
      }

      if (isNaN(date.getTime())) {
        throw new Error(`Invalid timestamp: ${input}`);
      }

      return date.toISOString();
    } catch (error) {
      console.error('Timestamp normalization error:', error.message);
      return new Date().toISOString(); // Fallback to now
    }
  }

  /**
   * Calculate time difference between two timestamps
   * @param {string} start - Start timestamp (ISO 8601)
   * @param {string} end - End timestamp (ISO 8601)
   * @returns {Object} Time difference metrics
   */
  calculateTimeDifference(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;

    return {
      milliseconds: diffMs,
      seconds: Math.round(diffMs / 1000),
      minutes: Math.round(diffMs / 60000),
      hours: Math.round(diffMs / 3600000),
      days: Math.round(diffMs / 86400000),
      formatted: this.formatDuration(diffMs)
    };
  }

  /**
   * Format milliseconds as human-readable duration
   * @param {number} ms - Milliseconds
   * @returns {string} Formatted duration (e.g., "2h 30m 45s")
   */
  formatDuration(ms) {
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
  }

  /**
   * Get uptime since server started
   * @returns {Object} Uptime in various units
   */
  getServerUptime() {
    const uptimeMs = Date.now() - this.startTime;
    return {
      uptime_ms: uptimeMs,
      uptime_seconds: Math.round(uptimeMs / 1000),
      uptime_formatted: this.formatDuration(uptimeMs),
      server_start: new Date(this.startTime).toISOString(),
      current_time: this.getCurrentTimestamp()
    };
  }

  /**
   * Batch normalize timestamps in array
   * @param {Array} records - Array of objects with timestamp field
   * @param {string} field - Field name containing timestamp
   * @returns {Array} Records with normalized timestamps
   */
  batchNormalizeTimestamps(records, field = 'timestamp') {
    return records.map(record => ({
      ...record,
      [field]: this.normalizeTimestamp(record[field] || record.datetime || Date.now())
    }));
  }

  /**
   * Create time-series bucket for analytics
   * @param {Array} records - Records to bucket
   * @param {string} interval - 'hour', 'day', 'week', 'month'
   * @returns {Object} Bucketed records by time interval
   */
  createTimeSeries(records, interval = 'hour', timestampField = 'timestamp') {
    const buckets = {};

    records.forEach(record => {
      const timestamp = new Date(record[timestampField]);
      let key;

      switch (interval) {
        case 'hour':
          key = timestamp.toISOString().slice(0, 13) + ':00:00Z';
          break;
        case 'day':
          key = timestamp.toISOString().slice(0, 10);
          break;
        case 'week':
          const weekStart = new Date(timestamp);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
        case 'month':
          key = timestamp.toISOString().slice(0, 7);
          break;
        default:
          key = timestamp.toISOString().slice(0, 10);
      }

      if (!buckets[key]) {
        buckets[key] = [];
      }
      buckets[key].push(record);
    });

    return buckets;
  }

  /**
   * Check if timestamp is within acceptable real-time window
   * @param {string} timestamp - ISO 8601 timestamp
   * @param {number} maxAgeSeconds - Maximum age in seconds
   * @returns {boolean} True if within window
   */
  isWithinRealTimeWindow(timestamp, maxAgeSeconds = 300) {
    const recordTime = new Date(timestamp).getTime();
    const now = Date.now();
    const ageSec = (now - recordTime) / 1000;

    return ageSec <= maxAgeSeconds && ageSec >= 0;
  }

  /**
   * Add timestamp metadata to API response
   * @param {Object} data - Response data
   * @returns {Object} Data with timestamp metadata
   */
  addResponseMetadata(data) {
    return {
      ...data,
      _meta: {
        timestamp: this.getCurrentTimestamp(),
        server_uptime: this.getServerUptime(),
        timezone: this.timezone,
        iso_8601_compliant: true,
        real_time: {
          enabled: true,
          polling_interval_ms: process.env.STREAMING_INTERVAL || 1000
        }
      }
    };
  }
}

module.exports = new TimestampManager();
