import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, ArrowLeftRight, GitCompare, Wallet, BookOpen,
  BarChart2, Settings, Bell, ShieldCheck, ChevronRight, Zap, LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/market', icon: TrendingUp, label: 'Markets' },
  { to: '/otc', icon: ArrowLeftRight, label: 'OTC Trade' },
  { to: '/migration-assets', icon: GitCompare, label: 'Migration Assets' },
  { to: '/portfolio', icon: Wallet, label: 'Portfolio' },
  { to: '/orderbook', icon: BookOpen, label: 'Order Book' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
];

const bottomItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  return (
    <aside
      className="fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300"
      style={{
        width: collapsed ? '72px' : '240px',
        background: 'rgba(6,14,30,0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 mb-2" style={{ height: '64px' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 glow-animate"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
          <Zap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-white text-lg leading-none">NexOTC</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Pro Trading</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
              border: '1px solid rgba(59,130,246,0.2)',
            } : {}}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
                {isActive && !collapsed && (
                  <ChevronRight size={14} className="ml-auto opacity-60" />
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                    style={{ background: '#3b82f6' }} />
                )}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 rounded-lg text-xs font-medium text-white bg-dark-700 border border-white/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 space-y-1">
        <div className="border-t border-white/5 my-2" />
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive ? 'text-white bg-white/8' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-all duration-200"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-200"
        >
          <ChevronRight size={18} className={`flex-shrink-0 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
