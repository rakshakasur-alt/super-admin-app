import { useEffect, useState } from 'react';
import {
  deletePlatformNotification,
  fetchAllHotels,
  fetchPlatformNotifications,
  getQrMerchUrl,
  sendPlatformNotification,
  setQrMerchUrl
} from '../lib/supabaseClient';
import ConfirmModal from '../components/ConfirmModal';
import useDocumentTitle from '../lib/useDocumentTitle';

const TYPE_CONFIG = {
  info: { label: 'Information', bg: 'var(--accent-subtle, #eff6ff)', fg: 'var(--accent, #2563eb)', border: '#bfdbfe', icon: 'ℹ️' },
  update: { label: 'Platform Update', bg: 'rgba(99, 102, 241, 0.15)', fg: '#6366f1', border: 'rgba(99, 102, 241, 0.3)', icon: '🚀' },
  warning: { label: 'Maintenance Advisory', bg: 'var(--warning-subtle, #fffbeb)', fg: 'var(--warning-fg, #b45309)', border: '#fde68a', icon: '⚠️' },
  critical: { label: 'Critical Alert', bg: 'var(--danger-subtle, #fef2f2)', fg: 'var(--danger-fg, #dc2626)', border: 'var(--danger-border, #fecaca)', icon: '🚨' }
};

