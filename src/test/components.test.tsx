import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/views/pages/LoginPage';
import { ShipmentModal } from '@/views/components/shipments/ShipmentModal';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { storage } from '@/services/mock/storage';

describe('Component: LoginPage', () => {
  it('renders an EMPTY login form with no demo credentials shown', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const userInput = screen.getByTestId('login-username-input') as HTMLInputElement;
    const passInput = screen.getByTestId('login-password-input') as HTMLInputElement;
    const submitBtn = screen.getByTestId('login-submit-btn');

    expect(userInput).toBeInTheDocument();
    expect(passInput).toBeInTheDocument();
    expect(submitBtn).toBeInTheDocument();
    expect(userInput.value).toBe('');
    expect(passInput.value).toBe('');
    expect(screen.queryByText(/Demo Credentials/i)).not.toBeInTheDocument();
    expect(screen.queryByText('admin123')).not.toBeInTheDocument();
  });

  it('shows a clear "incorrect username or password" message on a failed login', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    // the button is disabled while the app checks for an existing session
    await waitFor(() => expect(screen.getByTestId('login-submit-btn')).not.toBeDisabled());

    fireEvent.change(screen.getByTestId('login-username-input'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByTestId('login-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toHaveTextContent(/incorrect username or password/i);
    });
    expect(screen.queryByText(/session expired/i)).not.toBeInTheDocument();
  });

  it('allows user to type credentials and submit', async () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const userInput = screen.getByTestId('login-username-input') as HTMLInputElement;
    const passInput = screen.getByTestId('login-password-input') as HTMLInputElement;

    fireEvent.change(userInput, { target: { value: 'admin' } });
    fireEvent.change(passInput, { target: { value: 'admin123' } });

    expect(userInput.value).toBe('admin');
    expect(passInput.value).toBe('admin123');
  });
});

describe('Component: Permission Guards (ProtectedRoute)', () => {
  beforeEach(() => {
    storage.resetAllToSeed();
  });

  it('blocks access to restricted page when user lacks page permission', async () => {
    // Set current user as staff with only 'dashboard' and 'shipments'
    storage.setCurrentUserId(2); // ops.tariq (no 'reports' or 'users-management')

    render(
      <AuthProvider>
        <BrowserRouter>
          <ProtectedRoute pageKey="users-management">
            <div>Secret Admin Area</div>
          </ProtectedRoute>
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
      expect(screen.queryByText('Secret Admin Area')).not.toBeInTheDocument();
    });
  });

  it('keeps the Users page admin-only even if a staff account was given that permission', async () => {
    const users = storage.getUsers().map(u =>
      u.id === 2 ? { ...u, permissions: [...u.permissions, 'users-management' as const] } : u
    );
    storage.setUsers(users);
    storage.setCurrentUserId(2);

    render(
      <AuthProvider>
        <BrowserRouter>
          <ProtectedRoute pageKey="users-management">
            <div>Secret Admin Area</div>
          </ProtectedRoute>
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('Secret Admin Area')).not.toBeInTheDocument();
  });

  it('allows access when user has the matching page permission', async () => {
    // Admin user has all permissions
    storage.setCurrentUserId(1);

    render(
      <AuthProvider>
        <BrowserRouter>
          <ProtectedRoute pageKey="dashboard">
            <div>Dashboard Content Visible</div>
          </ProtectedRoute>
        </BrowserRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Content Visible')).toBeInTheDocument();
    });
  });
});

describe('Component: ShipmentModal & Walk-in Toggle', () => {
  const mockCustomers = [
    {
      id: 1,
      name: 'ABC Trading Co.',
      phone: '',
      email: '',
      city: 'Karachi',
      creditLimit: 500000,
      creditDays: 30,
      accountCode: '1-01',
      branch: 'KHI',
      openingBalance: 0,
    },
  ];

  const mockVendors = [
    {
      id: 1,
      name: 'FHL Express',
      phone: '',
      email: '',
      city: 'Karachi',
      category: 'Courier / Freight' as const,
      creditDays: 30,
      accountCode: '2-01',
      branch: 'KHI',
      openingBalance: 0,
    },
  ];

  it('toggles walk-in customer mode properly', async () => {
    const handleSave = vi.fn().mockResolvedValue({});

    render(
      <ShipmentModal
        isOpen={true}
        onClose={() => {}}
        customers={mockCustomers}
        vendors={mockVendors}
        onSave={handleSave}
      />
    );

    // Initial state: Account customer select is visible
    expect(screen.getByTestId('shipment-customer-select')).toBeInTheDocument();

    // Check walk-in toggle
    const walkInToggle = screen.getByTestId('shipment-walkin-toggle') as HTMLInputElement;
    fireEvent.click(walkInToggle);

    // Now walk-in customer name input should appear
    expect(screen.getByTestId('shipment-walkin-name-input')).toBeInTheDocument();
  });

  it('clears and disables revenue and cost for Unfinal shipments', async () => {
    const handleSave = vi.fn().mockResolvedValue({});
    const shipment = {
      id: 1,
      date: '2026-10-01',
      customerId: 1,
      customerName: 'ABC Trading Co.',
      isWalkIn: false,
      courier: 'FHL Express',
      service: 'Express',
      awb: 'AWB-UNFINAL-01',
      origin: 'SKT',
      destination: 'USA',
      pieces: 1,
      weight: 1,
      revenue: 5000,
      cost: 3000,
      status: 'Pending' as const,
      consignee: 'Consignee',
    };

    render(
      <ShipmentModal
        isOpen={true}
        onClose={() => {}}
        shipmentToEdit={shipment}
        customers={mockCustomers}
        vendors={mockVendors}
        onSave={handleSave}
      />
    );

    fireEvent.change(screen.getByTestId('shipment-status-select'), { target: { value: 'Unfinal' } });

    const revenue = screen.getByTestId('shipment-revenue-input') as HTMLInputElement;
    const cost = screen.getByTestId('shipment-cost-input') as HTMLInputElement;
    expect(revenue).toBeDisabled();
    expect(cost).toBeDisabled();
    expect(revenue.value).toBe('');
    expect(cost.value).toBe('');
    expect(screen.getByText(/clears revenue\/cost and skips ledger\/payable entries/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('save-shipment-submit-btn'));
    await waitFor(() => expect(handleSave).toHaveBeenCalled());
    expect(handleSave.mock.calls[0][0]).toMatchObject({ status: 'Unfinal', revenue: 0, cost: 0 });
  });
});
