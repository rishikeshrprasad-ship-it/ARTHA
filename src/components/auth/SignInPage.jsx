import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useArthaStore } from '../../store/arthaStore';
import ParticleBackground from '../ParticleBackground';

export default function SignInPage() {
  const setAuthStep = useArthaStore(s => s.setAuthStep);
  const signIn = useArthaStore(s => s.signIn);
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'otp'

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked) return;
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 1400));

    // Demo: any email + password "artha123" works
    if (form.password === 'artha123' || form.email === 'demo@artha.in') {
      signIn({ name: 'Demo Trader', email: form.email });
      setAuthStep('dashboard');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShake(true);
      setTimeout(() => setShake(false), 600);

      if (newAttempts >= 5) {
        setLocked(true);
        let t = 900;
        setLockTimer(t);
        const interval = setInterval(() => {
          t--;
          setLockTimer(t);
          if (t <= 0) { clearInterval(interval); setLocked(false); setAttempts(0); }
        }, 1000);
        setError('Account locked. Too many failed attempts. Try again in 15 minutes.');
      } else {
        setError(`❌ Wrong password. ${5 - newAttempts} attempts remaining before lockout.`);
      }
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
        transition={{ duration: 0.6 }}
        className={`glass-card ${shake ? 'animate-shake' : ''}`}
        style={{ width: '100%', maxWidth: 440, padding: '36px 32px', position: 'relative', zIndex: 2, borderColor: error ? 'rgba(255,51,85,0.4)' : undefined, boxShadow: error ? '0 0 30px rgba(255,51,85,0.2)' : undefined }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ width: 44, height: 44, border: '2px solid #FF6B00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,107,0,0.4)' }}>
              <span style={{ fontFamily: 'Orbitron', fontWeight: 900, color: '#FF6B00', fontSize: 20 }}>A</span>
            </div>
          </div>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: '1.3rem', color: '#F5F5F5', marginBottom: 6 }}>Welcome Back</h1>
          <p style={{ fontFamily: 'Syne', fontSize: '0.82rem', color: '#666' }}>Sign in to your ARTHA account</p>
        </div>

        {/* Tabs */}
        <div className="pill-tabs" style={{ marginBottom: 24 }}>
          <button className={`pill-tab ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')}>
            📧 Email
          </button>
          <button className={`pill-tab ${activeTab === 'otp' ? 'active' : ''}`} onClick={() => setActiveTab('otp')}>
            📱 Mobile OTP
          </button>
          <button className={`pill-tab`} onClick={() => {}}>
            G Google
          </button>
        </div>

        {activeTab === 'email' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: 6 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555', zIndex: 1 }} />
                <input
                  id="signin-email"
                  className="artha-input"
                  style={{ paddingLeft: 40 }}
                  placeholder="yourname@email.com"
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555', zIndex: 1 }} />
                <input
                  id="signin-password"
                  className="artha-input"
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                  placeholder="Your password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', zIndex: 1 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <button type="button" onClick={() => update('remember', !form.remember)} style={{ width: 18, height: 18, borderRadius: 3, border: `1px solid ${form.remember ? '#FF6B00' : 'rgba(255,107,0,0.3)'}`, background: form.remember ? '#FF6B00' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
                  {form.remember && <span style={{ color: '#000', fontSize: '0.65rem', fontWeight: 900 }}>✓</span>}
                </button>
                <span style={{ fontFamily: 'Syne', fontSize: '0.78rem', color: '#777' }}>Remember me for 30 days</span>
              </label>
              <span style={{ fontFamily: 'Syne', fontSize: '0.78rem', color: '#FF6B00', cursor: 'pointer' }} onClick={() => setAuthStep('forgot')}>
                Forgot Password?
              </span>
            </div>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.25)', borderRadius: 8 }}>
                <AlertCircle size={14} color="#FF3355" />
                <span style={{ fontFamily: 'Syne', fontSize: '0.78rem', color: '#FF3355' }}>{error}</span>
              </motion.div>
            )}

            {locked && (
              <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono', color: '#FF3355', fontSize: '0.8rem' }}>
                Lockout ends in: {Math.floor(lockTimer / 60)}:{String(lockTimer % 60).padStart(2, '0')}
              </div>
            )}

            {/* Demo hint */}
            <div style={{ padding: '8px 12px', background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.15)', borderRadius: 6, fontFamily: 'Syne', fontSize: '0.75rem', color: '#888' }}>
              💡 Demo: any email + password <span style={{ color: '#FF6B00', fontFamily: 'JetBrains Mono' }}>artha123</span>
            </div>

            <button id="signin-submit" type="submit" className="btn-primary" style={{ width: '100%' }} disabled={!form.email || !form.password || loading || locked}>
              {loading ? <><div className="spinner" /> Signing you in...</> : '🔑 SIGN IN TO ARTHA'}
            </button>
          </form>
        ) : (
          <MobileOTPLogin />
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontFamily: 'Syne', fontSize: '0.82rem', color: '#666' }}>
          New to ARTHA?{' '}
          <span style={{ color: '#FF6B00', cursor: 'pointer', fontWeight: 600 }} onClick={() => setAuthStep('signup')}>
            Create Account
          </span>
        </div>
      </motion.div>
    </div>
  );
}

function MobileOTPLogin() {
  const signIn = useArthaStore(s => s.signIn);
  const setAuthStep = useArthaStore(s => s.setAuthStep);
  const [mobile, setMobile] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setStep(2);
    setCountdown(60);
    setLoading(false);
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); return 0; } return c - 1; }), 1000);
  };

  const verifyOTP = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    signIn({ name: 'Mobile User', mobile });
    setAuthStep('dashboard');
  };

  const handleOTPChange = (i, val) => {
    const v = val.replace(/\D/g, '');
    if (!v) return;
    const next = [...otp]; next[i] = v[v.length - 1]; setOtp(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {step === 1 ? (
        <>
          <label style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888' }}>Indian Mobile Number</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 8, padding: '0 12px', height: 52 }}>
              <span>🇮🇳</span><span style={{ fontFamily: 'JetBrains Mono', color: '#888', fontSize: '0.9rem' }}>+91</span>
            </div>
            <input className="artha-input" style={{ flex: 1 }} placeholder="9XXXXXXXXX" maxLength={10} value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))} />
          </div>
          <button className="btn-primary" style={{ width: '100%' }} onClick={sendOTP} disabled={mobile.length !== 10 || loading}>
            {loading ? <><div className="spinner" /> Sending...</> : '📲 SEND OTP'}
          </button>
        </>
      ) : (
        <>
          <p style={{ fontFamily: 'Syne', fontSize: '0.82rem', color: '#888', textAlign: 'center' }}>OTP sent to +91 {mobile}</p>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {otp.map((v, i) => (
              <input key={i} className={`otp-input ${v ? 'filled' : ''}`} value={v} maxLength={1}
                onChange={e => handleOTPChange(i, e.target.value)}
                style={{ width: 45, height: 55, fontSize: '1.3rem', textAlign: 'center' }} />
            ))}
          </div>
          {countdown > 0
            ? <p style={{ textAlign: 'center', fontFamily: 'Syne', fontSize: '0.78rem', color: '#555' }}>Resend in {countdown}s</p>
            : <p style={{ textAlign: 'center', fontFamily: 'Syne', fontSize: '0.78rem', color: '#FF6B00', cursor: 'pointer' }} onClick={sendOTP}>Resend OTP</p>
          }
          <button className="btn-primary" style={{ width: '100%' }} onClick={verifyOTP} disabled={otp.join('').length < 6 || loading}>
            {loading ? <><div className="spinner" /> Verifying...</> : '✅ VERIFY OTP'}
          </button>
        </>
      )}
    </div>
  );
}
