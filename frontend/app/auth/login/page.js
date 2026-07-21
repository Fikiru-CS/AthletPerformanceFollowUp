'use client';
// app/auth/login/page.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router    = useRouter();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Header with Logo and Back link */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div className="logo-text" style={{ fontSize: '1.6rem' }}>APTS</div>
          <Link href="/" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Back
          </Link>
        </div>

        {/* Title Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your athlete account</p>
        </div>

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
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.25rem'
            }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link 
                href="/auth/forgot-password" 
                style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
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
              'Sign In'
            )}
          </button>
        </form>

        <div className="divider" />
        
        <p style={{
          textAlign: 'center', 
          color: 'var(--text-muted)', 
          fontSize: '0.875rem'
        }}>
          Don't have an account?{' '}
          <Link href="/auth/register" style={{
            color: 'var(--accent)', 
            fontWeight: 600
          }}>
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
}