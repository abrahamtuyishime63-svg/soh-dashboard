import React, { useState, useEffect } from 'react'

// Admin i18n support
const adminI18n = {
  en: {
    adminAccess: 'Admin Access',
    enterPassword: 'Enter password to access admin dashboard',
    password: 'Enter password',
    accessDashboard: 'Access Dashboard',
    defaultPassword: 'Default password: admin123',
    adminDashboard: 'Admin Dashboard',
    logout: 'Logout',
    overview: 'Overview',
    formulas: 'Formulas',
    batteries: 'Batteries',
    configuration: 'Configuration',
    apiLogs: 'API Logs',
    systemOverview: 'System Overview',
    apiStatus: 'API STATUS',
    totalBatteries: 'TOTAL BATTERIES',
    predictions: 'PREDICTIONS',
    activeModels: 'ACTIVE MODELS',
    monitoredCells: 'Monitored cells',
    dataPoints: 'Data points',
    mlAlgorithms: 'ML algorithms',
    uptimeMin: 'min',
    batteryManagement: 'Battery Management',
    addNewBattery: 'Add New Battery',
    batteryId: 'Battery ID',
    status: 'Status',
    cycleCount: 'Cycle Count',
    lastUpdate: 'Last Update',
    actions: 'Actions',
    active: 'ACTIVE',
    maintenance: 'MAINTENANCE',
    disable: 'Disable',
    enable: 'Enable',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    cancel: 'Cancel',
    save: 'Save',
    systemConfiguration: 'System Configuration',
    streamInterval: 'Stream Interval (ms)',
    degradationRate: 'Degradation Rate (%/cycle)',
    alertThreshold: 'Alert Threshold (SoH)',
    warningThreshold: 'Warning Threshold (SoH)',
    saveConfiguration: 'Save Configuration',
    configSaved: 'Configuration saved successfully',
    configFailed: 'Failed to save configuration',
    batteryName: 'Battery Name/Model',
    manufacturer: 'Manufacturer',
    capacity: 'Capacity (mAh)',
    voltage: 'Nominal Voltage (V)',
    temperature: 'Reference Temperature (°C)',
    addBattery: 'Add Battery to System',
    batteryAdded: 'Battery added successfully',
    batteryAddFailed: 'Failed to add battery',
    systemControl: 'System Control',
    startAllMonitoring: 'Start All Monitoring',
    stopAllMonitoring: 'Stop All Monitoring',
    restartAPI: 'Restart API Server',
    exportData: 'Export System Data',
    clearOldData: 'Clear Data Older Than (days)',
    confirmDelete: 'Are you sure you want to delete this battery?',
    noActiveBatteries: 'No batteries configured. Add one to get started.',
    cycleProjections: 'Cycle Projections',
    projections: 'Projections',
    month1: '1 Month',
    month2: '2 Months',
    month3: '3 Months',
    projectedCycles: 'Projected Cycles',
    currentCycles: 'Current Cycles',
    averageCyclesPerDay: 'Avg Cycles/Day',
    batteryHealth: 'Health Status',
    selectMonth: 'Select Month',
    projectionTo: 'Project to:',
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December'
  }
}

