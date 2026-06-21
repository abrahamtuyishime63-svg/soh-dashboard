import React, { useState, useEffect, useRef } from 'react'
import { MODEL_COLORS, MODEL_ABBR, LineChart, ChartLegend } from './Charts.jsx'

const MODELS = ['PSO-LSTM', 'PSO-CNN', 'Improved PSO-SVR', 'XGB', 'GRU', 'RF', 'Phys-Informed PSO-LSTM-Attn']

const CLOUD_COLUMNS = ['datetime', 'ntct1', 'ntct2', 'ntct3', 'fc', 'dc', 'rc', 'soc', 'curr', 'ev', 'tv', 'hem']

const DEFAULT_CLOUD_FORM = {
  datetime: '16 Aug 2025 11:12:32',
  ntct1: 24.4,
  ntct2: 21.2,
  ntct3: 20.5,
  fc: 3584,
  dc: 17,
  rc: 1893,
  soc: 56,
  curr: 0,
  ev: 71030,
  tv: 76830,
  hem: 'SJV1.1BAK45A2505-0073'
}

export default function LivePredict({ battery, batteries }) {
  const [streamData, setStreamData] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [selectedBat, setSelectedBat] = useState(battery || '')
  const [form, setForm] = useState(DEFAULT_CLOUD_FORM)
  const [apiResult, setApiResult] = useState(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [csvFile, setCsvFile] = useState(null)
  const [csvResults, setCsvResults] = useState([])
  const [csvLoading, setCsvLoading] = useState(false)
  const [autoPredictEnabled, setAutoPredictEnabled] = useState(true)
  const [streamPredictions, setStreamPredictions] = useState([])
  const [autoPredictLoading, setAutoPredictLoading] = useState(false)
  const esRef = useRef(null)

  // Sync battery prop → hem field
  useEffect(() => {
    if (battery) {
      setSelectedBat(battery)
      setForm(prev => ({ ...prev, hem: battery }))
    }
  }, [battery])

  const startStream = () => {
    if (esRef.current) esRef.current.close()
    // Use hem from form as battery identifier
    const batteryId = form.hem || selectedBat
    const es = new EventSource(`/api/stream?battery=${encodeURIComponent(batteryId)}`)
    esRef.current = es
    setStreaming(true)
    setStreamData([])
    setStreamPredictions([])

    es.onmessage = (e) => {
      const row = JSON.parse(e.data)
      setStreamData(prev => [...prev.slice(-80), row]) // keep last 80 points

      // Auto-predict when auto-predict is enabled
      if (autoPredictEnabled && !autoPredictLoading) {
        performStreamPredict(row, batteryId)
      }
    }
    es.onerror = () => { es.close(); setStreaming(false) }
  }

  const performStreamPredict = async (streamRow, battery) => {
    try {
      // Only predict if we have valid SOC data
      const soc = streamRow.soc != null ? parseInt(streamRow.soc) : null
      if (soc === null || isNaN(soc)) {
        console.warn('Skipping prediction: No valid SOC data in stream')
        return
      }

      setAutoPredictLoading(true)
      
      // Build prediction payload with actual stream data
      // Only use values that are present in the stream, use defaults only as last resort
      const payload = {
        hem: battery,
        battery_name: battery,
        cycle: streamRow.cycle || 0,
        soc: soc, // CRITICAL: Use actual SOC from stream
        
        // Use stream data if available, otherwise skip (server will handle)
        fc: streamRow.fc != null ? parseFloat(streamRow.fc) : undefined,
        dc: streamRow.dc != null ? parseFloat(streamRow.dc) : undefined,
        rc: streamRow.rc != null ? parseFloat(streamRow.rc) : undefined,
        curr: streamRow.curr != null ? parseFloat(streamRow.curr) : 0,
        ev: streamRow.ev != null ? parseFloat(streamRow.ev) : undefined,
        tv: streamRow.tv != null ? parseFloat(streamRow.tv) : undefined,
        ntct1: streamRow.ntct1 != null ? parseFloat(streamRow.ntct1) : undefined,
        ntct2: streamRow.ntct2 != null ? parseFloat(streamRow.ntct2) : undefined,
        ntct3: streamRow.ntct3 != null ? parseFloat(streamRow.ntct3) : undefined,
        
        datetime: new Date().toISOString()
      }

      const resp = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await resp.json()
      if (data.ok) {
        setStreamPredictions(prev => [...prev.slice(-80), data])
      }
    } catch (e) {
      console.error('Auto-predict error:', e)
    } finally {
      setAutoPredictLoading(false)
    }
  }

  const stopStream = () => {
    esRef.current?.close()
    setStreaming(false)
    setAutoPredictLoading(false)
  }

  useEffect(() => () => {
    esRef.current?.close()
    setAutoPredictLoading(false)
  }, [])

  // Manual POST predict
  const handlePredict = async () => {
    setApiLoading(true)
    try {
      const resp = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, hem: form.hem || selectedBat })
      })
      const data = await resp.json()
      setApiResult(data)
    } catch (e) {
      setApiResult({ ok: false, error: e.message })
    }
    setApiLoading(false)
  }

  // CSV batch predict
  const handleCSV = async () => {
    if (!csvFile) return
    setCsvLoading(true)
    const text = await csvFile.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1).map(l => {
      const vals = l.split(',')
      const obj = {}
      headers.forEach((h, i) => { obj[h] = vals[i]?.trim() })
      obj.battery_name = obj.battery_name || selectedBat
      return obj
    })

    const results = []
    for (const [i, row] of rows.slice(0, 50).entries()) {
      try {
        const resp = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...row, _row_index: i })
        })
        const data = await resp.json()
        results.push({ ...row, ...data })
      } catch {}
    }
    setCsvResults(results)
    setCsvLoading(false)
  }

  // Build series from stream
  const streamSeries = MODELS.map(m => ({
    key: m, label: MODEL_ABBR[m], color: MODEL_COLORS[m],
    data: streamData.map(r => ({ x: r.cycle, y: parseFloat(r[m]) })).filter(p => !isNaN(p.y))
  }))

  const alertColor = apiResult?.alert === 'CRITICAL' ? 'var(--danger)' :
                     apiResult?.alert === 'WARNING' ? 'var(--warn)' : 'var(--ok)'

  return (
    <>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        {/* SSE Live stream panel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Live SSE Stream</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {streaming && <span className="badge badge-live">● LIVE</span>}
              <span className="badge badge-info">{streamData.length} pts</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
            <select 
              value={selectedBat} 
              onChange={e => {
                setSelectedBat(e.target.value)
                setForm(prev => ({ ...prev, hem: e.target.value }))
              }} 
              style={{ flex: 1 }}
            >
              {batteries.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            {!streaming
              ? <button className="btn btn-primary" onClick={startStream}>▶ Start</button>
              : <button className="btn btn-danger btn-sm" onClick={stopStream}>■ Stop</button>
            }
          </div>

          {streaming && (
            <div style={{
              padding: '8px 10px',
              background: 'rgba(0, 255, 100, 0.1)',
              border: '1px solid rgba(0, 255, 100, 0.3)',
              borderRadius: 6,
              marginBottom: 12,
              fontSize: 9,
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--ok)' }}>Streaming Battery (HEM)</div>
              <div style={{ fontFamily: 'monospace', fontSize: 8, marginTop: 4, color: 'var(--accent)' }}>{form.hem}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', padding: '8px 10px', background: 'var(--bg-2)', borderRadius: 6 }}>
            <input
              type="checkbox"
              id="autoPredictToggle"
              checked={autoPredictEnabled}
              onChange={e => setAutoPredictEnabled(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="autoPredictToggle" style={{ cursor: 'pointer', fontSize: 11, flex: 1, margin: 0 }}>
              🤖 Auto-Predict on Stream
            </label>
            {autoPredictLoading && <span className="badge badge-info">⟳ Predicting</span>}
          </div>

          <div style={{
            padding: '10px 12px',
            background: 'rgba(150, 150, 255, 0.08)',
            border: '1px solid rgba(150, 150, 255, 0.2)',
            borderRadius: 6,
            marginBottom: 12,
            fontSize: 9,
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>⚡ SOC-Based Predictions</div>
            <div>System predicts <strong>ONLY</strong> using actual SOC data from BMS telemetry.</div>
            <div>All voltage calculations use the SOC-to-Voltage mapping table (20S LFP pack).</div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 4 }}>Valid SOC range: 0-100%</div>
          </div>
          <div style={{
            padding: '10px 14px',
            background: 'rgba(0,212,255,0.05)',
            border: '1px solid var(--border)',
            borderRadius: 6, marginBottom: 12,
            fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.7
          }}>
            Connects to <code style={{ color: 'var(--accent)' }}>GET /api/stream?battery=…</code> via Server-Sent Events.
            New cycle predictions are pushed every 2 seconds, simulating real-time BMS sensor data ingestion.
            In production, replace the SSE source with your actual BMS/IoT endpoint.
          </div>

          {streamData.length > 0 && (
            <>
              <LineChart series={streamSeries} xLabel="CYCLE" yLabel="SoH" height={260} />
              <ChartLegend series={streamSeries} />
              {/* Latest values */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12 }}>
                {MODELS.map(m => {
                  const last = streamData[streamData.length - 1]
                  const v = parseFloat(last?.[m])
                  return (
                    <div key={m} style={{ padding: '6px 8px', background: 'var(--bg-2)', borderRadius: 4,
                      border: `1px solid ${MODEL_COLORS[m]}33` }}>
                      <div style={{ fontSize: 8, color: MODEL_COLORS[m], letterSpacing: '0.06em', marginBottom: 2 }}>
                        {MODEL_ABBR[m]}
                      </div>
                      <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {isNaN(v) ? '—' : (v * 100).toFixed(3) + '%'}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Auto-predict results */}
              {streamPredictions.length > 0 && (
                <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ok)', marginBottom: 8, textTransform: 'uppercase' }}>
                    🤖 Auto-Predicted Results
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {MODELS.map(m => {
                      const latest = streamPredictions[streamPredictions.length - 1]
                      const v = latest?.predictions?.[m]
                      return (
                        <div key={m} style={{
                          padding: '6px 10px', background: 'var(--bg-2)', borderRadius: 4,
                          border: `1px solid ${MODEL_COLORS[m]}33`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <span style={{ fontSize: 8, color: MODEL_COLORS[m] }}>{MODEL_ABBR[m]}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                            {v != null ? (v * 100).toFixed(3) + '%' : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {streamPredictions.length > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 9, color: 'var(--text-muted)' }}>
                      <div>Ensemble SoH: <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ok)' }}>
                        {streamPredictions[streamPredictions.length - 1]?.ensemble_soh != null 
                          ? (streamPredictions[streamPredictions.length - 1].ensemble_soh * 100).toFixed(3) + '%' 
                          : '—'}
                      </span></div>
                      <div>Alert: <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--warn)' }}>
                        {streamPredictions[streamPredictions.length - 1]?.alert || '—'}
                      </span></div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!streaming && !streamData.length && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 11 }}>
              Press ▶ Start to begin streaming live predictions
            </div>
          )}
        </div>

        {/* Manual API predict — cloud BMS columns */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cloud BMS Predict</span>
            <code style={{ fontSize: 9, color: 'var(--accent)' }}>POST /api/predict</code>
          </div>

          <div style={{
            padding: '10px 14px', marginBottom: 12,
            background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.25)',
            borderRadius: 6, fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.7
          }}>
            <div style={{ fontWeight: 700, color: 'var(--ok)', marginBottom: 6 }}>⚡ SOC-Only Predictions</div>
            <div style={{ marginBottom: 6 }}>
              <strong style={{ color: 'var(--ok)' }}>SOC (State of Charge) is REQUIRED</strong> for all predictions.
            </div>
            <div style={{ marginBottom: 6 }}>
              Uses your <strong style={{ color: 'var(--ok)' }}>cloud columns</strong>:{' '}
              <code style={{ color: 'var(--accent)', fontSize: 9 }}>
                {CLOUD_COLUMNS.join(', ')}
              </code>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              System predicts ONLY using actual SOC from BMS. All voltage calculations use the SOC-to-Voltage mapping table (20S LFP: 100%-4187mV to 10%-3193mV).
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
                HEM — BATTERY IDENTIFIER (from API)
              </label>
              <input
                type="text"
                value={form.hem}
                onChange={e => {
                  setForm(prev => ({ ...prev, hem: e.target.value }))
                  setSelectedBat(e.target.value)
                }}
                placeholder="Battery ID from API"
              />
            </div>

            <div>
              <label style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
                DATETIME
              </label>
              <input
                type="text"
                value={form.datetime}
                onChange={e => setForm(prev => ({ ...prev, datetime: e.target.value }))}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {['ntct1', 'ntct2', 'ntct3'].map(key => (
                <div key={key}>
                  <label style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                    {key.toUpperCase()} (°C)
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={form[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  FC (MAH)
                </label>
                <input type="number" value={form.fc} step={1}
                  onChange={e => setForm(prev => ({ ...prev, fc: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  DC
                </label>
                <input type="number" value={form.dc} step={1}
                  onChange={e => setForm(prev => ({ ...prev, dc: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  RC (MAH)
                </label>
                <input type="number" value={form.rc} step={1}
                  onChange={e => setForm(prev => ({ ...prev, rc: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  SOC (%)
                </label>
                <input type="number" value={form.soc} min={0} max={100}
                  onChange={e => setForm(prev => ({ ...prev, soc: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div>
                <label style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  CURR (A)
                </label>
                <input type="number" value={form.curr} step={0.1}
                  onChange={e => setForm(prev => ({ ...prev, curr: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
                  EV (MV)
                </label>
                <input type="number" value={form.ev} step={1}
                  onChange={e => setForm(prev => ({ ...prev, ev: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>
                TV — TOTAL VOLTAGE (MV)
              </label>
              <input
                type="number"
                value={form.tv}
                step={1}
                onChange={e => setForm(prev => ({ ...prev, tv: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handlePredict}
              disabled={apiLoading}
              style={{ marginTop: 4 }}
            >
              {apiLoading ? '⟳ Predicting…' : '⚡ Run Cloud Prediction'}
            </button>
          </div>

          {apiResult && apiResult.ok && (
            <div>
              {/* Electrical Characteristics */}
              <div style={{
                padding: '12px 14px',
                marginBottom: 10,
                background: 'rgba(0, 200, 200, 0.05)',
                border: '1px solid rgba(0, 200, 200, 0.2)',
                borderRadius: 6
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#00c8c8', marginBottom: 8, textTransform: 'uppercase' }}>
                  ⚡ Electrical Characteristics
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                  <div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      SoH = Fc / Rated Capacity
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                       {apiResult.cloud?.fc != null ? apiResult.cloud.fc.toFixed(0) + ' / ' + (apiResult.rated_capacity || 4500) : '—'} mAh
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ok)' }}>
                      {apiResult.soh_actual != null ? (apiResult.soh_actual * 100).toFixed(2) + '%' : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Temp (ntct1-3)</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent2)' }}>
                      {apiResult.temperature != null ? apiResult.temperature.toFixed(2) + ' °C' : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Voc = 20 × CellVoc (SOC {form.soc}%)
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {apiResult.voc != null ? apiResult.voc.toFixed(2) + ' V' : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Vt = Pack Terminal (tv / 1000)
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {apiResult.vt != null ? apiResult.vt.toFixed(2) + ' V' : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Rint = (Voc − Vt) / Current
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {apiResult.voc != null && apiResult.vt != null && apiResult.cloud?.curr != null
                        ? `(${apiResult.voc.toFixed(2)} − ${apiResult.vt.toFixed(2)}) / ${apiResult.cloud.curr} = `
                        : '—'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent4)' }}>
                      {apiResult.r_internal != null ? apiResult.r_internal.toFixed(4) + ' Ω' : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Remaining Capacity (rc)</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {apiResult.cloud?.rc != null ? apiResult.cloud.rc + ' mAh' : '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '10px 14px', marginBottom: 10,
                background: `${alertColor}18`, border: `1px solid ${alertColor}44`,
                borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: 11, color: alertColor, fontWeight: 700 }}>
                  {apiResult.alert}
                </span>
                <span style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 800, color: alertColor }}>
                  Ensemble SoH: {(apiResult.ensemble_soh * 100).toFixed(3)}%
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                {MODELS.map(m => {
                  const v = apiResult.predictions?.[m]
                  return (
                    <div key={m} style={{
                      padding: '6px 10px', background: 'var(--bg-2)', borderRadius: 4,
                      border: `1px solid ${MODEL_COLORS[m]}33`,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontSize: 8, color: MODEL_COLORS[m] }}>{MODEL_ABBR[m]}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                        {v != null ? (v * 100).toFixed(3) + '%' : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div style={{ padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 4, fontSize: 9, color: 'var(--text-muted)' }}>
                <div>Battery (hem): <span style={{ color: 'var(--accent)' }}>{apiResult.hem || apiResult.battery_name}</span></div>
                <div>Datetime: {apiResult.datetime || '—'} · Cycle: {apiResult.cycle}</div>
              </div>
            </div>
          )}

          {apiResult && !apiResult.ok && (
            <div style={{ padding: '10px 14px', background: 'rgba(255,59,59,0.1)', border: '1px solid var(--danger)', borderRadius: 6, color: 'var(--danger)', fontSize: 11 }}>
              Error: {apiResult.error}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        {/* CSV batch prediction — cloud format */}
        <div className="card-header">
          <span className="card-title">Cloud CSV Batch Prediction</span>
          <span className="badge badge-info">Up to 50 rows</span>
        </div>
        <div style={{
          padding: '12px 16px', background: 'rgba(0,255,136,0.04)',
          border: '1px solid rgba(0,255,136,0.2)', borderRadius: 6, marginBottom: 14,
          fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.8
        }}>
          Upload your cloud CSV with columns:{' '}
          <code style={{ color: 'var(--ok)', fontSize: 9 }}>{CLOUD_COLUMNS.join(', ')}</code>
          <br />
          Each row is sent to <code style={{ color: 'var(--accent)' }}>POST /api/predict</code> using your BMS field names directly.
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <input
            type="file"
            accept=".csv"
            onChange={e => setCsvFile(e.target.files[0])}
            style={{ flex: 1, padding: '6px', fontSize: 11 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleCSV}
            disabled={!csvFile || csvLoading}
          >
            {csvLoading ? '⟳ Processing…' : '⚡ Batch Predict'}
          </button>
        </div>

        {/* Sample CSV download */}
        <div style={{ marginBottom: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              try {
                const resp = await fetch('/api/cloud-sample')
                const { data } = await resp.json()
                const headers = CLOUD_COLUMNS.join(',')
                const rows = data.map(r => CLOUD_COLUMNS.map(c => r[c]).join(','))
                const csv = [headers, ...rows].join('\n')
                const a = document.createElement('a')
                a.href = 'data:text/csv,' + encodeURIComponent(csv)
                a.download = 'cloud_telemetry_sample.csv'
                a.click()
              } catch {
                const csv = `datetime,ntct1,ntct2,ntct3,fc,dc,rc,soc,curr,ev,tv,hem\n16 Aug 2025 11:12:32,24.4,21.2,20.5,3584,17,1893,56,0,71030,76830,SJV1.1BAK45A2505-0073`
                const a = document.createElement('a')
                a.href = 'data:text/csv,' + encodeURIComponent(csv)
                a.download = 'cloud_telemetry_sample.csv'
                a.click()
              }
            }}
          >
            ↓ Download Cloud Sample CSV
          </button>
        </div>

        {csvResults.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr>
                  {['Battery', 'Datetime', 'SOC', 'FC', 'TV', 'Ensemble SoH', 'Alert', ...MODELS.map(m => MODEL_ABBR[m])].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 8,
                      color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase',
                      borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvResults.map((r, i) => {
                  const alertC = r.alert === 'CRITICAL' ? 'var(--danger)' : r.alert === 'WARNING' ? 'var(--warn)' : 'var(--ok)'
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 8px', color: 'var(--accent)', fontSize: 9 }}>
                        {r.hem?.split('-').pop() || r.battery_name?.split('-').pop()}
                      </td>
                      <td style={{ padding: '6px 8px', fontSize: 9 }}>{r.datetime || '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{r.cloud?.soc ?? r.soc ?? '—'}%</td>
                      <td style={{ padding: '6px 8px' }}>{r.cloud?.fc ?? '—'}</td>
                      <td style={{ padding: '6px 8px' }}>{r.cloud?.tv ?? '—'}</td>
                      <td style={{ padding: '6px 8px', color: alertC, fontWeight: 700 }}>
                        {r.ensemble_soh ? (r.ensemble_soh * 100).toFixed(3) + '%' : '—'}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ color: alertC, fontSize: 9 }}>{r.alert || '—'}</span>
                      </td>
                      {MODELS.map(m => (
                        <td key={m} style={{ padding: '6px 8px', color: MODEL_COLORS[m] }}>
                          {r.predictions?.[m] ? (r.predictions[m] * 100).toFixed(3) + '%' : '—'}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
)
}
