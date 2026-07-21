'use client';
// app/profile/page.js
// Shows athlete stats summary and lets them update name/bio.
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import api from '../../lib/api';
import Sidebar from '../../components/layout/Sidebar';
import { useRouter } from 'next/navigation';

function ProfileContent() {
  const { user, loading: authLoading } = useAuth();
  const [form,    setForm]    = useState({ name: '', bio: '' });
  const [summary, setSummary] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  // Pre-fill form when user loads
  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', bio: user.bio || '' });
    }
  }, [user]);

  // Load analytics summary for the stats panel
  useEffect(() => {
    api.get('/analytics/summary')
      .then(r => setSummary(r.data))
      .catch(() => {});
  }, []);

  const handleChange = e =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n, d = 1) => (n != null ? Number(n).toFixed(d) : '–');

  // Avatar initials
  const initials = (user?.name || 'A')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your athlete account</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Left: Edit Form ───────────────────────────── */}
        <div>

          {/* Avatar + identity */}
          <div className="card" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Large avatar */}
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--blue))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.5rem',
              color: '#0a0c10',
              flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>
                {user?.name}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
                {user?.email}
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <span className="badge badge-lime">Athlete</span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                Member since
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
                  : '–'}
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="card">
            <div className="section-title">Edit Profile</div>

            {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>⚠ {error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>✓ Profile updated successfully!</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  name="name"
                  className="form-input"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Email cannot be changed
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea
                  name="bio"
                  className="form-input"
                  placeholder="Tell us about yourself — your goals, favourite distances, etc."
                  rows={4}
                  value={form.bio}
                  onChange={handleChange}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ padding: '0.65rem 1.75rem' }}
                >
                  {saving
                    ? <span className="spinner" style={{ width: 16, height: 16 }} />
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Right: Stats Sidebar ──────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="section-title">Career Stats</div>
            {summary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Total Distance', value: fmt(summary.total_distance), unit: 'km',     accent: 'var(--accent)' },
                  { label: 'Total Sessions', value: summary.total_sessions,      unit: 'runs',   accent: 'var(--text)' },
                  { label: 'Avg Speed',      value: fmt(summary.avg_speed),      unit: 'km/h',   accent: 'var(--blue)' },
                  { label: 'Best Pace',      value: fmt(summary.best_pace),      unit: 'min/km', accent: 'var(--success)' },
                  { label: 'Longest Run',    value: fmt(summary.longest_run),    unit: 'km',     accent: 'var(--text)' },
                  { label: 'Top Speed',      value: fmt(summary.fastest_speed),  unit: 'km/h',   accent: 'var(--text)' },
                ].map(s => (
                  <div key={s.label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.label}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: s.accent }}>
                      {s.value}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.25rem' }}>
                        {s.unit}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            )}
          </div>

          {/* Account info box */}
          <div className="card" style={{ background: 'var(--bg-3)' }}>
            <div className="section-title">Account Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { label: 'Role',     value: 'Athlete' },
                { label: 'Auth',     value: 'JWT / bcrypt' },
                { label: 'Status',   value: 'Active' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.label}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Page wrapper (auth guard + layout) ───────────────────────
export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        <ProfileContent />
      </main>
    </div>
  );
}
