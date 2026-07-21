'use client';
// app/auth/forgot-password/page.js
import { useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setResetLink('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      // In development, the API returns the reset link
      if (response.resetLink) {
        setResetLink(response.resetLink);
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div className="logo-text" style={{ fontSize: '1.6rem' }}>APTS</div>
          <Link href="/" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Home
          </Link>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-sub">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <div>
            <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
              ✅ Password reset link has been sent to your email.
              <br />
              <span style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-muted)', 
                display: 'block', 
                marginTop: '0.5rem' 
              }}>
                Please check your inbox and spam folder.
              </span>
            </div>

            {/* Show reset link in development */}
            {resetLink && process.env.NODE_ENV === 'development' && (
              <div className="card" style={{ 
                background: 'var(--bg-3)', 
                marginBottom: '1rem',
                padding: '1rem',
                borderRadius: 'var(--radius)'
              }}>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)',
                  marginBottom: '0.5rem'
                }}>
                  📋 Development Reset Link:
                </p>
                <a 
                  href={resetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: 'var(--accent)',
                    wordBreak: 'break-all',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {resetLink}
                </a>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link href="/auth/login" className="btn btn-primary">
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  marginTop: '0.5rem',
                  justifyContent: 'center',
                  padding: '0.75rem'
                }}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="divider" />

            <p style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem'
            }}>
              Remember your password?{' '}
              <Link href="/auth/login" style={{
                color: 'var(--accent)',
                fontWeight: 600
              }}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}