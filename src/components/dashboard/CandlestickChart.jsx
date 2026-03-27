import { useMemo, useRef } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area } from 'recharts';
import { useArthaStore } from '../../store/arthaStore';

const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '1D', '1W', '1M'];

// Compute SMA
function sma(data, key, window) {
  return data.map((d, i) => {
    if (i < window - 1) return null;
    const slice = data.slice(i - window + 1, i + 1);
    return slice.reduce((sum, x) => sum + x[key], 0) / window;
  });
}

// Compute Bollinger Bands
function bollinger(data, window = 20) {
  return data.map((d, i) => {
    if (i < window - 1) return { upper: null, lower: null, mid: null };
    const slice = data.slice(i - window + 1, i + 1);
    const m = slice.reduce((s, x) => s + x.close, 0) / window;
    const sd = Math.sqrt(slice.reduce((s, x) => s + Math.pow(x.close - m, 2), 0) / window);
    return { upper: parseFloat((m + 2 * sd).toFixed(2)), lower: parseFloat((m - 2 * sd).toFixed(2)), mid: parseFloat(m.toFixed(2)) };
  });
}

// Compute VWAP
function vwap(data) {
  let cumPV = 0, cumV = 0;
  return data.map(d => {
    const typical = (d.high + d.low + d.close) / 3;
    cumPV += typical * d.volume;
    cumV += d.volume;
    return cumV > 0 ? parseFloat((cumPV / cumV).toFixed(2)) : d.close;
  });
}

// Linear regression
function linReg(data) {
  const n = data.length;
  const x = data.map((_, i) => i);
  const y = data.map(d => d.close);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
  const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / n;
  return data.map((_, i) => parseFloat((m * i + b).toFixed(2)));
}

// Custom Candlestick shape
const CandlestickBar = (props) => {
  const { x, y, width, height, open, close, high, low, payload } = props;
  if (!payload) return null;
  const isUp = payload.close >= payload.open;
  const color = isUp ? '#00FF88' : '#FF3355';
  const bodyH = Math.abs(payload.close - payload.open);
  const priceRange = payload.high - payload.low;
  if (priceRange === 0) return null;

  // Scale to pixel coords
  const scale = height / priceRange || 1;
  const bodyY = y + (payload.high - Math.max(payload.open, payload.close)) * scale;
  const bodyHeight = Math.max(1, bodyH * scale);
  const wickTop = y;
  const wickBottom = y + height;
  const wickX = x + width / 2;

  return (
    <g>
      {/* Wick */}
      <line x1={wickX} y1={wickTop} x2={wickX} y2={wickBottom} stroke={color} strokeWidth={1} opacity={0.7} />
      {/* Body */}
      <rect x={x + 1} y={bodyY} width={Math.max(width - 2, 1)} height={Math.max(bodyHeight, 1.5)}
        fill={color} stroke={color} strokeWidth={0.5} style={{ filter: `drop-shadow(0 0 2px ${color})` }} />
    </g>
  );
};

// Custom Tooltip
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const up = d.close >= d.open;

  return (
    <div style={{ background: 'rgba(17,17,17,0.98)', border: `1px solid ${up ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,85,0.3)'}`, borderRadius: 8, padding: '10px 14px', fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }}>
      <div style={{ color: '#888', marginBottom: 6, fontSize: '0.65rem' }}>{d.time?.slice(11, 16) || ''}</div>
      {[['O', d.open], ['H', d.high], ['L', d.low], ['C', d.close]].map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: k === 'H' ? '#00FF88' : k === 'L' ? '#FF3355' : k === 'C' ? '#FF6B00' : '#888' }}>
          <span>{k}</span><span>₹{v?.toFixed(2)}</span>
        </div>
      ))}
      <div style={{ marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6, color: '#555' }}>
        Vol: {(d.volume / 1000).toFixed(0)}K
      </div>
    </div>
  );
};