export default function NotificationComposer() {
  useDocumentTitle('Notification Composer');
  const [notifications, setNotifications] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('info');
  const [targetType, setTargetType] = useState('all');
  const [targetValue, setTargetValue] = useState('');

  // QR Merch configuration state
  const [qrMerchUrl, setQrMerchUrlState] = useState('');
  const [qrMerchSaving, setQrMerchSaving] = useState(false);
  const [qrMerchStatus, setQrMerchStatus] = useState('');

  async function loadData() {
    setLoading(true);
    const [notifsRes, hotelsRes, merchRes] = await Promise.all([
      fetchPlatformNotifications(),
      fetchAllHotels('all'),
      getQrMerchUrl()
    ]);
    setNotifications(notifsRes.notifications || []);
    setHotels(hotelsRes.hotels || []);
    if (merchRes?.url) {
      setQrMerchUrlState(merchRes.url);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveQrMerch(e) {
    e.preventDefault();
    setQrMerchSaving(true);
    setQrMerchStatus('');
    const { error: saveErr } = await setQrMerchUrl(qrMerchUrl);
    setQrMerchSaving(false);
    if (saveErr) {
      setQrMerchStatus('⚠️ Error: ' + (saveErr.message || 'Failed to save URL'));
    } else {
      setQrMerchStatus('✓ QR Merch store URL updated successfully for all hotels.');
      setTimeout(() => setQrMerchStatus(''), 4000);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    setSending(true);
    setError('');
    setMessage('');

    let effValue = null;
    if (targetType === 'status') {
      effValue = targetValue || 'verified';
    } else if (targetType === 'hotel') {
      effValue = targetValue || hotels[0]?.id || null;
      if (!effValue) {
        setError('Please select a target hotel.');
        setSending(false);
        return;
      }
    }

    const { data, error: sendErr } = await sendPlatformNotification({
      title,
      message: content,
      type,
      targetType,
      targetValue: effValue
    });

    setSending(false);

    if (sendErr) {
      setError(sendErr.message || 'Failed to dispatch notification.');
      return;
    }

    setMessage('✓ Notification dispatched successfully to target hotel owners.');
    setTitle('');
    setContent('');
    setType('info');
    setTargetType('all');
    setTargetValue('');
    loadData();
    setTimeout(() => setMessage(''), 4000);
  }

  async function handleDelete(id) {
    const { error: delErr } = await deletePlatformNotification(id);
    if (!delErr) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      setMessage('Notification removed.');
      setTimeout(() => setMessage(''), 3000);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 800, color: 'var(--text)' }}>
          Platform Announcements & Push Notifications
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
          Broadcast in-app notices, maintenance schedules, and critical advisories to hotel owners.
        </p>
      </div>

      {message && (
        <div style={{ background: 'var(--success-subtle)', color: 'var(--success-fg)', border: '1px solid #bbf7d0', padding: '10px 16px', borderRadius: 'var(--radius)', fontSize: '13px', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--danger-subtle)', color: 'var(--danger-fg)', border: '1px solid var(--danger-border, #fecaca)', padding: '10px 16px', borderRadius: 'var(--radius)', fontSize: '13px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* QR Merch & Physical Standees Card */}
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>🛍️</span>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                QR Merch & Physical Standees URL
              </h2>
              <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                Global Integration
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', maxWidth: '750px', lineHeight: 1.4 }}>
              Set the global destination URL for the &quot;Explore More&quot; button in all hotel standee customizers. When hotel owners want custom acrylic stands, wooden blocks, or custom merchandise, they will be directed here. If blank, hotel owners see &quot;Coming Soon&quot;.
            </p>
          </div>

          {qrMerchStatus && (
            <div style={{ fontSize: '12px', fontWeight: 600, color: qrMerchStatus.startsWith('✓') ? 'var(--success-fg, #16a34a)' : 'var(--danger-fg, #dc2626)', background: 'var(--bg-subtle)', padding: '6px 12px', borderRadius: 'var(--radius)' }}>
              {qrMerchStatus}
            </div>
          )}
        </div>

        <form onSubmit={handleSaveQrMerch} style={{ display: 'flex', gap: '12px', marginTop: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <input
              type="url"
              placeholder="e.g. https://shop.yourbrand.com/table-standees (or leave empty for Coming Soon)"
              value={qrMerchUrl}
              onChange={(e) => setQrMerchUrlState(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={qrMerchSaving}
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-fg, #ffffff)',
              border: 'none',
              borderRadius: 'var(--radius)',
              padding: '9px 18px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: qrMerchSaving ? 'wait' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {qrMerchSaving ? 'Saving…' : 'Publish QR Merch URL'}
          </button>

          {qrMerchUrl && (
            <a
              href={qrMerchUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '13px',
                color: 'var(--primary)',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px'
              }}
            >
              Test Link ↗
            </a>
          )}
        </form>
      </div>

      {/* Grid: Composer on Left / Sent History on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', alignItems: 'flex-start' }}>

        {/* Compose Card */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
            Broadcast New Notice
          </h2>

          <form onSubmit={handleSend} style={{ display: 'grid', gap: '16px' }}>
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Announcement Title *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Scheduled System Maintenance Notice"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Type selector */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Notice Priority / Category
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                  const isSelected = type === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setType(key)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        border: `1px solid ${isSelected ? config.fg : 'var(--border)'}`,
                        background: isSelected ? config.bg : 'var(--bg)',
                        color: isSelected ? config.fg : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Target Recipients
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value);
                    setTargetValue('');
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Hotel Owners</option>
                  <option value="status">By Hotel Status</option>
                  <option value="hotel">Specific Hotel Only</option>
                </select>

                {targetType === 'status' && (
                  <select
                    value={targetValue || 'verified'}
                    onChange={(e) => setTargetValue(e.target.value)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="verified">Active / Verified Hotels</option>
                    <option value="pending">Pending Approval Hotels</option>
                    <option value="suspended">Suspended Hotels</option>
                  </select>
                )}

                {targetType === 'hotel' && (
                  <select
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select Hotel...</option>
                    {hotels.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.subdomain || 'no domain'})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Notice Message *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Write the full advisory or announcement details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-fg, #ffffff)',
                border: 'none',
                borderRadius: 'var(--radius)',
                padding: '11px 20px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: sending ? 'wait' : 'pointer',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              {sending ? 'Dispatching Notice...' : '📢 Send Announcement'}
            </button>
          </form>
        </div>

        {/* Sent History List */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
              Broadcast History
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {notifications.length} dispatched
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              Loading announcements...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              No platform notices dispatched yet. Compose one on the left.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px', maxHeight: '580px', overflowY: 'auto' }}>
              {notifications.map(notif => {
                const conf = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                return (
                  <div
                    key={notif.id}
                    style={{
                      padding: '14px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      display: 'grid',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px' }}>{conf.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                            {notif.title}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Target: <strong style={{ color: 'var(--text)' }}>{notif.target_type === 'all' ? 'All Hotels' : notif.target_type === 'status' ? `Status: ${notif.target_value}` : 'Single Hotel'}</strong> • {new Date(notif.created_at).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '11px',
                            background: 'var(--bg-muted)',
                            color: 'var(--text-muted)',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 600
                          }}
                          title="Hotel owners who opened this notice"
                        >
                          👁️ {notif.read_count || 0} reads
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(notif.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger-fg, #dc2626)',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            padding: '2px 6px'
                          }}
                          title="Delete notice"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, background: 'var(--bg)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      {notif.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmDeleteId)}
        title="Delete Announcement?"
        message="Are you sure you want to delete this broadcast notice from all owners' notification center?"
        confirmText="Delete Notice"
        variant="danger"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={async () => {
          if (confirmDeleteId) {
            const id = confirmDeleteId;
            setConfirmDeleteId(null);
            await handleDelete(id);
          }
        }}
      />
    </div>
  );
}
