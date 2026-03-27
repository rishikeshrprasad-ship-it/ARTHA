import { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useArthaStore, STOCKS } from '../../store/arthaStore';

// ─── CORRELATION HEATMAP ──────────────────────────────────────────────────────
const SYMBOLS = ['RELIANCE', 'TATAMOTORS', 'INFOSYS', 'HDFCBANK', 'WIPRO', 'ICICIBANK', 'HCLTECH', 'BAJFINANCE'];

function pearsonCorr(a, b) {
  const n = Math.min(a.length, b.length);
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  const num = a.slice(0, n).reduce((s, x, i) => s + (x - ma) * (b[i] - mb), 0);
  const da = Math.sqrt(a.slice(0, n).reduce((s, x) => s + (x - ma) ** 2, 0));
  const db = Math.sqrt(b.slice(0, n).reduce((s, x) => s + (x - mb) ** 2, 0));
  return da * db === 0 ? 0 : parseFloat((num / (da * db)).toFixed(3));
}

function corrColor(c) {
  if (c >= 0.7) return '#00FF88';
  if (c >= 0.3) return '#7AFF88';
  if (c >= -0.3) return '#888888';
  if (c >= -0.7) return '#FF8855';
  return '#FF3355';
}

export function CorrelationHeatmap() {
  const stocks = useArthaStore(s => s.stocks);
  const [hoveredCell, setHoveredCell] = useState(null);

  const getReturns = (sym) => stocks[sym]?.stats?.returns || [];

  const matrix = SYMBOLS.map(s1 => SYMBOLS.map(s2 => {
    if (s1 === s2) return 1;
    const r1 = getReturns(s1), r2 = getReturns(s2);
    return r1.length > 5 ? pearsonCorr(r1, r2) : (Math.random() * 1.4 - 0.7);
  }));

  const shortNames = SYMBOLS.map(s => s.slice(0, 5));
  const cellSize = 54;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-header">🌡️ CORRELATION MATRIX</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 60, height: 6, background: 'linear-gradient(90deg, #FF3355, #888, #00FF88)', borderRadius: 3 }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.62rem', color: '#444' }}>-1 → +1</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#888', padding: '6px 10px', background: 'rgba(0,0,0,0.6)', borderRadius: 6, border: '1px solid rgba(255,107,0,0.15)' }}>
          {hoveredCell.s1} ↔ {hoveredCell.s2}: <span style={{ color: corrColor(hoveredCell.v), fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{hoveredCell.v.toFixed(3)}</span>
          <span style={{ color: '#444', marginLeft: 8, fontSize: '0.65rem' }}>⚠️ Correlation ≠ Causation</span>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
          {/* Column headers */}
          <div style={{ display: 'flex', gap: 2, marginLeft: 56 }}>
            {shortNames.map(n => (
              <div key={n} style={{ width: cellSize, textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {n}
              </div>
            ))}
          </div>
          {matrix.map((row, si) => (
            <div key={si} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <div style={{ width: 52, fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: '#444', textAlign: 'right', paddingRight: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {shortNames[si]}
              </div>
              {row.map((val, ti) => {
                const bg = val === 1 ? '#FF6B00' : corrColor(val);
                return (
                  <div
                    key={ti}
                    className="heatmap-cell"
                    style={{ width: cellSize, height: 26, background: `${bg}${Math.abs(val) > 0.5 ? '40' : '18'}`, color: bg, fontSize: '0.58rem', fontFamily: 'JetBrains Mono', border: `1px solid ${bg}20` }}
                    onMouseEnter={() => setHoveredCell({ s1: SYMBOLS[si], s2: SYMBOLS[ti], v: val })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {val.toFixed(2)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── REGRESSION PANEL ─────────────────────────────────────────────────────────
function linRegR2(x, y) {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  const num = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0);
  const denX = Math.sqrt(x.reduce((s, xi) => s + (xi - mx) ** 2, 0));
  const denY = Math.sqrt(y.reduce((s, yi) => s + (yi - my) ** 2, 0));
  const r = denX * denY === 0 ? 0 : num / (denX * denY);
  return { r2: parseFloat((r * r).toFixed(4)), slope: parseFloat((num / x.reduce((s, xi) => s + (xi - mx) ** 2, 0)).toFixed(6)) };
}

export function RegressionPanel() {
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const [stockB, setStockB] = useState('RELIANCE');
  const stock = stocks[selectedSymbol];

  if (!stock?.stats?.returns?.length) return null;

  const returnsA = stock.stats.returns.slice(-40);
  const returnsB = stocks[stockB]?.stats?.returns?.slice(-40) ?? returnsA.map(() => Math.random() * 0.02 - 0.01);
  const n = Math.min(returnsA.length, returnsB.length);

  const scatterData = Array.from({ length: n }, (_, i) => ({
    x: parseFloat((returnsA[i] * 100).toFixed(4)),
    y: parseFloat((returnsB[i] * 100).toFixed(4)),
  }));

  const { r2, slope } = linRegR2(scatterData.map(d => d.x), scatterData.map(d => d.y));
  const trendStrength = r2 > 0.7 ? 'Strong' : r2 > 0.4 ? 'Moderate' : 'Weak';
  const trendColor = r2 > 0.7 ? '#00FF88' : r2 > 0.4 ? '#FFD700' : '#FF3355';

  const outliers = scatterData.filter(d => Math.abs(d.x) > 1.5 || Math.abs(d.y) > 1.5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="section-header">📈 REGRESSION PANEL</div>
        <select value={stockB} onChange={e => setStockB(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 6, color: '#888', fontFamily: 'JetBrains Mono', fontSize: '0.72rem', padding: '3px 8px' }}>
          {Object.keys(STOCKS).filter(s => s !== selectedSymbol).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[['R²', r2.toFixed(3), '#FF6B00'], ['Slope', slope.toFixed(4), '#F5F5F5'], ['Strength', trendStrength, trendColor]].map(([lbl, val, c]) => (
          <div key={lbl} style={{ flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', color: '#555', marginBottom: 3 }}>{lbl}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.92rem', color: c, fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Scatter */}
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <XAxis type="number" dataKey="x" name={selectedSymbol} tick={{ fontFamily: 'JetBrains Mono', fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} label={{ value: `${selectedSymbol} Returns (%)`, position: 'insideBottom', offset: -4, style: { fontFamily: 'Syne', fontSize: 9, fill: '#555' } }} />
            <YAxis type="number" dataKey="y" name={stockB} tick={{ fontFamily: 'JetBrains Mono', fontSize: 8, fill: '#444' }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#444' }}
              contentStyle={{ background: 'rgba(17,17,17,0.98)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 6, fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }} />
            <Scatter data={scatterData} shape="circle">
              {scatterData.map((d, i) => {
                const isOutlier = outliers.includes(d);
                return <Cell key={i} fill={isOutlier ? '#FF6B00' : 'rgba(255,107,0,0.3)'} r={isOutlier ? 5 : 3}
                  style={isOutlier ? { filter: 'drop-shadow(0 0 4px rgba(255,107,0,0.8))' } : {}} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {outliers.length > 0 && (
        <div style={{ fontFamily: 'Syne', fontSize: '0.68rem', color: '#FF6B00' }}>
          ⭕ {outliers.length} outliers detected (orange dots)
        </div>
      )}
    </div>
  );
}

// ─── MARKET WEATHER ───────────────────────────────────────────────────────────
export function MarketWeather() {
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const stock = stocks[selectedSymbol];
  const stats = stock?.stats;

  if (!stats) return null;

  const prob = stats.probability ?? 0.5;
  const volRatio = stats.volRatio ?? 1;
  const zScore = Math.abs(stats.zScore ?? 0);

  let weather = '☀️', mood = 'CLEAR', moodColor = '#00FF88', desc = 'Favorable statistical conditions';
  if (zScore > 2) { weather = '⛈️'; mood = 'STORM WARNING'; moodColor = '#FF3355'; desc = 'Extreme Z-Score — high risk conditions'; }
  else if (volRatio > 1.8) { weather = '🌩️'; mood = 'TURBULENT'; moodColor = '#FF6B00'; desc = 'Very high volatility — tread carefully'; }
  else if (volRatio > 1.3) { weather = '🌦️'; mood = 'PARTLY CLOUDY'; moodColor = '#FFD700'; desc = 'Moderate volatility — monitor signals closely'; }
  else if (prob < 0.45) { weather = '🌧️'; mood = 'BEARISH WEATHER'; moodColor = '#FF3355'; desc = 'Probability favors downside today'; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="section-header">🌤️ MARKET WEATHER</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: '2.8rem' }}>{weather}</div>
        <div>
          <div style={{ fontFamily: 'Orbitron', fontSize: '0.8rem', color: moodColor, marginBottom: 4 }}>{mood}</div>
          <div style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#666', lineHeight: 1.5 }}>{desc}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {[
          ['🌡️ Momentum', `${stock.arthaScore}/100`, '#F5F5F5'],
          ['💨 Volume', `${((stock.volume ?? 0) / (stock.avgVol ?? 1) * 100).toFixed(0)}%`, '#888'],
          ['🌧️ Fall Risk', `${(100 - prob * 100).toFixed(0)}%`, '#FF3355'],
          ['⚡ Z-Alert', `${(stats.zScore ?? 0).toFixed(1)}σ`, zScore > 2 ? '#FF3355' : '#888'],
        ].map(([lbl, val, c]) => (
          <div key={lbl} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne', fontSize: '0.58rem', color: '#444', marginBottom: 2 }}>{lbl}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: c, fontWeight: 700 }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
