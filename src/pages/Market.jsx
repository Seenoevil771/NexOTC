import { useState, useMemo } from 'react';
import {
  Search, TrendingUp, TrendingDown, Star, Filter, ChevronUp, ChevronDown,
  X, ExternalLink, Globe, Clock, BarChart3, Info
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { useMarkets, useBinanceStream, useCoinChart, useCoinDetail } from '../hooks/useCrypto';
import { formatPrice, formatCompact, formatPct, formatNum } from '../utils/format';
import SparkLine from '../components/common/SparkLine';
import TokenIcon from '../components/common/TokenIcon';
import { PageLoader } from '../components/common/LoadingSpinner';
import { TOKENS } from '../data/tokens';

const WS_STREAMS = TOKENS.map(t => `${t.symbol.toLowerCase()}usdt@ticker`);

const CATEGORIES = ['All', 'DeFi', 'Layer 1', 'Layer 2', 'Stablecoins', 'Meme'];

function SortIcon({ field, current, dir }) {
  if (current !== field) return <ChevronUp size={12} className="opacity-20" />;
  return dir === 'asc' ? <ChevronUp size={12} style={{ color: '#3b82f6' }} /> : <ChevronDown size={12} style={{ color: '#3b82f6' }} />;
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <div className="font-num text-white font-semibold">{formatPrice(payload[0].value)}</div>
    </div>
  );
}

