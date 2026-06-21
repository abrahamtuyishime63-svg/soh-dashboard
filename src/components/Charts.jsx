/**
 * Lightweight SVG chart helper — no dependencies.
 * Draws line charts with multiple series, axes, grid, legend, tooltip.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react'

export const MODEL_COLORS = {
  'PSO-LSTM':                    '#00d4ff',
  'PSO-CNN':                     '#ff6b35',
  'Improved PSO-SVR':            '#39ff8a',
  'XGB':                         '#ffcc00',
  'GRU':                         '#c084fc',
  'RF':                          '#fb7185',
  'Phys-Informed PSO-LSTM-Attn': '#38bdf8',
  'SoH_actual':                  '#ffffff',
  'Actual':                      '#ffffff',
}

export const MODEL_ABBR = {
  'PSO-LSTM':                    'PSO-LSTM',
  'PSO-CNN':                     'PSO-CNN',
  'Improved PSO-SVR':            'PSO-SVR*',
  'XGB':                         'XGB',
  'GRU':                         'GRU',
  'RF':                          'RF',
  'Phys-Informed PSO-LSTM-Attn': 'PI-LSTM-Attn',
  'SoH_actual':                  'Actual',
  'Actual':                      'Actual',
}

/**
 * Props:
 *  series: [{ key, label, data: [{x, y}], color, dash? }]
 *  xLabel, yLabel
 *  height
 *  yMin, yMax
 */
