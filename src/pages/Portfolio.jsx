import { useState, useMemo } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, PieChart,
  Send, Download, Copy, Check, X, ChevronRight, Clock, ExternalLink, QrCode
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { useMarkets, useBinanceStream } from '../hooks/useCrypto';
import { formatPrice, formatCompact, formatPct, formatNum } from '../utils/format';
import TokenIcon from '../components/common/TokenIcon';
import { TOKENS } from '../data/tokens';

const WS_STREAMS = ['btcusdt@ticker','ethusdt@ticker','bnbusdt@ticker','solusdt@ticker','xrpusdt@ticker','adausdt@ticker'];

const HOLDINGS = [];

const PORTFOLIO_HISTORY = Array.from({ length: 30 }, (_, i) => {
  const base = 185000;
  const noise = Math.sin(i * 0.7) * 12000 + Math.cos(i * 0.4) * 8000 + (Math.random() - 0.4) * 5000;
  return { day: `May ${i + 1}`, value: Math.max(base + noise + i * 800, 100000) };
});

const COLORS = ['#F7931A', '#627EEA', '#9945FF', '#F3BA2F', '#00AAE4', '#0033AD'];

const WALLET_ADDRESSES = {
  BTC: 'bc1q54mlrtpkkmwdrsx68zeewgrh7egwezl0sryg42',
  ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
  USDT: '0xCbD4b354eCf737718984a4Bc50a24d3f90fd4f61',
  BNB: '0xCbD4b354eCf737718984a4Bc50a24d3f90fd4f61',
  SOL: '3Y9EtGWwEXR7KJEaY9fTznUtJseWdsjCerQXwPmwyFQt',
  USDC: '0xCbD4b354eCf737718984a4Bc50a24d3f90fd4f61',
  XRP: '3Y9EtGWwEXR7KJEaY9fTznUtJseWdsjCerQXwPmwyFQt',
  ADA: '3Y9EtGWwEXR7KJEaY9fTznUtJseWdsjCerQXwPmwyFQt',
  DOGE: '3Y9EtGWwEXR7KJEaY9fTznUtJseWdsjCerQXwPmwyFQt',
  DOT: '3Y9EtGWwEXR7KJEaY9fTznUtJseWdsjCerQXwPmwyFQt',
  AVAX: '3Y9EtGWwEXR7KJEaY9fTznUtJseWdsjCerQXwPmwyFQt',
  LINK: '0xCbD4b354eCf737718984a4Bc50a24d3f90fd4f61',
  MATIC: '0xCbD4b354eCf737718984a4Bc50a24d3f90fd4f61',
};

const WALLET_ASSETS = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'ADA', 'DOGE', 'DOT', 'AVAX', 'LINK', 'MATIC'];

const CustomTooltipPie = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <div className="font-bold text-white">{payload[0].name}</div>
      <div className="font-num" style={{ color: payload[0].payload.color }}>{formatPct(payload[0].value)}</div>
    </div>
  );
};

