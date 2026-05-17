import { useState, useMemo, useCallback, useRef } from 'react';
import { ComposedChart, Area, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useArthaStore } from '../../store/arthaStore';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '1D', '1W', '1M'];
const TF_SLICE = { '1m': 30, '3m': 40, '5m': 60, '15m': 80, '30m': 100, '1h': 100, '2h': 120, '1D': 120, '1W': 120, '1M': 120 };
const VISIBLE  = 60; // candles visible in the popup at once (scrollable window)

// ── Indicator math (pure functions, run only when candles change via useMemo) ─
function computeBollinger(data, win = 20) {
  return data.map((_, i) => {
    if (i < win - 1) return { upper: null, lower: null, mid: null };
    const sl = data.slice(i - win + 1, i + 1);
    const m  = sl.reduce((s, x) => s + x.close, 0) / win;
    const sd = Math.sqrt(sl.reduce((s, x) => s + (x.close - m) ** 2, 0) / win);
    return { upper: +(m + 2 * sd).toFixed(2), lower: +(m - 2 * sd).toFixed(2), mid: +m.toFixed(2) };
  });
}
function computeVwap(data) {
  let pv = 0, v = 0;
  return data.map(d => { const tp=(d.high+d.low+d.close)/3; pv+=tp*d.volume; v+=d.volume; return v>0?+(pv/v).toFixed(2):d.close; });
}
function computeLinReg(data) {
  const n=data.length; let sx=0,sy=0,sxy=0,sx2=0;
  data.forEach((d,i)=>{ sx+=i; sy+=d.close; sxy+=i*d.close; sx2+=i*i; });
  const m=(n*sxy-sx*sy)/(n*sx2-sx*sx);
  const b=(sy-m*sx)/n;
  return data.map((_,i)=>+(m*i+b).toFixed(2));
}

// ── Candle shape (no drop-shadow — too expensive per-element) ─────────────────
const CandlestickBar = ({ x, y, width, height, payload }) => {
  if (!payload) return null;
  const up    = payload.close >= payload.open;
  const color = up ? '#00FF88' : '#FF3355';
  const range = payload.high - payload.low;
  if (!range) return null;
  const sc  = height / range;
  const byY = y + (payload.high - Math.max(payload.open, payload.close)) * sc;
  const bH  = Math.max(1.5, Math.abs(payload.close - payload.open) * sc);
  const mid = x + width / 2;
  return (
    <g>
      <line x1={mid} y1={y} x2={mid} y2={y + height} stroke={color} strokeWidth={1} opacity={0.55} />
      <rect x={x+1} y={byY} width={Math.max(width-2,1)} height={bH} fill={color} />
    </g>
  );
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload; if (!d) return null;
  const up = d.close >= d.open;
  return (
    <div style={{ background:'rgba(10,10,10,0.95)', border:`1px solid ${up?'rgba(0,255,136,0.3)':'rgba(255,51,85,0.3)'}`, borderRadius:8, padding:'9px 13px', fontFamily:'JetBrains Mono', fontSize:'0.7rem' }}>
      <div style={{ color:'#444', marginBottom:5, fontSize:'0.6rem' }}>{d.time?.slice(11,16)||''}</div>
      {[['O',d.open,'#888'],['H',d.high,'#00FF88'],['L',d.low,'#FF3355'],['C',d.close,'#FF6B00']].map(([k,v,c])=>(
        <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:18, color:c, lineHeight:'1.55' }}>
          <span>{k}</span><span>₹{v?.toFixed(2)}</span>
        </div>
      ))}
      <div style={{ marginTop:5, borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:5, color:'#333' }}>
        Vol: {(d.volume/1000).toFixed(0)}K
      </div>
    </div>
  );
};

