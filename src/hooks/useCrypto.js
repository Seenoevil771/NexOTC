import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMarkets, fetchGlobalData, fetchFearGreed, fetchBinanceTicker24h, fetchBinanceOrderBook, fetchBinanceRecentTrades, fetchBinanceKlines, fetchCoinChart, fetchCoinDetail } from '../api/cryptoApi';

export const useMarkets = (perPage = 30) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchMarkets('', 1, perPage);
      setData(result);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [perPage]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  return { data, loading, error, refetch: load };
};

export const useGlobalData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [global, fg] = await Promise.all([fetchGlobalData(), fetchFearGreed()]);
        setData({ ...global, fearGreed: fg });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading };
};

export const useOrderBook = (symbol = 'BTCUSDT') => {
  const [data, setData] = useState({ bids: [], asks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const result = await fetchBinanceOrderBook(symbol, 15);
      setData(result);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [symbol]);

  return { data, loading };
};

export const useRecentTrades = (symbol = 'BTCUSDT') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const result = await fetchBinanceRecentTrades(symbol, 25);
      setData(result);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [symbol]);

  return { data, loading };
};

export const useKlines = (symbol = 'BTCUSDT', interval = '1h') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const result = await fetchBinanceKlines(symbol, interval, 168);
      setData(result);
      setLoading(false);
    };
    load();
  }, [symbol, interval]);

  return { data, loading };
};

export const useCoinChart = (id, days = 7) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchCoinChart(id, days);
        setData(result);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, days]);

  return { data, loading };
};

// Binance WebSocket for real-time price - batched for performance
export const useBinanceStream = (streams = ['btcusdt@ticker']) => {
  const [prices, setPrices] = useState({});
  const wsRef = useRef(null);
  const bufferRef = useRef({});
  const timerRef = useRef(null);

  useEffect(() => {
    const streamStr = streams.join('/');
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streamStr}`;

    // Flush buffer to state every 250ms (batched)
    const flush = () => {
      if (Object.keys(bufferRef.current).length > 0) {
        setPrices(prev => ({ ...prev, ...bufferRef.current }));
        bufferRef.current = {};
      }
    };

    const connect = () => {
      try {
        wsRef.current = new WebSocket(wsUrl);
        wsRef.current.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.data) {
              const d = msg.data;
              bufferRef.current[d.s] = {
                price: parseFloat(d.c || d.p),
                change24h: parseFloat(d.P || 0),
                high: parseFloat(d.h || 0),
                low: parseFloat(d.l || 0),
                volume: parseFloat(d.v || 0),
                quoteVolume: parseFloat(d.q || 0),
              };
            }
          } catch {}
        };
        wsRef.current.onerror = () => {};
        wsRef.current.onclose = () => {
          setTimeout(connect, 5000);
        };
      } catch {
        // ignore WS errors
      }
    };

    connect();
    timerRef.current = setInterval(flush, 250);
    return () => {
      clearInterval(timerRef.current);
      if (wsRef.current) wsRef.current.close();
      bufferRef.current = {};
    };
  }, [streams.join(',')]);

  return prices;
};

export const useCoinDetail = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const result = await fetchCoinDetail(id);
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  return { data, loading };
};
