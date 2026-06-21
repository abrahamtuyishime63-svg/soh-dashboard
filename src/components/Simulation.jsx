import React, { useState, useEffect } from 'react'

export default function Simulation({ battery }) {
  const [simulationParams, setSimulationParams] = useState({
    initialSoh: 0.95,
    initialCycle: 0,
    targetCycle: 500,
    temperature: 25,
    dischargeRate: 1.0,
    chargeRate: 1.0,
    degradationRate: 0.00015,
    temperatureEffect: 0.00002,
    cycleDepth: 0.8
  })
  
  const [simulationResults, setSimulationResults] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [selectedModel, setSelectedModel] = useState('PSO-LSTM')
  const [scenarios, setScenarios] = useState([])
  const [scenarioName, setScenarioName] = useState('')

  const MODELS = ['PSO-LSTM', 'PSO-CNN', 'Improved PSO-SVR', 'XGB', 'GRU', 'RF', 'Phys-Informed PSO-LSTM-Attn']

  const runSimulation = () => {
    setIsRunning(true)
    
    setTimeout(() => {
      const results = []
      let currentSoh = simulationParams.initialSoh
      let currentCycle = simulationParams.initialCycle
      
      for (let cycle = currentCycle; cycle <= simulationParams.targetCycle; cycle++) {
        const tempFactor = 1 + (simulationParams.temperature - 25) * simulationParams.temperatureEffect
        const depthFactor = simulationParams.cycleDepth
        const rateFactor = (simulationParams.dischargeRate + simulationParams.chargeRate) / 2
        
        const degradation = simulationParams.degradationRate * tempFactor * depthFactor * rateFactor
        currentSoh = Math.max(0.5, currentSoh - degradation)
        
        results.push({
          cycle,
          soh: currentSoh,
          temperature: simulationParams.temperature,
          capacity: currentSoh * 4500,
          voltage: 3.6 + currentSoh * 0.4,
          internalResistance: 0.05 + (1 - currentSoh) * 0.1
        })
      }
      
      setSimulationResults(results)
      setIsRunning(false)
    }, 500)
  }

  const saveScenario = () => {
    if (!scenarioName.trim()) return
    
    const newScenario = {
      id: Date.now(),
      name: scenarioName,
      params: { ...simulationParams },
      results: simulationResults ? [...simulationResults] : null,
      createdAt: new Date().toISOString()
    }
    
    setScenarios([...scenarios, newScenario])
    setScenarioName('')
  }

  const loadScenario = (scenarioId) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (scenario) {
      setSimulationParams(scenario.params)
      setSimulationResults(scenario.results)
    }
  }

  const deleteScenario = (scenarioId) => {
    setScenarios(scenarios.filter(s => s.id !== scenarioId))
  }

  const exportResults = () => {
    if (!simulationResults) return
    
    const csv = [
      ['Cycle', 'SoH', 'Temperature', 'Capacity (mAh)', 'Voltage (V)', 'Internal Resistance (Ω)'],
      ...simulationResults.map(r => [
        r.cycle,
        r.soh.toFixed(4),
        r.temperature,
        r.capacity.toFixed(2),
        r.voltage.toFixed(3),
        r.internalResistance.toFixed(4)
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulation_${battery}_${Date.now()}.csv`
    a.click()
  }

  const getSoHColor = (soh) => {
    if (soh >= 0.85) return '#10b981'
    if (soh >= 0.8) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: 24, color: 'var(--text-primary)' }}>Battery Simulation</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 24 }}>
        {/* Parameters Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ 
            background: 'var(--bg-2)', 
            padding: 20, 
            borderRadius: 8, 
            border: '1px solid var(--border)'
          }}>
            <h3 style={{ marginBottom: 16, color: 'var(--text-primary)', fontSize: 14 }}>Simulation Parameters</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Initial SoH
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1"
                  value={simulationParams.initialSoh}
                  onChange={(e) => setSimulationParams({ ...simulationParams, initialSoh: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Initial Cycle
                </label>
                <input
                  type="number"
                  min="0"
                  value={simulationParams.initialCycle}
                  onChange={(e) => setSimulationParams({ ...simulationParams, initialCycle: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Target Cycle
                </label>
                <input
                  type="number"
                  min="1"
                  value={simulationParams.targetCycle}
                  onChange={(e) => setSimulationParams({ ...simulationParams, targetCycle: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  value={simulationParams.temperature}
                  onChange={(e) => setSimulationParams({ ...simulationParams, temperature: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Degradation Rate
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={simulationParams.degradationRate}
                  onChange={(e) => setSimulationParams({ ...simulationParams, degradationRate: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Discharge Rate (C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={simulationParams.dischargeRate}
                  onChange={(e) => setSimulationParams({ ...simulationParams, dischargeRate: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Charge Rate (C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={simulationParams.chargeRate}
                  onChange={(e) => setSimulationParams({ ...simulationParams, chargeRate: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>

              <div>
                <label style={{ Display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Cycle Depth (0-1)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={simulationParams.cycleDepth}
                  onChange={(e) => setSimulationParams({ ...simulationParams, cycleDepth: parseFloat(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-1)',
                    color: 'var(--text-primary)',
                    fontSize: 12
                  }}
                >
                  {MODELS.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={runSimulation}
                disabled={isRunning}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 4,
                  border: 'none',
                  background: isRunning ? 'var(--accent-muted)' : 'var(--accent-blue)',
                  color: 'white',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 'bold'
                }}
              >
                {isRunning ? 'Running...' : 'Run Simulation'}
              </button>
            </div>
          </div>

          {/* Scenario Management */}
          <div style={{ 
            background: 'var(--bg-2)', 
            padding: 20, 
            borderRadius: 8, 
            border: '1px solid var(--border)'
          }}>
            <h3 style={{ marginBottom: 16, color: 'var(--text-primary)', fontSize: 14 }}>Scenarios</h3>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Scenario name"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-1)',
                  color: 'var(--text-primary)',
                  fontSize: 12
                }}
              />
              <button
                onClick={saveScenario}
                disabled={!scenarioName.trim() || !simulationResults}
                style={{
                  padding: '8px 12px',
                  borderRadius: 4,
                  border: 'none',
                  background: 'var(--accent-green)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 11
                }}
              >
                Save
              </button>
            </div>

            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {scenarios.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                  No saved scenarios
                </div>
              ) : (
                scenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 8,
                      borderRadius: 4,
                      background: 'var(--bg-1)',
                      marginBottom: 8,
                      fontSize: 11
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{scenario.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                        {new Date(scenario.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => loadScenario(scenario.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-2)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: 10
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteScenario(scenario.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-2)',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: 10
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div>
          {simulationResults ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <div style={{ 
                  background: 'var(--bg-2)', 
                  padding: 16, 
                  borderRadius: 8, 
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Final SoH</div>
                  <div style={{ 
                    fontSize: 20, 
                    fontWeight: 'bold', 
                    color: getSoHColor(simulationResults[simulationResults.length - 1].soh) 
                  }}>
                    {(simulationResults[simulationResults.length - 1].soh * 100).toFixed(1)}%
                  </div>
                </div>

                <div style={{ 
                  background: 'var(--bg-2)', 
                  padding: 16, 
                  borderRadius: 8, 
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Capacity Loss</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {((simulationParams.initialSoh - simulationResults[simulationResults.length - 1].soh) * 100).toFixed(1)}%
                  </div>
                </div>

                <div style={{ 
                  background: 'var(--bg-2)', 
                  padding: 16, 
                  borderRadius: 8, 
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Cycles Simulated</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {simulationResults.length}
                  </div>
                </div>

                <div style={{ 
                  background: 'var(--bg-2)', 
                  padding: 16, 
                  borderRadius: 8, 
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Final Resistance</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {simulationResults[simulationResults.length - 1].internalResistance.toFixed(3)}Ω
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div style={{ 
                background: 'var(--bg-2)', 
                padding: 20, 
                borderRadius: 8, 
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ color: 'var(--text-primary)', fontSize: 14 }}>SoH Degradation Curve</h3>
                  <button
                    onClick={exportResults}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 4,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-1)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                  >
                    Export CSV
                  </button>
                </div>
                
                <div style={{ height: 300, position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 600 300">
                    {/* Grid lines */}
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map(y => (
                      <line
                        key={y}
                        x1="50"
                        y1={280 - y * 250}
                        x2="580"
                        y2={280 - y * 250}
                        stroke="var(--border)"
                        strokeWidth="1"
                      />
                    ))}
                    
                    {/* Y-axis labels */}
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map(y => (
                      <text
                        key={y}
                        x="40"
                        y={284 - y * 250}
                        fontSize="10"
                        fill="var(--text-muted)"
                        textAnchor="end"
                      >
                        {(y * 100).toFixed(0)}%
                      </text>
                    ))}
                    
                    {/* X-axis labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map(x => (
                      <text
                        key={x}
                        x={50 + x * 530}
                        y="295"
                        fontSize="10"
                        fill="var(--text-muted)"
                        textAnchor="middle"
                      >
                        {Math.floor(x * simulationParams.targetCycle)}
                      </text>
                    ))}
                    
                    {/* SoH curve */}
                    <polyline
                      fill="none"
                      stroke="var(--accent-blue)"
                      strokeWidth="2"
                      points={simulationResults.map((r, i) => {
                        const x = 50 + (i / simulationResults.length) * 530
                        const y = 280 - r.soh * 250
                        return `${x},${y}`
                      }).join(' ')}
                    />
                    
                    {/* Alert threshold line */}
                    <line
                      x1="50"
                      y1={280 - 0.8 * 250}
                      x2="580"
                      y2={280 - 0.8 * 250}
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />
                    
                    {/* Warning threshold line */}
                    <line
                      x1="50"
                      y1={280 - 0.85 * 250}
                      x2="580"
                      y2={280 - 0.85 * 250}
                      stroke="#f59e0b"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                    />
                  </svg>
                </div>
              </div>

              {/* Data Table */}
              <div style={{ 
                background: 'var(--bg-2)', 
                padding: 20, 
                borderRadius: 8, 
                border: '1px solid var(--border)'
              }}>
                <h3 style={{ marginBottom: 16, color: 'var(--text-primary)', fontSize: 14 }}>Simulation Data</h3>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-2)' }}>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: 8, textAlign: 'left', color: 'var(--text-muted)' }}>Cycle</th>
                        <th style={{ padding: 8, textAlign: 'left', color: 'var(--text-muted)' }}>SoH</th>
                        <th style={{ padding: 8, textAlign: 'left', color: 'var(--text-muted)' }}>Capacity</th>
                        <th style={{ padding: 8, textAlign: 'left', color: 'var(--text-muted)' }}>Voltage</th>
                        <th style={{ padding: 8, textAlign: 'left', color: 'var(--text-muted)' }}>Resistance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulationResults.slice(0, 50).map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: 8, color: 'var(--text-primary)' }}>{row.cycle}</td>
                          <td style={{ padding: 8, color: getSoHColor(row.soh) }}>{(row.soh * 100).toFixed(2)}%</td>
                          <td style={{ padding: 8, color: 'var(--text-primary)' }}>{row.capacity.toFixed(0)} mAh</td>
                          <td style={{ padding: 8, color: 'var(--text-primary)' }}>{row.voltage.toFixed(2)} V</td>
                          <td style={{ padding: 8, color: 'var(--text-primary)' }}>{row.internalResistance.toFixed(4)} Ω</td>
                        </tr>
                      ))}
                      {simulationResults.length > 50 && (
                        <tr>
                          <td colSpan="5" style={{ padding: 8, textAlign: 'center', color: 'var(--text-muted)' }}>
                            ... {simulationResults.length - 50} more rows (export to see all)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ 
              background: 'var(--bg-2)', 
              padding: 40, 
              borderRadius: 8, 
              border: '1px solid var(--border)',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div>Configure parameters and run a simulation to see results</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
