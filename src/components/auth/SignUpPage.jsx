import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Phone, Lock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useArthaStore } from '../../store/arthaStore';
import { api } from '../../lib/api';
import ParticleBackground from '../ParticleBackground';

function ArthaLogo({ size = 32 }) {
  return (
    <div style={{ width: size, height: size, border: '2px solid #FF6B00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(255,107,0,0.4)' }}>
      <span style={{ fontFamily: 'Orbitron', fontWeight: 900, color: '#FF6B00', fontSize: size * 0.45 }}>A</span>
    </div>
  );
}

function StrengthMeter({ password }) {
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const count = Object.values(checks).filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', '#FF3355', '#FF9A3C', '#FF6B00', '#00FF88'];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="strength-bar" style={{ flex: 1 }}>
            <div className="strength-fill" style={{ width: i <= count ? '100%' : '0%', background: colors[count] }} />
          </div>
        ))}
      </div>
      {password && <span style={{ fontFamily: 'Syne', fontSize: '0.75rem', color: colors[count] }}>{labels[count]}</span>}
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[
          { key: 'length', label: 'At least 8 characters' },
          { key: 'upper', label: 'One uppercase letter' },
          { key: 'number', label: 'One number' },
          { key: 'special', label: 'One special character' },
        ].map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {checks[key]
              ? <CheckCircle size={12} color="#00FF88" />
              : <XCircle size={12} color="#555" />
            }
            <span style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: checks[key] ? '#00FF88' : '#555' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InputWrapper({ icon, children, suffix, label, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888888' }}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && <span style={{ position: 'absolute', left: 14, color: '#555', display: 'flex', zIndex: 1 }}>{icon}</span>}
        <div style={{ width: '100%' }}>{children}</div>
        {suffix && <span style={{ position: 'absolute', right: 14, color: '#888', display: 'flex', zIndex: 1, cursor: 'pointer' }}>{suffix}</span>}
      </div>
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={12} color="#FF3355" />
          <span style={{ fontFamily: 'Syne', fontSize: '0.75rem', color: '#FF3355' }}>{error}</span>
        </div>
      )}
    </div>
  );
}

