import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useArthaStore } from '../../store/arthaStore';
import { api, checkBackend } from '../../lib/api';
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
            <Tooltip contentStyle={{ background: 'rgba(17,17,17,0.98)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 6, fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }} itemStyle={{ color: '#F5F5F5' }} labelStyle={{ color: '#aaa' }} />
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
          <div key={m.name} style={{ padding: '7px 10px', borderRadius: 6, background: m.up ? 'rgba(0,255,136,0.06)' : 'rgba(255,51,85,0.06)', border: `1px solid ${m.up ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,85,0.15)'}` }}>
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
  const backendStats = useArthaStore(s => s.backendStats);
  const stock = stocks[selectedSymbol];

  // Use backend stats if available, else use local store stats
  const stats = backendStats?.stats || stock?.stats;
  if (!stats) return null;

  const zScore = stats.zScore ?? 0;
  const probability = stats.probability ?? stats.probRise / 100 ?? 0.5;
  const volRatio = stats.volRatio ?? 1;
  const skewness = stats.skewness ?? 0;
  const arthaScore = backendStats?.stats?.arthaScore ?? stock?.arthaScore ?? 50;
  const pct = stock?.changePct ?? 0;

  const rows = [
    ['🏏 Runs (Return)', `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`, pct >= 0 ? '#00FF88' : '#FF3355'],
    ['⚡ Strike Rate', `${arthaScore}/100`, '#FF6B00'],
    ['🎯 Probability', `${(probability * 100).toFixed(0)}%`, probability > 0.55 ? '#00FF88' : '#FF3355'],
    ['💨 Economy (Vol)', `${volRatio.toFixed(2)}x avg`, volRatio > 1.5 ? '#FF3355' : '#888'],
    ['↗️ Skewness', skewness.toFixed(2), skewness >= 0 ? '#00FF88' : '#FF3355'],
  ];

  const stars = arthaScore >= 70 ? '⭐⭐⭐⭐⭐' : arthaScore >= 50 ? '⭐⭐⭐' : '⭐⭐';

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
    </div>
  );
}

// ─── STORY MODE ────────────────────────────────────────────────────────────────
function StoryMode() {
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const backendStats = useArthaStore(s => s.backendStats);
  const stock = stocks[selectedSymbol];
  const stats = backendStats?.stats || stock?.stats;
  
  const [lang, setLang] = useState('en');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  if (!stats) return null;

  const zScore = stats.zScore ?? 0;
  const probability = stats.probability ?? 0.5;
  const volRatio = stats.volRatio ?? 1;
  const skewness = stats.skewness ?? 0;
  const mean = stats.mean ?? 0;
  const pct = stock?.changePct ?? 0;
  const arthaScore = backendStats?.stats?.arthaScore ?? stock?.arthaScore ?? 50;

  const enStory = `${selectedSymbol} ${pct >= 0 ? 'is showing strength' : 'has been under pressure'} today. The mean return has ${mean >= 0 ? 'drifted positive' : 'turned negative'}, suggesting ${mean >= 0 ? 'buyers are in control' : 'sellers are dominating'}.\n\nVolatility is ${volRatio.toFixed(1)}x the 30-day average — ${volRatio > 1.5 ? 'significantly elevated, signaling uncertainty and potential for sharp moves' : 'within normal range, suggesting stable conditions'}.\n\nThe Z-Score of ${zScore.toFixed(2)}σ ${Math.abs(zScore) > 2 ? 'is in extreme territory — mean reversion is statistically likely' : 'remains in normal range, no extremes'}.\n\nSkewness of ${skewness.toFixed(2)} suggests ${skewness < -0.3 ? 'more downside risk — returns are negatively skewed' : 'a positive distribution — upside slightly favored'}.\n\nOverall probability of rise: ${(probability * 100).toFixed(1)}% — ARTHA rates this a ${arthaScore >= 60 ? 'favorable' : arthaScore >= 40 ? 'neutral' : 'unfavorable'} setup.`;

  const hiStory = `आज ${selectedSymbol} में ${pct >= 0 ? 'मजबूती' : 'दबाव'} देखने को मिल रहा है। औसतन रिटर्न ${mean >= 0 ? 'सकारात्मक' : 'नकारात्मक'} हो गया है, जो दर्शाता है कि ${mean >= 0 ? 'खरीदारों का नियंत्रण' : 'बिकवाली हावी'} है।\n\nअस्थिरता (Volatility) 30-दिन के औसत के ${volRatio.toFixed(1)} गुना है — ${volRatio > 1.5 ? 'जो काफी अधिक है, जिससे बाजार में तेज उतार-चढ़ाव आ सकता है' : 'समान्य श्रेणी में है, स्थिति स्थिर है'}।\n\nZ-स्कोर ${zScore.toFixed(2)}σ है, ${Math.abs(zScore) > 2 ? 'जो कि चरम स्तर पर है — मीन रिवर्सन (mean reversion) की संभावना अधिक है' : 'समान्य श्रेणी में है'}।\n\n${skewness.toFixed(2)} का Skewness दर्शाता है कि ${skewness < -0.3 ? 'गिरावट का जोखिम अधिक है' : 'सकारात्मक वितरण — तेजी की संभावना अधिक है'}।\n\nतेजी की कुल संभावना: ${(probability * 100).toFixed(1)}% — ARTHA इसे एक ${arthaScore >= 60 ? 'सकारात्मक' : arthaScore >= 40 ? 'सामान्य' : 'जोखिम भरा'} सेटअप मानता है।`;

  const currentText = lang === 'en' ? enStory : hiStory;

  const handleRefresh = () => setRefreshKey(k => k + 1);

  const toggleLanguage = () => {
    setLang(l => l === 'en' ? 'hi' : 'en');
    setRefreshKey(k => k + 1);
  };

  const handleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(currentText);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.pitch = 1;
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header with speaker button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-header">📖 ARTHA STORY MODE</div>
        <button onClick={handleSpeech} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: isSpeaking ? '#00FF88' : '#888' }} title="Read Aloud">
          {isSpeaking ? '🔊' : '🔈'}
        </button>
      </div>

      <div style={{ fontFamily: 'Syne', fontSize: '0.78rem', color: '#888', lineHeight: 1.7, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '14px 16px', borderLeft: '2px solid rgba(255,107,0,0.4)', minHeight: 180, whiteSpace: 'pre-wrap' }}>
        <motion.div key={refreshKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          {currentText}
        </motion.div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-ghost" onClick={toggleLanguage} style={{ fontSize: '0.68rem', height: 30, flex: 1 }}>
          {lang === 'en' ? '🇮🇳 हिंदी में पढ़ें (Hindi)' : '🇬🇧 Read in English'}
        </button>
        <button className="btn-ghost" onClick={handleRefresh} style={{ fontSize: '0.68rem', height: 30, flex: 1 }}>
          🔄 Refresh Story
        </button>
      </div>
    </div>
  );
}

