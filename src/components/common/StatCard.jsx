import { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = memo(function StatCard({ title, value, sub, change, icon: Icon, color = '#3b82f6', gradient }) {
  const isUp = change >= 0;

  return (
    <div className="glass-card p-5 relative overflow-hidden">
      {/* Gradient blob */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl"
        style={{ background: color }} />

      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{title}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
            <Icon size={16} style={{ color }} />
          </div>
        )}
      </div>

      <div className="text-2xl font-bold font-num text-white mb-1">{value}</div>

      <div className="flex items-center gap-2">
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'price-up' : 'price-down'}`}>
            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isUp ? '+' : ''}{typeof change === 'number' ? change.toFixed(2) : change}%
          </span>
        )}
        {sub && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</span>}
      </div>
    </div>
  );
});

export default StatCard;
