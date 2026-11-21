import { useEffect } from 'react';

/**
 * ConfirmModal — Accessible in-app confirmation modal for Super Admin Console
 * Replaces native window.confirm() with corporate design tokens.
 */
export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onCancel?.();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantColors = {
    danger: {
      icon: '⚠️',
      iconBg: 'var(--danger-subtle, #fee2e2)',
      iconFg: 'var(--danger-fg, #dc2626)',
      btnBg: 'var(--danger-fg, #dc2626)',
      btnFg: '#ffffff',
    },
    warning: {
      icon: '⏳',
      iconBg: 'var(--warning-subtle, #fef3c7)',
      iconFg: 'var(--warning-fg, #b45309)',
      btnBg: 'var(--warning, #d97706)',
      btnFg: '#ffffff',
    },
    primary: {
      icon: 'ℹ️',
      iconBg: 'var(--accent-subtle, #eff6ff)',
      iconFg: 'var(--accent, #2563eb)',
      btnBg: 'var(--primary, #2563eb)',
      btnFg: 'var(--primary-fg, #ffffff)',
    },
  };

  const v = variantColors[variant] || variantColors.danger;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: 'var(--shadow-lg, 0 20px 40px rgba(0, 0, 0, 0.25))',
          padding: '24px',
          animation: 'modalEnter 0.18s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: v.iconBg,
              color: v.iconFg,
              display: 'grid',
              placeItems: 'center',
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            {v.icon}
          </div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--text, #0f172a)' }}>
            {title}
          </h3>
        </div>

        <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'var(--text-muted, #475569)', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 16px',
              borderRadius: 'var(--radius, 8px)',
              border: '1px solid var(--border, #cbd5e1)',
              background: 'var(--bg, #ffffff)',
              color: 'var(--text, #334155)',
              fontWeight: 500,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 18px',
              borderRadius: 'var(--radius, 8px)',
              border: 'none',
              background: v.btnBg,
              color: v.btnFg,
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
