import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Activity, Flame, ShieldAlert, Sparkles, Smile, RotateCcw } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function DigitalTwin({ patient, onUpdateRecord, token }) {
  const latestRecord = patient.history[patient.history.length - 1];

  // Simulator Inputs
  const [smoking, setSmoking] = useState(latestRecord.smoking);
  const [diabetes, setDiabetes] = useState(latestRecord.diabetes);
  const [hba1c, setHba1c] = useState(latestRecord.hba1c);
  const [plaque, setPlaque] = useState(latestRecord.plaque_index);
  const [bop, setBop] = useState(latestRecord.bleeding_on_probing);

  // Sync inputs with selected patient changes
  useEffect(() => {
    setSmoking(latestRecord.smoking);
    setDiabetes(latestRecord.diabetes);
    setHba1c(latestRecord.hba1c);
    setPlaque(latestRecord.plaque_index);
    setBop(latestRecord.bleeding_on_probing);
  }, [patient]);

  // Simulation outputs
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Run backend forecast
  const runForecastSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smoking,
          diabetes,
          hba1c: parseFloat(hba1c),
          plaque_index: parseFloat(plaque),
          bleeding_on_probing: parseFloat(bop),
          current_bone_loss: latestRecord.bone_loss_average,
          current_attachment_loss: latestRecord.attachment_loss_average
        })
      });

      if (response.ok) {
        const data = await response.json();
        setForecast(data);
      } else {
        throw new Error("Failed to load forecast");
      }
    } catch (err) {
      console.warn("Forecast API failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run simulation on changes
  useEffect(() => {
    runForecastSimulation();
  }, [smoking, diabetes, hba1c, plaque, bop, patient]);

  const resetToBaseline = () => {
    setSmoking(latestRecord.smoking);
    setDiabetes(latestRecord.diabetes);
    setHba1c(latestRecord.hba1c);
    setPlaque(latestRecord.plaque_index);
    setBop(latestRecord.bleeding_on_probing);
  };

  const handleSaveSimulationAsNewRecord = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/patients/${patient._id}/records`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          smoking,
          diabetes,
          hba1c: parseFloat(hba1c),
          plaque_index: parseFloat(plaque),
          bleeding_on_probing: parseFloat(bop),
          bone_loss_average: latestRecord.bone_loss_average,
          attachment_loss_average: latestRecord.attachment_loss_average
        })
      });
      if (response.ok) {
        const updatedPatient = await response.json();
        onUpdateRecord(updatedPatient);
        alert("Clinical Record added successfully to patient history.");
      } else {
        throw new Error("Save request failed");
      }
    } catch (err) {
      alert("Failed to save clinical record to database server.");
    }
  };

  // UI calculations
  const isImproved = plaque < latestRecord.plaque_index || bop < latestRecord.bleeding_on_probing || (latestRecord.smoking && !smoking);

  return (
    <div className="twin-split">
      {/* Trajectory charts */}
      <div className="chart-section">
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} style={{ color: 'var(--primary)' }} />
              Forecasting Trajectory (6m & 12m Predictions)
            </h3>
            {forecast && (
              <span className={`badge ${forecast.risk_category === 'Stable' ? 'badge-stable' : 'badge-progressing'}`}>
                {forecast.risk_category} Risk ({Math.round(forecast.risk_probability * 100)}%)
              </span>
            )}
          </div>

          {forecast ? (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart
                  data={forecast.trajectory}
                  margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(val) => val === 0 ? 'Baseline' : `${val} Months`}
                    stroke="var(--text-secondary)"
                    fontSize={11}
                  />
                  <YAxis 
                    stroke="var(--text-secondary)"
                    fontSize={11}
                    label={{ value: 'Loss (mm)', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--text-secondary)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line 
                    name="Bone Loss Avg (mm)"
                    type="monotone" 
                    dataKey="bone_loss" 
                    stroke="var(--primary)" 
                    strokeWidth={3}
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    name="Attachment Loss Avg (mm)"
                    type="monotone" 
                    dataKey="attachment_loss" 
                    stroke="var(--accent)" 
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Calculating simulation curves...</span>
            </div>
          )}

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Current state has average bone loss of <strong>{latestRecord.bone_loss_average}mm</strong> and attachment loss of <strong>{latestRecord.attachment_loss_average}mm</strong>.
            </span>
          </div>
        </div>

        {/* Digital Twin Insight */}
        {forecast && (
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: `4px solid ${forecast.risk_category === 'Stable' ? 'var(--success)' : 'var(--danger)'}` }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div>
                {forecast.risk_category === 'Stable' ? (
                  <Smile size={24} style={{ color: 'var(--success)' }} />
                ) : (
                  <ShieldAlert size={24} style={{ color: 'var(--danger)' }} />
                )}
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {forecast.risk_category === 'Stable' ? 'Condition Under Control' : 'Intervention Recommended'}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {forecast.risk_category === 'Stable' 
                    ? `With current simulation metrics, the digital twin forecasts a slow progression. Attachment loss will grow by approximately ${(forecast.trajectory[2].attachment_loss - latestRecord.attachment_loss_average).toFixed(2)} mm in 12 months. Maintenance of oral hygiene is recommended.`
                    : `Warning: High risk index. Digital twin model projects rapid degradation. Attachment loss is forecasted to increase by ${(forecast.trajectory[2].attachment_loss - latestRecord.attachment_loss_average).toFixed(2)} mm in 12 months. Consider reducing plaque levels and advising smoking cessation.`
                  }
                </p>
                {isImproved && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem', fontWeight: 600 }}>
                    <Sparkles size={12} /> Live Simulation: Patient lifestyle/clinical improvements show reduced progression!
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Sliders Panel */}
      <div className="simulation-controls glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <Flame size={18} style={{ color: 'var(--accent)' }} />
            Digital Twin Simulation
          </h4>
          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} onClick={resetToBaseline}>
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        {/* Smoking Toggle */}
        <div className="control-group">
          <label className="control-label">
            <span>Smoking Cessation</span>
            <span style={{ color: smoking ? 'var(--danger)' : 'var(--success)' }}>
              {smoking ? 'Active Smoker' : 'Non-Smoker'}
            </span>
          </label>
          <div className="toggle-container">
            <label className="toggle-label">
              <input 
                type="checkbox" 
                className="toggle-checkbox" 
                checked={smoking} 
                onChange={(e) => setSmoking(e.target.checked)} 
              />
              Smoker Status
            </label>
          </div>
        </div>

        {/* Diabetes Status & HbA1c Slider */}
        <div className="control-group" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
          <label className="control-label">
            <span>Diabetes Diagnosis</span>
            <span style={{ color: diabetes ? 'var(--warning)' : 'var(--text-secondary)' }}>
              {diabetes ? 'Diabetic' : 'Non-Diabetic'}
            </span>
          </label>
          <div className="toggle-container" style={{ marginBottom: '0.5rem' }}>
            <label className="toggle-label">
              <input 
                type="checkbox" 
                className="toggle-checkbox" 
                checked={diabetes} 
                onChange={(e) => setDiabetes(e.target.checked)} 
              />
              Diabetic Status
            </label>
          </div>
          
          {diabetes && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
              <div className="control-label">
                <span>HbA1c Level</span>
                <span className="control-val">{hba1c}%</span>
              </div>
              <input 
                type="range" 
                min="4.5" 
                max="12.0" 
                step="0.1" 
                value={hba1c} 
                onChange={(e) => setHba1c(parseFloat(e.target.value))} 
              />
              <span style={{ fontSize: '0.7rem', color: hba1c >= 6.5 ? 'var(--danger)' : 'var(--success)' }}>
                {hba1c >= 6.5 ? 'Uncontrolled hyperglycemia (>6.5%)' : 'Controlled Glycemia (<6.5%)'}
              </span>
            </div>
          )}
        </div>

        {/* Plaque Index Slider */}
        <div className="control-group" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
          <div className="control-label">
            <span>Plaque Index (%)</span>
            <span className="control-val">{plaque}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={plaque} 
            onChange={(e) => setPlaque(parseInt(e.target.value))} 
          />
          <span style={{ fontSize: '0.7rem', color: plaque > 40 ? 'var(--danger)' : 'var(--success)' }}>
            {plaque > 40 ? 'High plaque index (Poor oral hygiene)' : 'Good oral hygiene index'}
          </span>
        </div>

        {/* Bleeding on Probing (BOP) Slider */}
        <div className="control-group" style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
          <div className="control-label">
            <span>Bleeding on Probing (BOP %)</span>
            <span className="control-val">{bop}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={bop} 
            onChange={(e) => setBop(parseInt(e.target.value))} 
          />
          <span style={{ fontSize: '0.7rem', color: bop > 25 ? 'var(--danger)' : 'var(--success)' }}>
            {bop > 25 ? 'High tissue inflammation (Active gingivitis/periodontitis)' : 'Minimal bleeding (Healthy status)'}
          </span>
        </div>

        <button 
          className="btn" 
          style={{ width: '100%', marginTop: '0.5rem' }} 
          onClick={handleSaveSimulationAsNewRecord}
        >
          Save Simulation to History
        </button>
      </div>
    </div>
  );
}