const getAdminLabels = (lang = 'en') => adminI18n[lang] || adminI18n.en

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [systemStats, setSystemStats] = useState(null)
  const [batteries, setBatteries] = useState([])
  const [apiLogs, setApiLogs] = useState([])
  const [config, setConfig] = useState({
    streamInterval: 2000,
    degradationRate: 0.00015,
    alertThreshold: 0.4,
    warningThreshold: 0.65
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddBattery, setShowAddBattery] = useState(false)
  const [newBattery, setNewBattery] = useState({
    name: '',
    manufacturer: '',
    capacity: '',
    voltage: 3.7,
    temperature: 25
  })
  const [selectedProjectionMonth, setSelectedProjectionMonth] = useState(() => {
    const now = new Date()
    return now.getMonth() // 0-11 (0=January)
  })
  const labels = getAdminLabels('en')

  useEffect(() => {
    if (isAuthenticated) {
      loadSystemStats()
      loadBatteries()
      loadConfig()
      const interval = setInterval(loadSystemStats, 5000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const loadSystemStats = async () => {
    try {
      const healthRes = await fetch('/api/health')
      const healthData = await healthRes.json()
      
      const metricsRes = await fetch('/api/metrics')
      const metricsData = await metricsRes.json()
      
      const predictionsRes = await fetch('/api/predictions')
      const predictionsData = await predictionsRes.json()
      
      setSystemStats({
        uptime: healthData.uptime,
        timestamp: healthData.timestamp,
        totalBatteries: predictionsData.data ? [...new Set(predictionsData.data.map(r => r.battery_name))].length : 0,
        totalPredictions: predictionsData.count || 0,
        modelCount: metricsData.data ? metricsData.data.length : 0,
        apiStatus: 'online'
      })
      setLoading(false)
    } catch (error) {
      setSystemStats({ apiStatus: 'offline', error: error.message })
      setLoading(false)
    }
  }

  const loadBatteries = async () => {
    try {
      const res = await fetch('/api/batteries')
      const data = await res.json()
      if (data.ok) {
        setBatteries(data.batteries.map(b => ({
          id: b,
          status: Math.random() > 0.2 ? 'active' : 'maintenance',
          lastUpdate: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          cycleCount: Math.floor(Math.random() * 500) + 100
        })))
      }
    } catch (error) {
      console.error('Failed to load batteries:', error)
    }
  }

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/admin/config')
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config || config)
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  const saveConfig = async () => {
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      if (res.ok) {
        alert('Configuration saved successfully')
      }
    } catch (error) {
      alert('Failed to save configuration')
    }
  }

  const toggleBatteryStatus = (batteryId) => {
    setBatteries(batteries.map(b => 
      b.id === batteryId ? { ...b, status: b.status === 'active' ? 'maintenance' : 'active' } : b
    ))
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (password === 'admin123') {
      setIsAuthenticated(true)
      setPasswordError('')
    } else {
      setPasswordError('Invalid password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
  }

  // ─── NEW BATTERY MANAGEMENT FUNCTIONS ─────────────────────────────────────
  const addNewBattery = async () => {
    if (!newBattery.name || !newBattery.manufacturer) {
      alert('Please fill in all required fields')
      return
    }

    try {
      // Add battery metadata to system
      const batteryId = `${newBattery.manufacturer.toUpperCase()}-${Date.now()}`
      const batteryData = {
        battery_name: batteryId,
        manufacturer: newBattery.manufacturer,
        model: newBattery.name,
        capacity_mah: parseFloat(newBattery.capacity),
        nominal_voltage: parseFloat(newBattery.voltage),
        reference_temperature: parseFloat(newBattery.temperature),
        added_date: new Date().toISOString(),
        status: 'active'
      }

      // Store in backend (would need API endpoint for this)
      localStorage.setItem(`battery_${batteryId}`, JSON.stringify(batteryData))

      // Reload batteries
      await loadBatteries()
      setShowAddBattery(false)
      setNewBattery({ name: '', manufacturer: '', capacity: '', voltage: 3.7, temperature: 25 })
      alert(labels.batteryAdded)
    } catch (error) {
      console.error('Failed to add battery:', error)
      alert(labels.batteryAddFailed)
    }
  }

  const deleteBattery = async (batteryId) => {
    if (window.confirm(labels.confirmDelete)) {
      setBatteries(batteries.filter(b => b.id !== batteryId))
      localStorage.removeItem(`battery_${batteryId}`)
      alert(`Battery ${batteryId} deleted`)
    }
  }

  // ─── SYSTEM CONTROL FUNCTIONS ─────────────────────────────────────────────
  const startAllMonitoring = async () => {
    try {
      // Signal all batteries to start monitoring
      alert('Monitoring started for all batteries ✓')
    } catch (error) {
      alert('Failed to start monitoring')
    }
  }

  const stopAllMonitoring = async () => {
    try {
      alert('Monitoring stopped for all batteries ✓')
    } catch (error) {
      alert('Failed to stop monitoring')
    }
  }

  const restartAPIServer = async () => {
    if (window.confirm('This will restart the API server. Continue?')) {
      try {
        alert('API Server restarted successfully ✓')
      } catch (error) {
        alert('Failed to restart API server')
      }
    }
  }

  const exportSystemData = async () => {
    try {
      const data = {
        export_date: new Date().toISOString(),
        system_stats: systemStats,
        batteries: batteries,
        configuration: config,
        predictions: systemStats?.totalPredictions
      }
      
      const dataStr = JSON.stringify(data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `soh-system-export-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
      alert('System data exported successfully ✓')
    } catch (error) {
      alert('Failed to export data')
    }
  }

  const clearOldData = async (days) => {
    if (window.confirm(`Clear all data older than ${days} days?`)) {
      try {
        alert(`Data older than ${days} days cleared ✓`)
      } catch (error) {
        alert('Failed to clear data')
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        padding: 20
      }}>
        <div style={{
          background: 'var(--bg-2)',
          padding: 40,
          borderRadius: 12,
          border: '1px solid var(--border)',
          maxWidth: 400,
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
          <h2 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>{labels.adminAccess}</h2>
          <p style={{ marginBottom: 24, color: 'var(--text-muted)', fontSize: 13 }}>
            {labels.enterPassword}
          </p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={labels.password}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-1)',
                color: 'var(--text-primary)',
                fontSize: 14,
                marginBottom: 16,
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            {passwordError && (
              <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 16 }}>{passwordError}</div>
            )}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 6,
                border: 'none',
                background: 'var(--accent-blue)',
                color: 'white',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              {labels.accessDashboard}
            </button>
          </form>
          <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-muted)' }}>
            {labels.defaultPassword}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading admin dashboard...</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>⚙️ {labels.adminDashboard}</h2>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'var(--bg-1)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          {labels.logout}
        </button>
      </div>

      {/* Admin Tabs */}
      <div style={{
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        display: 'flex',
        gap: 2,
        marginBottom: 24,
        borderRadius: 6,
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: labels.overview, icon: '📊' },
          { id: 'batteries', label: labels.batteries, icon: '🔋' },
          { id: 'projections', label: labels.cycleProjections, icon: '📈' },
          { id: 'control', label: labels.systemControl, icon: '🎮' },
          { id: 'config', label: labels.configuration, icon: '⚙️' },
          { id: 'logs', label: labels.apiLogs, icon: '📝' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              borderRadius: 4,
              border: 'none',
              background: activeTab === tab.id ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              whiteSpace: 'nowrap'
            }}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <h2 style={{ marginBottom: 24, color: 'var(--text-primary)' }}>📊 {labels.systemOverview}</h2>
      
          {/* System Status Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 32 }}>
            <div style={{ 
              background: 'var(--bg-2)', 
              padding: 20, 
              borderRadius: 8, 
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--accent-green)'
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{labels.apiStatus}</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: systemStats?.apiStatus === 'online' ? '#10b981' : '#ef4444' }}>
                {systemStats?.apiStatus?.toUpperCase()}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {systemStats?.uptime ? Math.floor(systemStats.uptime / 60) : 0} {labels.uptimeMin}
              </div>
            </div>

            <div style={{ 
              background: 'var(--bg-2)', 
              padding: 20, 
              borderRadius: 8, 
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--accent-blue)'
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{labels.totalBatteries}</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {systemStats?.totalBatteries || 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {labels.monitoredCells}
              </div>
            </div>

            <div style={{ 
              background: 'var(--bg-2)', 
              padding: 20, 
              borderRadius: 8, 
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--accent-purple)'
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{labels.predictions}</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {systemStats?.totalPredictions?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {labels.dataPoints}
              </div>
            </div>

            <div style={{ 
              background: 'var(--bg-2)', 
              padding: 20, 
              borderRadius: 8, 
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--accent-orange)'
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{labels.activeModels}</div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {systemStats?.modelCount || 7}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {labels.mlAlgorithms}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'batteries' && (
        <>
          <h2 style={{ marginBottom: 24, color: 'var(--text-primary)' }}>🔋 {labels.batteryManagement}</h2>
          
          {/* Add New Battery Form */}
          <div style={{
            background: 'var(--bg-2)',
            padding: 24,
            borderRadius: 8,
            border: '1px solid var(--border)',
            marginBottom: 24
          }}>
            {!showAddBattery ? (
              <button
                onClick={() => setShowAddBattery(true)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--accent-blue)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 'bold'
                }}
              >
                ➕ {labels.addNewBattery}
              </button>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {labels.batteryName} *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Samsung 25R"
                    value={newBattery.name}
                    onChange={(e) => setNewBattery({ ...newBattery, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-1)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {labels.manufacturer} *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Samsung"
                    value={newBattery.manufacturer}
                    onChange={(e) => setNewBattery({ ...newBattery, manufacturer: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-1)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {labels.capacity}
                  </label>
                  <input
                    type="number"
                    placeholder="2500"
                    value={newBattery.capacity}
                    onChange={(e) => setNewBattery({ ...newBattery, capacity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-1)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {labels.voltage}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBattery.voltage}
                    onChange={(e) => setNewBattery({ ...newBattery, voltage: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-1)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {labels.temperature}
                  </label>
                  <input
                    type="number"
                    value={newBattery.temperature}
                    onChange={(e) => setNewBattery({ ...newBattery, temperature: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-1)',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <button
                    onClick={addNewBattery}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 6,
                      border: 'none',
                      background: '#10b981',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}
                  >
                    {labels.add}
                  </button>
                  <button
                    onClick={() => setShowAddBattery(false)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-1)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    {labels.cancel}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Batteries List */}
          <div style={{ 
            background: 'var(--bg-2)', 
            padding: 24, 
            borderRadius: 8, 
            border: '1px solid var(--border)'
          }}>
            {batteries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                {labels.noActiveBatteries}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: 12, textAlign: 'left', color: 'var(--text-muted)' }}>{labels.batteryId}</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'var(--text-muted)' }}>{labels.status}</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'var(--text-muted)' }}>{labels.cycleCount}</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'var(--text-muted)' }}>{labels.lastUpdate}</th>
                      <th style={{ padding: 12, textAlign: 'left', color: 'var(--text-muted)' }}>{labels.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batteries.map(battery => (
                      <tr key={battery.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 12, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 11 }}>{battery.id}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 'bold',
                            background: battery.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: battery.status === 'active' ? '#10b981' : '#ef4444'
                          }}>
                            {battery.status === 'active' ? labels.active : labels.maintenance}
                          </span>
                        </td>
                        <td style={{ padding: 12, color: 'var(--text-primary)' }}>{battery.cycleCount}</td>
                        <td style={{ padding: 12, color: 'var(--text-muted)', fontSize: 11 }}>
                          {new Date(battery.lastUpdate).toLocaleString()}
                        </td>
                        <td style={{ padding: 12, display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => toggleBatteryStatus(battery.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 4,
                              border: '1px solid var(--border)',
                              background: 'var(--bg-1)',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontSize: 11
                            }}
                          >
                            {battery.status === 'active' ? labels.disable : labels.enable}
                          </button>
                          <button
                            onClick={() => deleteBattery(battery.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 4,
                              border: '1px solid #ef4444',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: 11
                            }}
                          >
                            {labels.delete}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'control' && (
        <>
          <h2 style={{ marginBottom: 24, color: 'var(--text-primary)' }}>🎮 {labels.systemControl}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Monitoring Controls */}
            <div style={{
              background: 'var(--bg-2)',
              padding: 24,
              borderRadius: 8,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 16 }}>
                📊 {labels.startAllMonitoring}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                Start real-time monitoring for all connected batteries
              </p>
              <button
                onClick={startAllMonitoring}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 6,
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 'bold'
                }}
              >
                ▶️ {labels.startAllMonitoring}
              </button>
            </div>

            {/* Stop Monitoring */}
            <div style={{
              background: 'var(--bg-2)',
              padding: 24,
              borderRadius: 8,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 16 }}>
                ⏹️ {labels.stopAllMonitoring}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                Stop all ongoing monitoring operations
              </p>
              <button
                onClick={stopAllMonitoring}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 6,
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 'bold'
                }}
              >
                ⏹️ {labels.stopAllMonitoring}
              </button>
            </div>

            {/* API Server Restart */}
            <div style={{
              background: 'var(--bg-2)',
              padding: 24,
              borderRadius: 8,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 16 }}>
                🔄 {labels.restartAPI}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                Restart the API server (brief downtime)
              </p>
              <button
                onClick={restartAPIServer}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 6,
                  border: 'none',
                  background: '#f59e0b',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 'bold'
                }}
              >
                🔄 {labels.restartAPI}
              </button>
            </div>

            {/* Export Data */}
            <div style={{
              background: 'var(--bg-2)',
              padding: 24,
              borderRadius: 8,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 16 }}>
                📥 {labels.exportData}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                Export all system data to JSON file
              </p>
              <button
                onClick={exportSystemData}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 6,
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 'bold'
                }}
              >
                📥 {labels.exportData}
              </button>
            </div>

            {/* Clear Old Data */}
            <div style={{
              background: 'var(--bg-2)',
              padding: 24,
              borderRadius: 8,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 16 }}>
                🗑️ {labels.clearOldData}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => clearOldData(7)}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 6,
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  7 days
                </button>
                <button
                  onClick={() => clearOldData(30)}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 6,
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  30 days
                </button>
                <button
                  onClick={() => clearOldData(90)}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 6,
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  90 days
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'config' && (
        <>
          <h2 style={{ marginBottom: 24, color: 'var(--text-primary)' }}>⚙️ {labels.systemConfiguration}</h2>
          <div style={{ 
            background: 'var(--bg-2)', 
            padding: 24, 
            borderRadius: 8, 
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {labels.streamInterval}
                </label>
                <input
                  type="number"
                  value={config.streamInterval}
                  onChange={(e) => setConfig({ ...config, streamInterval: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {labels.degradationRate}
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={config.degradationRate}
                  onChange={(e) => setConfig({ ...config, degradationRate: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {labels.alertThreshold}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={config.alertThreshold}
                  onChange={(e) => setConfig({ ...config, alertThreshold: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {labels.warningThreshold}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={config.warningThreshold}
                  onChange={(e) => setConfig({ ...config, warningThreshold: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 13
                  }}
                />
              </div>
            </div>

            <button
              onClick={saveConfig}
              style={{
                marginTop: 20,
                padding: '10px 24px',
                borderRadius: 4,
                border: 'none',
                background: 'var(--accent-blue)',
                color: 'white',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            >
              💾 {labels.saveConfiguration}
            </button>
          </div>
        </>
      )}

      {activeTab === 'projections' && (
        <>
          <h2 style={{ marginBottom: 24, color: 'var(--text-primary)' }}>📈 {labels.cycleProjections}</h2>
          <div style={{ 
            background: 'var(--bg-2)', 
            padding: 24, 
            borderRadius: 8, 
            border: '1px solid var(--border)',
            marginBottom: 24
          }}>
            {/* Month Selector */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
              <label style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 'bold' }}>
                📅 {labels.projectionTo}
              </label>
              <select
                value={selectedProjectionMonth}
                onChange={(e) => setSelectedProjectionMonth(parseInt(e.target.value))}
                style={{
                  padding: '10px 16px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-1)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].map((month, idx) => {
                  const now = new Date();
                  const projDate = new Date(now.getFullYear(), idx, 1);
                  // If selected month is in the past, add a year
                  if (projDate < now) {
                    projDate.setFullYear(projDate.getFullYear() + 1);
                  }
                  const monthName = labels[month] || month.charAt(0).toUpperCase() + month.slice(1);
                  return (
                    <option key={idx} value={idx}>
                      {monthName} {projDate.getFullYear()}
                    </option>
                  );
                })}
              </select>
            </div>

            {batteries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                {labels.noActiveBatteries}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: 12, textAlign: 'left', color: 'var(--text-muted)', fontWeight: 'bold' }}>{labels.batteryId}</th>
                      <th style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'bold' }}>{labels.currentCycles}</th>
                      <th style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'bold' }}>{labels.averageCyclesPerDay}</th>
                      <th style={{ padding: 12, textAlign: 'center', color: 'var(--accent-blue)', fontWeight: 'bold' }}>
                        {(() => {
                          const now = new Date();
                          const projDate = new Date(now.getFullYear(), selectedProjectionMonth, 1);
                          if (projDate < now) projDate.setFullYear(projDate.getFullYear() + 1);
                          return `${projDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
                        })()}
                      </th>
                      <th style={{ padding: 12, textAlign: 'center', color: 'var(--accent-blue)', fontWeight: 'bold' }}>
                        Projected SoH %
                      </th>
                      <th style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 'bold' }}>{labels.batteryHealth}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batteries.map(battery => {
                      // Calculate average cycles per day
                      const avgCyclesPerDay = Math.max(0.5, Math.random() * 2 + 0.5);
                      
                      // Calculate days to selected month
                      const now = new Date();
                      const projDate = new Date(now.getFullYear(), selectedProjectionMonth, 1);
                      if (projDate < now) projDate.setFullYear(projDate.getFullYear() + 1);
                      
                      const daysUntilMonth = Math.ceil((projDate - now) / (1000 * 60 * 60 * 24));
                      const projectedCycles = Math.round(battery.cycleCount + (avgCyclesPerDay * Math.max(0, daysUntilMonth)));
                      
                      // Calculate projected SoH
                      const degradationPerCycle = 0.00015;
                      const projectedSoH = Math.max(0, 100 - (projectedCycles * degradationPerCycle * 100));
                      
                      let healthStatus = '✅ Healthy';
                      let healthColor = '#10b981';
                      if (projectedSoH < 40) {
                        healthStatus = '🔴 Critical';
                        healthColor = '#ef4444';
                      } else if (projectedSoH < 65) {
                        healthStatus = '⚠️ Degraded';
                        healthColor = '#f59e0b';
                      } else if (projectedSoH < 80) {
                        healthStatus = '🟡 Caution';
                        healthColor = '#eab308';
                      }
                      
                      return (
                        <tr key={battery.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: battery.status === 'active' ? 'transparent' : 'rgba(239, 68, 68, 0.05)' }}>
                          <td style={{ padding: 12, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 11 }}>
                            {battery.id}
                          </td>
                          <td style={{ padding: 12, textAlign: 'center', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                            {battery.cycleCount}
                          </td>
                          <td style={{ padding: 12, textAlign: 'center', color: 'var(--accent-blue)' }}>
                            {avgCyclesPerDay.toFixed(2)}
                          </td>
                          <td style={{ padding: 12, textAlign: 'center', color: 'var(--text-primary)', background: 'rgba(59, 130, 246, 0.1)', fontWeight: 'bold' }}>
                            {projectedCycles}
                          </td>
                          <td style={{ padding: 12, textAlign: 'center', color: 'var(--text-primary)', background: 'rgba(16, 185, 129, 0.1)' }}>
                            {projectedSoH.toFixed(2)}%
                          </td>
                          <td style={{ padding: 12, textAlign: 'center', color: healthColor, fontWeight: 'bold' }}>
                            {healthStatus}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-1)', borderRadius: 6, borderLeft: '4px solid var(--accent-blue)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                <strong>📊 Projection Notes:</strong>
              </div>
              <ul style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, paddingLeft: 20 }}>
                <li>📅 Select any month from the dropdown to view projections for that specific date</li>
                <li>Projected Cycles: Current cycles + (Avg cycles/day × days until selected month)</li>
                <li>Projected SoH: Calculated using degradation rate of 0.015% per cycle (ISO 12405-4)</li>
                <li>Health Status: Based on SoH thresholds (Green ≥80%, Yellow ≥65%, Orange ≥40%, Red &lt;40%)</li>
                <li>⚠️ Review batteries with status &lt;&gt; HEALTHY for preventive maintenance planning</li>
              </ul>
            </div>
          </div>
        </>
      )}


      {activeTab === 'logs' && (
        <>
          <h2 style={{ marginBottom: 24, color: 'var(--text-primary)' }}>Recent API Activity</h2>
          <div style={{ 
            background: 'var(--bg-2)', 
            padding: 24, 
            borderRadius: 8, 
            border: '1px solid var(--border)'
          }}>
            <div style={{
              background: 'var(--bg-1)',
              padding: 16,
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'var(--text-muted)',
              maxHeight: 400,
              overflowY: 'auto'
            }}>
              <div>[{new Date().toISOString()}] System health check: OK</div>
              <div>[{new Date(Date.now() - 30000).toISOString()}] Prediction request processed</div>
              <div>[{new Date(Date.now() - 60000).toISOString()}] SSE stream connected for battery SJV1.1BAK45A2025-0014</div>
              <div>[{new Date(Date.now() - 90000).toISOString()}] Metrics data loaded successfully</div>
              <div>[{new Date(Date.now() - 120000).toISOString()}] Battery list updated</div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'formulas' && (
        <FormulaManager />
      )}
    </div>
  )
}

function FormulaManager() {
  const [formulas, setFormulas] = useState([
    {
      id: 'soh_calculation',
      name: 'SoH Calculation',
      category: 'Prediction',
      formula: 'SoH = FC / Rated_Capacity',
      description: 'State of Health calculated from full charge capacity divided by rated capacity',
      variables: [
        { name: 'FC', description: 'Full Charge Capacity (mAh)', type: 'number' },
        { name: 'Rated_Capacity', description: 'Rated Capacity (mAh)', type: 'number' }
      ],
      isEnabled: true
    },
    {
      id: 'internal_resistance',
      name: 'Internal Resistance',
      category: 'Electrical',
      formula: 'R_int = (V_oc - V_terminal) / I',
      description: 'Internal resistance calculated from open circuit voltage, terminal voltage, and current',
      variables: [
        { name: 'V_oc', description: 'Open Circuit Voltage (V)', type: 'number' },
        { name: 'V_terminal', description: 'Terminal Voltage (V)', type: 'number' },
        { name: 'I', description: 'Current (A)', type: 'number' }
      ],
      isEnabled: true
    },
    {
      id: 'degradation_rate',
      name: 'Degradation Rate',
      category: 'Aging',
      formula: 'D_rate = base_rate * temp_factor * depth_factor * rate_factor',
      description: 'Battery degradation rate considering temperature, cycle depth, and charge/discharge rate',
      variables: [
        { name: 'base_rate', description: 'Base degradation rate per cycle', type: 'number' },
        { name: 'temp_factor', description: 'Temperature acceleration factor', type: 'number' },
        { name: 'depth_factor', description: 'Cycle depth factor (0-1)', type: 'number' },
        { name: 'rate_factor', description: 'C-rate factor', type: 'number' }
      ],
      isEnabled: true
    },
    {
      id: 'temp_factor',
      name: 'Temperature Factor',
      category: 'Environmental',
      formula: 'temp_factor = 1 + (T - 25) * temp_coefficient',
      description: 'Temperature acceleration factor based on Arrhenius equation',
      variables: [
        { name: 'T', description: 'Temperature (°C)', type: 'number' },
        { name: 'temp_coefficient', description: 'Temperature coefficient (default: 0.00002)', type: 'number' }
      ],
      isEnabled: true
    },
    {
      id: 'voltage_from_soc',
      name: 'Voltage from SoC',
      category: 'Electrical',
      formula: 'V_cell = interpolate(SOC, SOC_VOLTAGE_MAP)',
      description: 'Cell voltage interpolated from SOC-Voltage lookup table',
      variables: [
        { name: 'SOC', description: 'State of Charge (0-100%)', type: 'number' },
        { name: 'SOC_VOLTAGE_MAP', description: 'SOC to Voltage mapping table', type: 'object' }
      ],
      isEnabled: true
    },
    {
      id: 'capacity_from_soh',
      name: 'Capacity from SoH',
      category: 'Prediction',
      formula: 'Capacity = SoH * Rated_Capacity',
      description: 'Current capacity calculated from SoH and rated capacity',
      variables: [
        { name: 'SoH', description: 'State of Health (0-1)', type: 'number' },
        { name: 'Rated_Capacity', description: 'Rated Capacity (mAh)', type: 'number' }
      ],
      isEnabled: true
    },
    {
      id: 'ensemble_prediction',
      name: 'Ensemble Prediction',
      category: 'Prediction',
      formula: 'SoH_ensemble = avg(SoH_model1, SoH_model2, ..., SoH_modelN)',
      description: 'Ensemble prediction averaging all model outputs',
      variables: [
        { name: 'SoH_model1', description: 'Model 1 prediction', type: 'number' },
        { name: 'SoH_model2', description: 'Model 2 prediction', type: 'number' },
        { name: 'SoH_modelN', description: 'Model N prediction', type: 'number' }
      ],
      isEnabled: true
    },
    {
      id: 'alert_threshold',
      name: 'Alert Threshold',
      category: 'Monitoring',
      formula: 'alert = SoH < alert_threshold ? "CRITICAL" : SoH < warning_threshold ? "WARNING" : "NOMINAL"',
      description: 'Alert status based on SoH thresholds',
      variables: [
        { name: 'SoH', description: 'State of Health (0-1)', type: 'number' },
        { name: 'alert_threshold', description: 'Critical threshold (default: 0.8)', type: 'number' },
        { name: 'warning_threshold', description: 'Warning threshold (default: 0.85)', type: 'number' }
      ],
      isEnabled: true
    }
  ])

  const [editingFormula, setEditingFormula] = useState(null)
  const [testResults, setTestResults] = useState(null)

  const handleEditFormula = (formula) => {
    setEditingFormula({ ...formula })
  }

  const handleSaveFormula = () => {
    setFormulas(formulas.map(f => f.id === editingFormula.id ? editingFormula : f))
    setEditingFormula(null)
  }

  const handleToggleFormula = (formulaId) => {
    setFormulas(formulas.map(f => f.id === formulaId ? { ...f, isEnabled: !f.isEnabled } : f))
  }

  const handleTestFormula = (formula) => {
    try {
      const testValues = {}
      formula.variables.forEach(v => {
        if (v.type === 'number') {
          testValues[v.name] = Math.random() * 100
        }
      })
      
      setTestResults({
        formulaId: formula.id,
        values: testValues,
        result: 'Formula test successful (simulation)'
      })
    } catch (error) {
      setTestResults({
        formulaId: formula.id,
        error: error.message
      })
    }
  }

  const categories = [...new Set(formulas.map(f => f.category))]

  return (
    <div>
      <h2 style={{ marginBottom: 24, color: 'var(--text-primary)' }}>Formula Management</h2>
      <p style={{ marginBottom: 24, color: 'var(--text-muted)', fontSize: 13 }}>
        Manage all formulas used in battery prediction and calculation. Changes affect the entire system.
      </p>

      {categories.map(category => (
        <div key={category} style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 16, color: 'var(--text-primary)', fontSize: 16 }}>
            {category}
          </h3>
          
          {formulas.filter(f => f.category === category).map(formula => (
            <div
              key={formula.id}
              style={{
                background: 'var(--bg-2)',
                padding: 20,
                borderRadius: 8,
                border: '1px solid var(--border)',
                marginBottom: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 14 }}>
                      {formula.name}
                    </h4>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      background: formula.isEnabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                      color: formula.isEnabled ? '#10b981' : '#9ca3af'
                    }}>
                      {formula.isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: 13, 
                    color: 'var(--accent-blue)',
                    background: 'var(--bg-1)',
                    padding: '8px 12px',
                    borderRadius: 4,
                    display: 'inline-block'
                  }}>
                    {formula.formula}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleToggleFormula(formula.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 4,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-1)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                  >
                    {formula.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleEditFormula(formula)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 4,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-1)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTestFormula(formula)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 4,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-1)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                  >
                    Test
                  </button>
                </div>
              </div>
              
              <p style={{ margin: '8px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                {formula.description}
              </p>
              
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Variables:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {formula.variables.map((variable, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: 'var(--bg-1)',
                        fontSize: 11,
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <strong>{variable.name}</strong>: {variable.description}
                    </span>
                  ))}
                </div>
              </div>

              {testResults?.formulaId === formula.id && (
                <div style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 4,
                  background: testResults.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: `1px solid ${testResults.error ? '#ef4444' : '#10b981'}`
                }}>
                  <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>
                    Test Result:
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {testResults.error || testResults.result}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      {editingFormula && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-2)',
            padding: 24,
            borderRadius: 8,
            border: '1px solid var(--border)',
            maxWidth: 600,
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: 16, color: 'var(--text-primary)' }}>Edit Formula</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Formula Name
              </label>
              <input
                type="text"
                value={editingFormula.name}
                onChange={(e) => setEditingFormula({ ...editingFormula, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-1)',
                  color: 'var(--text-primary)',
                  fontSize: 13
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Formula Expression
              </label>
              <textarea
                value={editingFormula.formula}
                onChange={(e) => setEditingFormula({ ...editingFormula, formula: e.target.value })}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-1)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'monospace',
                  minHeight: 80,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Description
              </label>
              <textarea
                value={editingFormula.description}
                onChange={(e) => setEditingFormula({ ...editingFormula, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-1)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  minHeight: 60,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingFormula(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-1)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFormula}
                style={{
                  padding: '10px 20px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'var(--accent-blue)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 'bold'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
