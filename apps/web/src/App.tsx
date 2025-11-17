import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { Heart, Compass, MessageCircle } from 'lucide-react';
import { PlannerPage } from './pages/PlannerPage';
import { ExplorePage } from './pages/ExplorePage';
import { VoicePage } from './pages/VoicePage';
import './styles/shell.css';

type NavItem = {
  key: string;
  label: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
};

const navItems: NavItem[] = [
  {
    key: 'planner',
    label: 'Planner',
    description: 'Guided reset flows',
    path: '/planner',
    icon: Heart
  },
  {
    key: 'explore',
    label: 'Explore',
    description: 'Live map & routes',
    path: '/explore',
    icon: Compass
  },
  {
    key: 'voice',
    label: 'Voice',
    description: 'AI session history',
    path: '/voice',
    icon: MessageCircle
  }
];

function ShellLayout() {
  return (
    <div className="app-shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <h1>Take a Break</h1>
          <p>Cross-platform pause companion</p>
        </div>
        <nav className="shell-nav">
          {navItems.map((item) => (
            <NavLink key={item.key} to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
              <item.icon size={20} />
              <div className="nav-meta">
                <span>{item.label}</span>
                <span>{item.description}</span>
              </div>
            </NavLink>
          ))}
        </nav>
        <div className="shell-sidebar-footer">
          Planner, Explore, and Voice reuse the same mock generators, Google Maps integration, and voice
          transcripts that power the mobile app. This preview keeps parity while showcasing the desktop shell.
        </div>
      </aside>
      <div className="shell-content">
        <div className="shell-topbar">
          <div>
            <h2>Web Preview Build</h2>
            <p>Feature parity with the Expo app: shared break plans, map routing, and voice history.</p>
          </div>
          <div className="topbar-pill">Shared engine live</div>
        </div>
        <main className="shell-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ShellLayout />}>
          <Route index element={<Navigate to="/planner" replace />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/voice" element={<VoicePage />} />
          <Route path="*" element={<Navigate to="/planner" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
