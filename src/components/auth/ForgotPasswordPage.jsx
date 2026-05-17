import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useArthaStore } from '../../store/arthaStore';
import { api } from '../../lib/api';
import ParticleBackground from '../ParticleBackground';

function OTPBox({ value, onChange, onKeyDown, inputRef, filled, error }) {
  return (
    <input
      ref={inputRef}
      className={`otp-input ${filled ? 'filled' : ''} ${error ? 'error' : ''}`}
      type="text" inputMode="numeric" maxLength={1} value={value}
      onChange={onChange} onKeyDown={onKeyDown} style={{ textAlign: 'center' }}
    />
  );
}

export default function ForgotPasswordPage() {
  const setAuthStep = useArthaStore(s => s.setAuthStep);
  const [step, setStep] = useState(1); // 1: email, 2: OTP + new password, 3: success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refs = useRef([]);

  const handleOTPChange = (i, val) => {
    const v = val.replace(/\D/g, '');
    if (!v) return;
    const next = [...otp]; next[i] = v[v.length - 1]; setOtp(next);
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (otp[i]) { const next = [...otp]; next[i] = ''; setOtp(next); }
      else if (i > 0) refs.current[i - 1]?.focus();
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

  const handleSendOTP = async () => {
    if (!email) return;
    setLoading(true); setError('');
    try {
      await api.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`, {});
      setStep(2);
    } catch (err) {
      setError(err.message || 'Email not found');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPass !== confirmPass) { setError('Passwords do not match'); return; }
    if (newPass.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', {
        email, otp: otp.join(''), new_password: newPass,
      });
      setStep(3);
    } catch (err) {
      setError(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', background: '#0A0A0A' }}>
      <ParticleBackground />
      <div className="scan-grid" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: 440, padding: '40px 32px', position: 'relative', zIndex: 2 }}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔐</div>
                <h1 style={{ fontFamily: 'Orbitron', fontSize: '1.3rem', color: '#F5F5F5', marginBottom: 6 }}>Forgot Password</h1>
                <p style={{ fontFamily: 'Syne', fontSize: '0.82rem', color: '#666' }}>Enter your email to receive a reset OTP</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: 6 }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                    <input className="artha-input" style={{ paddingLeft: 40 }} type="email"
                      placeholder="yourname@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.25)', borderRadius: 8 }}>
                    <AlertCircle size={14} color="#FF3355" />
                    <span style={{ fontFamily: 'Syne', fontSize: '0.78rem', color: '#FF3355' }}>{error}</span>
                  </div>
                )}
                <button className="btn-primary" onClick={handleSendOTP} disabled={!email || loading}>
                  {loading ? <><div className="spinner" /> Sending OTP...</> : '📨 SEND RESET OTP'}
                </button>
                <div style={{ textAlign: 'center', fontFamily: 'Syne', fontSize: '0.8rem', color: '#FF6B00', cursor: 'pointer' }} onClick={() => setAuthStep('signin')}>
                  ← Back to Sign In
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔑</div>
                <h1 style={{ fontFamily: 'Orbitron', fontSize: '1.2rem', color: '#F5F5F5', marginBottom: 6 }}>Enter OTP & New Password</h1>
                <p style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#666' }}>OTP sent to {email}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* OTP */}
                <div>
                  <label style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: 8 }}>6-Digit OTP</label>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handlePaste}>
                    {otp.map((v, i) => (
                      <OTPBox key={i} value={v} filled={v !== ''} error={!!error}
                        onChange={e => handleOTPChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        inputRef={el => (refs.current[i] = el)} />
                    ))}
                  </div>
                </div>
                {/* New password */}
                <div>
                  <label style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: 6 }}>New Password</label>
                  <input className="artha-input" type="password" placeholder="New strong password"
                    value={newPass} onChange={e => setNewPass(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: 6 }}>Confirm Password</label>
                  <input className={`artha-input ${confirmPass && newPass !== confirmPass ? 'error' : ''}`} type="password"
                    placeholder="Confirm new password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                </div>
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.25)', borderRadius: 8 }}>
                    <AlertCircle size={14} color="#FF3355" />
                    <span style={{ fontFamily: 'Syne', fontSize: '0.78rem', color: '#FF3355' }}>{error}</span>
                  </div>
                )}
                <button className="btn-primary" onClick={handleResetPassword}
                  disabled={otp.join('').length < 6 || !newPass || newPass !== confirmPass || loading}>
                  {loading ? <><div className="spinner" /> Resetting...</> : '✅ RESET PASSWORD'}
                </button>
                <div style={{ textAlign: 'center', fontFamily: 'Syne', fontSize: '0.8rem', color: '#FF6B00', cursor: 'pointer' }} onClick={() => setStep(1)}>
                  ← Back
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.2rem', color: '#00FF88', marginBottom: 8 }}>Password Reset!</h2>
              <p style={{ fontFamily: 'Syne', color: '#888', marginBottom: 24 }}>Your password has been updated successfully.</p>
              <button className="btn-primary" onClick={() => setAuthStep('signin')}>🔑 Sign In Now</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
