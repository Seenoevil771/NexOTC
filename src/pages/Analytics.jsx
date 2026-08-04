import { useState } from 'react';
import { BarChart2, TrendingUp, DollarSign, Zap, Globe, Activity as ActivityIcon } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, AreaChart, Area,
  ComposedChart
} from 'recharts';
import { useMarkets, useGlobalData } from '../hooks/useCrypto';
import { formatCompact, formatPct, formatPrice } from '../utils/format';
import TokenIcon from '../components/common/TokenIcon';

// Mock data
const VOLUME_DATA = Array.from({ length: 14 }, (_, i) => ({
  day: `May ${i + 4}`,
  buy: Math.floor(Math.random() * 800000 + 200000),
  sell: Math.floor(Math.random() * 600000 + 150000),
}));

const HEATMAP_TOKENS = ['BTC','ETH','BNB','SOL','XRP','ADA','AVAX','LINK','DOT','DOGE','MATIC','LTC','UNI','XLM','ATOM'];

const SECTOR_DATA = [
  { name: 'Layer 1', value: 58, color: '#3b82f6' },
  { name: 'DeFi', value: 16, color: '#6366f1' },
  { name: 'Stables', value: 12, color: '#22c55e' },
  { name: 'Layer 2', value: 8, color: '#F7931A' },
  { name: 'Gaming', value: 3, color: '#eab308' },
  { name: 'Other', value: 3, color: '#627EEA' },
];

const RADAR_DATA = [
  { metric: 'Liquidity', BTC: 95, ETH: 88, SOL: 72 },
  { metric: 'Volatility', BTC: 60, ETH: 65, SOL: 80 },
  { metric: 'Adoption', BTC: 98, ETH: 85, SOL: 68 },
  { metric: 'Dev Activity', BTC: 70, ETH: 92, SOL: 85 },
  { metric: 'Volume', BTC: 90, ETH: 82, SOL: 71 },
  { metric: 'Market Cap', BTC: 100, ETH: 75, SOL: 45 },
];

const DOMINANCE_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `May ${i + 1}`,
  BTC: 50 + Math.sin(i * 0.3) * 4 + Math.random() * 2,
  ETH: 17 + Math.cos(i * 0.4) * 2 + Math.random(),
  Others: 33 - Math.sin(i * 0.2) * 3 + Math.random(),
}));

