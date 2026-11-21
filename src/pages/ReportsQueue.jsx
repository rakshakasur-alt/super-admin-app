import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchAllReports,
  supabase,
  updateReportStatusAdmin,
  deleteReportAdmin,
  setDishSuspensionAdmin,
  sendPlatformNotification
} from '../lib/supabaseClient';
import ConfirmModal from '../components/ConfirmModal';
import useDocumentTitle from '../lib/useDocumentTitle';

const REASON_LABELS = {
  fake_image: 'Fake / Misleading Image',
  wrong_dimensions: 'Incorrect Dimensions',
  misleading_ar: 'Misleading AR Scale / Model',
  wrong_price: 'Wrong Price',
  other: 'Other Issue'
};

const STATUS_COLORS = {
  open: { bg: 'var(--danger-subtle, #fef2f2)', text: 'var(--danger-fg, #991b1b)', border: 'var(--danger-border, #fecaca)' },
  reviewing: { bg: 'var(--warning-subtle, #fffbeb)', text: 'var(--warning-fg, #92400e)', border: '#fde68a' },
  resolved: { bg: 'var(--success-subtle, #f0fdf4)', text: 'var(--success-fg, #14532d)', border: '#bbf7d0' },
  dismissed: { bg: 'var(--bg-muted, #f1f5f9)', text: 'var(--text-muted, #64748b)', border: 'var(--border, #e2e8f0)' }
};

