import { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { useArthaStore } from '../../store/arthaStore';

const DIST_TABS = ['Normal', 'Binomial', 'Poisson', 'Uniform', 'T-Dist', 'Overlay'];

// Normal distribution PDF
function normalPDF(x, mean, sd) {
  return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
}

// Generate distribution data
function generateNormal(mean, sd, points = 60) {
  const range = sd * 4;
  const step = range / points;
  const start = mean - range / 2;
  return Array.from({ length: points + 1 }, (_, i) => {
    const x = start + i * step;
    return { x: parseFloat(x.toFixed(4)), pdf: normalPDF(x, mean, sd) };
  });
}

// Generate Uniform Distribution
function generateUniform(mean, sd, points = 60) {
  const range = sd * Math.sqrt(12);
  const step = (sd * 4) / points;
  const startX = mean - (sd * 2);
  return Array.from({ length: points + 1 }, (_, i) => {
    const x = startX + i * step;
    const pdf = (x >= mean - range/2 && x <= mean + range/2) ? 1/range : 0;
    return { x: parseFloat(x.toFixed(4)), pdf };
  });
}

// Generate T-Distribution approximation (fat tails)
function generateTDist(mean, sd, points = 60) {
  const dof = 3; // 3 degrees of freedom for stock returns
  const range = sd * 5;
  const step = range / points;
  const start = mean - range / 2;
  return Array.from({ length: points + 1 }, (_, i) => {
    const x = start + i * step;
    const t = (x - mean) / sd;
    const pdf = (1 / (sd * Math.sqrt(dof * Math.PI))) * Math.pow(1 + (t*t)/dof, -(dof+1)/2);
    return { x: parseFloat(x.toFixed(4)), pdf };
  });
}

// Generate Skewed (Binomial/Poisson approximation)
function generateSkewed(mean, sd, points = 60, skew = 1) {
  const range = sd * 4;
  const step = range / points;
  const start = mean - range / 2;
  return Array.from({ length: points + 1 }, (_, i) => {
    const x = start + i * step;
    const shift = (x < mean) ? sd * (1 - skew*0.5) : sd * (1 + skew*0.5);
    const pdf = normalPDF(x, mean + skew * sd * 0.2, Math.abs(shift));
    return { x: parseFloat(x.toFixed(4)), pdf };
  });
}

function generateHistogram(returns, bins = 20) {
  if (!returns?.length) return [];
  const min = Math.min(...returns);
  const max = Math.max(...returns);
  const binWidth = (max - min) / bins || 1;
  const counts = Array(bins).fill(0);
  returns.forEach(r => {
    const i = Math.min(Math.floor((r - min) / binWidth), bins - 1);
    counts[i]++;
  });
  return counts.map((count, i) => ({
    x: parseFloat((min + (i + 0.5) * binWidth).toFixed(4)),
    count: count / returns.length / binWidth,
    raw: count,
  }));
}

const DistTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const isLine = payload[0].dataKey === 'pdf';
  return (
    <div style={{ background: 'rgba(17,17,17,0.98)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: 6, padding: '8px 12px', fontFamily: 'JetBrains Mono', fontSize: '0.72rem' }}>
      <div style={{ color: '#FF6B00' }}>x = {payload[0]?.payload.x?.toFixed(4)}</div>
      {isLine ? (
        <div style={{ color: '#888' }}>PDF = {payload[0]?.value?.toFixed(4)}</div>
      ) : (
        <div style={{ color: '#00FF88' }}>Freq = {payload[0]?.payload?.raw ?? Math.round(payload[0]?.value)}</div>
      )}
    </div>
  );
};

export default function DistributionPanel() {
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const [activeTab, setActiveTab] = useState('Normal');

  const stock = stocks[selectedSymbol];
  if (!stock?.stats) return null;

  const { mean, stdDev, returns, isNormal, probability, skewness } = stock.stats;
  const meanD = mean / 100;
  const sdD = Math.max(stdDev / 100, 0.001); // avoid divide by zero

  const histData = generateHistogram(returns);
  const normalData = generateNormal(meanD, sdD);
  const probRise = probability;
  const probFall = 1 - probability;

  // Determine which data to render
  let renderData = normalData;
  let useBarChart = false;

  if (activeTab === 'Overlay' || activeTab === 'Histogram') {
    useBarChart = true;
    renderData = histData;
  } else if (activeTab === 'Binomial') {
    renderData = generateSkewed(meanD, sdD, 60, 1.5);
  } else if (activeTab === 'Poisson') {
    renderData = generateSkewed(meanD, sdD, 60, -1.5);
  } else if (activeTab === 'Uniform') {
    renderData = generateUniform(meanD, sdD);
  } else if (activeTab === 'T-Dist') {
    renderData = generateTDist(meanD, sdD);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="section-header">📊 DISTRIBUTION ANALYSIS</div>
        <span className={`badge ${isNormal ? 'badge-bull' : 'badge-neutral'}`}>
          {isNormal ? '✅ Normal' : '⚠️ Non-Normal'}
        </span>
      </div>

      {/* Tabs */}
      <div className="pill-tabs">
        {DIST_TABS.map(tab => (
          <button key={tab} className={`pill-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* Main probability display */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne', fontSize: '0.65rem', color: '#555', marginBottom: 4 }}>Prob. of RISE</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.6rem', fontWeight: 700, color: '#00FF88', textShadow: '0 0 15px rgba(0,255,136,0.4)' }}>
            {(probRise * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ background: 'rgba(255,51,85,0.05)', border: '1px solid rgba(255,51,85,0.2)', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne', fontSize: '0.65rem', color: '#555', marginBottom: 4 }}>Prob. of FALL</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '1.6rem', fontWeight: 700, color: '#FF3355', textShadow: '0 0 15px rgba(255,51,85,0.4)' }}>
            {(probFall * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          {!useBarChart ? (
            <AreaChart key={activeTab} data={renderData}>
              <defs>
                <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="x" tick={{ fontFamily: 'JetBrains Mono', fontSize: 8, fill: '#444' }} tickLine={false} axisLine={false}
                tickFormatter={v => (v * 100).toFixed(1) + '%'} />
              <YAxis hide />
              <Tooltip content={<DistTooltip />} />
              <ReferenceLine x={meanD} stroke="#FF6B00" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="pdf" stroke="#FF6B00" strokeWidth={2} fill="url(#normalGrad)" isAnimationActive={false}
                style={{ filter: 'drop-shadow(0 0 4px rgba(255,107,0,0.5))' }} />
            </AreaChart>
          ) : (
            <BarChart key={activeTab} data={renderData}>
              <XAxis dataKey="x" tick={{ fontFamily: 'JetBrains Mono', fontSize: 8, fill: '#444' }} tickLine={false} axisLine={false}
                tickFormatter={v => (v * 100).toFixed(1) + '%'} />
              <YAxis hide />
              <Tooltip content={<DistTooltip />} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                {renderData.map((entry, i) => (
                  <Cell key={i} fill={entry.x < meanD ? 'rgba(255,51,85,0.6)' : 'rgba(0,255,136,0.6)'} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Normality warning */}
      {!isNormal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 6 }}>
          <span style={{ fontSize: '0.8rem' }}>⚠️</span>
          <span style={{ fontFamily: 'Syne', fontSize: '0.72rem', color: '#FFD700' }}>
            Fat Tails Detected — Normal Distribution may underestimate risk
          </span>
        </div>
      )}
    </div>
  );
}
