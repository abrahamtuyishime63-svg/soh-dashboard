import React, { useEffect, useState } from 'react'
import { MODEL_COLORS, MODEL_ABBR, BarChart } from './Charts.jsx'

export default function ModelMetrics() {
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/metrics').then(r => r.json()).then(d => {
      if (d.ok) setMetrics(d.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" />
    </div>
  )

  const colorFn = (d) => MODEL_COLORS[d.Model] || '#888'

  return (
    <div>
      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">RMSE by Model (lower = better)</span>
          </div>
          <BarChart
            data={metrics}
            valueKey="RMSE"
            labelKey="Model"
            colorFn={colorFn}
            height={220}
            yLabel="RMSE"
          />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">R² Score by Model (higher = better)</span>
          </div>
          <BarChart
            data={[...metrics].sort((a, b) => parseFloat(b.R2) - parseFloat(a.R2))}
            valueKey="R2"
            labelKey="Model"
            colorFn={colorFn}
            height={220}
            yLabel="R²"
          />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">MAE by Model</span>
          </div>
          <BarChart
            data={metrics}
            valueKey="MAE"
            labelKey="Model"
            colorFn={colorFn}
            height={220}
            yLabel="MAE"
          />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">MAPE % by Model</span>
          </div>
          <BarChart
            data={metrics}
            valueKey="MAPE_%"
            labelKey="Model"
            colorFn={colorFn}
            height={220}
            yLabel="MAPE %"
          />
        </div>
      </div>

      {/* Full metrics table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Complete Model Comparison Table</span>
          <span className="badge badge-info">7 Models</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Rank', 'Model', 'RMSE', 'MSE', 'MAE', 'MAPE %', 'R²', 'Grade'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', fontSize: 9,
                    color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...metrics].sort((a, b) => parseFloat(b.R2) - parseFloat(a.R2)).map((m, i) => {
                const r2 = parseFloat(m.R2)
                const color = MODEL_COLORS[m.Model] || '#888'
                const grade = r2 > 0.99 ? 'A+' : r2 > 0.95 ? 'A' : r2 > 0.90 ? 'B' : r2 > 0.80 ? 'C' : 'D'
                const gradeColor = r2 > 0.99 ? 'var(--ok)' : r2 > 0.95 ? '#7aff7a' : r2 > 0.90 ? 'var(--accent4)' : r2 > 0.80 ? 'var(--warn)' : 'var(--danger)'
                return (
                  <tr key={m.Model} style={{
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.1s'
                  }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        <span style={{ color, fontWeight: 700, fontSize: 11 }}>
                          {m.Model}
                          {i === 0 && <span style={{ marginLeft: 6, fontSize: 9, opacity: 0.7 }}>★ BEST</span>}
                        </span>
                      </div>
                    </td>
                    {[m.RMSE, m.MSE, m.MAE, m['MAPE_%']].map((v, vi) => (
                      <td key={vi} style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                        {parseFloat(v).toExponential(3)}
                      </td>
                    ))}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: 'var(--bg-3)', borderRadius: 2 }}>
                          <div style={{ width: `${Math.max(0, r2) * 100}%`, height: '100%', background: color, borderRadius: 2 }} />
                        </div>
                        <span style={{ color: gradeColor, fontSize: 11, minWidth: 40 }}>{(r2 * 100).toFixed(2)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
                        color: gradeColor, textShadow: `0 0 10px ${gradeColor}66`
                      }}>{grade}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Insight */}
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'rgba(57,255,138,0.06)', border: '1px solid rgba(57,255,138,0.2)',
          borderRadius: 6, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7
        }}>
          <strong style={{ color: 'var(--ok)' }}>★ Best Model: Improved PSO-SVR</strong>
          {' '}achieves R²=99.95%, RMSE=0.0008 — the Particle Swarm Optimization significantly improves SVR hyperparameter tuning,
          making it the most accurate predictor across all 4 batteries.
          GRU shows the lowest performance (R²=50%), likely due to insufficient sequence length for recurrent learning.
        </div>
      </div>
    </div>
  )
}
