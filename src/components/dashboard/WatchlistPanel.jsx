import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useArthaStore, STOCKS } from '../../store/arthaStore';

function MiniSparkline({ candles, up }) {
  const data = candles.slice(-20).map(c => ({ v: c.close }));
  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={up ? '#00FF88' : '#FF3355'} strokeWidth={1.5} dot={false}
          style={{ filter: `drop-shadow(0 0 3px ${up ? '#00FF88' : '#FF3355'})` }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const PRESET_TABS = ['My List', 'NIFTY 50', 'NIFTY BANK'];

export default function WatchlistPanel() {
  const stocks = useArthaStore(s => s.stocks);
  const watchlist = useArthaStore(s => s.watchlist);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const selectStock = useArthaStore(s => s.selectStock);
  const addToWatchlist = useArthaStore(s => s.addToWatchlist);
  const removeFromWatchlist = useArthaStore(s => s.removeFromWatchlist);
  const [tab, setTab] = useState('My List');
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const ALL_SYMBOLS = Object.keys(stocks);
  
  const displaySymbols = tab === 'My List'
    ? watchlist
    : tab === 'NIFTY BANK'
    ? ALL_SYMBOLS.filter(s => ['HDFCBANK', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK', 'SBIN', 'INDUSINDBK'].includes(s))
    : ALL_SYMBOLS; // NIFTY 50 shows all

  const filtered = showSearch
    ? ALL_SYMBOLS.filter(s => s.toLowerCase().includes(query.toLowerCase()) || stocks[s]?.name.toLowerCase().includes(query.toLowerCase()))
    : displaySymbols;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="section-header" style={{ flex: 1 }}>WATCHLIST</div>
        <button onClick={() => setShowSearch(!showSearch)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF6B00', display: 'flex' }}>
          {showSearch ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input
                className="artha-input"
                style={{ paddingLeft: 32, height: 40, fontSize: '0.82rem' }}
                placeholder="Search NSE/BSE stock..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      {!showSearch && (
        <div className="pill-tabs" style={{ padding: 2 }}>
          {PRESET_TABS.map(t => (
            <button key={t} className={`pill-tab ${tab === t ? 'active' : ''}`} style={{ flex: 1, fontSize: '0.65rem' }} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Stock List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(sym => {
          const stock = stocks[sym] || STOCKS[sym];
          if (!stock) return null;
          const up = stock.changePct >= 0;
          const isSelected = selectedSymbol === sym;
          const inWatchlist = watchlist.includes(sym);

          return (
            <motion.div
              key={sym}
              layout
              className={`watchlist-item ${isSelected ? 'active' : ''}`}
              onClick={() => { selectStock(sym); setShowSearch(false); setQuery(''); }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justify: 'space-between', marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', fontWeight: 700, color: isSelected ? '#FF6B00' : '#F5F5F5' }}>
                      {sym}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: '#555', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3 }}>
                      NSE
                    </span>
                    {/* ARTHA Score */}
                    {stocks[sym] && (
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: stocks[sym].arthaScore > 60 ? '#00FF88' : stocks[sym].arthaScore > 40 ? '#FFD700' : '#FF3355', background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 3 }}>
                        ⭐{stocks[sym].arthaScore}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'Syne', fontSize: '0.65rem', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
                    {stock.name || STOCKS[sym]?.name}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.88rem', fontWeight: 700, color: '#F5F5F5' }}>
                    ₹{stock.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    {up ? <TrendingUp size={10} color="#00FF88" /> : <TrendingDown size={10} color="#FF3355" />}
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: up ? '#00FF88' : '#FF3355', fontWeight: 600 }}>
                      {up ? '+' : ''}{stock.changePct?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Sparkline */}
              {stocks[sym] && (
                <div style={{ marginTop: 4 }}>
                  <MiniSparkline candles={stocks[sym].candles} up={up} />
                </div>
              )}

              {/* Volume bar */}
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (stock.volume / stock.avgVol) * 60)}%`, background: up ? '#00FF88' : '#FF3355', opacity: 0.5 }} />
                </div>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.58rem', color: '#444' }}>
                  {(stock.volume / 1000000).toFixed(1)}M
                </span>
              </div>

              {/* Add/Remove from watchlist (in search mode) */}
              {showSearch && (
                <button
                  onClick={e => { e.stopPropagation(); inWatchlist ? removeFromWatchlist(sym) : addToWatchlist(sym); }}
                  style={{ marginTop: 6, width: '100%', padding: '4px 0', borderRadius: 4, border: `1px solid ${inWatchlist ? 'rgba(255,51,85,0.3)' : 'rgba(255,107,0,0.3)'}`, background: 'transparent', color: inWatchlist ? '#FF3355' : '#FF6B00', fontFamily: 'Syne', fontSize: '0.68rem', cursor: 'pointer' }}
                >
                  {inWatchlist ? '− Remove' : '+ Add to Watchlist'}
                </button>
              )}
            </motion.div>
          );
        })}

        {/* Dynamic add button for missing stocks */}
        {showSearch && query.trim() !== '' && !ALL_SYMBOLS.some(s => s.toLowerCase() === query.trim().toLowerCase()) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '8px 12px', textAlign: 'center' }}>
            <button
              onClick={() => {
                useArthaStore.getState().addCustomStock(query);
                setQuery('');
                setShowSearch(false);
              }}
              style={{ padding: '8px 16px', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00FF88', borderRadius: 6, fontFamily: 'JetBrains Mono', fontSize: '0.75rem', cursor: 'pointer', width: '100%' }}
            >
              + Fetch & Add {query.toUpperCase()}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
