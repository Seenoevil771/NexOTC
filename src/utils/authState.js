export const TEST_MODE_KEY = 'nexotc_test_mode';
export const DEFAULT_USER_EMAIL = 'neilfackler8@gmail.com';
export const DEFAULT_USER_PASSWORD = 'Neilfackler8!@';

export const isTestModeEnabled = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search || '');
  const queryValue = params.get('testMode') ?? params.get('runTest');
  const localValue = localStorage.getItem(TEST_MODE_KEY);
  return ['1', 'true', 'yes', 'on'].includes(String(queryValue ?? '').toLowerCase()) ||
    ['1', 'true', 'yes', 'on'].includes(String(localValue ?? '').toLowerCase());
};

export const getDefaultBalances = () => {
  const testMode = isTestModeEnabled();
  return {
    otcBalance: 0,
    bankBalance: testMode ? 18885000 : 18885000,
    portfolioBalance: 0,
  };
};

export const buildDefaultUserSeed = () => ({
  name: 'Neil Fackler',
  email: DEFAULT_USER_EMAIL,
  password: DEFAULT_USER_PASSWORD,
  createdAt: '2026-06-17T00:00:00.000Z',
  otcBalance: 0,
  bankBalance: 18885000,
  portfolioBalance: 0,
  migrationHistory: [],
  holdings: [],
  sendHistory: [],
});

export const preserveExistingUserSeed = (users = []) => {
  const defaultUser = buildDefaultUserSeed();
  const idx = users.findIndex(u => u.email === defaultUser.email);

  if (idx === -1) {
    users.push(defaultUser);
    return users;
  }

  const existing = users[idx] ?? {};
  users[idx] = {
    ...defaultUser,
    ...existing,
    email: defaultUser.email,
    password: existing.password || defaultUser.password,
    name: existing.name || defaultUser.name,
    createdAt: existing.createdAt || defaultUser.createdAt,
    otcBalance: Number(existing.otcBalance ?? defaultUser.otcBalance),
    bankBalance: Number(existing.bankBalance ?? defaultUser.bankBalance),
    portfolioBalance: Number(existing.portfolioBalance ?? defaultUser.portfolioBalance),
    migrationHistory: Array.isArray(existing.migrationHistory) ? existing.migrationHistory : [],
    holdings: Array.isArray(existing.holdings) ? existing.holdings : [],
    sendHistory: Array.isArray(existing.sendHistory) ? existing.sendHistory : [],
  };

  return users;
};

export const normalizeUserData = (userData = {}) => {
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
    withdrawalLimitUsed: Boolean(userData.withdrawalLimitUsed),
    sendHistory: Array.isArray(userData.sendHistory) ? userData.sendHistory.map(tx => ({
      id: tx.id || `tx_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      asset: tx.asset || 'BTC',
      amount: Number(tx.amount ?? 0),
      usdValue: Number(tx.usdValue ?? 0),
      recipient: tx.recipient || '',
      memo: tx.memo || '',
      status: tx.status || 'Completed',
      createdAt: tx.createdAt || new Date().toISOString(),
    })) : [],
  };

  return normalized;
};
