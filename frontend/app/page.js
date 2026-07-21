'use client';
// app/page.js  –  Public Homepage
// Shows a landing page to visitors. If already logged in, shows a "Go to Dashboard" button.
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';

// ── Small reusable components ────────────────────────────────

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="hp-feature-card">
      <div className="hp-feature-icon">{icon}</div>
      <h3 className="hp-feature-title">{title}</h3>
      <p className="hp-feature-desc">{desc}</p>
    </div>
  );
}

function StatPill({ value, label }) {
  return (
    <div className="hp-stat-pill">
      <span className="hp-stat-value">{value}</span>
      <span className="hp-stat-label">{label}</span>
    </div>
  );
}

function StepCard({ number, title, desc }) {
  return (
    <div className="hp-step-card">
      <div className="hp-step-number">{number}</div>
      <div>
        <div className="hp-step-title">{title}</div>
        <div className="hp-step-desc">{desc}</div>
      </div>
    </div>
  );
}

// ── Main Homepage ────────────────────────────────────────────
export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="hp-root">

      {/* ── NAVBAR ──────────────────────────────────────── */}
      <nav className="hp-nav">
        <div className="hp-nav-inner">
          <div className="hp-nav-logo">
            <span className="hp-logo-text">APTS</span>
            <span className="hp-logo-dot" />
          </div>
          <div className="hp-nav-links">
            <a href="#features" className="hp-nav-link">Features</a>
            <a href="#how"      className="hp-nav-link">How It Works</a>
            <a href="#stats"    className="hp-nav-link">Stats</a>
          </div>
          <div className="hp-nav-cta">
            {!loading && (
              user ? (
                <Link href="/dashboard" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/auth/login"    className="btn btn-ghost"   style={{ padding: '0.5rem 1rem' }}>Sign In</Link>
                  <Link href="/auth/register" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem' }}>Register</Link>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="hp-hero">
        {/* Background glow orbs */}
        <div className="hp-orb hp-orb-1" />
        <div className="hp-orb hp-orb-2" />
        <div className="hp-orb hp-orb-3" />

        <div className="hp-hero-inner">
          <div className="hp-hero-badge">
            <span className="hp-badge-dot" />
            Athlete Performance Tracking System
          </div>

          <h1 className="hp-hero-title">
            Track Every<br />
            <span className="hp-hero-accent">Kilometer.</span><br />
            Beat Every Record.
          </h1>

          <p className="hp-hero-desc">
            APTS gives athletes a powerful platform to log training sessions,
            analyze performance trends, and visualize progress over time —
            all in one clean, fast dashboard.
          </p>

          <div className="hp-hero-actions">
            {!loading && (
              user ? (
                <Link href="/dashboard" className="btn btn-primary hp-cta-btn">
                  Open Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/auth/register" className="btn btn-primary hp-cta-btn">
                    Start Tracking Free
                  </Link>
                  <Link href="/auth/login" className="btn btn-secondary hp-cta-btn">
                    Sign In
                  </Link>
                </>
              )
            )}
          </div>

          {/* Hero stats row */}
          <div className="hp-hero-stats">
            <StatPill value="km/h"    label="Speed tracking" />
            <StatPill value="min/km"  label="Pace analysis" />
            <StatPill value="splits"  label="Per-KM breakdown" />
            <StatPill value="charts"  label="Visual trends" />
          </div>
        </div>

        {/* Hero mock dashboard card */}
        <div className="hp-hero-mock">
          <div className="hp-mock-card">
            <div className="hp-mock-header">
              <span className="hp-mock-title">Today's Session</span>
              <span className="hp-mock-badge">Live</span>
            </div>
            <div className="hp-mock-stats">
              <div className="hp-mock-stat">
                <span className="hp-mock-val" style={{ color: 'var(--accent)' }}>12.4</span>
                <span className="hp-mock-lbl">km</span>
              </div>
              <div className="hp-mock-divider" />
              <div className="hp-mock-stat">
                <span className="hp-mock-val" style={{ color: 'var(--blue)' }}>14.2</span>
                <span className="hp-mock-lbl">km/h</span>
              </div>
              <div className="hp-mock-divider" />
              <div className="hp-mock-stat">
                <span className="hp-mock-val" style={{ color: 'var(--success)' }}>4.22</span>
                <span className="hp-mock-lbl">min/km</span>
              </div>
            </div>
            {/* Mock chart bars */}
            <div className="hp-mock-chart">
              {[40, 65, 55, 80, 60, 90, 70, 85, 75, 95, 65, 88].map((h, i) => (
                <div
                  key={i}
                  className="hp-mock-bar"
                  style={{
                    height: `${h}%`,
                    background: i === 10
                      ? 'var(--accent)'
                      : `rgba(198,241,53,${0.15 + (h / 100) * 0.4})`,
                  }}
                />
              ))}
            </div>
            <div className="hp-mock-footer">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Distance over last 12 sessions</span>
              <span style={{ color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 600 }}>↑ 18% this month</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section className="hp-section" id="features">
        <div className="hp-section-inner">
          <div className="hp-section-header">
            <div className="hp-section-tag">Features</div>
            <h2 className="hp-section-title">Everything you need to<br />perform at your best</h2>
            <p className="hp-section-sub">Built specifically for athletes who take their training seriously.</p>
          </div>

          <div className="hp-features-grid">
            <FeatureCard
              icon="📊"
              title="Performance Dashboard"
              desc="See total distance, average speed, best pace, and weekly summaries at a glance on your personal dashboard."
            />
            <FeatureCard
              icon="🏃"
              title="Session Logging"
              desc="Record every detail — distance, duration, route, altitude, temperature and optional per-kilometer splits."
            />
            <FeatureCard
              icon="⚡"
              title="Auto Calculations"
              desc="Average speed and pace are calculated automatically. Just enter distance and time — APTS does the math."
            />
            <FeatureCard
              icon="📈"
              title="Trend Analysis"
              desc="Interactive charts show your distance, speed, and pace over time. Filter by 7, 30, or 90 days."
            />
            <FeatureCard
              icon="🔐"
              title="Secure & Private"
              desc="JWT authentication with bcrypt-hashed passwords. Your training data is private and belongs only to you."
            />
            <FeatureCard
              icon="📱"
              title="Fully Responsive"
              desc="Works beautifully on desktop, tablet, and mobile. Train anywhere, log anywhere."
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section className="hp-section hp-section-alt" id="how">
        <div className="hp-section-inner">
          <div className="hp-section-header">
            <div className="hp-section-tag">How It Works</div>
            <h2 className="hp-section-title">Up and running in minutes</h2>
            <p className="hp-section-sub">Three simple steps to start tracking your athletic performance.</p>
          </div>

          <div className="hp-steps-grid">
            <StepCard
              number="01"
              title="Create your account"
              desc="Register with your name and email. No credit card needed. Your personal athlete profile is ready instantly."
            />
            <div className="hp-steps-arrow">→</div>
            <StepCard
              number="02"
              title="Log your first session"
              desc="Enter your distance, duration, and optional details like route, altitude, and temperature. APTS calculates the rest."
            />
            <div className="hp-steps-arrow">→</div>
            <StepCard
              number="03"
              title="Analyze your progress"
              desc="Visit the Analytics page to see charts, trends, and weekly breakdowns. Watch your performance improve over time."
            />
          </div>
        </div>
      </section>

      {/* ── STATS SHOWCASE ──────────────────────────────── */}
      <section className="hp-section" id="stats">
        <div className="hp-section-inner">
          <div className="hp-section-header">
            <div className="hp-section-tag">Track Everything</div>
            <h2 className="hp-section-title">Every metric that matters</h2>
            <p className="hp-section-sub">APTS captures and calculates the key numbers that define athletic performance.</p>
          </div>

          <div className="hp-metrics-grid">
            {[
              { metric: 'Distance',     unit: 'km',     color: 'var(--accent)', desc: 'Total and per-session distance tracked precisely' },
              { metric: 'Speed',        unit: 'km/h',   color: 'var(--blue)',   desc: 'Average speed auto-calculated from your inputs' },
              { metric: 'Pace',         unit: 'min/km', color: 'var(--success)',desc: 'Per-kilometer pace with trend comparison' },
              { metric: 'Splits',       unit: '/km',    color: 'var(--accent)', desc: 'Individual split times for each kilometer' },
              { metric: 'Altitude',     unit: 'm',      color: 'var(--blue)',   desc: 'Elevation data for hilly or mountain routes' },
              { metric: 'Temperature',  unit: '°C',     color: 'var(--warning)',desc: 'Training condition context for better analysis' },
            ].map(m => (
              <div key={m.metric} className="hp-metric-card">
                <div className="hp-metric-name" style={{ color: m.color }}>{m.metric}</div>
                <div className="hp-metric-unit">{m.unit}</div>
                <div className="hp-metric-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────── */}
      <section className="hp-cta-section">
        <div className="hp-cta-inner">
          <div className="hp-orb hp-orb-cta" />
          <h2 className="hp-cta-title">Ready to level up your training?</h2>
          <p className="hp-cta-sub">
            Join athletes already using APTS to track, analyze, and improve their performance.
          </p>
          {!loading && (
            user ? (
              <Link href="/dashboard" className="btn btn-primary hp-cta-btn">
                Go to Dashboard →
              </Link>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/auth/register" className="btn btn-primary hp-cta-btn">
                  Create Free Account
                </Link>
                <Link href="/auth/login" className="btn btn-secondary hp-cta-btn">
                  Sign In
                </Link>
              </div>
            )
          )}
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-brand">
            <span className="hp-logo-text">APTS</span>
            <span className="hp-footer-sub">Athlete Performance Tracking System</span>
          </div>
          <div className="hp-footer-links">
            <Link href="/auth/login"    className="hp-footer-link">Sign In</Link>
            <Link href="/auth/register" className="hp-footer-link">Register</Link>
            <Link href="/dashboard"     className="hp-footer-link">Dashboard</Link>
          </div>
          <div className="hp-footer-copy">
            Built with Next.js · Express · PostgreSQL
          </div>
        </div>
      </footer>

    </div>
  );
}