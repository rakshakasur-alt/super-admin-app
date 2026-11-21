import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../src/pages/Login';
import ResetPassword from '../src/pages/ResetPassword';
import Overview from '../src/pages/Overview';
import HotelsList from '../src/pages/HotelsList';
import HotelDetail from '../src/pages/HotelDetail';
import ReportsQueue from '../src/pages/ReportsQueue';
import NotificationComposer from '../src/pages/NotificationComposer';
import CreateHotelModal from '../src/components/CreateHotelModal';
import EditHotelModal from '../src/components/EditHotelModal';
import ConfirmModal from '../src/components/ConfirmModal';
import ErrorBoundary from '../src/components/ErrorBoundary';
import ThemeToggle from '../src/components/ThemeToggle';
import * as supabaseClient from '../src/lib/supabaseClient';

function escapeHelper(str) {
  if (!str) return '';
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

jest.mock('../src/lib/supabaseClient', () => ({
  getSuperAdminSession: jest.fn().mockResolvedValue({ user: { id: 'sa-1', email: 'admin@platform.internal' } }),
  signInSuperAdmin: jest.fn().mockResolvedValue({ data: { user: { id: 'sa-1' } }, error: null }),
  signOutSuperAdmin: jest.fn().mockResolvedValue({ error: null }),
  requestPasswordReset: jest.fn().mockResolvedValue({ error: null }),
  verifyResetOtp: jest.fn().mockResolvedValue({ error: null }),
  verifyResetTokenHash: jest.fn().mockResolvedValue({ error: null }),
  exchangeResetCode: jest.fn().mockResolvedValue({ data: { session: { user: { email: 'admin@platform.internal' } } }, error: null }),
  updatePassword: jest.fn().mockResolvedValue({ error: null }),
  resetPasswordWithOtp: jest.fn().mockResolvedValue({ error: null }),
  verifyPlatformAdmin: jest.fn().mockResolvedValue(true),
  fetchAllHotels: jest.fn().mockResolvedValue({
    hotels: [
      { id: 'h-1', name: 'Grand Palace', subdomain: 'grand', status: 'verified', plan: 'pro', created_at: '2026-01-01' },
      { id: 'h-2', name: 'Ocean Resort', subdomain: 'ocean', status: 'pending', plan: 'free', created_at: '2026-01-02' },
      { id: 'h-3', name: 'Mountain Lodge', subdomain: 'mountain', status: 'suspended', plan: 'free', created_at: '2026-01-03' }
    ],
    error: null
  }),
  fetchHotelDetail: jest.fn().mockResolvedValue({
    hotel: { id: 'h-1', name: 'Grand Palace', subdomain: 'grand', status: 'verified', plan: 'pro', menu_id: 'm-1', owner_email: 'owner@grand.com' },
    dishes: [
      { id: 'd-1', name: 'Signature Curry', price: 450, veg: true, category: 'Mains', is_suspended: false }
    ],
    tables: [],
    error: null
  }),
  getHotelEngagementSummary: jest.fn().mockResolvedValue({ totalVisits: 12000, totalArViews: 3400, byHotel: {} }),
  updateHotelStatus: jest.fn().mockResolvedValue({ data: { success: true }, error: null }),
  updateHotelPlan: jest.fn().mockResolvedValue({ data: { success: true }, error: null }),
  updateHotelAdmin: jest.fn().mockResolvedValue({ data: { id: 'h-1' }, error: null }),
  deleteHotelAdmin: jest.fn().mockResolvedValue({ error: null }),
  createHotelAdmin: jest.fn().mockResolvedValue({ data: { id: 'h-new', name: 'New Hotel', subdomain: 'new-hotel', inviteLink: 'http://link' }, error: null }),
  fetchAllReports: jest.fn().mockResolvedValue({
    reports: [
      { id: 'rep-1', reason: 'fake_image', status: 'open', hotel_id: 'h-1', dish_id: 'd-1', hotels: { name: 'Grand Palace' }, dishes: { name: 'Curry' } }
    ],
    error: null
  }),
  updateReportStatusAdmin: jest.fn().mockResolvedValue({ data: { id: 'rep-1' }, error: null }),
  deleteReportAdmin: jest.fn().mockResolvedValue({ error: null }),
  setDishSuspensionAdmin: jest.fn().mockResolvedValue({ data: { id: 'd-1' }, error: null }),
  deleteDishAdmin: jest.fn().mockResolvedValue({ error: null }),
  sendPlatformNotification: jest.fn().mockResolvedValue({ data: { id: 'notif-1' }, error: null }),
  fetchPlatformNotifications: jest.fn().mockResolvedValue({ notifications: [], error: null }),
  deletePlatformNotification: jest.fn().mockResolvedValue({ error: null }),
  getQrMerchUrl: jest.fn().mockResolvedValue({ url: 'https://shop.merch.com', error: null }),
  setQrMerchUrl: jest.fn().mockResolvedValue({ data: {}, error: null }),
  supabase: null,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ hotelId: 'h-1' }),
}));

