import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useArthaStore, generateAlert } from '../../store/arthaStore';

function AlertCard({ alert, onDismiss, onExecute }) {
  const isBull = alert.direction === 'RISE';
  const borderColor = isBull ? '#00FF88' : '#FF3355';
  const confidenceColor = alert.confidence >= 75 ? '#00FF88' : alert.confidence >= 50 ? '#FFD700' : '#FF3355';

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="alert-card"
      style={{ borderLeft: `3px solid ${borderColor}`, boxShadow: `-3px 0 16px ${borderColor}20` }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: '#F5F5F5', fontWeight: 700 }}>{alert.symbol}</span>
            <span className={`badge ${isBull ? 'badge-bull' : 'badge-bear'}`}>
              {isBull ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {alert.direction}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.88rem', color: '#FF6B00', fontWeight: 700 }}>
              ₹{alert.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: confidenceColor, background: `${confidenceColor}15`, border: `1px solid ${confidenceColor}30`, borderRadius: 4, padding: '1px 6px' }}>
              {alert.confidence}% confidence
            </span>
          </div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', padding: 2, display: 'flex' }}>
          <X size={14} />
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />

      {/* Signals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        <div style={{ fontFamily: 'Syne', fontSize: '0.65rem', color: '#555', marginBottom: 2 }}>📊 Signals Triggered:</div>
        {[
          `Z-Score: ${alert.zScore}σ (${alert.signal})`,
          `Probability of ${alert.direction.toLowerCase()}: ${(alert.probability * 100).toFixed(1)}%`,
          `Skewness: ${alert.skewMsg}`,
          `Timeframe: ${alert.timeframe}`,
        ].map(sig => (
          <div key={sig} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: '#888', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: borderColor }}>•</span> {sig}
          </div>
        ))}
      </div>

      {/* Trade levels */}
      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[['🎯 Entry', alert.price, '#FF6B00'], ['🛑 Stop Loss', alert.sl, '#FF3355'], ['🏆 Target', alert.target, '#00FF88']].map(([label, val, color]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '0.58rem', color: '#444' }}>{label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color, fontWeight: 700 }}>₹{val?.toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 6, fontFamily: 'Syne', fontSize: '0.62rem', color: '#555' }}>
          R:R = <span style={{ color: '#FFD700', fontFamily: 'JetBrains Mono' }}>1:{alert.rr}</span>
        </div>
      </div>

      {/* Time */}
      <div style={{ fontFamily: 'Syne', fontSize: '0.62rem', color: '#444', marginBottom: 10 }}>
        ⏱️ Next 15–30 mins · {alert.timestamp?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onExecute} className="btn-primary" style={{ flex: 2, height: 34, fontSize: '0.65rem', padding: '0 10px' }}>
          <Zap size={12} /> EXECUTE
        </button>
        <button onClick={onDismiss} className="btn-ghost" style={{ flex: 1, height: 34, fontSize: '0.65rem' }}>
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}

export default function AlertPanel() {
  const stocks = useArthaStore(s => s.stocks);
  const alerts = useArthaStore(s => s.alerts);
  const addAlert = useArthaStore(s => s.addAlert);
  const dismissAlert = useArthaStore(s => s.dismissAlert);
  const openOrderModal = useArthaStore(s => s.openOrderModal);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);

  // Auto-generate alerts periodically
  useEffect(() => {
    const generate = () => {
      const stock = stocks[selectedSymbol];
      if (!stock?.stats) return;
      const alert = generateAlert(selectedSymbol, stock.stats, stock.price);
      if (alert) addAlert(alert);
    };

    // Initial alert
    setTimeout(generate, 3000);
    const interval = setInterval(generate, 90000 + Math.random() * 60000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const activeAlerts = alerts.filter(a => !a.dismissed);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="section-header" style={{ flex: 1 }}>
          🚨 ARTHA ALERTS
          {activeAlerts.length > 0 && (
            <span style={{ marginLeft: 8, background: '#FF3355', color: '#fff', borderRadius: 10, padding: '2px 7px', fontSize: '0.6rem', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
              {activeAlerts.length}
            </span>
          )}
        </div>
        {activeAlerts.length > 0 && (
          <button onClick={() => activeAlerts.forEach(a => dismissAlert(a.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Syne', fontSize: '0.68rem', color: '#444' }}>
            Clear all
          </button>
        )}
      </div>

      {/* Alert list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence>
          {activeAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, textAlign: 'center' }}
            >
              <div style={{ fontSize: '2.5rem', opacity: 0.3 }}>💤</div>
              <div style={{ fontFamily: 'Syne', fontSize: '0.82rem', color: '#444' }}>No active alerts right now</div>
              <div style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#333' }}>ARTHA is monitoring all signals...</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span className="pulse-live" />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: '#00FF88' }}>Scanning {Object.keys(stocks).length} stocks</span>
              </div>
            </motion.div>
          ) : (
            activeAlerts.map(alert => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDismiss={() => dismissAlert(alert.id)}
                onExecute={() => openOrderModal(alert)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ARTHA Brain accuracy */}
      <div style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.4)', borderRadius: 8, border: '1px solid rgba(255,107,0,0.1)' }}>
        <div style={{ fontFamily: 'Orbitron', fontSize: '0.6rem', color: '#555', marginBottom: 6 }}>ARTHA BRAIN</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[['Overall', '71.4%', '#FF6B00'], ['Z-Score', '81.2%', '#00FF88'], ['Volatility', '68.5%', '#FFD700']].map(([label, pct, color]) => (
            <div key={label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color, fontWeight: 700 }}>{pct}</div>
              <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', color: '#444' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
