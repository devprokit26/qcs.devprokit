import {
  Shipment,
  Customer,
  Vendor,
  LedgerTransaction,
  WeightProforma,
  User,
  AgingBuckets,
  CreditLimitCheckResult,
  ShipmentStatus,
  Invoice,
  VendorBill,
  ProformaDraft,
  ProformaInvoice,
  AvailableShipment,
} from '@/models/types';

export interface IInvoiceService {
  getInvoices(): Promise<Invoice[]>;
  getBills(): Promise<VendorBill[]>;
  voidInvoice(id: number): Promise<void>;
voidReceipt(id: number): Promise<void>;
voidBillPayment(id: string): Promise<void>;
}

export interface IProformaService {
  list(): Promise<ProformaInvoice[]>;
  available(): Promise<AvailableShipment[]>;
  create(data: ProformaDraft): Promise<ProformaInvoice>;
  update(id: number, data: ProformaDraft): Promise<ProformaInvoice>;
  delete(id: number): Promise<{ success: boolean; id: number }>;
}

export interface ShipmentFilterOptions {
  search?: string;
  status?: string;
  range?: 'all' | 'today' | 'week' | 'month' | 'custom';
  from?: string;
  to?: string;
}

export interface IShipmentService {
  getShipments(filter?: ShipmentFilterOptions): Promise<Shipment[]>;
  getShipmentById(id: number): Promise<Shipment | null>;
  getUnfinalShipments(): Promise<Shipment[]>;
  createShipment(data: Omit<Shipment, 'id'>, overrideCredit?: boolean): Promise<{ shipment: Shipment; warning?: string }>;
  updateShipment(id: number, data: Omit<Shipment, 'id'>, overrideCredit?: boolean): Promise<{ shipment: Shipment; warning?: string }>;
  updateShipmentStatus(id: number, status: ShipmentStatus): Promise<Shipment>;
  deleteShipment(id: number): Promise<boolean>;
}

export interface ILedgerService {
  getCustomers(search?: string): Promise<Customer[]>;
  getCustomerById(id: number): Promise<Customer | null>;
  createCustomer(data: Omit<Customer, 'id'>): Promise<Customer>;
  updateCustomer(id: number, data: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<boolean>;
  getCustomerTransactions(customerId: number): Promise<LedgerTransaction[]>;
  addCustomerTransaction(customerId: number, txn: Omit<LedgerTransaction, 'voucherNo'> & { voucherNo?: string }): Promise<LedgerTransaction>;
  getCustomerAging(customerId: number): Promise<AgingBuckets>;
  getAllCustomerAging(): Promise<Record<number, AgingBuckets>>;
  checkCredit(customerId: number, additionalAmount: number): Promise<CreditLimitCheckResult>;
}

export interface IVendorService {
  getVendors(search?: string): Promise<Vendor[]>;
  getVendorById(id: number): Promise<Vendor | null>;
  createVendor(data: Omit<Vendor, 'id'>): Promise<Vendor>;
  updateVendor(id: number, data: Partial<Vendor>): Promise<Vendor>;
  deleteVendor(id: number): Promise<boolean>;
  getVendorTransactions(vendorId: number): Promise<LedgerTransaction[]>;
  addVendorTransaction(vendorId: number, txn: Omit<LedgerTransaction, 'voucherNo'> & { voucherNo?: string }): Promise<LedgerTransaction>;
  getVendorAging(vendorId: number): Promise<AgingBuckets>;
}

export interface IWeightProformaService {
  getProformas(search?: string): Promise<WeightProforma[]>;
  getProformaById(id: number): Promise<WeightProforma | null>;
  createProforma(data: Omit<WeightProforma, 'id'>): Promise<WeightProforma>;
  updateProforma(id: number, data: Partial<WeightProforma>): Promise<WeightProforma>;
  deleteProforma(id: number): Promise<boolean>;
}

export interface IUserService {
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | null>;
  createUser(data: Omit<User, 'id'>): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
}

export interface IAuthService {
  login(username: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  resetDemoData(): Promise<void>;
}

export interface AnalyticsSummary {
  todayShipments: number;
  totalShipments: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  unfinalAwbs: string[];

  profitMarginPercent: number;
  topCourier: { name: string; count: number } | null;
  topCustomer: { name: string; count: number } | null;
  outstandingReceivable: number;
  totalCustomers: number;
  totalVendors: number;
  overdueAlertCount: number;
  agingTotals: {
    current: number;
    d1_30: number;
    d31_60: number;
    d60plus: number;
  };
}

export interface CourierReportRow {
  courier: string;
  count: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
  sharePercent: number;
}

export interface DestinationReportRow {
  destination: string;
  count: number;
  totalWeight: number;
  revenue: number;
  avgRevenue: number;
}

export interface CustomerReportRow {
  customerId: number;
  name: string;
  shipments: number;
  totalPaid: number;
  outstanding: number;
  status: 'Owes' | 'Paid' | 'Advance';
}

export interface DashboardCreditWarning {
  overLimit: Array<{ customer: import('@/models/types').Customer; balance: number; limit: number; exceedBy: number }>;
  lockedLate: Array<{ customer: import('@/models/types').Customer; daysOverdue: number; creditDays: number }>;
}

export interface IReportService {
  getAnalyticsSummary(): Promise<AnalyticsSummary>;
  getRevenueCostTrend(days?: number): Promise<Array<{ day: string; label: string; revenue: number; cost: number; profit: number }>>;
  getStatusDistribution(): Promise<Record<string, number>>;
  getServiceDistribution(): Promise<Record<string, number>>;
  getCourierReport(): Promise<CourierReportRow[]>;
  getDestinationReport(): Promise<DestinationReportRow[]>;
  getCustomerReport(): Promise<CustomerReportRow[]>;
  getCreditWarnings(): Promise<DashboardCreditWarning>;
}
