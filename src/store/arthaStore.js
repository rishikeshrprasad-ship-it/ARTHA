// ARTHA Mock Data — Realistic NSE/BSE data for demo
import { create } from 'zustand';

// ─── WATCHLIST STOCKS ─────────────────────────────────────────────────────────
export const STOCKS = {
  RELIANCE: { name: 'Reliance Industries', symbol: 'RELIANCE', exchange: 'NSE', sector: 'Energy', lot: 250, price: 2847.50, change: 33.40, changePct: 1.19, open: 2820.0, high: 2860.0, low: 2810.0, prev: 2814.10, volume: 8234567, avgVol: 7100000, week52H: 3024.90, week52L: 2220.30, pe: 23.4, delivPct: 42.3, mktCap: '19.28L Cr' },
  TATAMOTORS: { name: 'Tata Motors', symbol: 'TATAMOTORS', exchange: 'NSE', sector: 'Auto', lot: 1375, price: 924.50, change: -7.80, changePct: -0.84, open: 932.0, high: 938.5, low: 918.0, prev: 932.30, volume: 15432100, avgVol: 12000000, week52H: 1052.40, week52L: 651.90, pe: 12.4, delivPct: 28.7, mktCap: '3.07L Cr' },
  INFOSYS: { name: 'Infosys Ltd', symbol: 'INFY', exchange: 'NSE', sector: 'IT', lot: 300, price: 1847.25, change: 22.15, changePct: 1.21, open: 1825.0, high: 1854.0, low: 1820.5, prev: 1825.10, volume: 6781234, avgVol: 5500000, week52H: 1953.90, week52L: 1357.00, pe: 24.8, delivPct: 51.2, mktCap: '7.72L Cr' },
  HDFCBANK: { name: 'HDFC Bank', symbol: 'HDFCBANK', exchange: 'NSE', sector: 'Banking', lot: 550, price: 1724.80, change: 18.30, changePct: 1.07, open: 1710.0, high: 1731.5, low: 1705.0, prev: 1706.50, volume: 11234560, avgVol: 9800000, week52H: 1880.00, week52L: 1363.55, pe: 18.9, delivPct: 46.8, mktCap: '13.18L Cr' },
  WIPRO: { name: 'Wipro Ltd', symbol: 'WIPRO', exchange: 'NSE', sector: 'IT', lot: 1500, price: 478.60, change: -3.40, changePct: -0.71, open: 482.0, high: 484.5, low: 475.0, prev: 482.00, volume: 9876543, avgVol: 8200000, week52H: 571.75, week52L: 393.25, pe: 19.2, delivPct: 38.5, mktCap: '2.50L Cr' },
  ICICIBANK: { name: 'ICICI Bank', symbol: 'ICICIBANK', exchange: 'NSE', sector: 'Banking', lot: 700, price: 1287.40, change: 15.60, changePct: 1.23, open: 1272.0, high: 1295.0, low: 1268.5, prev: 1271.80, volume: 14567890, avgVol: 12300000, week52H: 1361.15, week52L: 939.70, pe: 17.1, delivPct: 49.3, mktCap: '9.08L Cr' },
  HCLTECH: { name: 'HCL Technologies', symbol: 'HCLTECH', exchange: 'NSE', sector: 'IT', lot: 700, price: 1923.75, change: 28.45, changePct: 1.50, open: 1895.0, high: 1932.0, low: 1890.0, prev: 1895.30, volume: 5432100, avgVol: 4800000, week52H: 2012.35, week52L: 1235.65, pe: 26.4, delivPct: 55.1, mktCap: '5.23L Cr' },
  BAJFINANCE: { name: 'Bajaj Finance', symbol: 'BAJFINANCE', exchange: 'NSE', sector: 'NBFC', lot: 125, price: 7284.50, change: -92.30, changePct: -1.25, open: 7380.0, high: 7402.0, low: 7258.0, prev: 7376.80, volume: 3456789, avgVol: 2900000, week52H: 8192.00, week52L: 6178.00, pe: 30.8, delivPct: 32.4, mktCap: '4.51L Cr' },
};