// ── Shared chart renderer ─────────────────────────────────────────────────────
const ChartCore = ({ chartData, priceRange, isGreen, chartType }) => (
  <ResponsiveContainer width="100%" height="100%">
    <ComposedChart data={chartData} margin={{ top:6, right:6, left:-10, bottom:0 }}>
      <defs>
        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={isGreen ? '#00FF88' : '#FF3355'} stopOpacity={0.4}/>
          <stop offset="95%" stopColor={isGreen ? '#00FF88' : '#FF3355'} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <XAxis dataKey="time" tickFormatter={t=>t?.slice(11,16)||''}
        tick={{ fontFamily:'JetBrains Mono', fontSize:9, fill:'#333' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
      <YAxis domain={priceRange}
        tick={{ fontFamily:'JetBrains Mono', fontSize:9, fill:'#333' }} tickLine={false} axisLine={false}
        tickFormatter={v=>'₹'+v?.toFixed(0)} width={54} />
      <YAxis yAxisId="vol" domain={[0,'dataMax * 5']} orientation="right" hide />
      <Tooltip content={<ChartTooltip />} />
      <Bar dataKey="volume" yAxisId="vol" fill="rgba(255,107,0,0.09)" stroke="none" radius={[1,1,0,0]} isAnimationActive={false} />
      
      {chartType === 'candle' ? (
        <Bar dataKey="close" fill="transparent" stroke="transparent" shape={<CandlestickBar />} isAnimationActive={false} />
      ) : (
        <Area type="monotone" dataKey="close" stroke={isGreen ? '#00FF88' : '#FF3355'} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
      )}

      <Line type="monotone" dataKey="bb_upper" stroke="rgba(255,107,0,0.38)" strokeWidth={1} dot={false} strokeDasharray="4 3" isAnimationActive={false} />
      <Line type="monotone" dataKey="bb_lower" stroke="rgba(255,107,0,0.38)" strokeWidth={1} dot={false} strokeDasharray="4 3" isAnimationActive={false} />
      <Line type="monotone" dataKey="bb_mid"   stroke="rgba(255,255,255,0.1)"  strokeWidth={1} dot={false} strokeDasharray="2 4" isAnimationActive={false} />
      <Line type="monotone" dataKey="vwap" stroke="#4488FF" strokeWidth={1.5} dot={false} isAnimationActive={false} />
      <Line type="monotone" dataKey="reg"  stroke="#FF6B00" strokeWidth={1.5} dot={false} strokeDasharray="6 3" isAnimationActive={false} />
      <ReferenceLine y={priceRange[1]*0.998} stroke="rgba(0,255,136,0.2)" strokeDasharray="3 3" label={{ value:'+2σ', fill:'#00FF88', fontSize:9 }} />
      <ReferenceLine y={priceRange[0]*1.002} stroke="rgba(255,51,85,0.2)"  strokeDasharray="3 3" label={{ value:'-2σ', fill:'#FF3355', fontSize:9 }} />
    </ComposedChart>
  </ResponsiveContainer>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function CandlestickChart() {
  const selectedSymbol    = useArthaStore(s => s.selectedSymbol);
  const candles_raw       = useArthaStore(s => s.stocks[selectedSymbol]?.candles);
  const price             = useArthaStore(s => s.stocks[selectedSymbol]?.price);
  const change            = useArthaStore(s => s.stocks[selectedSymbol]?.change);
  const changePct         = useArthaStore(s => s.stocks[selectedSymbol]?.changePct);
  const high              = useArthaStore(s => s.stocks[selectedSymbol]?.high);
  const low               = useArthaStore(s => s.stocks[selectedSymbol]?.low);
  const open              = useArthaStore(s => s.stocks[selectedSymbol]?.open);
  const week52H           = useArthaStore(s => s.stocks[selectedSymbol]?.week52H);
  const selectedTimeframe = useArthaStore(s => s.selectedTimeframe);
  const selectTimeframe   = useArthaStore(s => s.selectTimeframe);

  const [isOpen, setIsOpen]   = useState(false);
  const [scrollIdx, setScrollIdx] = useState(0); // popup pan offset (0 = show latest)
  const [chartType, setChartType] = useState('line'); // 'line' | 'candle'

  const openModal  = useCallback(() => { setScrollIdx(0); setIsOpen(true); },  []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  // Sliced candles for the current timeframe
  const candles = useMemo(() => {
    if (!candles_raw) return [];
    return candles_raw.slice(-(TF_SLICE[selectedTimeframe] || 80));
  }, [candles_raw, selectedTimeframe]);

  // Indicators — only recompute when candles change
  const fullChartData = useMemo(() => {
    if (!candles.length) return [];
    const boll = computeBollinger(candles);
    const vw   = computeVwap(candles);
    const reg  = computeLinReg(candles);
    return candles.map((c, i) => ({ ...c, bb_upper:boll[i].upper, bb_lower:boll[i].lower, bb_mid:boll[i].mid, vwap:vw[i], reg:reg[i] }));
  }, [candles]);

  const priceRange = useMemo(() => {
    if (!candles.length) return [0, 1];
    return [ Math.min(...candles.map(c=>c.low))*0.998, Math.max(...candles.map(c=>c.high))*1.002 ];
  }, [candles]);

  // Inline chart uses last 60 candles (fast render)
  const inlineData = useMemo(() => fullChartData.slice(-60), [fullChartData]);

  // Popup uses a scrollable window of VISIBLE candles
  const totalCandles  = fullChartData.length;
  const maxScrollIdx  = Math.max(0, totalCandles - VISIBLE);
  const popupData = useMemo(() => {
    const start = maxScrollIdx - scrollIdx;
    return fullChartData.slice(Math.max(0, start), start + VISIBLE);
  }, [fullChartData, scrollIdx, maxScrollIdx]);

  const popupPriceRange = useMemo(() => {
    if (!popupData.length) return priceRange;
    return [ Math.min(...popupData.map(c=>c.low))*0.998, Math.max(...popupData.map(c=>c.high))*1.002 ];
  }, [popupData, priceRange]);

  const canScrollLeft  = scrollIdx < maxScrollIdx;
  const canScrollRight = scrollIdx > 0;
  const scrollStep = Math.max(1, Math.floor(VISIBLE / 3));

  if (!candles_raw) return null;
  const isGreen = (changePct ?? 0) >= 0;

  const ChartControls = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
      <div className="pill-tabs">
        {TIMEFRAMES.map(tf => (
          <button key={tf} className={`pill-tab ${selectedTimeframe===tf?'active':''}`} onClick={() => selectTimeframe(tf)}>{tf}</button>
        ))}
      </div>
      <div className="pill-tabs">
        <button className={`pill-tab ${chartType==='line'?'active':''}`} onClick={() => setChartType('line')}>Line</button>
        <button className={`pill-tab ${chartType==='candle'?'active':''}`} onClick={() => setChartType('candle')}>Candle</button>
      </div>
    </div>
  );

  const Legend = () => (
    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
      {[['VWAP','#4488FF'],['Reg','#FF6B00'],['BB','rgba(255,107,0,0.5)']].map(([label,color]) => (
        <div key={label} style={{ display:'flex', alignItems:'center', gap:4 }}>
          <div style={{ width:16, height:2, background:color, borderRadius:1 }} />
          <span style={{ fontFamily:'Syne', fontSize:'0.62rem', color:'#444' }}>{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* ── Compact inline chart (fixed 240px, no lag) ──────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span style={{ fontFamily:'Orbitron', fontSize:'0.95rem', fontWeight:700, color:'#F5F5F5' }}>{selectedSymbol}</span>
            <span style={{ fontFamily:'JetBrains Mono', fontSize:'1.3rem', fontWeight:700, color:'#FF6B00' }}>
              ₹{price?.toLocaleString('en-IN',{minimumFractionDigits:2})}
            </span>
            <span style={{ fontFamily:'JetBrains Mono', fontSize:'0.82rem', color:isGreen?'#00FF88':'#FF3355', fontWeight:600 }}>
              {isGreen?'+':''}{change?.toFixed(2)} ({isGreen?'+':''}{changePct?.toFixed(2)}%)
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            {[['H',high,'#00FF88'],['L',low,'#FF3355'],['O',open,'#888'],['52W',week52H,'#FFD700']].map(([l,v,c]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Syne', fontSize:'0.58rem', color:'#444' }}>{l}</div>
                <div style={{ fontFamily:'JetBrains Mono', fontSize:'0.74rem', color:c, fontWeight:600 }}>₹{v?.toFixed(0)}</div>
              </div>
            ))}
            <button onClick={openModal} title="Open full chart"
              style={{ background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.2)', borderRadius:6, color:'#FF6B00', cursor:'pointer', padding:'5px 8px', display:'flex', alignItems:'center' }}>
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        <ChartControls />
        <Legend />

        {/* 240px click-to-open */}
        <div onClick={openModal} className="chart-wrapper"
          style={{ height:240, minHeight:240, maxHeight:240, position:'relative', cursor:'pointer', borderRadius:8, overflow:'hidden' }}>
          <div className="radar-scan" />
          {inlineData.length > 0 && <ChartCore chartData={inlineData} priceRange={priceRange} isGreen={isGreen} chartType={chartType} />}
          <div style={{ position:'absolute', bottom:6, right:8, fontFamily:'Syne', fontSize:'0.58rem', color:'rgba(255,107,0,0.35)', pointerEvents:'none' }}>
            tap to expand ↗
          </div>
        </div>
      </div>

      {/* ── Fullscreen popup ─────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Blurred backdrop */}
            <motion.div key="bd"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.2 }}
              onClick={closeModal}
              style={{ position:'fixed', inset:0, zIndex:9990, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)' }}
            />

            {/* Modal */}
            <motion.div key="modal"
              initial={{ opacity:0, scale:0.87, y:50 }}
              animate={{ opacity:1, scale:1,    y:0  }}
              exit={{   opacity:0, scale:0.87, y:50  }}
              transition={{ duration:0.32, ease:[0.16,1,0.3,1] }}
              style={{ position:'fixed', inset:0, zIndex:9991, display:'flex', alignItems:'center', justifyContent:'center', padding:16, pointerEvents:'none' }}
            >
              <div style={{
                pointerEvents:'all',
                background:'linear-gradient(160deg,#0f0f0f 0%,#111 55%,#0c0c0c 100%)',
                border:'1px solid rgba(255,107,0,0.16)',
                borderRadius:18,
                padding:'18px 22px 16px',
                width:'97vw', maxWidth:1340,
                height:'92vh',
                display:'flex', flexDirection:'column', gap:10,
                position:'relative',
                boxShadow:'0 0 0 1px rgba(255,107,0,0.04), 0 60px 160px rgba(0,0,0,0.95), 0 0 100px rgba(255,107,0,0.04)',
              }}>

                {/* ── TOP BAR: Close + Title ── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                    <span style={{ fontFamily:'Orbitron', fontSize:'1.1rem', fontWeight:700, color:'#F5F5F5' }}>{selectedSymbol}</span>
                    <span style={{ fontFamily:'JetBrains Mono', fontSize:'1.55rem', fontWeight:700, color:'#FF6B00' }}>
                      ₹{price?.toLocaleString('en-IN',{minimumFractionDigits:2})}
                    </span>
                    <span style={{ fontFamily:'JetBrains Mono', fontSize:'0.88rem', color:isGreen?'#00FF88':'#FF3355', fontWeight:600 }}>
                      {isGreen?'+':''}{change?.toFixed(2)} ({isGreen?'+':''}{changePct?.toFixed(2)}%)
                    </span>
                  </div>

                  {/* Prominent close button */}
                  <button
                    onClick={closeModal}
                    style={{
                      background:'rgba(255,51,85,0.12)',
                      border:'1px solid rgba(255,51,85,0.35)',
                      borderRadius:10,
                      color:'#FF3355',
                      cursor:'pointer',
                      padding:'8px 18px',
                      display:'flex', alignItems:'center', gap:7,
                      fontFamily:'Orbitron', fontSize:'0.72rem', fontWeight:700,
                      letterSpacing:'1px',
                      boxShadow:'0 0 20px rgba(255,51,85,0.18)',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,51,85,0.22)';e.currentTarget.style.boxShadow='0 0 32px rgba(255,51,85,0.35)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,51,85,0.12)';e.currentTarget.style.boxShadow='0 0 20px rgba(255,51,85,0.18)';}}
                  >
                    <X size={15} /> CLOSE
                  </button>
                </div>

                {/* Meta row */}
                <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                  {[['HIGH',high,'#00FF88'],['LOW',low,'#FF3355'],['OPEN',open,'#888'],['52W H',week52H,'#FFD700']].map(([l,v,c]) => (
                    <div key={l} style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'Syne', fontSize:'0.58rem', color:'#444' }}>{l}</div>
                      <div style={{ fontFamily:'JetBrains Mono', fontSize:'0.82rem', color:c, fontWeight:600 }}>₹{v?.toFixed(0)}</div>
                    </div>
                  ))}
                </div>

                <ChartControls />
                <Legend />

                {/* Chart area */}
                <div className="chart-wrapper" style={{ flex:1, minHeight:0, position:'relative', borderRadius:10, overflow:'hidden' }}>
                  <div className="radar-scan" />
                  {popupData.length > 0 && <ChartCore chartData={popupData} priceRange={popupPriceRange} isGreen={isGreen} chartType={chartType} />}
                </div>

                {/* ── Scroll / Pan controls ── */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
                  <button
                    onClick={() => setScrollIdx(i => Math.min(i + scrollStep, maxScrollIdx))}
                    disabled={!canScrollLeft}
                    style={{ background:canScrollLeft?'rgba(255,107,0,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${canScrollLeft?'rgba(255,107,0,0.3)':'rgba(255,255,255,0.06)'}`, borderRadius:8, color:canScrollLeft?'#FF6B00':'#333', cursor:canScrollLeft?'pointer':'default', padding:'6px 14px', display:'flex', alignItems:'center', gap:5, fontFamily:'Syne', fontSize:'0.72rem' }}>
                    <ChevronLeft size={14} /> Older
                  </button>

                  {/* Progress indicator */}
                  <div style={{ flex:1, maxWidth:340, background:'rgba(255,255,255,0.05)', borderRadius:4, height:4, position:'relative', overflow:'hidden' }}>
                    <div style={{
                      position:'absolute', height:'100%', borderRadius:4,
                      background:'linear-gradient(90deg,#FF6B00,#FFD700)',
                      width:`${(scrollIdx / Math.max(maxScrollIdx,1)) * 100}%`,
                      right:0,
                      transition:'width 0.15s ease',
                    }} />
                  </div>

                  <button
                    onClick={() => setScrollIdx(i => Math.max(i - scrollStep, 0))}
                    disabled={!canScrollRight}
                    style={{ background:canScrollRight?'rgba(255,107,0,0.1)':'rgba(255,255,255,0.03)', border:`1px solid ${canScrollRight?'rgba(255,107,0,0.3)':'rgba(255,255,255,0.06)'}`, borderRadius:8, color:canScrollRight?'#FF6B00':'#333', cursor:canScrollRight?'pointer':'default', padding:'6px 14px', display:'flex', alignItems:'center', gap:5, fontFamily:'Syne', fontSize:'0.72rem' }}>
                    Newer <ChevronRight size={14} />
                  </button>

                  <span style={{ fontFamily:'Syne', fontSize:'0.6rem', color:'#333' }}>
                    {popupData.length} of {totalCandles} · {selectedTimeframe}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