export default function SignUpPage() {
  const setAuthStep = useArthaStore(s => s.setAuthStep);
  const setPendingMobile = useArthaStore(s => s.setPendingMobile);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [shake, setShake] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (form.name.length < 2) e.name = 'Enter at least 2 characters';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    const pwChecks = [form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)];
    if (!pwChecks.every(Boolean)) e.password = 'Password must meet all requirements';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    if (!agreed) e.agreed = 'You must agree to continue';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs); setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    setLoading(true);
    setApiError('');
    try {
      const res = await api.post('/auth/signup', {
        full_name: form.name,
        email: form.email,
        mobile: `dummy-${Date.now()}`,
        password: form.password,
      });
      // Show OTP popup BEFORE navigating (alert blocks JS execution)
      if (res.dev_otp) {
        alert(`📬 OTP sent!\n\nYour verification code is:\n\n${res.dev_otp}\n\n(Email credentials not configured — showing in demo mode)`);
      }
      useArthaStore.getState().setPendingMobile(form.email);
      setAuthStep('verify');
    } catch (err) {
      setApiError(err.message || 'Signup failed. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  const passMatch = form.confirm.length > 0 && form.password === form.confirm;
  const passMismatch = form.confirm.length > 0 && form.password !== form.confirm;
  const emailValid = /\S+@\S+\.\S+/.test(form.email);
  const canSubmit = form.name.length >= 2 && emailValid
    && form.password.length >= 8 && passMatch && agreed && !loading;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', background: '#0A0A0A' }}>
      <ParticleBackground />
      <div className="scan-grid" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`glass-card ${shake ? 'animate-shake' : ''}`}
        style={{ width: '100%', maxWidth: 460, padding: '36px 32px', position: 'relative', zIndex: 2 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><ArthaLogo size={44} /></div>
          <h1 style={{ fontFamily: 'Orbitron', fontSize: '1.3rem', fontWeight: 700, color: '#F5F5F5', marginBottom: 6 }}>Create Your Account</h1>
          <p style={{ fontFamily: 'Syne', fontSize: '0.82rem', color: '#666' }}>Join India's smartest statistical trading intelligence</p>
        </div>

        {apiError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.25)', borderRadius: 8, marginBottom: 16 }}>
            <AlertCircle size={14} color="#FF3355" />
            <span style={{ fontFamily: 'Syne', fontSize: '0.78rem', color: '#FF3355' }}>{apiError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <InputWrapper icon={<User size={16} />} label="Full Name" error={errors.name}>
            <input id="signup-name" className={`artha-input ${errors.name ? 'error' : ''}`} style={{ paddingLeft: 40 }}
              placeholder="Your full name" value={form.name} onChange={e => update('name', e.target.value)} />
          </InputWrapper>

          <InputWrapper icon={<Mail size={16} />} label="Email Address" error={errors.email}
            suffix={form.email.length > 0 && (emailValid ? <CheckCircle size={16} color="#00FF88" /> : <XCircle size={16} color="#FF3355" />)}>
            <input id="signup-email" className={`artha-input ${errors.email ? 'error' : emailValid ? 'success' : ''}`}
              style={{ paddingLeft: 40, paddingRight: 40 }} placeholder="yourname@email.com" type="email"
              value={form.email} onChange={e => update('email', e.target.value)} />
          </InputWrapper>

          <InputWrapper icon={<Lock size={16} />} label="Password" error={errors.password}
            suffix={<button type="button" onClick={() => setShowPass(!showPass)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>}>
            <input id="signup-password" className={`artha-input ${errors.password ? 'error' : ''}`} style={{ paddingLeft: 40, paddingRight: 40 }}
              placeholder="Create a strong password" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)} />
            {form.password.length > 0 && <StrengthMeter password={form.password} />}
          </InputWrapper>

          <InputWrapper icon={<Lock size={16} />} label="Confirm Password" error={errors.confirm}
            suffix={<button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>}>
            <input id="signup-confirm" className={`artha-input ${passMismatch ? 'error' : passMatch ? 'success' : ''}`}
              style={{ paddingLeft: 40, paddingRight: 40 }} placeholder="Re-enter your password"
              type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={e => update('confirm', e.target.value)} />
            {form.confirm.length > 0 && (
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                {passMatch
                  ? <><CheckCircle size={12} color="#00FF88" /><span style={{ fontFamily: 'Syne', fontSize: '0.75rem', color: '#00FF88' }}>Passwords match</span></>
                  : <><XCircle size={12} color="#FF3355" /><span style={{ fontFamily: 'Syne', fontSize: '0.75rem', color: '#FF3355' }}>Passwords do not match</span></>
                }
              </div>
            )}
          </InputWrapper>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <button type="button" id="signup-agree" onClick={() => setAgreed(!agreed)} style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${agreed ? '#FF6B00' : 'rgba(255,107,0,0.3)'}`, background: agreed ? '#FF6B00' : 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              {agreed && <span style={{ color: '#000', fontSize: '0.7rem', fontWeight: 900 }}>✓</span>}
            </button>
            <span style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888', lineHeight: 1.5 }}>
              I agree to <span style={{ color: '#FF6B00', cursor: 'pointer' }}>Terms & Conditions</span> and <span style={{ color: '#FF6B00', cursor: 'pointer' }}>Privacy Policy</span>
            </span>
          </div>
          {errors.agreed && <span style={{ fontFamily: 'Syne', fontSize: '0.75rem', color: '#FF3355' }}>❌ {errors.agreed}</span>}

          <button id="signup-submit" type="submit" className="btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={!canSubmit}>
            {loading ? <><div className="spinner" /><span>Creating your account...</span></> : '🚀 CREATE MY ARTHA ACCOUNT'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontFamily: 'Syne', fontSize: '0.82rem', color: '#666' }}>
          Already have an account?{' '}
          <span style={{ color: '#FF6B00', cursor: 'pointer', fontWeight: 600 }} onClick={() => setAuthStep('signin')}>Sign In</span>
        </div>
      </motion.div>
    </div>
  );
}
