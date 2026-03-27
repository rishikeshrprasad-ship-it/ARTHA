import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { useArthaStore } from '../../store/arthaStore';

const METRIC_INFO = {
  mean: { label: 'MEAN', unit: '%', desc: 'Average return over the period', formula: 'μ = Σx / n', high: 'Stock trending up — bullish momentum', low: 'Stock declining — bearish pressure', icon: '📊' },
  median: { label: 'MEDIAN', unit: '%', desc: 'Middle value of returns distribution', formula: 'Q2 (50th percentile)', high: 'More returns above zero', low: 'More returns below zero', icon: '📏' },
  stdDev: { label: 'STD DEV', unit: '%', desc: 'Measure of volatility / risk', formula: 'σ = √(Σ(x-μ)² / n)', high: 'High volatility — risky, use wider stops', low: 'Low volatility — stable, tighter stops ok', icon: '📉' },
  skewness: { label: 'SKEWNESS', unit: '', desc: 'Asymmetry of return distribution', formula: '(μ - mode) / σ', high: 'Positive skew — more small losses, few big gains', low: 'Negative skew — more small gains, few big losses', icon: '↗️' },
  kurtosis: { label: 'KURTOSIS', unit: '', desc: 'Fat-tail risk indicator (excess)', formula: 'E[(X-μ)⁴/σ⁴] - 3', high: 'Fat tails — extreme moves more likely', low: 'Thin tails — returns cluster near mean', icon: '📐' },
  zScore: { label: 'Z-SCORE', unit: 'σ', desc: 'Current deviation from mean (in std devs)', formula: 'Z = (x - μ) / σ', high: 'Overbought — statistically high price', low: 'Oversold — statistically low price', icon: '⚡' },
};

function TooltipModal({ metric, stats, onClose }) {
  const info = METRIC_INFO[metric];
  const value = stats[metric];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <div onClick={e => e.stopPropagation()} className="glass-card" style={{ maxWidth: 360, width: '90%', padding: 24 }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>{info.icon}</div>
        <div style={{ fontFamily: 'Orbitron', fontSize: '0.9rem', color: '#FF6B00', marginBottom: 6 }}>{info.label}</div>
        <p style={{ fontFamily: 'Syne', fontSize: '0.85rem', color: '#888', marginBottom: 14 }}>{info.desc}</p>
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
          <div style={{ fontFamily: 'Syne', fontSize: '0.7rem', color: '#555', marginBottom: 4 }}>Formula:</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: '#FF9A3C' }}>{info.formula}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: '10px', background: 'rgba(0,255,136,0.06)', borderRadius: 6, border: '1px solid rgba(0,255,136,0.15)' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '0.65rem', color: '#555', marginBottom: 4 }}>HIGH means:</div>
            <div style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#00FF88' }}>{info.high}</div>
          </div>
          <div style={{ flex: 1, padding: '10px', background: 'rgba(255,51,85,0.06)', borderRadius: 6, border: '1px solid rgba(255,51,85,0.15)' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '0.65rem', color: '#555', marginBottom: 4 }}>LOW means:</div>
            <div style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#FF3355' }}>{info.low}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AnimatedNumber({ value, decimals = 3 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <>{display >= 0 ? '+' : ''}{display.toFixed(decimals)}</>;
}

function StatCard({ metric, stats }) {
  const [showInfo, setShowInfo] = useState(false);
  const info = METRIC_INFO[metric];
  const value = stats[metric];

  // Color logic
  let color = '#F5F5F5';
  let label = '';
  if (metric === 'zScore') {
    if (Math.abs(value) > 2) { color = value > 0 ? '#FF3355' : '#00FF88'; label = value > 0 ? 'OVERBOUGHT' : 'OVERSOLD'; }
    else { color = '#FFD700'; label = 'NORMAL'; }
  } else if (metric === 'skewness') {
    color = value > 0.5 ? '#00FF88' : value < -0.5 ? '#FF3355' : '#FFD700';
    label = value > 0.5 ? 'POSITIVE SKEW' : value < -0.5 ? 'NEGATIVE SKEW' : 'SYMMETRIC';
  } else if (metric === 'kurtosis') {
    color = Math.abs(value) > 2 ? '#FF3355' : '#888';
    label = Math.abs(value) > 2 ? 'FAT TAILS' : 'NORMAL TAILS';
  } else if (metric === 'mean' || metric === 'median') {
    color = value > 0 ? '#00FF88' : value < 0 ? '#FF3355' : '#888';
  } else if (metric === 'stdDev') {
    color = value > 2 ? '#FF3355' : value > 1 ? '#FFD700' : '#00FF88';
    label = value > 2 ? 'HIGH VOL' : value > 1 ? 'MODERATE' : 'LOW VOL';
  }

  const unit = info.unit;
  const decimals = ['skewness', 'kurtosis', 'zScore'].includes(metric) ? 2 : 3;

  return (
    <>
      <motion.div
        className="stat-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ flex: 1, minWidth: 100, position: 'relative' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: '0.6rem', color: '#555', letterSpacing: '1px' }}>{info.label}</span>
          <button onClick={() => setShowInfo(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 0, display: 'flex' }}>
            <HelpCircle size={12} />
          </button>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', fontWeight: 700, color, lineHeight: 1, marginBottom: 4, textShadow: `0 0 10px ${color}50` }}>
          <AnimatedNumber value={value} decimals={decimals} />{unit}
        </div>
        {label && (
          <div style={{ fontFamily: 'Syne', fontSize: '0.58rem', color, opacity: 0.8, letterSpacing: '0.5px' }}>{label}</div>
        )}
        {metric === 'stdDev' && (
          <div style={{ marginTop: 4, fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#444' }}>
            Semi: {stats.semiDev?.toFixed(3)}%
          </div>
        )}
      </motion.div>

      {showInfo && <TooltipModal metric={metric} stats={stats} onClose={() => setShowInfo(false)} />}
    </>
  );
}

export default function StatCards() {
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const stock = stocks[selectedSymbol];
  if (!stock?.stats) return null;

  const stats = stock.stats;
  const METRICS = ['mean', 'median', 'stdDev', 'skewness', 'kurtosis', 'zScore'];

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {METRICS.map(m => <StatCard key={m} metric={m} stats={stats} />)}
    </div>
  );
}
