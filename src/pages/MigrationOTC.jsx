import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2, Wallet, ArrowRight, CheckCircle2, RefreshCw,
  Download, Info,
  TrendingUp, ArrowDownUp, Landmark, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useMarkets, useBinanceStream } from '../hooks/useCrypto';

const INVESTORS_BANK = { id: 'investors', name: 'Investors Bank', number: '•••• 4281', color: '#1A73E8' };
const PORTFOLIO_STREAMS = ['btcusdt@ticker','ethusdt@ticker','bnbusdt@ticker','solusdt@ticker','xrpusdt@ticker','adausdt@ticker'];

export default function MigrationOTC() {
  const { user, updateUserData } = useAuth();
  const { data: markets } = useMarkets(30);
  const livePrices = useBinanceStream(PORTFOLIO_STREAMS);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('form');
  const [selectedMigrate, setSelectedMigrate] = useState(null);
  const [otcBalance, setOtcBalance] = useState(() => user?.otcBalance ?? 0);
  const [bankBalance, setBankBalance] = useState(() => user?.bankBalance ?? 18885000);
  const [migrationHistory, setMigrationHistory] = useState(() => user?.migrationHistory ?? []);
  const portfolioBalance = Number(user?.portfolioBalance ?? 0);

  const getPrice = (symbol) => {
    const key = `${symbol}USDT`;
    const live = livePrices[key]?.price;
    if (live) return live;
    const coin = markets.find(m => m.symbol?.toUpperCase() === symbol);
    return coin?.current_price || 0;
  };

  const portfolioCashBalance = Number(user?.portfolioBalance ?? 0);
  const portfolioHoldingsValue = (user?.holdings ?? []).reduce((sum, holding) => {
    const amount = Number(holding.amount || 0);
    return sum + (amount * getPrice(holding.symbol));
  }, 0);
  const portfolioTotalValue = portfolioCashBalance + portfolioHoldingsValue;

  useEffect(() => {
    if (user && user.email && typeof updateUserData === 'function') {
      const payload = { otcBalance, bankBalance, migrationHistory, portfolioBalance: Number(user?.portfolioBalance ?? 0), holdings: user?.holdings ?? [] };
      const storedUser = localStorage.getItem('nexotc_user');
      let parsed = null;
      try { parsed = storedUser ? JSON.parse(storedUser) : null; } catch {}
      const histEqual = JSON.stringify(parsed?.migrationHistory ?? []) === JSON.stringify(migrationHistory);
      const otcEqual = (parsed?.otcBalance ?? 0) === otcBalance;
      const bankEqual = (parsed?.bankBalance ?? 18885000) === bankBalance;
      const portfolioEqual = (parsed?.portfolioBalance ?? 0) === Number(user?.portfolioBalance ?? 0);
      if (!otcEqual || !bankEqual || !histEqual || !portfolioEqual) {
        updateUserData(payload);
      }
    }
  }, [otcBalance, bankBalance, migrationHistory, user, updateUserData]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'nexotc_user' || e.key === 'nexotc_users') {
        try {
          const storedUser = localStorage.getItem('nexotc_user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            if ((parsed.otcBalance ?? 0) !== otcBalance) setOtcBalance(parsed.otcBalance ?? 0);
            if ((parsed.bankBalance ?? 18885000) !== bankBalance) setBankBalance(parsed.bankBalance ?? 18885000);
            if (JSON.stringify(parsed.migrationHistory ?? []) !== JSON.stringify(migrationHistory)) setMigrationHistory(parsed.migrationHistory ?? []);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [bankBalance, migrationHistory, otcBalance]);

  // When auth user changes (login/logout), sync local state from user
  useEffect(() => {
    if (user) {
      setOtcBalance(user.otcBalance ?? 0);
      setBankBalance(user.bankBalance ?? 18885000);
      setMigrationHistory(user.migrationHistory ?? []);
    }
  }, [user]);

  const migrateAmount = parseFloat(amount) || 0;

  const calcFee = (amt) => {
    if (amt <= 10000) return 10;
    if (amt <= 50000) return 25;
    if (amt <= 100000) return 50;
    if (amt <= 500000) return 75;
    return 100;
  };

  const fee = calcFee(migrateAmount);
  const totalDeduction = migrateAmount + fee;

  const handleMigrate = () => {
    if (migrateAmount <= 0) {
      toast.error('Enter an amount to migrate');
      return;
    }
    if (totalDeduction > bankBalance) {
      toast.error('Insufficient bank funds (including fee)');
      return;
    }
    setSelectedMigrate({ amount: migrateAmount, fee, bank: INVESTORS_BANK });
    setStep('reviewing');
  };

  const handleConfirm = async () => {
    const nextOtcBalance = Number(otcBalance) + migrateAmount;
    const nextBankBalance = Number(bankBalance) - totalDeduction;
    const entry = {
      id: Date.now(),
      amount: migrateAmount,
      fee,
      bank: INVESTORS_BANK.name,
      date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    const nextHistory = [entry, ...migrationHistory];

    setMigrationHistory(nextHistory);
    setOtcBalance(nextOtcBalance);
    setBankBalance(nextBankBalance);
    if (user?.email) {
      updateUserData({
        otcBalance: nextOtcBalance,
        bankBalance: nextBankBalance,
        migrationHistory: nextHistory,
        portfolioBalance: Number(user.portfolioBalance ?? 0),
        holdings: user.holdings ?? [],
      });
    }
    setStep('processing');
    await new Promise(r => setTimeout(r, 2500));
    setStep('done');
    toast.success(`$${migrateAmount.toLocaleString()} migrated to OTC Portfolio`);
  };

  const handleNewMigration = () => {
    setStep('form');
    setAmount('');
    setSelectedMigrate(null);
  };

  const formatUSD = (num) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);

  return (
    <div className="space-y-6 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Account Migration</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Move funds from your bank accounts to your OTC Portfolio for trading
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <Landmark size={16} style={{ color: '#22c55e' }} />
          <span className="text-sm font-semibold" style={{ color: '#22c55e' }}>
            Portfolio Value: {formatUSD(portfolioTotalValue)}
          </span>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* OTC Portfolio */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
            style={{ background: '#3b82f6', transform: 'translate(30%, -30%)' }} />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.15)' }}>
              <Wallet size={20} style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>OTC Portfolio Balance</div>
              <div className="text-xl font-bold text-white mt-0.5">{formatUSD(otcBalance)}</div>
            </div>
          </div>
        </div>

        {/* Divider arrow */}
        <div className="hidden md:flex items-center justify-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ArrowRight size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>

        {/* Bank Account */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
            style={{ background: '#eab308', transform: 'translate(30%, -30%)' }} />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(234,179,8,0.15)' }}>
              <Building2 size={20} style={{ color: '#eab308' }} />
            </div>
            <div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Bank Account</div>
              <div className="text-base font-bold text-white">{INVESTORS_BANK.name}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{INVESTORS_BANK.number}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Migration form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Migrate Funds Card */}
          {step === 'done' ? (
            <div className="glass-card p-10 flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}>
                <CheckCircle2 size={40} style={{ color: '#22c55e' }} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Funds Migrated!</h3>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <span className="text-white font-semibold">{formatUSD(selectedMigrate?.amount)}</span> has been
                  moved from <span className="text-white font-semibold">{selectedMigrate?.bank?.name}</span>{' '}
                  to your <span className="text-white font-semibold">OTC Portfolio</span>.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-4 w-full max-w-lg">
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(59,130,246,0.08)' }}>
                  <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Amount</div>
                  <div className="font-bold text-white text-sm">{formatUSD(selectedMigrate?.amount)}</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(234,179,8,0.08)' }}>
                  <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Fee</div>
                  <div className="font-bold text-sm" style={{ color: '#eab308' }}>{formatUSD(selectedMigrate?.fee)}</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
                  <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Status</div>
                  <div className="font-bold text-sm" style={{ color: '#22c55e' }}>Settled</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
                  <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>New Balance</div>
                  <div className="font-bold text-white text-sm">{formatUSD(otcBalance)}</div>
                </div>
              </div>
              <button onClick={handleNewMigration} className="neon-button mt-2">Migrate More Funds</button>
            </div>
          ) : (
            <div className="glass-card p-6">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Download size={16} style={{ color: '#3b82f6' }} />
                Migrate Funds to OTC Portfolio
              </h2>

              {/* Bank Account */}
              <div className="mb-4">
                <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  From Bank Account
                </label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(26,115,232,0.1)', border: '1px solid rgba(26,115,232,0.25)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1A73E8' }}>
                    <Building2 size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{INVESTORS_BANK.name}</div>
                    <div className="text-xs font-num" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {INVESTORS_BANK.number}
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="text-xs font-medium mb-2 block" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Amount to Migrate
                </label>
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 bg-transparent text-3xl font-bold text-white outline-none placeholder-white/10"
                    />
                  </div>
                  <div className="flex gap-1.5 justify-end mt-3">
                    {['10K', '50K', '100K', '500K'].map(label => {
                      const val = parseInt(label.replace('K', '000'));
                      return (
                        <button
                          key={label}
                          onClick={() => setAmount(val.toString())}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105"
                          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)', color: '#3b82f6' }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Migration summary preview */}
              {migrateAmount > 0 && (
                <div className="p-3 rounded-xl mb-4" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>You're migrating</span>
                    <span className="font-bold text-white">{formatUSD(migrateAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1.5">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>From</span>
                    <span className="text-white font-medium">{INVESTORS_BANK.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1.5">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>To</span>
                    <span className="text-white font-medium flex items-center gap-1">
                      <Wallet size={12} style={{ color: '#3b82f6' }} /> OTC Portfolio
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1.5">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Fee</span>
                    <span className="font-medium" style={{ color: '#eab308' }}>{formatUSD(fee)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t flex items-center justify-between text-sm"
                    style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>OTC Portfolio Balance After</span>
                    <span className="font-bold text-white">{formatUSD(otcBalance + migrateAmount)}</span>
                  </div>
                </div>
              )}

              {/* Action */}
              {step === 'processing' ? (
                <div className="flex items-center justify-center gap-3 py-4">
                  <RefreshCw size={18} className="animate-spin" style={{ color: '#3b82f6' }} />
                  <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Processing migration…
                  </span>
                </div>
              ) : step === 'reviewing' ? (
                <div className="flex gap-3">
                  <button onClick={() => setStep('form')} className="flex-1 py-3.5 rounded-xl font-semibold glass-button text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      boxShadow: '0 0 20px rgba(59,130,246,0.3)',
                    }}
                  >
                    Confirm Migration
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleMigrate}
                  disabled={!amount || migrateAmount <= 0}
                  className="w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    boxShadow: '0 0 20px rgba(59,130,246,0.3)',
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Download size={16} />
                    Migrate to OTC Portfolio
                  </span>
                </button>
              )}
            </div>
          )}

        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Account Summary */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-white mb-4 text-sm flex items-center gap-2">
              <Info size={14} style={{ color: '#3b82f6' }} />
              Account Summary
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>OTC Portfolio</div>
                <div className="text-lg font-bold text-white mt-0.5">{formatUSD(otcBalance)}</div>
                <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: '#22c55e' }}>
                  <TrendingUp size={10} />
                  Ready for trading
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'rgba(26,115,232,0.06)', border: '1px solid rgba(26,115,232,0.12)' }}>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Linked Bank</div>
                <div className="text-base font-bold text-white mt-0.5">{INVESTORS_BANK.name}</div>
                <div className="text-xs font-num mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {INVESTORS_BANK.number}
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-white mb-4 text-sm flex items-center gap-2">
              <ArrowDownUp size={14} style={{ color: '#6366f1' }} />
              Migration Stats
            </h3>
            <div className="space-y-3">
              {[
                { label: 'OTC Portfolio', value: formatUSD(otcBalance), color: '#3b82f6' },
                { label: 'Linked Bank', value: `1 account`, color: '#eab308' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                  <span className="font-semibold text-xs font-num" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info card */}
          <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
            <div className="flex gap-2">
              <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#3b82f6' }} />
              <div>
                <div className="text-xs font-semibold text-white mb-1">How It Works</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}>
                  Funds migrate from your linked bank account directly into your OTC Portfolio. A processing fee of $10–$100 is charged based on the amount migrated. Once settled, your balance is immediately available for trading. All transfers are FDIC-insured up to $250,000.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Migration History */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Clock size={15} style={{ color: '#6366f1' }} />
            Migration History
          </h3>
          {migrationHistory.length > 0 && (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {migrationHistory.length} migration{migrationHistory.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {migrationHistory.length === 0 ? (
          <div className="p-10 text-center">
            <Building2 size={32} className="mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>No migrations yet</div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Your migration history will appear here
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['#', 'Date', 'Amount', 'Fee', 'Bank', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {migrationHistory.map((entry, idx) => (
                  <tr key={entry.id} className="transition-colors duration-150"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td className="px-5 py-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{idx + 1}</td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{entry.date}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-white">{formatUSD(entry.amount)}</td>
                    <td className="px-5 py-4 text-xs font-num" style={{ color: '#eab308' }}>{formatUSD(entry.fee)}</td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{entry.bank}</td>
                    <td className="px-5 py-4">
                      <span className="badge badge-green text-xs">Settled</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}