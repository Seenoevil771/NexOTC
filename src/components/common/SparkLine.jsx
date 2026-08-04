import { memo } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const SparkLine = memo(function SparkLine({ data = [], positive = true, height = 40 }) {
  if (!data || data.length === 0) return <div style={{ height }} />;

  const chartData = data.map((v, i) => ({ v: typeof v === 'number' ? v : v[1] }));
  const color = positive ? '#22c55e' : '#ef4444';

  return (
    <ResponsiveContainer width="100%" height={height} minWidth={40}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`sg-${positive}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#sg-${positive})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export default SparkLine;