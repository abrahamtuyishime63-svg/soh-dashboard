import React, { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Overview from './components/Overview.jsx'
import SoHPlots from './components/SoHPlots.jsx'
import ResistancePlots from './components/ResistancePlots.jsx'
import ModelMetrics from './components/ModelMetrics.jsx'
import LivePredict from './components/LivePredict.jsx'
import TrainingCurves from './components/TrainingCurves.jsx'
import ElectroThermal from './components/ElectroThermal.jsx'
import AIRecommendations from './components/AIRecommendations.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'

const TABS = [
  { id: 'ai',         label: 'AI Recommendations',  icon: '🤖' },
  { id: 'overview',   label: 'Overview',          icon: '⬡' },
  { id: 'soh',        label: 'SoH vs Cycles',     icon: '◈' },
  { id: 'resistance', label: 'Rint vs Cycles',     icon: '⚡' },
  { id: 'metrics',    label: 'Model Metrics',      icon: '▦' },
  { id: 'thermal',    label: 'Electrothermal',     icon: '◉' },
  { id: 'training',   label: 'Training Curves',    icon: '▷' },
  { id: 'live',       label: 'Live Predict',       icon: '◎' },
  { id: 'admin',      label: 'Admin Dashboard',    icon: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState('ai')
  const [batteries, setBatteries] = useState([])
  const [selectedBattery, setSelectedBattery] = useState('')
  const [apiStatus, setApiStatus] = useState('checking')
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en')

  // Persist language preference
  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  useEffect(() => {
    // Check API health
    fetch('/api/health')
      .then(r => r.json())
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))

    // Load batteries
    fetch('/api/batteries')
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setBatteries(d.batteries)
          setSelectedBattery(d.batteries[0] || '')
        }
      })
      .catch(console.error)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        apiStatus={apiStatus}
        batteries={batteries}
        selectedBattery={selectedBattery}
        onSelectBattery={setSelectedBattery}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      {/* Tab bar */}
      <nav style={{
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        gap: 2,
        overflowX: 'auto'
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span style={{ marginRight: 5 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: '20px 24px', maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        {tab === 'ai'         && <AIRecommendations battery={selectedBattery} language={language} />}
        {tab === 'overview'   && <Overview battery={selectedBattery} />}
        {tab === 'soh'        && <SoHPlots battery={selectedBattery} />}
        {tab === 'resistance' && <ResistancePlots battery={selectedBattery} />}
        {tab === 'metrics'    && <ModelMetrics />}
        {tab === 'thermal'    && <ElectroThermal battery={selectedBattery} language={language} />}
        {tab === 'training'   && <TrainingCurves />}
        {tab === 'live'       && <LivePredict battery={selectedBattery} batteries={batteries} />}
        {tab === 'admin'      && <AdminDashboard />}
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        color: 'var(--text-muted)',
        fontSize: 10,
        letterSpacing: '0.1em'
      }}>
        <span>🔋 SoH BATTERY INTELLIGENCE PLATFORM v2.0 — ISO/IEC COMPLIANT</span>
        <span>7 MODELS · 4 BATTERIES · REAL-TIME SSE STREAMING · {language.toUpperCase()}</span>
      </footer>
    </div>
  )
}