// ─── GENERATE REALISTIC OHLCV CANDLES ─────────────────────────────────────────
function generateCandles(basePrice, count = 120, volatility = 0.012) {
  const candles = [];
  let price = basePrice;
  const now = new Date();
  
  for (let i = count; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 5 * 60 * 1000);
    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    price = Math.max(price + change, price * 0.95);
    const high = Math.max(open, price) * (1 + Math.random() * 0.005);
    const low = Math.min(open, price) * (1 - Math.random() * 0.005);
    const volume = Math.floor(150000 + Math.random() * 850000);
    
    candles.push({
      time: date.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume,
    });
  }
  return candles;
}

// ─── COMPUTE STATISTICS ────────────────────────────────────────────────────────
export function computeStats(candles) {
  const returns = [];
  for (let i = 1; i < candles.length; i++) {
    returns.push((candles[i].close - candles[i-1].close) / candles[i-1].close);
  }
  
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const sorted = [...returns].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  
  const semiVariance = returns.filter(r => r < mean).reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / n;
  const semiDev = Math.sqrt(semiVariance);
  
  const skewness = returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 3), 0) / n;
  const kurtosis = (returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 4), 0) / n) - 3;
  
  const lastReturn = returns[returns.length - 1];
  const zScore = stdDev !== 0 ? (lastReturn - mean) / stdDev : 0;
  
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  const outliers = returns.filter(r => r < q1 - 1.5 * iqr || r > q3 + 1.5 * iqr);
  
  const isNormal = Math.abs(skewness) < 1 && Math.abs(kurtosis) < 2;
  
  // Probability
  const positiveReturns = returns.filter(r => r > 0).length;
  const probability = positiveReturns / n;
  
  // Current volatility vs avg
  const recentReturns = returns.slice(-20);
  const recentVariance = recentReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / recentReturns.length;
  const currentVol = Math.sqrt(recentVariance);
  const volRatio = stdDev !== 0 ? currentVol / stdDev : 1;
  
  return {
    mean: mean * 100,
    median: median * 100,
    stdDev: stdDev * 100,
    semiDev: semiDev * 100,
    skewness,
    kurtosis,
    zScore,
    probability,
    isNormal,
    q1: q1 * 100,
    q3: q3 * 100,
    iqr: iqr * 100,
    outlierCount: outliers.length,
    volRatio,
    returns,
    sorted,
    n,
  };
}

// ─── GENERATE ALERT ───────────────────────────────────────────────────────────
export function generateAlert(symbol, stats, currentPrice) {
  const { zScore, skewness, probability, volRatio } = stats;
  
  if (Math.abs(zScore) < 1.8 || volRatio < 1.3) return null;
  
  const isBear = zScore > 1.8 && skewness < 0 && probability < 0.55;
  const isBull = zScore < -1.8 && skewness > 0 && probability > 0.55;
  
  if (!isBear && !isBull) return null;
  
  const direction = isBear ? 'FALL' : 'RISE';
  const confidence = Math.floor(Math.min(95, 60 + Math.abs(zScore) * 8 + volRatio * 5));
  const slPct = 0.038;
  const tgtPct = 0.056;
  const sl = isBear ? currentPrice * (1 + slPct) : currentPrice * (1 - slPct);
  const target = isBear ? currentPrice * (1 - tgtPct) : currentPrice * (1 + tgtPct);
  const rr = tgtPct / slPct;
  
  return {
    id: Date.now() + Math.random(),
    symbol,
    direction,
    confidence,
    price: currentPrice,
    sl: parseFloat(sl.toFixed(2)),
    target: parseFloat(target.toFixed(2)),
    rr: rr.toFixed(2),
    zScore: parseFloat(zScore.toFixed(2)),
    probability: parseFloat((isBear ? 1 - probability : probability).toFixed(3)),
    skewMsg: skewness < 0 ? 'Negative (-' + Math.abs(skewness).toFixed(1) + ')' : 'Positive (+' + skewness.toFixed(1) + ')',
    signal: `${Math.abs(zScore).toFixed(1)}σ ${direction === 'FALL' ? 'overbought' : 'oversold'}`,
    timeframe: '15min',
    timestamp: new Date(),
    dismissed: false,
  };
}

