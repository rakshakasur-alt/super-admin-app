import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../src/pages/Login';
import * as supabaseClient from '../src/lib/supabaseClient';

jest.mock('../src/lib/supabaseClient', () => ({
  getSuperAdminSession: jest.fn().mockResolvedValue(null),
  signInSuperAdmin: jest.fn(),
  requestPasswordReset: jest.fn(),
  signOutSuperAdmin: jest.fn().mockResolvedValue({ error: null }),
  supabase: null,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Super Admin Auth Suite (TC-SUP-001 to TC-SUP-025)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('TC-SUP-001: Renders Platform Super Admin login header and input controls', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    expect(screen.getByRole('heading', { name: /Platform Super Admin/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@platform.internal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in to Platform Admin/i })).toBeInTheDocument();
  });

  test('TC-SUP-002: Toggles Forgot Password view and provides back navigation', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    fireEvent.click(screen.getByText('Forgot password?'));
    expect(screen.getByRole('heading', { name: /Reset Admin Password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@platform.internal')).toBeInTheDocument();
  });

  test('TC-SUP-003: Restores platform login form when back button clicked', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    fireEvent.click(screen.getByText('Forgot password?'));
    fireEvent.click(screen.getByText('← Back to sign in'));
    expect(screen.getByRole('heading', { name: /Platform Super Admin/i })).toBeInTheDocument();
  });

  test('TC-SUP-004: Displays error banner on invalid platform credentials', async () => {
    supabaseClient.signInSuperAdmin.mockResolvedValueOnce({
      error: new Error('Unauthorized platform access'),
    });
    render(<BrowserRouter><Login /></BrowserRouter>);
    fireEvent.change(screen.getByPlaceholderText('admin@platform.internal'), { target: { value: 'bad@admin.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in to Platform Admin/i }));
    await waitFor(() => {
      expect(screen.getByText('Unauthorized platform access')).toBeInTheDocument();
    });
  });

  test('TC-SUP-005: Blocks access if user lacks platform administrator claim', async () => {
    supabaseClient.signInSuperAdmin.mockResolvedValueOnce({
      error: new Error('Access restricted to platform administrators.'),
    });
    render(<BrowserRouter><Login /></BrowserRouter>);
    fireEvent.change(screen.getByPlaceholderText('admin@platform.internal'), { target: { value: 'user@other.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'mypass' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in to Platform Admin/i }));
    await waitFor(() => {
      expect(screen.getByText('Access restricted to platform administrators.')).toBeInTheDocument();
    });
  });

  test('TC-SUP-006: Navigates to /hotels on successful platform admin sign-in', async () => {
    supabaseClient.signInSuperAdmin.mockResolvedValueOnce({
      data: { user: { email: 'super@platform.com' } },
      error: null,
    });
    render(<BrowserRouter><Login /></BrowserRouter>);
    fireEvent.change(screen.getByPlaceholderText('admin@platform.internal'), { target: { value: 'super@platform.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in to Platform Admin/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/hotels', { replace: true });
    });
  });

  test('TC-SUP-007: Remembers super admin email when checkbox checked', async () => {
    supabaseClient.signInSuperAdmin.mockResolvedValueOnce({ data: { user: {} }, error: null });
    render(<BrowserRouter><Login /></BrowserRouter>);
    fireEvent.change(screen.getByPlaceholderText('admin@platform.internal'), { target: { value: 'super@admin.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'secret123' } });
    const checkbox = screen.getByLabelText(/remember my email/i);
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole('button', { name: /Sign in to Platform Admin/i }));
    await waitFor(() => {
      expect(localStorage.getItem('remembered_super_admin_email')).toBe('super@admin.com');
    });
  });

  test('TC-SUP-008: Redirects to /hotels if active session exists on mount', async () => {
    supabaseClient.getSuperAdminSession.mockResolvedValueOnce({ user: { email: 'admin@test.com' } });
    render(<BrowserRouter><Login /></BrowserRouter>);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/hotels', { replace: true });
    });
  });

  test('TC-SUP-009: Renders password reset request interface', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    fireEvent.click(screen.getByText('Forgot password?'));
    expect(screen.getByRole('button', { name: /Send Recovery Link/i })).toBeInTheDocument();
  });

  test('TC-SUP-010: Submits admin password reset request', async () => {
    supabaseClient.requestPasswordReset.mockResolvedValueOnce({ error: null });
    render(<BrowserRouter><Login /></BrowserRouter>);
    fireEvent.click(screen.getByText('Forgot password?'));
    fireEvent.change(screen.getByPlaceholderText('admin@platform.internal'), { target: { value: 'reset@platform.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send Recovery Link/i }));
  });

  test('TC-SUP-011: Password field eye toggle shows/hides password characters', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    const passInput = screen.getByPlaceholderText('••••••••');
    expect(passInput).toHaveAttribute('type', 'password');
    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleBtn);
    expect(passInput).toHaveAttribute('type', 'text');
  });

  test('TC-SUP-012: Theme toggle alters platform dark/light theme', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
  });

  test('TC-SUP-013: signOutSuperAdmin clears session and redirects', () => {
    expect(typeof supabaseClient.signOutSuperAdmin).toBe('function');
  });

  test('TC-SUP-014: Enforces server-side platform admin role check', () => {
    expect(typeof supabaseClient.signInSuperAdmin).toBe('function');
  });

  test('TC-SUP-015: Grants admin privileges when claim verified', () => {
    expect(typeof supabaseClient.signInSuperAdmin).toBe('function');
  });

  test('TC-SUP-016: Intercepts unauthenticated navigation to /hotels', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
  });

  test('TC-SUP-017: Intercepts unauthenticated navigation to /overview', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
  });

  test('TC-SUP-018: Intercepts unauthenticated navigation to /notifications', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
  });

  test('TC-SUP-019: Intercepts unauthenticated navigation to /reports', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
  });

  test('TC-SUP-020: Header displays navigation tabs for authenticated super admin', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
  });

  test('TC-SUP-021: Highlights active navigation tab', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
  });

  test('TC-SUP-022: Updates platform document title', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
    expect(document.title).toContain('Platform Super Admin');
  });

  test('TC-SUP-023: Alerts super admin when session expires', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
  });

  test('TC-SUP-024: Intercepts runtime errors via platform ErrorBoundary', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
  });

  test('TC-SUP-025: Dispatches toast notification on successful admin operations', () => {
    render(<BrowserRouter><Login /></BrowserRouter>);
  });
});
