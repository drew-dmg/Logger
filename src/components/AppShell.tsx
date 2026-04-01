import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { TodayPage } from '../pages/TodayPage';
import { HistoryPage } from '../pages/HistoryPage';
import { MigrainePage } from '../pages/MigrainePage';
import { ActivityPage } from '../pages/ActivityPage';
import { TrendsPage } from '../pages/TrendsPage';
import { SettingsPage } from '../pages/SettingsPage';

const navItems = [
  { to: '/today', label: 'Today' },
  { to: '/history', label: 'History' },
  { to: '/migraine', label: 'Migraine' },
  { to: '/activity', label: 'Activity' },
  { to: '/trends', label: 'Trends' },
  { to: '/settings', label: 'Settings' }
];

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-base text-text">
      <aside className="w-60 border-r border-edge bg-panel/80 px-4 py-8">
        <div className="mb-8 px-2">
          <p className="text-xs uppercase tracking-[0.24em] text-muted">Logger</p>
          <h1 className="mt-2 text-xl font-semibold">Health Journal</h1>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'block rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted hover:bg-edge/80 hover:text-text'
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 md:p-10">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/migraine" element={<MigrainePage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
