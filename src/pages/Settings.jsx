import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Bell, Shield, Globe, Palette, Key, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SECTIONS = ['Profile', 'Security', 'Notifications', 'Preferences', 'API Keys'];

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState('Profile');
  const [notifs, setNotifs] = useState({ priceAlerts: true, orderFills: true, news: false, marketing: false });
  const [currency, setCurrency] = useState('USD');
  const [security, setSecurity] = useState({ twoFA: true, whitlist: false, loginNotifs: true });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passMsg, setPassMsg] = useState('');
  const [apiKey, setApiKey] = useState('nex_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6');
  const [apiRevealed, setApiRevealed] = useState(false);
  const [savedNotifs, setSavedNotifs] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [chartStyle, setChartStyle] = useState('Candle');
  const [timezone, setTimezone] = useState('UTC (Coordinated Universal Time)');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Manage your account, security, and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="glass-card p-3 h-fit space-y-1">
          {[
            { label: 'Profile', icon: User },
            { label: 'Security', icon: Shield },
            { label: 'Notifications', icon: Bell },
            { label: 'Preferences', icon: Palette },
            { label: 'API Keys', icon: Key },
          ].map(({ label, icon: Icon }) => (
            <button key={label} onClick={() => setSection(label)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={section === label ? {
                background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)'
              } : { color: 'rgba(255,255,255,0.5)' }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 glass-card p-6 space-y-6">
          {section === 'Profile' && (
            <>
              <h2 className="font-bold text-white text-lg">Profile Information</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>{initials}</div>
                <div>
                  <div className="font-semibold text-white">{user?.name || 'User'}</div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.email || ''}</div>
                  <span className="badge badge-gold mt-1">VIP Tier</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[['Full Name', user?.name || 'User'], ['Email', user?.email || '']].map(([label, val]) => (
                  <div key={label}>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</label>
                    <input className="input-glass" defaultValue={val} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 items-center">
                <button onClick={() => { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2000); }} className="neon-button text-sm">{profileSaved ? '✓ Saved' : 'Save Changes'}</button>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </>
          )}

          {section === 'Security' && (
            <>
              <h2 className="font-bold text-white text-lg">Security Settings</h2>
              {[
                { key: 'twoFA', label: 'Two-Factor Authentication', sub: 'Add an extra layer of security with 2FA', color: '#22c55e' },
                { key: 'whitlist', label: 'Withdrawal Whitelist', sub: 'Only allow withdrawals to whitelisted addresses', color: '#3b82f6' },
                { key: 'loginNotifs', label: 'Login Notifications', sub: 'Get notified of new logins to your account', color: '#6366f1' },
              ].map(({ key, label, sub, color }) => (
                <div key={key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <div className="font-medium text-white text-sm">{label}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</div>
                  </div>
                  <button onClick={() => setSecurity(p => ({ ...p, [key]: !p[key] }))}
                    className="w-11 h-6 rounded-full relative cursor-pointer transition-all duration-200 flex-shrink-0"
                    style={{ background: security[key] ? color : 'rgba(255,255,255,0.1)' }}>
                    <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                      style={{ left: security[key] ? 'calc(100% - 1.375rem)' : '0.125rem' }} />
                  </button>
                </div>
              ))}
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Change Password</label>
                <div className="space-y-3">
                  <input className="input-glass" type="password" placeholder="Current password"
                    value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} />
                  <input className="input-glass" type="password" placeholder="New password"
                    value={passwordForm.newPass} onChange={e => setPasswordForm(p => ({ ...p, newPass: e.target.value }))} />
                  <input className="input-glass" type="password" placeholder="Confirm new password"
                    value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} />
                </div>
                <button onClick={() => {
                  if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
                    setPassMsg('Please fill in all fields');
                  } else if (passwordForm.newPass !== passwordForm.confirm) {
                    setPassMsg('Passwords do not match');
                  } else if (passwordForm.newPass.length < 6) {
                    setPassMsg('Password must be at least 6 characters');
                  } else {
                    setPassMsg('✓ Password updated successfully');
                    setPasswordForm({ current: '', newPass: '', confirm: '' });
                  }
                  setTimeout(() => setPassMsg(''), 3000);
                }} className="neon-button text-sm mt-4">Update Password</button>
                {passMsg && (
                  <div className={`text-sm mt-2 font-medium ${passMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                    {passMsg}
                  </div>
                )}
              </div>
            </>
          )}

          {section === 'Notifications' && (
            <>
              <h2 className="font-bold text-white text-lg">Notification Preferences</h2>
              {[
                { key: 'priceAlerts', label: 'Price Alerts', sub: 'Notify when price targets are hit' },
                { key: 'orderFills', label: 'Order Fills', sub: 'Notify when OTC orders are executed' },
                { key: 'news', label: 'Market News', sub: 'Daily market summaries and news' },
                { key: 'marketing', label: 'Marketing', sub: 'Product updates and promotions' },
              ].map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <div className="font-medium text-white text-sm">{label}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</div>
                  </div>
                  <button onClick={() => setNotifs(p => ({ ...p, [key]: !p[key] }))}
                    className="w-11 h-6 rounded-full relative cursor-pointer transition-all duration-200 flex-shrink-0"
                    style={{ background: notifs[key] ? '#3b82f6' : 'rgba(255,255,255,0.1)' }}>
                    <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                      style={{ left: notifs[key] ? 'calc(100% - 1.375rem)' : '0.125rem' }} />
                  </button>
                </div>
              ))}
              <button onClick={() => { setSavedNotifs(true); setTimeout(() => setSavedNotifs(false), 2000); }}
                className="neon-button text-sm">{savedNotifs ? '✓ Preferences Saved' : 'Save Notification Preferences'}</button>
            </>
          )}

          {section === 'Preferences' && (
            <>
              <h2 className="font-bold text-white text-lg">Display Preferences</h2>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Default Currency</label>
                  <div className="flex gap-2 flex-wrap">
                    {['USD','EUR','GBP','BTC'].map(c => (
                      <button key={c} onClick={() => setCurrency(c)}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={currency === c ? {
                          background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.35)'
                        } : {
                          background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Chart Style</label>
                  <div className="flex gap-2 flex-wrap">
                    {['Candle','Line','Area','Depth'].map(s => (
                      <button key={s} onClick={() => setChartStyle(s)}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={chartStyle === s ? {
                          background: 'rgba(99,102,241,0.15)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.35)'
                        } : {
                          background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Time Zone</label>
                  <select className="input-glass w-full max-w-xs" value={timezone} onChange={e => setTimezone(e.target.value)}>
                    <option>UTC (Coordinated Universal Time)</option>
                    <option>EST (Eastern Standard Time)</option>
                    <option>PST (Pacific Standard Time)</option>
                    <option>GMT (Greenwich Mean Time)</option>
                    <option>IST (India Standard Time)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {section === 'API Keys' && (
            <>
              <h2 className="font-bold text-white text-lg">API Access</h2>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium text-white">Your API Key</div>
                  <span className="badge badge-green text-xs">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-xs flex-1 break-all" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {apiRevealed ? apiKey : `nex_live_${'•'.repeat(40)}`}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setApiRevealed(!apiRevealed)}
                      className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                      {apiRevealed ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => { navigator.clipboard?.writeText(apiKey); }}
                      className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Whitelist IP (optional)</label>
                  <input className="input-glass" placeholder="e.g. 192.168.1.1" defaultValue="" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Permissions</label>
                  <div className="flex gap-2 flex-wrap">
                    {['Read', 'Trade', 'Withdraw'].map(p => (
                      <label key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <input type="checkbox" defaultChecked={p === 'Read'} className="accent-blue-500" />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => {
                  const chars = 'abcdef0123456789';
                  const newKey = 'nex_live_' + Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                  setApiKey(newKey);
                  setApiRevealed(true);
                }} className="neon-button text-sm">Generate New Key</button>
                <button className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
                  Revoke Key
                </button>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Created: <span className="text-white/60">June 15, 2026</span>
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Last used: <span className="text-white/60">Today</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
