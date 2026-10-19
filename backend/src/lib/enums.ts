import {
  VendorCategory as PrismaVendorCategory,
  ExpensePaymentMethod as PrismaExpensePaymentMethod,
  PageKey as PrismaPageKey,
} from '@prisma/client';

// ─── Vendor Category Mappings ────────────────────────────────────────────────
export const VENDOR_CATEGORY_MAP: Record<string, PrismaVendorCategory> = {
  'Courier / Freight': 'COURIER_FREIGHT',
  'COURIER_FREIGHT': 'COURIER_FREIGHT',
  'Fuel': 'FUEL',
  'FUEL': 'FUEL',
  'Office Supplies': 'OFFICE_SUPPLIES',
  'OFFICE_SUPPLIES': 'OFFICE_SUPPLIES',
  'Utilities': 'UTILITIES',
  'UTILITIES': 'UTILITIES',
  'Rent': 'RENT',
  'RENT': 'RENT',
  'Maintenance': 'MAINTENANCE',
  'MAINTENANCE': 'MAINTENANCE',
  'Other': 'OTHER',
  'OTHER': 'OTHER',
};

export const VENDOR_CATEGORY_REVERSE_MAP: Record<PrismaVendorCategory, string> = {
  COURIER_FREIGHT: 'Courier / Freight',
  FUEL: 'Fuel',
  OFFICE_SUPPLIES: 'Office Supplies',
  UTILITIES: 'Utilities',
  RENT: 'Rent',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Other',
};

export function mapVendorCategoryToKey(val: string): PrismaVendorCategory {
  return VENDOR_CATEGORY_MAP[val] || (val as PrismaVendorCategory);
}

export function mapVendorCategoryToLabel(key: PrismaVendorCategory | string): string {
  return VENDOR_CATEGORY_REVERSE_MAP[key as PrismaVendorCategory] || key;
}

// ─── Expense Payment Method Mappings ─────────────────────────────────────────
export const EXPENSE_PAYMENT_METHOD_MAP: Record<string, PrismaExpensePaymentMethod> = {
  'Cash': 'Cash',
  'Bank Transfer': 'Bank_Transfer',
  'Bank_Transfer': 'Bank_Transfer',
  'Online': 'Online',
  'Easypaisa': 'Easypaisa',
  'JazzCash': 'JazzCash',
};

export const EXPENSE_PAYMENT_METHOD_REVERSE_MAP: Record<PrismaExpensePaymentMethod, string> = {
  Cash: 'Cash',
  Bank_Transfer: 'Bank Transfer',
  Online: 'Online',
  Easypaisa: 'Easypaisa',
  JazzCash: 'JazzCash',
};

export function mapExpensePaymentMethodToKey(val: string): PrismaExpensePaymentMethod {
  return EXPENSE_PAYMENT_METHOD_MAP[val] || (val as PrismaExpensePaymentMethod);
}

export function mapExpensePaymentMethodToLabel(key: PrismaExpensePaymentMethod | string): string {
  return EXPENSE_PAYMENT_METHOD_REVERSE_MAP[key as PrismaExpensePaymentMethod] || key;
}

// ─── Page Key Mappings ───────────────────────────────────────────────────────
export const PAGE_KEY_MAP: Record<string, PrismaPageKey> = {
  'dashboard': 'dashboard',
  'shipments': 'shipments',
  'weightproforma': 'weightproforma',
  'ledger': 'ledger',
  'alerts': 'alerts',
  'reports': 'reports',
  'cartons': 'cartons',
  'expenses': 'expenses',
  'invoice-proforma': 'invoice_proforma',
  'invoice_proforma': 'invoice_proforma',
  'users-management': 'users_management',
  'users_management': 'users_management',
};

export const PAGE_KEY_REVERSE_MAP: Record<PrismaPageKey, string> = {
  dashboard: 'dashboard',
  shipments: 'shipments',
  weightproforma: 'weightproforma',
  ledger: 'ledger',
  alerts: 'alerts',
  reports: 'reports',
  cartons: 'cartons',
  expenses: 'expenses',
  users_management: 'users-management',
  invoice_proforma: 'invoice-proforma',
};

export function mapPageKeyToKey(val: string): PrismaPageKey {
  return PAGE_KEY_MAP[val] || (val as PrismaPageKey);
}

export function mapPageKeyToLabel(key: PrismaPageKey | string): string {
  return PAGE_KEY_REVERSE_MAP[key as PrismaPageKey] || key;
}

// ─── Voucher Type Mappings ───────────────────────────────────────────────────
export const VOUCHER_TYPE_MAP: Record<string, string> = {
  'AE-LOC-INV': 'AE_LOC_INV',
  'AE_LOC_INV': 'AE_LOC_INV',
  'AI-LOC-INV': 'AI_LOC_INV',
  'AI_LOC_INV': 'AI_LOC_INV',
  'EXP-INV': 'EXP_INV',
  'EXP_INV': 'EXP_INV',
  'BRV': 'BRV',
  'CRV': 'CRV',
  'JVR': 'JVR',
  'PINV': 'PINV',
  'BPV': 'BPV',
  'CPV': 'CPV',
};

export const VOUCHER_TYPE_REVERSE_MAP: Record<string, string> = {
  AE_LOC_INV: 'AE-LOC-INV',
  AI_LOC_INV: 'AI-LOC-INV',
  EXP_INV: 'EXP-INV',
  BRV: 'BRV',
  CRV: 'CRV',
  JVR: 'JVR',
  PINV: 'PINV',
  BPV: 'BPV',
  CPV: 'CPV',
};

export function mapVoucherTypeToKey(val: string): string {
  return VOUCHER_TYPE_MAP[val] || val;
}

export function mapVoucherTypeToLabel(key: string): string {
  return VOUCHER_TYPE_REVERSE_MAP[key] || key;
}
