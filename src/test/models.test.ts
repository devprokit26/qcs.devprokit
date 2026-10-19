import { describe, it, expect } from 'vitest';
import { Customer, Vendor, LedgerTransaction, Shipment } from '@/models/types';
import { calculateCustomerBalance, calculateVendorBalance } from '@/models/balance';
import { calculateCustomerAging, calculateVendorAging } from '@/models/aging';
import { checkCustomerCredit } from '@/models/credit';
import { calculateBoxWeights, calculateProformaTotals } from '@/models/weight';
import { getNextVoucherNumber } from '@/models/vouchers';
import {
  generateShipmentCreateEntries,
  generateShipmentUpdateEntries,
} from '@/models/ledger';
import { formatCustomerListDate, getCustomerDueInfo } from '@/models/customerDue';

describe('Model: Balance Calculations', () => {
  const dummyCustomer: Customer = {
    id: 1,
    name: 'Test Customer',
    phone: '',
    email: '',
    city: 'Karachi',
    creditLimit: 500000,
    creditDays: 30,
    accountCode: '1-01',
    branch: 'KHI',
    openingBalance: 20000,
  };

  it('calculates the oldest unpaid invoice date using FIFO payments', () => {
    const transactions: LedgerTransaction[] = [
      { date: '2026-09-01', description: 'Older invoice', type: 'debit', amount: 100, voucherType: 'AE-LOC-INV', voucherNo: '1' },
      { date: '2026-10-01', description: 'Newer invoice', type: 'debit', amount: 200, voucherType: 'AE-LOC-INV', voucherNo: '2' },
      { date: '2026-10-05', description: 'Payment', type: 'credit', amount: 150, voucherType: 'BRV', voucherNo: '3' },
    ];

    const due = getCustomerDueInfo({ ...dummyCustomer, openingBalance: 0 }, transactions, '2026-10-15');

    expect(due?.invoiceDate).toEqual(new Date(2026, 9, 1));
    expect(due?.dueDate).toEqual(new Date(2026, 9, 31));
    expect(due?.daysLeft).toBe(16);
  });

  it('uses the oldest entry date for opening balance and ignores invalid dates safely', () => {
    const transactions: LedgerTransaction[] = [
      { date: 'not-a-date', description: 'Invalid invoice date', type: 'debit', amount: 500, voucherType: 'AE-LOC-INV', voucherNo: '1' },
      { date: '2026-10-01', description: 'Payment', type: 'credit', amount: 50, voucherType: 'BRV', voucherNo: '2' },
    ];

    const due = getCustomerDueInfo(dummyCustomer, transactions, '2026-10-15');

    expect(due?.invoiceDate).toEqual(new Date(2026, 9, 1));
    expect(formatCustomerListDate(due!.invoiceDate)).toBe('01/10/2026');
    expect(getCustomerDueInfo(dummyCustomer, transactions, 'invalid')).toBeNull();
  });

  it('calculates customer balance = opening balance + sum(debits) - sum(credits)', () => {
    const txns: LedgerTransaction[] = [
      { date: '2026-09-01', description: 'Sale 1', type: 'debit', amount: 30000, voucherType: 'AE-LOC-INV', voucherNo: '1' },
      { date: '2026-09-05', description: 'Sale 2', type: 'debit', amount: 15000, voucherType: 'AE-LOC-INV', voucherNo: '2' },
      { date: '2026-09-10', description: 'Payment 1', type: 'credit', amount: 25000, voucherType: 'BRV', voucherNo: '3' },
    ];

    // 20000 + 30000 + 15000 - 25000 = 40000
    const balance = calculateCustomerBalance(dummyCustomer, txns);
    expect(balance).toBe(40000);
  });

  it('returns 0 when opening balance is 0 and debits equal credits', () => {
    const custWithoutOpening = { ...dummyCustomer, openingBalance: 0 };
    const txns: LedgerTransaction[] = [
      { date: '2026-09-01', description: 'Invoice', type: 'debit', amount: 10000, voucherType: 'AE-LOC-INV', voucherNo: '1' },
      { date: '2026-09-02', description: 'Payment', type: 'credit', amount: 10000, voucherType: 'CRV', voucherNo: '2' },
    ];
    expect(calculateCustomerBalance(custWithoutOpening, txns)).toBe(0);
  });

  it('calculates vendor payable balance properly', () => {
    const dummyVendor: Vendor = {
      id: 1,
      name: 'Courier Co',
      phone: '',
      email: '',
      city: 'Karachi',
      category: 'Courier / Freight',
      creditDays: 30,
      accountCode: '2-01',
      branch: 'KHI',
      openingBalance: 10000,
    };
    const txns: LedgerTransaction[] = [
      { date: '2026-09-01', description: 'Bill', type: 'debit', amount: 25000, voucherType: 'PINV', voucherNo: '1' },
      { date: '2026-09-10', description: 'Payment', type: 'credit', amount: 15000, voucherType: 'BPV', voucherNo: '2' },
    ];
    // 10000 + 25000 - 15000 = 20000
    expect(calculateVendorBalance(dummyVendor, txns)).toBe(20000);
  });
});

