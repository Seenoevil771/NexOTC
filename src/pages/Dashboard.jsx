import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Activity, BarChart2,
  Zap, ArrowUpRight, ArrowDownRight, RefreshCw, Globe, Flame
} from 'lucide-react';
import { useMarkets, useGlobalData, useBinanceStream } from '../hooks/useCrypto';
import { formatPrice, formatCompact, formatPct, formatNum } from '../utils/format';
import StatCard from '../components/common/StatCard';
import SparkLine from '../components/common/SparkLine';
import PriceChart from '../components/common/PriceChart';
import TokenIcon from '../components/common/TokenIcon';
import { PageLoader } from '../components/common/LoadingSpinner';
import { TOKENS } from '../data/tokens';

const WS_STREAMS = [
  'btcusdt@ticker','ethusdt@ticker','bnbusdt@ticker','solusdt@ticker',
  'xrpusdt@ticker','adausdt@ticker','avaxusdt@ticker','dogeusdt@ticker',
];

export default function Dashboard() {
  const { data: markets, loading: mLoading } = useMarkets(20);
  const { data: global } = useGlobalData();
  const livePrices = useBinanceStream(WS_STREAMS);
  const [chartCoin, setChartCoin] = useState('bitcoin');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 15000);
    return () => clearInterval(interval);
  }, []);

  const getTimeAgo = () => {
    const seconds = Math.floor((new Date() - lastUpdated) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  const topCoins = markets.slice(0, 6);
  const gainers = [...markets].sort((a, b) =>
    (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
  ).slice(0, 5);
  const losers = [...markets].sort((a, b) =>
    (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0)
  ).slice(0, 5);

  const getDisplayPrice = (coin) => {
    const sym = coin.symbol?.toUpperCase() + 'USDT';
    const live = livePrices[sym];
    return live?.price || coin.current_price;
  };

  const fearGreedValue = global?.fearGreed?.value;
  const fearGreedLabel = global?.fearGreed?.value_classification;
  const fearGreedColor = fearGreedValue >= 60 ? '#22c55e' : fearGreedValue >= 40 ? '#eab308' : '#ef4444';

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Market Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Real-time cryptocurrency data • OTC grade liquidity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="badge badge-blue">
            <Zap size={10} />
            Live
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Updated {getTimeAgo()}
          </span>
        </div>
      </div>

      {/* Global Stats */}
      {global && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Market Cap"
            value={formatCompact(global.total_market_cap?.usd)}
            change={global.market_cap_change_percentage_24h_usd}
            sub="24h change"
            icon={Globe}
            color="#3b82f6"
          />
          <StatCard
            title="24h Volume"
            value={formatCompact(global.total_volume?.usd)}
            sub="across all assets"
            icon={Activity}
            color="#6366f1"
          />
          <StatCard
            title="BTC Dominance"
            value={`${global.market_cap_percentage?.btc?.toFixed(1)}%`}
            sub="of total market"
            icon={BarChart2}
            color="#F7931A"
          />
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl"
              style={{ background: fearGreedColor }} />
            <p className="text-sm font-medium mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Fear &amp; Greed Index
            </p>
            <div className="text-2xl font-bold font-num" style={{ color: fearGreedColor }}>
              {fearGreedValue || '–'}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${fearGreedValue || 0}%`, background: fearGreedColor }} />
              </div>
              <span className="text-xs font-medium" style={{ color: fearGreedColor }}>{fearGreedLabel}</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Coins Hero Grid */}
      {mLoading ? <PageLoader /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {topCoins.map(coin => {
            const livePrice = getDisplayPrice(coin);
            const pct = coin.price_change_percentage_24h;
            const isUp = pct >= 0;
            const sparkData = coin.sparkline_in_7d?.price || [];
            const token = TOKENS.find(t => t.id === coin.id);

            return (
              <div
                key={coin.id}
                onClick={() => setChartCoin(coin.id)}
                className="glass-card-hover p-4 cursor-pointer"
                style={chartCoin === coin.id ? {
                  border: '1px solid rgba(59,130,246,0.4)',
                  background: 'rgba(59,130,246,0.06)',
                } : {}}
              >
                <div className="flex items-center gap-2 mb-3">
                  <TokenIcon symbol={coin.symbol} size={28} />
                  <div>
                    <div className="text-xs font-bold text-white">{coin.symbol?.toUpperCase()}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>#{coin.market_cap_rank}</div>
                  </div>
                </div>
                <div className="font-num font-bold text-sm text-white mb-1">{formatPrice(livePrice)}</div>
                <div className={`flex items-center gap-1 text-xs font-medium mb-2 ${isUp ? 'price-up' : 'price-down'}`}>
                  {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {formatPct(pct)}
                </div>
                <SparkLine data={sparkData} positive={isUp} height={36} />
              </div>
            );
          })}
        </div>
      )}

      {/* Chart + Gainers/Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price Chart */}
        <div className="lg:col-span-2 glass-card p-5" style={{ minHeight: '340px' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {chartCoin && (
                <>
                  <TokenIcon symbol={markets.find(m => m.id === chartCoin)?.symbol} size={32} />
                  <div>
                    <div className="font-bold text-white">
                      {markets.find(m => m.id === chartCoin)?.name || 'Bitcoin'} / USD
                    </div>
                    <div className="text-sm font-num price-up">
                      {formatPrice(markets.find(m => m.id === chartCoin)?.current_price)}
                    </div>
                  </div>
                </>
              )}
            </div>
            <span className="badge badge-blue"><Activity size={10} />Live</span>
          </div>
          <div style={{ height: '260px' }}>
            <PriceChart coinId={chartCoin} />
          </div>
        </div>

        {/* Gainers & Losers */}
        <div className="space-y-4">
          {/* Top Gainers */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={16} className="text-green-400" />
              <span className="font-semibold text-white text-sm">Top Gainers</span>
              <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>24h</span>
            </div>
            <div className="space-y-2.5">
              {gainers.map(coin => (
                <div key={coin.id} className="flex items-center gap-2">
                  <TokenIcon symbol={coin.symbol} size={26} />
                  <span className="text-sm font-medium text-white flex-1">{coin.symbol?.toUpperCase()}</span>
                  <span className="text-xs font-num text-white/60">{formatPrice(coin.current_price)}</span>
                  <span className="badge badge-green text-xs">{formatPct(coin.price_change_percentage_24h)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={16} className="text-red-400" />
              <span className="font-semibold text-white text-sm">Top Losers</span>
              <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>24h</span>
            </div>
            <div className="space-y-2.5">
              {losers.map(coin => (
                <div key={coin.id} className="flex items-center gap-2">
                  <TokenIcon symbol={coin.symbol} size={26} />
                  <span className="text-sm font-medium text-white flex-1">{coin.symbol?.toUpperCase()}</span>
                  <span className="text-xs font-num text-white/60">{formatPrice(coin.current_price)}</span>
                  <span className="badge badge-red text-xs">{formatPct(coin.price_change_percentage_24h)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full Market Table */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-white">All Markets</h2>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{markets.length} assets</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['#', 'Asset', 'Price', '1h %', '24h %', '7d %', 'Volume 24h', 'Market Cap', '7d Chart'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {markets.map((coin, idx) => {
                const p1h = coin.price_change_percentage_1h_in_currency;
                const p24 = coin.price_change_percentage_24h;
                const p7d = coin.price_change_percentage_7d_in_currency;
                const sparkData = coin.sparkline_in_7d?.price || [];
                const liveP = getDisplayPrice(coin);

                return (
                  <tr
                    key={coin.id}
                    onClick={() => setChartCoin(coin.id)}
                    className="cursor-pointer transition-colors duration-150"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>{coin.market_cap_rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TokenIcon symbol={coin.symbol} size={28} />
                        <div>
                          <div className="text-sm font-semibold text-white">{coin.name}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{coin.symbol?.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-num text-sm font-semibold text-white">{formatPrice(liveP)}</td>
                    <td className={`px-4 py-3 text-sm font-medium font-num ${p1h >= 0 ? 'price-up' : 'price-down'}`}>{formatPct(p1h)}</td>
                    <td className={`px-4 py-3 text-sm font-medium font-num ${p24 >= 0 ? 'price-up' : 'price-down'}`}>{formatPct(p24)}</td>
                    <td className={`px-4 py-3 text-sm font-medium font-num ${p7d >= 0 ? 'price-up' : 'price-down'}`}>{formatPct(p7d)}</td>
                    <td className="px-4 py-3 text-sm font-num" style={{ color: 'rgba(255,255,255,0.6)' }}>{formatCompact(coin.total_volume)}</td>
                    <td className="px-4 py-3 text-sm font-num" style={{ color: 'rgba(255,255,255,0.6)' }}>{formatCompact(coin.market_cap)}</td>
                    <td className="px-4 py-3 w-24">
                      <SparkLine data={sparkData} positive={p7d >= 0} height={36} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
