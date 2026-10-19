import {
  Customer,
  Vendor,
  Shipment,
  CustomerLedgerRecord,
  VendorLedgerRecord,
  WeightProforma,
  User,
  ProformaInvoice,
} from '@/models/types';
import {
  SEED_CUSTOMERS,
  SEED_VENDORS,
  SEED_SHIPMENTS,
  SEED_CUSTOMER_LEDGER,
  SEED_VENDOR_LEDGER,
  SEED_WEIGHT_PROFORMAS,
  SEED_USERS,
  SEED_VOUCHER_COUNTERS,
} from './seedData';

const STORAGE_KEYS = {
  USERS: 'alince_users',
  CUSTOMERS: 'alince_customers',
  VENDORS: 'alince_vendors',
  SHIPMENTS: 'alince_shipments',
  CUSTOMER_LEDGER: 'alince_customer_ledger',
  VENDOR_LEDGER: 'alince_vendor_ledger',
  WEIGHT_PROFORMAS: 'alince_weight_proformas',
  PROFORMA_INVOICES: 'alince_invoice_proformas',
  VOUCHER_COUNTERS: 'alince_voucher_counters',
  CURRENT_USER_ID: 'alince_current_user_id',
};

const BUSINESS_DATA_RESET_KEY = 'alince_mock_business_data_cleared_v1';

function clearExistingMockBusinessData(): void {
  if (import.meta.env.VITE_USE_MOCK === 'false' || localStorage.getItem(BUSINESS_DATA_RESET_KEY) === 'true') {
    return;
  }

  [
    STORAGE_KEYS.CUSTOMERS,
    STORAGE_KEYS.VENDORS,
    STORAGE_KEYS.SHIPMENTS,
    STORAGE_KEYS.CUSTOMER_LEDGER,
    STORAGE_KEYS.VENDOR_LEDGER,
    STORAGE_KEYS.WEIGHT_PROFORMAS,
    STORAGE_KEYS.PROFORMA_INVOICES,
  ].forEach(key => localStorage.setItem(key, '[]'));
  localStorage.setItem(STORAGE_KEYS.VOUCHER_COUNTERS, '{}');
  localStorage.setItem(BUSINESS_DATA_RESET_KEY, 'true');
}

clearExistingMockBusinessData();

function readItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // Only fall back to seed data when the stored value is corrupt — an empty
    // list is a valid state (e.g. the user deleted every customer).
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
}

function writeItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to write to localStorage for key ${key}`, err);
  }
}

export const storage = {
  getUsers: (): User[] => readItem<User[]>(STORAGE_KEYS.USERS, SEED_USERS),
  setUsers: (users: User[]) => writeItem(STORAGE_KEYS.USERS, users),

  getCustomers: (): Customer[] => readItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS),
  setCustomers: (c: Customer[]) => writeItem(STORAGE_KEYS.CUSTOMERS, c),

  getVendors: (): Vendor[] => readItem<Vendor[]>(STORAGE_KEYS.VENDORS, SEED_VENDORS),
  setVendors: (v: Vendor[]) => writeItem(STORAGE_KEYS.VENDORS, v),

  getShipments: (): Shipment[] => readItem<Shipment[]>(STORAGE_KEYS.SHIPMENTS, SEED_SHIPMENTS),
  setShipments: (s: Shipment[]) => writeItem(STORAGE_KEYS.SHIPMENTS, s),

  getCustomerLedger: (): CustomerLedgerRecord[] =>
    readItem<CustomerLedgerRecord[]>(STORAGE_KEYS.CUSTOMER_LEDGER, SEED_CUSTOMER_LEDGER),
  setCustomerLedger: (l: CustomerLedgerRecord[]) => writeItem(STORAGE_KEYS.CUSTOMER_LEDGER, l),

  getVendorLedger: (): VendorLedgerRecord[] =>
    readItem<VendorLedgerRecord[]>(STORAGE_KEYS.VENDOR_LEDGER, SEED_VENDOR_LEDGER),
  setVendorLedger: (l: VendorLedgerRecord[]) => writeItem(STORAGE_KEYS.VENDOR_LEDGER, l),

  getWeightProformas: (): WeightProforma[] =>
    readItem<WeightProforma[]>(STORAGE_KEYS.WEIGHT_PROFORMAS, SEED_WEIGHT_PROFORMAS),
  setWeightProformas: (wp: WeightProforma[]) => writeItem(STORAGE_KEYS.WEIGHT_PROFORMAS, wp),

  getProformaInvoices: (): ProformaInvoice[] =>
    readItem<ProformaInvoice[]>(STORAGE_KEYS.PROFORMA_INVOICES, []),
  setProformaInvoices: (rows: ProformaInvoice[]) => writeItem(STORAGE_KEYS.PROFORMA_INVOICES, rows),

  getVoucherCounters: (): Record<string, number> =>
    readItem<Record<string, number>>(STORAGE_KEYS.VOUCHER_COUNTERS, SEED_VOUCHER_COUNTERS),
  setVoucherCounters: (vc: Record<string, number>) => writeItem(STORAGE_KEYS.VOUCHER_COUNTERS, vc),

  getCurrentUserId: (): number | null => {
    const raw = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return raw ? parseInt(raw, 10) : null;
  },
  setCurrentUserId: (id: number | null) => {
    if (id === null) {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, String(id));
    }
  },

  resetAllToSeed: () => {
    writeItem(STORAGE_KEYS.USERS, SEED_USERS);
    writeItem(STORAGE_KEYS.CUSTOMERS, SEED_CUSTOMERS);
    writeItem(STORAGE_KEYS.VENDORS, SEED_VENDORS);
    writeItem(STORAGE_KEYS.SHIPMENTS, SEED_SHIPMENTS);
    writeItem(STORAGE_KEYS.CUSTOMER_LEDGER, SEED_CUSTOMER_LEDGER);
    writeItem(STORAGE_KEYS.VENDOR_LEDGER, SEED_VENDOR_LEDGER);
    writeItem(STORAGE_KEYS.WEIGHT_PROFORMAS, SEED_WEIGHT_PROFORMAS);
    writeItem(STORAGE_KEYS.PROFORMA_INVOICES, []);
    writeItem(STORAGE_KEYS.VOUCHER_COUNTERS, SEED_VOUCHER_COUNTERS);
    // Carton and expense data use their own keys — cleared by their mock services
    localStorage.removeItem('alliance_carton_types');
    localStorage.removeItem('alliance_carton_movements');
    localStorage.removeItem('alliance_expense_categories');
    localStorage.removeItem('alliance_expenses');
  },
};