// ─── ARTHA SCORE ──────────────────────────────────────────────────────────────
export function computeArthaScore(stats) {
  const { zScore, volRatio, skewness, kurtosis, probability } = stats;
  
  const zScoreScore = Math.max(0, 25 - Math.abs(zScore) * 8);
  const volScore = Math.max(0, 20 - (volRatio - 1) * 10);
  const distScore = Math.max(0, 20 - Math.abs(skewness) * 5 - Math.abs(kurtosis) * 3);
  const trendScore = Math.max(0, 20 - Math.abs(zScore) * 4);
  const probScore = Math.min(15, Math.abs(probability - 0.5) * 60);
  
  return Math.min(100, Math.round(zScoreScore + volScore + distScore + trendScore + probScore));
}

// ─── GLOBAL MARKETS MOCK ──────────────────────────────────────────────────────
export const GLOBAL_MARKETS = [
  { name: 'NIFTY 50', value: '22,147.00', change: '+0.64%', up: true },
  { name: 'SENSEX', value: '72,890.00', change: '+0.51%', up: true },
  { name: 'SGX NIFTY', value: '22,210.00', change: '+0.28%', up: true },
  { name: 'DOW JONES', value: '38,239.00', change: '-0.18%', up: false },
  { name: 'S&P 500', value: '5,108.00', change: '+0.32%', up: true },
  { name: 'NASDAQ', value: '15,927.00', change: '+0.89%', up: true },
  { name: 'NIKKEI 225', value: '39,500.00', change: '+1.12%', up: true },
  { name: 'FTSE 100', value: '7,743.00', change: '-0.22%', up: false },
  { name: 'HANG SENG', value: '16,907.00', change: '+0.45%', up: true },
  { name: 'DAX', value: '17,891.00', change: '+0.67%', up: true },
];

// ─── FII/DII DATA ──────────────────────────────────────────────────────────────
export const FII_DII = [
  { date: '17 Mar', fii: 2847, dii: -1230 },
  { date: '18 Mar', fii: -1543, dii: 1876 },
  { date: '19 Mar', fii: 3214, dii: 987 },
  { date: '20 Mar', fii: 1876, dii: -432 },
  { date: '21 Mar', fii: -876, dii: 2134 },
  { date: 'Today', fii: 1543, dii: 832 },
];

// ─── NIFTY SECTORS ────────────────────────────────────────────────────────────
export const SECTORS = [
  { name: 'NIFTY IT', change: +1.82, stocks: ['INFY', 'TCS', 'WIPRO', 'HCLTECH'] },
  { name: 'NIFTY BANK', change: +0.94, stocks: ['HDFCBANK', 'ICICIBANK', 'AXISBANK'] },
  { name: 'NIFTY AUTO', change: -0.54, stocks: ['TATAMOTORS', 'M&M', 'MARUTI'] },
  { name: 'NIFTY PHARMA', change: +0.38, stocks: ['SUNPHARMA', 'CIPLA', 'DRREDDY'] },
  { name: 'NIFTY FMCG', change: +0.21, stocks: ['HUL', 'NESTLEIND', 'BRITANNIA'] },
  { name: 'NIFTY METAL', change: -1.23, stocks: ['TATASTEEL', 'JSWSTEEL', 'HINDALCO'] },
  { name: 'NIFTY ENERGY', change: +1.54, stocks: ['RELIANCE', 'BPCL', 'NTPC'] },
  { name: 'NIFTY REALTY', change: -0.87, stocks: ['DLF', 'GODREJPROP', 'OBEROIRLTY'] },
];