describe('Model: Receivables Aging & FIFO Allocation', () => {
  const customer: Customer = {
    id: 1,
    name: 'Aging Test Co.',
    phone: '',
    email: '',
    city: 'Karachi',
    creditLimit: 500000,
    creditDays: 30, // 30 days credit terms
    accountCode: '1-02',
    branch: 'KHI',
    openingBalance: 10000,
  };

  const asOf = new Date('2026-10-01T00:00:00Z');

  it('correctly applies credit pool FIFO against opening balance and oldest debits', () => {
    const txns: LedgerTransaction[] = [
      // 60 days old from Oct 1 => Aug 2: 60 days since invoice - 30 credit days = 30 days overdue (falls into 1-30 overdue)
      { date: '2026-08-02', description: 'Old Invoice', type: 'debit', amount: 20000, voucherType: 'AE-LOC-INV', voucherNo: '1' },
      // 10 days old from Oct 1 => Sept 21: not due yet (< 30d) => Current
      { date: '2026-09-21', description: 'Recent Invoice', type: 'debit', amount: 15000, voucherType: 'AE-LOC-INV', voucherNo: '2' },
      // Payment of 15000:
      // FIFO: 10000 covers opening balance completely, remaining 5000 covers part of Old Invoice (20000 - 5000 = 15000 remains)
      { date: '2026-09-25', description: 'Payment', type: 'credit', amount: 15000, voucherType: 'BRV', voucherNo: '3' },
    ];

    const aging = calculateCustomerAging(customer, txns, asOf);

    // Old invoice remaining = 15000, days overdue = 30 => falls into d1_30
    expect(aging.d1_30).toBe(15000);
    // Recent invoice not overdue => falls into current = 15000
    expect(aging.current).toBe(15000);
    expect(aging.totalOverdue).toBe(15000);
    expect(aging.oldestDaysOverdue).toBe(30);
  });

  it('places severely aged invoices into 60+ days bucket', () => {
    const custWithoutOpening = { ...customer, openingBalance: 0, creditDays: 15 };
    const txns: LedgerTransaction[] = [
      // Invoiced 90 days ago => 90 - 15 = 75 days overdue (> 60)
      { date: '2026-07-03', description: 'Ancient invoice', type: 'debit', amount: 50000, voucherType: 'AE-LOC-INV', voucherNo: '1' },
    ];
    const aging = calculateCustomerAging(custWithoutOpening, txns, asOf);
    expect(aging.d60plus).toBe(50000);
    expect(aging.oldestDaysOverdue).toBeGreaterThan(60);
  });
});

describe('Model: Credit Limit & Overdue Checks', () => {
  const customer: Customer = {
    id: 1,
    name: 'Credit Test Co.',
    phone: '',
    email: '',
    city: 'Lahore',
    creditLimit: 100000,
    creditDays: 30,
    accountCode: '1-03',
    branch: 'LHE',
    openingBalance: 40000,
  };

  it('warns when new balance exceeds credit limit', () => {
    const txns: LedgerTransaction[] = [
      { date: '2026-09-20', description: 'Recent sale', type: 'debit', amount: 50000, voucherType: 'AE-LOC-INV', voucherNo: '1' },
    ];
    // Current balance = 40000 + 50000 = 90000. Adding 20000 => 110000 > 100000 limit!
    const check = checkCustomerCredit(customer, txns, 20000);
    expect(check.exceed).toBe(true);
    expect(check.exceedBy).toBe(10000);
  });

  it('detects days late breach when customer has overdue invoices beyond credit days', () => {
    const asOf = new Date('2026-10-01T00:00:00Z');
    const txns: LedgerTransaction[] = [
      // 50 days old > 30 credit days
      { date: '2026-08-12', description: 'Unpaid old invoice', type: 'debit', amount: 30000, voucherType: 'AE-LOC-INV', voucherNo: '1' },
    ];
    const check = checkCustomerCredit(customer, txns, 5000, asOf);
    expect(check.daysLateBreach).toBe(true);
    expect(check.oldestDaysOverdue).toBeGreaterThan(0);
  });
});

