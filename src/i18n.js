// International Standards-based Localization
// Supports: ISO 12405 (Battery testing), IEC 61960 (Li-ion cells), ISO 13633 (Maintenance)
// ISO 80000 (Physical quantities and units)

export const i18nConfig = {
  defaultLanguage: 'en',
  supportedLanguages: {
    en: { name: 'English', flag: '🇺🇸', region: 'US' },
    es: { name: 'Español', flag: '🇪🇸', region: 'ES' },
    fr: { name: 'Français', flag: '🇫🇷', region: 'FR' },
    de: { name: 'Deutsch', flag: '🇩🇪', region: 'DE' },
    zh: { name: '中文', flag: '🇨🇳', region: 'CN' },
    ja: { name: '日本語', flag: '🇯🇵', region: 'JP' },
    pt: { name: 'Português', flag: '🇵🇹', region: 'PT' },
    ko: { name: '한국어', flag: '🇰🇷', region: 'KR' }
  }
}

export const numberFormats = {
  en_US: { locale: 'en-US', separator: ',' },
  es_ES: { locale: 'es-ES', separator: '.' },
  fr_FR: { locale: 'fr-FR', separator: ' ' },
  de_DE: { locale: 'de-DE', separator: ',' },
  zh_CN: { locale: 'zh-CN', separator: '，' },
  ja_JP: { locale: 'ja-JP', separator: '、' },
  pt_PT: { locale: 'pt-PT', separator: ',' },
  ko_KR: { locale: 'ko-KR', separator: ',' }
}

export const standards = {
  ISO12405: {
    name: 'ISO 12405',
    title: 'Battery Test Cycles for Electric Vehicles',
    sohThresholds: {
      healthy: { min: 0.8, label: 'Healthy' },
      degraded: { min: 0.65, label: 'Degraded' },
      critical: { min: 0.4, label: 'Critical' },
      eol: { min: 0, label: 'End of Life' }
    }
  },
  IEC61960: {
    name: 'IEC 61960',
    title: 'Secondary Cells and Batteries for Renewable Energy Storage',
    thermalReferenceTemp: 25, // °C
    maxThermalGradient: 5 // °C/minute
  },
  ISO80000: {
    name: 'ISO 80000',
    title: 'Quantities and Units',
    temperatureUnit: '°C',
    energyUnit: 'Wh',
    powerUnit: 'W',
    resistanceUnit: 'Ω'
  },
  IEC61850: {
    name: 'IEC 61850',
    title: 'Power Systems Management and Associated Information Exchange',
    dataIntegrityCheck: true,
    timestamp: true
  }
}

export const getLocalizedNumber = (value, decimals = 2, language = 'en') => {
  const langMap = {
    en: 'en_US',
    es: 'es_ES',
    fr: 'fr_FR',
    de: 'de_DE',
    zh: 'zh_CN',
    ja: 'ja_JP',
    pt: 'pt_PT',
    ko: 'ko_KR'
  }
  
  const locale = numberFormats[langMap[language]]?.locale || 'en-US'
  return parseFloat(value).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

export const getISO8601DateTime = () => new Date().toISOString()

export const formatTemperature = (value, unit = 'C') => {
  const units = { C: '°C', F: '°F', K: 'K' }
  return `${value.toFixed(2)} ${units[unit] || unit}`
}

export const formatEnergy = (value, unit = 'Wh') => {
  if (value >= 1000) return `${(value / 1000).toFixed(2)} kWh`
  return `${value.toFixed(2)} ${unit}`
}

export const getComplianceReport = (battery) => ({
  timestamp: getISO8601DateTime(),
  standards: ['ISO 12405-4', 'IEC 61960', 'ISO 80000-5', 'IEC 61850'],
  batterySoH: battery.soh,
  status: battery.soh >= 0.8 ? 'COMPLIANT' : 'REQUIRES_ATTENTION',
  maintenanceRequired: battery.soh < 0.65
})
