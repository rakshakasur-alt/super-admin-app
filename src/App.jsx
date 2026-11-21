import { useEffect, useState } from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Overview from './pages/Overview';
import HotelsList from './pages/HotelsList';
import HotelDetail from './pages/HotelDetail';
import ErrorBoundary from './components/ErrorBoundary';
import ThemeToggle from './components/ThemeToggle';
import ReportsQueue from './pages/ReportsQueue';
import NotificationComposer from './pages/NotificationComposer';
import { getSuperAdminSession, signOutSuperAdmin, supabase } from './lib/supabaseClient';

const navLinkStyle = ({ isActive }) => ({
  textDecoration: 'none',
  padding: '6px 14px',
  borderRadius: 'var(--radius-sm)',
  transition: 'color var(--transition), background var(--transition)',
  color: isActive ? 'var(--primary-fg, #ffffff)' : 'var(--text-muted)',
  background: isActive ? 'var(--primary)' : 'transparent',
  fontWeight: isActive ? 600 : 500,
  fontSize: '13px'
});

function SuperAdminLayout({ session, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-subtle)', color: 'var(--text)' }}>
      {/* Top Navbar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 32px',
          background: 'var(--nav-bg, var(--bg))',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--nav-border, var(--border))',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          color: 'var(--text)',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius)',
                background: 'var(--primary)',
                color: 'var(--primary-fg)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: '15px',
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Platform Super Admin
              </div>
              <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Internal Console
              </div>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <NavLink to="/" end style={navLinkStyle}>
              Overview
            </NavLink>
            <NavLink to="/hotels" style={navLinkStyle}>
              Hotels
            </NavLink>
            <NavLink to="/reports" style={navLinkStyle}>
              Reports
            </NavLink>
            <NavLink to="/notifications" style={navLinkStyle}>
              Notifications
            </NavLink>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ThemeToggle />
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Logged in as: <strong style={{ color: 'var(--text)' }}>{session?.user?.email}</strong>
          </div>
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'var(--danger-subtle)',
              border: '1px solid var(--danger-border, #fecaca)',
              color: 'var(--danger-fg)',
              padding: '6px 12px',
              borderRadius: 'var(--radius)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/hotels" element={<HotelsList />} />
          <Route path="/hotels/:hotelId" element={<HotelDetail />} />
          <Route path="/reports" element={<ReportsQueue />} />
          <Route path="/notifications" element={<NotificationComposer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedRoot() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    getSuperAdminSession()
      .then((currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[ProtectedRoot] Auth check error:', err);
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      })
      .finally(() => {
        clearTimeout(timer);
      });

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  async function handleLogout() {
    await signOutSuperAdmin();
    navigate('/login', { replace: true });
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#64748b', display: 'grid', placeItems: 'center' }}>
        Verifying administrator authorization…
      </div>
    );
  }

  return session ? (
    <SuperAdminLayout session={session} onLogout={handleLogout} />
  ) : (
    <Navigate to="/login" replace />
  );
}

function AuthRecoveryRedirector() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. If URL has recovery tokens in hash or search, immediately redirect to /reset-password
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const params = new URLSearchParams(search);
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));

    const type = params.get('type') || hashParams.get('type');
    const isRecovery =
      type === 'recovery' ||
      hash.includes('type=recovery') ||
      search.includes('type=recovery');

    if (isRecovery && window.location.pathname !== '/reset-password') {
      navigate('/reset-password' + search + hash, { replace: true });
    }

    if (!supabase) return;

    // 2. Listen to Supabase auth events for PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (window.location.pathname !== '/reset-password') {
          navigate('/reset-password' + window.location.search + window.location.hash, { replace: true });
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthRecoveryRedirector />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/*" element={<ProtectedRoot />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
