'use client';
// app/sessions/new/page.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';

const today = () => new Date().toISOString().slice(0, 10);

export default function NewSessionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', start_point: '', end_point: '',
    distance_km: '', duration_minutes: '', altitude: '',
    temperature: '', training_date: today(), notes: '',
  });
  const [splits,  setSplits]  = useState([]);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Auto-generate km splits when distance changes
  const handleDistanceBlur = () => {
    const km = parseInt(form.distance_km);
    if (km > 0 && km <= 100) {
      setSplits(Array.from({ length: km }, (_, i) => ({
        kilometer_number: i + 1,
        split_time: '',
      })));
    }
  };

  const handleSplitChange = (idx, val) => {
    setSplits(s => s.map((sp, i) => i === idx ? { ...sp, split_time: val } : sp));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        distance_km:      Number(form.distance_km),
        duration_minutes: Number(form.duration_minutes),
        altitude:         form.altitude    ? Number(form.altitude)    : null,
        temperature:      form.temperature ? Number(form.temperature) : null,
        splits: splits
          .filter(s => s.split_time)
          .map(s => ({ ...s, split_time: Number(s.split_time) })),
      };
      await api.post('/sessions', payload);
      setSuccess(true);
      setTimeout(() => router.push('/sessions'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Session</h1>
          <p className="page-subtitle">Record your training data</p>
        </div>
      </div>

      {error   && <div className="alert alert-error"   style={{ marginBottom: '1.25rem' }}>⚠ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>✓ Session saved! Redirecting…</div>}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-title">Basic Info</div>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Session Title</label>
              <input name="title" className="form-input" placeholder="e.g. Morning Run – Addis Ababa" value={form.title} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Start Point</label>
              <input name="start_point" className="form-input" placeholder="e.g. Bole, Addis Ababa" value={form.start_point} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">End Point</label>
              <input name="end_point" className="form-input" placeholder="e.g. Meskel Square" value={form.end_point} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Training Date *</label>
              <input type="date" name="training_date" className="form-input" value={form.training_date} onChange={handleChange} required />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-title">Performance Metrics</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Distance (km) *</label>
              <input type="number" name="distance_km" className="form-input" placeholder="10.5" step="0.01" min="0" value={form.distance_km} onChange={handleChange} onBlur={handleDistanceBlur} required />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes) *</label>
              <input type="number" name="duration_minutes" className="form-input" placeholder="65" step="0.1" min="0" value={form.duration_minutes} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Altitude (m)</label>
              <input type="number" name="altitude" className="form-input" placeholder="2355" step="1" value={form.altitude} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Temperature (°C)</label>
              <input type="number" name="temperature" className="form-input" placeholder="18" step="0.5" value={form.temperature} onChange={handleChange} />
            </div>
          </div>

          {/* Auto-calculated preview */}
          {form.distance_km && form.duration_minutes && (
            <div style={{
              marginTop: '1rem', padding: '0.85rem 1rem',
              background: 'var(--accent-dim)', borderRadius: 'var(--radius)',
              border: '1px solid var(--accent-glow)',
              display: 'flex', gap: '2rem', flexWrap: 'wrap'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 700 }}>Avg Speed</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
                  {((form.distance_km / (form.duration_minutes / 60)) || 0).toFixed(2)} km/h
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 700 }}>Pace</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
                  {((form.duration_minutes / form.distance_km) || 0).toFixed(2)} min/km
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Per-km Splits */}
        {splits.length > 0 && (
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="section-title">
              Per-Kilometer Splits
              <span className="badge badge-lime">{splits.length} km</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Enter split time in seconds for each km (optional)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {splits.map((sp, i) => (
                <div key={i} className="form-group">
                  <label className="form-label">KM {sp.kilometer_number} (sec)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 340"
                    value={sp.split_time}
                    onChange={e => handleSplitChange(i, e.target.value)}
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">Notes</div>
          <textarea
            name="notes"
            className="form-input"
            placeholder="How did the session feel? Any observations…"
            rows={3}
            value={form.notes}
            onChange={handleChange}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.75rem 2rem' }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Session'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => router.push('/sessions')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
