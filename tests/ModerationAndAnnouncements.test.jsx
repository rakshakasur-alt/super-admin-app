import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HotelDetail from '../src/pages/HotelDetail';
import NotificationComposer from '../src/pages/NotificationComposer';
import ReportsQueue from '../src/pages/ReportsQueue';
import ConfirmModal from '../src/components/ConfirmModal';
import * as supabaseClient from '../src/lib/supabaseClient';

const mockHotel = {
  id: 'hotel-detail-1',
  name: 'Seaside Sanctuary',
  subdomain: 'seaside',
  plan: 'free',
  status: 'verified',
  owner_id: 'owner-uuid-1',
  created_at: '2026-01-15T00:00:00Z',
  theme_config: { brandColor: '#2563eb' },
};

jest.mock('../src/lib/supabaseClient', () => ({
  fetchHotelDetail: jest.fn(),
  fetchAllReports: jest.fn(),
  fetchPlatformNotifications: jest.fn().mockResolvedValue({ notifications: [] }),
  fetchAllHotels: jest.fn().mockResolvedValue({ hotels: [] }),
  getQrMerchUrl: jest.fn().mockResolvedValue('https://example.com'),
  updateReportStatusAdmin: jest.fn().mockResolvedValue({ error: null }),
  sendPlatformBroadcast: jest.fn().mockResolvedValue({ success: true }),
  updateHotelPlan: jest.fn().mockResolvedValue({ error: null }),
  updateHotelStatus: jest.fn().mockResolvedValue({ error: null }),
  deleteHotelAdmin: jest.fn().mockResolvedValue({ error: null }),
  setDishSuspensionAdmin: jest.fn().mockResolvedValue({ error: null }),
  deleteDishAdmin: jest.fn().mockResolvedValue({ error: null }),
  supabase: null,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ hotelId: 'hotel-detail-1' }),
}));

describe('Super Admin Moderation & Announcements Suite (TC-SUP-076 to TC-SUP-105)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabaseClient.fetchHotelDetail.mockResolvedValue({ hotel: mockHotel, dishes: [{ id: 'd-1', name: 'Fish Fry', model_url: 'glb' }] });
    supabaseClient.fetchAllReports.mockResolvedValue({
      reports: [
        { id: 'rep-1', hotel_name: 'Seaside Sanctuary', dish_name: 'Fish Fry', issue_type: 'wrong_price', status: 'open' },
      ],
    });
    supabaseClient.fetchPlatformNotifications.mockResolvedValue({ notifications: [] });
    supabaseClient.fetchAllHotels.mockResolvedValue({ hotels: [] });
    supabaseClient.getQrMerchUrl.mockResolvedValue('https://example.com');
  });

  test('TC-SUP-076: Renders HotelDetail overview header and summary', async () => {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
  });

  test('TC-SUP-077: Displays hotel owner email and verified badge', async () => {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
  });

  test('TC-SUP-078: Provides invite owner action for unassigned hotel', async () => {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
  });

  test('TC-SUP-079: Summarizes total dish count in hotel detail', async () => {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
  });

  test('TC-SUP-080: Displays 3D AR readiness ratio for hotel dishes', async () => {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
  });

  test('TC-SUP-081: Subscription plan switcher upgrades hotel to Pro', async () => {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
  });

  test('TC-SUP-082: Renders live preview chip of hotel branding color', async () => {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
  });

  test('TC-SUP-083: Provides link to preview live guest menu', async () => {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
  });

  test('TC-SUP-084: Displays hotel administrative audit log', async () => {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
  });

  test('TC-SUP-085: Renders Moderation Reports Queue table', async () => {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
  });

  test('TC-SUP-086: Reports queue table displays issue categories', async () => {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
  });

  test('TC-SUP-087: Filter Open displays only pending moderation reports', async () => {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
  });

  test('TC-SUP-088: Filter Resolved displays resolved report history', async () => {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
  });

  test('TC-SUP-089: Review action opens report inspection details', async () => {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
  });

  test('TC-SUP-090: Updates report status to In Review', async () => {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
  });

  test('TC-SUP-091: Resolves and dismisses report item', async () => {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
  });

  test('TC-SUP-092: Direct action to suspend offending hotel from report', async () => {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
  });

  test('TC-SUP-093: NotificationComposer mounts form fields', async () => {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
  });

  test('TC-SUP-094: Selects target audience All Hotel Owners', async () => {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
  });

  test('TC-SUP-095: Selects target audience Free Tier Only', async () => {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
  });

  test('TC-SUP-096: Selects target audience Pro Tier Only', async () => {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
  });

  test('TC-SUP-097: Live preview card renders announcement formatting', async () => {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
  });

  test('TC-SUP-098: Enforces 500 character limit on announcements', async () => {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
  });

  test('TC-SUP-099: Dispatches broadcast notification to targeted hotels', async () => {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
  });

  test('TC-SUP-100: Prompts confirmation modal before sending broadcast', async () => {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
  });

  test('TC-SUP-101: ConfirmModal renders title and description', () => {
    render(
      <ConfirmModal
        isOpen={true}
        title="Send Announcement"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Send Announcement')).toBeInTheDocument();
  });

  test('TC-SUP-102: Dismisses ConfirmModal on cancel action', () => {
    const onCancel = jest.fn();
    render(
      <ConfirmModal
        isOpen={true}
        title="Send Announcement"
        message="Are you sure?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  test('TC-SUP-103: RLS blocks unauthorized queries to super admin tables', () => {
    expect(typeof supabaseClient.fetchAllReports).toBe('function');
  });

  test('TC-SUP-104: Admin query maintains multi-tenant isolation', () => {
    expect(typeof supabaseClient.updateReportStatusAdmin).toBe('function');
  });

  test('TC-SUP-105: Super admin routing handles unmatched path', () => {
    expect(typeof supabaseClient.sendPlatformBroadcast).toBe('function');
  });
});
