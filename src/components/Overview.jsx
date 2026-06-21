import React, { useEffect, useState } from 'react'
import { MODEL_COLORS, MODEL_ABBR, LineChart, ChartLegend } from './Charts.jsx'

const MODELS = ['PSO-LSTM', 'PSO-CNN', 'Improved PSO-SVR', 'XGB', 'GRU', 'RF', 'Phys-Informed PSO-LSTM-Attn']

export default function Overview({ battery }) {
  const [predictions, setPredictions] = useState([])
  const [metrics, setMetrics] = useState([])
  const [resistance, setResistance] = useState([])
  const [projections, setProjections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!battery) return
    setLoading(true)
    Promise.all([
      fetch(`/api/predictions?battery=${encodeURIComponent(battery)}`).then(r => r.json()),
      fetch('/api/metrics').then(r => r.json()),
      fetch('/api/resistance').then(r => r.json()),
    ]).then(([pred, met, res]) => {
      if (pred.ok) setPredictions(pred.data)
      if (met.ok) setMetrics(met.data)
      if (res.ok) setResistance(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [battery])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" />
    </div>
  )

  // KPI values
  const lastRow = predictions[predictions.length - 1] || {}
  const firstRow = predictions[0] || {}
  const lastSoH = parseFloat(lastRow['Improved PSO-SVR'] || lastRow['PSO-LSTM'] || 0)
  const firstSoH = parseFloat(firstRow['SoH_actual'] || 1)
  const degradation = ((firstSoH - lastSoH) * 100).toFixed(2)
  const totalCycles = predictions.length
  const batRes = resistance.find(r => r.battery_name === battery) || {}
  const rintGrowth = batRes.R_int_growth_percent ? parseFloat(batRes.R_int_growth_percent).toFixed(1) : 'N/A'
  const bestModel = metrics.length ? metrics[0].Model : 'N/A'
  const bestR2 = metrics.length ? (parseFloat(metrics[0].R2) * 100).toFixed(2) : 'N/A'

  // Calculate 12-month projections
  const getMonthlyProjections = () => {
    const now = new Date()
    const currentCycles = totalCycles
    const avgCyclesPerDay = totalCycles > 0 ? 1.25 : 0
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const degradationPerCycle = 0.00015
    const projections = []

    for (let i = 0; i < 6; i++) {
      const projDate = new Date(now)
      projDate.setMonth(projDate.getMonth() + i)
      const daysUntil = Math.ceil((projDate - now) / (1000 * 60 * 60 * 24))
      const projectedCycles = Math.round(currentCycles + (avgCyclesPerDay * Math.max(0, daysUntil)))
      const projectedSoH = Math.max(0, 100 - (projectedCycles * degradationPerCycle * 100))
      
      let health = '✅ Healthy'
      if (projectedSoH < 40) health = '🔴 Critical'
      else if (projectedSoH < 65) health = '⚠️ Degraded'
      else if (projectedSoH < 80) health = '🟡 Caution'

      projections.push({
        month: months[projDate.getMonth()],
        year: projDate.getFullYear(),
        cycles: projectedCycles,
        soh: projectedSoH.toFixed(2),
        health: health
      })
    }
    return projections
  }

  const monthlyProj = getMonthlyProjections()

  const alertLevel = lastSoH < 0.8 ? 'CRITICAL' : lastSoH < 0.85 ? 'WARNING' : 'NOMINAL'
  const alertClass = alertLevel === 'CRITICAL' ? 'badge-danger' : alertLevel === 'WARNING' ? 'badge-warn' : 'badge-ok'

  // Quick SoH chart - actual + best model
  const sohSeries = [
    {
      key: 'SoH_actual', label: 'Actual SoH',
      color: MODEL_COLORS['SoH_actual'],
      data: predictions.map(r => ({ x: r.cycle, y: parseFloat(r.SoH_actual) })).filter(p => !isNaN(p.y))
    },
    {
      key: 'Improved PSO-SVR', label: 'Best Model (PSO-SVR★)',
      color: MODEL_COLORS['Improved PSO-SVR'],
      data: predictions.map(r => ({ x: r.cycle, y: parseFloat(r['Improved PSO-SVR']) })).filter(p => !isNaN(p.y))
    }
  ]

  return (
    <div>
      {/* KPI row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Current SoH', value: (lastSoH * 100).toFixed(2) + '%', color: lastSoH > 0.85 ? 'var(--ok)' : lastSoH > 0.8 ? 'var(--warn)' : 'var(--danger)', sub: alertLevel },
          { label: 'Total Cycles', value: totalCycles, color: 'var(--accent)', sub: 'analyzed' },
          { label: 'SoH Degradation', value: degradation + '%', color: 'var(--accent2)', sub: 'from initial' },
          { label: 'Rint Growth', value: rintGrowth + '%', color: 'var(--accent5)', sub: 'internal resistance' },
        ].map((kpi, i) => (
          <div key={i} className="card">
            <div className="stat-label">{kpi.label}</div>
            <div className="stat-value" style={{ color: kpi.color, marginTop: 8 }}>{kpi.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Monthly Cycle Projections */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">📈 12-Month Cycle Projections</span>
          <span className="badge badge-info">ISO 12405-4</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Month', 'Projected Cycles', 'Projected SoH %', 'Health Status'].map(h => (
                  <th key={h} style={{
                    padding: '8px 12px', textAlign: 'left', fontSize: 9,
                    color: 'var(--text-muted)', letterSpacing: '0.12em',
                    textTransform: 'uppercase', borderBottom: '1px solid var(--border)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyProj.map((proj, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {proj.month} {proj.year}
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--accent)' }}>
                    {proj.cycles} cycles
                  </td>
                  <td style={{ 
                    padding: '8px 12px',
                    color: parseFloat(proj.soh) > 80 ? 'var(--ok)' : parseFloat(proj.soh) > 65 ? 'var(--warn)' : 'var(--danger)'
                  }}>
                    {proj.soh}%
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {proj.health}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          📋 Degradation rate: 0.015% per cycle | Based on average cycles/day: 1.25 cycles
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* SoH preview chart */}
        <div className="card" style={{ gridColumn: '1 / 2' }}>
          <div className="card-header">
            <span className="card-title">SoH vs Cycles — {battery}</span>
            <span className={`badge ${alertClass}`}>{alertLevel}</span>
          </div>
          <LineChart series={sohSeries} xLabel="Cycle" yLabel="SoH" height={260} yMin={0.94} />
          <ChartLegend series={sohSeries} />
        </div>

        {/* Model leaderboard */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Model Leaderboard</span>
            <span className="badge badge-info">R² Ranked</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {metrics.map((m, i) => {
              const r2 = parseFloat(m.R2)
              const pct = (r2 * 100).toFixed(2)
              const color = MODEL_COLORS[m.Model] || '#888'
              return (
                <div key={m.Model} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, width: 16 }}>#{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color, fontWeight: 700 }}>
                        {MODEL_ABBR[m.Model] || m.Model}
                        {i === 0 && ' ★'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-primary)' }}>R²={pct}%</span>
                    </div>
                    <div style={{
                      height: 4, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%', width: `${Math.max(0, r2) * 100}%`,
                        background: color, borderRadius: 2,
                        transition: 'width 0.8s ease'
                      }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', width: 58 }}>
                    RMSE {parseFloat(m.RMSE).toFixed(5)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Battery summary table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Models — Last Cycle Predictions for {battery}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Model', 'Last SoH Pred', 'vs Actual', 'RMSE', 'MAE', 'R²', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '8px 12px', textAlign: 'left', fontSize: 9,
                    color: 'var(--text-muted)', letterSpacing: '0.12em',
                    textTransform: 'uppercase', borderBottom: '1px solid var(--border)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODELS.map(model => {
                const m = metrics.find(x => x.Model === model)
                const lastPred = parseFloat(lastRow[model])
                const actual = parseFloat(lastRow.SoH_actual)
                const diff = lastPred && actual ? ((lastPred - actual) * 100).toFixed(4) : 'N/A'
                const color = MODEL_COLORS[model]
                const r2 = m ? parseFloat(m.R2) : 0
                return (
                  <tr key={model} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                        <span style={{ color, fontWeight: 700 }}>{MODEL_ABBR[model]}</span>
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>
                      {isNaN(lastPred) ? '—' : (lastPred * 100).toFixed(4) + '%'}
                    </td>
                    <td style={{ padding: '8px 12px', color: Math.abs(parseFloat(diff)) < 0.01 ? 'var(--ok)' : 'var(--warn)' }}>
                      {diff === 'N/A' ? '—' : `${diff}%`}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                      {m ? parseFloat(m.RMSE).toFixed(6) : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                      {m ? parseFloat(m.MAE).toFixed(6) : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', color: r2 > 0.95 ? 'var(--ok)' : r2 > 0.8 ? 'var(--warn)' : 'var(--danger)' }}>
                      {m ? (r2 * 100).toFixed(2) + '%' : '—'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className={`badge ${r2 > 0.95 ? 'badge-ok' : r2 > 0.8 ? 'badge-warn' : 'badge-danger'}`}>
                        {r2 > 0.95 ? 'EXCELLENT' : r2 > 0.8 ? 'GOOD' : 'POOR'}
                      </span>
                    </td>
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
