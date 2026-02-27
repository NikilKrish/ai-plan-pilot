import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { pipelineHealth } from '@/data/pipelineData';

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/planner', label: 'Planner' },
  { to: '/bottlenecks', label: 'Bottlenecks' },
  { to: '/simulations', label: 'Simulations' },
  { to: '/reports', label: 'Ops & Feedback' },
];

const AppLayout = () => {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const minutesAgo = Math.round((Date.now() - new Date(pipelineHealth.streaming.lastEventTs).getTime()) / 60_000);
  const streamColor = pipelineHealth.streaming.status === 'Healthy' ? 'bg-accent-green' : pipelineHealth.streaming.status === 'Degraded' ? 'bg-accent-orange' : 'bg-accent-red';
  const batchColor = pipelineHealth.batch.status === 'Healthy' ? 'bg-accent-green' : pipelineHealth.batch.status === 'Degraded' ? 'bg-accent-orange' : 'bg-accent-red';

  return (
    <div className="min-h-screen mesh-gradient-bg">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-foreground tracking-tight">Production Planning AI Copilot</h1>
            <span className="hidden sm:block text-[10px] text-muted-foreground">Capacity • Validation • Bottlenecks • What-If</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Status pills */}
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              Synthetic Demo
            </span>

            {/* Pipeline Health pills */}
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full ${streamColor}`} />
              Stream
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full ${batchColor}`} />
              Batch
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
              {minutesAgo}m ago
            </span>

            {/* Nav */}
            <nav className="flex bg-muted rounded-lg p-0.5 gap-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-card shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDark((d) => !d)}
              className="w-8 h-8 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle dark mode"
            >
              {dark ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
