import { useMarkets } from '../../hooks/useCrypto';
import { formatPrice, formatPct } from '../../utils/format';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function Ticker({ sidebarWidth }) {
  const { data } = useMarkets(20);

  return (
    <div
      className="fixed z-20 overflow-hidden"
      style={{
        left: sidebarWidth,
        top: '64px',
        right: 0,
        height: '36px',
        background: 'rgba(6,14,30,0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        transition: 'left 0.3s',
      }}
    >
      <div className="ticker-wrap h-full flex items-center">
        <div className="ticker-move flex items-center gap-8">
          {[...data, ...data].map((coin, i) => {
            const up = coin.price_change_percentage_24h >= 0;
            return (
              <div key={`${coin.id}-${i}`} className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono text-xs font-semibold text-white/80">{coin.symbol?.toUpperCase()}</span>
                <span className="font-mono text-xs font-num">{formatPrice(coin.current_price)}</span>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'price-up' : 'price-down'}`}>
                  {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {formatPct(coin.price_change_percentage_24h)}
                </span>
                <span className="text-white/10">•</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
