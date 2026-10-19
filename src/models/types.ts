export type ShipmentStatus = 'Pending' | 'Shipped' | 'Delivered' | 'Returned' | 'Unfinal';
export type CourierServiceType = string;

export type CustomerVoucherType = 'AE-LOC-INV' | 'AI-LOC-INV' | 'BRV' | 'CRV' | 'JVR';
export type VendorVoucherType = 'PINV' | 'EXP-INV' | 'BPV' | 'CPV' | 'JVR';
export type VoucherType = CustomerVoucherType | VendorVoucherType;

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online' | 'Easypaisa' | 'JazzCash';
export type VendorCategory = 'Courier / Freight' | 'Fuel' | 'Office Supplies' | 'Utilities' | 'Rent' | 'Maintenance' | 'Other';

export type PageKey = 'dashboard' | 'shipments' | 'weightproforma' | 'ledger' | 'alerts' | 'reports' | 'cartons' | 'expenses' | 'users-management'| 'invoice-proforma';
export type ProformaType = 'COMMERCIAL' | 'GIFT' | 'DOX';

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  permissions: PageKey[];
  protected?: boolean;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  creditLimit: number;
  creditDays: number;
  accountCode: string;
  branch: string;
  openingBalance: number;
}

export interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  category: VendorCategory;
  creditDays: number;
  accountCode: string;
  branch: string;
  openingBalance: number;
  services?: string[];
}

export interface CartonUsedLine {
  cartonTypeId: number;
  quantity: number;
}

export interface Shipment {
  id: number;
  date: string;
  customerId: number | null;
  customerName: string;
  isWalkIn: boolean;
  walkInName?: string;
  courier: string;
  service: CourierServiceType;
  awb: string;
  origin: string;
  destination: string;
  /** Full delivery address at destination (street, city, postcode) */
  destinationAddress?: string;
  /** What is being shipped, e.g. "Football (Size 5)", "Garments" */
  productName?: string;
  pieces: number;
  weight: number;
  shipInv?: string;
  jobNo?: string;
  revenue: number;
  cost: number;
  status: ShipmentStatus;
  notes?: string;
  consignee: string;
  cartonsUsed?: CartonUsedLine[];
}

export interface LedgerTransaction {
  id?: string;
  date: string;
  description: string;
  type: 'debit' | 'credit';
  amount: number;
  voucherType: VoucherType;
  voucherNo: string;
  jobNo?: string;
  shipInv?: string;
  branch?: string;
  orig?: string;
  dest?: string;
  pcsWeight?: string;
  chequeNo?: string;
  chequeDate?: string;
}

export interface CustomerLedgerRecord {
  customerId: number;
  transactions: LedgerTransaction[];
}

export interface VendorLedgerRecord {
  vendorId: number;
  transactions: LedgerTransaction[];
}

export interface WeightBox {
  id?: string;
  actWeight: number;
  l: number;
  w: number;
  h: number;
}

export interface WeightProforma {
  id: number;
  cnNo: string;
  shipper: string;
  services: string;
  date: string;
  divisor: number;
  shipmentId: number | null;
  boxes: WeightBox[];
}

export interface AgingBuckets {
  current: number;
  d1_30: number;
  d31_60: number;
  d60plus: number;
  totalOverdue: number;
  oldestDaysOverdue: number;
  termDays: number;
  overdueInvoices: Array<{
    date: string;
    description: string;
    amount: number;
    daysOverdue: number;
  }>;
}

export interface CreditLimitCheckResult {
  exceed: boolean;
  customer: string;
  creditLimit: number;
  currentBalance: number;
  newBalance: number;
  exceedBy: number;
  daysLateBreach: boolean;
  oldestDaysOverdue: number;
  creditDays: number;
}

export type MovementType = 'RECEIVED' | 'USED' | 'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'RETURNED';
export type ExpensePaymentMethod = 'Cash' | 'Bank Transfer' | 'Online' | 'Easypaisa' | 'JazzCash';

export interface CartonType {
  id: number;
  name: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  lowStockThreshold: number;
  isActive: boolean;
}

/** Data for creating a carton type. Opening stock is optional and recorded as a RECEIVED movement. */
export interface NewCartonType extends Omit<CartonType, 'id'> {
  openingQuantity?: number;
  openingUnitCost?: number | null;
}

export interface CartonMovement {
  id: number;
  cartonTypeId: number;
  date: string;
  movementType: MovementType;
  quantity: number;
  shipmentId?: number | null;
  vendorId?: number | null;
  unitCost?: number | null;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Expense {
  id: number;
  date: string;
  categoryId: number;
  amount: number;
  description: string;
  paidTo?: string;
  paymentMethod: ExpensePaymentMethod;
  referenceNo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}


// ─── Payments (Invoices page) ─────────────────────────────────────────

export type InvoiceStatus = 'Issued' | 'Cancelled';

/** Customer invoice generated automatically when a shipment is booked */
export interface Invoice {
  id: number;
  invoiceNo: string;
  shipmentId: number | null;
  customerId: number | null;
  customerName: string;
  isWalkIn: boolean;
  date: string;
  awb: string;
  jobNo?: string;
  courier: string;
  service: string;
  productName?: string;
  origin: string;
  destination: string;
  destinationAddress?: string;
  pieces: number;
  weight: number;
  amount: number;
  status: InvoiceStatus;
  consignee?: string;
  notes?: string;
  chequeNo?: string;
  paymentMethod?: string;
  kind?: 'invoice' | 'payment';
}

/** Vendor bill = a PINV / EXP-INV debit in a vendor ledger */
export interface VendorBill {
  id: string;
  vendorId: number;
  vendorName: string;
  voided?: boolean;
  date: string;
  voucherType: string;
  voucherNo: string;
  description: string;
  amount: number;
  jobNo?: string;
  chequeNo?: string;
  paymentMethod?: string;
  kind?: 'bill' | 'payment';
}


export interface ProformaItem {
  description: string;
  madeOf: string;
  hsCode: string;
  originCountry: string;
  sizesColors: string;
  gender: string;
  qty: number;
  unit: string;
  unitPrice: number;
}
export interface ProformaPackage {
  contents: string; l: number; w: number; h: number; grossWeight: number; netWeight: number;
}
export interface ProformaInvoice {
  id: number; serialNo: number; type: ProformaType; shipmentId?: number | null; invoiceDate: string;
  shipperName: string; shipperCnic: string; shipperAddress: string; shipperPhone: string;
  demoConsigneeName: string; demoConsigneeAddress: string; demoConsigneePhone: string;
  cartonNo: string;
  currency: string; exchangeRate: number | null; incoterm: string; reasonForExport: string; freight: number;
  items: ProformaItem[]; packages: ProformaPackage[]; notes: string;
  awb: string; shipDate: string; origin: string; destination: string; pieces: number; weight: number;
  createdAt: string;
  realShipperName: string; soldTo: string; departure: string; invoiceHsCode: string;
}
export type ProformaDraft = Omit<ProformaInvoice, 'id' | 'serialNo' | 'createdAt'>;
export interface AvailableShipment {
  id: number; awb: string; date: string; origin: string; destination: string;
  courier: string; productName: string; pieces: number; weight: number;
}
 