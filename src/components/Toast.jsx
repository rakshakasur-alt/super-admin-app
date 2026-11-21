import { useState, useEffect } from 'react';

/**
 * Toast component for super-admin-app (dark themed)
 */
export function Toast({ message, type = 'info', duration = 4000, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bg =
    type === 'success'
      ? 'rgba(16, 185, 129, 0.95)'
      : type === 'error'
      ? 'rgba(239, 68, 68, 0.95)'
      : 'rgba(30, 41, 59, 0.95)';
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚡';

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: bg,
        color: '#fff',
        padding: '12px 18px',
        borderRadius: '12px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '400px',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: '16px' }}>{icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: '16px',
          fontWeight: 700,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const clearToast = () => setToast(null);

  return { toast, showToast, clearToast };
}

export default Toast;
