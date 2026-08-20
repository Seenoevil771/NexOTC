import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const TEST_MODE_KEY = 'nexotc_test_mode';

const isTestModeEnabled = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const queryValue = params.get('testMode') ?? params.get('runTest');
  const localValue = localStorage.getItem(TEST_MODE_KEY);
  return ['1', 'true', 'yes', 'on'].includes(String(queryValue ?? '').toLowerCase()) ||
    ['1', 'true', 'yes', 'on'].includes(String(localValue ?? '').toLowerCase());
};

const getDefaultBalances = () => {
  const testMode = isTestModeEnabled();
  return {
    otcBalance: 0,
    bankBalance: testMode ? 18885000 : 18885000,
    portfolioBalance: 0,
  };
};

const normalizeUserData = (userData = {}) => {
  const defaultBalances = getDefaultBalances();
  const normalized = {
    email: userData.email || '',
    name: userData.name || '',
    createdAt: userData.createdAt || new Date().toISOString(),
    otcBalance: Number(userData.otcBalance ?? defaultBalances.otcBalance),
    bankBalance: Number(userData.bankBalance ?? defaultBalances.bankBalance),
    portfolioBalance: Number(userData.portfolioBalance ?? defaultBalances.portfolioBalance),
    migrationHistory: Array.isArray(userData.migrationHistory) ? userData.migrationHistory : [],
    holdings: Array.isArray(userData.holdings) ? userData.holdings.map(h => ({
      symbol: h.symbol,
      amount: Number(h.amount ?? 0),
      avgBuy: Number(h.avgBuy ?? 0),
    })).filter(h => h.symbol) : [],
  };

  if (normalized.email === 'neilfackler8@gmail.com' && !isTestModeEnabled()) {
    const hasRealActivity = normalized.otcBalance > 0 || normalized.portfolioBalance > 0 || normalized.holdings.length > 0 || normalized.migrationHistory.length > 0;
    if (!hasRealActivity) {
      normalized.otcBalance = 0;
      normalized.bankBalance = 18885000;
      normalized.portfolioBalance = 0;
      normalized.holdings = [];
      normalized.migrationHistory = [];
    }
  }

  return normalized;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Seed default user with guaranteed correct password
    const allUsers = localStorage.getItem('nexotc_users');
    let users = allUsers ? JSON.parse(allUsers) : [];
    const defaultUser = { name: 'Neil Fackler', email: 'neilfackler8@gmail.com', password: 'Neilfackler8!@', createdAt: '2026-06-17T00:00:00.000Z', otcBalance: 0, bankBalance: 18885000, portfolioBalance: 0, migrationHistory: [], holdings: [] };
    const existing = users.findIndex(u => u.email === defaultUser.email);
    if (existing === -1) {
      users.push(defaultUser);
    } else {
      // Ensure the seeded login user is reset and saved with zero OTC/portfolio balances.
      users[existing] = {
        ...users[existing],
        password: defaultUser.password,
        name: defaultUser.name,
        otcBalance: 0,
        bankBalance: 18885000,
        portfolioBalance: 0,
        migrationHistory: [],
        holdings: [],
      };
    }
    localStorage.setItem('nexotc_users', JSON.stringify(users));
    // Remove unwanted accounts
    users = users.filter(u => u.email !== '1234@gmail.com');
    localStorage.setItem('nexotc_users', JSON.stringify(users));

    const stored = localStorage.getItem('nexotc_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.email === '1234@gmail.com') {
          localStorage.removeItem('nexotc_user');
        } else {
          // Ensure we merge any persisted user fields from the users list
          const match = users.find(u => u.email === parsed.email);
          if (match) {
            setUser(normalizeUserData(match));
          } else {
            setUser(normalizeUserData(parsed));
          }
        }
      } catch { localStorage.removeItem('nexotc_user'); }
    }
    setLoading(false);
  }, []);

  // Sync auth across tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'nexotc_user') {
        if (e.newValue) {
          try { setUser(JSON.parse(e.newValue)); } catch { setUser(null); }
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const login = (email, password) => {
    const stored = localStorage.getItem('nexotc_users');
    const users = stored ? JSON.parse(stored) : [];
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return { ok: false, error: 'Invalid email or password' };
    const userData = normalizeUserData(found);
    setUser(userData);
    localStorage.setItem('nexotc_user', JSON.stringify(userData));
    return { ok: true };
  };

  const signup = (name, email, password) => {
    const stored = localStorage.getItem('nexotc_users');
    const users = stored ? JSON.parse(stored) : [];
    if (users.find(u => u.email === email)) return { ok: false, error: 'Email already registered' };
    const defaultBalances = getDefaultBalances();
    const newUser = { name, email, password, createdAt: new Date().toISOString(), otcBalance: defaultBalances.otcBalance, bankBalance: defaultBalances.bankBalance, portfolioBalance: defaultBalances.portfolioBalance, migrationHistory: [], holdings: [] };
    users.push(newUser);
    localStorage.setItem('nexotc_users', JSON.stringify(users));
    const userData = normalizeUserData(newUser);
    setUser(userData);
    localStorage.setItem('nexotc_user', JSON.stringify(userData));
    return { ok: true };
  };

  const enableTestMode = () => {
    localStorage.setItem(TEST_MODE_KEY, 'true');
    window.location.reload();
  };

  const disableTestMode = () => {
    localStorage.removeItem(TEST_MODE_KEY);
    window.location.reload();
  };

  if (typeof window !== 'undefined') {
    window.__nexotcTest = {
      isEnabled: isTestModeEnabled,
      enable: enableTestMode,
      disable: disableTestMode,
    };
  }

  const updateUserData = (updates = {}) => {
    if (!user || !user.email) return;
    const stored = localStorage.getItem('nexotc_users');
    const users = stored ? JSON.parse(stored) : [];
    const idx = users.findIndex(u => u.email === user.email);
    const merged = normalizeUserData({ ...user, ...updates });
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...merged };
      localStorage.setItem('nexotc_users', JSON.stringify(users));
    }
    setUser(merged);
    localStorage.setItem('nexotc_user', JSON.stringify(merged));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nexotc_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};