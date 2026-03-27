import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useArthaStore } from '../../store/arthaStore';

const QUICK_ACTIONS = [
  { id: 'explain', label: '📊 Explain this stat', prompt: 'Explain the current Z-Score for this stock' },
  { id: 'predict', label: '🔮 What will happen?', prompt: 'Based on the stats, what is the outlook?' },
  { id: 'risk', label: '⚠️ Any risks?', prompt: 'What are the statistical risks right now?' },
  { id: 'learn', label: '📖 Teach me', prompt: 'Teach me about the most important stat shown' },
  { id: 'brief', label: '📈 Market brief', prompt: 'Give me a quick market brief' },
];

function getArthaResponse(prompt, symbol, stats) {
  const zScore = stats?.zScore?.toFixed(2) ?? '0';
  const prob = ((stats?.probability ?? 0.5) * 100).toFixed(1);
  const skew = stats?.skewness?.toFixed(2) ?? '0';
  const vol = stats?.stdDev?.toFixed(3) ?? '0';

  if (prompt.toLowerCase().includes('z-score') || prompt.toLowerCase().includes('zscore')) {
    return `The Z-Score for **${symbol}** is currently **${zScore}σ**. ${Math.abs(parseFloat(zScore)) > 2 ? `This is statistically significant — the stock is ${parseFloat(zScore) > 0 ? 'overbought 🔴' : 'oversold 🟢'}. Watch for mean reversion!` : 'This is within normal range (< ±2σ). No extreme signal right now.'}

Formula: Z = (Current Return - Mean) / Std Dev

*⚠️ This is statistical analysis, not financial advice.*`;
  }

  if (prompt.toLowerCase().includes('risk')) {
    return `Statistical risks for **${symbol}**:

• **Volatility**: ${vol}% std dev — ${parseFloat(vol) > 1.5 ? 'HIGH ⚠️' : 'Normal ✅'}
• **Skewness**: ${skew} — ${parseFloat(skew) < -0.5 ? 'Negative skew: more downside risk' : 'Positive: manageable'}
• **Z-Score**: ${zScore}σ — ${Math.abs(parseFloat(zScore)) > 2 ? '⚠️ Extreme deviation!' : '✅ Normal range'}

Overall risk-adjusted probability of rise: **${prob}%**

*⚠️ Statistical analysis only — always use stop losses.*`;
  }

  if (prompt.toLowerCase().includes('teach') || prompt.toLowerCase().includes('learn')) {
    return `📖 **Quick Lesson: Z-Score**

The Z-Score tells you how many standard deviations away the current price/return is from the average.

**Formula:** Z = (x - μ) / σ

**What it means for ${symbol}:**
- Current Z = ${zScore}σ
- ${Math.abs(parseFloat(zScore)) > 2 ? '⚡ ALERT: Statistically extreme!' : 'Within normal range'}

**Trading Rule:**
- Z > +2: Statistically overbought → potential pullback
- Z < -2: Statistically oversold → potential bounce
- Between ±2: Stay neutral

*This is the #1 signal ARTHA uses for alerts!*`;
  }

  if (prompt.toLowerCase().includes('brief') || prompt.toLowerCase().includes('outlook')) {
    return `📊 **ARTHA Market Brief — ${symbol}**

Current Price: Based on live feed
Probability of Rise: **${prob}%**
Z-Score: **${zScore}σ** (${Math.abs(parseFloat(zScore)) > 2 ? '⚠️ Extreme' : '✅ Normal'})
Volatility: **${vol}%** std dev
Skewness: **${skew}** (${parseFloat(skew) > 0 ? 'Positive' : 'Negative'})

**ARTHA Verdict:** ${parseFloat(prob) > 60 ? '🟢 Statistically bullish setup' : parseFloat(prob) < 40 ? '🔴 Statistically bearish setup' : '⚠️ Mixed signals — wait for confirmation'}

*अर्थ — where numbers meet the market!*`;
  }

  return `I'm analyzing **${symbol}** right now...

Key stats:
• Z-Score: ${zScore}σ
• Rise probability: ${prob}%
• Volatility: ${vol}%
• Skewness: ${skew}

Statistical analysis suggests ${parseFloat(prob) > 55 ? 'a bullish bias 🟢' : 'watching for downside risks 🔴'}.

Ask me anything specific about the charts, stats, or what they mean! I speak Hinglish too 😄

*⚠️ ARTHA statistically suggests — never gives direct buy/sell advice.*`;
}

