import React, { useEffect, useState, useRef } from 'react'
import { LineChart, ChartLegend } from './Charts.jsx'

// Internationalization helper
const i18n = {
  en: {
    title: 'Coupled Electrothermal Analysis',
    description: 'Shows the coupled relationship between electrical load, internal resistance, Joule heating, and temperature rise. High electrothermal stress accelerates SoH degradation via SEI layer growth and lithium plating mechanisms.',
    joulHeating: 'Joule Heating vs Cycle',
    tempRise: 'Temperature Rise vs Cycle',
    stressIndex: 'Electrothermal Stress Index vs Cycle',
    stressFormula: 'Stress = Rint × ΔT × k — Combined indicator of battery degradation rate',
    crossBattery: 'Cross-Battery Electrothermal Summary',
    battery: 'Battery',
    meanLoad: 'Mean Load (W)',
    meanJoule: 'Mean Joule (W)',
    tempRiseC: 'Temp Rise (°C)',
    heatExchange: 'Heat Exchange (W/°C)',
    rintGrowth: 'Rint Growth %',
    sohDrop: 'SoH Drop %',
    stressToSoH: 'Stress→SoH',
    joulHeat: 'Joule Heat (norm.)',
    tempRiseLabel: 'Temp Rise (°C)',
    stressLabel: 'Electrothermal Stress',
    cycle: 'CYCLE',
    heat: 'Heat (norm.)',
    stress: 'Stress (norm.)',
    deltaT: 'ΔT (°C)'
  }
}

const getLabels = (lang = 'en') => i18n[lang] || i18n.en

export default function ElectroThermal({ battery, language = 'en' }) {
  const labels = getLabels(language)
  const [data, setData] = useState([])
  const [predictions, setPredictions] = useState([])
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
      fetch('/api/electrothermal').then(r => r.json()),
      fetch(`/api/predictions?battery=${encodeURIComponent(battery)}`).then(r => r.json())
    ]).then(([et, pred]) => {
      if (et.ok) setData(et.data)
      if (pred.ok && pred.data) { setPredictions(pred.data); loadedFromCSV.current = true }
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
    const timer = setTimeout(startStream, 1200)
    return () => { clearTimeout(timer); esRef.current?.close(); setStreaming(false) }
  }, [battery])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" />
    </div>
  )

  // Format numbers with locale support
  const formatNumber = (num, decimals = 2, useLocale = 'en-US') => {
    return parseFloat(num).toLocaleString(useLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  const formatScientific = (num, unit = '') => {
    const val = parseFloat(num)
    if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M' + unit
    if (val >= 1e3) return (val / 1e3).toFixed(1) + 'K' + unit
    return val.toFixed(1) + unit
  }

  // Joule heating vs cycle (proxy from best model)
  const R_BASE = 0.050
  const jouleSeries = {
    key: 'joule', label: labels.joulHeat, color: '#ffcc00',
    data: predictions.map(r => {
      const soh = parseFloat(r['Improved PSO-SVR'] || 0.95)
      const rint = R_BASE * (1 + 2.5 * (1 - soh))
      return { x: r.cycle, y: rint * 125 } // I²R normalized
    })
  }
  const tempSeries = {
    key: 'temp', label: labels.tempRiseLabel, color: '#ff6b35',
    data: predictions.map(r => {
      const soh = parseFloat(r['Improved PSO-SVR'] || 0.95)
      return { x: r.cycle, y: 20 + (1 - soh) * 80 }
    })
  }
  const stressSeries = {
    key: 'stress', label: labels.stressLabel, color: '#c084fc',
    data: predictions.map(r => {
      const soh = parseFloat(r['Improved PSO-SVR'] || 0.95)
      const rint = R_BASE * (1 + 2.5 * (1 - soh))
      const t = 20 + (1 - soh) * 80
      return { x: r.cycle, y: rint * t * 50 } // combined stress proxy
    })
  }

  return (
    <div>
      <div style={{
        padding: '12px 16px', background: 'rgba(255,204,0,0.05)',
        border: '1px solid rgba(255,204,0,0.2)', borderRadius: 8, marginBottom: 16,
        fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7
      }}>
        <strong style={{ color: 'var(--accent4)' }}>{labels.title}</strong>
        {' '}— {labels.description}
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">{labels.joulHeating} — {battery}</span>
          </div>
          <LineChart series={[jouleSeries]} xLabel={labels.cycle} yLabel={labels.heat} height={260} />
          <ChartLegend series={[jouleSeries]} />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">{labels.tempRise}</span>
          </div>
          <LineChart series={[tempSeries]} xLabel={labels.cycle} yLabel={labels.deltaT} height={260} />
          <ChartLegend series={[tempSeries]} />
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <span className="card-title">{labels.stressIndex}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
            {labels.stressFormula}
          </div>
          <LineChart series={[stressSeries]} xLabel={labels.cycle} yLabel={labels.stress} height={240} />
          <ChartLegend series={[stressSeries]} />
        </div>
      </div>

      {/* Cross-battery electrothermal table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">{labels.crossBattery}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
            <thead>
              <tr>
                {[labels.battery, labels.meanLoad, labels.meanJoule, labels.tempRiseC,
                  labels.heatExchange, labels.rintGrowth, labels.sohDrop, labels.stressToSoH].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 8,
                    color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => {
                const isSelected = r.battery_name === battery
                const rintG = parseFloat(r.R_int_growth_percent) || 0
                const sohD = parseFloat(r.SoH_drop_percent) || 0
                const meanLoad = parseFloat(r.mean_load_power_W) || 0
                const meanJoule = parseFloat(r.mean_joule_heat_W) || 0
                const tempRiseVal = parseFloat(r.mean_temp_rise_C) || 0
                const heatExch = parseFloat(r.mean_heat_exchange_W_per_C) || 0
                const stressCorr = parseFloat(r.corr_electrothermal_stress_vs_SoH) || 0
                
                return (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--border)',
                    background: isSelected ? 'rgba(0,212,255,0.06)' : 'transparent'
                  }}>
                    <td style={{ padding: '8px 10px', color: isSelected ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: isSelected ? 700 : 400 }}>
                      {r.battery_name?.replace('SJV1.1BAK45A', '') || r.battery_name}
                      {isSelected && ' ◄'}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      {formatScientific(meanLoad)}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--accent4)' }}>
                      {formatScientific(meanJoule)}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--accent2)' }}>
                      {formatNumber(tempRiseVal, 2)}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      {formatScientific(heatExch)}
                    </td>
                    <td style={{ padding: '8px 10px', color: rintG > 50 ? 'var(--danger)' : rintG > 0 ? 'var(--warn)' : 'var(--ok)' }}>
                      {formatNumber(rintG, 2)}%
                    </td>
                    <td style={{ padding: '8px 10px', color: sohD > 5 ? 'var(--danger)' : sohD > 3 ? 'var(--warn)' : 'var(--ok)' }}>
                      {formatNumber(sohD, 3)}%
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                      {formatNumber(stressCorr, 4)}
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
