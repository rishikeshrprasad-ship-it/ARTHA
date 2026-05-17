import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useArthaStore } from '../../store/arthaStore';
import { api, setToken, setUser } from '../../lib/api';
import ParticleBackground from '../ParticleBackground';

function OTPBox({ value, onChange, onKeyDown, inputRef, filled, error }) {
  return (
    <input
      ref={inputRef}
      className={`otp-input ${filled ? 'filled' : ''} ${error ? 'error' : ''}`}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      style={{ textAlign: 'center' }}
    />
  );
}

export default function VerifyPage() {
  const setAuthStep = useArthaStore(s => s.setAuthStep);
  const signIn = useArthaStore(s => s.signIn);
  const pendingMobile = useArthaStore(s => s.pendingMobile);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendCount, setResendCount] = useState(3);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, '');
    if (!v) return;
    const next = [...otp];
    next[i] = v[v.length - 1];
    setOtp(next);
    setError('');
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (otp[i]) {
        const next = [...otp]; next[i] = ''; setOtp(next);
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    refs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/auth/verify-otp', {
        email: pendingMobile,
        otp: code,
      });
      setToken(data.token);
      setUser(data.user);
      setSuccess(true);
      setTimeout(() => {
        signIn({ token: data.token, user: data.user });
        setAuthStep('onboarding');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendCount <= 0) return;
    try {
      const res = await api.post(`/auth/resend-otp?email=${pendingMobile}`, {});
      if (res.dev_otp) alert(`[DEMO MODE] Your New OTP is: ${res.dev_otp}`);
      setResendCount(c => c - 1);
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    }
  };

  // Dev mode: if no backend, allow demo OTP 123456
  const handleVerifyWithFallback = async () => {
    const code = otp.join('');
    if (code === '123456' && !pendingMobile) {
      setSuccess(true);
      setTimeout(() => {
        signIn({ user: { name: 'Demo Trader', email: 'demo@artha.in' } });
        setAuthStep('onboarding');
      }, 1500);
      return;
    }
    await handleVerify();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', background: '#0A0A0A' }}>
      <ParticleBackground />
      <div className="scan-grid" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: 420, padding: '40px 32px', position: 'relative', zIndex: 2, textAlign: 'center' }}
      >
        {success ? (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: 'Orbitron', color: '#00FF88', fontSize: '1.2rem', marginBottom: 8 }}>Number Verified!</h2>
            <p style={{ fontFamily: 'Syne', color: '#888' }}>Welcome to ARTHA! Setting up your account...</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              style={{ fontSize: '3.5rem', marginBottom: 20 }}
            >
              📱
            </motion.div>

            <h1 style={{ fontFamily: 'Orbitron', fontSize: '1.3rem', color: '#F5F5F5', marginBottom: 8 }}>
              Verify Your Email
            </h1>
            <p style={{ fontFamily: 'Syne', fontSize: '0.82rem', color: '#666', marginBottom: 6 }}>
              We sent a 6-digit OTP to
            </p>
            <p style={{ fontFamily: 'JetBrains Mono', color: '#FF6B00', fontSize: '0.9rem', marginBottom: 28 }}>
              {pendingMobile || '••••••••••'}
            </p>

            {/* OTP Boxes */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }} onPaste={handlePaste}>
              {otp.map((v, i) => (
                <OTPBox
                  key={i}
                  value={v}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  inputRef={el => (refs.current[i] = el)}
                  filled={v !== ''}
                  error={!!error}
                />
              ))}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#FF3355', marginBottom: 12 }}
              >
                ❌ {error}
              </motion.p>
            )}

            {!pendingMobile && (
              <p style={{ fontFamily: 'Syne', fontSize: '0.75rem', color: '#555', marginBottom: 12 }}>
                Demo: use <span style={{ color: '#FF6B00', fontFamily: 'JetBrains Mono' }}>123456</span>
              </p>
            )}

            <button
              id="verify-btn"
              className="btn-primary"
              style={{ width: '100%', marginBottom: 16 }}
              onClick={handleVerifyWithFallback}
              disabled={otp.join('').length < 6 || loading}
            >
              {loading ? <><div className="spinner" /> Verifying...</> : '✅ VERIFY EMAIL'}
            </button>

            <div style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#666' }}>
              Didn't receive it?{' '}
              {canResend && resendCount > 0 ? (
                <span style={{ color: '#FF6B00', cursor: 'pointer', fontWeight: 600 }} onClick={handleResend}>
                  Resend OTP
                </span>
              ) : (
                <span style={{ color: '#444' }}>Resend in {countdown}s</span>
              )}
            </div>

            {resendCount < 3 && (
              <p style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#555', marginTop: 6 }}>
                {resendCount} resend {resendCount === 1 ? 'attempt' : 'attempts'} remaining
              </p>
            )}

            <div
              style={{ marginTop: 20, fontFamily: 'Syne', fontSize: '0.8rem', color: '#FF6B00', cursor: 'pointer' }}
              onClick={() => setAuthStep('signup')}
            >
              ← Change Email Address
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
