import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArthaStore } from '../../store/arthaStore';
import ParticleBackground from '../ParticleBackground';

// ─── FLOATING STAT CHIPS ──────────────────────────────────────────────────────
const STAT_CHIPS = ['Skewness', 'Z-Score', 'Correlation', 'Kurtosis', 'Std Dev', 'Regression', 'Monte Carlo', 'Binomial', 'VaR', 'Beta'];

function FloatingChips() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
      {STAT_CHIPS.map((chip, i) => (
        <div
          key={chip}
          className="stat-chip"
          style={{
            left: `${5 + (i * 9.5) % 90}%`,
            animationDuration: `${12 + (i * 3.7) % 10}s`,
            animationDelay: `${(i * 2.3) % 8}s`,
            fontSize: '0.72rem',
          }}
        >
          {chip}
        </div>
      ))}
    </div>
  );
}

// ─── ARTHA LOGO SVG ───────────────────────────────────────────────────────────
function ArthaLogo({ size = 60 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="28" stroke="#FF6B00" strokeWidth="2" strokeDasharray="175" 
        style={{ animation: 'drawStroke 2s ease forwards', strokeDashoffset: 175 }} />
      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: 18, fill: '#FF6B00',
          filter: 'drop-shadow(0 0 8px rgba(255,107,0,0.8))' }}>
        A
      </text>
      <circle cx="30" cy="30" r="24" stroke="rgba(255,107,0,0.15)" strokeWidth="1" />
    </svg>
  );
}

// ─── ANIMATED CANDLESTICK BG ──────────────────────────────────────────────────
function CandlestickBg() {
  const candles = Array.from({ length: 20 }, (_, i) => ({
    x: i * 54 + 10,
    h: 30 + Math.random() * 80,
    bodyH: 20 + Math.random() * 40,
    up: Math.random() > 0.45,
  }));
  
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }}
      preserveAspectRatio="none">
      {candles.map((c, i) => (
        <g key={i}>
          <line x1={c.x} y1={200 - c.h} x2={c.x} y2={200 + c.h} stroke={c.up ? '#00FF88' : '#FF3355'} strokeWidth="1" />
          <rect x={c.x - 10} y={200 - c.bodyH / 2} width="20" height={c.bodyH}
            fill={c.up ? '#00FF88' : '#FF3355'} rx="2" />
        </g>
      ))}
    </svg>
  );
}

// ─── SPLASH SCREEN ────────────────────────────────────────────────────────────
export default function SplashScreen() {
  const setAuthStep = useArthaStore(s => s.setAuthStep);
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);
  
  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#0A0A0A' }}>
      <ParticleBackground />
      <div className="scan-grid" />
      <FloatingChips />
      
      {/* Decorative background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <CandlestickBg />
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(255,107,0,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,154,60,0.04) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>
      
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center', padding: '0 20px', maxWidth: 700 }}
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'backOut' }}
            >
              <ArthaLogo size={80} />
            </motion.div>
            
            {/* Title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <h1 className="glow-text-saffron" style={{ fontFamily: 'Orbitron', fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 900, letterSpacing: '0.15em', lineHeight: 1, margin: 0 }}>
                ARTHA
              </h1>
              <div style={{ fontFamily: 'Noto Sans Devanagari', fontSize: 'clamp(1rem, 3vw, 1.4rem)', color: '#FF9A3C', marginTop: 6, letterSpacing: '0.05em' }}>
                अर्थ — Statistical Intelligence for Indian Markets
              </div>
            </motion.div>
            
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              style={{ fontFamily: 'Syne', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: '#888888', letterSpacing: '0.05em', fontStyle: 'italic' }}
            >
              "Where Numbers Meet the Market"
            </motion.p>
            
            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
              style={{ width: 200, height: 1, background: 'linear-gradient(90deg, transparent, #FF6B00, transparent)' }}
            />
            
            {/* Stat pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {['NSE', 'BSE', 'F&O', 'Statistical Analysis', 'AI Intelligence'].map(tag => (
                <span key={tag} style={{ padding: '4px 12px', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 20, fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#FF6B00', background: 'rgba(255,107,0,0.05)' }}>
                  {tag}
                </span>
              ))}
            </motion.div>
            
            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 480 }}
            >
              <button
                id="splash-get-started"
                className="btn-primary"
                style={{ flex: 1, minWidth: 200 }}
                onClick={() => setAuthStep('signup')}
              >
                🚀 GET STARTED
              </button>
              <button
                id="splash-sign-in"
                className="btn-outline"
                style={{ flex: 1, minWidth: 200 }}
                onClick={() => setAuthStep('signin')}
              >
                🔑 SIGN IN
              </button>
            </motion.div>
            
            {/* Trust line */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 0.6 }}
              style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#555555', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span className="pulse-live" />
              Trusted by Indian traders on NSE & BSE
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
