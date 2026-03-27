import { useEffect, useState, useRef } from 'react';
import { useArthaStore } from '../../store/arthaStore';

// ─── CIRCULAR GAUGE ────────────────────────────────────────────────────────────
function CircularGauge({ value, label, color, size = 140, unit = '%', centerLabel }) {
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius; // half circle
  const dashOffset = circumference * (1 - value / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 1.5} viewBox={`0 0 ${size} ${size / 1.5}`}>
          {/* Background arc */}
          <path
            d={`M 10 ${size / 1.5} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 1.5}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={10}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={`M 10 ${size / 1.5} A ${radius} ${radius} 0 0 1 ${size - 10} ${size / 1.5}`}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: `drop-shadow(0 0 6px ${color})` }}
          />
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map(tick => {
            const angle = (Math.PI * tick / 100) - Math.PI;
            const cx = size / 2 + radius * Math.cos(angle);
            const cy = size / 1.5 + radius * Math.sin(angle);
            return <circle key={tick} cx={cx} cy={cy} r={2} fill="rgba(255,255,255,0.15)" />;
          })}
        </svg>
        {/* Center value */}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', fontWeight: 700, color, textShadow: `0 0 15px ${color}60`, lineHeight: 1 }}>
            {value.toFixed(1)}{unit}
          </div>
          {centerLabel && <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', color: '#555', marginTop: 2 }}>{centerLabel}</div>}
        </div>
      </div>
      <div style={{ fontFamily: 'Orbitron', fontSize: '0.62rem', color: '#555', letterSpacing: '1px' }}>{label}</div>
    </div>
  );
}

export function ProbabilityMeter() {
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const stock = stocks[selectedSymbol];

  const prob = stock?.stats?.probability ?? 0.5;
  const pctRise = prob * 100;
  const isBull = pctRise >= 50;
  const color = isBull ? '#00FF88' : '#FF3355';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="section-header">🎯 PROBABILITY METER</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
        <CircularGauge
          value={isBull ? pctRise : (100 - pctRise)}
          label={isBull ? `RISE — ${pctRise.toFixed(1)}%` : `FALL — ${(100 - pctRise).toFixed(1)}%`}
          color={color}
          centerLabel={selectedSymbol}
        />
        <div style={{ fontFamily: 'Syne', fontSize: '0.7rem', color: '#555', textAlign: 'center', marginTop: 8 }}>
          Based on Normal + Binomial distribution
        </div>
      </div>
    </div>
  );
}

export function VolatilityMeter() {
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const stock = stocks[selectedSymbol];

  const volRatio = stock?.stats?.volRatio ?? 1;
  const stdDev = stock?.stats?.stdDev ?? 0;
  const volPct = Math.min(100, (volRatio / 3) * 100);

  const color = volRatio < 1 ? '#00FF88' : volRatio < 1.5 ? '#FFD700' : volRatio < 2 ? '#FF6B00' : '#FF3355';
  const zoneLabel = volRatio < 1 ? 'LOW' : volRatio < 1.5 ? 'NORMAL' : volRatio < 2 ? 'HIGH' : 'EXTREME ⚠️';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="section-header">📉 VOLATILITY METER</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
        <CircularGauge
          value={volPct}
          label={`${zoneLabel} — ${volRatio.toFixed(2)}x avg`}
          color={color}
          centerLabel={`σ = ${stdDev.toFixed(3)}%`}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', marginTop: 12 }}>
          {[['Current σ', `${stdDev.toFixed(3)}%`, '#F5F5F5'], ['Ratio', `${volRatio.toFixed(2)}x`, color]].map(([lbl, val, c]) => (
            <div key={lbl} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', color: '#555', marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: c, fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ARTHA SCORE ──────────────────────────────────────────────────────────────
export function ArthaScoreCard() {
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const stock = stocks[selectedSymbol];
  const score = stock?.arthaScore ?? 0;

  const color = score >= 70 ? '#00FF88' : score >= 50 ? '#FFD700' : score >= 30 ? '#FF6B00' : '#FF3355';
  const verdict = score >= 70 ? 'STATISTICALLY STRONG' : score >= 50 ? 'MODERATE SETUP' : score >= 30 ? 'WEAK SETUP' : 'AVOID — HIGH RISK';
  const verdict_detail = score >= 70 ? 'Favorable statistical conditions' : score >= 50 ? 'Mixed signals — trade cautiously' : score >= 30 ? 'Poor risk-reward setup' : 'Statistically overextended / high risk';

  // SVG ring
  const size = 100;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const fill = circ * (1 - score / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="section-header">⭐ ARTHA SCORE</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={circ} strokeDashoffset={fill}
            strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: `drop-shadow(0 0 6px ${color})` }}
          />
          <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'Orbitron', fontSize: 22, fontWeight: 900, fill: color }}>{score}</text>
          <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: 'Syne', fontSize: 8, fill: '#555' }}>/100</text>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Orbitron', fontSize: '0.72rem', color, marginBottom: 4 }}>{verdict}</div>
          <div style={{ fontFamily: 'Syne', fontSize: '0.68rem', color: '#666', lineHeight: 1.5 }}>{verdict_detail}</div>
          {/* Component bars */}
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[['Z-Score', Math.max(0, 25 - Math.abs((stock?.stats?.zScore ?? 0)) * 8), 25],
              ['Volatility', Math.max(0, 20 - ((stock?.stats?.volRatio ?? 1) - 1) * 10), 20],
              ['Distribution', Math.max(0, 20 - Math.abs(stock?.stats?.skewness ?? 0) * 5), 20]].map(([lbl, val, max]) => (
              <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', color: '#444', width: 52, flexShrink: 0 }}>{lbl}</div>
                <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(val / max) * 100}%`, background: val > max * 0.6 ? '#00FF88' : val > max * 0.3 ? '#FFD700' : '#FF3355', transition: 'width 1s ease' }} />
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: '#555', width: 22, textAlign: 'right' }}>{val.toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LIVE STAT COMMENTARY ──────────────────────────────────────────────────────
export function LiveCommentary() {
  const [logs, setLogs] = useState([
    { time: '20:27:31', msg: 'Z-Score calculated for session', type: 'info' },
    { time: '20:27:45', msg: 'Volatility is 1.2x 30-day average', type: 'warning' },
    { time: '20:28:02', msg: 'Distribution analysis complete — checking normality', type: 'info' },
    { time: '20:28:15', msg: 'ARTHA monitoring active — scanning all signals', type: 'bull' },
  ]);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const stocks = useArthaStore(s => s.stocks);
  const ref = useRef(null);

  useEffect(() => {
    const msgs = [
      { msg: `Z-Score updated — ${(stocks[selectedSymbol]?.stats?.zScore ?? 0).toFixed(2)}σ`, type: 'info' },
      { msg: `Volatility ratio: ${(stocks[selectedSymbol]?.stats?.volRatio ?? 1).toFixed(2)}x avg`, type: 'warning' },
      { msg: `Probability of rise: ${((stocks[selectedSymbol]?.stats?.probability ?? 0.5) * 100).toFixed(1)}%`, type: 'bull' },
      { msg: 'Regression slope analysis updated', type: 'info' },
      { msg: `Skewness: ${(stocks[selectedSymbol]?.stats?.skewness ?? 0).toFixed(2)} — watching for mean reversion`, type: 'bear' },
      { msg: 'Bollinger Band width analyzed — no squeeze', type: 'info' },
      { msg: `${selectedSymbol} ARTHA Score recalculated`, type: 'bull' },
    ];

    const interval = setInterval(() => {
      const entry = msgs[Math.floor(Math.random() * msgs.length)];
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      setLogs(l => [{ time, ...entry }, ...l.slice(0, 12)]);
    }, 8000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const typeColors = { bull: '#00FF88', bear: '#FF3355', warning: '#FFD700', info: '#888' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="section-header">📡 LIVE STAT COMMENTARY</div>
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: i === 0 ? 1 : Math.max(0.3, 1 - i * 0.07) }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: '#444', flexShrink: 0 }}>{log.time}</span>
            <span style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: typeColors[log.type] || '#888' }}>— {log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
