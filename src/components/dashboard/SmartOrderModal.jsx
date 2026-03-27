import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, AlertTriangle } from 'lucide-react';
import { useArthaStore } from '../../store/arthaStore';

const ORDER_TYPES = ['Market', 'Limit', 'SL', 'SLM', 'Bracket', 'Cover', 'GTT', 'AMO'];
const TRADE_TYPES = ['MIS - Intraday', 'CNC - Delivery', 'NRML - F&O'];

const ORDER_DESC = {
  Market: 'Execute immediately at current market price',
  Limit: 'Execute only at your specified price or better',
  SL: 'Trigger order when price hits stop level',
  SLM: 'Like SL but executes at market price on trigger',
  Bracket: 'Entry + Target + Stop Loss in one order',
  Cover: 'Entry + mandatory Stop Loss (higher leverage)',
  GTT: 'Order stays until your price is hit (days/weeks)',
  AMO: 'Place order after market hours for next day open',
};

function GuardrailBadge({ status, message }) {
  const color = status === 'ok' ? '#00FF88' : status === 'warn' ? '#FFD700' : '#FF3355';
  const icon = status === 'ok' ? '🟢' : status === 'warn' ? '🟡' : '🔴';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Syne', fontSize: '0.72rem', color }}>
      <span>{icon}</span> {message}
    </div>
  );
}

