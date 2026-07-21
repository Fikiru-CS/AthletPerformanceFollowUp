'use client';
// app/auth/register/page.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const router       = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: OTP Verification
  
  // OTP states
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    // Clear errors when user types
    if (error) setError('');
  };

  const isValidEmailFormat = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // ── Step 1: Validate form and send OTP ──────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    // Validate name
    if (!form.name || form.name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    // Validate email format
    if (!isValidEmailFormat(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate password
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    // Send OTP to email
    setOtpLoading(true);
    try {
      // Call backend to send OTP
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setStep(2);
        setTimer(60);
        setCanResend(false);
        setError('📧 Verification code sent to your email!');
        
        // Start countdown
        startTimer(60);
      } else {
        setError(data.error || 'Failed to send verification code.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Send OTP error:', err);
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Timer for OTP resend ─────────────────────────────────────
  const startTimer = (duration) => {
    let countdown = duration;
    setTimer(countdown);
    setCanResend(false);

    const interval = setInterval(() => {
      countdown--;
      setTimer(countdown);
      if (countdown <= 0) {
        clearInterval(interval);
        setCanResend(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  // ── Resend OTP ──────────────────────────────────────────────
  const handleResendOTP = async () => {
    if (!canResend) return;

    setOtpError('');
    setOtpLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });

      const data = await response.json();

      if (response.ok) {
        setTimer(60);
        setCanResend(false);
        startTimer(60);
        setError('📧 New verification code sent!');
      } else {
        setOtpError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setOtpError('Network error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (!otpCode || otpCode.length < 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          otp: otpCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        setError('✅ Email verified successfully! Creating account...');
        
        // Now register the user
        setLoading(true);
        try {
          await register(form.name, form.email, form.password);
          router.push('/dashboard');
        } catch (err) {
          setError(err.response?.data?.error || 'Registration failed. Please try again.');
          setLoading(false);
        }
      } else {
        setOtpError(data.error || 'Invalid verification code. Please try again.');
      }
    } catch (err) {
      setOtpError('Network error. Please try again.');
      console.error('Verify OTP error:', err);
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Render OTP Input with auto-focus ────────────────────────
  useEffect(() => {
    if (step === 2 && otpSent) {
      // Focus on first OTP input
      const firstInput = document.getElementById('otp-input');
      if (firstInput) firstInput.focus();
    }
  }, [step, otpSent]);

  // ── Render ──────────────────────────────────────────────────
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
            Back
          </Link>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="auth-title">
            {step === 1 ? 'Create account' : 'Verify your email'}
          </h1>
          <p className="auth-sub">
            {step === 1 
              ? 'Start tracking your performance today' 
              : `We sent a code to ${form.email}`
            }
          </p>
        </div>

        {error && (
          <div className={`alert ${error.includes('✅') ? 'alert-success' : 'alert-error'}`} 
               style={{ marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          // ── STEP 1: Registration Form ──────────────────────────
          <form onSubmit={handleSendOTP} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem' 
          }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Alex Runner"
                value={form.name}
                onChange={handleChange}
                required
                minLength="2"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
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
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirm"
                className="form-input"
                placeholder="Confirm your password"
                value={form.confirm}
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
              disabled={otpLoading}
            >
              {otpLoading ? (
                <span className="spinner" style={{ width: 18, height: 18 }} />
              ) : (
                'Continue → Verify Email'
              )}
            </button>
          </form>
        ) : (
          // ── STEP 2: OTP Verification ────────────────────────────
          <form onSubmit={handleVerifyOTP} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem' 
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <p style={{ 
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                Enter the 6-digit verification code sent to:
                <br />
                <strong style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                  {form.email}
                </strong>
              </p>

              <input
                id="otp-input"
                type="text"
                className="form-input"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) {
                    setOtpCode(value);
                    setOtpError('');
                  }
                }}
                style={{
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  letterSpacing: '8px',
                  maxWidth: '250px',
                  margin: '0 auto',
                  padding: '0.75rem'
                }}
                maxLength="6"
                required
              />

              {otpError && (
                <div className="alert alert-error" style={{ width: '100%' }}>
                  ⚠ {otpError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="btn btn-ghost"
                  disabled={!canResend}
                  style={{ fontSize: '0.85rem' }}
                >
                  {!canResend ? `Resend in ${timer}s` : '📧 Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ 
                  width: '100%',
                  justifyContent: 'center', 
                  padding: '0.75rem',
                  marginTop: '0.5rem'
                }}
                disabled={otpLoading || otpCode.length < 6}
              >
                {otpLoading ? (
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  '✅ Verify & Create Account'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-ghost"
                style={{ fontSize: '0.85rem' }}
              >
                ← Change email
              </button>
            </div>
          </form>
        )}

        <div className="divider" />
        
        <p style={{ 
          textAlign: 'center', 
          color: 'var(--text-muted)', 
          fontSize: '0.875rem' 
        }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ 
            color: 'var(--accent)', 
            fontWeight: 600 
          }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}