export default function ArthaAIChat() {
  const chatOpen = useArthaStore(s => s.chatOpen);
  const toggleChat = useArthaStore(s => s.toggleChat);
  const stocks = useArthaStore(s => s.stocks);
  const selectedSymbol = useArthaStore(s => s.selectedSymbol);
  const stock = stocks[selectedSymbol];

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'artha',
      content: `Namaste! 🙏 I'm **ARTHA AI** — your statistical trading intelligence.\n\nCurrently analyzing **${selectedSymbol}**. Ask me anything about the stats, signals, or the market!`,
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', content: text, time: new Date() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setTyping(true);

    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    const response = getArthaResponse(text, selectedSymbol, stock?.stats);
    setMessages(m => [...m, { id: Date.now() + 1, role: 'artha', content: response, time: new Date() }]);
    setTyping(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } };

  // Format bold text
  const formatText = (text) => {
    return text.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i} style={{ color: '#FF6B00' }}>{part}</strong> : part
    );
  };

  return (
    <div className="chat-bar" style={{ height: chatOpen ? 420 : 52 }}>
      {/* Collapsed bar */}
      <div
        onClick={toggleChat}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 52, cursor: 'pointer', borderTop: '1px solid rgba(255,107,0,0.2)' }}
      >
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(255,107,0,0.5)', flexShrink: 0 }}>
          <Zap size={14} color="#000" />
        </div>
        <span style={{ fontFamily: 'Syne', fontSize: '0.82rem', color: '#555', flex: 1 }}>
          💬 Ask ARTHA anything about {selectedSymbol}...
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="pulse-live" />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.68rem', color: '#00FF88' }}>LIVE</span>
          {chatOpen ? <ChevronDown size={16} color="#666" /> : <ChevronUp size={16} color="#666" />}
        </div>
      </div>

      {/* Expanded chat */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', height: 368, background: 'rgba(10,10,10,0.98)' }}
          >
            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 6, padding: '8px 16px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
              {QUICK_ACTIONS.map(action => (
                <button key={action.id} onClick={() => send(action.prompt)}
                  style={{ padding: '4px 10px', borderRadius: 14, border: '1px solid rgba(255,107,0,0.2)', background: 'rgba(255,107,0,0.06)', color: '#FF6B00', fontFamily: 'Syne', fontSize: '0.7rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0 }}>
                  {action.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  {msg.role === 'artha' && (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <span style={{ fontFamily: 'Orbitron', fontSize: '0.65rem', color: '#000', fontWeight: 900 }}>A</span>
                    </div>
                  )}
                  <div style={{
                    maxWidth: '78%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                    background: msg.role === 'user' ? 'rgba(255,107,0,0.15)' : 'rgba(22,22,22,0.9)',
                    border: msg.role === 'user' ? '1px solid rgba(255,107,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    fontFamily: 'Syne', fontSize: '0.8rem', color: '#F5F5F5', lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content.split('\n').map((line, i) => <div key={i}>{formatText(line)}</div>)}
                    <div style={{ fontFamily: 'Syne', fontSize: '0.6rem', color: '#444', marginTop: 4, textAlign: 'right' }}>
                      {msg.time?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {typing && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#FF6B00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'Orbitron', fontSize: '0.65rem', color: '#000', fontWeight: 900 }}>A</span>
                  </div>
                  <div style={{ padding: '12px 16px', borderRadius: '4px 12px 12px 12px', background: 'rgba(22,22,22,0.9)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B00', animation: 'pulse-alert 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 8, flexShrink: 0 }}>
              <input
                className="artha-input"
                style={{ flex: 1, height: 40, fontSize: '0.82rem' }}
                placeholder="Ask ARTHA anything... (Press Enter to send)"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button onClick={() => send(input)} className="btn-primary" style={{ height: 40, width: 40, padding: 0, borderRadius: 8, flexShrink: 0 }} disabled={!input.trim() || typing}>
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