export default function SmartOrderModal() {
  const showOrderModal = useArthaStore(s => s.showOrderModal);
  const orderAlert = useArthaStore(s => s.orderAlert);
  const closeOrderModal = useArthaStore(s => s.closeOrderModal);
  const capital = useArthaStore(s => s.capital);
  const riskPct = useArthaStore(s => s.riskPct);
  const broker = useArthaStore(s => s.broker);

  const [qty, setQty] = useState(21);
  const [orderType, setOrderType] = useState('Market');
  const [tradeType, setTradeType] = useState('MIS - Intraday');
  const [limit, setLimit] = useState('');
  const [slPrice, setSl] = useState('');
  const [tgtPrice, setTgt] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [countdown, setCountdown] = useState(0);

  if (!showOrderModal || !orderAlert) return null;

  const price = orderAlertPrice();
  const sl = parseFloat(slPrice || orderAlert.sl || 0);
  const target = parseFloat(tgtPrice || orderAlert.target || 0);
  const slRisk = Math.abs(price - sl) * qty;
  const targetProfit = Math.abs(target - price) * qty;
  const totalValue = price * qty;
  const capitalUsed = (totalValue / capital) * 100;
  const rr = slRisk > 0 ? (targetProfit / slRisk).toFixed(2) : '-';
  const maxRiskPct = (slRisk / capital) * 100;
  const brokerage = Math.min(40, totalValue * 0.0003);

  function orderAlertPrice() { return orderAlert?.price ?? 0; }

  const guardrails = [
    { status: totalValue <= capital ? 'ok' : 'error', message: totalValue <= capital ? 'Capital check: Sufficient funds available' : 'Insufficient funds!' },
    { status: maxRiskPct <= riskPct ? 'ok' : maxRiskPct <= 5 ? 'warn' : 'error', message: `Risk: ${maxRiskPct.toFixed(2)}% of capital ${maxRiskPct > riskPct ? '— above your limit' : '— within limits'}` },
    { status: capitalUsed <= 80 ? 'ok' : 'warn', message: `Using ${capitalUsed.toFixed(1)}% of capital on one trade` },
  ];

  const handleConfirm = () => {
    setConfirming(true);
    let c = 5;
    setCountdown(c);
    const t = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) { clearInterval(t); setConfirmed(true); }
    }, 1000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeOrderModal}
        style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: 20 }}
      >
        <motion.div
          initial={{ scale: 0.85, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 40 }}
          onClick={e => e.stopPropagation()}
          className="glass-card"
          style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 0, border: '1px solid rgba(255,107,0,0.4)' }}
        >
          {/* Header bar */}
          <div style={{ background: 'rgba(255,107,0,0.12)', padding: '14px 20px', borderBottom: '1px solid rgba(255,107,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Orbitron', fontSize: '0.88rem', color: '#FF6B00', fontWeight: 700, letterSpacing: '2px' }}>⚠️ ARTHA ORDER EDITOR</div>
            <button onClick={closeOrderModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '20px 20px 24px' }}>
            {confirmed ? (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
                <div style={{ fontFamily: 'Orbitron', fontSize: '1rem', color: '#00FF88', marginBottom: 8 }}>Order Placed!</div>
                <div style={{ fontFamily: 'Syne', fontSize: '0.82rem', color: '#666' }}>
                  {tradeType.split(' ')[0]} order for {qty} shares of {orderAlert.symbol} sent to {broker || 'broker'}
                </div>
                <button className="btn-primary" style={{ marginTop: 20 }} onClick={closeOrderModal}>Done</button>
              </motion.div>
            ) : (
              <>
                {/* Stock info */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: '0.95rem', color: '#F5F5F5', fontWeight: 700 }}>{orderAlert.symbol}</span>
                    <span className={`badge ${orderAlert.direction === 'RISE' ? 'badge-bull' : 'badge-bear'}`}>📉 {orderAlert.direction} SIGNAL</span>
                  </div>
                  <div style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#555' }}>
                    Confidence: {orderAlert.confidence}% | Timeframe: {orderAlert.timeframe}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

                {/* Trade & Order type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#555', display: 'block', marginBottom: 6 }}>TRADE TYPE</label>
                    <select value={tradeType} onChange={e => setTradeType(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 6, color: '#F5F5F5', fontFamily: 'Syne', fontSize: '0.78rem', padding: '8px 10px' }}>
                      {TRADE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#555', display: 'block', marginBottom: 6 }}>ORDER TYPE</label>
                    <select value={orderType} onChange={e => setOrderType(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 6, color: '#F5F5F5', fontFamily: 'Syne', fontSize: '0.78rem', padding: '8px 10px' }}>
                      {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Order desc */}
                <div style={{ padding: '6px 10px', background: 'rgba(255,107,0,0.05)', borderRadius: 6, marginBottom: 14, fontFamily: 'Syne', fontSize: '0.7rem', color: '#888' }}>
                  {ORDER_DESC[orderType]}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

                {/* Prices */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: '🎯 Entry', val: price.toFixed(2), editable: orderType === 'Limit', key: 'limit', setter: setLimit },
                    { label: '🛑 Stop Loss', val: sl.toFixed(2), editable: true, key: 'sl', setter: setSl },
                    { label: '🎯 Target', val: target.toFixed(2), editable: true, key: 'tgt', setter: setTgt },
                  ].map(({ label, val, editable, key, setter }) => (
                    <div key={key}>
                      <div style={{ fontFamily: 'Syne', fontSize: '0.62rem', color: '#555', marginBottom: 4 }}>{label}</div>
                      {editable ? (
                        <input className="artha-input" style={{ height: 36, fontSize: '0.82rem', fontFamily: 'JetBrains Mono', padding: '0 8px' }}
                          defaultValue={val} placeholder={val} onChange={e => setter(e.target.value)} />
                      ) : (
                        <div style={{ height: 36, display: 'flex', alignItems: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.82rem', color: '#FF6B00', fontWeight: 700 }}>₹{val}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

                {/* Quantity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#555', flexShrink: 0 }}>📦 QUANTITY</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', color: '#FF6B00', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Minus size={14} />
                    </button>
                    <input type="number" value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: 70, textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '1.1rem', fontWeight: 700, color: '#FF6B00', background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 6, padding: '4px 8px', outline: 'none' }} />
                    <button onClick={() => setQty(q => q + 1)} style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', color: '#FF6B00', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

                {/* Auto calculations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {[
                    ['💰 Total Value', `₹${totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, '#F5F5F5'],
                    ['🛑 Total SL Risk', `₹${slRisk.toFixed(2)}`, '#FF3355'],
                    ['🎯 Target Profit', `₹${targetProfit.toFixed(2)}`, '#00FF88'],
                    ['⚖️ Risk:Reward', `1 : ${rr}`, '#FFD700'],
                    ['📊 Capital Used', `${capitalUsed.toFixed(1)}%`, capitalUsed > 50 ? '#FF6B00' : '#888'],
                    ['💸 Est. Brokerage', `₹${brokerage.toFixed(0)}`, '#555'],
                  ].map(([lbl, val, color]) => (
                    <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Syne', fontSize: '0.75rem' }}>
                      <span style={{ color: '#555' }}>{lbl}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', color, fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

                {/* Guardrails */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                  <div style={{ fontFamily: 'Orbitron', fontSize: '0.62rem', color: '#555', letterSpacing: '1px', marginBottom: 4 }}>⚠️ SMART GUARDRAILS</div>
                  {guardrails.map((g, i) => <GuardrailBadge key={i} {...g} />)}
                </div>

                {/* Broker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontFamily: 'Syne', fontSize: '0.72rem' }}>
                  <span style={{ color: '#555' }}>BROKER:</span>
                  {broker ? (
                    <span style={{ color: '#00FF88' }}>🟢 {broker.charAt(0).toUpperCase() + broker.slice(1)} Connected</span>
                  ) : (
                    <span style={{ color: '#FF3355' }}>🔴 No broker connected — connect in settings</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn-ghost" style={{ flex: 1, height: 46 }} onClick={closeOrderModal}>
                    <X size={14} /> Cancel
                  </button>
                  {confirming && !confirmed ? (
                    <button className="btn-primary" style={{ flex: 2, height: 46 }} disabled>
                      Activating in {countdown}s...
                    </button>
                  ) : (
                    <button id="order-confirm" className="btn-primary" style={{ flex: 2, height: 46 }} onClick={handleConfirm} disabled={guardrails.some(g => g.status === 'error') || !broker}>
                      ✅ CONFIRM & EXECUTE
                    </button>
                  )}
                </div>
                {!broker && <div style={{ textAlign: 'center', fontFamily: 'Syne', fontSize: '0.7rem', color: '#FF3355', marginTop: 8 }}>Connect a broker to execute orders</div>}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