export default function Portfolio() {
  const { data: markets } = useMarkets(30);
  const livePrices = useBinanceStream(WS_STREAMS);
  const [tab, setTab] = useState('holdings');
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [sendStep, setSendStep] = useState('asset'); // asset → details → review → confirm
  const [sendAsset, setSendAsset] = useState(null);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendMemo, setSendMemo] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [receiveAsset, setReceiveAsset] = useState('BTC');
  const [copied, setCopied] = useState(false);

  const getPrice = (symbol) => {
    const key = symbol + 'USDT';
    const live = livePrices[key]?.price;
    if (live) return live;
    const coin = markets.find(m => m.symbol?.toUpperCase() === symbol);
    return coin?.current_price || 0;
  };

  const holdings = useMemo(() => HOLDINGS.map(h => {
    const price = getPrice(h.symbol);
    const currentValue = price * h.amount;
    const costBasis = h.avgBuy * h.amount;
    const pnl = currentValue - costBasis;
    const pnlPct = (pnl / costBasis) * 100;
    return { ...h, price, currentValue, costBasis, pnl, pnlPct };
  }), [markets, livePrices]);

  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalCost = holdings.reduce((s, h) => s + h.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = (totalPnl / totalCost) * 100;

  const pieData = holdings.map((h, i) => ({
    name: h.symbol,
    value: parseFloat(((h.currentValue / totalValue) * 100).toFixed(2)),
    color: COLORS[i % COLORS.length],
  }));

  const resetSend = () => {
    setSendStep('asset');
    setSendAsset(null);
    setSendAddress('');
    setSendAmount('');
    setSendMemo('');
    setSendSuccess(false);
    setSendError('');
  };

  const getBalance = (symbol) => {
    const h = holdings.find(h => h.symbol === symbol);
    return h ? h.amount : 0;
  };

  const [sendError, setSendError] = useState('');

  const handleSendConfirm = () => {
    const balance = getBalance(sendAsset);
    const fee = sendAsset === 'BTC' ? 0.0001 : sendAsset === 'ETH' ? 0.003 : sendAsset === 'SOL' ? 0.0005 : 0.001;
    const totalNeeded = parseFloat(sendAmount || 0) + fee;
    if (balance < totalNeeded) {
      setSendError(`Insufficient balance. You have ${formatNum(balance, 6)} ${sendAsset} but need ${formatNum(totalNeeded, 6)} ${sendAsset} (including fee).`);
      return;
    }
    setSendSuccess(true);
    setTimeout(() => {
      setSendOpen(false);
      setTimeout(resetSend, 300);
    }, 2500);
  };

  const token = WALLET_ASSETS.find(a => a === sendAsset);
  const sendTokenInfo = TOKENS.find(t => t.symbol === sendAsset);

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Track your holdings, send and receive assets
        </p>
      </div>

      {/* Portfolio Value Hero */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 30% 50%, #3b82f6, transparent 60%)' }} />
        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Portfolio Value</p>
            <div className="text-4xl font-bold font-num text-white mb-2">{formatCompact(totalValue)}</div>
            <div className={`flex items-center gap-2 text-sm font-medium ${totalPnl >= 0 ? 'price-up' : 'price-down'}`}>
              {totalPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{totalPnl >= 0 ? '+' : ''}{formatCompact(Math.abs(totalPnl))}</span>
              <span className="text-xs">({formatPct(totalPnlPct)}) all time</span>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Cost Basis</p>
            <div className="text-xl font-bold font-num text-white">{formatCompact(totalCost)}</div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Unrealized P&amp;L</p>
            <div className={`text-xl font-bold font-num ${totalPnl >= 0 ? 'price-up' : 'price-down'}`}>
              {totalPnl >= 0 ? '+' : ''}{formatCompact(Math.abs(totalPnl))}
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Actions Row */}
      <div className="flex gap-3">
        <button onClick={() => { resetSend(); setSendOpen(true); }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white' }}>
          <Send size={16} />
          Send
        </button>
        <button onClick={() => setReceiveOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
          <Download size={16} />
          Receive
        </button>
        <button className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
          <Plus size={16} />
          Buy
        </button>
      </div>

      {/* Chart + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="font-semibold text-white mb-4">Portfolio Value (30 Days)</h3>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PORTFOLIO_HISTORY} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  contentStyle={{ background: 'rgba(6,14,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(v) => [formatCompact(v), 'Value']}
                />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#portfolioGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><PieChart size={15} style={{ color: '#3b82f6' }} />Allocation</h3>
          <div style={{ height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipPie />} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {pieData.map((p, i) => (
              <div key={p.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                <span className="text-xs font-medium text-white flex-1">{p.name}</span>
                <span className="text-xs font-num" style={{ color: 'rgba(255,255,255,0.5)' }}>{p.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card overflow-hidden">
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {['holdings'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-6 py-3.5 text-sm font-medium capitalize transition-all duration-150"
              style={tab === t ? {
                color: '#3b82f6',
                borderBottom: '2px solid #3b82f6',
                background: 'rgba(59,130,246,0.05)',
              } : { color: 'rgba(255,255,255,0.4)' }}
            >
              {t}
            </button>
          ))}
          <div className="flex-1" />
        </div>

        {tab === 'holdings' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Asset', 'Holdings', 'Avg Buy Price', 'Current Price', 'Current Value', 'P&L', 'P&L %', 'Allocation'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <Wallet size={36} className="mx-auto mb-3 opacity-20 text-white" />
                      <div className="text-sm font-medium text-white/40">No holdings yet</div>
                      <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        Use Send / Receive to move assets into your portfolio
                      </div>
                    </td>
                  </tr>
                ) : (
                  holdings.map((h, i) => (
                    <tr key={h.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <TokenIcon symbol={h.symbol} size={32} />
                          <div>
                            <div className="text-sm font-bold text-white">{h.symbol}</div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                              {TOKENS.find(t => t.symbol === h.symbol)?.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-num text-sm text-white">{formatNum(h.amount, 4)}</td>
                      <td className="px-5 py-4 font-num text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{formatPrice(h.avgBuy)}</td>
                      <td className="px-5 py-4 font-num text-sm font-semibold text-white">{formatPrice(h.price)}</td>
                      <td className="px-5 py-4 font-num text-sm font-semibold text-white">{formatCompact(h.currentValue)}</td>
                      <td className={`px-5 py-4 font-num text-sm font-semibold ${h.pnl >= 0 ? 'price-up' : 'price-down'}`}>
                        {h.pnl >= 0 ? '+' : ''}{formatCompact(Math.abs(h.pnl))}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge text-xs ${h.pnlPct >= 0 ? 'badge-green' : 'badge-red'}`}>
                          {h.pnlPct >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {formatPct(h.pnlPct)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', minWidth: '60px' }}>
                            <div className="h-full rounded-full" style={{ width: `${(h.currentValue / totalValue) * 100}%`, background: COLORS[i % COLORS.length] }} />
                          </div>
                          <span className="text-xs font-num" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            {((h.currentValue / totalValue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== SEND MODAL ===== */}
      {sendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget && !sendSuccess) { setSendOpen(false); setTimeout(resetSend, 300); } }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(8,18,38,0.98)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
            }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                {sendStep !== 'confirm' && sendStep !== 'asset' && (
                  <button onClick={() => setSendStep(sendStep === 'details' ? 'asset' : 'details')}
                    className="p-1 -ml-1 rounded-lg hover:bg-white/5">
                    <ChevronRight size={16} className="rotate-180 text-white/40" />
                  </button>
                )}
                <h3 className="font-semibold text-white text-base">
                  {sendSuccess ? 'Sent!' : sendStep === 'asset' ? 'Select Asset' : sendStep === 'confirm' ? 'Confirm Send' : 'Send Details'}
                </h3>
              </div>
              <button onClick={() => { setSendOpen(false); setTimeout(resetSend, 300); }}
                className="p-1.5 rounded-lg hover:bg-white/5">
                <X size={16} className="text-white/40" />
              </button>
            </div>

            {sendSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <Check size={28} className="text-green-400" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">Transaction Sent</div>
                  <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {sendAmount} {sendAsset} sent successfully
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Transaction ID</div>
                  <div className="text-xs font-mono mt-0.5 text-white/50 truncate">
                    0x{Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}
                  </div>
                </div>
                <div className="text-xs animate-pulse" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  awaiting confirmation...
                </div>
              </div>
            ) : sendStep === 'asset' ? (
              <div className="p-3 max-h-80 overflow-y-auto">
                {WALLET_ASSETS.map(sym => {
                  const info = TOKENS.find(t => t.symbol === sym);
                  const balance = getBalance(sym);
                  const hasBalance = balance > 0;
                  return (
                    <button key={sym}
                      onClick={() => { if (!hasBalance) return; setSendAsset(sym); setSendStep('details'); }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                      style={{
                        opacity: hasBalance ? 1 : 0.35,
                        cursor: hasBalance ? 'pointer' : 'not-allowed',
                      }}
                      onMouseEnter={e => { if (hasBalance) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <TokenIcon symbol={sym} size={36} />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold text-white">{sym}</div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{info?.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-num text-white/50">{formatNum(balance, 6)}</div>
                        {!hasBalance && <div className="text-xs text-red-400/60">0 balance</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : sendStep === 'details' ? (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-3">
                    <TokenIcon symbol={sendAsset} size={32} />
                    <div>
                      <div className="text-sm font-semibold text-white">{sendAsset}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Network: {sendAsset === 'BTC' ? 'Bitcoin' : sendAsset === 'ETH' || sendAsset === 'USDT' || sendAsset === 'LINK' || sendAsset === 'MATIC' || sendAsset === 'AVAX' ? 'Ethereum' : sendAsset === 'SOL' ? 'Solana' : sendAsset === 'XRP' ? 'XRP Ledger' : sendAsset}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Available</div>
                    <div className="text-xs font-num text-white/70">{formatNum(getBalance(sendAsset), 6)}</div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Recipient Address</label>
                  <input className="input-glass w-full text-sm" placeholder={`Enter ${sendAsset} address`}
                    value={sendAddress} onChange={e => setSendAddress(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Amount</label>
                  <div className="relative">
                    <input className="input-glass w-full text-sm font-num pr-14" placeholder="0.00"
                      value={sendAmount} onChange={e => setSendAmount(e.target.value)} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-white/40">{sendAsset}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Memo / Tag (optional)</label>
                  <input className="input-glass w-full text-sm" placeholder="Destination tag or memo"
                    value={sendMemo} onChange={e => setSendMemo(e.target.value)} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Network Fee</span>
                  <span className="font-num text-white/60">
                    {sendAsset === 'BTC' ? '0.0001' : sendAsset === 'ETH' ? '0.003' : sendAsset === 'SOL' ? '0.0005' : '0.001'} {sendAsset}
                  </span>
                </div>
                {sendError && (
                  <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    {sendError}
                  </div>
                )}
                <button onClick={() => {
                  const balance = getBalance(sendAsset);
                  const fee = sendAsset === 'BTC' ? 0.0001 : sendAsset === 'ETH' ? 0.003 : sendAsset === 'SOL' ? 0.0005 : 0.001;
                  const totalNeeded = parseFloat(sendAmount || 0) + fee;
                  if (balance <= 0) {
                    setSendError(`Insufficient balance. You have 0 ${sendAsset}.`);
                    return;
                  }
                  if (parseFloat(sendAmount || 0) > balance) {
                    setSendError(`Insufficient balance. You have ${formatNum(balance, 6)} ${sendAsset} but trying to send ${formatNum(parseFloat(sendAmount || 0), 6)} ${sendAsset}.`);
                    return;
                  }
                  if (totalNeeded > balance) {
                    setSendError(`Insufficient balance including fee. You have ${formatNum(balance, 6)} ${sendAsset} but need ${formatNum(totalNeeded, 6)} ${sendAsset} (amount + fee).`);
                    return;
                  }
                  setSendError('');
                  setSendStep('confirm');
                }}
                  className="w-full py-3 rounded-xl font-semibold text-sm neon-button"
                  style={!sendAddress || !sendAmount ? { opacity: 0.4, pointerEvents: 'none', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', border: 'none' } : {}}>
                  Continue
                </button>
              </div>
            ) : sendStep === 'confirm' ? (
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <div className="text-sm font-semibold text-white">You are sending</div>
                  <div className="flex-1 text-right">
                    <div className="text-lg font-bold font-num text-white">{sendAmount} {sendAsset}</div>
                    <div className="text-xs font-num" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      ≈ {formatCompact(parseFloat(sendAmount || 0) * getPrice(sendAsset))} USD
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.35)' }}>Available Balance</span>
                  <span className="font-num text-white/70">{formatNum(getBalance(sendAsset), 6)} {sendAsset}</span>
                </div>
                <div className="space-y-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>To</span>
                    <span className="font-mono text-white/60 text-right max-w-[240px] truncate">{sendAddress}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Network Fee</span>
                    <span className="font-num text-white/60">
                      {sendAsset === 'BTC' ? '0.0001' : sendAsset === 'ETH' ? '0.003' : sendAsset === 'SOL' ? '0.0005' : '0.001'} {sendAsset}
                    </span>
                  </div>
                  {sendMemo && (
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Memo</span>
                      <span className="text-white/60">{sendMemo}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Total</span>
                    <span className="font-num text-white font-semibold">
                      {(parseFloat(sendAmount || 0) + (sendAsset === 'BTC' ? 0.0001 : sendAsset === 'ETH' ? 0.003 : sendAsset === 'SOL' ? 0.0005 : 0.001)).toFixed(sendAsset === 'BTC' ? 4 : sendAsset === 'ETH' ? 4 : 4)} {sendAsset}
                    </span>
                  </div>
                </div>
                {sendError && (
                  <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
                    {sendError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setSendStep('details')}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                    Edit
                  </button>
                  <button onClick={handleSendConfirm}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: getBalance(sendAsset) <= 0 ? 'rgba(239,68,68,0.3)' : 'linear-gradient(135deg, #3b82f6, #6366f1)', color: getBalance(sendAsset) <= 0 ? '#ef4444' : 'white' }}>
                    {getBalance(sendAsset) <= 0 ? 'Insufficient Balance' : 'Confirm Send'}
                  </button>
                </div>
                <div className="flex items-center gap-2 justify-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  <Clock size={11} />
                  Estimated arrival: 5-30 minutes
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ===== RECEIVE MODAL ===== */}
      {receiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setReceiveOpen(false); } }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(8,18,38,0.98)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
            }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <Download size={15} className="text-green-400" />
                Receive Assets
              </h3>
              <button onClick={() => setReceiveOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5">
                <X size={16} className="text-white/40" />
              </button>
            </div>

            {/* Asset selector */}
            <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {WALLET_ASSETS.map(sym => (
                  <button key={sym} onClick={() => setReceiveAsset(sym)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      receiveAsset === sym ? '' : 'opacity-50 hover:opacity-80'
                    }`}
                    style={receiveAsset === sym ? {
                      background: 'rgba(59,130,246,0.15)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      color: '#3b82f6'
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.6)'
                    }}>
                    <TokenIcon symbol={sym} size={18} />
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 text-center space-y-5">
              {/* Real QR Code */}
              <div className="w-48 h-48 mx-auto rounded-2xl flex items-center justify-center relative p-3"
                style={{ background: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                <QRCodeSVG
                  value={WALLET_ADDRESSES[receiveAsset] || ''}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#1a1a2e"
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Asset label */}
              <div>
                <div className="text-lg font-bold text-white">{receiveAsset}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {TOKENS.find(t => t.symbol === receiveAsset)?.name} •{' '}
                  {receiveAsset === 'BTC' ? 'Bitcoin Network' :
                   receiveAsset === 'ETH' || receiveAsset === 'USDT' || receiveAsset === 'LINK' || receiveAsset === 'MATIC' || receiveAsset === 'AVAX' ? 'Ethereum Network' :
                   receiveAsset === 'SOL' ? 'Solana Network' :
                   receiveAsset === 'XRP' ? 'XRP Ledger' :
                   receiveAsset === 'BNB' ? 'BNB Smart Chain' :
                   receiveAsset === 'ADA' ? 'Cardano Network' :
                   receiveAsset === 'DOT' ? 'Polkadot Network' :
                   receiveAsset === 'DOGE' ? 'Dogecoin Network' : 'Network'}
                </div>
              </div>

              {/* Address */}
              <div className="p-3 rounded-xl relative" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Wallet Address</div>
                <div className="font-mono text-xs text-white/70 break-all leading-relaxed">
                  {WALLET_ADDRESSES[receiveAsset]}
                </div>
                <button onClick={() => {
                  navigator.clipboard?.writeText(WALLET_ADDRESSES[receiveAsset] || '');
                  setCopied(receiveAsset);
                  setTimeout(() => setCopied(false), 2000);
                }}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                  {copied === receiveAsset ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>

              <div className="flex items-center gap-2 justify-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <QrCode size={12} />
                Scan QR code or copy address above
              </div>

              <div className="p-3 rounded-xl text-xs text-left" style={{ background: 'rgba(255,165,0,0.05)', border: '1px solid rgba(255,165,0,0.15)' }}>
                <div className="font-medium text-amber-400 mb-1">Important</div>
                <div style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Send only {receiveAsset} and other {receiveAsset === 'BTC' ? 'Bitcoin' : receiveAsset === 'ETH' ? 'Ethereum' : receiveAsset === 'SOL' ? 'Solana' : receiveAsset === 'USDT' || receiveAsset === 'USDC' ? 'Ethereum' : ''} network tokens to this address. Sending other assets may result in permanent loss.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}