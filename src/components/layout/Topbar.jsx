import { Bell, Search, ChevronDown, X, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Settings, LogOut } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarkets } from '../../hooks/useCrypto';
import { useBinanceStream } from '../../hooks/useCrypto';
import { formatPrice, formatPct, formatCompact } from '../../utils/format';
import TokenIcon from '../common/TokenIcon';
import { useAuth } from '../../contexts/AuthContext';

export default function Topbar({ sidebarWidth }) {
  const { user, logout } = useAuth();
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'JD';
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const accountRef = useRef(null);
  const navigate = useNavigate();
  const { data: markets, loading } = useMarkets(100);
  const topStreams = markets.slice(0, 30).map(m => `${m.symbol?.toLowerCase() || ''}usdt@ticker`);
  const livePrices = useBinanceStream(topStreams);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return markets.filter(m =>
      m.name?.toLowerCase().includes(q) ||
      m.symbol?.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [markets, search]);

  const getPrice = (coin) => {
    const key = coin.symbol?.toUpperCase() + 'USDT';
    return livePrices[key]?.price || coin.current_price;
  };

  const getChange = (coin) => {
    const key = coin.symbol?.toUpperCase() + 'USDT';
    return livePrices[key]?.change24h || coin.price_change_percentage_24h;
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setFocused(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur(); }
      if (e.key === 'Enter' && filtered.length > 0) {
        navigate('/market');
        setSearch('');
        setFocused(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [filtered, navigate]);

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center gap-4 px-6"
      style={{
        left: sidebarWidth,
        height: '64px',
        background: 'rgba(3,7,18,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        transition: 'left 0.3s',
      }}
    >
      {/* Search */}
      <div className="flex-1 max-w-sm relative" ref={dropdownRef}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            ref={inputRef}
            className="input-glass pl-9 py-2 text-sm"
            placeholder="Search tokens, markets…"
            style={{ borderRadius: '0.75rem' }}
            value={search}
            onChange={e => { setSearch(e.target.value); setFocused(true); }}
            onFocus={() => setFocused(true)}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setFocused(false); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {focused && search.trim() && (
          <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(6,14,30,0.97)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}>
            {loading ? (
              <div className="p-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Loading tokens…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                No tokens found for "{search}"
              </div>
            ) : (
              <div>
                <div className="px-4 py-2.5 text-xs font-medium border-b" style={{ color: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
                </div>
                {filtered.map(coin => {
                  const pct = getChange(coin);
                  const isUp = (pct || 0) >= 0;
                  return (
                    <button
                      key={coin.id}
                      onClick={() => { setSearch(''); setFocused(false); navigate('/market'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-white/5 border-b last:border-0"
                      style={{ borderColor: 'rgba(255,255,255,0.03)' }}
                    >
                      <TokenIcon symbol={coin.symbol} size={34} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{coin.symbol?.toUpperCase()}</span>
                          <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{coin.name}</span>
                          <span className="text-xs font-num ml-auto" style={{ color: 'rgba(255,255,255,0.25)' }}>#{coin.market_cap_rank}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs font-num font-semibold text-white">{formatPrice(getPrice(coin))}</span>
                          <span className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? 'price-up' : 'price-down'}`}>
                            {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {formatPct(pct)}
                          </span>
                          <span className="text-xs font-num" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            Vol {formatCompact(coin.total_volume)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                <div className="px-4 py-2 text-center border-t text-xs" style={{ color: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  Press <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>Enter</kbd> to view all results
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Market status pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-green-400">Markets Open</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl glass-button">
          <Bell size={16} className="text-white/60" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: '#3b82f6' }} />
        </button>

        {/* Account */}
        <div className="relative" ref={accountRef}>
          <button onClick={() => setAccountOpen(!accountOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-button">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              {initials}
            </div>
            <span className="text-sm font-medium text-white/80 hidden md:block">{user?.name || 'User'}</span>
            <ChevronDown size={13} className={`text-white/40 hidden md:block transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`} />
          </button>

          {accountOpen && (
            <div className="absolute top-full right-0 mt-2 w-52 z-50 rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(8,18,38,0.98)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="text-sm font-semibold text-white">{user?.name || 'User'}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.email || ''}</div>
              </div>
              <div className="py-1">
                <button onClick={() => { navigate('/settings'); setAccountOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                  <Settings size={15} className="text-white/40" />
                  Profile Settings
                </button>
                <button onClick={() => { logout(); navigate('/'); setAccountOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors">
                  <LogOut size={15} className="text-white/40" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
