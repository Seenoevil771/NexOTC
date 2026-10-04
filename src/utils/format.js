export const formatPrice = (num, decimals = 2) => {
  const value = Number(num);
  if (num === null || num === undefined || !Number.isFinite(value)) return '–';
  if (value >= 1000) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  if (value >= 1) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 8 }).format(value);
};

export const formatCompact = (num) => {
  const value = Number(num);
  if (num === null || num === undefined || !Number.isFinite(value)) return '–';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

export const formatNum = (num, decimals = 2) => {
  const value = Number(num);
  if (num === null || num === undefined || !Number.isFinite(value)) return '–';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
};

export const formatPct = (num) => {
  const value = Number(num);
  if (num === null || num === undefined || !Number.isFinite(value)) return '–';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatVolume = (num) => {
  const value = Number(num);
  if (!Number.isFinite(value)) return '–';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
};

export const formatTime = (ts) => {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const formatDate = (ts) => {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const truncate = (str, length = 8) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
};

export const colorForChange = (pct) => {
  if (pct > 0) return '#22c55e';
  if (pct < 0) return '#ef4444';
  return '#94a3b8';
};