export default function ReportsQueue() {
  useDocumentTitle('Content Reports Queue');
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [message, setMessage] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  async function loadReports() {
    setLoading(true);
    const { reports: data, error } = await fetchAllReports('all');
    setLoading(false);
    if (error) {
      console.error('[ReportsQueue] fetchAllReports error:', error);
      setMessage(error.message || 'Unable to load content reports.');
    } else {
      setReports(data || []);
    }
  }

  useEffect(() => {
    loadReports();

    if (!supabase) return;

    const channel = supabase
      .channel('super-admin-reports-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_reports' },
        () => {
          loadReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleStatusChange(reportId, newStatus) {
    setActionInProgress(reportId);
    setMessage('');
    const { error } = await updateReportStatusAdmin(reportId, newStatus);
    setActionInProgress(null);

    if (error) {
      setMessage(`Failed to update report: ${error.message}`);
      return;
    }

    setMessage(`Report updated to "${newStatus}".`);
    setReports(prev =>
      prev.map(r => (r.id === reportId ? { ...r, status: newStatus } : r))
    );
  }

  async function handleDeleteReport(reportId) {
    setActionInProgress(reportId);
    setMessage('');
    const { error } = await deleteReportAdmin(reportId);
    setActionInProgress(null);

    if (error) {
      setMessage(`Failed to delete report: ${error.message}`);
      return;
    }

    setMessage('Report permanently deleted.');
    setReports(prev => prev.filter(r => r.id !== reportId));
  }

  async function handleNotifyOwner(report) {
    setActionInProgress(report.id);
    setMessage('');
    const dishName = report.dishes?.name || 'Flagged item';
    const hotelName = report.hotels?.name || 'your hotel';
    const reasonLabel = REASON_LABELS[report.reason] || report.reason;

    const { error } = await sendPlatformNotification({
      title: `Action Required: Content Report Pending on "${dishName}"`,
      message: `A guest report regarding "${reasonLabel}" on "${dishName}" is pending. Please review and resolve this report in your Reports tab promptly, or administrative action (dish suspension) will be taken.`,
      type: 'critical',
      targetType: 'hotel',
      targetValue: report.hotel_id
    });
    setActionInProgress(null);

    if (error) {
      setMessage(`Failed to notify hotel owner: ${error.message}`);
    } else {
      setMessage(`Urgent warning alert sent to ${hotelName} owner.`);
    }
  }

  async function handleToggleDishSuspension(report) {
    if (!report.dish_id) return;
    const nextSuspended = !report.dishes?.is_suspended;
    setActionInProgress(report.id);
    setMessage('');

    const { error } = await setDishSuspensionAdmin({
      dishId: report.dish_id,
      isSuspended: nextSuspended,
      reason: nextSuspended ? `Suspended due to guest content report (${report.reason})` : null
    });
    setActionInProgress(null);

    if (error) {
      setMessage(`Failed to update dish suspension: ${error.message}`);
      return;
    }

    setMessage(`Dish "${report.dishes.name}" is now ${nextSuspended ? 'suspended' : 'active'}.`);
    setReports(prev =>
      prev.map(r => {
        if (r.dish_id === report.dish_id && r.dishes) {
          return { ...r, dishes: { ...r.dishes, is_suspended: nextSuspended } };
        }
        return r;
      })
    );
  }

  const counts = {
    all: reports.length,
    open: reports.filter(r => r.status === 'open').length,
    reviewing: reports.filter(r => r.status === 'reviewing').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  };

  const filteredReports = filter === 'all'
    ? reports
    : reports.filter(r => r.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>
          Guest Content Reports
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
          Review and resolve guest flags regarding misleading photos, wrong dimensions, or inaccurate AR models.
        </p>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius)', background: 'var(--accent-subtle)', color: 'var(--accent)', fontSize: '13px', border: '1px solid var(--border)' }}>
          {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: `All Reports (${counts.all})` },
          { id: 'open', label: `Open (${counts.open})` },
          { id: 'reviewing', label: `Reviewing (${counts.reviewing})` },
          { id: 'resolved', label: `Resolved (${counts.resolved})` },
          { id: 'dismissed', label: `Dismissed (${counts.dismissed})` },
        ].map(tab => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              style={{
                background: isActive ? 'var(--primary)' : 'var(--bg)',
                color: isActive ? 'var(--primary-fg)' : 'var(--text-muted)',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                padding: '7px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Reports Table / List */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading reports…
        </div>
      ) : filteredReports.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🛡️</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>No reports found</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>There are no content reports matching the current filter.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {filteredReports.map(report => {
            const statusStyle = STATUS_COLORS[report.status] || STATUS_COLORS.open;
            return (
              <div
                key={report.id}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '20px',
                  flexWrap: 'wrap',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {report.status}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                      {REASON_LABELS[report.reason] || report.reason}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      • {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <div>
                      Hotel: <Link to={`/hotels/${report.hotel_id}`} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                        {report.hotels?.name || report.hotel_id}
                      </Link>
                    </div>
                    {report.dishes && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {report.dishes.thumbnail_url && (
                          <img
                            src={report.dishes.thumbnail_url}
                            alt={report.dishes.name}
                            style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm, 4px)', objectFit: 'cover', border: '1px solid var(--border)' }}
                          />
                        )}
                        <div>
                          Dish: <strong style={{ color: 'var(--text)' }}>{report.dishes.name}</strong> ({report.dishes.category || 'Item'})
                        </div>
                      </div>
                    )}
                  </div>

                  {report.details && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginTop: '6px' }}>
                      "{report.details}"
                    </div>
                  )}

                  <div style={{ fontSize: '11px', color: 'var(--text-placeholder)', marginTop: '8px' }}>
                    Reporter Session ID: {report.reporter_session_id}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
                  {(report.status === 'open' || report.status === 'reviewing') && (
                    <button
                      type="button"
                      disabled={actionInProgress === report.id}
                      onClick={() => handleNotifyOwner(report)}
                      title="Notify hotel owner to resolve this report or face dish suspension"
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        background: 'var(--warning-subtle)',
                        color: 'var(--warning-fg)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🔔 Warn Owner
                    </button>
                  )}

                  {report.dishes && (
                    <button
                      type="button"
                      disabled={actionInProgress === report.id}
                      onClick={() => handleToggleDishSuspension(report)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        border: report.dishes.is_suspended ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--danger-border, #fecaca)',
                        background: report.dishes.is_suspended ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                        color: report.dishes.is_suspended ? 'var(--success-fg)' : 'var(--danger-fg)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {report.dishes.is_suspended ? 'Reactivate Dish' : 'Suspend Dish'}
                    </button>
                  )}

                  {report.status !== 'reviewing' && report.status !== 'resolved' && (
                    <button
                      type="button"
                      disabled={actionInProgress === report.id}
                      onClick={() => handleStatusChange(report.id, 'reviewing')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid #fde68a',
                        background: 'var(--warning-subtle)',
                        color: 'var(--warning-fg)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Review
                    </button>
                  )}

                  {report.status !== 'resolved' && (
                    <button
                      type="button"
                      disabled={actionInProgress === report.id}
                      onClick={() => handleStatusChange(report.id, 'resolved')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid #bbf7d0',
                        background: 'var(--success-subtle)',
                        color: 'var(--success-fg)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Resolve
                    </button>
                  )}

                  {report.status !== 'dismissed' && report.status !== 'resolved' && (
                    <button
                      type="button"
                      disabled={actionInProgress === report.id}
                      onClick={() => setConfirmTarget({
                        reportId: report.id,
                        newStatus: 'dismissed',
                        title: 'Dismiss Content Report?',
                        message: 'Are you sure you want to dismiss this guest report as invalid or already addressed?',
                        confirmText: 'Dismiss Report',
                        variant: 'warning'
                      })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Dismiss
                    </button>
                  )}

                  {(report.status === 'resolved' || report.status === 'dismissed') && (
                    <button
                      type="button"
                      disabled={actionInProgress === report.id}
                      title="Permanently remove resolved report"
                      onClick={() => setConfirmTarget({
                        reportId: report.id,
                        isDelete: true,
                        title: 'Delete Resolved Report?',
                        message: 'Are you sure you want to permanently remove this resolved report from the queue? THIS CANNOT BE UNDONE.',
                        confirmText: 'Delete Report',
                        variant: 'danger'
                      })}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--danger-border, #fecaca)',
                        background: 'var(--danger-subtle)',
                        color: 'var(--danger-fg)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmTarget)}
        title={confirmTarget?.title}
        message={confirmTarget?.message}
        confirmText={confirmTarget?.confirmText}
        variant={confirmTarget?.variant}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={async () => {
          if (confirmTarget) {
            const { reportId, newStatus, isDelete } = confirmTarget;
            setConfirmTarget(null);
            if (isDelete) {
              await handleDeleteReport(reportId);
            } else if (newStatus) {
              await handleStatusChange(reportId, newStatus);
            }
          }
        }}
      />
    </div>
  );
}