// ─── NIFTY 50 TICKER STOCKS ─────────────────────────────────────────────────────
export const TICKER_STOCKS = [
  { symbol: 'NIFTY50', price: '22,147.00', change: '+141.40', pct: '+0.64%', up: true },
  { symbol: 'BANKNIFTY', price: '47,892.00', change: '+392.00', pct: '+0.82%', up: true },
  { symbol: 'RELIANCE', price: '2,847.50', change: '+33.40', pct: '+1.19%', up: true },
  { symbol: 'TCS', price: '4,124.00', change: '+28.80', pct: '+0.70%', up: true },
  { symbol: 'INFY', price: '1,847.25', change: '+22.15', pct: '+1.21%', up: true },
  { symbol: 'HDFCBANK', price: '1,724.80', change: '+18.30', pct: '+1.07%', up: true },
  { symbol: 'ICICIBANK', price: '1,287.40', change: '+15.60', pct: '+1.23%', up: true },
  { symbol: 'WIPRO', price: '478.60', change: '-3.40', pct: '-0.71%', up: false },
  { symbol: 'TATAMOTORS', price: '924.50', change: '-7.80', pct: '-0.84%', up: false },
  { symbol: 'BAJFINANCE', price: '7,284.50', change: '-92.30', pct: '-1.25%', up: false },
  { symbol: 'HCLTECH', price: '1,923.75', change: '+28.45', pct: '+1.50%', up: true },
  { symbol: 'MARUTI', price: '12,247.00', change: '+142.50', pct: '+1.18%', up: true },
  { symbol: 'SUNPHARMA', price: '1,587.30', change: '+19.40', pct: '+1.24%', up: true },
  { symbol: 'AXISBANK', price: '1,124.60', change: '-8.90', pct: '-0.79%', up: false },
  { symbol: 'LTIM', price: '5,387.00', change: '+68.20', pct: '+1.28%', up: true },
  { symbol: 'NESTLEIND', price: '2,387.50', change: '+12.40', pct: '+0.52%', up: true },
  { symbol: 'TATASTEEL', price: '142.80', change: '-2.35', pct: '-1.62%', up: false },
  { symbol: 'ONGC', price: '274.40', change: '+3.80', pct: '+1.40%', up: true },
  { symbol: 'POWERGRID', price: '312.75', change: '+4.20', pct: '+1.36%', up: true },
  { symbol: 'TITAN', price: '3,587.00', change: '-42.50', pct: '-1.17%', up: false },
];

// ─── MONTE CARLO ──────────────────────────────────────────────────────────────
export function runMonteCarlo(currentPrice, mean, stdDev, days = 30, paths = 200) {
  const results = [];
  const meanD = mean / 100;
  const sdD = stdDev / 100;
  
  for (let p = 0; p < paths; p++) {
    const path = [currentPrice];
    let price = currentPrice;
    for (let d = 0; d < days; d++) {
      const u1 = Math.random(), u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      price = price * Math.exp(meanD + sdD * z);
      path.push(parseFloat(price.toFixed(2)));
    }
    results.push(path);
  }
  
  const finalPrices = results.map(p => p[p.length - 1]).sort((a, b) => a - b);
  const p5 = finalPrices[Math.floor(paths * 0.05)];
  const p50 = finalPrices[Math.floor(paths * 0.50)];
  const p95 = finalPrices[Math.floor(paths * 0.95)];
  const varAt95 = currentPrice - p5;
  
  return { paths: results, p5, p50, p95, var95: varAt95 };
}

// ─── ZUSTAND STORE ────────────────────────────────────────────────────────────
const initialStockData = {};
Object.entries(STOCKS).forEach(([sym, stock]) => {
  const candles = generateCandles(stock.price);
  initialStockData[sym] = {
    ...stock,
    candles,
    stats: computeStats(candles),
    arthaScore: 0, // computed below
  };
  initialStockData[sym].arthaScore = computeArthaScore(initialStockData[sym].stats);
});

