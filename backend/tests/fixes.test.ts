import { describe, it, expect, vi } from 'vitest';
import {
  mapVendorCategoryToKey,
  mapVendorCategoryToLabel,
  mapExpensePaymentMethodToKey,
  mapExpensePaymentMethodToLabel,
  mapPageKeyToKey,
  mapPageKeyToLabel,
} from '../src/lib/enums';
import {
  serializeCustomer,
  serializeVendor,
  serializeShipment,
  serializeExpense,
} from '../src/lib/serialize';
import { todayStr, shiftDateStr } from '../src/lib/dates';
import { shipmentSchema } from '../src/modules/shipments/shipments.schema';
import { errorHandler } from '../src/middleware/errorHandler';
import { idempotency } from '../src/middleware/idempotency';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/prisma/client';

describe('Part 1 & Part 2 Fixes', () => {
  it('category label -> key mapping and reverse', () => {
    expect(mapVendorCategoryToKey('Courier / Freight')).toBe('COURIER_FREIGHT');
    expect(mapVendorCategoryToKey('Office Supplies')).toBe('OFFICE_SUPPLIES');
    expect(mapVendorCategoryToKey('COURIER_FREIGHT')).toBe('COURIER_FREIGHT');

    expect(mapVendorCategoryToLabel('COURIER_FREIGHT')).toBe('Courier / Freight');
    expect(mapVendorCategoryToLabel('OFFICE_SUPPLIES')).toBe('Office Supplies');
  });

  it('payment method mapping and reverse', () => {
    expect(mapExpensePaymentMethodToKey('Bank Transfer')).toBe('Bank_Transfer');
    expect(mapExpensePaymentMethodToKey('Cash')).toBe('Cash');

    expect(mapExpensePaymentMethodToLabel('Bank_Transfer')).toBe('Bank Transfer');
    expect(mapExpensePaymentMethodToLabel('Cash')).toBe('Cash');
  });

  it('permission mapping and reverse', () => {
    expect(mapPageKeyToKey('users-management')).toBe('users_management');
    expect(mapPageKeyToKey('shipments')).toBe('shipments');

    expect(mapPageKeyToLabel('users_management')).toBe('users-management');
    expect(mapPageKeyToLabel('shipments')).toBe('shipments');
  });

  it('serializers convert Decimal and fields to numbers and labels', () => {
    const rawCustomer = {
      id: 1,
      name: 'Test Cust',
      phone: '123',
      email: 'a@b.com',
      city: 'KHI',
      creditLimit: new Prisma.Decimal('50000.50'),
      creditDays: 30,
      accountCode: 'C1',
      branch: 'Main',
      openingBalance: new Prisma.Decimal('1000.00'),
    };
    const c = serializeCustomer(rawCustomer);
    expect(typeof c.creditLimit).toBe('number');
    expect(c.creditLimit).toBe(50000.5);
    expect(typeof c.openingBalance).toBe('number');
    expect(c.openingBalance).toBe(1000);

    const rawVendor = {
      id: 2,
      name: 'Test Vendor',
      category: 'COURIER_FREIGHT',
      openingBalance: new Prisma.Decimal('200.00'),
      creditDays: 15,
    };
    const v = serializeVendor(rawVendor);
    expect(v.category).toBe('Courier / Freight');
    expect(typeof v.openingBalance).toBe('number');
    expect(v.openingBalance).toBe(200);
  });

  it('cartons net quantity calculation in serializeShipment', () => {
    const rawShipment = {
      id: 10,
      date: '2026-10-01',
      customerName: 'Cust',
      courier: 'DHL',
      service: 'Express',
      awb: 'AWB123',
      destination: 'ISB',
      pieces: 2,
      weight: new Prisma.Decimal('5.5'),
      revenue: new Prisma.Decimal('1000'),
      cost: new Prisma.Decimal('500'),
      status: 'Shipped',
      cartonsUsed: [
        { cartonTypeId: 1, quantity: 5, movementType: 'USED' },
        { cartonTypeId: 1, quantity: 2, movementType: 'RETURNED' },
        { cartonTypeId: 2, quantity: 3, movementType: 'USED' },
      ],
    };
    const s = serializeShipment(rawShipment);
    expect(s.cartonsUsed).toEqual([
      { cartonTypeId: 1, quantity: 3 },
      { cartonTypeId: 2, quantity: 3 },
    ]);
  });

  it('shiftDateStr and todayStr in timezone', () => {
    expect(shiftDateStr('2026-10-01', -1)).toBe('2026-09-30');
    expect(shiftDateStr('2026-10-01', 5)).toBe('2026-10-06');

    const today = todayStr();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('AWB trimming in shipmentSchema', () => {
    const parsed = shipmentSchema.parse({
      date: '2026-10-01',
      customerName: 'Cust',
      courier: 'DHL',
      awb: '  AWB-TRIMMED-123   ',
      destination: 'KHI',
      revenue: 100,
      cost: 50,
      weight: 1,
    });
    expect(parsed.awb).toBe('AWB-TRIMMED-123');

    expect(() => shipmentSchema.parse({
      date: '2026-10-01',
      customerName: 'Cust',
      courier: 'DHL',
      awb: '   ',
      destination: 'KHI',
      revenue: 100,
      cost: 50,
      weight: 1,
    })).toThrow();
  });

  it('errorHandler maps Prisma P2002 to friendly 409', () => {
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    const req: any = { url: '/test', method: 'POST' };
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.22.0',
    });

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'A record with this unique field already exists.',
    });
  });

  it('idempotency middleware behavior', async () => {
    const req1: any = {
      method: 'POST',
      originalUrl: '/api/v1/shipments',
      path: '/shipments',
      headers: { 'x-client-id': 'test-key-1' },
    };
    const res1: any = {
      statusCode: 200,
      json: vi.fn().mockImplementation((b) => b),
      send: vi.fn(),
      on: vi.fn(),
    };
    const next1 = vi.fn();

    // Mock prisma idempotencyKey create & update
    vi.spyOn(prisma.idempotencyKey, 'create').mockResolvedValue({
      key: 'test-key-1',
      path: '/api/v1/shipments',
      body: null,
      createdAt: new Date(),
    });
    vi.spyOn(prisma.idempotencyKey, 'update').mockResolvedValue({} as any);

    await idempotency(req1, res1, next1);
    expect(next1).toHaveBeenCalled();

    // Auth routes skip idempotency
    const authReq: any = {
      method: 'POST',
      originalUrl: '/api/v1/auth/login',
      path: '/auth/login',
      headers: { 'x-client-id': 'auth-key' },
    };
    const authNext = vi.fn();
    await idempotency(authReq, res1, authNext);
    expect(authNext).toHaveBeenCalled();
  });
});
