export const formatPrice = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '–';
  if (num >= 1000) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  if (num >= 1) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(num);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 8 }).format(num);
};

export const formatCompact = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '–';
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

export const formatNum = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '–';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(num);
};

export const formatPct = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '–';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
};

export const formatVolume = (num) => {
  if (!num) return '–';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
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
