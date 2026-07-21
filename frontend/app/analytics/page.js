'use client';
// app/analytics/page.js
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import {
  ComposedChart, Line, Bar, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import Sidebar from '../../components/layout/Sidebar';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from 'next/navigation';

const fmt = (n, d = 1) => n != null ? Number(n).toFixed(d) : '–';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-mid)', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.8rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600, display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <span>{p.name}</span>
          <span>{fmt(p.value)} {p.unit || ''}</span>
        </div>
      ))}
    </div>
  );
};

function PageContent() {
  const [trends,  setTrends]  = useState(null);
  const [summary, setSummary] = useState(null);
  const [days,    setDays]    = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchData = async (d) => {
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        api.get(`/analytics/trends?days=${d}`),
        api.get('/analytics/summary'),
      ]);
      setTrends(t.data);
      setSummary(s.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(days); }, [days]);

  const dailyData = trends?.daily?.map(d => ({
    date:     d.training_date?.slice(5),
    distance: +Number(d.distance_km).toFixed(2),
    speed:    +Number(d.avg_speed).toFixed(2),
    pace:     +Number(d.avg_pace).toFixed(2),
  })) || [];

  const weeklyData = trends?.weekly?.map(w => ({
    week:     w.week_start?.slice(5, 10),
    distance: +Number(w.total_distance).toFixed(2),
    sessions: w.sessions,
    speed:    +Number(w.avg_speed).toFixed(2),
  })) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Performance trends and insights</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={d === days ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '0.4rem 0.9rem' }}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* Summary row */}
          {summary && (
            <div className="stat-grid" style={{ marginBottom: '1.75rem' }}>
              {[
                { label: 'Total Distance',  value: fmt(summary.total_distance),  unit: 'km',     color: 'var(--accent)' },
                { label: 'Total Sessions',  value: summary.total_sessions,        unit: '',       color: 'var(--text)' },
                { label: 'Avg Speed',       value: fmt(summary.avg_speed),        unit: 'km/h',   color: 'var(--blue)' },
                { label: 'Best Pace',       value: fmt(summary.best_pace),        unit: 'min/km', color: 'var(--success)' },
                { label: 'Longest Run',     value: fmt(summary.longest_run),      unit: 'km',     color: 'var(--text)' },
                { label: 'Fastest Speed',   value: fmt(summary.fastest_speed),    unit: 'km/h',   color: 'var(--text)' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.25rem' }}>
                    <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                    {s.unit && <span className="stat-unit">{s.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {dailyData.length === 0 ? (
            <div className="card empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <h3>No data for this period</h3>
              <p>Log more sessions to see trends here.</p>
            </div>
          ) : (
            <>
              {/* Distance + Speed Combined */}
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="section-title">Distance & Speed — Daily</div>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={dailyData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left"  tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
                    <Bar yAxisId="left" dataKey="distance" fill="#c6f135" opacity={0.7} radius={[3,3,0,0]} name="Distance" unit="km" />
                    <Line yAxisId="right" type="monotone" dataKey="speed" stroke="#4facfe" strokeWidth={2} dot={false} name="Speed" unit="km/h" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Pace trend */}
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="section-title">Pace Improvement (lower = faster)</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="paceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} reversed />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="pace" stroke="#34d399" strokeWidth={2} fill="url(#paceGrad)" name="Pace" unit="min/km" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly Summary */}
              {weeklyData.length > 0 && (
                <div className="card">
                  <div className="section-title">Weekly Summary</div>
                  <div className="table-wrapper" style={{ border: 'none' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Week</th>
                          <th>Sessions</th>
                          <th>Total Distance</th>
                          <th>Avg Speed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyData.map((w, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{w.week}</td>
                            <td><span className="badge badge-blue">{w.sessions} runs</span></td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmt(w.distance)} km</td>
                            <td>{fmt(w.speed)} km/h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  if (loading || !user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content"><PageContent /></main>
    </div>
  );
}
