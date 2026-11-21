import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllHotels, fetchAllReports, getHotelEngagementSummary, updateHotelStatus, updateReportStatusAdmin } from '../lib/supabaseClient';
import CreateHotelModal from '../components/CreateHotelModal';
import ConfirmModal from '../components/ConfirmModal';
import useDocumentTitle from '../lib/useDocumentTitle';

export default function Overview() {
  useDocumentTitle('Platform Overview');
  const [hotels, setHotels] = useState([]);
  const [reports, setReports] = useState([]);
  const [engagement, setEngagement] = useState({ totalVisits: 0, totalArViews: 0 });
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [hotelsRes, reportsRes, engagementRes] = await Promise.all([
        fetchAllHotels('all'),
        fetchAllReports('all'),
        getHotelEngagementSummary()
      ]);
      setHotels(hotelsRes?.hotels || []);
      setReports(reportsRes?.reports || []);
      setEngagement(engagementRes || { totalVisits: 0, totalArViews: 0 });
    } catch (err) {
      console.error('[Overview] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const pendingHotels = hotels.filter(h => h.status === 'pending');
  const verifiedHotels = hotels.filter(h => h.status === 'verified');
  const suspendedHotels = hotels.filter(h => h.status === 'suspended');
  const openReports = reports.filter(r => r.status === 'open' || r.status === 'reviewing');

  const cardStyle = {
    background: 'var(--bg-card, var(--bg))',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg, 14px)',
    padding: '20px 24px',
    boxShadow: 'var(--shadow-sm)'
  };

  async function handleApproveHotel(hotelId) {
    const { error } = await updateHotelStatus(hotelId, 'verified');
    if (!error) {
      setActionMessage('Hotel approved successfully.');
      loadData();
      setTimeout(() => setActionMessage(''), 4000);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 600 }}>
            Platform Overview
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: '26px', fontWeight: 800, color: 'var(--text)' }}>
            System Dashboard
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-fg, #ffffff)',
              border: 'none',
              borderRadius: 'var(--radius)',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>+</span> Create Hotel
          </button>
          <button
            type="button"
            onClick={loadData}
            style={{
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{ background: 'var(--success-subtle)', color: 'var(--success-fg)', border: '1px solid #bbf7d0', padding: '10px 16px', borderRadius: 'var(--radius)', fontSize: '13px', marginBottom: '20px' }}>
          {actionMessage}
        </div>
      )}

      {/* KPI Cards Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ ...cardStyle, borderTop: '3px solid var(--primary)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Hotels</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: 'var(--text)' }}>
            {hotels.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {verifiedHotels.length} active · {suspendedHotels.length} suspended
          </div>
        </div>

        <div style={{ ...cardStyle, borderTop: '3px solid var(--warning, #f59e0b)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Pending Review</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: pendingHotels.length > 0 ? 'var(--warning-fg, #b45309)' : 'var(--text)' }}>
            {pendingHotels.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {pendingHotels.length > 0 ? 'Requires administrative approval' : 'All accounts reviewed'}
          </div>
        </div>

        <div style={{ ...cardStyle, borderTop: '3px solid var(--danger-fg, #ef4444)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Open Content Reports</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: openReports.length > 0 ? 'var(--danger-fg, #dc2626)' : 'var(--text)' }}>
            {openReports.length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Flagged by menu guests
          </div>
        </div>

        <div style={{ ...cardStyle, borderTop: '3px solid #6366f1' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Guest Menu Visits</div>
          <div style={{ fontSize: '28px', fontWeight: 700, marginTop: '8px', color: 'var(--text)' }}>
            {engagement.totalVisits.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {engagement.totalArViews.toLocaleString()} 3D AR sessions
          </div>
        </div>
      </section>

      {/* Main split section: Needs Attention & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>

        {/* Pending Hotels Queue */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>⏳</span>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
                Hotels Awaiting Verification
              </h2>
            </div>
            <span style={{ fontSize: '12px', background: 'var(--warning-subtle)', color: 'var(--warning-fg)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
              {pendingHotels.length} pending
            </span>
          </div>

          {pendingHotels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              ✓ No hotels awaiting review. Everything is up to date!
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {pendingHotels.slice(0, 5).map(hotel => (
                <div
                  key={hotel.id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>{hotel.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      subdomain: {hotel.subdomain || 'none'} • {hotel.dish_count || 0} dishes
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <Link
                      to={`/hotels/${hotel.id}`}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: '12px',
                        textDecoration: 'none',
                        fontWeight: 500
                      }}
                    >
                      Details
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleApproveHotel(hotel.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: 'var(--success, #16a34a)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
              {pendingHotels.length > 5 && (
                <Link
                  to="/hotels?status=pending"
                  style={{ textAlign: 'center', fontSize: '12px', color: 'var(--accent)', fontWeight: 600, marginTop: '6px', textDecoration: 'none' }}
                >
                  View all {pendingHotels.length} pending hotels →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Open Reports Queue */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🚩</span>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
                Urgent Content Reports
              </h2>
            </div>
            <Link
              to="/reports"
              style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}
            >
              View Queue ({openReports.length}) →
            </Link>
          </div>

          {openReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              ✓ No open guest content reports.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {openReports.slice(0, 5).map(report => (
                <div
                  key={report.id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                      {report.hotels?.name || 'Hotel'} — {report.dishes?.name || 'General Dish'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--danger-fg)', marginTop: '2px' }}>
                      Reason: {report.reason?.replace('_', ' ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <Link
                      to="/reports"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        fontSize: '12px',
                        textDecoration: 'none',
                        fontWeight: 500
                      }}
                    >
                      Triage
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Hotel Modal */}
      <CreateHotelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          loadData();
        }}
      />
    </div>
  );
}
