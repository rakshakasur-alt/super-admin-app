import { useState } from 'react';
import { createHotelAdmin } from '../lib/supabaseClient';

export default function CreateHotelModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  function handleNameChange(e) {
    const val = e.target.value;
    setName(val);
    // Auto-generate subdomain if user hasn't typed custom subdomain
    if (!createdResult && (!subdomain || subdomain === name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'))) {
      setSubdomain(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const { data, error: err } = await createHotelAdmin({ name, subdomain, ownerEmail });
    setSubmitting(false);

    if (err) {
      setError(err.message || 'Failed to create hotel.');
      return;
    }

    setCreatedResult(data);
    onCreated?.(data);
  }

  function handleCopyInvite() {
    if (createdResult?.inviteLink && navigator.clipboard) {
      navigator.clipboard.writeText(createdResult.inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  function handleClose() {
    setName('');
    setSubdomain('');
    setOwnerEmail('');
    setError('');
    setCreatedResult(null);
    setCopiedLink(false);
    onClose();
  }

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
        if (e.target === e.currentTarget && !submitting) handleClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: 'var(--shadow-lg, 0 20px 40px rgba(0, 0, 0, 0.25))',
          padding: '28px',
          animation: 'modalEnter 0.18s ease-out',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text, #0f172a)' }}>
              {createdResult ? '✓ Hotel Created' : 'Create New Hotel'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
              {createdResult
                ? 'The hotel tenant has been initialized and verified.'
                : 'Register a new hotel tenant and generate an owner onboarding link.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius, 8px)',
              background: 'var(--danger-subtle, #fee2e2)',
              color: 'var(--danger-fg, #dc2626)',
              border: '1px solid var(--danger-border, #fecaca)',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {createdResult ? (
          <div>
            <div
              style={{
                background: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 'var(--radius, 10px)',
                padding: '16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Hotel Name</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
                {createdResult.name}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Subdomain</div>
              <div style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--accent, #2563eb)', marginBottom: '12px' }}>
                {createdResult.subdomain}.menu
              </div>

              {createdResult.owner_email && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Owner Account & Invite Status</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                    {createdResult.owner_email}
                  </div>
                  {createdResult.emailSent ? (
                    <div style={{ fontSize: '12px', color: 'var(--success-fg, #16a34a)', marginTop: '4px', fontWeight: 500 }}>
                      ✓ Invitation dispatched to owner email to set their login password.
                    </div>
                  ) : createdResult.inviteNotice ? (
                    <div style={{ fontSize: '12px', color: 'var(--accent, #2563eb)', marginTop: '4px' }}>
                      {createdResult.inviteNotice}
                    </div>
                  ) : null}
                </div>
              )}

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Owner Password Setup / Invite Link:
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  readOnly
                  value={createdResult.inviteLink || ''}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    borderRadius: 'var(--radius-sm, 6px)',
                    border: '1px solid var(--border, #cbd5e1)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm, 6px)',
                    border: 'none',
                    background: copiedLink ? 'var(--success, #16a34a)' : 'var(--primary, #2563eb)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {copiedLink ? '✓ Copied' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius, 8px)',
                  border: 'none',
                  background: 'var(--primary, #2563eb)',
                  color: 'var(--primary-fg, #ffffff)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Hotel Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Royal Orchid Grand"
                value={name}
                onChange={handleNameChange}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius, 8px)',
                  border: '1px solid var(--border, #cbd5e1)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Subdomain Slug *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border, #cbd5e1)', borderRadius: 'var(--radius, 8px)', background: 'var(--bg)', overflow: 'hidden' }}>
                <input
                  required
                  type="text"
                  placeholder="e.g. royal-orchid"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <span style={{ padding: '0 12px', fontSize: '13px', color: 'var(--text-muted)', background: 'var(--bg-muted)', borderLeft: '1px solid var(--border)', lineHeight: '38px' }}>
                  .menu
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Owner Email <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
              </label>
              <input
                type="email"
                placeholder="owner@hotel.com"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius, 8px)',
                  border: '1px solid var(--border, #cbd5e1)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                We'll embed this in the owner's invite registration link.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                style={{
                  padding: '9px 16px',
                  borderRadius: 'var(--radius, 8px)',
                  border: '1px solid var(--border, #cbd5e1)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '9px 18px',
                  borderRadius: 'var(--radius, 8px)',
                  border: 'none',
                  background: 'var(--primary, #2563eb)',
                  color: 'var(--primary-fg, #ffffff)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: submitting ? 'wait' : 'pointer',
                }}
              >
                {submitting ? 'Creating...' : 'Create Hotel'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
