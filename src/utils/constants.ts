  import { PageKey, ShipmentStatus, CourierServiceType, PaymentMethod, VendorCategory } from '@/models/types';

  export const STATUS_OPTIONS: ShipmentStatus[] = ['Pending', 'Shipped', 'Delivered', 'Returned', 'Unfinal'];

  export const SERVICE_OPTIONS: CourierServiceType[] = ['Express', 'Economy', 'Standard', 'Overnight'];

  export const PAYMENT_METHODS: PaymentMethod[] = [
    'Cash',
    'Bank Transfer',
    'Cheque',
    'Online',
    'Easypaisa',
    'JazzCash',
  ];

  export const VENDOR_CATEGORIES: VendorCategory[] = [
    'Courier / Freight',
    'Fuel',
    'Office Supplies',
    'Utilities',
    'Rent',
    'Maintenance',
    'Other',
  ];

  export const ALL_PAGE_KEYS: PageKey[] = [
    'dashboard',
    'shipments',
    'weightproforma',
    'ledger',
    'alerts',
    'reports',
    'cartons',
    'expenses',
    'users-management',
  ];

  /** Pages an admin may tick for a normal user. "User Accounts" is admin-only, so it is never offered. */
  export const ASSIGNABLE_PAGE_KEYS: PageKey[] = ALL_PAGE_KEYS.filter(k => k !== 'users-management');

  export const PAGE_TITLES: Record<PageKey | 'invoices', { title: string; sub: string }> = {
    invoices: {
      title: 'Payments',
      sub: 'Shipment invoices issued to customers and bills received from vendors',
    },
    dashboard: {
      title: 'Dashboard Overview',
      sub: 'Track shipments, revenue and customer balances',
    },
    shipments: {
      title: 'Daily Shipment Log',
      sub: 'Every shipment, its status, and its margin',
    },
    weightproforma: {
      title: 'Weight Proforma',
      sub: 'Box-by-box actual vs dimensional & chargeable weight calculations',
    },
    ledger: {
      title: 'Customer & Vendor Ledger',
      sub: 'Balances, credit limits and payment history',
    },
    alerts: {
      title: 'Payment Alerts',
      sub: 'Every customer whose invoice was not paid on time — newest breach first',
    },
    reports: {
      title: 'Analytics & Reports',
      sub: 'Deeper breakdowns across couriers, destinations and customers',
    },
    cartons: {
      title: 'Cartons & Boxes Inventory',
      sub: 'Append-only stock ledger — track every movement in and out',
    },
    expenses: {
      title: 'Daily Expenses',
      sub: 'Track operational costs, salaries, fuel, rent and more',
    },
    'users-management': {
      title: 'User Accounts',
      sub: 'Create staff accounts and control exactly which pages each one can open',
    },
    'invoice-proforma': {
      title: 'Invoice Proforma',
      sub: 'Generate shipment proforma invoices for customers',
    },
  };

  export const COURIER_THEME_COLORS: Record<string, string> = {
    'FHL Express': '#10B981',
    'UPS Pakistan': '#D97706',
    'DHL Global Forwarding': '#EF4444',
    'DPEX Worldwide': '#06B6D4',
    'FedEx Express': '#3B82F6',
    'DPD Logistics': '#8B5CF6',
    FHL: '#10B981',
    UPS: '#D97706',
    DHL: '#EF4444',
    DPEX: '#06B6D4',
    FedEx: '#3B82F6',
    DPD: '#8B5CF6',
  };
