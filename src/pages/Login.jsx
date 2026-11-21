import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSuperAdminSession, requestPasswordReset, signInSuperAdmin } from '../lib/supabaseClient';
import PasswordField from '../components/PasswordField';
import useDocumentTitle from '../lib/useDocumentTitle';

export default function Login() {
  useDocumentTitle('Platform Super Admin Login');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    let mounted = true;
    getSuperAdminSession()
      .then((session) => {
        if (mounted && session) navigate('/hotels', { replace: true });
      })
      .catch(() => {});

    try {
      const saved = localStorage.getItem('remembered_super_admin_email');
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch (_) {}

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (rememberMe) {
      try { localStorage.setItem('remembered_super_admin_email', email.trim()); } catch (_) {}
    } else {
      try { localStorage.removeItem('remembered_super_admin_email'); } catch (_) {}
    }

    const { error } = await signInSuperAdmin(email.trim(), password);
    setLoading(false);

    if (error) {
      setErrorMessage(error.message || 'Unable to sign in as platform admin.');
      return;
    }

    navigate('/hotels', { replace: true });
  }

  async function handleResetSubmit(event) {
    event.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    const { error } = await requestPasswordReset(resetEmail.trim());
    setResetLoading(false);

    if (error && (error.message?.includes('configured') || error.message?.includes('network'))) {
      setResetError(error.message);
      return;
    }

    setResetMessage('Check your email for a recovery link. If a super admin account is registered with that address, instructions have been sent.');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-subtle)',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-card, var(--bg-subtle))',
          borderRadius: 'var(--radius-lg, 20px)',
          border: '1px solid var(--border)',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-md, 0 24px 64px rgba(0, 0, 0, 0.5))',
        }}
      >
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg, 12px)',
              background: 'var(--primary)',
              color: 'var(--primary-fg)',
              fontSize: '22px',
              marginBottom: '14px',
              boxShadow: 'var(--shadow-sm, 0 8px 24px rgba(99, 102, 241, 0.3))',
            }}
          >
            ⚡
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 800, color: 'var(--text)' }}>
            {showForgot ? 'Reset Admin Password' : 'Platform Super Admin'}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>
            {showForgot
              ? 'Enter your platform administrator email and we will send you a recovery link'
              : 'Internal management for hotel approvals and platform governance'}
          </p>
        </div>

        {showForgot ? (
          <div>
            {resetMessage && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  padding: '14px',
                  color: '#6ee7b7',
                  fontSize: '13px',
                  marginBottom: '20px',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>✓ Recovery link dispatched!</div>
                <div style={{ marginBottom: '12px' }}>{resetMessage}</div>
                <Link
                  to={`/reset-password?email=${encodeURIComponent(resetEmail.trim())}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#10b981',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  Enter Reset Credentials &rarr;
                </Link>
              </div>
            )}

            {resetError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#fca5a5',
                  fontSize: '13px',
                  marginBottom: '20px',
                  lineHeight: 1.5,
                }}
              >
                {resetError}
              </div>
            )}

            <form onSubmit={handleResetSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#cbd5e1' }}>
                  Administrator Email
                </label>
                <input
                  required
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@platform.internal"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-muted)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                style={{
                  marginTop: '6px',
                  background: 'var(--primary)',
                  color: 'var(--primary-fg)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: resetLoading ? 'wait' : 'pointer',
                  transition: 'background var(--transition)',
                  opacity: resetLoading ? 0.7 : 1,
                }}
              >
                {resetLoading ? 'Sending recovery link…' : 'Send Recovery Link'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '13px' }}>
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setResetMessage(''); setResetError(''); }}
                  style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 600, fontSize: '13px', cursor: 'pointer', padding: 0 }}
                >
                  &larr; Back to sign in
                </button>
                <Link
                  to={`/reset-password${resetEmail ? `?email=${encodeURIComponent(resetEmail.trim())}` : ''}`}
                  style={{ color: '#94a3b8', textDecoration: 'none' }}
                >
                  Have a code or link? &rarr;
                </Link>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {errorMessage && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#fca5a5',
                  fontSize: '13px',
                  marginBottom: '20px',
                  lineHeight: 1.5,
                }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#cbd5e1' }}>
                  Super Admin Email
                </label>
                <input
                  required
                  autoFocus
                  autoComplete="username"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@platform.internal"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-muted)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)' }}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(true);
                      setResetEmail(email.trim());
                      setResetMessage('');
                      setResetError('');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Forgot password?
                  </button>
                </div>
                <PasswordField
                  label=""
                  theme="dark"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <input
                  id="sa-remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
                <label htmlFor="sa-remember-me" style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Remember my email
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '6px',
                  background: 'var(--primary)',
                  color: 'var(--primary-fg)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  padding: '10px 18px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: loading ? 'wait' : 'pointer',
                  transition: 'background var(--transition)',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Verifying permissions…' : 'Sign in to Platform Admin'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px' }}>
                <Link to="/reset-password" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                  Have an admin recovery code? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Enter credentials &rarr;</span>
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
