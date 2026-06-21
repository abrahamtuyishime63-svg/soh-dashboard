import React, { useEffect, useState, useRef } from 'react'
import { MODEL_COLORS, MODEL_ABBR, LineChart, ChartLegend } from './Charts.jsx'

const MODELS = [
  { key: 'PSO-LSTM',                    label: 'PSO-LSTM',         color: '#00d4ff', alpha: 2.4, dash: '5,4' },
  { key: 'PSO-CNN',                     label: 'PSO-CNN',          color: '#ff6b35', alpha: 2.2, dash: '5,4' },
  { key: 'Improved PSO-SVR',            label: 'PSO-SVR ★ BEST',  color: '#39ff8a', alpha: 2.5, dash: 'none' },
  { key: 'XGB',                         label: 'XGB',             color: '#ffcc00', alpha: 2.3, dash: '5,4' },
  { key: 'GRU',                         label: 'GRU',             color: '#c084fc', alpha: 2.1, dash: '5,4' },
  { key: 'RF',                          label: 'RF',              color: '#fb7185', alpha: 2.6, dash: '5,4' },
  { key: 'Phys-Informed PSO-LSTM-Attn', label: 'PI-LSTM-Attn',   color: '#38bdf8', alpha: 2.45, dash: '5,4' },
]
const R_BASE = 0.050
const BEST_KEY = 'Improved PSO-SVR'