// ─── BACKEND LIVE DATA FETCHER ─────────────────────────────────────────────────
function BackendDataFetcher() {
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const setBackendStats = useArthaStore(s => s.setBackendStats);
  const setAllStockQuotes = useArthaStore(s => s.setAllStockQuotes);
  const setBackendOnline = useArthaStore(s => s.setBackendOnline);
  const addAlert = useArthaStore(s => s.addAlert);
  const alerts = useArthaStore(s => s.alerts);

  // Check backend health on mount
  useEffect(() => {
    checkBackend().then(online => {
      setBackendOnline(online);
      if (online) console.log('✅ ARTHA Backend connected at localhost:8000');
      else console.warn('⚠️ ARTHA Backend offline — running in local mock mode');
    });

    // Request browser notification permission exactly ONCE on the first user interaction
    const requestNotif = () => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
      document.removeEventListener('click', requestNotif);
    };
    document.addEventListener('click', requestNotif);

    return () => document.removeEventListener('click', requestNotif);
  }, []);

  // Fetch stats when stock changes
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get(`/stocks/${selectedSymbol}/statistics`);
        setBackendStats(data);
        if (data.alert) {
          const existing = alerts.find(a => a.symbol === data.alert.symbol && a.direction === data.alert.type && !a.dismissed);
          if (!existing) {
            addAlert({
              ...data.alert,
              id: data.alert.id || Date.now().toString(),
              timestamp: new Date(data.alert.timestamp || Date.now()),
              dismissed: false,
            });
          }
        }
      } catch (e) {
        // Backend offline — silent fail, use local stats
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  // Fetch all quotes every 30 seconds
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const data = await api.get('/stocks/mock-quotes');
        if (data.quotes) setAllStockQuotes(data.quotes);
      } catch (e) {}
    };
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live alerts every 2 minutes
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await api.get('/alerts/live');
        if (data.alerts?.length) {
          data.alerts.forEach(alert => {
            const existing = alerts.find(a => a.symbol === alert.symbol && a.direction === alert.direction && !a.dismissed);
            if (!existing) {
              addAlert({
                ...alert,
                id: alert.id || `${alert.symbol}_${Date.now()}`,
                timestamp: new Date(alert.timestamp || Date.now()),
                dismissed: false,
              });
            }
          });
        }
      } catch (e) {}
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 120000);
    return () => clearInterval(interval);
  }, [alerts.length]);

  return null;
}

// ─── LIVE TICK UPDATE ──────────────────────────────────────────────────────────
function LiveTickUpdater() {
  const tickAllStocks = useArthaStore(s => s.tickAllStocks);
  useEffect(() => {
    // Batch-tick all stocks once every 8s → single store write → single re-render pass
    const interval = setInterval(() => tickAllStocks(), 8000);
    return () => clearInterval(interval);
  }, [tickAllStocks]);
  return null;
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column' }}>
      <div className="scan-grid" style={{ opacity: 0.3 }} />
      <BackendDataFetcher />
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
              className="glass-card" style={{ padding: '14px', overflow: 'hidden' }}>
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
          {[<ProbabilityMeter />, <VolatilityMeter />, <ArthaScoreCard />, <LiveCommentary />].map((panel, i) => (
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
          {[<GlobalHeatmap />, <SectorHeatmap />, <StoryMode />, <CricketScorecard />].map((panel, i) => (
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
