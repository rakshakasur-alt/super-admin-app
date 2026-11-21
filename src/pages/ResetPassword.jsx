import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  exchangeResetCode,
  resetPasswordWithOtp,
  signOutSuperAdmin,
  supabase,
  updatePassword,
  verifyPlatformAdmin,
  verifyResetTokenHash,
} from '../lib/supabaseClient';
import PasswordField from '../components/PasswordField';
import useDocumentTitle from '../lib/useDocumentTitle';
import { MIN_PASSWORD_LENGTH, passwordPolicyError } from '../lib/passwordPolicy';

export default function ResetPassword() {
  useDocumentTitle('Reset Admin Password');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialEmail = searchParams.get('email') || '';
  const initialToken = searchParams.get('token') || '';
  const initialCode = searchParams.get('code') || '';
  const initialTokenHash = searchParams.get('token_hash') || '';

  const [email, setEmail] = useState(initialEmail);
  const [resetCode, setResetCode] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRecoveryActive, setIsRecoveryActive] = useState(false);
  const [activeUserEmail, setActiveUserEmail] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [entryMode, setEntryMode] = useState(initialToken || initialEmail ? 'code' : 'auto');

  const redirectTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let authSubscription = null;
    let fallbackTimer = null;

    async function handleAuthVerification() {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const queryParams = new URLSearchParams(search);

      const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');
      if (errorDesc && mounted) {
        setErrorMessage(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
      }

      if (!supabase) {
        if (mounted) setCheckingAuth(false);
        return;
      }

      if (initialCode) {
        try {
          const { data, error } = await exchangeResetCode(initialCode);
          if (error) {
            if (mounted) {
              setErrorMessage(error.message || 'The password reset link is invalid or has expired.');
            }
          } else if (mounted) {
            setIsRecoveryActive(true);
            if (data?.session?.user?.email) {
              setActiveUserEmail(data.session.user.email);
              if (!email) setEmail(data.session.user.email);
            }
          }
        } catch (err) {
          if (mounted) {
            setErrorMessage(err.message || 'The password reset link could not be verified.');
          }
        }
      }

      if (initialTokenHash) {
        try {
          const { data, error } = await verifyResetTokenHash(initialTokenHash);
          if (error) {
            if (mounted) {
              setErrorMessage(error.message || 'The password reset link is invalid or has expired.');
            }
          } else if (mounted) {
            setIsRecoveryActive(true);
            if (data?.session?.user?.email) {
              setActiveUserEmail(data.session.user.email);
              if (!email) setEmail(data.session.user.email);
            }
          }
        } catch (err) {
          if (mounted) {
            setErrorMessage(err.message || 'The password reset link could not be verified.');
          }
        }
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        if (event === 'PASSWORD_RECOVERY') {
          setIsRecoveryActive(true);
          if (session?.user?.email) {
            setActiveUserEmail(session.user.email);
            if (!email) setEmail(session.user.email);
          }
        }
        setCheckingAuth(false);
      });
      authSubscription = subscription;

      fallbackTimer = setTimeout(() => {
        if (mounted) setCheckingAuth(false);
      }, 1200);
    }

    handleAuthVerification();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
    };
  }, [initialCode, initialTokenHash]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (passwordPolicyError(newPassword)) {
      setErrorMessage(passwordPolicyError(newPassword));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      let updatedUser = null;

      if (isRecoveryActive && entryMode !== 'code') {
        const { data, error } = await updatePassword(newPassword);
        if (error) throw error;
        updatedUser = data?.user;
      } else {
        if (!email.trim()) {
          setErrorMessage('Please enter your administrator account email.');
          setLoading(false);
          return;
        }
        if (!resetCode.trim()) {
          setErrorMessage('Please enter the 6-digit code or recovery token from your email.');
          setLoading(false);
          return;
        }

        const { data, error } = await resetPasswordWithOtp({
          email: email.trim(),
          token: resetCode.trim(),
          newPassword,
        });
        if (error) throw error;
        updatedUser = data?.user;
      }

      const isPlatformAdmin = updatedUser?.id ? await verifyPlatformAdmin(updatedUser.id) : false;

      if (!isPlatformAdmin) {
        await signOutSuperAdmin();
        setErrorMessage('Access denied: This account is not registered as a platform administrator.');
        return;
      }

      setSuccessMessage('Administrator password updated successfully. Redirecting…');
      redirectTimerRef.current = setTimeout(() => {
        navigate('/hotels', { replace: true });
      }, 1500);
    } catch (err) {
      setErrorMessage(
        err.message ||
        'Failed to reset administrator password. The code or link may have expired.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1e1b4b, #0f172a, #0b0f19)',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '36px 32px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              color: '#fff',
              fontSize: '22px',
              marginBottom: '14px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
            }}
          >
            ⚡
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 800, color: '#fff' }}>
            Reset Admin Credentials
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: 1.5 }}>
            {isRecoveryActive && entryMode !== 'code'
              ? 'Authorized recovery session verified. Enter your new password.'
              : 'Enter the recovery code from your email to update your admin credentials.'}
          </p>
        </div>

        {/* Tab switchers */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(30, 41, 59, 0.6)',
            padding: '3px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <button
            type="button"
            onClick={() => setEntryMode('code')}
            style={{
              flex: 1,
              padding: '8px 10px',
              border: 'none',
              borderRadius: '8px',
              background: entryMode === 'code' || !isRecoveryActive ? '#6366f1' : 'transparent',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            🔑 Enter Reset Code
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('link')}
            style={{
              flex: 1,
              padding: '8px 10px',
              border: 'none',
              borderRadius: '8px',
              background: entryMode === 'link' && isRecoveryActive ? '#6366f1' : 'transparent',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            🔗 Email Link {isRecoveryActive && '✓'}
          </button>
        </div>

        {/* Verified badge */}
        {isRecoveryActive && entryMode !== 'code' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '18px',
              fontSize: '13px',
            }}
          >
            <span style={{ fontSize: '16px' }}>✓</span>
            <div>
              Verified session for: <strong>{activeUserEmail || 'Super Admin'}</strong>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#6ee7b7',
              fontSize: '13px',
              marginBottom: '20px',
              lineHeight: 1.5,
            }}
          >
            {successMessage}
          </div>
        )}

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
          {(!isRecoveryActive || entryMode === 'code') && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: '#cbd5e1' }}>
                  Admin Email
                </label>
                <input
                  required
                  autoFocus={!email}
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@platform.com"
                  disabled={loading || Boolean(successMessage)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontWeight: 600, fontSize: '13px', color: '#cbd5e1' }}>
                    Reset Code or Token
                  </label>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Check your email</span>
                </div>
                <input
                  required
                  autoFocus={Boolean(email) && !resetCode}
                  autoComplete="one-time-code"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6-digit code or recovery token"
                  disabled={loading || Boolean(successMessage)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(30, 41, 59, 0.6)',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </>
          )}

          <PasswordField
            id="sa-reset-password"
            label="New Password"
            theme="dark"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            required
            minLength={MIN_PASSWORD_LENGTH}
            disabled={loading || Boolean(successMessage)}
            autoComplete="new-password"
            autoFocus={isRecoveryActive && entryMode !== 'code'}
            showStrength
            showRequirements
          />

          <PasswordField
            id="sa-reset-confirm"
            label="Confirm New Password"
            theme="dark"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            disabled={loading || Boolean(successMessage)}
            autoComplete="new-password"
            showMatch
            matchValue={newPassword}
          />

          <button
            type="submit"
            disabled={loading || Boolean(successMessage)}
            style={{
              marginTop: '6px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
              transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? 'Updating credentials…'
              : isRecoveryActive && entryMode !== 'code'
              ? 'Update Admin Password'
              : 'Verify Code & Set Password'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '13px' }}>
            <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>
              &larr; Return to login
            </Link>
            <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>
              Request new link
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
