import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeftRight, ChevronDown, RefreshCw, Clock, ShieldCheck,
  Zap, AlertCircle, CheckCircle2, TrendingUp, Info, ArrowUpRight, ArrowDownRight,
  Activity as ActivityIcon
} from 'lucide-react';
import { useMarkets, useBinanceStream } from '../hooks/useCrypto';
import { generateOTCQuote } from '../api/cryptoApi';
import { formatPrice, formatCompact, formatPct, formatNum } from '../utils/format';
import TokenIcon from '../components/common/TokenIcon';
import { PageLoader } from '../components/common/LoadingSpinner';
import { TOKENS, SUPPORTED_FIATS } from '../data/tokens';
import toast from 'react-hot-toast';

const WS_STREAMS = TOKENS.slice(0, 15).map(t => `${t.symbol.toLowerCase()}usdt@ticker`);

function TokenSelector({ selected, onSelect, markets }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = markets.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <TokenIcon symbol={selected?.symbol} size={26} />
        <span className="font-bold text-white text-sm">{selected?.symbol?.toUpperCase()}</span>
        <ChevronDown size={14} className={`text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-64 z-50 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(6,14,30,0.97)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
          <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <input className="input-glass py-2 text-sm" placeholder="Search token…" value={search}
              onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.slice(0, 20).map(m => (
              <button key={m.id} onClick={() => { onSelect(m); setOpen(false); setSearch(''); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-white/5">
                <TokenIcon symbol={m.symbol} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{m.symbol?.toUpperCase()}</div>
                  <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{m.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-num text-white">{formatPrice(m.current_price)}</div>
                  <div className={`text-xs font-num ${m.price_change_percentage_24h >= 0 ? 'price-up' : 'price-down'}`}>
                    {formatPct(m.price_change_percentage_24h)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuoteTimer({ expiresAt, onExpire }) {
  const [remaining, setRemaining] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) { clearInterval(interval); onExpire?.(); }
    }, 500);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const pct = (remaining / 30) * 100;
  const color = remaining > 15 ? '#22c55e' : remaining > 5 ? '#eab308' : '#ef4444';

  return (
    <div className="flex items-center gap-2">
      <Clock size={13} style={{ color }} />
      <span className="text-xs font-medium" style={{ color }}>Quote valid: {remaining}s</span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

const RECENT_TRADES = [
  { side: 'BUY', symbol: 'BTC', amount: 2.5, price: 67420, total: 168550, time: '2 min ago' },
  { side: 'SELL', symbol: 'ETH', amount: 45, price: 3521, total: 158445, time: '8 min ago' },
  { side: 'BUY', symbol: 'SOL', amount: 500, price: 148.2, total: 74100, time: '15 min ago' },
  { side: 'BUY', symbol: 'BNB', amount: 120, price: 412, total: 49440, time: '23 min ago' },
  { side: 'SELL', symbol: 'BTC', amount: 1.2, price: 67380, total: 80856, time: '31 min ago' },
  { side: 'SELL', symbol: 'XRP', amount: 50000, price: 0.582, total: 29100, time: '44 min ago' },
];

export default function OTCTrade() {
  const { data: markets, loading } = useMarkets(30);
  const livePrices = useBinanceStream(WS_STREAMS);

  const [side, setSide] = useState('buy');
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [selectedFiat, setSelectedFiat] = useState(SUPPORTED_FIATS[0]);
  const [amount, setAmount] = useState('');
  const [amountMode, setAmountMode] = useState('crypto'); // crypto | usd
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [step, setStep] = useState('form'); // form | quote | confirm | success

  useEffect(() => {
    if (markets.length > 0 && !selectedCoin) setSelectedCoin(markets[0]);
  }, [markets]);

  const getLivePrice = (coin) => {
    if (!coin) return 0;
    const key = coin.symbol?.toUpperCase() + 'USDT';
    return livePrices[key]?.price || coin.current_price || 0;
  };

  const currentPrice = getLivePrice(selectedCoin);

  const cryptoAmount = amountMode === 'crypto'
    ? parseFloat(amount) || 0
    : (parseFloat(amount) || 0) / (currentPrice || 1);

  const usdValue = cryptoAmount * currentPrice;

  const handleGetQuote = async () => {
    if (!cryptoAmount || cryptoAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (usdValue < 1000) {
      toast.error('Minimum OTC trade: $1,000');
      return;
    }
    setQuoteLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const q = generateOTCQuote(currentPrice, cryptoAmount, side);
    setQuote(q);
    setStep('quote');
    setQuoteLoading(false);
  };

  const handleConfirm = async () => {
    setStep('confirm');
    await new Promise(r => setTimeout(r, 1500));
    setStep('success');
    toast.success(`OTC ${side.toUpperCase()} order executed!`);
  };

  const handleReset = () => {
    setStep('form');
    setQuote(null);
    setAmount('');
  };

  const quickAmounts = amountMode === 'usd'
    ? ['10,000', '50,000', '100,000', '500,000']
    : selectedCoin
      ? [
          (10000 / currentPrice).toFixed(4),
          (50000 / currentPrice).toFixed(4),
          (100000 / currentPrice).toFixed(4),
          (500000 / currentPrice).toFixed(4),
        ]
      : [];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">OTC Trading Desk</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Institutional-grade over-the-counter execution • Deep liquidity • Zero slippage
        </p>
      </div>

      {/* Features strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: ShieldCheck, label: 'Secure Settlement', sub: 'T+0 settlement', color: '#22c55e' },
          { icon: Zap, label: 'Best Execution', sub: 'Smart routing', color: '#3b82f6' },
          { icon: TrendingUp, label: 'Deep Liquidity', sub: '$500M+ daily', color: '#6366f1' },
          { icon: AlertCircle, label: 'Competitive Spreads', sub: '0.10–0.15%', color: '#eab308' },
        ].map(({ icon: Icon, label, sub, color }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}20`, border: `1px solid ${color}25` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{label}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trade Form */}
        <div className="lg:col-span-2 space-y-4">
          {step === 'success' ? (
            <div className="glass-card p-10 flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}>
                <CheckCircle2 size={40} style={{ color: '#22c55e' }} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Order Executed!</h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Your OTC {side.toUpperCase()} order for{' '}
                  <span className="text-white font-semibold">{formatNum(quote?.amount, 6)} {selectedCoin?.symbol?.toUpperCase()}</span>{' '}
                  at <span className="text-white font-semibold">{formatPrice(quote?.quotePrice)}</span> has been filled.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="glass-card p-3 text-center">
                  <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Total Value</div>
                  <div className="font-num font-bold text-white">{formatCompact(quote?.total)}</div>
                </div>
                <div className="glass-card p-3 text-center">
                  <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Fee</div>
                  <div className="font-num font-bold text-white">{formatPrice(quote?.fee)}</div>
                </div>
              </div>
              <button onClick={handleReset} className="neon-button mt-2">New Trade</button>
            </div>
          ) : (
            <div className="glass-card p-6 space-y-5">
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {['buy', 'sell'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition-all duration-200"
                    style={side === s ? {
                      background: s === 'buy' ? 'linear-gradient(135deg,#22c55e,#00b248)' : 'linear-gradient(135deg,#ef4444,#c40031)',
                      color: 'white',
                      boxShadow: s === 'buy' ? '0 0 20px rgba(34,197,94,0.3)' : '0 0 20px rgba(239,68,68,0.3)',
                    } : { color: 'rgba(255,255,255,0.4)' }}
                  >
                    {s === 'buy' ? '▲ Buy' : '▼ Sell'}
                  </button>
                ))}
              </div>

              {/* Token + Amount */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {side === 'buy' ? 'Buy' : 'Sell'} Asset
                </label>
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <TokenSelector selected={selectedCoin} onSelect={setSelectedCoin} markets={markets} />
                  <div className="flex-1">
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-right text-xl font-bold text-white outline-none placeholder-white/20"
                    />
                    <div className="text-right text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {amountMode === 'crypto'
                        ? `≈ ${formatCompact(usdValue)}`
                        : `≈ ${formatNum(cryptoAmount, 6)} ${selectedCoin?.symbol?.toUpperCase()}`}
                    </div>
                  </div>
                </div>

                {/* Mode toggle */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setAmountMode(amountMode === 'crypto' ? 'usd' : 'crypto')}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all"
                    style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
                  >
                    <ArrowLeftRight size={10} />
                    Switch to {amountMode === 'crypto' ? 'USD' : selectedCoin?.symbol?.toUpperCase()}
                  </button>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    1 {selectedCoin?.symbol?.toUpperCase()} = {formatPrice(currentPrice)}
                  </span>
                </div>
              </div>

              {/* Quick amounts */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Quick Fill
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((qa, i) => (
                    <button
                      key={i}
                      onClick={() => setAmount(qa.toString().replace(',', ''))}
                      className="py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: '#3b82f6' }}
                    >
                      {amountMode === 'usd' ? `$${qa}` : qa}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settlement currency */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Settlement Currency
                </label>
                <div className="flex gap-2 flex-wrap">
                  {SUPPORTED_FIATS.map(f => (
                    <button
                      key={f.symbol}
                      onClick={() => setSelectedFiat(f)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={selectedFiat.symbol === f.symbol ? {
                        background: 'rgba(59,130,246,0.15)',
                        border: '1px solid rgba(59,130,246,0.35)',
                        color: '#3b82f6',
                      } : {
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      <span>{f.flag}</span> {f.symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quote / Trade info */}
              {step === 'quote' && quote ? (
                <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <QuoteTimer expiresAt={quote.expiresAt} onExpire={() => { setStep('form'); setQuote(null); }} />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: 'Quote Price', value: formatPrice(quote.quotePrice), color: side === 'buy' ? '#ef4444' : '#22c55e' },
                      { label: 'Market Price', value: formatPrice(quote.basePrice), color: 'rgba(255,255,255,0.7)' },
                      { label: 'Amount', value: `${formatNum(quote.amount, 6)} ${selectedCoin?.symbol?.toUpperCase()}`, color: 'white' },
                      { label: 'Total', value: formatCompact(quote.total), color: 'white' },
                      { label: 'Spread', value: `${quote.spread.toFixed(3)}%`, color: '#eab308' },
                      { label: 'OTC Fee', value: formatPrice(quote.fee), color: 'rgba(255,255,255,0.6)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex justify-between">
                        <span style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                        <span className="font-num font-semibold" style={{ color }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    <Info size={13} className="mt-0.5 flex-shrink-0" style={{ color: '#3b82f6' }} />
                    OTC trades are executed at guaranteed prices with zero market slippage. Minimum trade size: $1,000. Quotes valid for 30 seconds.
                  </div>
                </div>
              )}

              {/* Action button */}
              {step === 'form' && (
                <button
                  onClick={handleGetQuote}
                  disabled={quoteLoading || !amount}
                  className="w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={side === 'buy' ? {
                    background: 'linear-gradient(135deg, #22c55e, #00b248)',
                    boxShadow: '0 0 20px rgba(34,197,94,0.3)',
                  } : {
                    background: 'linear-gradient(135deg, #ef4444, #c40031)',
                    boxShadow: '0 0 20px rgba(239,68,68,0.3)',
                  }}
                >
                  {quoteLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={16} className="animate-spin" /> Getting Quote…
                    </span>
                  ) : (
                    `Get ${side === 'buy' ? 'Buy' : 'Sell'} Quote`
                  )}
                </button>
              )}

              {step === 'quote' && quote && (
                <div className="flex gap-3">
                  <button onClick={handleReset} className="flex-1 py-3.5 rounded-xl font-semibold glass-button text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm"
                    style={side === 'buy' ? {
                      background: 'linear-gradient(135deg,#22c55e,#00b248)',
                      boxShadow: '0 0 20px rgba(34,197,94,0.3)',
                    } : {
                      background: 'linear-gradient(135deg,#ef4444,#c40031)',
                      boxShadow: '0 0 20px rgba(239,68,68,0.3)',
                    }}
                  >
                    Confirm {side === 'buy' ? 'Buy' : 'Sell'}
                  </button>
                </div>
              )}

              {step === 'confirm' && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <RefreshCw size={18} className="animate-spin" style={{ color: '#3b82f6' }} />
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Executing order…
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Live Prices for top tokens */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-white mb-4 text-sm">Live Market Rates</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {markets.slice(0, 9).map(coin => {
                const key = coin.symbol?.toUpperCase() + 'USDT';
                const live = livePrices[key];
                const price = live?.price || coin.current_price;
                const pct = coin.price_change_percentage_24h;
                return (
                  <button
                    key={coin.id}
                    onClick={() => setSelectedCoin(coin)}
                    className="flex items-center gap-2 p-3 rounded-xl transition-all duration-150 text-left"
                    style={{
                      background: selectedCoin?.id === coin.id ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
                      border: selectedCoin?.id === coin.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <TokenIcon symbol={coin.symbol} size={24} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white">{coin.symbol?.toUpperCase()}</div>
                      <div className="text-xs font-num truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>{formatPrice(price)}</div>
                    </div>
                    <span className={`text-xs font-num font-medium ${pct >= 0 ? 'price-up' : 'price-down'}`}>{formatPct(pct)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right panel — Recent OTC Trades & Stats */}
        <div className="space-y-4">
          {/* Coin stats */}
          {selectedCoin && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <TokenIcon symbol={selectedCoin.symbol} size={36} />
                <div>
                  <div className="font-bold text-white">{selectedCoin.name}</div>
                  <div className="font-num font-bold text-lg" style={{ color: selectedCoin.price_change_percentage_24h >= 0 ? '#22c55e' : '#ef4444' }}>
                    {formatPrice(getLivePrice(selectedCoin))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: '24h High', value: formatPrice(selectedCoin.high_24h) },
                  { label: '24h Low', value: formatPrice(selectedCoin.low_24h) },
                  { label: 'Market Cap', value: formatCompact(selectedCoin.market_cap) },
                  { label: '24h Volume', value: formatCompact(selectedCoin.total_volume) },
                  { label: 'Circulating Supply', value: `${formatNum(selectedCoin.circulating_supply, 0)} ${selectedCoin.symbol?.toUpperCase()}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                    <span className="font-num font-medium text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent OTC trades */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-white mb-4 text-sm flex items-center gap-2">
              <ActivityIcon size={14} style={{ color: '#3b82f6' }} />
              Recent OTC Trades
            </h3>
            <div className="space-y-2.5">
              {RECENT_TRADES.map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className={`badge text-xs ${t.side === 'BUY' ? 'badge-green' : 'badge-red'}`}>{t.side}</span>
                  <TokenIcon symbol={t.symbol} size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">{formatNum(t.amount, 4)} {t.symbol}</div>
                    <div className="text-xs font-num" style={{ color: 'rgba(255,255,255,0.35)' }}>{formatCompact(t.total)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-num text-white">{formatPrice(t.price)}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{t.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

