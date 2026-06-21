import React, { useEffect, useState, useRef } from 'react'
import { MODEL_COLORS, MODEL_ABBR, LineChart, ChartLegend } from './Charts.jsx'

const MODELS = ['PSO-LSTM', 'PSO-CNN', 'Improved PSO-SVR', 'XGB', 'GRU', 'RF', 'Phys-Informed PSO-LSTM-Attn']
const BEST_MODEL = 'Improved PSO-SVR'

export default function SoHPlots({ battery }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(() => {
    const s = new Set(MODELS)
    s.add('SoH_actual')
    return s
  })
  const [cycleRange, setCycleRange] = useState([0, 500])
  const [streaming, setStreaming] = useState(false)
  const esRef = useRef(null)
  const loadedFromCSV = useRef(false)

  useEffect(() => {
    if (!battery) return
    setLoading(true)
    setData([])
    loadedFromCSV.current = false
    fetch(`/api/predictions?battery=${encodeURIComponent(battery)}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.data && d.data.length) {
          const rows = d.data.map(r => ({ ...r, _source: 'csv' }))
          setData(rows)
          const maxC = Math.max(...rows.map(r => r.cycle))
          setCycleRange([1, maxC])
          loadedFromCSV.current = true
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
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
        setData(prev => {
          const lastC = prev.length ? prev[prev.length - 1].cycle : 0
          if (row.cycle <= lastC && loadedFromCSV.current) return prev
          return [...prev.slice(-600), { ...row, _source: 'stream' }]
        })
      }
      es.onerror = () => { es.close(); setStreaming(false) }
    }

    const timer = setTimeout(startStream, 800)
    return () => {
      clearTimeout(timer)
      esRef.current?.close()
      setStreaming(false)
    }
  }, [battery])

  const filtered = data.filter(r => r.cycle >= cycleRange[0] && r.cycle <= cycleRange[1])

  const series = MODELS.filter(m => enabled.has(m)).map(m => {
    const isBest = m === BEST_MODEL
    return {
      key: m,
      label: isBest ? `${MODEL_ABBR[m]} ★ BEST` : MODEL_ABBR[m],
      color: MODEL_COLORS[m],
      dash: isBest ? 'none' : '6,4',
      data: filtered
        .map(r => ({ x: r.cycle, y: parseFloat(r[m]) }))
        .filter(p => !isNaN(p.y))
    }
  })

  const actualSeries = {
    key: 'SoH_actual',
    label: 'Actual SoH',
    color: '#ffffff',
    dash: 'none',
    data: filtered
      .map(r => ({ x: r.cycle, y: parseFloat(r.SoH_actual) }))
      .filter(p => !isNaN(p.y))
  }

  const allSeries = enabled.has('SoH_actual') && actualSeries.data.length
    ? [...series.filter(s => s.key !== 'SoH_actual'), actualSeries]
    : series

  const toggleModel = (m) => {
    setEnabled(prev => {
      const n = new Set(prev)
      if (m === 'SoH_actual') { n.has(m) ? n.delete(m) : n.add(m); return n }
      n.has(m) ? n.delete(m) : n.add(m)
      return n
    })
  }

  const allY = allSeries.flatMap(s => s.data.map(p => p.y))
  const yMin = allY.length ? Math.max(0.7, Math.min(...allY) - 0.01) : 0.7
  const yMax = allY.length ? Math.min(1.05, Math.max(...allY) + 0.01) : 1.05
  const dataCount = filtered.length
  const lastRow = filtered[filtered.length - 1] || {}

  const bestLast = BEST_MODEL && lastRow[BEST_MODEL] != null ? parseFloat(lastRow[BEST_MODEL]) : null
  const actualLast = lastRow.SoH_actual != null ? parseFloat(lastRow.SoH_actual) : null

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" />
    </div>
  )

  return (
    <div>
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700 }}>MODELS</span>
          {['SoH_actual', ...MODELS].map(m => {
            const isBest = m === BEST_MODEL
            const modelColor = m === 'SoH_actual' ? '#ffffff' : MODEL_COLORS[m]
            return (
              <button key={m} onClick={() => toggleModel(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 99,
                  border: `1.5px solid ${enabled.has(m) ? modelColor : 'var(--border)'}`,
                  background: enabled.has(m) ? `${modelColor}15` : 'transparent',
                  color: enabled.has(m) ? modelColor : 'var(--text-muted)',
                  fontSize: 9, fontFamily: 'var(--font-mono)',
                  fontWeight: isBest ? 800 : 600, letterSpacing: '0.06em', cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isBest && enabled.has(m) ? `0 0 12px ${modelColor}33` : 'none'
                }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: enabled.has(m) ? modelColor : 'var(--border)',
                  boxShadow: isBest && enabled.has(m) ? `0 0 6px ${modelColor}` : 'none'
                }} />
                {m === 'SoH_actual' ? 'ACTUAL' : (MODEL_ABBR[m] || m)}
                {isBest && <span style={{ fontSize: 8, opacity: 0.8 }}>★</span>}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: streaming ? 'var(--ok)' : 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700 }}>
            {streaming ? '● LIVE' : '○ OFFLINE'}
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            {dataCount} pts
          </span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">SoH vs Cycle — {battery}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-info">{filtered.length} cycles</span>
            {bestLast != null && (
              <span className="badge badge-ok" style={{ fontWeight: 700 }}>PSO-SVR★ {(bestLast * 100).toFixed(2)}%</span>
            )}
          </div>
        </div>
        <LineChart
          series={allSeries}
          xLabel="CYCLE NUMBER"
          yLabel="SoH (%)"
          height={420}
          yMin={yMin}
          yMax={yMax}
          formatY={(v) => (v * 100).toFixed(1) + '%'}
        />
        <ChartLegend series={allSeries} />
      </div>

      <div className="grid-3">
        {MODELS.filter(m => m !== 'SoH_actual').map(model => {
          const s = series.find(s => s.key === model)
          if (!s || !s.data.length) return null
          const vals = s.data.map(p => p.y)
          const min = Math.min(...vals)
          const max = Math.max(...vals)
          const last = vals[vals.length - 1]
          const first = vals[0]
          const change = ((last - first) * 100).toFixed(3)
          const isBest = model === BEST_MODEL
          const color = MODEL_COLORS[model]
          const actualVal = actualLast != null ? ((actualLast - last) * 100).toFixed(3) : null

          return (
            <div key={model} className="card" style={{
              padding: 14,
              border: isBest ? `1.5px solid ${color}55` : '1px solid var(--border)',
              background: isBest ? `${color}08` : 'var(--bg-1)',
              boxShadow: isBest ? `0 0 20px ${color}15` : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: color,
                  boxShadow: isBest ? `0 0 10px ${color}` : 'none'
                }} />
                <span style={{ fontSize: 10, color, fontWeight: isBest ? 800 : 600, letterSpacing: '0.06em' }}>
                  {MODEL_ABBR[model]}
                  {isBest && <span style={{ marginLeft: 6, fontSize: 9 }}>★</span>}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  ['Last SoH', (last * 100).toFixed(2) + '%', color],
                  ['Min', (min * 100).toFixed(2) + '%', 'var(--danger)'],
                  ['Max', (max * 100).toFixed(2) + '%', 'var(--ok)'],
                  ['Δ Total', change + '%', parseFloat(change) < 0 ? 'var(--danger)' : 'var(--ok)'],
                  ['vs Actual', actualVal != null ? actualVal + '%' : '—', actualVal != null ? (Math.abs(parseFloat(actualVal)) < 1 ? 'var(--ok)' : 'var(--warn)') : 'var(--text-muted)'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</span>
                    <span style={{ fontSize: 11, color: c || 'var(--text-primary)', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