export default function ResistancePlots({ battery }) {
  const [predictions, setPredictions] = useState([])
  const [resistance, setResistance] = useState([])
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const esRef = useRef(null)
  const loadedFromCSV = useRef(false)

  useEffect(() => {
    if (!battery) return
    setLoading(true)
    setPredictions([])
    loadedFromCSV.current = false
    Promise.all([
      fetch(`/api/predictions?battery=${encodeURIComponent(battery)}`).then(r => r.json()),
      fetch('/api/resistance').then(r => r.json()),
    ]).then(([pred, res]) => {
      if (pred.ok && pred.data) {
        setPredictions(pred.data)
        loadedFromCSV.current = true
      }
      if (res.ok) setResistance(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [battery])

  useEffect(() => {
    if (!battery) return
    const startStream = () => {
      if (esRef.current) esRef.current.close()
      const es = new EventSource(`/api/stream?battery=${encodeURIComponent(battery)}`)
      esRef.current = es
      setStreaming(true)
      es.onmessage = (e) => {
        const row = JSON.parse(e.data)
        setPredictions(prev => {
          const lastC = prev.length ? prev[prev.length - 1].cycle : 0
          if (row.cycle <= lastC && loadedFromCSV.current) return prev
          return [...prev.slice(-600), row]
        })
      }
      es.onerror = () => { es.close(); setStreaming(false) }
    }
    const timer = setTimeout(startStream, 1000)
    return () => { clearTimeout(timer); esRef.current?.close(); setStreaming(false) }
  }, [battery])

  const batRes = resistance.find(r => r.battery_name === battery) || {}
  const rintSeriesAll = MODELS.map(m => ({
    key: m.key,
    label: m.label,
    color: m.color,
    dash: m.dash,
    data: predictions.map(r => {
      const soh = parseFloat(r[m.key] || r[BEST_KEY] || 0.95)
      return { x: r.cycle, y: R_BASE * (1 + m.alpha * (1 - soh)) * 1000 }
    }).filter(p => !isNaN(p.y))
  }))

  const tempSeries = predictions.map(r => {
    const soh = parseFloat(r[BEST_KEY] || 0.95)
    const rint = R_BASE * (1 + 2.5 * (1 - soh))
    const tempRise = 25 + (rint / R_BASE - 1) * 15
    return { x: r.cycle, y: tempRise }
  })

  const allRint = rintSeriesAll[2]?.data.map(p => p.y) || []
  const rintMin = allRint.length ? Math.min(...allRint) - 0.5 : 48
  const rintMax = allRint.length ? Math.max(...allRint) + 0.5 : 60
  const dataCount = predictions.length
  const lastRow = predictions[predictions.length - 1] || {}
  const formatRint = (v) => v.toFixed(1) + ' mΩ'

  if (loading && !predictions.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div>
      <div className="grid-4" style={{ marginBottom: 16 }}>
        {[
          { label: 'Rint Growth', value: batRes.R_int_growth_percent != null ? parseFloat(batRes.R_int_growth_percent).toFixed(2) + '%' : 'N/A', color: 'var(--accent2)' },
          { label: 'SoH Drop', value: batRes.SoH_drop_percent != null ? parseFloat(batRes.SoH_drop_percent).toFixed(3) + '%' : 'N/A', color: 'var(--danger)' },
          { label: 'Mean Temp Rise', value: batRes.mean_temp_rise_C != null ? parseFloat(batRes.mean_temp_rise_C).toFixed(2) + ' °C' : 'N/A', color: 'var(--accent4)' },
          { label: 'Stress→SoH Corr', value: batRes.corr_electrothermal_stress_vs_SoH != null ? parseFloat(batRes.corr_electrothermal_stress_vs_SoH).toFixed(4) : 'N/A', color: 'var(--accent5)' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: 14 }}>
            <div className="stat-label">{k.label}</div>
            <div className="stat-value" style={{ color: k.color, fontSize: 20, marginTop: 6 }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">Internal Resistance (Rint) vs Cycle — {battery}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-info">Rint = (Voc − Vt) / I  |  SoH = Fc / 4500</span>
            <span style={{ fontSize: 9, color: streaming ? 'var(--ok)' : 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700 }}>
              {streaming ? '● LIVE' : '○ PAUSED'}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--accent)' }}>Ohm's Law:</strong> Rint = (Voc − Vt) / Current, where <strong>Voc = 20 × CellVoc(SOC)</strong>.
          Baseline <strong>R₀ = 50 mΩ</strong> (20-cell 4500 mAh LFP at 100% SoH), degradation proxy: <strong>Rint = R₀ × (1 + α × (1 − SoH))</strong>.
        </div>
        <LineChart series={rintSeriesAll} xLabel="CYCLE NUMBER" yLabel="Rint (mΩ)" height={380} yMin={rintMin} yMax={rintMax} formatY={formatRint} />
        <ChartLegend series={rintSeriesAll} />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Estimated Temperature Rise — {battery}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
            Joule heating proxy: <strong style={{ color: 'var(--accent4)' }}>ΔT = 25 + (Rint/R₀ − 1) × 15 °C</strong>
          </div>
          <LineChart series={[{ key: 'temp', label: 'Temp Rise (°C)', color: '#ffcc00', data: tempSeries }]} xLabel="CYCLE" yLabel="°C" height={280} />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Electrothermal Correlations</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr>
                {['Battery', 'Load↔Temp', 'Load↔Rint', 'R↔Temp', 'Heat↔Temp', 'Stress↔SoH'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 8,
                    color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resistance.map((r, i) => {
                const name = r.battery_name?.split('-').pop() || r.battery_name
                const vals = [
                  r.pearson_r_load_vs_temp || r.corr_load_power_vs_temp,
                  r.corr_load_power_vs_Rint,
                  r.pearson_r_R_vs_temp_rise || r.corr_temp_rise_vs_Rint,
                  r.pearson_r_joule_heat_vs_temp_rise || r.corr_joule_heat_vs_temp_rise,
                  r.corr_electrothermal_stress_vs_SoH
                ]
                return (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--border)',
                    background: r.battery_name === battery ? 'rgba(0,212,255,0.06)' : 'transparent'
                  }}>
                    <td style={{ padding: '6px 8px', color: r.battery_name === battery ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 9, fontWeight: r.battery_name === battery ? 700 : 400 }}>
                      {name}{r.battery_name === battery ? ' ◄' : ''}
                    </td>
                    {vals.map((v, vi) => {
                      const f = parseFloat(v)
                      const c = f > 0.3 ? 'var(--ok)' : f < -0.3 ? 'var(--danger)' : 'var(--text-secondary)'
                      return <td key={vi} style={{ padding: '6px 8px', color: c }}>{isNaN(f) ? '—' : f.toFixed(3)}</td>
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
