import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArthaStore } from '../../store/arthaStore';
import ParticleBackground from '../ParticleBackground';

const BROKERS = [
  { id: 'zerodha', name: 'Zerodha', icon: '🟢', desc: 'Kite Connect API', color: '#387ED1' },
  { id: 'upstox', name: 'Upstox', icon: '🟣', desc: 'Upstox API v2', color: '#7B61FF' },
  { id: 'angel', name: 'Angel One', icon: '🟠', desc: 'SmartAPI', color: '#FF6B00' },
  { id: '5paisa', name: '5Paisa', icon: '🔵', desc: '5Paisa API', color: '#0062FF' },
];

const STEPS = [
  { id: 1, label: 'Welcome', icon: '👋' },
  { id: 2, label: 'Capital', icon: '💰' },
  { id: 3, label: 'Watchlist', icon: '📊' },
  { id: 4, label: 'Broker', icon: '🔗' },
];

const QUICK_STOCKS = ['RELIANCE', 'TATAMOTORS', 'INFOSYS', 'HDFCBANK', 'WIPRO', 'ICICIBANK', 'HCLTECH', 'BAJFINANCE', 'MARUTI', 'SUNPHARMA'];

export default function OnboardingFlow() {
  const setAuthStep = useArthaStore(s => s.setAuthStep);
  const setCapital = useArthaStore(s => s.setCapital);
  const setBroker = useArthaStore(s => s.setBroker);
  const addToWatchlist = useArthaStore(s => s.addToWatchlist);
  const [step, setStep] = useState(1);
  const [capital, setCapitalLocal] = useState('50000');
  const [riskPct, setRiskPct] = useState(2);
  const [experience, setExperience] = useState('beginner');
  const [selectedStocks, setSelectedStocks] = useState(['RELIANCE', 'TATAMOTORS', 'INFOSYS']);
  const [connectedBroker, setConnectedBroker] = useState(null);
  const [connecting, setConnecting] = useState(null);

  const next = () => {
    if (step === 2) setCapital(Number(capital));
    if (step < 4) setStep(s => s + 1);
    else finishOnboarding();
  };

  const finishOnboarding = () => {
    selectedStocks.forEach(s => addToWatchlist(s));
    if (connectedBroker) setBroker(connectedBroker);
    setAuthStep('dashboard');
  };

  const toggleStock = (sym) => {
    setSelectedStocks(s => s.includes(sym) ? (s.length > 1 ? s.filter(x => x !== sym) : s) : [...s, sym]);
  };

  const connectBroker = async (brokerId) => {
    setConnecting(brokerId);
    await new Promise(r => setTimeout(r, 2000));
    setConnectedBroker(brokerId);
    setConnecting(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', background: '#0A0A0A' }}>
      <ParticleBackground />
      <div className="scan-grid" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: 520, padding: '36px 32px', position: 'relative', zIndex: 2 }}
      >
        {/* Progress */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {STEPS.map(s => (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: step >= s.id ? '#FF6B00' : 'rgba(255,107,0,0.1)',
                border: `2px solid ${step >= s.id ? '#FF6B00' : 'rgba(255,107,0,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', transition: 'all 0.3s',
                boxShadow: step === s.id ? '0 0 20px rgba(255,107,0,0.5)' : 'none',
              }}>
                {s.icon}
              </div>
              <span style={{ fontFamily: 'Syne', fontSize: '0.65rem', color: step >= s.id ? '#FF6B00' : '#444' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: 'rgba(255,107,0,0.1)', borderRadius: 2, marginBottom: 32, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(step / 4) * 100}%`, background: '#FF6B00', transition: 'width 0.5s ease', boxShadow: '0 0 10px rgba(255,107,0,0.5)' }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🔥</div>
                <h1 style={{ fontFamily: 'Orbitron', fontSize: '1.6rem', color: '#FF6B00', marginBottom: 8 }}>Welcome to ARTHA</h1>
                <div style={{ fontFamily: 'Noto Sans Devanagari', color: '#FF9A3C', fontSize: '1rem', marginBottom: 16 }}>अर्थ — Statistical Intelligence</div>
                <p style={{ fontFamily: 'Syne', color: '#888', lineHeight: 1.7, marginBottom: 24 }}>
                  India's most advanced statistical trading intelligence platform. Let's get you set up in 4 quick steps.
                </p>
                {['📊 Real-time statistical analysis', '🚨 Smart alert engine', '🤖 AI-powered insights'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontFamily: 'Syne', color: '#F5F5F5', fontSize: '0.88rem' }}>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.2rem', color: '#F5F5F5', marginBottom: 6 }}>💰 Capital Setup</h2>
                <p style={{ fontFamily: 'Syne', fontSize: '0.82rem', color: '#666', marginBottom: 24 }}>Configure your trading parameters</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: 8 }}>Trading Capital</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'JetBrains Mono', color: '#FF6B00', fontWeight: 700 }}>₹</span>
                      <input className="artha-input" style={{ paddingLeft: 32, fontFamily: 'JetBrains Mono', fontSize: '1.1rem' }}
                        type="number" value={capital} onChange={e => setCapitalLocal(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: 8 }}>
                      Risk Per Trade: <span style={{ color: '#FF6B00', fontFamily: 'JetBrains Mono' }}>{riskPct}%</span>
                      {' '}= <span style={{ color: '#00FF88', fontFamily: 'JetBrains Mono' }}>₹{((Number(capital) * riskPct) / 100).toLocaleString('en-IN')}</span>
                    </label>
                    <input type="range" min={0.5} max={5} step={0.5} value={riskPct} onChange={e => setRiskPct(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#FF6B00' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#555' }}>
                      <span>0.5%</span><span>5%</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'Syne', fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: 10 }}>Experience Level</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {['beginner', 'intermediate', 'advanced'].map(lvl => (
                        <button key={lvl} onClick={() => setExperience(lvl)}
                          style={{ flex: 1, padding: '10px 8px', borderRadius: 8, border: `1px solid ${experience === lvl ? '#FF6B00' : 'rgba(255,255,255,0.08)'}`, background: experience === lvl ? 'rgba(255,107,0,0.12)' : 'transparent', color: experience === lvl ? '#FF6B00' : '#666', fontFamily: 'Syne', fontSize: '0.78rem', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.2rem', color: '#F5F5F5', marginBottom: 6 }}>📊 Build Watchlist</h2>
                <p style={{ fontFamily: 'Syne', fontSize: '0.82rem', color: '#666', marginBottom: 20 }}>
                  Select at least 3 stocks — <span style={{ color: '#FF6B00' }}>{selectedStocks.length} selected</span>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {QUICK_STOCKS.map(sym => (
                    <button key={sym} onClick={() => toggleStock(sym)} style={{
                      padding: '8px 14px', borderRadius: 6, fontFamily: 'JetBrains Mono', fontSize: '0.78rem',
                      border: `1px solid ${selectedStocks.includes(sym) ? '#FF6B00' : 'rgba(255,255,255,0.08)'}`,
                      background: selectedStocks.includes(sym) ? 'rgba(255,107,0,0.15)' : 'rgba(255,255,255,0.02)',
                      color: selectedStocks.includes(sym) ? '#FF6B00' : '#888', cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      {selectedStocks.includes(sym) ? '✓ ' : ''}{sym}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['NIFTY 50 Preset', 'NIFTY BANK Preset'].map(preset => (
                    <button key={preset} onClick={() => setSelectedStocks(['RELIANCE', 'TATAMOTORS', 'INFOSYS', 'HDFCBANK', 'ICICIBANK'])}
                      className="btn-ghost" style={{ flex: 1, fontSize: '0.72rem' }}>
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 style={{ fontFamily: 'Orbitron', fontSize: '1.2rem', color: '#F5F5F5', marginBottom: 6 }}>🔗 Connect Broker</h2>
                <p style={{ fontFamily: 'Syne', fontSize: '0.82rem', color: '#666', marginBottom: 20 }}>
                  Required for trade execution. Skip to use analysis-only mode.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {BROKERS.map(broker => (
                    <div key={broker.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: 10, border: `1px solid ${connectedBroker === broker.id ? '#00FF88' : 'rgba(255,255,255,0.06)'}`,
                      background: connectedBroker === broker.id ? 'rgba(0,255,136,0.06)' : 'rgba(17,17,17,0.6)',
                      transition: 'all 0.3s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: '1.3rem' }}>{broker.icon}</span>
                        <div>
                          <div style={{ fontFamily: 'Orbitron', fontSize: '0.85rem', color: '#F5F5F5', fontWeight: 700 }}>{broker.name}</div>
                          <div style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#555' }}>{broker.desc}</div>
                        </div>
                      </div>
                      {connectedBroker === broker.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="pulse-live" />
                          <span style={{ fontFamily: 'Syne', fontSize: '0.78rem', color: '#00FF88' }}>Connected</span>
                        </div>
                      ) : (
                        <button onClick={() => connectBroker(broker.id)} disabled={connecting === broker.id}
                          className="btn-outline" style={{ height: 34, padding: '0 16px', fontSize: '0.7rem' }}>
                          {connecting === broker.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Connect'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          {step > 1 && (
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          {step === 4 && !connectedBroker && (
            <button className="btn-ghost" style={{ flex: 1 }} onClick={finishOnboarding}>
              Skip → Analysis Mode
            </button>
          )}
          <button id="onboarding-next" className="btn-primary" style={{ flex: 2 }} onClick={next}
            disabled={step === 3 && selectedStocks.length < 3}>
            {step === 4 ? '🚀 LAUNCH ARTHA' : 'Continue →'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
