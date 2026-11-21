import { useState, useEffect } from 'react';
import { updateHotelAdmin } from '../lib/supabaseClient';

const STATUS_OPTIONS = [
  { value: 'verified', label: 'Verified (Live)' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'suspended', label: 'Suspended (Offline)' },
];

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'AED', label: 'AED (د.إ)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'SGD', label: 'SGD (S$)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

export default function EditHotelModal({ isOpen, onClose, hotel, onSaved }) {
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [status, setStatus] = useState('verified');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [operatingHours, setOperatingHours] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hotel) {
      setName(hotel.name || '');
      setSubdomain(hotel.subdomain || '');
      setStatus(hotel.status || 'verified');
      setOwnerEmail(hotel.owner_email || '');
      // Contact details live in real hotels columns (phone, contact_email,
      // operating_hours, address) — the same ones the hotel admin app writes.
      // theme_config.profile holds them only on databases missing a column.
      const profile = hotel.theme_config?.profile || {};
      setCurrency(hotel.currency || hotel.theme_config?.currency || 'INR');
      setPhone(hotel.phone || profile.phone || '');
      setContactEmail(hotel.contact_email || profile.contact_email || '');
      setOperatingHours(hotel.operating_hours || profile.operating_hours || '');
      setAddress(hotel.address || profile.address || hotel.theme_config?.address || '');
      const coords = hotel.coordinates || hotel.theme_config?.coordinates || null;
      setLat(coords?.lat != null ? String(coords.lat) : '');
      setLng(coords?.lng != null ? String(coords.lng) : '');
      setError('');
    }
  }, [hotel, isOpen]);

  if (!isOpen || !hotel) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const cleanSub = subdomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!name.trim()) {
      setError('Hotel name is required.');
      setSubmitting(false);
      return;
    }
    if (!cleanSub || cleanSub.length < 3) {
      setError('Subdomain must be at least 3 characters long.');
      setSubmitting(false);
      return;
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedCoords = (!isNaN(parsedLat) && !isNaN(parsedLng))
      ? { lat: parsedLat, lng: parsedLng }
      : (hotel.coordinates || null);

    const currentThemeConfig = hotel.theme_config || {};
    const updatedThemeConfig = {
      ...currentThemeConfig,
      currency: currency.toUpperCase(),
      coordinates: parsedCoords,
      address: address.trim()
    };

    // There is no `contact_info` column on hotels — writing it made PostgREST
    // reject the whole update ("Could not find the 'contact_info' column").
    const updates = {
      name: name.trim(),
      subdomain: cleanSub,
      status,
      currency: currency.toUpperCase(),
      phone: phone.trim() || null,
      contact_email: contactEmail.trim().toLowerCase() || null,
      operating_hours: operatingHours.trim() || null,
      address: address.trim(),
      coordinates: parsedCoords,
      owner_email: ownerEmail.trim() || null,
      theme_config: updatedThemeConfig
    };

    const { data, error: updateErr } = await updateHotelAdmin(hotel.id, updates);
    setSubmitting(false);

    if (updateErr) {
      setError(updateErr.message || 'Failed to update hotel.');
      return;
    }

    onSaved?.(data);
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
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: 'var(--shadow-lg, 0 20px 40px rgba(0, 0, 0, 0.25))',
          padding: '28px',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'modalEnter 0.18s ease-out',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text, #0f172a)' }}>
              Edit Hotel Details
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
              Update tenant configuration, status, and owner information.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Hotel Name *
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
              >
                {(hotel.status === 'pending'
                  ? [
                      { value: 'pending', label: 'Approval Needed' },
                      { value: 'verified', label: 'Verified (Live)' },
                      { value: 'suspended', label: 'Suspended (Offline)' }
                    ]
                  : [
                      { value: 'verified', label: 'Verified (Live)' },
                      { value: 'suspended', label: 'Suspended (Offline)' }
                    ]
                ).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
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
              >
                {CURRENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Owner Contact / Login Email
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                Support Email
              </label>
              <input
                type="email"
                placeholder="contact@hotel.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Operating Hours
            </label>
            <input
              type="text"
              placeholder="e.g. Mon-Sun: 11:00 AM - 11:00 PM"
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
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
              Physical Address
            </label>
            <input
              type="text"
              placeholder="e.g. 123 Connaught Place, New Delhi"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Latitude
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 28.6139"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
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
                Longitude
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 77.2090"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
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
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
