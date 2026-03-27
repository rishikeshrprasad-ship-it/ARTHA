import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, BookOpen, Bell, Moon, Sun, Wifi, WifiOff, Zap } from 'lucide-react';
import { useArthaStore, TICKER_STOCKS } from '../../store/arthaStore';

function IST_Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const ist = new Date(time.getTime() + (5.5 * 60 * 60 * 1000));
  const h = String(ist.getUTCHours()).padStart(2, '0');
  const m = String(ist.getUTCMinutes()).padStart(2, '0');
  const s = String(ist.getUTCSeconds()).padStart(2, '0');

  const isMarketOpen = ist.getUTCHours() >= 3 && (ist.getUTCHours() < 10 || (ist.getUTCHours() === 10 && ist.getUTCMinutes() <= 30));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isMarketOpen ? <span className="pulse-live" /> : <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF3355', display: 'inline-block' }} />}
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: isMarketOpen ? '#00FF88' : '#FF3355', fontWeight: 600 }}>
          NSE {isMarketOpen ? 'LIVE' : 'CLOSED'}
        </span>
      </div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.8rem', color: '#888' }}>
        {h}:{m}:{s} IST
      </div>
    </div>
  );
}

function TickerTape() {
  const doubled = [...TICKER_STOCKS, ...TICKER_STOCKS];
  return (
    <div className="ticker-container" style={{ height: 32 }}>
      <div className="ticker-track" style={{ height: '100%', alignItems: 'center', gap: 0 }}>
        {doubled.map((stock, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 16px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#888', fontWeight: 600 }}>{stock.symbol}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#F5F5F5' }}>₹{stock.price}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: stock.up ? '#00FF88' : '#FF3355' }}>
              {stock.up ? '▲' : '▼'}{stock.pct}
            </span>
            <span style={{ color: 'rgba(255,107,0,0.3)', fontSize: '0.6rem', marginLeft: 8 }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Header() {
  const theme = useArthaStore(s => s.theme);
  const toggleTheme = useArthaStore(s => s.toggleTheme);
  const toggleGlossary = useArthaStore(s => s.toggleGlossary);
  const toggleChat = useArthaStore(s => s.toggleChat);
  const paperMode = useArthaStore(s => s.paperMode);
  const togglePaperMode = useArthaStore(s => s.togglePaperMode);
  const capital = useArthaStore(s => s.capital);
  const broker = useArthaStore(s => s.broker);
  const alerts = useArthaStore(s => s.alerts);
  const unreadAlerts = alerts.filter(a => !a.dismissed).length;

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,10,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,107,0,0.12)' }}>
      {/* Main header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, border: '2px solid #FF6B00', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(255,107,0,0.5)', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Orbitron', fontWeight: 900, color: '#FF6B00', fontSize: 15 }}>A</span>
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: '1.1rem', color: '#FF6B00', letterSpacing: '0.15em', textShadow: '0 0 15px rgba(255,107,0,0.5)' }}>ARTHA</div>
            <div style={{ fontFamily: 'Noto Sans Devanagari', fontSize: '0.58rem', color: '#666', letterSpacing: '0.02em' }}>अर्थ — Statistical Intelligence</div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Center status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <IST_Clock />
          
          {/* Paper mode toggle */}
          <button onClick={togglePaperMode} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20,
            border: `1px solid ${paperMode ? '#FFD700' : 'rgba(255,255,255,0.08)'}`,
            background: paperMode ? 'rgba(255,215,0,0.1)' : 'transparent',
            color: paperMode ? '#FFD700' : '#555', fontFamily: 'JetBrains Mono', fontSize: '0.68rem',
            cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600,
          }}>
            {paperMode ? '📋 PAPER' : '⚡ LIVE'}
          </button>

          {/* Broker status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {broker ? <Wifi size={12} color="#00FF88" /> : <WifiOff size={12} color="#555" />}
            <span style={{ fontFamily: 'Syne', fontSize: '0.7rem', color: broker ? '#00FF88' : '#555' }}>
              {broker ? broker.charAt(0).toUpperCase() + broker.slice(1) : 'No Broker'}
            </span>
          </div>

          {/* Capital */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: 'Syne', fontSize: '0.68rem', color: '#555' }}>Capital:</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: '#FF6B00', fontWeight: 700 }}>
              ₹{capital.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {/* Alerts badge */}
          <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#888' }}>
            <Bell size={18} />
            {unreadAlerts > 0 && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#FF3355', color: '#fff', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                {unreadAlerts}
              </span>
            )}
          </button>

          <button onClick={toggleGlossary} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#888' }} title="Glossary">
            <BookOpen size={18} />
          </button>

          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#888' }} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#888' }} title="Settings">
            <Settings size={18} />
          </button>

          {/* AI Chat */}
          <button onClick={toggleChat} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', color: '#FF6B00', fontFamily: 'Syne', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Zap size={12} />
            ARTHA AI
          </button>
        </div>
      </div>

      {/* Ticker */}
      <TickerTape />
    </header>
  );
}
