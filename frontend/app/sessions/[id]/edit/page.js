'use client';
// app/sessions/[id]/edit/page.js
// Loads an existing session and lets the athlete update all fields.
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../../lib/api';

export default function EditSessionPage() {
  const { id }  = useParams();
  const router  = useRouter();

  const [form, setForm] = useState({
    title: '', start_point: '', end_point: '',
    distance_km: '', duration_minutes: '', altitude: '',
    temperature: '', training_date: '', notes: '',
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  // ── Load existing session ────────────────────────────────
  useEffect(() => {
    api.get(`/sessions/${id}`)
      .then(r => {
        const s = r.data;
        setForm({
          title:            s.title            || '',
          start_point:      s.start_point      || '',
          end_point:        s.end_point        || '',
          distance_km:      s.distance_km      || '',
          duration_minutes: s.duration_minutes || '',
          altitude:         s.altitude         || '',
          temperature:      s.temperature      || '',
          // date comes back as "2024-03-15T00:00:00.000Z", slice to "YYYY-MM-DD"
          training_date:    s.training_date
            ? s.training_date.slice(0, 10)
            : '',
          notes:            s.notes            || '',
        });
      })
      .catch(() => router.push('/sessions'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // ── Preview calculated metrics ───────────────────────────
  const previewSpeed = form.distance_km && form.duration_minutes
    ? (Number(form.distance_km) / (Number(form.duration_minutes) / 60)).toFixed(2)
    : null;
  const previewPace = form.distance_km && form.duration_minutes
    ? (Number(form.duration_minutes) / Number(form.distance_km)).toFixed(2)
    : null;

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put(`/sessions/${id}`, {
        ...form,
        distance_km:      Number(form.distance_km),
        duration_minutes: Number(form.duration_minutes),
        altitude:    form.altitude    ? Number(form.altitude)    : null,
        temperature: form.temperature ? Number(form.temperature) : null,
      });
      setSuccess(true);
      setTimeout(() => router.push(`/sessions/${id}`), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update session.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '5rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <Link
            href={`/sessions/${id}`}
            style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
          >
            ← Back to Session
          </Link>
          <h1 className="page-title" style={{ marginTop: '0.4rem' }}>Edit Session</h1>
          <p className="page-subtitle">Update your training record</p>
        </div>
      </div>

      {/* Alerts */}
      {error   && <div className="alert alert-error"   style={{ marginBottom: '1.25rem' }}>⚠ {error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>✓ Session updated! Redirecting…</div>}

      <form onSubmit={handleSubmit}>

        {/* ── Basic Info ─────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-title">Basic Info</div>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Session Title</label>
              <input
                name="title"
                className="form-input"
                placeholder="e.g. Morning Run – Addis Ababa"
                value={form.title}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Start Point</label>
              <input
                name="start_point"
                className="form-input"
                placeholder="e.g. Bole, Addis Ababa"
                value={form.start_point}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Point</label>
              <input
                name="end_point"
                className="form-input"
                placeholder="e.g. Meskel Square"
                value={form.end_point}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Training Date *</label>
              <input
                type="date"
                name="training_date"
                className="form-input"
                value={form.training_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* ── Performance Metrics ────────────────────────── */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-title">Performance Metrics</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Distance (km) *</label>
              <input
                type="number"
                name="distance_km"
                className="form-input"
                placeholder="10.5"
                step="0.01"
                min="0"
                value={form.distance_km}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes) *</label>
              <input
                type="number"
                name="duration_minutes"
                className="form-input"
                placeholder="65"
                step="0.1"
                min="0"
                value={form.duration_minutes}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Altitude (m)</label>
              <input
                type="number"
                name="altitude"
                className="form-input"
                placeholder="2355"
                step="1"
                value={form.altitude}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Temperature (°C)</label>
              <input
                type="number"
                name="temperature"
                className="form-input"
                placeholder="18"
                step="0.5"
                value={form.temperature}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Live calculation preview */}
          {previewSpeed && (
            <div style={{
              marginTop: '1rem',
              padding: '0.85rem 1rem',
              background: 'var(--accent-dim)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--accent-glow)',
              display: 'flex',
              gap: '2.5rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              <div>
                <div style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  marginBottom: '0.2rem',
                }}>
                  Calculated Avg Speed
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
                  {previewSpeed} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>km/h</span>
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--accent)',
                  fontWeight: 700,
                  marginBottom: '0.2rem',
                }}>
                  Calculated Pace
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
                  {previewPace} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>min/km</span>
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                Auto-calculated on save
              </div>
            </div>
          )}
        </div>

        {/* ── Notes ─────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">Notes</div>
          <textarea
            name="notes"
            className="form-input"
            placeholder="How did the session feel? Any observations…"
            rows={4}
            value={form.notes}
            onChange={handleChange}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* ── Actions ───────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ padding: '0.75rem 2rem' }}
          >
            {saving
              ? <span className="spinner" style={{ width: 18, height: 18 }} />
              : 'Save Changes'}
          </button>
          <Link
            href={`/sessions/${id}`}
            className="btn btn-secondary"
          >
            Cancel
          </Link>
        </div>

      </form>
    </div>
  );
}
