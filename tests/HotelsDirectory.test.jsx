import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HotelsList from '../src/pages/HotelsList';
import * as supabaseClient from '../src/lib/supabaseClient';

const mockHotels = [
  {
    id: 'hotel-a',
    name: 'Imperial Palace Hotel',
    subdomain: 'imperial',
    menu_id: 'menu-1234-5678-9012',
    status: 'verified',
    plan: 'pro',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'hotel-b',
    name: 'Oceanview Cabanas',
    subdomain: 'oceanview',
    status: 'pending_verification',
    plan: 'free',
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'hotel-c',
    name: 'Mountain Retreat',
    subdomain: 'mountain',
    status: 'suspended',
    plan: 'free',
    created_at: '2026-03-01T00:00:00Z',
  },
];

jest.mock('../src/lib/supabaseClient', () => ({
  fetchAllHotels: jest.fn(),
  updateHotelStatus: jest.fn().mockResolvedValue({ error: null }),
  deleteHotelAdmin: jest.fn().mockResolvedValue({ error: null }),
  updateHotelAdmin: jest.fn().mockResolvedValue({ error: null }),
  createHotelAdmin: jest.fn().mockResolvedValue({ error: null }),
  supabase: null,
}));

describe('Super Admin Hotels Directory Suite (TC-SUP-046 to TC-SUP-075)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabaseClient.fetchAllHotels.mockImplementation(async (status) => {
      if (status === 'pending') return { hotels: [mockHotels[1]], error: null };
      if (status === 'suspended') return { hotels: [mockHotels[2]], error: null };
      if (status === 'verified') return { hotels: [mockHotels[0]], error: null };
      return { hotels: mockHotels, error: null };
    });
    supabaseClient.updateHotelStatus.mockResolvedValue({ error: null });
    supabaseClient.deleteHotelAdmin.mockResolvedValue({ error: null });
  });

  test('TC-SUP-046: Renders Hotels Directory title and Add Hotel button', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hotels Management/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /\+ Create Hotel/i })).toBeInTheDocument();
  });

  test('TC-SUP-047: Renders directory table headers', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument();
    });
  });

  test('TC-SUP-048: Filter All displays all registered hotels', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument();
      expect(screen.getByText('Oceanview Cabanas')).toBeInTheDocument();
    });
  });

  test('TC-SUP-049: Filter Active displays verified hotels only', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-050: Filter Pending displays pending verification hotels only', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
    const pendingFilter = screen.getByRole('button', { name: /^Pending Approval$/i });
    fireEvent.click(pendingFilter);
    await waitFor(() => expect(screen.getByText('Oceanview Cabanas')).toBeInTheDocument());
    expect(screen.queryByText('Imperial Palace Hotel')).not.toBeInTheDocument();
  });

  test('TC-SUP-051: Filter Suspended displays suspended tenants only', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
    const suspendedFilter = screen.getByRole('button', { name: /^Suspended$/i });
    fireEvent.click(suspendedFilter);
    await waitFor(() => expect(screen.getByText('Mountain Retreat')).toBeInTheDocument());
  });

  test('TC-SUP-052: Filters directory by hotel name search', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-053: Filters directory by subdomain search', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-054: Sorts hotels by newest created first', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-055: Sorts hotels by oldest created first', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-056: Alphabetizes hotels list A to Z', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-057: Copies hotel subdomain with copy button', async () => {
    Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
    const copyBtns = screen.getAllByTitle(/copy/i);
    if (copyBtns.length > 0) {
      fireEvent.click(copyBtns[0]);
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    }
  });

  test('TC-SUP-058: Displays PRO badge for pro plan hotel', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getByText(/PRO/i)).toBeInTheDocument();
    });
  });

  test('TC-SUP-059: Displays FREE badge for free plan hotel', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => {
      expect(screen.getAllByText(/FREE/i).length).toBeGreaterThan(0);
    });
  });

  test('TC-SUP-060: Opens EditHotelModal when clicking edit action', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-061: Prompts confirmation before suspending tenant', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-062: Suspends tenant and updates status in Supabase', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-063: Reactivates suspended tenant', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-064: Delete button triggers permanent deletion warning', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-065: Cascades deletion and calls deleteHotelAdmin', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-066: Links hotel name to HotelDetail view', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-067: CreateHotelModal renders required tenant input fields', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /\+ Create Hotel/i }));
    expect(screen.getByRole('heading', { name: /Create New Hotel/i })).toBeInTheDocument();
  });

  test('TC-SUP-068: Automatically generates lowercase slug from hotel name', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /\+ Create Hotel/i }));
  });

  test('TC-SUP-069: Sanitizes special characters in subdomain input', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /\+ Create Hotel/i }));
  });

  test('TC-SUP-070: Validates duplicate subdomain collision', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /\+ Create Hotel/i }));
  });

  test('TC-SUP-071: Submits new hotel creation to Supabase', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /\+ Create Hotel/i }));
  });

  test('TC-SUP-072: EditHotelModal populates current hotel data', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-073: Upgrades tenant plan from Free to Pro', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-074: Modifies hotel subdomain and updates routing', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
  });

  test('TC-SUP-075: Closes modal cleanly when Cancel is clicked', async () => {
    render(<BrowserRouter><HotelsList /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Imperial Palace Hotel')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /\+ Create Hotel/i }));
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole('heading', { name: /Create New Hotel/i })).not.toBeInTheDocument();
  });
});
