import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, BookOpen, Bell, Moon, Sun, Wifi, WifiOff, Zap, LogOut, X } from 'lucide-react';
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
  const stocks = useArthaStore(s => s.stocks);
  
  const liveStocks = Object.values(stocks).map(s => ({
    symbol: s.symbol,
    price: s.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    pct: `${s.changePct >= 0 ? '+' : ''}${s.changePct?.toFixed(2)}%`,
    up: s.changePct >= 0,
  }));
  
  // Merge with static for NIFTY/BANKNIFTY which aren't in stocks
  const staticExtra = TICKER_STOCKS.filter(t => !liveStocks.find(l => l.symbol === t.symbol));
  const displayStocks = [...staticExtra.slice(0, 2), ...liveStocks];
  const doubled = [...displayStocks, ...displayStocks];
  
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

// Notifications Dropdown
function NotificationDropdown({ onClose }) {
  const notifications = useArthaStore(s => s.notifications);
  const markNotificationRead = useArthaStore(s => s.markNotificationRead);
  const clearNotifications = useArthaStore(s => s.clearNotifications);

  const timeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      style={{
        position: 'absolute', top: '100%', right: 0, width: 340, maxHeight: 420,
        background: 'rgba(14,14,14,0.98)', border: '1px solid rgba(255,107,0,0.2)',
        borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.8)', overflow: 'hidden',
        zIndex: 1000, marginTop: 8,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontFamily: 'Orbitron', fontSize: '0.75rem', color: '#FF6B00', letterSpacing: '2px' }}>🔔 NOTIFICATIONS</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {notifications.length > 0 && (
            <button onClick={clearNotifications} style={{ fontFamily: 'Syne', fontSize: '0.7rem', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>
              Clear all
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      </div>
      
      {/* Test Notification Row */}
      {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
         <div style={{ padding: '8px 16px', background: 'rgba(255,107,0,0.1)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button 
              onClick={() => {
                Notification.requestPermission().then(p => {
                  if (p === 'granted') new Notification('ARTHA Notifications Active', { body: 'Signals will now appear in Windows Action Center.' });
                });
              }}
              style={{ width: '100%', padding: '6px', background: '#FF6B00', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'Syne', fontSize: '0.75rem', fontWeight: 600 }}>
              Enable OS Notifications
            </button>
         </div>
      )}
      {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && (
         <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button 
              onClick={() => {
                const n = new Notification('ARTHA Test Signal', { body: 'RELIANCE 🔴 FALL confidence 94%', requireInteraction: true });
                n.onclick = () => window.focus();
              }}
              style={{ width: '100%', padding: '6px', background: 'rgba(255,255,255,0.05)', color: '#bbb', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, cursor: 'pointer', fontFamily: 'Syne', fontSize: '0.75rem' }}>
              Test System Pop-up
            </button>
         </div>
      )}

      {/* List */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', fontFamily: 'Syne', fontSize: '0.82rem', color: '#444' }}>
            No notifications yet
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.notifId}
              onClick={() => markNotificationRead(n.notifId)}
              style={{
                display: 'flex', gap: 12, padding: '12px 16px',
                background: n.read ? 'transparent' : 'rgba(255,107,0,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{n.direction === 'FALL' ? '🔴' : '🟢'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: '#F5F5F5', fontWeight: 600 }}>
                  {n.symbol} — {n.direction} SIGNAL
                </div>
                <div style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#666', marginTop: 2 }}>
                  Confidence {n.confidence}% · ₹{n.price}
                </div>
                <div style={{ fontFamily: 'Syne', fontSize: '0.65rem', color: '#444', marginTop: 2 }}>
                  {timeAgo(n.timestamp)}
                </div>
              </div>
              {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B00', flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))
        )}
      </div>
    </motion.div>
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
  const signOut = useArthaStore(s => s.signOut);
  const notifications = useArthaStore(s => s.notifications);
  const showNotifications = useArthaStore(s => s.showNotifications);
  const toggleNotifications = useArthaStore(s => s.toggleNotifications);
  const backendOnline = useArthaStore(s => s.backendOnline);

  const unreadCount = notifications.filter(n => !n.read).length;
  const bellRef = useRef(null);

  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,10,10,0.98)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,107,0,0.12)' }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed', top: 70, left: '50%', zIndex: 9999,
              background: 'rgba(14,14,14,0.9)', border: '1px solid #FF6B00',
              backdropFilter: 'blur(12px)', padding: '10px 20px', borderRadius: 30,
              fontFamily: 'Syne', fontSize: '0.8rem', color: '#F5F5F5',
              boxShadow: '0 10px 30px rgba(255,107,0,0.15)',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Zap size={14} color="#FF6B00" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
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

        <div style={{ flex: 1 }} />

        {/* Center status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <IST_Clock />

          {/* Backend status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} title={backendOnline ? 'Python backend connected' : 'Backend offline — using local data'}>
            {backendOnline
              ? <><span className="pulse-live" /><span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#00FF88' }}>API</span></>
              : <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#555', display: 'inline-block' }} /><span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#555' }}>LOCAL</span></>
            }
          </div>

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
          {/* Notification Bell */}
          <div style={{ position: 'relative' }} ref={bellRef}>
            <button
              onClick={toggleNotifications}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: showNotifications ? '#FF6B00' : '#888' }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#FF3355', color: '#fff', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <NotificationDropdown onClose={toggleNotifications} />
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => showToast("The glossary of statistical trading terms is currently being compiled.")} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#888' }} title="Glossary">
            <BookOpen size={18} />
          </button>

          <button onClick={() => showToast("ARTHA Pro Feature: Light mode is locked to preserve dark-room market immersion.")} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#888' }} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button onClick={() => showToast("Global settings panel is currently under maintenance.")} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#888' }} title="Settings">
            <Settings size={18} />
          </button>

          {/* AI Chat */}
          <button onClick={toggleChat} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', color: '#FF6B00', fontFamily: 'Syne', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            <Zap size={12} />
            ARTHA AI
          </button>

          {/* Logout */}
          <button onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', color: '#444', display: 'flex', alignItems: 'center', gap: 5 }} title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Ticker */}
      <TickerTape />
    </header>
  );
}
