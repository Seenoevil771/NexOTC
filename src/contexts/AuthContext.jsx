import { createContext, useContext, useState, useEffect } from 'react';
import {
  TEST_MODE_KEY,
  normalizeUserData,
  isTestModeEnabled,
  getDefaultBalances,
  preserveExistingUserSeed,
} from '../utils/authState';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allUsers = localStorage.getItem('nexotc_users');
    let users = allUsers ? JSON.parse(allUsers) : [];
    users = preserveExistingUserSeed(users);
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
    const newUser = { name, email, password, createdAt: new Date().toISOString(), otcBalance: defaultBalances.otcBalance, bankBalance: defaultBalances.bankBalance, portfolioBalance: defaultBalances.portfolioBalance, migrationHistory: [], holdings: [], sendHistory: [] };
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
    const activeUser = user || JSON.parse(localStorage.getItem('nexotc_user') || 'null');
    if (!activeUser || !activeUser.email) return;

    const stored = localStorage.getItem('nexotc_users');
    const users = stored ? JSON.parse(stored) : [];
    const idx = users.findIndex(u => u.email === activeUser.email);
    const merged = normalizeUserData({ ...activeUser, ...updates });

    if (idx !== -1) {
      users[idx] = { ...users[idx], ...merged };
      localStorage.setItem('nexotc_users', JSON.stringify(users));
    } else {
      users.push({ ...merged, password: activeUser.password || '' });
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