import { useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip
} from 'recharts';
import { formatPrice, formatDate } from '../../utils/format';
import { useCoinChart } from '../../hooks/useCrypto';
import LoadingSpinner from './LoadingSpinner';

const RANGES = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-sm">
      <div className="text-white font-num font-semibold">{formatPrice(payload[0].value)}</div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{label}</div>
    </div>
  );
};

export default function PriceChart({ coinId = 'bitcoin', color = '#3b82f6' }) {
  const [days, setDays] = useState(7);
  const { data, loading } = useCoinChart(coinId, days);

  const chartData = data?.prices?.map(([ts, price]) => ({
    time: formatDate(ts),
    price,
  })) || [];

  const isUp = chartData.length >= 2 && chartData[chartData.length - 1].price >= chartData[0].price;
  const lineColor = isUp ? '#22c55e' : '#ef4444';

  return (
    <div className="h-full flex flex-col">
      {/* Range buttons */}
      <div className="flex items-center gap-1 mb-4">
        {RANGES.map(r => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150"
            style={days === r.days ? {
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#3b82f6',
            } : {
              background: 'transparent',
              border: '1px solid transparent',
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                tickLine={false} axisLine={false}
                tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)}`}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone" dataKey="price"
                stroke={lineColor} strokeWidth={2}
                fill="url(#chartGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