export default function Analytics() {
  const { data: markets } = useMarkets(30);
  const { data: global } = useGlobalData();
  const [heatmapMetric, setHeatmapMetric] = useState('24h');

  const getPct = (coin) => {
    if (heatmapMetric === '24h') return coin.price_change_percentage_24h;
    if (heatmapMetric === '7d') return coin.price_change_percentage_7d_in_currency;
    return coin.price_change_percentage_1h_in_currency;
  };

  const getHeatColor = (pct) => {
    if (!pct) return 'rgba(255,255,255,0.05)';
    if (pct > 8) return 'rgba(34,197,94,0.55)';
    if (pct > 4) return 'rgba(34,197,94,0.38)';
    if (pct > 1) return 'rgba(34,197,94,0.22)';
    if (pct > 0) return 'rgba(34,197,94,0.12)';
    if (pct > -1) return 'rgba(239,68,68,0.12)';
    if (pct > -4) return 'rgba(239,68,68,0.22)';
    if (pct > -8) return 'rgba(239,68,68,0.38)';
    return 'rgba(239,68,68,0.55)';
  };

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Market intelligence, trends and performance metrics
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Market Cap', value: formatCompact(global?.total_market_cap?.usd), icon: Globe, color: '#3b82f6', change: global?.market_cap_change_percentage_24h_usd },
          { label: '24h Volume', value: formatCompact(global?.total_volume?.usd), icon: ActivityIcon, color: '#6366f1' },
          { label: 'Active Cryptos', value: global?.active_cryptocurrencies?.toLocaleString() || '–', icon: Zap, color: '#eab308' },
          { label: 'BTC Dominance', value: `${global?.market_cap_percentage?.btc?.toFixed(1)}%`, icon: BarChart2, color: '#F7931A' },
        ].map(({ label, value, icon: Icon, color, change }) => (
          <div key={label} className="glass-card p-5 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-xl" style={{ background: color }} />
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}25` }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <div className="text-xl font-bold font-num text-white">{value}</div>
            {change != null && (
              <div className={`text-xs mt-1 font-medium ${change >= 0 ? 'price-up' : 'price-down'}`}>{formatPct(change)} 24h</div>
            )}
          </div>
        ))}
      </div>

      {/* OTC Volume Chart + Sector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart2 size={15} style={{ color: '#3b82f6' }} />
            OTC Volume (Buy vs Sell)
          </h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={VOLUME_DATA} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  contentStyle={{ background: 'rgba(6,14,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(v) => [formatCompact(v)]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
                <Bar dataKey="buy" fill="rgba(34,197,94,0.5)" radius={[3, 3, 0, 0]} name="Buy Volume" />
                <Bar dataKey="sell" fill="rgba(239,68,68,0.5)" radius={[3, 3, 0, 0]} name="Sell Volume" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Globe size={15} style={{ color: '#6366f1' }} />
            Market Sectors
          </h3>
          <div className="space-y-3">
            {SECTOR_DATA.map(s => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.name}</span>
                  <span className="font-num font-bold" style={{ color: s.color }}>{s.value}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.value}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Zap size={15} style={{ color: '#eab308' }} />
            Market Heatmap
          </h3>
          <div className="flex gap-1">
            {['1h', '24h', '7d'].map(m => (
              <button key={m} onClick={() => setHeatmapMetric(m)}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={heatmapMetric === m ? {
                  background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)'
                } : { color: 'rgba(255,255,255,0.4)' }}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {HEATMAP_TOKENS.map(sym => {
            const coin = markets.find(m => m.symbol?.toUpperCase() === sym);
            const pct = coin ? getPct(coin) : 0;
            return (
              <div key={sym} className="rounded-xl p-3 text-center transition-all duration-300 cursor-pointer hover:scale-105"
                style={{ background: getHeatColor(pct), border: '1px solid rgba(255,255,255,0.06)' }}>
                <TokenIcon symbol={sym} size={24} className="mx-auto mb-1" />
                <div className="text-xs font-bold text-white">{sym}</div>
                <div className={`text-xs font-num font-medium mt-0.5 ${(pct || 0) >= 0 ? 'price-up' : 'price-down'}`}>
                  {formatPct(pct)}
                </div>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => {
              const colors = ['rgba(239,68,68,0.55)','rgba(239,68,68,0.3)','rgba(255,255,255,0.1)','rgba(34,197,94,0.3)','rgba(34,197,94,0.55)'];
              return <div key={i} className="w-5 h-3 rounded" style={{ background: colors[i] }} />;
            })}
          </div>
          <span>Bearish → Neutral → Bullish</span>
        </div>
      </div>

      {/* BTC Dominance + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={15} style={{ color: '#F7931A' }} />
            Dominance (30 Days)
          </h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DOMINANCE_DATA} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  {[['btcGrad','#F7931A'],['ethGrad','#627EEA'],['othGrad','#94a3b8']].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
                <YAxis tickFormatter={v => `${v.toFixed(0)}%`} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip contentStyle={{ background: 'rgba(6,14,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(v) => [`${v.toFixed(2)}%`]} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
                <Area type="monotone" dataKey="BTC" stroke="#F7931A" strokeWidth={2} fill="url(#btcGrad)" dot={false} name="BTC %" />
                <Area type="monotone" dataKey="ETH" stroke="#627EEA" strokeWidth={2} fill="url(#ethGrad)" dot={false} name="ETH %" />
                <Area type="monotone" dataKey="Others" stroke="#94a3b8" strokeWidth={1.5} fill="url(#othGrad)" dot={false} name="Others %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <ActivityIcon size={15} style={{ color: '#22c55e' }} />
            Asset Comparison Radar
          </h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} />
                <Radar name="BTC" dataKey="BTC" stroke="#F7931A" fill="#F7931A" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="ETH" dataKey="ETH" stroke="#627EEA" fill="#627EEA" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="SOL" dataKey="SOL" stroke="#9945FF" fill="#9945FF" fillOpacity={0.15} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Movers Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Zap size={14} style={{ color: '#eab308' }} />
            Top Movers — 24h
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Asset', 'Price', '24h Change', '7d Change', 'Volume', 'Market Cap'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...markets]
                .sort((a, b) => Math.abs(b.price_change_percentage_24h || 0) - Math.abs(a.price_change_percentage_24h || 0))
                .slice(0, 10)
                .map(coin => (
                  <tr key={coin.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <TokenIcon symbol={coin.symbol} size={28} />
                        <div>
                          <div className="text-sm font-semibold text-white">{coin.name}</div>
                          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{coin.symbol?.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-num text-sm font-semibold text-white">{formatPrice(coin.current_price)}</td>
                    <td className="px-5 py-3">
                      <span className={`badge text-xs ${(coin.price_change_percentage_24h || 0) >= 0 ? 'badge-green' : 'badge-red'}`}>
                        {formatPct(coin.price_change_percentage_24h)}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-sm font-num font-medium ${(coin.price_change_percentage_7d_in_currency || 0) >= 0 ? 'price-up' : 'price-down'}`}>
                      {formatPct(coin.price_change_percentage_7d_in_currency)}
                    </td>
                    <td className="px-5 py-3 text-sm font-num" style={{ color: 'rgba(255,255,255,0.55)' }}>{formatCompact(coin.total_volume)}</td>
                    <td className="px-5 py-3 text-sm font-num" style={{ color: 'rgba(255,255,255,0.55)' }}>{formatCompact(coin.market_cap)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