function CoinDetailModal({ coinId, onClose, markets }) {
  const { data: detail, loading: detailLoading } = useCoinDetail(coinId);
  const [chartDays, setChartDays] = useState(7);
  const { data: chartData, loading: chartLoading } = useCoinChart(coinId, chartDays);

  const marketCoin = markets.find(m => m.id === coinId);
  const tokenInfo = TOKENS.find(t => t.id === coinId);

  const chartPoints = useMemo(() => {
    if (!chartData?.prices) return [];
    return chartData.prices.map(([t, p]) => ({ t, p }));
  }, [chartData]);

  const isUp = (val) => (val || 0) >= 0;

  const formatTime = (ts) => {
    const d = new Date(ts);
    if (chartDays <= 1) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (chartDays <= 30) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const priceChange = chartPoints.length >= 2
    ? ((chartPoints[chartPoints.length - 1].p - chartPoints[0].p) / chartPoints[0].p) * 100
    : 0;

  const md = detail?.market_data || {};
  const desc = detail?.description?.en || '';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden fade-in-up"
        style={{
          background: 'rgba(8,18,38,0.98)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <TokenIcon symbol={marketCoin?.symbol} size={36} />
            <div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                {marketCoin?.name || detail?.name}
                <span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {marketCoin?.symbol?.toUpperCase() || detail?.symbol?.toUpperCase()}
                </span>
                {marketCoin?.market_cap_rank && (
                  <span className="text-xs font-num px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
                    #{marketCoin.market_cap_rank}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5">
            <X size={18} className="text-white/40" />
          </button>
        </div>

        {(!marketCoin && detailLoading) ? (
          <div className="p-12 text-center"><PageLoader /></div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Price + Change Hero */}
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <div className="text-3xl font-bold font-num text-white">
                  {formatPrice(marketCoin?.current_price || md.current_price?.usd)}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-sm font-num font-medium ${isUp(marketCoin?.price_change_percentage_24h) ? 'price-up' : 'price-down'}`}>
                    {formatPct(marketCoin?.price_change_percentage_24h || md.price_change_percentage_24h)}
                  </span>
                  <span className={`text-sm font-num font-medium ${isUp(priceChange) ? 'price-up' : 'price-down'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% ({chartDays}d)
                  </span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5">
                  {[1, 7, 30, 365].map(d => (
                    <button key={d} onClick={() => setChartDays(d)}
                      className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                      style={chartDays === d ? {
                        background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)'
                      } : {
                        background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid transparent'
                      }}>
                      {d === 1 ? '1D' : d === 7 ? '7D' : d === 30 ? '30D' : '1Y'}
                    </button>
                  ))}
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <Clock size={11} className="inline mr-1" />
                  {chartDays <= 1 ? 'Hourly' : 'Daily'}
                </div>
              </div>
              <div style={{ height: '240px' }}>
                {chartLoading ? (
                  <div className="h-full flex items-center justify-center text-xs text-white/30">Loading chart...</div>
                ) : chartPoints.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-white/30">No chart data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="detailChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isUp(priceChange) ? '#22c55e' : '#ef4444'} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={isUp(priceChange) ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="t" tickFormatter={formatTime} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis domain={['dataMin - 0.01', 'dataMax + 0.01']} tickFormatter={v => formatCompact(v)} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} tickLine={false} axisLine={false} width={56} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="p" stroke={isUp(priceChange) ? '#22c55e' : '#ef4444'} strokeWidth={2} fill="url(#detailChartGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Market Stats Grid */}
            <div>
              <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-1.5">
                <BarChart3 size={14} style={{ color: '#3b82f6' }} />
                Market Stats
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Market Cap', value: formatCompact(md.market_cap?.usd || marketCoin?.market_cap), color: '#3b82f6' },
                  { label: '24h Volume', value: formatCompact(md.total_volume?.usd || marketCoin?.total_volume), color: '#6366f1' },
                  { label: 'Circulating Supply', value: formatNum(md.circulating_supply, 0), color: '#22c55e' },
                  { label: 'Total Supply', value: md.total_supply ? formatNum(md.total_supply, 0) : '∞', color: '#eab308' },
                  { label: 'Max Supply', value: md.max_supply ? formatNum(md.max_supply, 0) : '∞', color: '#eab308' },
                  { label: 'All-Time High', value: formatPrice(md.ath?.usd), color: '#22c55e' },
                  { label: 'ATH Date', value: md.ath_date?.usd ? new Date(md.ath_date.usd).toLocaleDateString() : '–', color: 'rgba(255,255,255,0.5)' },
                  { label: 'All-Time Low', value: formatPrice(md.atl?.usd), color: '#ef4444' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</div>
                    <div className="text-sm font-semibold font-num text-white">{value || '–'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Change Grid */}
            <div>
              <h3 className="font-semibold text-white text-sm mb-3 flex items-center gap-1.5">
                <TrendingUp size={14} style={{ color: '#22c55e' }} />
                Price Change
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '1h', value: md.price_change_percentage_1h_in_currency?.usd },
                  { label: '24h', value: md.price_change_percentage_24h },
                  { label: '7d', value: md.price_change_percentage_7d },
                  { label: '14d', value: md.price_change_percentage_14d },
                  { label: '30d', value: md.price_change_percentage_30d },
                  { label: '60d', value: md.price_change_percentage_60d },
                  { label: '200d', value: md.price_change_percentage_200d },
                  { label: '1y', value: md.price_change_percentage_1y },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</div>
                    <div className={`text-sm font-semibold font-num ${isUp(value) ? 'price-up' : 'price-down'}`}>
                      {value != null ? formatPct(value) : '–'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            {desc && (
              <div>
                <h3 className="font-semibold text-white text-sm mb-2 flex items-center gap-1.5">
                  <Info size={14} style={{ color: '#3b82f6' }} />
                  About
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {desc.replace(/<[^>]*>/g, '').slice(0, 600)}
                  {desc.length > 600 ? '...' : ''}
                </p>
              </div>
            )}

            {/* Links */}
            {detail?.links && (
              <div className="flex items-center gap-3 flex-wrap pb-2">
                {detail.links.homepage?.[0] && (
                  <a href={detail.links.homepage[0]} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/5"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}>
                    <Globe size={13} /> Website
                  </a>
                )}
                {detail.links.blockchain_site?.[0] && (
                  <a href={detail.links.blockchain_site[0]} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/5"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}>
                    <ExternalLink size={13} /> Explorer
                  </a>
                )}
                {detail.links.subreddit_url && (
                  <a href={detail.links.subreddit_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/5"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}>
                    Reddit
                  </a>
                )}
                {detail.links.twitter_screen_name && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)' }}>
                    @{detail.links.twitter_screen_name}
                  </span>
                )}
                {tokenInfo?.category && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}>
                    {tokenInfo.category}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Market() {
  const { data: markets, loading } = useMarkets(50);
  const livePrices = useBinanceStream(WS_STREAMS);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [category, setCategory] = useState('All');
  const [sortField, setSortField] = useState('market_cap_rank');
  const [sortDir, setSortDir] = useState('asc');
  const [watchlist, setWatchlist] = useState(new Set(['bitcoin', 'ethereum', 'solana']));
  const [selectedCoinId, setSelectedCoinId] = useState(null);

  const toggleWatchlist = (id) => setWatchlist(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = markets.filter(m => {
      const matchSearch = search === '' ||
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.symbol?.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (category === 'All') return true;
      const token = TOKENS.find(t => t.id === m.id || t.symbol === m.symbol?.toUpperCase());
      return token?.category === category;
    });
    list = [...list].sort((a, b) => {
      let av = a[sortField] ?? 0, bv = b[sortField] ?? 0;
      if (sortField === 'name') return sortDir === 'asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '');
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [markets, search, category, sortDir, sortField]);

  const getPrice = (coin) => {
    const key = coin.symbol?.toUpperCase() + 'USDT';
    return livePrices[key]?.price || coin.current_price;
  };

  const headers = [
    { label: '#', field: 'market_cap_rank', w: 'w-10' },
    { label: 'Asset', field: 'name', w: 'min-w-[180px]' },
    { label: 'Price', field: 'current_price', w: 'w-32' },
    { label: '1h %', field: 'price_change_percentage_1h_in_currency', w: 'w-24' },
    { label: '24h %', field: 'price_change_percentage_24h', w: 'w-24' },
    { label: '7d %', field: 'price_change_percentage_7d_in_currency', w: 'w-24' },
    { label: 'Volume (24h)', field: 'total_volume', w: 'w-32' },
    { label: 'Mkt Cap', field: 'market_cap', w: 'w-32' },
    { label: '7d Chart', field: null, w: 'w-28' },
  ];

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Markets</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Live prices • {markets.length} assets tracked
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 z-10" />
          <input
            className="input-glass pl-9 py-2.5 text-sm"
            placeholder="Search name or symbol…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          {searchFocused && search.trim() && (
            <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(6,14,30,0.97)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}>
              <div className="max-h-72 overflow-y-auto">
                {markets.filter(m => {
                  const q = search.toLowerCase();
                  return m.name?.toLowerCase().includes(q) || m.symbol?.toLowerCase().includes(q);
                }).slice(0, 10).map(coin => {
                  const liveP = getPrice(coin);
                  const p24 = coin.price_change_percentage_24h;
                  return (
                    <button key={coin.id}
                      onClick={() => { setSearch(''); setSearchFocused(false); setSelectedCoinId(coin.id); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 border-b last:border-0"
                      style={{ borderColor: 'rgba(255,255,255,0.03)' }}
                    >
                      <TokenIcon symbol={coin.symbol} size={30} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{coin.name}</span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{coin.symbol?.toUpperCase()}</span>
                          <span className="text-xs font-num ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }}>#{coin.market_cap_rank}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs font-num font-semibold text-white">{formatPrice(liveP)}</span>
                          <span className={`text-xs font-num font-medium ${(p24 || 0) >= 0 ? 'price-up' : 'price-down'}`}>
                            {formatPct(p24)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {markets.filter(m => {
                const q = search.toLowerCase();
                return m.name?.toLowerCase().includes(q) || m.symbol?.toLowerCase().includes(q);
              }).length === 0 && (
                <div className="p-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No results for "{search}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => {
          const count = cat === 'All'
            ? markets.length
            : markets.filter(m => {
                const token = TOKENS.find(t => t.id === m.id || t.symbol === m.symbol?.toUpperCase());
                return token?.category === cat;
              }).length;
          return (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 flex items-center gap-1.5"
            style={category === cat ? {
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.35)',
              color: '#3b82f6',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.45)',
            }}
          >
            {cat}
            {count > 0 && (
              <span className="text-xs font-num opacity-50">({count})</span>
            )}
          </button>
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Biggest Gainer', icon: TrendingUp, color: '#22c55e',
            value: markets.reduce((a, b) => (b.price_change_percentage_24h || 0) > (a.price_change_percentage_24h || 0) ? b : a, markets[0] || {}),
            pct: true,
          },
          {
            label: 'Biggest Loser', icon: TrendingDown, color: '#ef4444',
            value: markets.reduce((a, b) => (b.price_change_percentage_24h || 0) < (a.price_change_percentage_24h || 0) ? b : a, markets[0] || {}),
            pct: true,
          },
          {
            label: 'Highest Volume', icon: Filter, color: '#6366f1',
            value: markets.reduce((a, b) => (b.total_volume || 0) > (a.total_volume || 0) ? b : a, markets[0] || {}),
            pct: false,
          },
          {
            label: 'Watchlist', icon: Star, color: '#eab308',
            value: (() => {
              const watched = markets.filter(m => watchlist.has(m.id));
              const avgPct = watched.length > 0
                ? watched.reduce((s, m) => s + (m.price_change_percentage_24h || 0), 0) / watched.length
                : null;
              return { symbol: `${watchlist.size} tracked`, price_change_percentage_24h: avgPct, empty: watched.length === 0 };
            })(),
            pct: true,
          },
        ].map(({ label, icon: Icon, color, value, pct }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}20`, border: `1px solid ${color}25` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
              <div className="font-semibold text-sm text-white">{value?.symbol?.toUpperCase() || '–'}</div>
              {pct && value?.price_change_percentage_24h != null && (
                <div className={`text-xs font-num font-medium ${value.price_change_percentage_24h >= 0 ? 'price-up' : 'price-down'}`}>
                  {formatPct(value.price_change_percentage_24h)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                  <th className="px-4 py-3 w-10 text-left">
                    <Star size={13} className="text-white/25" />
                  </th>
                  {headers.map(h => (
                    <th key={h.label}
                      className={`px-4 py-3 text-left text-xs font-medium ${h.field ? 'cursor-pointer hover:text-white' : ''} ${h.w}`}
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                      onClick={() => h.field && toggleSort(h.field)}
                    >
                      <div className="flex items-center gap-1">
                        {h.label}
                        {h.field && <SortIcon field={h.field} current={sortField} dir={sortDir} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(coin => {
                  const liveP = getPrice(coin);
                  const p1h = coin.price_change_percentage_1h_in_currency;
                  const p24 = coin.price_change_percentage_24h;
                  const p7d = coin.price_change_percentage_7d_in_currency;
                  const spark = coin.sparkline_in_7d?.price || [];
                  const starred = watchlist.has(coin.id);

                  return (
                    <tr key={coin.id}
                      className="transition-colors duration-100 cursor-pointer"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => setSelectedCoinId(coin.id)}
                    >
                      <td className="px-4 py-3">
                        <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(coin.id); }}
                          className="transition-all hover:scale-110">
                          <Star size={13} fill={starred ? '#eab308' : 'none'} style={{ color: starred ? '#eab308' : 'rgba(255,255,255,0.2)' }} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/40 font-num">{coin.market_cap_rank}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <TokenIcon symbol={coin.symbol} size={30} />
                          <div>
                            <div className="text-sm font-semibold text-white">{coin.name}</div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{coin.symbol?.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-num text-sm font-semibold text-white">{formatPrice(liveP)}</td>
                      <td className={`px-4 py-3 text-sm font-num font-medium ${(p1h || 0) >= 0 ? 'price-up' : 'price-down'}`}>{formatPct(p1h)}</td>
                      <td className={`px-4 py-3 text-sm font-num font-medium ${(p24 || 0) >= 0 ? 'price-up' : 'price-down'}`}>{formatPct(p24)}</td>
                      <td className={`px-4 py-3 text-sm font-num font-medium ${(p7d || 0) >= 0 ? 'price-up' : 'price-down'}`}>{formatPct(p7d)}</td>
                      <td className="px-4 py-3 text-sm font-num" style={{ color: 'rgba(255,255,255,0.55)' }}>{formatCompact(coin.total_volume)}</td>
                      <td className="px-4 py-3 text-sm font-num" style={{ color: 'rgba(255,255,255,0.55)' }}>{formatCompact(coin.market_cap)}</td>
                      <td className="px-4 py-3 w-28">
                        <SparkLine data={spark} positive={(p7d || 0) >= 0} height={38} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coin Detail Modal */}
      {selectedCoinId && (
        <CoinDetailModal
          coinId={selectedCoinId}
          onClose={() => setSelectedCoinId(null)}
          markets={markets}
        />
      )}
    </div>
  );
}