describe('Model: Weight Proforma Calculations', () => {
  it('calculates dimensional weight with standard divisor (5000)', () => {
    // 50 x 40 x 30 = 60,000 / 5000 = 12.00 KG
    const res = calculateBoxWeights({ actWeight: 10.5, l: 50, w: 40, h: 30 }, 5000);
    expect(res.dimWeight).toBe(12.0);
    // Chargeable weight = max(10.5, 12.0) = 12.0
    expect(res.chWeight).toBe(12.0);
  });

  it('selects actual weight when actual weight exceeds dimensional weight', () => {
    // 30 x 20 x 10 = 6,000 / 5000 = 1.2 KG. Actual = 15.0 KG.
    const res = calculateBoxWeights({ actWeight: 15.0, l: 30, w: 20, h: 10 }, 5000);
    expect(res.dimWeight).toBe(1.2);
    expect(res.chWeight).toBe(15.0);
  });

  it('correctly aggregates proforma totals across dynamic boxes', () => {
    const boxes = [
      { actWeight: 10.0, l: 50, w: 40, h: 30 }, // dim: 12.0, ch: 12.0
      { actWeight: 20.0, l: 40, w: 30, h: 20 }, // dim: 4.8, ch: 20.0
    ];
    const totals = calculateProformaTotals(boxes, 5000);
    expect(totals.totalAct).toBe(30.0);
    expect(totals.totalDim).toBe(16.8);
    expect(totals.totalCh).toBe(32.0);
    expect(totals.count).toBe(2);
  });
});

describe('Model: Voucher Numbering', () => {
  it('auto-increments per voucher type independently', () => {
    let counters: Record<string, number> = { BRV: 100, CRV: 50 };
    const step1 = getNextVoucherNumber(counters, 'BRV');
    expect(step1.nextNumber).toBe(101);
    expect(step1.voucherNoStr).toBe('101');
    counters = step1.updatedCounters;

    const step2 = getNextVoucherNumber(counters, 'CRV');
    expect(step2.nextNumber).toBe(51);
    expect(step2.voucherNoStr).toBe('51');
    counters = step2.updatedCounters;

    const step3 = getNextVoucherNumber(counters, 'BRV');
    expect(step3.nextNumber).toBe(102);
  });
});

