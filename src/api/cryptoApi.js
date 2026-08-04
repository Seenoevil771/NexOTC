import axios from 'axios';

// CoinGecko Free API
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Binance Public API
const BINANCE_BASE = 'https://api.binance.com/api/v3';

const cgClient = axios.create({
  baseURL: COINGECKO_BASE,
  timeout: 10000,
  headers: { 'Accept': 'application/json' },
});

const bnClient = axios.create({
  baseURL: BINANCE_BASE,
  timeout: 10000,
});

// ── CoinGecko ────────────────────────────────────────────────
export const fetchMarkets = async (ids = '', page = 1, perPage = 30) => {
  const { data } = await cgClient.get('/coins/markets', {
    params: {
      vs_currency: 'usd',
      ids: ids || undefined,
      order: 'market_cap_desc',
      per_page: perPage,
      page,
      sparkline: true,
      price_change_percentage: '1h,24h,7d',
    },
  });
  return data;
};

export const fetchCoinDetail = async (id) => {
  const { data } = await cgClient.get(`/coins/${id}`, {
    params: {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: true,
    },
  });
  return data;
};

export const fetchCoinChart = async (id, days = 7, currency = 'usd') => {
  const { data } = await cgClient.get(`/coins/${id}/market_chart`, {
    params: { vs_currency: currency, days, interval: days <= 1 ? 'hourly' : 'daily' },
  });
  return data;
};

export const fetchGlobalData = async () => {
  const { data } = await cgClient.get('/global');
  return data.data;
};

export const fetchTrending = async () => {
  const { data } = await cgClient.get('/search/trending');
  return data;
};

export const fetchSimplePrice = async (ids, currencies = 'usd') => {
  const { data } = await cgClient.get('/simple/price', {
    params: {
      ids: Array.isArray(ids) ? ids.join(',') : ids,
      vs_currencies: currencies,
      include_24hr_change: true,
      include_market_cap: true,
      include_24hr_vol: true,
    },
  });
  return data;
};

// ── Binance ──────────────────────────────────────────────────
export const fetchBinanceTicker24h = async (symbols = []) => {
  try {
    if (symbols.length === 0) {
      const { data } = await bnClient.get('/ticker/24hr');
      return data.filter(t => t.symbol.endsWith('USDT'));
    }
    const { data } = await bnClient.get('/ticker/24hr', {
      params: { symbols: JSON.stringify(symbols.map(s => `${s}USDT`)) },
    });
    return data;
  } catch {
    return [];
  }
};

export const fetchBinanceOrderBook = async (symbol = 'BTCUSDT', limit = 20) => {
  try {
    const { data } = await bnClient.get('/depth', { params: { symbol, limit } });
    return data;
  } catch {
    return { bids: [], asks: [] };
  }
};

export const fetchBinanceRecentTrades = async (symbol = 'BTCUSDT', limit = 30) => {
  try {
    const { data } = await bnClient.get('/trades', { params: { symbol, limit } });
    return data;
  } catch {
    return [];
  }
};

export const fetchBinanceKlines = async (symbol = 'BTCUSDT', interval = '1h', limit = 168) => {
  try {
    const { data } = await bnClient.get('/klines', { params: { symbol, interval, limit } });
    return data.map(k => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));
  } catch {
    return [];
  }
};

export const fetchBinanceExchangeInfo = async () => {
  try {
    const { data } = await bnClient.get('/exchangeInfo');
    return data;
  } catch {
    return null;
  }
};

// ── Fear & Greed (alternative.me) ───────────────────────────
export const fetchFearGreed = async () => {
  try {
    const { data } = await axios.get('https://api.alternative.me/fng/?limit=1');
    return data.data[0];
  } catch {
    return null;
  }
};

// ── Mock OTC Quote Generator ─────────────────────────────────
export const generateOTCQuote = (basePrice, amount, side = 'buy') => {
  const spread = 0.0015; // 0.15% spread
  const premiumFee = 0.001; // 0.10% OTC fee
  const slippage = Math.min(amount / 10_000_000, 0.005); // size-based slippage
  const adjustment = side === 'buy' ? 1 + spread + premiumFee + slippage : 1 - spread - premiumFee - slippage;
  const quotePrice = basePrice * adjustment;
  const total = quotePrice * amount;
  const fee = total * premiumFee;
  return {
    basePrice,
    quotePrice,
    amount,
    total,
    fee,
    spread: spread * 100,
    validFor: 30, // seconds
    expiresAt: Date.now() + 30_000,
    side,
  };
};
