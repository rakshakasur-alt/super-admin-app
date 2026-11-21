import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchHotelDetail, updateHotelStatus, updateHotelPlan, deleteHotelAdmin, setDishSuspensionAdmin, deleteDishAdmin } from '../lib/supabaseClient';
import { formatCurrency } from '../lib/formatters';
import ConfirmModal from '../components/ConfirmModal';
import EditHotelModal from '../components/EditHotelModal';
import useDocumentTitle from '../lib/useDocumentTitle';
import { safeExternalUrl } from '../lib/safeUrl';

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      title={`Copy ${label}`}
      onClick={handleCopy}
      style={{
        background: copied ? 'var(--success-subtle, rgba(34, 197, 94, 0.15))' : 'var(--bg-muted, rgba(255, 255, 255, 0.05))',
        border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
        color: copied ? 'var(--success-fg, #22c55e)' : 'var(--text-muted, #94a3b8)',
        cursor: 'pointer',
        padding: '3px 8px',
        borderRadius: 'var(--radius-sm, 6px)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 600,
        transition: 'all var(--transition)'
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

export default function HotelDetail() {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  useDocumentTitle(data?.hotel?.name ? `${data.hotel.name} Details` : 'Hotel Details');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleteDishConfirmTarget, setDeleteDishConfirmTarget] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  async function loadDetail() {
    setLoading(true);
    const result = await fetchHotelDetail(hotelId);
    setLoading(false);
    if (!result.error) {
      setData(result);
    }
  }

  useEffect(() => {
    loadDetail();
  }, [hotelId]);

  async function handleStatusChange(newStatus) {
    setActionLoading(true);
    setMessage('');
    const { error } = await updateHotelStatus(hotelId, newStatus);
    setActionLoading(false);

    if (error) {
      setMessage(`Failed to update status: ${error.message}`);
      return;
    }

    setMessage(`Hotel status successfully updated to "${newStatus}".`);
    setData(prev => ({
      ...prev,
      hotel: { ...prev.hotel, status: newStatus }
    }));
  }

  async function handlePlanChange(newPlan) {
    setActionLoading(true);
    setMessage('');
    const { error } = await updateHotelPlan(hotelId, newPlan);
    setActionLoading(false);

    if (error) {
      setMessage(`Failed to update plan: ${error.message}`);
      return;
    }

    setMessage(`Hotel subscription plan updated to "${newPlan === 'pro' ? '⭐ Pro Plan' : 'Free Tier'}".`);
    setData(prev => ({
      ...prev,
      hotel: { ...prev.hotel, plan: newPlan }
    }));
  }

  async function handleDeleteHotel() {
    setActionLoading(true);
    setMessage('');
    const { error: delErr } = await deleteHotelAdmin(hotelId);
    setActionLoading(false);

    if (delErr) {
      setMessage(`Failed to delete hotel: ${delErr.message}`);
      return;
    }

    navigate('/hotels', { replace: true });
  }

  async function handleDishSuspensionToggle(dish) {
    const nextSuspended = !dish.is_suspended;
    setActionLoading(true);
    setMessage('');
    const { error: suspErr } = await setDishSuspensionAdmin({
      dishId: dish.id,
      isSuspended: nextSuspended,
      reason: nextSuspended ? 'Suspended by super administrator' : null
    });
    setActionLoading(false);

    if (suspErr) {
      setMessage(`Failed to update dish suspension: ${suspErr.message}`);
      return;
    }

    setMessage(`Dish "${dish.name}" is now ${nextSuspended ? 'suspended' : 'active'}.`);
    setData(prev => ({
      ...prev,
      dishes: prev.dishes.map(d => d.id === dish.id ? { ...d, is_suspended: nextSuspended } : d)
    }));
  }

  async function handleDeleteDish(dish) {
    if (!dish) return;
    setActionLoading(true);
    const { error } = await deleteDishAdmin(dish.id);
    setActionLoading(false);
    if (error) {
      setMessage(`Failed to delete dish: ${error.message}`);
      return;
    }
    setMessage(`Dish "${dish.name}" permanently deleted.`);
    setData(prev => ({
      ...prev,
      dishes: prev.dishes.filter(d => d.id !== dish.id)
    }));
    setDeleteDishConfirmTarget(null);
  }

  if (loading) {
    return <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>Loading hotel details…</div>;
  }

  if (!data?.hotel) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ color: '#f87171' }}>Hotel not found.</p>
        <Link to="/hotels" style={{ color: '#818cf8' }}>← Back to Hotels</Link>
      </div>
    );
  }

  const { hotel, dishes } = data;

  const ownerProfile = hotel.ownerProfile || null;
  const hotelCoordinates = hotel.coordinates || hotel.theme_config?.coordinates || null;
  const hasCoordinates = hotelCoordinates && typeof hotelCoordinates.lat === 'number' && typeof hotelCoordinates.lng === 'number';
  const hotelLogoUrl = hotel.theme_config?.logoUrl || hotel.logo_url || null;
  const ownerAvatarUrl = ownerProfile?.avatar_url || hotel.theme_config?.ownerAvatarUrl || null;
  // The admin app saves the standee cutout logo at theme_config.standee.centerLogoUrl
  // (StandeeModal → updateHotelTheme). When none was picked, the standee uses the
  // brand header/logo, so show that instead of "No standee logo".
  const standeeConfig = hotel.theme_config?.standee || {};
  const standeeLogoUrl = standeeConfig.centerLogoUrl
    || hotel.theme_config?.standeeLogoUrl
    || hotel.theme_config?.standee_config?.logoUrl
    || hotel.theme_config?.headerData?.uploadedHeaders?.[0]
    || hotelLogoUrl
    || null;
  const standeeLogoIsFallback = Boolean(standeeLogoUrl) && !standeeConfig.centerLogoUrl
    && !hotel.theme_config?.standeeLogoUrl && !hotel.theme_config?.standee_config?.logoUrl;
  const hotelProfile = hotel.theme_config?.profile || {};
  const hotelContactEmail = hotel.contact_email || hotelProfile.contact_email || hotel.theme_config?.email || null;
  const hotelPhone = hotel.phone || hotelProfile.phone || hotel.theme_config?.phone || null;
  const hotelHours = hotel.operating_hours || hotelProfile.operating_hours || hotel.theme_config?.operatingHours || null;
  const backgroundImageUrl = (() => {
    const raw = hotel.theme_config?.background || hotel.theme_config?.headerData?.background || hotel.header_image_url || '';
    const urlMatch = raw.match(/url\(["']?([^"')]+)["']?\)/);
    return urlMatch ? urlMatch[1] : (raw.startsWith('http') || raw.startsWith('data:') ? raw : null);
  })();
  const dishesWithImages = (dishes || []).filter(d => Boolean(d.thumbnail_url));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
        <Link to="/hotels" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>Hotels</Link>
        <span>/</span>
        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{hotel.name}</span>
      </nav>

      {message && (
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#c7d2fe',
            fontSize: '13px',
            marginBottom: '20px',
          }}
        >
          {message}
        </div>
      )}

      {/* Hotel Summary Card */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '28px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Hotel Tenant Detail
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {hotelLogoUrl ? (
                <img
                  src={hotelLogoUrl}
                  alt={`${hotel.name} logo`}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    objectFit: 'contain',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '4px',
                    flexShrink: 0
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.2))',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '24px',
                    flexShrink: 0
                  }}
                >
                  🏨
                </div>
              )}
              <div>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--text)' }}>{hotel.name}</h1>
                {(hotel.branch || hotel.theme_config?.branch) && (
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                    Branch: <strong style={{ color: '#cbd5e1' }}>{hotel.branch || hotel.theme_config?.branch}</strong>
                  </div>
                )}
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              UUID:
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--text)', background: 'var(--bg-muted)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>{hotel.id}</span>
              <CopyButton text={hotel.id} label="Hotel UUID" />
            </div>
            {hotel.menu_id && (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Menu ID:</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
                  {hotel.menu_id}
                </span>
                <CopyButton text={hotel.menu_id} label="Menu ID" />
              </div>
            )}
            <div style={{ color: '#94a3b8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span>Subdomain: <strong style={{ color: '#a5b4fc' }}>{hotel.subdomain || 'Not assigned'}</strong></span>
              {hotel.menu_id && (
                <a
                  href={`${(import.meta.env.VITE_GUEST_APP_URL || 'https://localhost:4175').replace(/\/+$/, '')}/menu/${hotel.menu_id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontWeight: 600
                  }}
                  title="Preview digital menu via canonical Menu ID"
                >
                  Preview Guest Menu ↗
                </a>
              )}
              {hotel.subdomain && !hotel.menu_id && (
                <a
                  href={`${(import.meta.env.VITE_GUEST_APP_URL || 'https://localhost:4175').replace(/\/+$/, '')}/menu/1?hotel=${hotel.subdomain}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.1)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontWeight: 600
                  }}
                >
                  Preview Guest Menu ↗
                </a>
              )}
            </div>
          </div>

          {/* Status & Action Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '14px' }}>
                Status:{' '}
                <strong
                  style={{
                    color:
                      hotel.status === 'verified' ? '#34d399' :
                      hotel.status === 'suspended' ? '#f87171' : '#fbbf24',
                    textTransform: 'uppercase',
                  }}
                >
                  {hotel.status === 'pending' ? 'Approval Needed' : hotel.status}
                </strong>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Plan:</span>
                <span
                  style={{
                    padding: '2px 9px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: hotel.plan === 'pro' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                    color: hotel.plan === 'pro' ? '#fbbf24' : 'var(--text-muted, #94a3b8)',
                    border: hotel.plan === 'pro' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border)'
                  }}
                >
                  {hotel.plan === 'pro' ? '⭐ PRO PLAN' : 'FREE TIER'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {/* Pro Plan Unlocking Toggle */}
              {hotel.plan !== 'pro' ? (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handlePlanChange('pro')}
                  title="Grant Pro access with full unwatermarked standee and QR customizations"
                  style={{
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: 'var(--radius, 8px)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: actionLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
                  }}
                >
                  ⭐ Unlock Pro Plan
                </button>
              ) : (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handlePlanChange('free')}
                  title="Downgrade hotel to free tier"
                  style={{
                    background: 'var(--bg-muted, rgba(255, 255, 255, 0.08))',
                    color: 'var(--text-muted, #94a3b8)',
                    border: '1px solid var(--border)',
                    padding: '7px 14px',
                    borderRadius: 'var(--radius, 8px)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: actionLoading ? 'wait' : 'pointer'
                  }}
                >
                  Downgrade to Free
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                style={{
                  background: 'var(--bg-muted, rgba(255, 255, 255, 0.08))',
                  color: 'var(--text)',
                  border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius, 8px)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ✎ Edit Hotel
              </button>

              <button
                type="button"
                onClick={() => setConfirmTarget({
                  isDeleteHotel: true,
                  title: `Delete Hotel "${hotel.name}"?`,
                  message: `This will permanently delete "${hotel.name}" along with all its dishes, menus, QR codes, and analytics. THIS CANNOT BE UNDONE.`,
                  confirmText: 'Delete Hotel Permanently',
                  variant: 'danger'
                })}
                style={{
                  background: 'var(--danger-subtle, rgba(239, 68, 68, 0.15))',
                  color: 'var(--danger-fg, #f87171)',
                  border: '1px solid var(--danger-border, rgba(239, 68, 68, 0.3))',
                  padding: '7px 14px',
                  borderRadius: 'var(--radius, 8px)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                🗑️ Delete Hotel
              </button>

              {hotel.status !== 'verified' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleStatusChange('verified')}
                  style={{
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: 'var(--radius, 8px)',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: actionLoading ? 'wait' : 'pointer',
                  }}
                >
                  ✓ Approve
                </button>
              )}

              {hotel.status !== 'suspended' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setConfirmTarget({
                    newStatus: 'suspended',
                    title: `Suspend ${hotel.name}?`,
                    message: `Are you sure you want to suspend "${hotel.name}"? Their public menu and all QR codes will immediately go offline.`,
                    confirmText: 'Suspend Hotel',
                    variant: 'danger'
                  })}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    padding: '7px 14px',
                    borderRadius: 'var(--radius, 8px)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: actionLoading ? 'wait' : 'pointer',
                  }}
                >
                  Suspend
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Location & Contact + Owner Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Hotel Location & Contact Card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>📍</span>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
              Hotel Location & Contact
            </h2>
          </div>

          <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
            <div>
              <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '3px' }}>Physical Address:</div>
              <div style={{ color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4 }}>
                {hotel.address || hotelProfile.address || hotel.theme_config?.address || (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No address specified</span>
                )}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>Pinpoint Coordinates:</div>
              {hasCoordinates ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
                      {hotelCoordinates.lat.toFixed(6)}, {hotelCoordinates.lng.toFixed(6)}
                    </span>
                    <CopyButton text={`${hotelCoordinates.lat}, ${hotelCoordinates.lng}`} label="Coordinates" />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${hotelCoordinates.lat},${hotelCoordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        border: '1px solid rgba(56, 189, 248, 0.2)'
                      }}
                    >
                      Google Maps ↗
                    </a>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${hotelCoordinates.lat}&mlon=${hotelCoordinates.lng}#map=16/${hotelCoordinates.lat}/${hotelCoordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#a5b4fc',
                        background: 'rgba(165, 180, 252, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        border: '1px solid rgba(165, 180, 252, 0.2)'
                      }}
                    >
                      OpenStreetMap ↗
                    </a>
                  </div>
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Coordinates not set yet
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '4px' }}>
              <div>
                <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '2px' }}>Phone:</div>
                <div style={{ color: '#e2e8f0', fontWeight: 500 }}>
                  {hotelPhone || 'Not provided'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '2px' }}>Email:</div>
                <div style={{ color: '#e2e8f0', fontWeight: 500 }}>
                  {hotelContactEmail ? (
                    <a href={`mailto:${hotelContactEmail}`} style={{ color: 'inherit', textDecoration: 'none', wordBreak: 'break-all' }}>{hotelContactEmail}</a>
                  ) : 'Not provided'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '2px' }}>Currency:</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
                  {hotel.currency || hotel.theme_config?.currency || 'INR'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '2px' }}>Hours:</div>
                <div style={{ color: '#e2e8f0', fontWeight: 500 }}>
                  {hotelHours || 'Standard'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hotel Owner Profile Card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '18px' }}>👤</span>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
              Owner Profile & Identity
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {ownerAvatarUrl ? (
              <img
                src={ownerAvatarUrl}
                alt={ownerProfile?.full_name || 'Owner Avatar'}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(56, 189, 248, 0.4)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  flexShrink: 0
                }}
              />
            ) : (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0
                }}
              >
                {(ownerProfile?.full_name || hotel.theme_config?.ownerName || 'O').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                {ownerProfile?.full_name || hotel.theme_config?.ownerName || 'Hotel Owner'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                Role: <span style={{ textTransform: 'capitalize', color: '#cbd5e1' }}>{hotel.owner?.role || 'owner'}</span>
                {ownerProfile?.created_at && (
                  <span> • Joined {new Date(ownerProfile.created_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '10px', fontSize: '13px' }}>
            <div>
              <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '3px' }}>Owner Email:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {hotel.owner_email ? (
                  <>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                      {hotel.owner_email}
                    </span>
                    <CopyButton text={hotel.owner_email} label="Owner Email" />
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Invite pending / Not registered yet
                  </span>
                )}
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '3px' }}>Owner Phone:</div>
              <div style={{ color: '#e2e8f0', fontWeight: 500 }}>
                {ownerProfile?.phone || hotel.theme_config?.ownerPhone || (
                  <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not provided in profile</span>
                )}
              </div>
            </div>

            {(hotel.owner?.user_id || ownerProfile?.user_id) && (
              <div>
                <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '3px' }}>Auth User ID:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--text)', background: 'var(--bg-muted)', padding: '3px 8px', borderRadius: 'var(--radius-sm)' }}>
                    {hotel.owner?.user_id || ownerProfile?.user_id}
                  </span>
                  <CopyButton text={hotel.owner?.user_id || ownerProfile?.user_id} label="User ID" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Assets & Media Inspector */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '24px',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🖼️</span>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
              Owner-Uploaded Media & Brand Assets
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
            All logos, avatars, standee cutouts & food photography
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: dishesWithImages.length > 0 ? '20px' : '0' }}>
          {/* Hotel Brand Logo */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>🏨 Hotel Brand Logo</div>
            <div style={{ height: '90px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              {hotelLogoUrl ? (
                <img src={hotelLogoUrl} alt="Hotel Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '12px', color: '#64748b' }}>No logo uploaded</span>
              )}
            </div>
            {hotelLogoUrl && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                {safeExternalUrl(hotelLogoUrl) && <a href={safeExternalUrl(hotelLogoUrl)} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none' }}>View Full ↗</a>}
                <CopyButton text={hotelLogoUrl} label="Logo URL" />
              </div>
            )}
          </div>

          {/* Owner Profile Avatar */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>👤 Owner Profile Avatar</div>
            <div style={{ height: '90px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              {ownerAvatarUrl ? (
                <img src={ownerAvatarUrl} alt="Owner Avatar" style={{ maxHeight: '80px', maxWidth: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '12px', color: '#64748b' }}>No avatar uploaded</span>
              )}
            </div>
            {ownerAvatarUrl && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                {safeExternalUrl(ownerAvatarUrl) && <a href={safeExternalUrl(ownerAvatarUrl)} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none' }}>View Full ↗</a>}
                <CopyButton text={ownerAvatarUrl} label="Avatar URL" />
              </div>
            )}
          </div>

          {/* QR Standee Logo */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>📐 QR Standee Cutout Logo</div>
            <div style={{ height: '90px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              {standeeLogoUrl ? (
                <img src={standeeLogoUrl} alt="Standee Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '12px', color: '#64748b' }}>No standee logo</span>
              )}
            </div>
            {standeeLogoIsFallback && (
              <span style={{ fontSize: '10px', color: '#64748b' }}>No custom cutout — standee uses the brand logo</span>
            )}
            {standeeLogoUrl && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                {safeExternalUrl(standeeLogoUrl) && <a href={safeExternalUrl(standeeLogoUrl)} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none' }}>View Full ↗</a>}
                <CopyButton text={standeeLogoUrl} label="Standee Logo" />
              </div>
            )}
          </div>

          {/* Theme Background Banner */}
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>🎨 Header / Theme Background</div>
            <div style={{ height: '90px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              {backgroundImageUrl ? (
                <img src={backgroundImageUrl} alt="Theme Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '12px', color: '#64748b' }}>Default theme banner</span>
              )}
            </div>
            {backgroundImageUrl && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                {safeExternalUrl(backgroundImageUrl) && <a href={safeExternalUrl(backgroundImageUrl)} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none' }}>View Full ↗</a>}
                <CopyButton text={backgroundImageUrl} label="Banner URL" />
              </div>
            )}
          </div>
        </div>

        {/* Dish Photography Gallery */}
        {dishesWithImages.length > 0 && (
          <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🍽️ Dish Photos ({dishesWithImages.length})</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
              {dishesWithImages.map((dish) => (
                <a
                  key={dish.id}
                  href={safeExternalUrl(dish.thumbnail_url) || undefined}
                  target="_blank"
                  rel="noreferrer"
                  title={`${dish.name} - ${dish.category || 'Dishes'}`}
                  style={{
                    flexShrink: 0,
                    width: '76px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textDecoration: 'none',
                    textAlign: 'center',
                    padding: '4px'
                  }}
                >
                  <img
                    src={dish.thumbnail_url}
                    alt={dish.name}
                    style={{ width: '68px', height: '68px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div style={{ fontSize: '10px', color: '#e2e8f0', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dish.name}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Theme Configuration Inspector */}
      {hotel.theme_config && (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '20px 24px',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
              🎨 Tenant Theme & Branding Config
            </h2>
            {hotel.theme_config.headerData?.title && (
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Header: <strong style={{ color: '#e2e8f0' }}>{hotel.theme_config.headerData.title}</strong>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {hotel.theme_config.primaryColor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: hotel.theme_config.primaryColor, border: '1px solid rgba(255,255,255,0.4)', display: 'inline-block' }} />
                <span>Primary: <code>{hotel.theme_config.primaryColor}</code></span>
              </div>
            )}
            {hotel.theme_config.secondaryColor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: hotel.theme_config.secondaryColor, border: '1px solid rgba(255,255,255,0.4)', display: 'inline-block' }} />
                <span>Secondary: <code>{hotel.theme_config.secondaryColor}</code></span>
              </div>
            )}
            {hotel.theme_config.headerData?.background && (
              <div style={{ marginTop: '12px', width: '100%' }}>
                {(() => {
                  const raw = hotel.theme_config?.background || hotel.theme_config?.headerData?.background || '';
                  const urlMatch = raw.match(/url\(["']?([^"')]+)["']?\)/);
                  const imageUrl = urlMatch ? urlMatch[1] : (raw.startsWith('http') ? raw : null);
                  return imageUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={imageUrl} alt="Branding background" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid var(--border)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imageUrl}</div>
                        <div style={{ marginTop: '6px' }}>
                          <CopyButton text={imageUrl} label="Background URL" />
                        </div>
                      </div>
                    </div>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{raw || 'No background set'}</span>;
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid: Dishes & Menu QR Code */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Dishes list */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '24px',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700 }}>
            Dishes ({dishes.length})
          </h2>
          {dishes.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '13px' }}>No dishes created yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {dishes.map((dish) => {
                const rawVariants = typeof dish.portion_variants === 'string'
                  ? (() => { try { return JSON.parse(dish.portion_variants); } catch (_) { return []; } })()
                  : dish.portion_variants;
                const portionVariants = Array.isArray(rawVariants) ? rawVariants.filter(v => v && v.name) : [];
                const hasVariants = portionVariants.length > 0;
                const hasModel = Boolean(
                  (dish.model_glb_url && dish.model_glb_url.trim() && dish.model_glb_url !== 'null' && dish.model_glb_url !== 'undefined') ||
                  (dish.model_usdz_url && dish.model_usdz_url.trim() && dish.model_usdz_url !== 'null' && dish.model_usdz_url !== 'undefined')
                );
                const isBestseller = Boolean(dish.is_bestseller ?? dish.bestseller);
                const isSpecial = Boolean(dish.is_special ?? dish.special);
                const allergensList = Array.isArray(dish.allergens)
                  ? dish.allergens
                  : (typeof dish.allergens === 'string' && dish.allergens.trim() ? dish.allergens.split(',').map(s => s.trim()).filter(Boolean) : []);

                return (
                  <div
                    key={dish.id}
                    style={{
                      background: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0, flex: 1 }}>
                        {dish.thumbnail_url ? (
                          <img
                            src={dish.thumbnail_url}
                            alt={dish.name}
                            style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center', fontSize: '22px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)' }}>
                            🍽️
                          </div>
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, fontSize: '14px', color: '#f1f5f9' }}>
                              {dish.name}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: dish.veg ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: dish.veg ? '#4ade80' : '#f87171',
                                border: dish.veg ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              {dish.veg ? '🌱 Veg' : '🍖 Non-Veg'}
                            </span>

                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: hasModel ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.1)',
                                color: hasModel ? '#38bdf8' : '#94a3b8',
                                border: hasModel ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              {hasModel ? '📦 3D AR Ready' : '📷 Photo Only'}
                            </span>

                            {isBestseller && (
                              <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                ⭐ Bestseller
                              </span>
                            )}
                            {isSpecial && (
                              <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                                👨‍🍳 Special
                              </span>
                            )}
                          </div>

                          <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span>Category: <strong style={{ color: '#cbd5e1' }}>{dish.category || 'Uncategorized'}</strong></span>
                            {dish.width_cm && dish.height_cm && dish.breadth_cm && (
                              <span>• Dimensions: <strong style={{ color: '#cbd5e1' }}>{dish.width_cm}×{dish.height_cm}×{dish.breadth_cm} cm</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#e2e8f0' }}>{formatCurrency(dish.price, hotel?.currency)}</div>
                        {dish.is_suspended && (
                          <span style={{ fontSize: '10px', fontWeight: 700, background: 'var(--danger-subtle, rgba(239, 68, 68, 0.2))', color: 'var(--danger-fg, #f87171)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '2px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            Suspended
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleDishSuspensionToggle(dish)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm, 6px)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: dish.is_suspended ? 'var(--success-subtle, rgba(34, 197, 94, 0.15))' : 'var(--warning-subtle, rgba(245, 158, 11, 0.15))',
                            color: dish.is_suspended ? 'var(--success-fg, #22c55e)' : 'var(--warning-fg, #fbbf24)',
                            border: dish.is_suspended ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {dish.is_suspended ? 'Reactivate' : 'Suspend'}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => setDeleteDishConfirmTarget(dish)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm, 6px)',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: 'var(--danger-subtle, rgba(239, 68, 68, 0.15))',
                            color: 'var(--danger-fg, #f87171)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Portion Variants Row */}
                    {hasVariants && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Portions:</span>
                        {portionVariants.map((pv, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '11px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              color: '#e2e8f0'
                            }}
                          >
                            <strong>{pv.name}</strong>: {formatCurrency(pv.price, hotel?.currency)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Allergens Row */}
                    {allergensList.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px', color: '#fca5a5' }}>
                        <span>⚠️ Allergens:</span>
                        <span style={{ color: '#fed7aa' }}>{allergensList.join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hotel Menu QR Code */}
        <div
          style={{
            background: 'var(--bg-card, rgba(15, 23, 42, 0.7))',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.08))',
            borderRadius: 'var(--radius-lg, 18px)',
            padding: '24px',
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: 'var(--text, #f1f5f9)' }}>
            Hotel Menu QR Code
          </h2>
          {(() => {
            const guestBaseUrl = (import.meta.env.VITE_GUEST_APP_URL || 'https://localhost:4175').replace(/\/+$/, '');
            const targetMenuUrl = hotel.menu_id
              ? `${guestBaseUrl}/menu/${hotel.menu_id}`
              : (hotel.subdomain ? `${guestBaseUrl}/menu/1?hotel=${hotel.subdomain}` : null);

            return targetMenuUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ padding: '12px', background: '#fff', borderRadius: '14px', border: '1px solid var(--border)', marginBottom: '14px' }}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(targetMenuUrl)}`}
                    alt={`${hotel.name} Menu QR`}
                    style={{ width: '160px', height: '160px', display: 'block' }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontFamily: 'ui-monospace, monospace', wordBreak: 'break-all', marginBottom: '14px', maxWidth: '320px' }}>
                  {targetMenuUrl}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <a
                    href={targetMenuUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.1)',
                      padding: '7px 14px',
                      borderRadius: 'var(--radius, 8px)',
                      textDecoration: 'none',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                    }}
                  >
                    Open Guest Menu ↗
                  </a>
                  <CopyButton
                    text={targetMenuUrl}
                    label="Menu URL"
                  />
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '13px' }}>
                No Menu ID or Subdomain assigned. Assign a Menu ID or Subdomain to generate the Menu QR code.
              </p>
            );
          })()}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmTarget)}
        title={confirmTarget?.title}
        message={confirmTarget?.message}
        confirmText={confirmTarget?.confirmText}
        variant={confirmTarget?.variant}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (confirmTarget) {
            const isDel = confirmTarget.isDeleteHotel;
            const status = confirmTarget.newStatus;
            setConfirmTarget(null);
            if (isDel) {
              await handleDeleteHotel();
            } else if (status) {
              await handleStatusChange(status);
            }
          }
        }}
      />

      <ConfirmModal
        isOpen={Boolean(deleteDishConfirmTarget)}
        title={`Permanently delete "${deleteDishConfirmTarget?.name}"?`}
        message="This will completely remove this dish from the database. It will disappear from all menus and dashboards. This action cannot be undone."
        confirmText="Delete Dish Permanently"
        variant="danger"
        onCancel={() => setDeleteDishConfirmTarget(null)}
        onConfirm={async () => {
          if (deleteDishConfirmTarget) {
            await handleDeleteDish(deleteDishConfirmTarget);
          }
        }}
      />

      <EditHotelModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        hotel={hotel}
        onSaved={(updated) => {
          setData(prev => ({
            ...prev,
            hotel: {
              ...prev.hotel,
              ...updated,
              owner_email: updated.owner_email || prev.hotel.owner_email
            }
          }));
          setMessage('Hotel configuration updated successfully.');
        }}
      />
    </div>
  );
}
