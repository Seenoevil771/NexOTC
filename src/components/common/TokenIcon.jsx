import { memo, useState } from 'react';
import { TOKENS } from '../../data/tokens';

const TokenIcon = memo(function TokenIcon({ symbol, size = 32, className = '' }) {
  const token = TOKENS.find(t => t.symbol === symbol?.toUpperCase());
  const color = token?.color || '#94a3b8';
  const letter = (symbol || '?')[0].toUpperCase();
  const [imageFailed, setImageFailed] = useState(false);
  const normalizedSymbol = (symbol || '').toUpperCase();
  const iconKey = normalizedSymbol.toLowerCase().replace(/[^a-z0-9]/g, '');
  const logoUrl = token?.logo || `https://assets.coincap.io/assets/icons/${iconKey}@2x.png`;

  if (imageFailed || !iconKey) {
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
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${color}40`,
      }}
    >
      <img
        src={logoUrl}
        alt={token?.name || normalizedSymbol || 'Token'}
        onError={() => setImageFailed(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
});

export default TokenIcon;