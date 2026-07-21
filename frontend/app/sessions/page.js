'use client';
// app/sessions/page.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';

const fmt = (n, d = 1) => n != null ? Number(n).toFixed(d) : '–';

function formatDuration(minutes) {
  if (!minutes) return '–';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchSessions = async (p = 1) => {
    setLoading(true);
    try {
      const r = await api.get(`/sessions?page=${p}&limit=10`);
      setSessions(r.data.sessions);
      setTotal(r.data.total);
      setPages(r.data.totalPages);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this session?')) return;
    setDeleting(id);
    try {
      await api.delete(`/sessions/${id}`);
      fetchSessions(page);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Training Sessions</h1>
          <p className="page-subtitle">{total} sessions recorded</p>
        </div>
        <Link href="/sessions/new" className="btn btn-primary">
          + New Session
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏃 🏃‍♀️</div>
          <h3>No sessions yet</h3>
          <p style={{ marginBottom: '1.5rem' }}>Record your first training session to get started.</p>
          <Link href="/sessions/new" className="btn btn-primary">Log First Session</Link>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Distance</th>
                  <th>Duration</th>
                  <th>Avg Speed</th>
                  <th>Pace</th>
                  <th>Temp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {s.training_date}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {s.title || `Session`}
                      {s.start_point && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {s.start_point}{s.end_point ? ` → ${s.end_point}` : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        {fmt(s.distance_km)} km
                      </span>
                    </td>
                    <td>{formatDuration(s.duration_minutes)}</td>
                    <td style={{ color: 'var(--blue)' }}>{fmt(s.avg_speed)} km/h</td>
                    <td>{fmt(s.avg_pace)} min/km</td>
                    <td style={{ color: s.temperature < 10 ? 'var(--blue)' : s.temperature > 30 ? 'var(--danger)' : 'var(--text-muted)' }}>
                      {s.temperature != null ? `${fmt(s.temperature, 0)}°C` : '–'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Link
                          href={`/sessions/${s.id}`}
                          className="btn btn-ghost"
                          style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                        >
                          View
                        </Link>
                        <Link
                          href={`/sessions/${s.id}/edit`}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                        >
                          Edit
                        </Link>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }}
                          onClick={() => handleDelete(s.id)}
                          disabled={deleting === s.id}
                        >
                          {deleting === s.id ? '...' : 'Del'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => fetchSessions(p)}
                  className={p === page ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ padding: '0.4rem 0.8rem', minWidth: '2.5rem' }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
