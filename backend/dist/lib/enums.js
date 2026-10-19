"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOUCHER_TYPE_REVERSE_MAP = exports.VOUCHER_TYPE_MAP = exports.PAGE_KEY_REVERSE_MAP = exports.PAGE_KEY_MAP = exports.EXPENSE_PAYMENT_METHOD_REVERSE_MAP = exports.EXPENSE_PAYMENT_METHOD_MAP = exports.VENDOR_CATEGORY_REVERSE_MAP = exports.VENDOR_CATEGORY_MAP = void 0;
exports.mapVendorCategoryToKey = mapVendorCategoryToKey;
exports.mapVendorCategoryToLabel = mapVendorCategoryToLabel;
exports.mapExpensePaymentMethodToKey = mapExpensePaymentMethodToKey;
exports.mapExpensePaymentMethodToLabel = mapExpensePaymentMethodToLabel;
exports.mapPageKeyToKey = mapPageKeyToKey;
exports.mapPageKeyToLabel = mapPageKeyToLabel;
exports.mapVoucherTypeToKey = mapVoucherTypeToKey;
exports.mapVoucherTypeToLabel = mapVoucherTypeToLabel;
// ─── Vendor Category Mappings ────────────────────────────────────────────────
exports.VENDOR_CATEGORY_MAP = {
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
exports.VENDOR_CATEGORY_REVERSE_MAP = {
    COURIER_FREIGHT: 'Courier / Freight',
    FUEL: 'Fuel',
    OFFICE_SUPPLIES: 'Office Supplies',
    UTILITIES: 'Utilities',
    RENT: 'Rent',
    MAINTENANCE: 'Maintenance',
    OTHER: 'Other',
};
function mapVendorCategoryToKey(val) {
    return exports.VENDOR_CATEGORY_MAP[val] || val;
}
function mapVendorCategoryToLabel(key) {
    return exports.VENDOR_CATEGORY_REVERSE_MAP[key] || key;
}
// ─── Expense Payment Method Mappings ─────────────────────────────────────────
exports.EXPENSE_PAYMENT_METHOD_MAP = {
    'Cash': 'Cash',
    'Bank Transfer': 'Bank_Transfer',
    'Bank_Transfer': 'Bank_Transfer',
    'Online': 'Online',
    'Easypaisa': 'Easypaisa',
    'JazzCash': 'JazzCash',
};
exports.EXPENSE_PAYMENT_METHOD_REVERSE_MAP = {
    Cash: 'Cash',
    Bank_Transfer: 'Bank Transfer',
    Online: 'Online',
    Easypaisa: 'Easypaisa',
    JazzCash: 'JazzCash',
};
function mapExpensePaymentMethodToKey(val) {
    return exports.EXPENSE_PAYMENT_METHOD_MAP[val] || val;
}
function mapExpensePaymentMethodToLabel(key) {
    return exports.EXPENSE_PAYMENT_METHOD_REVERSE_MAP[key] || key;
}
// ─── Page Key Mappings ───────────────────────────────────────────────────────
exports.PAGE_KEY_MAP = {
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
exports.PAGE_KEY_REVERSE_MAP = {
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
function mapPageKeyToKey(val) {
    return exports.PAGE_KEY_MAP[val] || val;
}
function mapPageKeyToLabel(key) {
    return exports.PAGE_KEY_REVERSE_MAP[key] || key;
}
// ─── Voucher Type Mappings ───────────────────────────────────────────────────
exports.VOUCHER_TYPE_MAP = {
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
exports.VOUCHER_TYPE_REVERSE_MAP = {
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
function mapVoucherTypeToKey(val) {
    return exports.VOUCHER_TYPE_MAP[val] || val;
}
function mapVoucherTypeToLabel(key) {
    return exports.VOUCHER_TYPE_REVERSE_MAP[key] || key;
}
//# sourceMappingURL=enums.js.map