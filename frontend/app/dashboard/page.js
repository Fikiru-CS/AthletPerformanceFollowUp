'use client';
// app/dashboard/page.js
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const fmt = (n, d = 1) => n != null ? Number(n).toFixed(d) : '–';

function StatCard({ label, value, unit, accentColor }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.25rem' }}>
        <span className="stat-value" style={{ color: accentColor || 'var(--text)' }}>{value}</span>
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
        borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '0.8rem'
      }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {fmt(p.value)} {p.unit || ''}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trends,  setTrends]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/trends?days=30'),
    ])
      .then(([s, t]) => {
        setSummary(s.data);
        setTrends(t.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '6rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  const chartData = trends?.daily?.map(d => ({
    date:     d.training_date?.slice(5),
    distance: +Number(d.distance_km).toFixed(2),
    speed:    +Number(d.avg_speed).toFixed(2),
    pace:     +Number(d.avg_pace).toFixed(2),
  })) || [];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
            {greeting()},
          </p>
          <h1 className="page-title">{user?.name?.split(' ')[0]} </h1>
          <p className="page-subtitle">Here's your performance overview</p>
        </div>
        <Link href="/sessions/new" className="btn btn-primary">
          + New Session
        </Link>
      </div>

      {/* Top Stats */}
      {summary && (
        <div className="stat-grid" style={{ marginBottom: '2rem' }}>
          <StatCard
            label="Total Distance"
            value={fmt(summary.total_distance)}
            unit="km"
            accentColor="var(--accent)"
          />
          <StatCard
            label="Sessions"
            value={summary.total_sessions}
          />
          <StatCard
            label="Avg Speed"
            value={fmt(summary.avg_speed)}
            unit="km/h"
            accentColor="var(--blue)"
          />
          <StatCard
            label="Best Pace"
            value={fmt(summary.best_pace)}
            unit="min/km"
            accentColor="var(--success)"
          />
          <StatCard
            label="This Week"
            value={fmt(summary.weekly_distance)}
            unit="km"
          />
          <StatCard
            label="This Month"
            value={fmt(summary.monthly_distance)}
            unit="km"
          />
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>

        {/* Distance Chart */}
        <div className="card">
          <div className="section-title">
            <span>Distance Over Time</span>
            <span className="badge badge-lime">30 days</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#c6f135" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#c6f135" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="distance" stroke="#c6f135" strokeWidth={2} fill="url(#distGrad)" name="Distance" unit="km" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '3rem 1rem' }}>
              <p>No data yet. Log a session!</p>
            </div>
          )}
        </div>

        {/* Speed Chart */}
        <div className="card">
          <div className="section-title">
            <span>Speed Trend</span>
            <span className="badge badge-blue">30 days</span>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="speed" stroke="#4facfe" strokeWidth={2} dot={false} name="Speed" unit="km/h" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '3rem 1rem' }}>
              <p>No data yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Sessions */}
      {trends?.top5?.length > 0 && (
        <div className="card">
          <div className="section-title">Top 5 Fastest Sessions</div>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Distance</th>
                  <th>Speed</th>
                  <th>Pace</th>
                </tr>
              </thead>
              <tbody>
                {trends.top5.map((s, i) => (
                  <tr key={s.id}>
                    <td>
                      <span className={`badge ${i === 0 ? 'badge-lime' : i === 1 ? 'badge-blue' : 'badge-green'}`}>
                        #{i + 1}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {s.training_date}
                    </td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>
                      {fmt(s.distance_km)} km
                    </td>
                    <td style={{ color: 'var(--blue)' }}>
                      {fmt(s.avg_speed)} km/h
                    </td>
                    <td>{fmt(s.avg_pace)} min/km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
