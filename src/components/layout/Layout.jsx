import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Ticker from './Ticker';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div className="min-h-screen bg-mesh" style={{ background: '#030712' }}>
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute w-96 h-96 rounded-full opacity-5 blur-3xl"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', top: '-10%', left: '20%' }} />
        <div className="absolute w-80 h-80 rounded-full opacity-4 blur-3xl"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', top: '40%', right: '10%' }} />
        <div className="absolute w-64 h-64 rounded-full opacity-3 blur-3xl"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent)', bottom: '10%', left: '40%' }} />
      </div>

      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Topbar sidebarWidth={sidebarWidth} />
      <Ticker sidebarWidth={sidebarWidth} />

      <main
        className="relative"
        style={{
          marginLeft: sidebarWidth,
          paddingTop: '100px',
          minHeight: '100vh',
          transition: 'margin-left 0.3s',
          zIndex: 1,
        }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
