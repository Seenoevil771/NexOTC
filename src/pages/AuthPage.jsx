import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Mail, Lock, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate tiny delay for UX
    await new Promise(r => setTimeout(r, 400));

    if (mode === 'login') {
      const result = login(form.email, form.password);
      if (!result.ok) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      if (!form.name.trim()) { toast.error('Full name is required'); setLoading(false); return; }
      if (!form.email.trim()) { toast.error('Email is required'); setLoading(false); return; }
      if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); setLoading(false); return; }
      if (form.password !== form.confirm) { toast.error('Passwords do not match'); setLoading(false); return; }
      const result = signup(form.name, form.email, form.password);
      if (!result.ok) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
      toast.success('Account created!');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#030712' }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.08] blur-3xl"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', top: '-15%', left: '10%' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', bottom: '10%', right: '15%' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent)', top: '40%', left: '50%' }} />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 0 30px rgba(59,130,246,0.3)' }}>
              <Zap size={24} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">NexOTC</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Institutional OTC Trading Platform
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: 'rgba(6,14,30,0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200"
                style={mode === m ? {
                  background: 'rgba(59,130,246,0.12)',
                  color: '#3b82f6',
                  boxShadow: '0 0 15px rgba(59,130,246,0.1)',
                } : {
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <input
                    value={form.name}
                    onChange={update('name')}
                    placeholder="Your full name"
                    className="input-glass pl-9 py-2.5 text-sm w-full"
                    style={{ borderRadius: '0.75rem' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@example.com"
                  className="input-glass pl-9 py-2.5 text-sm w-full"
                  style={{ borderRadius: '0.75rem' }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  placeholder="••••••••"
                  className="input-glass pl-9 pr-9 py-2.5 text-sm w-full"
                  style={{ borderRadius: '0.75rem' }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={update('confirm')}
                    placeholder="••••••••"
                    className="input-glass pl-9 py-2.5 text-sm w-full"
                    style={{ borderRadius: '0.75rem' }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                boxShadow: '0 0 20px rgba(59,130,246,0.25)',
              }}
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={14} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Divider */}
          {mode === 'login' && (
            <div className="mt-6 text-center">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="font-semibold" style={{ color: '#3b82f6' }}>
                  Create one
                </button>
              </p>
            </div>
          )}
          {mode === 'signup' && (
            <div className="mt-6 text-center">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="font-semibold" style={{ color: '#3b82f6' }}>
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: CheckCircle2, label: 'Secure', sub: '256-bit encryption', color: '#22c55e' },
            { icon: CheckCircle2, label: 'Fast', sub: 'Instant settlement', color: '#3b82f6' },
            { icon: CheckCircle2, label: 'Insured', sub: 'FDIC protected', color: '#eab308' },
          ].map(({ icon: Icon, label, sub, color }) => (
            <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Icon size={14} className="mx-auto mb-1" style={{ color }} />
              <div className="text-xs font-semibold text-white">{label}</div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}