export const useArthaStore = create((set, get) => ({
  // ── Auth ──
  user: null,
  isAuthenticated: false,
  authStep: 'splash', // splash | signup | verify | signin | onboarding | dashboard
  
  // ── Theme ──
  theme: 'dark',
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    set({ theme: next });
  },
  
  // ── Auth actions ──
  setAuthStep: (step) => set({ authStep: step }),
  signIn: (userData) => set({ user: userData, isAuthenticated: true, authStep: 'dashboard' }),
  signOut: () => set({ user: null, isAuthenticated: false, authStep: 'splash' }),
  
  // ── Market ──
  stocks: initialStockData,
  selectedSymbol: 'TATAMOTORS',
  selectedTimeframe: '5m',
  
  selectStock: (symbol) => set({ selectedSymbol: symbol }),
  selectTimeframe: (tf) => set({ selectedTimeframe: tf }),
  
  // ── Alerts ──
  alerts: [],
  dismissAlert: (id) => set(state => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a)
  })),
  addAlert: (alert) => set(state => ({
    alerts: [alert, ...state.alerts.filter(a => !a.dismissed)].slice(0, 20)
  })),
  
  // ── Watchlist ──
  watchlist: ['TATAMOTORS', 'RELIANCE', 'INFOSYS', 'HDFCBANK', 'ICICIBANK'],
  addToWatchlist: (sym) => set(state => ({
    watchlist: state.watchlist.includes(sym) ? state.watchlist : [...state.watchlist, sym]
  })),
  removeFromWatchlist: (sym) => set(state => ({
    watchlist: state.watchlist.filter(s => s !== sym)
  })),
  
  // ── Trading ──
  capital: 50000,
  riskPct: 2,
  paperMode: false,
  broker: null,
  
  togglePaperMode: () => set(state => ({ paperMode: !state.paperMode })),
  setCapital: (cap) => set({ capital: cap }),
  setBroker: (b) => set({ broker: b }),
  
  // ── Live tick simulation ──
  lastUpdate: new Date(),
  tickStock: (sym) => set(state => {
    const stock = state.stocks[sym];
    if (!stock) return state;
    const volatility = 0.001 + Math.random() * 0.002;
    const change = (Math.random() - 0.49) * volatility * stock.price;
    const newPrice = parseFloat((stock.price + change).toFixed(2));
    const newCandles = [...stock.candles.slice(-119), {
      ...stock.candles[stock.candles.length - 1],
      close: newPrice,
      high: Math.max(stock.candles[stock.candles.length - 1].high, newPrice),
      low: Math.min(stock.candles[stock.candles.length - 1].low, newPrice),
    }];
    const newStats = computeStats(newCandles);
    const newScore = computeArthaScore(newStats);
    
    return {
      stocks: {
        ...state.stocks,
        [sym]: {
          ...stock,
          price: newPrice,
          change: parseFloat((newPrice - stock.prev).toFixed(2)),
          changePct: parseFloat(((newPrice - stock.prev) / stock.prev * 100).toFixed(2)),
          candles: newCandles,
          stats: newStats,
          arthaScore: newScore,
        }
      },
      lastUpdate: new Date(),
    };
  }),
  
  // ── UI Panels ──
  showOrderModal: false,
  orderAlert: null,
  openOrderModal: (alert) => set({ showOrderModal: true, orderAlert: alert }),
  closeOrderModal: () => set({ showOrderModal: false, orderAlert: null }),
  
  showGlossary: false,
  toggleGlossary: () => set(state => ({ showGlossary: !state.showGlossary })),
  
  chatOpen: false,
  toggleChat: () => set(state => ({ chatOpen: !state.chatOpen })),
}));

export { generateCandles };
