import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useArthaStore } from '../../store/arthaStore';
import Header from './Header';
import WatchlistPanel from './WatchlistPanel';
import CandlestickChart from './CandlestickChart';
import StatCards from './StatCards';
import AlertPanel from './AlertPanel';
import DistributionPanel from './DistributionPanel';
import SmartOrderModal from './SmartOrderModal';
import ArthaAIChat from './ArthaAIChat';
import { ProbabilityMeter, VolatilityMeter, ArthaScoreCard, LiveCommentary } from './MetricPanels';
import { CorrelationHeatmap, RegressionPanel, MarketWeather } from './AnalysisPanels';
import { GLOBAL_MARKETS, FII_DII, SECTORS } from '../../store/arthaStore';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ─── FII/DII PANEL ─────────────────────────────────────────────────────────────
function FiiDiiPanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="section-header">🏦 FII / DII ACTIVITY</div>
      <div style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={FII_DII} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={{ fontFamily: 'JetBrains Mono', fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: 'JetBrains Mono', fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'rgba(17,17,17,0.98)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 6, fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }} />
            <Bar dataKey="fii" name="FII (₹Cr)" radius={[2, 2, 0, 0]}>
              {FII_DII.map((d, i) => <Cell key={i} fill={d.fii >= 0 ? '#00FF88' : '#FF3355'} />)}
            </Bar>
            <Bar dataKey="dii" name="DII (₹Cr)" radius={[2, 2, 0, 0]}>
              {FII_DII.map((d, i) => <Cell key={i} fill={d.dii >= 0 ? '#4488FF' : '#FF9A3C'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {[['FII Today', '₹1,543Cr', '#00FF88'], ['DII Today', '₹832Cr', '#4488FF'], ['Net', '₹2,375Cr', '#FF6B00']].map(([l, v, c]) => (
          <div key={l} style={{ flex: 1, textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '6px' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', color: '#555', marginBottom: 2 }}>{l}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: c, fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GLOBAL HEATMAP ─────────────────────────────────────────────────────────────
function GlobalHeatmap() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="section-header">🌍 GLOBAL MARKETS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        {GLOBAL_MARKETS.map(m => (
          <div key={m.name} style={{
            padding: '7px 10px', borderRadius: 6, background: m.up ? 'rgba(0,255,136,0.06)' : 'rgba(255,51,85,0.06)',
            border: `1px solid ${m.up ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,85,0.15)'}`,
          }}>
            <div style={{ fontFamily: 'Syne', fontSize: '0.62rem', color: '#555' }}>{m.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#F5F5F5' }}>{m.value}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: m.up ? '#00FF88' : '#FF3355', fontWeight: 600 }}>{m.change}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SECTOR HEATMAP ─────────────────────────────────────────────────────────────
function SectorHeatmap() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="section-header">📊 SECTOR ROTATION</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        {SECTORS.map(s => {
          const intensity = Math.min(100, Math.abs(s.change) * 25);
          const bg = s.change >= 0 ? `rgba(0,255,136,${intensity / 300})` : `rgba(255,51,85,${intensity / 300})`;
          const border = s.change >= 0 ? `rgba(0,255,136,${intensity / 200})` : `rgba(255,51,85,${intensity / 200})`;
          return (
            <div key={s.name} style={{ padding: '7px 10px', borderRadius: 6, background: bg, border: `1px solid ${border}` }}>
              <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', color: '#888' }}>{s.name}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: s.change >= 0 ? '#00FF88' : '#FF3355', fontWeight: 700 }}>
                {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CRICKET SCORECARD ─────────────────────────────────────────────────────────
function CricketScorecard() {
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const stock = stocks[selectedSymbol];
  if (!stock?.stats) return null;
  const { zScore, probability, volRatio, skewness } = stock.stats;
  const pct = stock.changePct ?? 0;

  const rows = [
    ['🏏 Runs (Return)', `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`, pct >= 0 ? '#00FF88' : '#FF3355'],
    ['⚡ Strike Rate', `${stock.arthaScore}/100`, '#FF6B00'],
    ['🎯 Probability', `${(probability * 100).toFixed(0)}%`, probability > 0.55 ? '#00FF88' : '#FF3355'],
    ['💨 Economy (Vol)', `${volRatio.toFixed(1)}x avg`, volRatio > 1.5 ? '#FF3355' : '#888'],
    ['↗️ Skewness', skewness.toFixed(2), skewness >= 0 ? '#00FF88' : '#FF3355'],
  ];

  const stars = stock.arthaScore >= 70 ? '⭐⭐⭐⭐⭐' : stock.arthaScore >= 50 ? '⭐⭐⭐' : '⭐⭐';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-header">🏏 CRICKET SCORECARD</div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#FFD700' }}>{stars}</div>
      </div>
      <div style={{ fontFamily: 'Orbitron', fontSize: '0.72rem', color: '#888', textAlign: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {selectedSymbol} — TODAY's SCORECARD
      </div>
      {rows.map(([lbl, val, color]) => (
        <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <span style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#888' }}>{lbl}</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color, fontWeight: 700 }}>{val}</span>
        </div>
      ))}
      <div style={{ fontFamily: 'Syne', fontSize: '0.65rem', color: '#444', textAlign: 'center', marginTop: 4 }}>
        Shareable as image 📱 (coming soon)
      </div>
    </div>
  );
}

// ─── STORY MODE ────────────────────────────────────────────────────────────────
function StoryMode() {
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const stock = stocks[selectedSymbol];
  if (!stock?.stats) return null;

  const { zScore, probability, volRatio, skewness, mean } = stock.stats;
  const pct = stock.changePct ?? 0;

  const story = `${selectedSymbol} ${pct >= 0 ? 'is showing strength' : 'has been under pressure'} today. The mean return has ${mean >= 0 ? 'drifted positive' : 'turned negative'}, suggesting ${mean >= 0 ? 'buyers are in control' : 'sellers are dominating'}.

Volatility is ${volRatio.toFixed(1)}x the 30-day average — ${volRatio > 1.5 ? 'significantly elevated, signaling uncertainty and potential for sharp moves' : 'within normal range, suggesting stable conditions'}.

The Z-Score of ${zScore.toFixed(2)}σ ${Math.abs(zScore) > 2 ? 'is in extreme territory — mean reversion is statistically likely' : 'remains in normal range, no extremes'}.

Skewness of ${skewness.toFixed(2)} suggests ${skewness < -0.3 ? 'more downside risk — returns are negatively skewed' : 'a positive distribution — upside slightly favored'}.

Overall probability of rise: ${(probability * 100).toFixed(1)}% — ARTHA rates this a ${stock.arthaScore >= 60 ? '🟢 favorable' : stock.arthaScore >= 40 ? '🟡 neutral' : '🔴 unfavorable'} setup.`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="section-header">📖 ARTHA STORY MODE</div>
      <div style={{ fontFamily: 'Syne', fontSize: '0.78rem', color: '#888', lineHeight: 1.7,
        background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '14px 16px',
        borderLeft: '2px solid rgba(255,107,0,0.4)' }}>
        {story}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-ghost" style={{ fontSize: '0.68rem', height: 30, flex: 1 }}>🇮🇳 हिंदी में पढ़ें</button>
        <button className="btn-ghost" style={{ fontSize: '0.68rem', height: 30, flex: 1 }}>🔄 Refresh Story</button>
      </div>
    </div>
  );
}

// ─── LIVE TICK UPDATE ──────────────────────────────────────────────────────────
function LiveTickUpdater() {
  const tickStock = useArthaStore(s => s.tickStock);
  const stocks = useArthaStore(s => s.stocks);

  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(stocks).forEach(sym => tickStock(sym));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column' }}>
      <div className="scan-grid" style={{ opacity: 0.3 }} />
      <LiveTickUpdater />
      <Header />

      <div style={{ flex: 1, padding: '12px 14px 80px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>

        {/* ── ROW 1: MAIN GRID ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 260px', gap: 12, minHeight: 460 }}>
          {/* Left: Watchlist */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="glass-card" style={{ padding: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <WatchlistPanel />
          </motion.div>

          {/* Center: Chart + Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="glass-card" style={{ padding: '14px', flex: 2, minHeight: 280, overflow: 'hidden' }}>
              <CandlestickChart />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="glass-card" style={{ padding: '14px' }}>
              <StatCards />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="glass-card" style={{ padding: '14px' }}>
              <DistributionPanel />
            </motion.div>
          </div>

          {/* Right: Alerts */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="glass-card" style={{ padding: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <AlertPanel />
          </motion.div>
        </div>

        {/* ── ROW 2: METRIC GAUGES ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          {[
            <ProbabilityMeter />,
            <VolatilityMeter />,
            <ArthaScoreCard />,
            <LiveCommentary />,
          ].map((panel, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
              className="glass-card" style={{ padding: '14px' }}>
              {panel}
            </motion.div>
          ))}
        </div>

        {/* ── ROW 3: ANALYSIS PANELS ────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: 12 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="glass-card" style={{ padding: '14px' }}>
            <CorrelationHeatmap />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="glass-card" style={{ padding: '14px' }}>
            <RegressionPanel />
          </motion.div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="glass-card" style={{ padding: '14px' }}>
              <MarketWeather />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="glass-card" style={{ padding: '14px' }}>
              <FiiDiiPanel />
            </motion.div>
          </div>
        </div>

        {/* ── ROW 4: SECTOR + GLOBAL + STORY + CRICKET ─────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr 1fr', gap: 12 }}>
          {[
            <GlobalHeatmap />,
            <SectorHeatmap />,
            <StoryMode />,
            <CricketScorecard />,
          ].map((panel, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.05 }}
              className="glass-card" style={{ padding: '14px' }}>
              {panel}
            </motion.div>
          ))}
        </div>

      </div>

      {/* Smart Order Modal */}
      <SmartOrderModal />

      {/* ARTHA AI Chat */}
      <ArthaAIChat />
    </div>
  );
}