export function LineChart({ series = [], xLabel = '', yLabel = '', height = 320, yMin, yMax, formatY }) {
  const svgRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const [dims, setDims] = useState({ w: 800, h: height })

  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      setDims({ w, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [height])

  const { w, h } = dims
  const PAD = { top: 20, right: 20, bottom: 48, left: 60 }
  const CW = w - PAD.left - PAD.right
  const CH = h - PAD.top - PAD.bottom

  const allX = series.flatMap(s => s.data.map(p => p.x))
  const allY = series.flatMap(s => s.data.map(p => p.y))
  const xMin = Math.min(...allX)
  const xMaxV = Math.max(...allX)
  const yMinV = yMin !== undefined ? yMin : Math.min(...allY) - 0.005
  const yMaxV = yMax !== undefined ? yMax : Math.max(...allY) + 0.005

  const scaleX = x => PAD.left + ((x - xMin) / (xMaxV - xMin || 1)) * CW
  const scaleY = y => PAD.top + (1 - (y - yMinV) / (yMaxV - yMinV || 1)) * CH

  const yTicks = 6
  const xTicks = 8

  const yTickValues = []
  for (let i = 0; i <= yTicks; i++) {
    yTickValues.push(yMinV + (i / yTicks) * (yMaxV - yMinV))
  }

  const fmtNum = (v) => {
    if (formatY) return formatY(v)
    if (Math.abs(v) < 0.01) return v.toExponential(1)
    if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'k'
    return v.toFixed(3)
  }

  const gridLines = []
  yTickValues.forEach((y, i) => {
    const sy = scaleY(y)
    gridLines.push(
      <line key={`gy${i}`} x1={PAD.left} x2={PAD.left + CW} y1={sy} y2={sy}
        stroke="#1a2744" strokeWidth={1} />,
      <text key={`gt${i}`} x={PAD.left - 8} y={sy + 4} textAnchor="end"
        fill="#6b7fa3" fontSize={10} fontFamily="Space Mono, monospace">
        {fmtNum(y)}
      </text>
    )
  })
  for (let i = 0; i <= xTicks; i++) {
    const x = xMin + (i / xTicks) * (xMaxV - xMin)
    const sx = scaleX(x)
    gridLines.push(
      <line key={`gx${i}`} x1={sx} x2={sx} y1={PAD.top} y2={PAD.top + CH}
        stroke="#1a2744" strokeWidth={1} />,
      <text key={`gxt${i}`} x={sx} y={h - 10} textAnchor="middle"
        fill="#6b7fa3" fontSize={10} fontFamily="Space Mono, monospace">
        {Math.round(x)}
      </text>
    )
  }

  const paths = series.map(s => {
    if (!s.data.length) return null
    const pts = s.data.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' L ')
    const isHighlight = s.key === 'SoH_actual' || s.key === 'Improved PSO-SVR' || s.key === 'PSO-SVR★'
    return (
      <path key={s.key}
        d={`M ${pts}`}
        fill="none"
        stroke={s.color}
        strokeWidth={isHighlight ? 2.8 : 1.6}
        strokeDasharray={s.dash || 'none'}
        opacity={isHighlight ? 1 : 0.55}
      />
    )
  })

  const areaPaths = series.filter(s => s.key === 'SoH_actual' || s.key === 'Improved PSO-SVR').map(s => {
    if (!s.data.length) return null
    const pts = s.data.map(p => `${scaleX(p.x)},${scaleY(p.y)}`).join(' L ')
    const last = s.data[s.data.length - 1]
    const first = s.data[0]
    return (
      <path key={`area-${s.key}`}
        d={`M ${scaleX(first.x)},${scaleY(yMinV)} L ${pts} L ${scaleX(last.x)},${scaleY(yMinV)} Z`}
        fill={s.color}
        opacity={0.06}
      />
    )
  })

  const handleMouseMove = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const xVal = xMin + ((mx - PAD.left) / CW) * (xMaxV - xMin)
    if (xVal < xMin || xVal > xMaxV) { setTooltip(null); return }

    const snap = series.map(s => {
      if (!s.data.length) return null
      const nearest = s.data.reduce((a, b) => Math.abs(b.x - xVal) < Math.abs(a.x - xVal) ? b : a, s.data[0])
      return { label: s.label, color: s.color, ...nearest }
    }).filter(Boolean)
    setTooltip({ x: mx, y: my, xVal: Math.round(xVal), points: snap })
  }, [series, xMin, xMaxV, CW, PAD, formatY])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg ref={svgRef} width="100%" height={h} style={{ display: 'block' }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        <defs>
          <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2744" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1a2744" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines}
        {areaPaths}
        {paths}
        {/* Axes */}
        <line x1={PAD.left} x2={PAD.left + CW} y1={PAD.top + CH} y2={PAD.top + CH}
          stroke="#2a3f66" strokeWidth={1.2} />
        <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + CH}
          stroke="#2a3f66" strokeWidth={1.2} />
        {/* Axis labels */}
        <text x={PAD.left + CW / 2} y={h - 4} textAnchor="middle"
          fill="#4a5f82" fontSize={11} fontFamily="Space Mono, monospace" letterSpacing="0.12em" fontWeight={600}>
          {xLabel}
        </text>
        <text transform={`rotate(-90, 14, ${PAD.top + CH / 2})`}
          x={14} y={PAD.top + CH / 2} textAnchor="middle"
          fill="#4a5f82" fontSize={11} fontFamily="Space Mono, monospace" letterSpacing="0.12em" fontWeight={600}>
          {yLabel}
        </text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute', pointerEvents: 'none',
          left: Math.min(tooltip.x + 14, w - 200),
          top: Math.max(tooltip.y - 70, 4),
          background: 'rgba(8,12,24,0.95)',
          border: '1px solid #2a3f66',
          borderRadius: 8, padding: '10px 14px',
          fontSize: 11, fontFamily: 'Space Mono, monospace',
          zIndex: 50, minWidth: 160,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ color: '#8a9bc0', marginBottom: 8, fontSize: 9, letterSpacing: '0.15em', fontWeight: 700 }}>
            CYCLE {tooltip.xVal}
          </div>
          {tooltip.points.map(p => (
            <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 3, alignItems: 'center' }}>
              <span style={{ color: p.color, fontWeight: 600, fontSize: 10 }}>{p.label}</span>
              <span style={{ color: '#e8f0fe', fontWeight: 700, fontSize: 11 }}>
                {formatY ? formatY(p.y) : (p.y * 100).toFixed(2) + '%'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Legend component
 */
export function ChartLegend({ series }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '8px 16px',
      marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)'
    }}>
      {series.map(s => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 20, height: 2.5,
            background: s.color,
            borderRadius: 2,
            opacity: 0.9
          }} />
          <span style={{ fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Bar chart for model metrics
 */
export function BarChart({ data, valueKey, labelKey, colorFn, height = 200, yLabel = '' }) {
  const svgRef = useRef(null)
  const [dims, setDims] = useState({ w: 600 })

  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    const ro = new ResizeObserver(e => setDims({ w: e[0].contentRect.width }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { w } = dims
  const PAD = { top: 16, right: 16, bottom: 56, left: 52 }
  const CW = w - PAD.left - PAD.right
  const CH = height - PAD.top - PAD.bottom

  const vals = data.map(d => parseFloat(d[valueKey]))
  const maxV = Math.max(...vals) * 1.1
  const barW = CW / data.length * 0.6
  const gap = CW / data.length

  return (
    <svg ref={svgRef} width="100%" height={height} style={{ display: 'block' }}>
      {/* Y grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const y = PAD.top + CH * (1 - f)
        return (
          <g key={i}>
            <line x1={PAD.left} x2={PAD.left + CW} y1={y} y2={y} stroke="#1e2d4a" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fill="#7a8db0" fontSize={9} fontFamily="Space Mono">
              {(f * maxV).toFixed(4)}
            </text>
          </g>
        )
      })}

      {data.map((d, i) => {
        const val = parseFloat(d[valueKey])
        const barH = (val / maxV) * CH
        const x = PAD.left + i * gap + (gap - barW) / 2
        const y = PAD.top + CH - barH
        const color = colorFn ? colorFn(d) : '#00d4ff'
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH}
              fill={color} opacity={0.8} rx={3} />
            <rect x={x} y={y} width={barW} height={2}
              fill={color} opacity={1} rx={1} />
            <text x={x + barW / 2} y={PAD.top + CH + 14} textAnchor="middle"
              fill="#7a8db0" fontSize={8} fontFamily="Space Mono"
              transform={`rotate(-35, ${x + barW / 2}, ${PAD.top + CH + 14})`}>
              {MODEL_ABBR[d[labelKey]] || d[labelKey]}
            </text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle"
              fill={color} fontSize={8} fontFamily="Space Mono">
              {val.toFixed(4)}
            </text>
          </g>
        )
      })}

      <line x1={PAD.left} x2={PAD.left + CW} y1={PAD.top + CH} y2={PAD.top + CH} stroke="#2a3f66" />
      <text transform={`rotate(-90, 12, ${PAD.top + CH / 2})`}
        x={12} y={PAD.top + CH / 2} textAnchor="middle"
        fill="#3d4f70" fontSize={10} fontFamily="Space Mono">{yLabel}</text>
    </svg>
  )
}
