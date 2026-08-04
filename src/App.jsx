import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import OTCTrade from './pages/OTCTrade';
import MigrationOTC from './pages/MigrationOTC';
import Portfolio from './pages/Portfolio';
import OrderBook from './pages/OrderBook';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public: landing/auth page */}
      <Route path="/" element={<GuestRoute><AuthPage /></GuestRoute>} />

      {/* Protected: all app routes */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/market" element={<Market />} />
        <Route path="/otc" element={<OTCTrade />} />
        <Route path="/migration-assets" element={<MigrationOTC />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/orderbook" element={<OrderBook />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(6,14,30,0.97)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '0.75rem',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#030712' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#030712' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}