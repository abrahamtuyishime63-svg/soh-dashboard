import React, { useState } from 'react'
import { i18nConfig } from '../i18n.js'

export default function Header({ apiStatus, batteries, selectedBattery, onSelectBattery, language = 'en', onLanguageChange }) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const statusColor = apiStatus === 'online' ? 'var(--ok)' : apiStatus === 'offline' ? 'var(--danger)' : 'var(--warn)'
  const currentLang = i18nConfig.supportedLanguages[language] || i18nConfig.supportedLanguages.en

  return (
    <header style={{
      background: 'var(--bg-1)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: 'linear-gradient(135deg, var(--accent) 0%, #0044aa 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 900
        }}>🔋</div>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
            letterSpacing: '0.05em', color: 'var(--text-primary)'
          }}>
            SoH Intelligence
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            ISO 12405 | IEC 61960
          </div>
        </div>
      </div>

      {/* Centre: battery selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>BATTERY</span>
        <select value={selectedBattery} onChange={e => onSelectBattery(e.target.value)}
          style={{ minWidth: 220 }}>
          {batteries.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Right: Language, Standards, & API status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Language Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              padding: '4px 8px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Select Language"
          >
            {currentLang.flag} {currentLang.name}
          </button>
          {showLanguageMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000, minWidth: 160
            }}>
              {Object.entries(i18nConfig.supportedLanguages).map(([code, lang]) => (
                <div
                  key={code}
                  onClick={() => {
                    onLanguageChange?.(code)
                    setShowLanguageMenu(false)
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 11,
                    color: language === code ? 'var(--accent)' : 'var(--text-secondary)',
                    background: language === code ? 'rgba(0,212,255,0.1)' : 'transparent',
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center'
                  }}
                >
                  {lang.flag} {lang.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Standards Badge */}
        <div style={{
          fontSize: 7,
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '2px 6px',
          background: 'rgba(0,212,255,0.1)',
          border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: 3
        }}>
          📋 ISO/IEC
        </div>

        {/* API status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
            animation: apiStatus === 'online' ? 'pulse-badge 2s infinite' : 'none'
          }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            API {apiStatus.toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  )
}
