import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Seed default user with guaranteed correct password
    const allUsers = localStorage.getItem('nexotc_users');
    let users = allUsers ? JSON.parse(allUsers) : [];
    const defaultUser = { name: 'Neil Fackler', email: 'neilfackler8@gmail.com', password: 'Neilfackler8!@', createdAt: '2026-06-17T00:00:00.000Z' };
    const existing = users.findIndex(u => u.email === defaultUser.email);
    if (existing === -1) {
      users.push(defaultUser);
    } else {
      // Overwrite password and name to ensure credentials are always correct
      users[existing] = { ...users[existing], password: defaultUser.password, name: defaultUser.name };
    }
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
          setUser(parsed);
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
    const userData = { email: found.email, name: found.name, createdAt: found.createdAt };
    setUser(userData);
    localStorage.setItem('nexotc_user', JSON.stringify(userData));
    return { ok: true };
  };

  const signup = (name, email, password) => {
    const stored = localStorage.getItem('nexotc_users');
    const users = stored ? JSON.parse(stored) : [];
    if (users.find(u => u.email === email)) return { ok: false, error: 'Email already registered' };
    const newUser = { name, email, password, createdAt: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('nexotc_users', JSON.stringify(users));
    const userData = { email: newUser.email, name: newUser.name, createdAt: newUser.createdAt };
    setUser(userData);
    localStorage.setItem('nexotc_user', JSON.stringify(userData));
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nexotc_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};