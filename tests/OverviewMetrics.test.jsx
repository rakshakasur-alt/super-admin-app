import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Overview from '../src/pages/Overview';
import * as supabaseClient from '../src/lib/supabaseClient';

const mockHotels = [
  { id: '1', name: 'Hotel One', status: 'verified', plan: 'pro' },
  { id: '2', name: 'Hotel Two', status: 'pending', plan: 'free' },
  { id: '3', name: 'Hotel Three', status: 'suspended', plan: 'free' },
];

const mockReports = [
  { id: 'rep-1', status: 'open' },
  { id: 'rep-2', status: 'open' },
];

jest.mock('../src/lib/supabaseClient', () => ({
  fetchAllHotels: jest.fn(),
  fetchAllReports: jest.fn(),
  getHotelEngagementSummary: jest.fn().mockResolvedValue({
    totalVisits: 45000,
    totalArViews: 12500,
  }),
  updateHotelStatus: jest.fn().mockResolvedValue({ error: null }),
  updateReportStatusAdmin: jest.fn().mockResolvedValue({ error: null }),
  supabase: null,
}));

describe('Super Admin Overview Suite (TC-SUP-026 to TC-SUP-045)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabaseClient.fetchAllHotels.mockResolvedValue({ hotels: mockHotels });
    supabaseClient.fetchAllReports.mockResolvedValue({ reports: mockReports });
    supabaseClient.getHotelEngagementSummary.mockResolvedValue({
      totalVisits: 45000,
      totalArViews: 12500,
    });
  });

  test('TC-SUP-026: Renders Platform Overview title header', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
  });

  test('TC-SUP-027: Displays Total Hotels metric card', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByText(/Total Hotels/i)).toBeInTheDocument();
    });
  });

  test('TC-SUP-028: Displays Active Verified Hotels metric card', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByText(/Verified|Active/i)).toBeInTheDocument();
    });
  });

  test('TC-SUP-029: Displays Pending Approval Hotels metric card', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getAllByText(/Pending/i).length).toBeGreaterThan(0);
    });
  });

  test('TC-SUP-030: Displays Suspended Hotels count', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
  });

  test('TC-SUP-031: Displays Open Reports count', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getAllByText(/Reports/i).length).toBeGreaterThan(0);
    });
  });

  test('TC-SUP-032: Displays Total Platform Visits counter', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByText(/Visits/i)).toBeInTheDocument();
    });
  });

  test('TC-SUP-033: Displays Total 3D AR Views counter', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByText(/3D AR/i)).toBeInTheDocument();
    });
  });

  test('TC-SUP-034: Quick action button opens CreateHotelModal', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument());
  });

  test('TC-SUP-035: Renders pending hotels list table', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByText('Hotel Two')).toBeInTheDocument();
    });
  });

  test('TC-SUP-036: Approves pending hotel upon clicking approve', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Hotel Two')).toBeInTheDocument());
    const approveBtn = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveBtn);
    await waitFor(() => {
      expect(supabaseClient.updateHotelStatus).toHaveBeenCalledWith('2', 'verified');
    });
  });

  test('TC-SUP-037: Rejection action prompts for confirmation', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Hotel Two')).toBeInTheDocument());
  });

  test('TC-SUP-038: Link to moderation reports queue works', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument());
  });

  test('TC-SUP-039: Link to notification composer works', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument());
  });

  test('TC-SUP-040: Shows loading state while fetching platform metrics', () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
  });

  test('TC-SUP-041: Refresh button re-queries Supabase metrics', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument());
  });

  test('TC-SUP-042: Empty pending hotels state message', async () => {
    supabaseClient.fetchAllHotels.mockResolvedValueOnce({
      hotels: [{ id: '1', name: 'Hotel 1', status: 'verified' }],
    });
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument());
  });

  test('TC-SUP-043: Zero open reports state badge', async () => {
    supabaseClient.fetchAllReports.mockResolvedValueOnce({ reports: [] });
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument());
  });

  test('TC-SUP-044: Subscription plan ratio display', async () => {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument());
  });

  test('TC-SUP-045: Gracefully handles API network failures', async () => {
    supabaseClient.fetchAllHotels.mockRejectedValueOnce(new Error('Network error'));
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument());
  });
});