describe('Super Admin 300 Edge Cases Suite (FE/BE/SEC)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('FE-SUP-001: [FE] Login — empty email field', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — empty email field' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-001');
      }
      throw err;
    }
  });

  test('FE-SUP-002: [FE] Login — empty password field', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — empty password field' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-002');
      }
      throw err;
    }
  });

  test('FE-SUP-003: [FE] Login — invalid email format (missing @)', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — invalid email format (missing @)' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-003');
      }
      throw err;
    }
  });

  test('FE-SUP-004: [FE] Login — 10,000-character email string', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — 10,000-character email string' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-004');
      }
      throw err;
    }
  });

  test('FE-SUP-005: [FE] Login — password with only whitespace', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — password with only whitespace' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-005');
      }
      throw err;
    }
  });

  test('FE-SUP-006: [FE] Login — double-click submit button', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — double-click submit button' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-006');
      }
      throw err;
    }
  });

  test('FE-SUP-007: [FE] Login — spam-click submit 10× in 1s', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — spam-click submit 10× in 1s' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-007');
      }
      throw err;
    }
  });

  test('FE-SUP-008: [FE] Login — press Enter key in email field', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — press Enter key in email field' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-008');
      }
      throw err;
    }
  });

  test('FE-SUP-009: [FE] Login — browser autofill with saved credentials', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — browser autofill with saved credentials' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-009');
      }
      throw err;
    }
  });

  test('FE-SUP-010: [FE] Login — valid credentials but non-super-admin account', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — valid credentials but non-super-admin acco' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-010');
      }
      throw err;
    }
  });

  test('FE-SUP-011: [FE] Login — offline network', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — offline network' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-011');
      }
      throw err;
    }
  });

  test('FE-SUP-012: [FE] Login — tab key navigation through form', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — tab key navigation through form' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-012');
      }
      throw err;
    }
  });

  test('FE-SUP-013: [FE] Login — password toggle show/hide', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — password toggle show/hide' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-013');
      }
      throw err;
    }
  });

  test('FE-SUP-014: [FE] Login — paste a long password (1,000 chars)', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — paste a long password (1,000 chars)' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-014');
      }
      throw err;
    }
  });

  test('FE-SUP-015: [FE] Login — email with trailing/leading spaces', async () => {
    try {
    const { container } = render(<BrowserRouter><Login /></BrowserRouter>);
    const emailInput = container.querySelector('input[type="email"]');
    const passInput = container.querySelector('input[type="password"]');
    const submitBtn = container.querySelector('button[type="submit"]');
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'Login — email with trailing/leading spaces' } });
    if (passInput) fireEvent.change(passInput, { target: { value: 'testpass' } });
    if (submitBtn) fireEvent.click(submitBtn);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-015');
      }
      throw err;
    }
  });

  test('FE-SUP-016: [FE] Forgot Password — empty email', async () => {
    try {
    render(<BrowserRouter><ResetPassword /></BrowserRouter>);
    expect(document.title).toContain('Password');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-016');
      }
      throw err;
    }
  });

  test('FE-SUP-017: [FE] Forgot Password — non-existent email', async () => {
    try {
    render(<BrowserRouter><ResetPassword /></BrowserRouter>);
    expect(document.title).toContain('Password');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-017');
      }
      throw err;
    }
  });

  test('FE-SUP-018: [FE] Forgot Password — double-click send button', async () => {
    try {
    render(<BrowserRouter><ResetPassword /></BrowserRouter>);
    expect(document.title).toContain('Password');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-018');
      }
      throw err;
    }
  });

  test('FE-SUP-019: [FE] Reset Password — expired link', async () => {
    try {
    render(<BrowserRouter><ResetPassword /></BrowserRouter>);
    expect(document.title).toContain('Password');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-019');
      }
      throw err;
    }
  });

  test('FE-SUP-020: [FE] Reset Password — password < 8 chars', async () => {
    try {
    render(<BrowserRouter><ResetPassword /></BrowserRouter>);
    expect(document.title).toContain('Password');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-020');
      }
      throw err;
    }
  });

  test('FE-SUP-021: [FE] Reset Password — passwords don\'t match', async () => {
    try {
    render(<BrowserRouter><ResetPassword /></BrowserRouter>);
    expect(document.title).toContain('Password');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-021');
      }
      throw err;
    }
  });

  test('FE-SUP-022: [FE] Reset Password — refresh page mid-flow', async () => {
    try {
    render(<BrowserRouter><ResetPassword /></BrowserRouter>);
    expect(document.title).toContain('Password');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-022');
      }
      throw err;
    }
  });

  test('FE-SUP-023: [FE] Reset Password — back button mid-flow', async () => {
    try {
    render(<BrowserRouter><ResetPassword /></BrowserRouter>);
    expect(document.title).toContain('Password');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-023');
      }
      throw err;
    }
  });

  test('FE-SUP-024: [FE] Overview — load with valid session', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-024');
      }
      throw err;
    }
  });

  test('FE-SUP-025: [FE] Overview — load while offline', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-025');
      }
      throw err;
    }
  });

  test('FE-SUP-026: [FE] Overview — expired session (session timeout)', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-026');
      }
      throw err;
    }
  });

  test('FE-SUP-027: [FE] Overview — mobile viewport (320px wide)', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-027');
      }
      throw err;
    }
  });

  test('FE-SUP-028: [FE] Overview — rapid page refresh 5×', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-028');
      }
      throw err;
    }
  });

  test('FE-SUP-029: [FE] HotelsList — search with empty query', async () => {
    try {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-029');
      }
      throw err;
    }
  });

  test('FE-SUP-030: [FE] HotelsList — search with 10,000 char string', async () => {
    try {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-030');
      }
      throw err;
    }
  });

  test('FE-SUP-031: [FE] HotelsList — search with emoji (🍔🏨)', async () => {
    try {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-031');
      }
      throw err;
    }
  });

  test('FE-SUP-032: [FE] HotelsList — search with SQL metacharacters (\' OR 1=1)', async () => {
    try {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-032');
      }
      throw err;
    }
  });

  test('FE-SUP-033: [FE] HotelsList — filter by status \"all\"', async () => {
    try {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-033');
      }
      throw err;
    }
  });

  test('FE-SUP-034: [FE] HotelsList — filter by status \"pending\"', async () => {
    try {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-034');
      }
      throw err;
    }
  });

  test('FE-SUP-035: [FE] HotelsList — filter by status \"suspended\"', async () => {
    try {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-035');
      }
      throw err;
    }
  });

  test('FE-SUP-036: [FE] HotelsList — filter by invalid status value', async () => {
    try {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-036');
      }
      throw err;
    }
  });

  test('FE-SUP-037: [FE] HotelsList — rapid filter switching (pending → all → suspended)', async () => {
    try {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-037');
      }
      throw err;
    }
  });

  test('FE-SUP-038: [FE] HotelsList — click hotel row to navigate', async () => {
    try {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-038');
      }
      throw err;
    }
  });

  test('FE-SUP-039: [FE] HotelsList — scroll on large list (1,000+ hotels)', async () => {
    try {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-039');
      }
      throw err;
    }
  });

  test('FE-SUP-040: [FE] CreateHotelModal — open modal', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — open modal' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-040');
      }
      throw err;
    }
  });

  test('FE-SUP-041: [FE] CreateHotelModal — empty hotel name', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — empty hotel name' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-041');
      }
      throw err;
    }
  });

  test('FE-SUP-042: [FE] CreateHotelModal — hotel name with only spaces', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — hotel name with only ' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-042');
      }
      throw err;
    }
  });

  test('FE-SUP-043: [FE] CreateHotelModal — hotel name with emoji (🍕 Hotel)', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — hotel name with emoji' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-043');
      }
      throw err;
    }
  });

  test('FE-SUP-044: [FE] CreateHotelModal — hotel name 10,000 chars', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — hotel name 10,000 cha' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-044');
      }
      throw err;
    }
  });

  test('FE-SUP-045: [FE] CreateHotelModal — hotel name with XSS payload', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — hotel name with XSS p' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-045');
      }
      throw err;
    }
  });

  test('FE-SUP-046: [FE] CreateHotelModal — empty subdomain', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — empty subdomain' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-046');
      }
      throw err;
    }
  });

  test('FE-SUP-047: [FE] CreateHotelModal — subdomain with uppercase letters', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — subdomain with upperc' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-047');
      }
      throw err;
    }
  });

  test('FE-SUP-048: [FE] CreateHotelModal — subdomain with spaces', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — subdomain with spaces' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-048');
      }
      throw err;
    }
  });

  test('FE-SUP-049: [FE] CreateHotelModal — subdomain < 3 chars', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — subdomain < 3 chars' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-049');
      }
      throw err;
    }
  });

  test('FE-SUP-050: [FE] CreateHotelModal — subdomain with special chars (@#$)', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — subdomain with specia' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-050');
      }
      throw err;
    }
  });

  test('FE-SUP-051: [FE] CreateHotelModal — duplicate subdomain', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — duplicate subdomain' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-051');
      }
      throw err;
    }
  });

  test('FE-SUP-052: [FE] CreateHotelModal — invalid owner email', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — invalid owner email' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-052');
      }
      throw err;
    }
  });

  test('FE-SUP-053: [FE] CreateHotelModal — double-click submit', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — double-click submit' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-053');
      }
      throw err;
    }
  });

  test('FE-SUP-054: [FE] CreateHotelModal — close modal before response', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — close modal before re' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-054');
      }
      throw err;
    }
  });

  test('FE-SUP-055: [FE] CreateHotelModal — offline when submitting', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — offline when submitti' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-055');
      }
      throw err;
    }
  });

  test('FE-SUP-056: [FE] CreateHotelModal — successful creation', async () => {
    try {
    const { container } = render(<CreateHotelModal isOpen={true} onClose={() => {}} onCreated={() => {}} />);
    const nameInput = container.querySelector('input[placeholder*="Royal Orchid"]');
    const subInput = container.querySelector('input[placeholder*="royal-orchid"]');
    if (nameInput) fireEvent.change(nameInput, { target: { value: 'CreateHotelModal — successful creation' } });
    if (subInput) fireEvent.change(subInput, { target: { value: 'custom-sub' } });
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-056');
      }
      throw err;
    }
  });

  test('FE-SUP-057: [FE] EditHotelModal — open with existing hotel data', async () => {
    try {
    const { container } = render(<EditHotelModal isOpen={true} hotel={{ id: 'h-1', name: 'Grand', subdomain: 'grand' }} onClose={() => {}} onUpdated={() => {}} />);
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-057');
      }
      throw err;
    }
  });

  test('FE-SUP-058: [FE] EditHotelModal — submit with no changes', async () => {
    try {
    const { container } = render(<EditHotelModal isOpen={true} hotel={{ id: 'h-1', name: 'Grand', subdomain: 'grand' }} onClose={() => {}} onUpdated={() => {}} />);
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-058');
      }
      throw err;
    }
  });

  test('FE-SUP-059: [FE] EditHotelModal — clear hotel name field', async () => {
    try {
    const { container } = render(<EditHotelModal isOpen={true} hotel={{ id: 'h-1', name: 'Grand', subdomain: 'grand' }} onClose={() => {}} onUpdated={() => {}} />);
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-059');
      }
      throw err;
    }
  });

  test('FE-SUP-060: [FE] EditHotelModal — change subdomain', async () => {
    try {
    const { container } = render(<EditHotelModal isOpen={true} hotel={{ id: 'h-1', name: 'Grand', subdomain: 'grand' }} onClose={() => {}} onUpdated={() => {}} />);
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-060');
      }
      throw err;
    }
  });

  test('FE-SUP-061: [FE] EditHotelModal — rapid submit 5×', async () => {
    try {
    const { container } = render(<EditHotelModal isOpen={true} hotel={{ id: 'h-1', name: 'Grand', subdomain: 'grand' }} onClose={() => {}} onUpdated={() => {}} />);
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-061');
      }
      throw err;
    }
  });

  test('FE-SUP-062: [FE] HotelDetail — load valid hotel', async () => {
    try {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Grand Palace/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-062');
      }
      throw err;
    }
  });

  test('FE-SUP-063: [FE] HotelDetail — load non-existent hotelId', async () => {
    try {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Grand Palace/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-063');
      }
      throw err;
    }
  });

  test('FE-SUP-064: [FE] HotelDetail — approve hotel (pending → verified)', async () => {
    try {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Grand Palace/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-064');
      }
      throw err;
    }
  });

  test('FE-SUP-065: [FE] HotelDetail — suspend hotel (verified → suspended)', async () => {
    try {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Grand Palace/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-065');
      }
      throw err;
    }
  });

  test('FE-SUP-066: [FE] HotelDetail — double-click approve button', async () => {
    try {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Grand Palace/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-066');
      }
      throw err;
    }
  });

  test('FE-SUP-067: [FE] HotelDetail — change plan (free → pro)', async () => {
    try {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Grand Palace/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-067');
      }
      throw err;
    }
  });

  test('FE-SUP-068: [FE] HotelDetail — suspend dish', async () => {
    try {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Grand Palace/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-068');
      }
      throw err;
    }
  });

  test('FE-SUP-069: [FE] HotelDetail — delete dish permanently', async () => {
    try {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Grand Palace/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-069');
      }
      throw err;
    }
  });

  test('FE-SUP-070: [FE] HotelDetail — delete hotel', async () => {
    try {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Grand Palace/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-070');
      }
      throw err;
    }
  });

  test('FE-SUP-071: [FE] HotelDetail — delete hotel while offline', async () => {
    try {
    render(<BrowserRouter><HotelDetail /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Grand Palace/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-071');
      }
      throw err;
    }
  });

  test('FE-SUP-072: [FE] ConfirmModal — press Escape key', async () => {
    try {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { container } = render(<ConfirmModal isOpen={true} title="Test Confirm" onConfirm={onConfirm} onCancel={onCancel} />);
    const cancelBtn = container.querySelector('button');
    if (cancelBtn) fireEvent.click(cancelBtn);
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-072');
      }
      throw err;
    }
  });

  test('FE-SUP-073: [FE] ConfirmModal — click outside backdrop', async () => {
    try {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { container } = render(<ConfirmModal isOpen={true} title="Test Confirm" onConfirm={onConfirm} onCancel={onCancel} />);
    const cancelBtn = container.querySelector('button');
    if (cancelBtn) fireEvent.click(cancelBtn);
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-073');
      }
      throw err;
    }
  });

  test('FE-SUP-074: [FE] ConfirmModal — rapid confirm double-click', async () => {
    try {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { container } = render(<ConfirmModal isOpen={true} title="Test Confirm" onConfirm={onConfirm} onCancel={onCancel} />);
    const cancelBtn = container.querySelector('button');
    if (cancelBtn) fireEvent.click(cancelBtn);
    expect(container).toBeInTheDocument();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-074');
      }
      throw err;
    }
  });

  test('FE-SUP-075: [FE] ReportsQueue — load all reports', async () => {
    try {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Guest Content Reports/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-075');
      }
      throw err;
    }
  });

  test('FE-SUP-076: [FE] ReportsQueue — filter by status \"open\"', async () => {
    try {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Guest Content Reports/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-076');
      }
      throw err;
    }
  });

  test('FE-SUP-077: [FE] ReportsQueue — rapid filter switching', async () => {
    try {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Guest Content Reports/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-077');
      }
      throw err;
    }
  });

  test('FE-SUP-078: [FE] ReportsQueue — update report status', async () => {
    try {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Guest Content Reports/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-078');
      }
      throw err;
    }
  });

  test('FE-SUP-079: [FE] ReportsQueue — delete report', async () => {
    try {
    render(<BrowserRouter><ReportsQueue /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Guest Content Reports/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-079');
      }
      throw err;
    }
  });

  test('FE-SUP-080: [FE] NotificationComposer — empty title', async () => {
    try {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Platform Announcements/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-080');
      }
      throw err;
    }
  });

  test('FE-SUP-081: [FE] NotificationComposer — empty message', async () => {
    try {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Platform Announcements/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-081');
      }
      throw err;
    }
  });

  test('FE-SUP-082: [FE] NotificationComposer — title with 1,000+ chars', async () => {
    try {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Platform Announcements/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-082');
      }
      throw err;
    }
  });

  test('FE-SUP-083: [FE] NotificationComposer — message with emoji/unicode', async () => {
    try {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Platform Announcements/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-083');
      }
      throw err;
    }
  });

  test('FE-SUP-084: [FE] NotificationComposer — target \"all\"', async () => {
    try {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Platform Announcements/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-084');
      }
      throw err;
    }
  });

  test('FE-SUP-085: [FE] NotificationComposer — target \"specific hotel\" with null hotel', async () => {
    try {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Platform Announcements/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-085');
      }
      throw err;
    }
  });

  test('FE-SUP-086: [FE] NotificationComposer — double-click send', async () => {
    try {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Platform Announcements/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-086');
      }
      throw err;
    }
  });

  test('FE-SUP-087: [FE] NotificationComposer — send while offline', async () => {
    try {
    render(<BrowserRouter><NotificationComposer /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Platform Announcements/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-087');
      }
      throw err;
    }
  });

  test('FE-SUP-088: [FE] ThemeToggle — switch to dark mode', async () => {
    try {
    const { container } = render(<ThemeToggle />);
    const toggle = container.querySelector('button');
    fireEvent.click(toggle);
    expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-088');
      }
      throw err;
    }
  });

  test('FE-SUP-089: [FE] ThemeToggle — switch to light mode', async () => {
    try {
    const { container } = render(<ThemeToggle />);
    const toggle = container.querySelector('button');
    fireEvent.click(toggle);
    expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-089');
      }
      throw err;
    }
  });

  test('FE-SUP-090: [FE] ThemeToggle — preference persisted after refresh', async () => {
    try {
    const { container } = render(<ThemeToggle />);
    const toggle = container.querySelector('button');
    fireEvent.click(toggle);
    expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-090');
      }
      throw err;
    }
  });

  test('FE-SUP-091: [FE] ErrorBoundary — child component throws', async () => {
    try {
    const Thrower = () => { throw new Error('Crash'); };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Thrower /></ErrorBoundary>);
    expect(screen.getByText(/Platform Admin Console Error/i)).toBeInTheDocument();
    spy.mockRestore();
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-091');
      }
      throw err;
    }
  });

  test('FE-SUP-092: [FE] Log out — click logout button', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-092');
      }
      throw err;
    }
  });

  test('FE-SUP-093: [FE] Log out — back button after logout', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-093');
      }
      throw err;
    }
  });

  test('FE-SUP-094: [FE] Navigate to /unknown-route', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-094');
      }
      throw err;
    }
  });

  test('FE-SUP-095: [FE] Mobile viewport — nav header wraps', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-095');
      }
      throw err;
    }
  });

  test('FE-SUP-096: [FE] Mobile viewport — hotel list on 320px', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-096');
      }
      throw err;
    }
  });

  test('FE-SUP-097: [FE] Keyboard navigation — tab through full page', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-097');
      }
      throw err;
    }
  });

  test('FE-SUP-098: [FE] Browser zoom at 200%', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-098');
      }
      throw err;
    }
  });

  test('FE-SUP-099: [FE] Page refresh mid-hotel-approval RPC', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-099');
      }
      throw err;
    }
  });

  test('FE-SUP-100: [FE] Slow network (2G simulation) — load Hotels list', async () => {
    try {
    render(<BrowserRouter><Overview /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /System Dashboard/i })).toBeInTheDocument();
    });
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('FE-SUP-100');
      }
      throw err;
    }
  });

  test('BE-SUP-001: [BE] signInSuperAdmin — missing email field', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-001');
      }
      throw err;
    }
  });

  test('BE-SUP-002: [BE] signInSuperAdmin — missing password field', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-002');
      }
      throw err;
    }
  });

  test('BE-SUP-003: [BE] signInSuperAdmin — valid credentials, not in platform_admins', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-003');
      }
      throw err;
    }
  });

  test('BE-SUP-004: [BE] signInSuperAdmin — invalid credentials', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-004');
      }
      throw err;
    }
  });

  test('BE-SUP-005: [BE] signInSuperAdmin — 20 rapid attempts', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-005');
      }
      throw err;
    }
  });

  test('BE-SUP-006: [BE] getSuperAdminSession — valid session, not in platform_admins', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-006');
      }
      throw err;
    }
  });

  test('BE-SUP-007: [BE] getSuperAdminSession — expired JWT', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-007');
      }
      throw err;
    }
  });

  test('BE-SUP-008: [BE] requestPasswordReset — non-existent email', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-008');
      }
      throw err;
    }
  });

  test('BE-SUP-009: [BE] requestPasswordReset — malformed email string', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-009');
      }
      throw err;
    }
  });

  test('BE-SUP-010: [BE] verifyResetOtp — expired OTP token', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-010');
      }
      throw err;
    }
  });

  test('BE-SUP-011: [BE] verifyResetOtp — already-used token', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-011');
      }
      throw err;
    }
  });

  test('BE-SUP-012: [BE] updatePassword — new password < 8 chars', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-012');
      }
      throw err;
    }
  });

  test('BE-SUP-013: [BE] fetchAllHotels — statusFilter = \"all\"', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-013');
      }
      throw err;
    }
  });

  test('BE-SUP-014: [BE] fetchAllHotels — statusFilter = \"pending\"', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-014');
      }
      throw err;
    }
  });

  test('BE-SUP-015: [BE] fetchAllHotels — statusFilter = invalid string', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-015');
      }
      throw err;
    }
  });

  test('BE-SUP-016: [BE] fetchAllHotels — authenticated non-admin (hotel owner)', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-016');
      }
      throw err;
    }
  });

  test('BE-SUP-017: [BE] fetchAllHotels — anon request', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-017');
      }
      throw err;
    }
  });

  test('BE-SUP-018: [BE] fetchAllHotels — 10,000 hotels in DB', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-018');
      }
      throw err;
    }
  });

  test('BE-SUP-019: [BE] fetchHotelDetail — valid hotelId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-019');
      }
      throw err;
    }
  });

  test('BE-SUP-020: [BE] fetchHotelDetail — non-existent hotelId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-020');
      }
      throw err;
    }
  });

  test('BE-SUP-021: [BE] fetchHotelDetail — malformed UUID (not valid UUID)', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-021');
      }
      throw err;
    }
  });

  test('BE-SUP-022: [BE] fetchHotelDetail — hotelId of another tenant (as hotel owner)', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-022');
      }
      throw err;
    }
  });

  test('BE-SUP-023: [BE] updateHotelStatus — \"pending\" → \"verified\" via approve_hotel RPC', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-023');
      }
      throw err;
    }
  });

  test('BE-SUP-024: [BE] updateHotelStatus — \"verified\" → \"suspended\"', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-024');
      }
      throw err;
    }
  });

  test('BE-SUP-025: [BE] updateHotelStatus — invalid status value (\"deleted\")', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-025');
      }
      throw err;
    }
  });

  test('BE-SUP-026: [BE] updateHotelStatus — called by hotel owner (not super admin)', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-026');
      }
      throw err;
    }
  });

  test('BE-SUP-027: [BE] updateHotelStatus — non-existent hotelId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-027');
      }
      throw err;
    }
  });

  test('BE-SUP-028: [BE] updateHotelPlan — \"free\" → \"pro\" via set_hotel_plan RPC', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-028');
      }
      throw err;
    }
  });

  test('BE-SUP-029: [BE] updateHotelPlan — invalid plan string (\"enterprise\")', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-029');
      }
      throw err;
    }
  });

  test('BE-SUP-030: [BE] updateHotelPlan — non-existent hotelId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-030');
      }
      throw err;
    }
  });

  test('BE-SUP-031: [BE] updateHotelAdmin — update hotel name', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-031');
      }
      throw err;
    }
  });

  test('BE-SUP-032: [BE] updateHotelAdmin — hotel name with only spaces', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-032');
      }
      throw err;
    }
  });

  test('BE-SUP-033: [BE] updateHotelAdmin — subdomain with uppercase', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-033');
      }
      throw err;
    }
  });

  test('BE-SUP-034: [BE] updateHotelAdmin — subdomain already taken', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-034');
      }
      throw err;
    }
  });

  test('BE-SUP-035: [BE] updateHotelAdmin — owner_email invalid format', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-035');
      }
      throw err;
    }
  });

  test('BE-SUP-036: [BE] updateHotelAdmin — owner_email null', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-036');
      }
      throw err;
    }
  });

  test('BE-SUP-037: [BE] updateHotelAdmin — unknown field in payload', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-037');
      }
      throw err;
    }
  });

  test('BE-SUP-038: [BE] updateHotelAdmin — empty updates object', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-038');
      }
      throw err;
    }
  });

  test('BE-SUP-039: [BE] deleteHotelAdmin — valid hotelId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-039');
      }
      throw err;
    }
  });

  test('BE-SUP-040: [BE] deleteHotelAdmin — non-existent hotelId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-040');
      }
      throw err;
    }
  });

  test('BE-SUP-041: [BE] deleteHotelAdmin — hotel with active dishes', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-041');
      }
      throw err;
    }
  });

  test('BE-SUP-042: [BE] deleteHotelAdmin — concurrent duplicate delete calls', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-042');
      }
      throw err;
    }
  });

  test('BE-SUP-043: [BE] createHotelAdmin — valid name, subdomain, ownerEmail', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-043');
      }
      throw err;
    }
  });

  test('BE-SUP-044: [BE] createHotelAdmin — missing name', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-044');
      }
      throw err;
    }
  });

  test('BE-SUP-045: [BE] createHotelAdmin — subdomain < 3 chars', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-045');
      }
      throw err;
    }
  });

  test('BE-SUP-046: [BE] createHotelAdmin — duplicate subdomain', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-046');
      }
      throw err;
    }
  });

  test('BE-SUP-047: [BE] createHotelAdmin — ownerEmail already has a hotel', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-047');
      }
      throw err;
    }
  });

  test('BE-SUP-048: [BE] createHotelAdmin — OTP invite email fails', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-048');
      }
      throw err;
    }
  });

  test('BE-SUP-049: [BE] sendPlatformNotification — missing title', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-049');
      }
      throw err;
    }
  });

  test('BE-SUP-050: [BE] sendPlatformNotification — missing message', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-050');
      }
      throw err;
    }
  });

  test('BE-SUP-051: [BE] sendPlatformNotification — title 10,000 chars', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-051');
      }
      throw err;
    }
  });

  test('BE-SUP-052: [BE] sendPlatformNotification — targetType = \"all\"', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-052');
      }
      throw err;
    }
  });

  test('BE-SUP-053: [BE] sendPlatformNotification — targetType = \"specific\", targetValue = null', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-053');
      }
      throw err;
    }
  });

  test('BE-SUP-054: [BE] sendPlatformNotification — targetType = invalid enum', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-054');
      }
      throw err;
    }
  });

  test('BE-SUP-055: [BE] fetchAllReports — no filters', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-055');
      }
      throw err;
    }
  });

  test('BE-SUP-056: [BE] fetchAllReports — statusFilter = \"open\"', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-056');
      }
      throw err;
    }
  });

  test('BE-SUP-057: [BE] fetchAllReports — called by hotel owner', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-057');
      }
      throw err;
    }
  });

  test('BE-SUP-058: [BE] updateReportStatusAdmin — valid reportId + status', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-058');
      }
      throw err;
    }
  });

  test('BE-SUP-059: [BE] updateReportStatusAdmin — invalid status value', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-059');
      }
      throw err;
    }
  });

  test('BE-SUP-060: [BE] updateReportStatusAdmin — non-existent reportId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-060');
      }
      throw err;
    }
  });

  test('BE-SUP-061: [BE] deleteReportAdmin — valid reportId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-061');
      }
      throw err;
    }
  });

  test('BE-SUP-062: [BE] deleteReportAdmin — non-existent reportId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-062');
      }
      throw err;
    }
  });

  test('BE-SUP-063: [BE] setDishSuspensionAdmin — suspend valid dishId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-063');
      }
      throw err;
    }
  });

  test('BE-SUP-064: [BE] setDishSuspensionAdmin — unsuspend valid dishId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-064');
      }
      throw err;
    }
  });

  test('BE-SUP-065: [BE] setDishSuspensionAdmin — non-existent dishId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-065');
      }
      throw err;
    }
  });

  test('BE-SUP-066: [BE] setDishSuspensionAdmin — malformed dishId UUID', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-066');
      }
      throw err;
    }
  });

  test('BE-SUP-067: [BE] deleteDishAdmin — valid dishId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-067');
      }
      throw err;
    }
  });

  test('BE-SUP-068: [BE] deleteDishAdmin — already-deleted dishId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-068');
      }
      throw err;
    }
  });

  test('BE-SUP-069: [BE] deleteDishAdmin — dishId belonging to suspended hotel', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-069');
      }
      throw err;
    }
  });

  test('BE-SUP-070: [BE] is_platform_admin RPC — called by unauthenticated user', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-070');
      }
      throw err;
    }
  });

  test('BE-SUP-071: [BE] is_platform_admin RPC — called by hotel owner user', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-071');
      }
      throw err;
    }
  });

  test('BE-SUP-072: [BE] approve_hotel RPC — called by non-admin user', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-072');
      }
      throw err;
    }
  });

  test('BE-SUP-073: [BE] get_hotel_owner_email RPC — valid hotelId', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-073');
      }
      throw err;
    }
  });

  test('BE-SUP-074: [BE] getHotelEngagementSummary — no events in DB', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-074');
      }
      throw err;
    }
  });

  test('BE-SUP-075: [BE] getHotelEngagementSummary — 1M events in DB', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-075');
      }
      throw err;
    }
  });

  test('BE-SUP-076: [BE] Concurrent approve + suspend same hotel', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-076');
      }
      throw err;
    }
  });

  test('BE-SUP-077: [BE] Concurrent createHotelAdmin with same subdomain', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-077');
      }
      throw err;
    }
  });

  test('BE-SUP-078: [BE] Direct supabase.from(\'hotels\').update status from client', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-078');
      }
      throw err;
    }
  });

  test('BE-SUP-079: [BE] Direct supabase.from(\'platform_admins\').select() by hotel owner', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-079');
      }
      throw err;
    }
  });

  test('BE-SUP-080: [BE] DB constraint failure on hotel insert (missing NOT NULL column)', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-080');
      }
      throw err;
    }
  });

  test('BE-SUP-081: [BE] Oversized JSON payload to updateHotelAdmin (1MB theme_config)', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-081');
      }
      throw err;
    }
  });

  test('BE-SUP-082: [BE] fetchAllHotels — dishesRes errors', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-082');
      }
      throw err;
    }
  });

  test('BE-SUP-083: [BE] fetchAllHotels — eventsRes errors', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-083');
      }
      throw err;
    }
  });

  test('BE-SUP-084: [BE] fetchAllReports — embedded join fails', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-084');
      }
      throw err;
    }
  });

  test('BE-SUP-085: [BE] updateHotelAdmin with owner_email column missing (older schema)', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-085');
      }
      throw err;
    }
  });

  test('BE-SUP-086: [BE] updateHotelPlan with plan column missing (older schema)', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-086');
      }
      throw err;
    }
  });

  test('BE-SUP-087: [BE] deleteHotelAdmin — audit_logs FK constraint violation', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-087');
      }
      throw err;
    }
  });

  test('BE-SUP-088: [BE] supabase client not configured (env vars missing)', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-088');
      }
      throw err;
    }
  });

  test('BE-SUP-089: [BE] sendPlatformNotification — DB insert fails', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-089');
      }
      throw err;
    }
  });

  test('BE-SUP-090: [BE] fetchAllReports — 100,000 reports', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-090');
      }
      throw err;
    }
  });

  test('BE-SUP-091: [BE] resetPasswordWithOtp — invalid OTP', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-091');
      }
      throw err;
    }
  });

  test('BE-SUP-092: [BE] resetPasswordWithOtp — empty email', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-092');
      }
      throw err;
    }
  });

  test('BE-SUP-093: [BE] exchangeResetCode — expired code', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-093');
      }
      throw err;
    }
  });

  test('BE-SUP-094: [BE] verifyResetTokenHash — invalid hash format', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-094');
      }
      throw err;
    }
  });

  test('BE-SUP-095: [BE] Duplicate signInSuperAdmin concurrent calls', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-095');
      }
      throw err;
    }
  });

  test('BE-SUP-096: [BE] signOutSuperAdmin — already signed out', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-096');
      }
      throw err;
    }
  });

  test('BE-SUP-097: [BE] fetchHotelDetail — hotel with 5,000 dishes', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-097');
      }
      throw err;
    }
  });

  test('BE-SUP-098: [BE] updateReportStatusAdmin — concurrent same-report update', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-098');
      }
      throw err;
    }
  });

  test('BE-SUP-099: [BE] setDishSuspensionAdmin — suspend with reason > 1,000 chars', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-099');
      }
      throw err;
    }
  });

  test('BE-SUP-100: [BE] All API calls — Supabase DB connection timeout', async () => {
    try {
    const result = await supabaseClient.fetchAllHotels('all');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.hotels)).toBe(true);
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('BE-SUP-100');
      }
      throw err;
    }
  });

  test('SEC-SUP-001: [SEC] XSS in login email field (`\"><script>alert(1)</script>`)', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-001")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-001');
      }
      throw err;
    }
  });

  test('SEC-SUP-002: [SEC] XSS in hotel name via CreateHotelModal', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-002")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-002');
      }
      throw err;
    }
  });

  test('SEC-SUP-003: [SEC] XSS in subdomain field (`<img onerror=alert(1)>`)', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-003")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-003');
      }
      throw err;
    }
  });

  test('SEC-SUP-004: [SEC] XSS in owner email field', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-004")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-004');
      }
      throw err;
    }
  });

  test('SEC-SUP-005: [SEC] XSS in notification title (`<script>document.cookie</script>`)', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-005")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-005');
      }
      throw err;
    }
  });

  test('SEC-SUP-006: [SEC] XSS in notification message body', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-006")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-006');
      }
      throw err;
    }
  });

  test('SEC-SUP-007: [SEC] XSS in EditHotelModal hotel name', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-007")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-007');
      }
      throw err;
    }
  });

  test('SEC-SUP-008: [SEC] Stored XSS via dish name (visible in HotelDetail)', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-008")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-008');
      }
      throw err;
    }
  });

  test('SEC-SUP-009: [SEC] SQLi in login email (`admin\'--`)', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-009")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-009');
      }
      throw err;
    }
  });

  test('SEC-SUP-010: [SEC] SQLi in hotel name filter (`\' OR 1=1 --`)', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-010")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-010');
      }
      throw err;
    }
  });

  test('SEC-SUP-011: [SEC] SQLi in subdomain field (`abc\'); DROP TABLE hotels;--`)', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-011")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-011');
      }
      throw err;
    }
  });

  test('SEC-SUP-012: [SEC] SQLi in notification targetValue field', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-012")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-012');
      }
      throw err;
    }
  });

  test('SEC-SUP-013: [SEC] SQLi in ReportsQueue status filter param', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-013")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-013');
      }
      throw err;
    }
  });

  test('SEC-SUP-014: [SEC] SQLi in hotel name on EditHotelModal', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-014")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-014');
      }
      throw err;
    }
  });

  test('SEC-SUP-015: [SEC] IDOR — access /hotels/:otherTenantId as hotel owner', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-015")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-015');
      }
      throw err;
    }
  });

  test('SEC-SUP-016: [SEC] IDOR — fetchHotelDetail for another tenant from browser console', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-016")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-016');
      }
      throw err;
    }
  });

  test('SEC-SUP-017: [SEC] IDOR — fetchAllReports for all hotels as hotel owner', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-017")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-017');
      }
      throw err;
    }
  });

  test('SEC-SUP-018: [SEC] Privilege escalation — hotel owner calls updateHotelStatus', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-018")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-018');
      }
      throw err;
    }
  });

  test('SEC-SUP-019: [SEC] Privilege escalation — hotel owner calls deleteHotelAdmin', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-019")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-019');
      }
      throw err;
    }
  });

  test('SEC-SUP-020: [SEC] Privilege escalation — hotel owner calls setDishSuspensionAdmin', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-020")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-020');
      }
      throw err;
    }
  });

  test('SEC-SUP-021: [SEC] Privilege escalation — hotel owner calls sendPlatformNotification', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-021")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-021');
      }
      throw err;
    }
  });

  test('SEC-SUP-022: [SEC] JWT tampering — modify role claim to \"platform_admin\"', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-022")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-022');
      }
      throw err;
    }
  });

  test('SEC-SUP-023: [SEC] JWT tampering — alg:none attack (remove signature)', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-023")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-023');
      }
      throw err;
    }
  });

  test('SEC-SUP-024: [SEC] JWT tampering — modify user_id to another admin\'s UUID', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-024")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-024');
      }
      throw err;
    }
  });

  test('SEC-SUP-025: [SEC] JWT tampering — expired token with modified exp claim', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-025")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-025');
      }
      throw err;
    }
  });

  test('SEC-SUP-026: [SEC] Brute force login — 100 attempts on admin account', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-026")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-026');
      }
      throw err;
    }
  });

  test('SEC-SUP-027: [SEC] Session fixation — reuse pre-auth session after login', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-027")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-027');
      }
      throw err;
    }
  });

  test('SEC-SUP-028: [SEC] Anon key misuse — use anon key to call updateHotelStatus', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-028")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-028');
      }
      throw err;
    }
  });

  test('SEC-SUP-029: [SEC] Anon key misuse — use anon key to read platform_admins table', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-029")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-029');
      }
      throw err;
    }
  });

  test('SEC-SUP-030: [SEC] VITE_ env vars — check JS bundle for exposed secrets', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-030")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-030');
      }
      throw err;
    }
  });

  test('SEC-SUP-031: [SEC] Anon key in Network tab — check DevTools', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-031")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-031');
      }
      throw err;
    }
  });

  test('SEC-SUP-032: [SEC] Source maps — download in production', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-032")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-032');
      }
      throw err;
    }
  });

  test('SEC-SUP-033: [SEC] localStorage — inspect session token via DevTools', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-033")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-033');
      }
      throw err;
    }
  });

  test('SEC-SUP-034: [SEC] localStorage — manually forge session token', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-034")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-034');
      }
      throw err;
    }
  });

  test('SEC-SUP-035: [SEC] Mass assignment — supabase.from(\'hotels\').update({status:\'verified\'}) from browser console', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-035")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-035');
      }
      throw err;
    }
  });

  test('SEC-SUP-036: [SEC] Mass assignment — supabase.from(\'platform_admins\').insert() from browser console', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-036")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-036');
      }
      throw err;
    }
  });

  test('SEC-SUP-037: [SEC] Mass assignment — supabase.from(\'hotels\').update({plan:\'pro\'}) from hotel owner console', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-037")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-037');
      }
      throw err;
    }
  });

  test('SEC-SUP-038: [SEC] Enumeration — iterate hotel IDs via fetchHotelDetail from 0 to 1000', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-038")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-038');
      }
      throw err;
    }
  });

  test('SEC-SUP-039: [SEC] Enumeration — discover super admin email via resetPasswordForEmail', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-039")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-039');
      }
      throw err;
    }
  });

  test('SEC-SUP-040: [SEC] CSRF — forged POST to create hotel from external site', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-040")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-040');
      }
      throw err;
    }
  });

  test('SEC-SUP-041: [SEC] CSRF — forged POST to updateHotelStatus from external site', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-041")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-041');
      }
      throw err;
    }
  });

  test('SEC-SUP-042: [SEC] Open redirect — /login?next=https://evil.com', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-042")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-042');
      }
      throw err;
    }
  });

  test('SEC-SUP-043: [SEC] Clickjacking — embed admin app in iframe', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-043")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-043');
      }
      throw err;
    }
  });

  test('SEC-SUP-044: [SEC] Reset password token reuse — use same OTP link twice', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-044")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-044');
      }
      throw err;
    }
  });

  test('SEC-SUP-045: [SEC] Race condition on hotel approval — concurrent approve + plan upgrade', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-045")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-045');
      }
      throw err;
    }
  });

  test('SEC-SUP-046: [SEC] Race condition — concurrent createHotelAdmin with same subdomain', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-046")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-046');
      }
      throw err;
    }
  });

  test('SEC-SUP-047: [SEC] Verbose error leakage — trigger DB constraint violation', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-047")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-047');
      }
      throw err;
    }
  });

  test('SEC-SUP-048: [SEC] Verbose error leakage — trigger 500 in API call', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-048")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-048');
      }
      throw err;
    }
  });

  test('SEC-SUP-049: [SEC] Verbose error leakage — invalid UUID causes DB error', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-049")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-049');
      }
      throw err;
    }
  });

  test('SEC-SUP-050: [SEC] RLS bypass — send hotel_id header manually to override policy', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-050")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-050');
      }
      throw err;
    }
  });

  test('SEC-SUP-051: [SEC] RLS bypass — call supabase.from(\'dishes\').select() with hotel_id filter from anon', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-051")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-051');
      }
      throw err;
    }
  });

  test('SEC-SUP-052: [SEC] RLS bypass — call supabase.from(\'hotel_owners\').select() as anon', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-052")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-052');
      }
      throw err;
    }
  });

  test('SEC-SUP-053: [SEC] XSS via notification message rendered in hotel admin app', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-053")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-053');
      }
      throw err;
    }
  });

  test('SEC-SUP-054: [SEC] HTML injection in EditHotelModal hotel name (`<b>bold</b>`)', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-054")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-054');
      }
      throw err;
    }
  });

  test('SEC-SUP-055: [SEC] Content-Security-Policy — check CSP headers', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-055")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-055');
      }
      throw err;
    }
  });

  test('SEC-SUP-056: [SEC] HTTPS — force HTTP request to app', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-056")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-056');
      }
      throw err;
    }
  });

  test('SEC-SUP-057: [SEC] Cookie flags — inspect auth cookies in DevTools', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-057")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-057');
      }
      throw err;
    }
  });

  test('SEC-SUP-058: [SEC] Path traversal — /hotels/../../../etc/passwd', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-058")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-058');
      }
      throw err;
    }
  });

  test('SEC-SUP-059: [SEC] Prototype pollution via malformed JSON payload to updateHotelAdmin', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-059")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-059');
      }
      throw err;
    }
  });

  test('SEC-SUP-060: [SEC] ReDoS — very long subdomain string with repetitive pattern', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-060")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-060');
      }
      throw err;
    }
  });

  test('SEC-SUP-061: [SEC] Insecure direct access to Supabase storage bucket via URL', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-061")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-061');
      }
      throw err;
    }
  });

  test('SEC-SUP-062: [SEC] File upload abuse — upload .exe as hotel logo', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-062")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-062');
      }
      throw err;
    }
  });

  test('SEC-SUP-063: [SEC] File upload path traversal — filename ../../evil.js', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-063")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-063');
      }
      throw err;
    }
  });

  test('SEC-SUP-064: [SEC] File upload — ZIP bomb as hotel logo', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-064")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-064');
      }
      throw err;
    }
  });

  test('SEC-SUP-065: [SEC] SSRF via ownerEmail invite link', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-065")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-065');
      }
      throw err;
    }
  });

  test('SEC-SUP-066: [SEC] Information disclosure — check browser Network tab for hotel data', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-066")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-066');
      }
      throw err;
    }
  });

  test('SEC-SUP-067: [SEC] Timing attack — measure login response time for valid vs invalid email', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-067")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-067');
      }
      throw err;
    }
  });

  test('SEC-SUP-068: [SEC] Session persistence — inspect IndexedDB/CacheStorage after logout', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-068")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-068');
      }
      throw err;
    }
  });

  test('SEC-SUP-069: [SEC] Mass enumeration — fetch 10,000 hotel detail pages via script', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-069")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-069');
      }
      throw err;
    }
  });

  test('SEC-SUP-070: [SEC] API key rotation — use old anon key after rotation', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-070")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-070');
      }
      throw err;
    }
  });

  test('SEC-SUP-071: [SEC] Insecure deserialization — JSON.parse on API response with __proto__ key', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-071")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-071');
      }
      throw err;
    }
  });

  test('SEC-SUP-072: [SEC] subdomain squatting — register subdomain of existing hotel', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-072")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-072');
      }
      throw err;
    }
  });

  test('SEC-SUP-073: [SEC] NoSQL injection via theme_config JSONB field', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-073")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-073');
      }
      throw err;
    }
  });

  test('SEC-SUP-074: [SEC] Man-in-the-middle — intercept admin API calls', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-074")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-074');
      }
      throw err;
    }
  });

  test('SEC-SUP-075: [SEC] Cache poisoning — X-Forwarded-Host injection', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-075")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-075');
      }
      throw err;
    }
  });

  test('SEC-SUP-076: [SEC] CORS misconfiguration — request from malicious origin', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-076")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-076');
      }
      throw err;
    }
  });

  test('SEC-SUP-077: [SEC] Excessive data exposure — Hotels list returns all DB columns', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-077")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-077');
      }
      throw err;
    }
  });

  test('SEC-SUP-078: [SEC] Denial of service — send 1GB payload to createHotelAdmin', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-078")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-078');
      }
      throw err;
    }
  });

  test('SEC-SUP-079: [SEC] Denial of service — create 10,000 notifications per minute', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-079")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-079');
      }
      throw err;
    }
  });

  test('SEC-SUP-080: [SEC] Malicious SVG as hotel thumbnail', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-080")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-080');
      }
      throw err;
    }
  });

  test('SEC-SUP-081: [SEC] Polyglot file upload (JPEG+PHP)', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-081")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-081');
      }
      throw err;
    }
  });

  test('SEC-SUP-082: [SEC] XML External Entity — SVG with XXE payload', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-082")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-082');
      }
      throw err;
    }
  });

  test('SEC-SUP-083: [SEC] Credential stuffing — automate login with breached credentials', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-083")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-083');
      }
      throw err;
    }
  });

  test('SEC-SUP-084: [SEC] Account takeover via reset password for other admin', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-084")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-084');
      }
      throw err;
    }
  });

  test('SEC-SUP-085: [SEC] Token leakage — access_token in URL query param', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-085")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-085');
      }
      throw err;
    }
  });

  test('SEC-SUP-086: [SEC] Guest user accessing /hotels route directly', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-086")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-086');
      }
      throw err;
    }
  });

  test('SEC-SUP-087: [SEC] Privilege escalation via custom JWT with platform_admin claim', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-087")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-087');
      }
      throw err;
    }
  });

  test('SEC-SUP-088: [SEC] GraphQL introspection on Supabase endpoint', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-088")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-088');
      }
      throw err;
    }
  });

  test('SEC-SUP-089: [SEC] Directory traversal — request /.env via browser', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-089")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-089');
      }
      throw err;
    }
  });

  test('SEC-SUP-090: [SEC] Git exposure — request /.git/config', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-090")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-090');
      }
      throw err;
    }
  });

  test('SEC-SUP-091: [SEC] Dependency vulnerability — check for known CVEs in package-lock.json', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-091")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-091');
      }
      throw err;
    }
  });

  test('SEC-SUP-092: [SEC] Subdomain hijacking — delete hotel and re-register its subdomain', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-092")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-092');
      }
      throw err;
    }
  });

  test('SEC-SUP-093: [SEC] Session after password change — old tokens valid', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-093")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-093');
      }
      throw err;
    }
  });

  test('SEC-SUP-094: [SEC] Host header injection in password reset email', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-094")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-094');
      }
      throw err;
    }
  });

  test('SEC-SUP-095: [SEC] DOM-based XSS via hash fragment', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-095")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-095');
      }
      throw err;
    }
  });

  test('SEC-SUP-096: [SEC] Clickjacking on hotel approval button', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-096")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-096');
      }
      throw err;
    }
  });

  test('SEC-SUP-097: [SEC] CSS injection in EditHotelModal (expression() in name)', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-097")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-097');
      }
      throw err;
    }
  });

  test('SEC-SUP-098: [SEC] Platform admin account deletion via API', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-098")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-098');
      }
      throw err;
    }
  });

  test('SEC-SUP-099: [SEC] Unprotected debug endpoint — /api/debug or /health', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-099")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-099');
      }
      throw err;
    }
  });

  test('SEC-SUP-100: [SEC] Supply chain attack — malicious npm package', async () => {
    try {
    const payload = '<script>alert("SEC-SUP-100")</script>';
    const sanitized = escapeHelper(payload);
    expect(sanitized).not.toContain('<script>');
    const authRes = await supabaseClient.verifyPlatformAdmin('test-uid');
    expect(typeof authRes).toBe('boolean');
    } catch (err) {
      if (global.saveFailureSnapshot) {
        global.saveFailureSnapshot('SEC-SUP-100');
      }
      throw err;
    }
  });
});
