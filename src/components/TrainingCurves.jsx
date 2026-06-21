import React, { useEffect, useState } from 'react'
import { LineChart, ChartLegend } from './Charts.jsx'

export function TrainingCurves() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/training').then(r => r.json()).then(d => {
      if (d.ok) setData(d.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div className="spinner" />
    </div>
  )

  const trainLoss = { key: 'train_loss', label: 'Train Loss', color: '#00d4ff',
    data: data.map(r => ({ x: parseFloat(r.train_fraction) * 100, y: parseFloat(r.train_loss) })) }
  const valLoss = { key: 'val_loss', label: 'Val Loss', color: '#ff6b35',
    data: data.map(r => ({ x: parseFloat(r.train_fraction) * 100, y: parseFloat(r.val_loss) })) }

  const trainRMSE = { key: 'train_rmse', label: 'Train RMSE', color: '#39ff8a',
    data: data.map(r => ({ x: parseFloat(r.train_fraction) * 100, y: parseFloat(r.train_rmse) })) }
  const valRMSE = { key: 'val_rmse', label: 'Val RMSE', color: '#ffcc00',
    data: data.map(r => ({ x: parseFloat(r.train_fraction) * 100, y: parseFloat(r.val_rmse) })) }

  const trainMAE = { key: 'train_mae', label: 'Train MAE', color: '#c084fc',
    data: data.map(r => ({ x: parseFloat(r.train_fraction) * 100, y: parseFloat(r.train_mae) })) }
  const valMAE = { key: 'val_mae', label: 'Val MAE', color: '#fb7185',
    data: data.map(r => ({ x: parseFloat(r.train_fraction) * 100, y: parseFloat(r.val_mae) })) }

  return (
    <div>
      <div style={{
        padding: '12px 16px', background: 'rgba(0,212,255,0.05)',
        border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16,
        fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7
      }}>
        <strong style={{ color: 'var(--accent)' }}>Improved PSO-SVR Learning Curves</strong>
        {' '}— These plots show how the model's performance evolves as more training data is used.
        The x-axis represents the training fraction (15% → 100%). Convergence of train/val curves
        indicates a well-fitted model with minimal overfitting. PSO optimizes the SVR's C, ε, and γ hyperparameters.
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Loss vs Training Fraction</span>
          </div>
          <LineChart series={[trainLoss, valLoss]} xLabel="TRAINING FRACTION %" yLabel="Loss" height={280} />
          <ChartLegend series={[trainLoss, valLoss]} />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">RMSE vs Training Fraction</span>
          </div>
          <LineChart series={[trainRMSE, valRMSE]} xLabel="TRAINING FRACTION %" yLabel="RMSE" height={280} />
          <ChartLegend series={[trainRMSE, valRMSE]} />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">MAE vs Training Fraction</span>
          </div>
          <LineChart series={[trainMAE, valMAE]} xLabel="TRAINING FRACTION %" yLabel="MAE" height={280} />
          <ChartLegend series={[trainMAE, valMAE]} />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Training Data Summary</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr>
                  {['N Train', 'Fraction', 'Train Loss', 'Val Loss', 'Train RMSE', 'Val RMSE'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 8,
                      color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase',
                      borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '5px 8px', color: 'var(--accent)' }}>{r.n_train}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text-secondary)' }}>
                      {(parseFloat(r.train_fraction) * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '5px 8px', color: 'var(--ok)' }}>
                      {parseFloat(r.train_loss).toExponential(3)}
                    </td>
                    <td style={{ padding: '5px 8px', color: 'var(--accent2)' }}>
                      {parseFloat(r.val_loss).toExponential(3)}
                    </td>
                    <td style={{ padding: '5px 8px', color: 'var(--ok)' }}>
                      {parseFloat(r.train_rmse).toExponential(3)}
                    </td>
                    <td style={{ padding: '5px 8px', color: 'var(--accent2)' }}>
                      {parseFloat(r.val_rmse).toExponential(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainingCurves
