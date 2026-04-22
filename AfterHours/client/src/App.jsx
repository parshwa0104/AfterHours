/*
=============================================================================
* EDUCATIONAL WALKTHROUGH: App.jsx — The Orchestrator (Updated)
=============================================================================
*
* NEW IN THIS VERSION: React Router + Bottom Navigation
*
* REACT ROUTER — How navigation works in SPAs:
* In a traditional website, clicking a link goes to a new HTML file.
* React apps are Single Page Applications (SPAs) — there is only ONE
* HTML file. React Router simulates navigation by:
*   1. Watching the browser URL (e.g., /dashboard, /sanctuary)
*   2. Rendering a different React component for each URL
*   3. Changing the URL without a full page reload (no flash!)
*
* KEY ROUTER COMPONENTS WE USE:
*   <BrowserRouter>   — wraps the whole app, enables URL tracking
*   <Routes>          — a container that says "only render ONE of these"
*   <Route>           — maps a URL path to a React component
*   <Link>            — renders an <a> tag that does client-side navigation
*   useLocation()     — a hook that tells you the current URL path
*
* BOTTOM NAVIGATION PATTERN:
* Mobile apps use bottom nav because thumbs can't reach the top.
* We replicate this: fixed bar at the bottom, highlight the active tab
* by comparing the current URL to each tab's path.
*
=============================================================================
*/

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import TextureOverlay from './components/TextureOverlay';
import AirLock from './components/AirLock';
import AudioEngine from './components/AudioEngine';
import AuthPanel from './components/AuthPanel';
import Dashboard from './pages/Dashboard';
import SanctuaryPage from './pages/SanctuaryPage';
import ZonePage from './pages/ZonePage';
import GardenPage from './pages/GardenPage';
import LoginPage from './pages/LoginPage';
import useHeadphones from './hooks/useHeadphones';
import { getMe, getStoredToken } from './lib/authClient';
import './index.css';

// ─── Bottom Navigation Tab Config ────────────────────────────────────────────
const NAV_TABS = [
  { path: '/app',            label: 'Home',      icon: '🏡' },
  { path: '/app/sanctuary',  label: 'Sanctuary', icon: '🤝' },
  { path: '/app/zone',       label: 'Zone',      icon: '🎧' },
  { path: '/app/garden',     label: 'Garden',    icon: '🌱' },
];

// ─── Bottom Nav Bar Component ─────────────────────────────────────────────────
// Separated into its own component so it can use `useLocation()`,
// which requires being INSIDE the BrowserRouter (see below).
const BottomNav = () => {
  const location = useLocation(); // gives us the current URL path

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 12px',
      zIndex: 100,
      transition: 'background-color 0.8s ease',
    }}>
      {NAV_TABS.map(tab => {
        // A tab is "active" if the current URL matches its path
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              textDecoration: 'none',
              padding: '4px 16px',
              borderRadius: '10px',
              // Highlight the active tab with accent color
              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              transition: 'color 0.2s ease',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>{tab.icon}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: isActive ? '700' : '400' }}>
              {tab.label}
            </span>
            {/* Active indicator dot */}
            {isActive && (
              <div style={{
                width: '4px', height: '4px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
              }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

const RequireAuth = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const ProtectedZoneRoute = () => {
  const { zoneActive, setZoneActive } = useOutletContext();
  return <ZonePage zoneActive={zoneActive} setZoneActive={setZoneActive} />;
};

// ─── Main App Shell ───────────────────────────────────────────────────────────
function AppShell({ user, setUser }) {
  const [theme, setTheme] = useState('analog');
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [zoneActive, setZoneActive] = useState(false);

  // Stamp the theme on the <html> element so ALL CSS variables respond
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const { justConnected, setJustConnected } = useHeadphones();
  const showAirLock = justConnected;

  const handleEnterZone = () => {
    setZoneActive(true);
    setJustConnected(false);
    setTheme('twilight');
  };

  const handleDismiss = () => {
    setJustConnected(false);
  };

  const toggleTheme = () => setTheme(p => p === 'analog' ? 'twilight' : 'analog');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      transition: 'background-color 0.8s ease',
    }}>
      <TextureOverlay />
      <AudioEngine isActive={zoneActive} onAudioStateChange={setAudioIsPlaying} />

      {showAirLock && (
        <AirLock onEnter={handleEnterZone} onDismiss={handleDismiss} isPlaying={audioIsPlaying} />
      )}

      {/* ── Top header bar ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'background-color 0.8s ease',
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', lineHeight: 1 }}>AfterHours</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {zoneActive ? '🌙 In the zone' : 'Your 5-to-9 sanctuary'}
          </p>
        </div>
        <div style={{ display: 'grid', gap: '8px', justifyItems: 'end' }}>
          <AuthPanel
            user={user}
            onAuthSuccess={(nextUser) => setUser(nextUser)}
            onLogout={() => setUser(null)}
          />
          <button
            onClick={toggleTheme}
            style={{
              padding: '7px 14px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              border: '1px solid var(--border-color)',
            }}
          >
            {theme === 'analog' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* ── Page content — scrollable, above the bottom nav ── */}
      <main style={{ padding: '24px 24px 100px', maxWidth: '640px', margin: '0 auto' }}>
        <Outlet context={{ user, zoneActive, setZoneActive }} />
      </main>

      <BottomNav />
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────
// BrowserRouter MUST wrap everything that uses React Router hooks.
// We keep it here at the outermost level so even the BottomNav
// (which uses useLocation) has access to the router context.
function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(() => Boolean(getStoredToken()));

  useEffect(() => {
    if (!getStoredToken()) return;

    let mounted = true;
    getMe()
      .then((payload) => {
        if (mounted) setUser(payload.user);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setCheckingAuth(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
        Checking session…
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage user={user} onAuthSuccess={(nextUser) => setUser(nextUser)} />}
        />

        <Route
          path="/app"
          element={(
            <RequireAuth user={user}>
              <AppShell user={user} setUser={setUser} />
            </RequireAuth>
          )}
        >
          <Route index element={<Dashboard user={user} />} />
          <Route path="sanctuary" element={<SanctuaryPage />} />
          <Route path="zone" element={<ProtectedZoneRoute />} />
          <Route path="garden" element={<GardenPage />} />
        </Route>

        <Route path="*" element={<Navigate to={user ? '/app' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
