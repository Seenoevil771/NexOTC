import { useState, useMemo } from 'react';
import { BookOpen, ChevronDown, Activity as ActivityIcon } from 'lucide-react';
import { useOrderBook, useRecentTrades, useKlines, useBinanceStream, useMarkets } from '../hooks/useCrypto';
import { formatPrice, formatNum, formatTime, formatPct } from '../utils/format';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import TokenIcon from '../components/common/TokenIcon';
import { TOKENS } from '../data/tokens';

const PAIRS = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','ADAUSDT','AVAXUSDT','DOGEUSDT','LINKUSDT','DOTUSDT'];

export default function OrderBook() {
  const [pair, setPair] = useState('BTCUSDT');
  const [interval, setInterval2] = useState('1h');
  const [pairOpen, setPairOpen] = useState(false);
  const { data: book } = useOrderBook(pair);
  const { data: trades } = useRecentTrades(pair);
  const { data: klines } = useKlines(pair, interval);
  const { data: markets } = useMarkets(20);
  const livePrices = useBinanceStream(PAIRS.map(p => `${p.toLowerCase().replace('usdt', '')}usdt@ticker`));

  const sym = pair.replace('USDT', '');
  const liveKey = pair;
  const liveData = livePrices[liveKey] || {};
  const coin = markets.find(m => m.symbol?.toUpperCase() === sym);
  const displayPrice = liveData.price || coin?.current_price || 0;

  const maxBidSize = useMemo(() => Math.max(...(book.bids || []).map(b => parseFloat(b[1])), 1), [book.bids]);
  const maxAskSize = useMemo(() => Math.max(...(book.asks || []).map(a => parseFloat(a[1])), 1), [book.asks]);

  const chartData = klines.map(k => ({ time: new Date(k.time).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }), close: k.close, volume: k.volume }));
  const isUp = chartData.length >= 2 && chartData[chartData.length - 1]?.close >= chartData[0]?.close;

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Order Book</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Real-time depth &amp; trade feed via Binance
          </p>
        </div>

        {/* Pair selector */}
        <div className="relative">
          <button onClick={() => setPairOpen(!pairOpen)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <TokenIcon symbol={sym} size={22} />
            {pair}
            <ChevronDown size={14} className={`text-white/40 transition-transform ${pairOpen ? 'rotate-180' : ''}`} />
          </button>
          {pairOpen && (
            <div className="absolute top-full mt-2 right-0 w-48 z-50 rounded-xl overflow-hidden"
              style={{ background: 'rgba(6,14,30,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
              {PAIRS.map(p => (
                <button key={p} onClick={() => { setPair(p); setPairOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-white/5"
                  style={{ color: pair === p ? '#3b82f6' : 'rgba(255,255,255,0.7)' }}>
                  <TokenIcon symbol={p.replace('USDT', '')} size={20} />
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price summary */}
      <div className="glass-card p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <TokenIcon symbol={sym} size={40} />
            <div>
              <div className="font-bold text-lg text-white">{pair}</div>
              <div className="text-2xl font-bold font-num" style={{ color: isUp ? '#22c55e' : '#ef4444' }}>
                {formatPrice(displayPrice)}
              </div>
            </div>
          </div>
          {[
            { label: '24h Change', value: formatPct(liveData.change24h || coin?.price_change_percentage_24h), color: (liveData.change24h || coin?.price_change_percentage_24h || 0) >= 0 ? '#22c55e' : '#ef4444' },
            { label: '24h High', value: formatPrice(liveData.high || coin?.high_24h) },
            { label: '24h Low', value: formatPrice(liveData.low || coin?.low_24h) },
            { label: '24h Volume', value: liveData.volume ? `${formatNum(liveData.volume, 2)} ${sym}` : '–' },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
              <div className="font-num font-semibold text-sm" style={{ color: color || 'white' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Order Book */}
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <BookOpen size={14} style={{ color: '#3b82f6' }} />
            <span className="font-semibold text-white text-sm">Order Book</span>
          </div>
          <div className="p-3">
            {/* Header */}
            <div className="grid grid-cols-3 text-xs mb-2 px-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span>Price (USD)</span>
              <span className="text-center">Amount ({sym})</span>
              <span className="text-right">Total</span>
            </div>

            {/* Asks (sell orders) */}
            <div className="space-y-0.5 mb-1">
              {(book.asks || []).slice(0, 12).reverse().map(([price, size], i) => {
                const p = parseFloat(price), s = parseFloat(size);
                const pct = (s / maxAskSize) * 100;
                return (
                  <div key={i} className="relative grid grid-cols-3 text-xs py-0.5 px-1 rounded overflow-hidden">
                    <div className="absolute inset-0 right-0" style={{ background: `rgba(239,68,68,0.07)`, width: `${pct}%`, left: 'auto' }} />
                    <span className="font-num relative price-down font-medium">{formatPrice(p)}</span>
                    <span className="font-num relative text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>{formatNum(s, 4)}</span>
                    <span className="font-num relative text-right" style={{ color: 'rgba(255,255,255,0.4)' }}>{formatNum(p * s, 0)}</span>
                  </div>
                );
              })}
            </div>

            {/* Spread */}
            <div className="text-center py-2 text-xs font-bold font-num" style={{ color: '#3b82f6' }}>
              {formatPrice(displayPrice)} · Spread: {book.asks?.[0] && book.bids?.[0]
                ? ((parseFloat(book.asks[0][0]) - parseFloat(book.bids[0][0])) / parseFloat(book.bids[0][0]) * 100).toFixed(3) + '%'
                : '–'}
            </div>

            {/* Bids (buy orders) */}
            <div className="space-y-0.5">
              {(book.bids || []).slice(0, 12).map(([price, size], i) => {
                const p = parseFloat(price), s = parseFloat(size);
                const pct = (s / maxBidSize) * 100;
                return (
                  <div key={i} className="relative grid grid-cols-3 text-xs py-0.5 px-1 rounded overflow-hidden">
                    <div className="absolute inset-0" style={{ background: `rgba(34,197,94,0.07)`, width: `${pct}%` }} />
                    <span className="font-num relative price-up font-medium">{formatPrice(p)}</span>
                    <span className="font-num relative text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>{formatNum(s, 4)}</span>
                    <span className="font-num relative text-right" style={{ color: 'rgba(255,255,255,0.4)' }}>{formatNum(p * s, 0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ActivityIcon size={14} style={{ color: '#3b82f6' }} />
              <span className="font-semibold text-white text-sm">Price Chart</span>
            </div>
            <div className="flex gap-1">
              {['15m','1h','4h','1d'].map(i => (
                <button key={i} onClick={() => setInterval2(i === '15m' ? '15m' : i === '1h' ? '1h' : i === '4h' ? '4h' : '1d')}
                  className="px-2 py-1 rounded text-xs font-medium transition-all"
                  style={interval === i || (interval === '1h' && i === '1h') ? {
                    background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)'
                  } : { color: 'rgba(255,255,255,0.35)' }}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: '340px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="klineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval={23} />
                <YAxis tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)}`}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} width={52} />
                <Tooltip contentStyle={{ background: 'rgba(6,14,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(v) => [formatPrice(v), 'Price']} />
                <Area type="monotone" dataKey="close" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth={2} fill="url(#klineGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Trades */}
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <ActivityIcon size={14} style={{ color: '#3b82f6' }} />
            <span className="font-semibold text-white text-sm">Recent Trades</span>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-3 text-xs mb-2 px-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span>Price</span>
              <span className="text-center">Amount</span>
              <span className="text-right">Time</span>
            </div>
            <div className="space-y-0.5">
              {trades.map((t, i) => {
                const isBuy = !t.isBuyerMaker;
                return (
                  <div key={i} className="grid grid-cols-3 text-xs py-0.5 px-1">
                    <span className={`font-num font-medium ${isBuy ? 'price-up' : 'price-down'}`}>{formatPrice(parseFloat(t.price))}</span>
                    <span className="font-num text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>{parseFloat(t.qty).toFixed(4)}</span>
                    <span className="text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatTime(t.time)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

