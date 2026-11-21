import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchAllHotels, supabase, updateHotelStatus, deleteHotelAdmin } from '../lib/supabaseClient';
import ConfirmModal from '../components/ConfirmModal';
import CreateHotelModal from '../components/CreateHotelModal';
import EditHotelModal from '../components/EditHotelModal';
import useDocumentTitle from '../lib/useDocumentTitle';

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e) {
    e.stopPropagation();
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
        padding: '2px 6px',
        borderRadius: 'var(--radius-sm, 4px)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '11px',
        fontWeight: 600,
        lineHeight: 1
      }}
    >
      {copied ? '✓' : '⎘'}
    </button>
  );
}

export default function HotelsList() {
  useDocumentTitle('Hotels Directory');
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const [hotels, setHotels] = useState([]);
  const [filter, setFilter] = useState(statusParam || 'all');
  const [sortBy, setSortBy] = useState('created_at');
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [message, setMessage] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);

  useEffect(() => {
    if (statusParam && statusParam !== filter) {
      setFilter(statusParam);
    }
  }, [statusParam]);

  async function loadHotels() {
    setLoading(true);
    const { hotels: data, error } = await fetchAllHotels(filter);
    setLoading(false);
    if (error) {
      console.error('[HotelsList] loadHotels error:', error);
      setMessage(`Failed to load hotels: ${error.message || 'Database error'}`);
      setHotels([]);
    } else {
      setHotels(data || []);
    }
  }

  useEffect(() => {
    loadHotels();

    if (!supabase) return;

    const channel = supabase
      .channel('super-admin-hotels-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hotels' },
        () => {
          loadHotels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  async function handleStatusChange(hotelId, newStatus) {
    setActionInProgress(hotelId);
    setMessage('');
    const { error } = await updateHotelStatus(hotelId, newStatus);
    setActionInProgress(null);

    if (error) {
      setMessage(`Failed to update status: ${error.message}`);
      return;
    }

    setMessage(`Hotel status updated to "${newStatus}".`);
    // Refresh local list state
    setHotels(prev =>
      prev.map(h => (h.id === hotelId ? { ...h, status: newStatus } : h))
    );
  }

  const counts = {
    all: hotels.length,
    pending: hotels.filter(h => h.status === 'pending').length,
    verified: hotels.filter(h => h.status === 'verified').length,
    suspended: hotels.filter(h => h.status === 'suspended').length,
  };

  function getStatusBadge(status) {
    switch (status) {
      case 'verified':
        return (
          <span style={{ background: 'var(--success-subtle)', color: 'var(--success-fg)', border: '1px solid rgba(34,197,94,0.3)', padding: '4px 10px', borderRadius: 'var(--radius-full, 999px)', fontSize: '12px', fontWeight: 700 }}>
            ● Verified
          </span>
        );
      case 'suspended':
        return (
          <span style={{ background: 'var(--danger-subtle)', color: 'var(--danger-fg)', border: '1px solid var(--danger-border, rgba(248,113,113,0.3))', padding: '4px 10px', borderRadius: 'var(--radius-full, 999px)', fontSize: '12px', fontWeight: 700 }}>
            ● Suspended
          </span>
        );
      case 'pending':
      default:
        return (
          <span style={{ background: 'var(--warning-subtle)', color: 'var(--warning-fg)', border: '1px solid rgba(251,191,36,0.3)', padding: '4px 10px', borderRadius: 'var(--radius-full, 999px)', fontSize: '12px', fontWeight: 700 }}>
            ⏳ Approval Needed
          </span>
        );
    }
  }

  return (
    <div>
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>Hotels Management</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Review registered hotel tenants, manage domain namespaces, and govern verification status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            style={{
              background: 'var(--primary)',
              border: 'none',
              color: 'var(--primary-fg, #ffffff)',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>+</span> Create Hotel
          </button>
          <button
            onClick={loadHotels}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f1f5f9',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Refreshing…' : '↻ Refresh List'}
          </button>
        </div>
      </div>

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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{message}</span>
          <button
            onClick={() => setMessage('')}
            style={{ background: 'transparent', border: 'none', color: '#c7d2fe', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Sort Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Hotels' },
            { id: 'pending', label: 'Approval Needed' },
            { id: 'verified', label: 'Verified (Live)' },
            { id: 'suspended', label: 'Suspended' },
          ].map(tab => (
            <button
              key={tab.id}
              aria-label={tab.id === 'pending' ? 'Pending Approval' : tab.label}
              onClick={() => setFilter(tab.id)}
              style={filter === tab.id ? {
                background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', padding: '6px 16px', borderRadius: 'var(--radius-full, 999px)', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
              } : {
                background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '6px 16px', borderRadius: 'var(--radius-full, 999px)', fontWeight: 500, fontSize: '13px', cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: 'var(--bg-muted)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '6px 12px',
              borderRadius: 'var(--radius)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="created_at">Newest First</option>
            <option value="visits">Most Visits</option>
            <option value="ar_views">Most AR Views</option>
            <option value="name">Hotel Name</option>
          </select>
        </div>
      </div>

      {/* Hotels list table/cards */}
      {loading ? (
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: 'var(--bg-card, var(--bg-subtle))', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="skeleton" style={{ height: '18px', width: '200px' }} />
                <div className="skeleton" style={{ height: '13px', width: '300px' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1,2,3].map(j => <div key={j} className="skeleton" style={{ height: '32px', width: '80px', borderRadius: 'var(--radius)' }} />)}
              </div>
            </div>
          ))}
        </div>
      ) : hotels.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-muted)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          No hotels found matching the filter "{filter}".
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {[...hotels]
            .sort((a, b) => {
              if (sortBy === 'visits') return (b.visit_count || 0) - (a.visit_count || 0);
              if (sortBy === 'ar_views') return (b.ar_view_count || 0) - (a.ar_view_count || 0);
              if (sortBy === 'name') return a.name.localeCompare(b.name);
              return new Date(b.created_at) - new Date(a.created_at);
            })
            .map((hotel) => {
            const isActing = actionInProgress === hotel.id;
            return (
              <div
                key={hotel.id}
                style={{
                  background: 'var(--bg-card, var(--bg-subtle))',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg, 16px)',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  transition: 'border-color var(--transition, 0.15s)',
                }}
              >
                {/* Hotel info */}
                <div style={{ minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <Link
                      to={`/hotels/${hotel.id}`}
                      style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}
                    >
                      {hotel.name}
                    </Link>
                    {getStatusBadge(hotel.status)}
                    {hotel.plan === 'pro' ? (
                      <span style={{ fontSize: '11px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                        ⭐ PRO
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                        FREE
                      </span>
                    )}
                  </div>

                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '13px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                      Subdomain:{' '}
                      <span style={{ color: hotel.subdomain ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {hotel.subdomain ? `${hotel.subdomain}.yourapp.com` : 'None assigned'}
                      </span>
                    </div>
                    {hotel.menu_id && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span>Menu ID:</span>
                        <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--text)', background: 'var(--bg-muted, rgba(255,255,255,0.06))', padding: '1px 6px', borderRadius: '4px' }}>
                          {hotel.menu_id.slice(0, 8)}…{hotel.menu_id.slice(-4)}
                        </code>
                        <CopyButton text={hotel.menu_id} label="Menu ID" />
                      </div>
                    )}
                    <div>
                      Visits: <strong style={{ color: 'var(--text)' }}>{hotel.visit_count || 0}</strong>
                    </div>
                    <div>
                      AR Views: <strong style={{ color: 'var(--text)' }}>{hotel.ar_view_count || 0}</strong>
                    </div>
                    {hotel.owner_email && (
                      <div>
                        Owner: <span style={{ color: 'var(--accent, #38bdf8)', fontWeight: 600 }}>{hotel.owner_email}</span>
                      </div>
                    )}
                    <div>
                      Dishes: <strong style={{ color: 'var(--text)' }}>{hotel.dish_count}</strong>
                    </div>
                    <div>
                      Registered: {new Date(hotel.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {hotel.menu_id && (
                    <a
                      href={`${(import.meta.env.VITE_GUEST_APP_URL || 'https://localhost:4175').replace(/\/+$/, '')}/menu/${hotel.menu_id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        borderRadius: 'var(--radius)',
                        padding: '6px 12px',
                        fontWeight: 600,
                        fontSize: '13px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Preview Guest Menu for this hotel"
                    >
                      Menu ↗
                    </a>
                  )}
                  <Link
                    to={`/hotels/${hotel.id}`}
                    style={{ background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '7px 12px', fontWeight: 500, fontSize: '13px', textDecoration: 'none' }}
                  >
                    View
                  </Link>

                  <button
                    type="button"
                    onClick={() => setEditingHotel(hotel)}
                    style={{ background: 'var(--bg-muted)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '7px 12px', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}
                  >
                    ✎ Edit
                  </button>

                  {hotel.status !== 'verified' && (
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => handleStatusChange(hotel.id, 'verified')}
                      style={{ background: 'var(--success-subtle)', color: 'var(--success-fg)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 'var(--radius)', padding: '7px 12px', fontWeight: 500, fontSize: '13px', cursor: isActing ? 'wait' : 'pointer' }}
                    >
                      ✓ Approve
                    </button>
                  )}

                  {hotel.status !== 'suspended' && (
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => setConfirmTarget({
                        hotelId: hotel.id,
                        newStatus: 'suspended',
                        title: `Suspend ${hotel.name}?`,
                        message: `Are you sure you want to suspend "${hotel.name}"? Their public menu and all QR codes will immediately go offline.`,
                        confirmText: 'Suspend Hotel',
                        variant: 'danger'
                      })}
                      style={{ background: 'var(--danger-subtle)', color: 'var(--danger-fg)', border: '1px solid var(--danger-border, rgba(248,113,113,0.3))', borderRadius: 'var(--radius)', padding: '7px 12px', fontWeight: 500, fontSize: '13px', cursor: isActing ? 'wait' : 'pointer' }}
                    >
                      Suspend
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isActing}
                    title="Delete Hotel"
                    onClick={() => setConfirmTarget({
                      hotelId: hotel.id,
                      isDelete: true,
                      title: `Delete ${hotel.name}?`,
                      message: `Are you sure you want to delete "${hotel.name}"? All associated dishes, menus, and QR codes will be permanently destroyed. THIS CANNOT BE UNDONE.`,
                      confirmText: 'Delete Hotel Permanently',
                      variant: 'danger'
                    })}
                    style={{ background: 'var(--danger-subtle)', color: 'var(--danger-fg)', border: '1px solid var(--danger-border, rgba(248,113,113,0.3))', borderRadius: 'var(--radius)', padding: '7px 10px', fontWeight: 600, fontSize: '13px', cursor: isActing ? 'wait' : 'pointer' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(confirmTarget)}
        title={confirmTarget?.title}
        message={confirmTarget?.message}
        confirmText={confirmTarget?.confirmText}
        variant={confirmTarget?.variant}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (confirmTarget) {
            const { hotelId, newStatus, isDelete } = confirmTarget;
            setConfirmTarget(null);
            if (isDelete) {
              setActionInProgress(hotelId);
              const { error } = await deleteHotelAdmin(hotelId);
              setActionInProgress(null);
              if (error) {
                setMessage(`Failed to delete hotel: ${error.message}`);
              } else {
                setMessage('Hotel successfully deleted.');
                setHotels(prev => prev.filter(h => h.id !== hotelId));
              }
            } else if (newStatus) {
              await handleStatusChange(hotelId, newStatus);
            }
          }
        }}
      />

      {/* Edit Hotel Modal */}
      <EditHotelModal
        isOpen={Boolean(editingHotel)}
        onClose={() => setEditingHotel(null)}
        hotel={editingHotel}
        onSaved={() => {
          loadHotels();
          setMessage('Hotel successfully updated.');
        }}
      />

      {/* Create Hotel Modal */}
      <CreateHotelModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          loadHotels();
        }}
      />
    </div>
  );
}