export default function CandlestickChart() {
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const selectedTimeframe = useArthaStore(s => s.selectedTimeframe);
  const selectTimeframe = useArthaStore(s => s.selectTimeframe);

  const stock = stocks[selectedSymbol];
  if (!stock) return null;

  const candles = stock.candles.slice(-80);

  const bollData = useMemo(() => bollinger(candles), [candles]);
  const vwapData = useMemo(() => vwap(candles), [candles]);
  const regLine = useMemo(() => linReg(candles), [candles]);

  const chartData = candles.map((c, i) => ({
    ...c,
    bb_upper: bollData[i].upper,
    bb_lower: bollData[i].lower,
    bb_mid: bollData[i].mid,
    vwap: vwapData[i],
    reg: regLine[i],
    idx: i,
  }));

  const priceRange = [
    Math.min(...candles.map(c => c.low)) * 0.998,
    Math.max(...candles.map(c => c.high)) * 1.002,
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontFamily: 'Orbitron', fontSize: '1rem', fontWeight: 700, color: '#F5F5F5' }}>{selectedSymbol}</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '1.4rem', fontWeight: 700, color: '#FF6B00' }}>
            ₹{stock.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: stock.changePct >= 0 ? '#00FF88' : '#FF3355', fontWeight: 600 }}>
            {stock.changePct >= 0 ? '+' : ''}{stock.change?.toFixed(2)} ({stock.changePct >= 0 ? '+' : ''}{stock.changePct?.toFixed(2)}%)
          </span>
        </div>

        {/* Stock meta */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          {[['H', stock.high, '#00FF88'], ['L', stock.low, '#FF3355'], ['O', stock.open, '#888'], ['52W H', stock.week52H, '#FFD700']].map(([label, val, color]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', color: '#555' }}>{label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color, fontWeight: 600 }}>₹{val?.toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeframe tabs */}
      <div className="pill-tabs">
        {TIMEFRAMES.map(tf => (
          <button key={tf} className={`pill-tab ${selectedTimeframe === tf ? 'active' : ''}`} onClick={() => selectTimeframe(tf)}>
            {tf}
          </button>
        ))}
      </div>

      {/* Overlays legend */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[['VWAP', '#4488FF'], ['Reg Line', '#FF6B00'], ['BB Upper', 'rgba(255,107,0,0.5)'], ['BB Lower', 'rgba(255,107,0,0.5)']].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 18, height: 2, background: color, borderRadius: 1 }} />
            <span style={{ fontFamily: 'Syne', fontSize: '0.65rem', color: '#555' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="chart-wrapper" style={{ flex: 1, minHeight: 240 }}>
        <div className="radar-scan" />
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <XAxis dataKey="time" tickFormatter={t => t?.slice(11, 16) || ''} tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#444' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={priceRange} tick={{ fontFamily: 'JetBrains Mono', fontSize: 9, fill: '#444' }} tickLine={false} axisLine={false} tickFormatter={v => '₹' + v?.toFixed(0)} width={58} />
            <Tooltip content={<ChartTooltip />} />

            {/* Volume bars at bottom */}
            <Bar dataKey="volume" yAxisId="vol" fill="rgba(255,107,0,0.1)" stroke="none" radius={[1, 1, 0, 0]} />

            {/* Candlestick via bars */}
            <Bar dataKey="close" fill="transparent" stroke="transparent" shape={<CandlestickBar />} />

            {/* Bollinger Bands */}
            <Line type="monotone" dataKey="bb_upper" stroke="rgba(255,107,0,0.45)" strokeWidth={1} dot={false} strokeDasharray="4 3" />
            <Line type="monotone" dataKey="bb_lower" stroke="rgba(255,107,0,0.45)" strokeWidth={1} dot={false} strokeDasharray="4 3" />
            <Line type="monotone" dataKey="bb_mid" stroke="rgba(255,255,255,0.2)" strokeWidth={1} dot={false} strokeDasharray="2 4" />

            {/* VWAP */}
            <Line type="monotone" dataKey="vwap" stroke="#4488FF" strokeWidth={1.5} dot={false}
              style={{ filter: 'drop-shadow(0 0 4px #4488FF)' }} />

            {/* Regression Line */}
            <Line type="monotone" dataKey="reg" stroke="#FF6B00" strokeWidth={1.5} dot={false} strokeDasharray="6 3"
              style={{ filter: 'drop-shadow(0 0 4px rgba(255,107,0,0.5))' }} />

            {/* Z-Score reference lines */}
            <ReferenceLine y={priceRange[0] * 1.002} stroke="rgba(255,51,85,0.3)" strokeDasharray="3 3" label={{ value: '-2σ', fill: '#FF3355', fontSize: 9 }} />
            <ReferenceLine y={priceRange[1] * 0.998} stroke="rgba(0,255,136,0.3)" strokeDasharray="3 3" label={{ value: '+2σ', fill: '#00FF88', fontSize: 9 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
