import { memo } from 'react';
import { TOKENS } from '../../data/tokens';

const TokenIcon = memo(function TokenIcon({ symbol, size = 32, className = '' }) {
  const token = TOKENS.find(t => t.symbol === symbol?.toUpperCase());
  const color = token?.color || '#94a3b8';
  const letter = (symbol || '?')[0].toUpperCase();

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}30, ${color}15)`,
        border: `1.5px solid ${color}40`,
        color: color,
        fontSize: size * 0.38,
      }}
    >
      {letter}
    </div>
  );
});

export default TokenIcon;