describe('Model: Ledger Auto-Posting Rules', () => {
  const dummyCustomer: Customer = {
    id: 10,
    name: 'Customer A',
    phone: '',
    email: '',
    city: 'Karachi',
    creditLimit: 500000,
    creditDays: 30,
    accountCode: '1-01',
    branch: 'KHI',
    openingBalance: 0,
  };

  const dummyVendor: Vendor = {
    id: 20,
    name: 'FHL Express',
    phone: '',
    email: '',
    city: 'Karachi',
    category: 'Courier / Freight',
    creditDays: 30,
    accountCode: '2-01',
    branch: 'KHI',
    openingBalance: 0,
  };

  it('auto-posts customer debit (AE-LOC-INV) and vendor debit (PINV) on non-walk-in shipment creation', () => {
    const shipment: Shipment = {
      id: 1,
      date: '2026-09-29',
      customerId: 10,
      customerName: 'Customer A',
      isWalkIn: false,
      courier: 'FHL Express',
      service: 'Express',
      awb: 'FHL1234',
      origin: 'SKT',
      destination: 'USA',
      pieces: 2,
      weight: 3.5,
      revenue: 15000,
      cost: 9500,
      status: 'Pending',
      consignee: 'Ali Raza'
    };

    const result = generateShipmentCreateEntries(shipment, dummyCustomer, dummyVendor, {});

    // Must generate customer debit for 15,000 (AE-LOC-INV)
    const custAction = result.actions.find(a => a.target === 'customer');
    expect(custAction).toBeDefined();
    expect(custAction?.entityId).toBe(10);
    expect(custAction?.transaction.type).toBe('debit');
    expect(custAction?.transaction.amount).toBe(15000);
    expect(custAction?.transaction.voucherType).toBe('AE-LOC-INV');

    // Must generate vendor debit for 9,500 (PINV)
    const vendAction = result.actions.find(a => a.target === 'vendor');
    expect(vendAction).toBeDefined();
    expect(vendAction?.entityId).toBe(20);
    expect(vendAction?.transaction.type).toBe('debit');
    expect(vendAction?.transaction.amount).toBe(9500);
    expect(vendAction?.transaction.voucherType).toBe('PINV');
  });

  it('posts no customer ledger entry for walk-in cash shipments', () => {
    const walkInShipment: Shipment = {
      id: 2,
      date: '2026-09-29',
      customerId: null,
      customerName: 'Walk-in Cash Customer',
      isWalkIn: true,
      courier: 'FHL Express',
      service: 'Express',
      awb: 'WALK001',
      origin: 'SKT',
      destination: 'UK',
      pieces: 1,
      weight: 1.0,
      revenue: 8000,
      cost: 5000,
      status: 'Delivered',
      consignee: ''
    };

    const result = generateShipmentCreateEntries(walkInShipment, null, dummyVendor, {});

    const custAction = result.actions.find(a => a.target === 'customer');
    expect(custAction).toBeUndefined();

    // Courier vendor is still owed cost
    const vendAction = result.actions.find(a => a.target === 'vendor');
    expect(vendAction).toBeDefined();
    expect(vendAction?.transaction.amount).toBe(5000);
  });

  it('creates no ledger or payable entries for an Unfinal shipment', () => {
    const unfinalShipment: Shipment = {
      id: 3,
      date: '2026-09-29',
      customerId: 10,
      customerName: 'Customer A',
      isWalkIn: false,
      courier: 'FHL Express',
      service: 'Express',
      awb: 'UNFINAL001',
      origin: 'SKT',
      destination: 'USA',
      pieces: 2,
      weight: 3.5,
      revenue: 0,
      cost: 0,
      status: 'Unfinal',
      consignee: 'Ali Raza',
    };

    const result = generateShipmentCreateEntries(unfinalShipment, dummyCustomer, dummyVendor, {});

    expect(result.actions).toHaveLength(0);
  });

  it('posts customer and vendor entries when an Unfinal shipment is finalized', () => {
    const unfinalShipment: Shipment = {
      id: 4,
      date: '2026-09-29',
      customerId: 10,
      customerName: 'Customer A',
      isWalkIn: false,
      courier: 'FHL Express',
      service: 'Express',
      awb: 'UNFINAL002',
      origin: 'SKT',
      destination: 'USA',
      pieces: 2,
      weight: 3.5,
      revenue: 0,
      cost: 0,
      status: 'Unfinal',
      consignee: 'Ali Raza',
    };
    const finalizedShipment = {
      ...unfinalShipment,
      status: 'Pending' as const,
      revenue: 15000,
      cost: 9500,
    };

    const result = generateShipmentUpdateEntries(
      unfinalShipment,
      finalizedShipment,
      dummyCustomer,
      dummyCustomer,
      dummyVendor,
      dummyVendor,
      {}
    );

    expect(result.actions).toHaveLength(2);
    expect(result.actions.map(action => action.target).sort()).toEqual(['customer', 'vendor']);
  });

  it('posts JVR delta adjustment on shipment revenue edit', () => {
    const oldShipment: Shipment = {
      id: 1,
      date: '2026-09-29',
      customerId: 10,
      customerName: 'Customer A',
      isWalkIn: false,
      courier: 'FHL Express',
      service: 'Express',
      awb: 'FHL1234',
      origin: 'SKT',
      destination: 'USA',
      pieces: 2,
      weight: 3.5,
      revenue: 15000,
      cost: 9500,
      status: 'Pending',
      consignee: ''
    };

    const newShipment = { ...oldShipment, revenue: 18000 }; // +3000 delta

    const result = generateShipmentUpdateEntries(
      oldShipment,
      newShipment,
      dummyCustomer,
      dummyCustomer,
      dummyVendor,
      dummyVendor,
      {}
    );

    const custAction = result.actions.find(a => a.target === 'customer');
    expect(custAction).toBeDefined();
    expect(custAction?.transaction.voucherType).toBe('JVR');
    expect(custAction?.transaction.type).toBe('debit');
    expect(custAction?.transaction.amount).toBe(3000);
  });

  it('posts reversal credit to old customer and debit to new customer when customer changes', () => {
    const oldShipment: Shipment = {
      id: 1,
      date: '2026-09-29',
      customerId: 10,
      customerName: 'Customer A',
      isWalkIn: false,
      courier: 'FHL Express',
      service: 'Express',
      awb: 'FHL1234',
      origin: 'SKT',
      destination: 'USA',
      pieces: 2,
      weight: 3.5,
      revenue: 15000,
      cost: 9500,
      status: 'Pending',
      consignee: ''
    };

    const newCustomer = { ...dummyCustomer, id: 11, name: 'Customer B' };
    const newShipment = { ...oldShipment, customerId: 11, customerName: 'Customer B' };

    const result = generateShipmentUpdateEntries(
      oldShipment,
      newShipment,
      dummyCustomer,
      newCustomer,
      dummyVendor,
      dummyVendor,
      {}
    );

    // Old customer gets JVR credit reversal for 15000
    const oldCustAction = result.actions.find(a => a.target === 'customer' && a.entityId === 10);
    expect(oldCustAction).toBeDefined();
    expect(oldCustAction?.transaction.type).toBe('credit');
    expect(oldCustAction?.transaction.amount).toBe(15000);

    // New customer gets AE-LOC-INV debit for 15000
    const newCustAction = result.actions.find(a => a.target === 'customer' && a.entityId === 11);
    expect(newCustAction).toBeDefined();
    expect(newCustAction?.transaction.type).toBe('debit');
    expect(newCustAction?.transaction.voucherType).toBe('AE-LOC-INV');
    expect(newCustAction?.transaction.amount).toBe(15000);
  });
});
