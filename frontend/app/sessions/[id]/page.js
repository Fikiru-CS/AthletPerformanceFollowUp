'use client';
// app/sessions/[id]/page.js
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (n, d = 1) => n != null ? Number(n).toFixed(d) : '–';

export default function SessionDetailPage() {
  const { id }  = useParams();
  const router  = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/sessions/${id}`)
      .then(r => setSession(r.data))
      .catch(() => router.push('/sessions'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <div className="spinner" />
    </div>
  );
  if (!session) return null;

  const splitsData = (session.splits || []).map(s => ({
    km:    `KM ${s.kilometer_number}`,
    time:  Number(s.split_time),
    speed: Number(s.split_speed),
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/sessions" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>← Back to Sessions</Link>
          <h1 className="page-title" style={{ marginTop: '0.4rem' }}>
            {session.title || `Session – ${session.training_date}`}
          </h1>
          {(session.start_point || session.end_point) && (
            <p className="page-subtitle">
              {session.start_point}{session.end_point ? ` → ${session.end_point}` : ''}
            </p>
          )}
        </div>
        <Link href={`/sessions/${id}/edit`} className="btn btn-secondary">Edit</Link>
      </div>

      {/* Metrics */}
      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Distance',  value: fmt(session.distance_km),      unit: 'km',     color: 'var(--accent)' },
          { label: 'Duration',  value: fmt(session.duration_minutes),  unit: 'min',    color: 'var(--text)' },
          { label: 'Avg Speed', value: fmt(session.avg_speed),         unit: 'km/h',   color: 'var(--blue)' },
          { label: 'Avg Pace',  value: fmt(session.avg_pace),          unit: 'min/km', color: 'var(--success)' },
          { label: 'Altitude',  value: session.altitude ? fmt(session.altitude, 0) : '–', unit: 'm', color: 'var(--text)' },
          { label: 'Temp',      value: session.temperature ? fmt(session.temperature, 0) : '–', unit: '°C', color: 'var(--text)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.25rem' }}>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
              <span className="stat-unit">{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Splits Chart */}
      {splitsData.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title">Per-Kilometer Splits</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={splitsData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="km" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-mid)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-muted)' }}
              />
              <Bar dataKey="time" fill="#c6f135" radius={[4, 4, 0, 0]} name="Time (s)" />
            </BarChart>
          </ResponsiveContainer>

          <div className="table-wrapper" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr><th>KM</th><th>Split Time (s)</th><th>Speed (km/h)</th></tr>
              </thead>
              <tbody>
                {session.splits.map(s => (
                  <tr key={s.id}>
                    <td><span className="badge badge-lime">KM {s.kilometer_number}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(s.split_time, 0)}s</td>
                    <td style={{ color: 'var(--blue)' }}>{fmt(s.split_speed)} km/h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes */}
      {session.notes && (
        <div className="card">
          <div className="section-title">Notes</div>
          <p style={{ color: 'var(--text-dim)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{session.notes}</p>
        </div>
      )}
    </div>
  );
}
