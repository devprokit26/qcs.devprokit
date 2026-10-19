import {
  mapVendorCategoryToLabel,
  mapExpensePaymentMethodToLabel,
  mapPageKeyToLabel,
  mapVoucherTypeToLabel,
} from './enums';

export function toNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && 'toNumber' in val && typeof val.toNumber === 'function') {
    return val.toNumber();
  }
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export function toNumberNullable(val: any): number | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && 'toNumber' in val && typeof val.toNumber === 'function') {
    return val.toNumber();
  }
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

export function serializeCustomer(customer: any) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    city: customer.city ?? '',
    creditLimit: toNumber(customer.creditLimit),
    creditDays: customer.creditDays,
    accountCode: customer.accountCode ?? '',
    branch: customer.branch ?? '',
    openingBalance: toNumber(customer.openingBalance),
  };
}

export function serializeVendor(vendor: any) {
  return {
    id: vendor.id,
    name: vendor.name,
    phone: vendor.phone ?? '',
    email: vendor.email ?? '',
    city: vendor.city ?? '',
    category: mapVendorCategoryToLabel(vendor.category) as any,
    creditDays: vendor.creditDays,
    accountCode: vendor.accountCode ?? '',
    branch: vendor.branch ?? '',
    openingBalance: toNumber(vendor.openingBalance),
    services: Array.isArray(vendor.services) ? vendor.services : [],
  };
}

export function serializeShipment(shipment: any) {
  let cartonsUsed: Array<{ cartonTypeId: number; quantity: number }> | undefined = undefined;

  if (Array.isArray(shipment.cartonsUsed)) {
    const netMap = new Map<number, number>();
    for (const mov of shipment.cartonsUsed) {
      if (mov.cartonTypeId !== undefined && mov.movementType) {
        const current = netMap.get(mov.cartonTypeId) || 0;
        if (mov.movementType === 'USED') {
          netMap.set(mov.cartonTypeId, current + mov.quantity);
        } else if (mov.movementType === 'RETURNED') {
          netMap.set(mov.cartonTypeId, current - mov.quantity);
        }
      } else if (mov.cartonTypeId !== undefined && mov.quantity !== undefined) {
        netMap.set(mov.cartonTypeId, (netMap.get(mov.cartonTypeId) || 0) + mov.quantity);
      }
    }
    const lines: Array<{ cartonTypeId: number; quantity: number }> = [];
    for (const [cartonTypeId, quantity] of netMap.entries()) {
      if (quantity > 0) {
        lines.push({ cartonTypeId, quantity });
      }
    }
    cartonsUsed = lines;
  }

  return {
    id: shipment.id,
    date: shipment.date,
    customerId: shipment.customerId ?? null,
    customerName: shipment.customerName,
    consignee: shipment.consignee ?? '',
    isWalkIn: Boolean(shipment.isWalkIn),
    ...(shipment.walkInName ? { walkInName: shipment.walkInName } : {}),
    courier: shipment.courier ?? '',
    service: shipment.service,
    awb: shipment.awb,
    origin: shipment.origin ?? '',
    destination: shipment.destination,
    ...(shipment.destinationAddress ? { destinationAddress: shipment.destinationAddress } : {}),
    ...(shipment.productName ? { productName: shipment.productName } : {}),
    pieces: shipment.pieces,
    weight: toNumber(shipment.weight),
    ...(shipment.shipInv ? { shipInv: shipment.shipInv } : {}),
    ...(shipment.jobNo ? { jobNo: shipment.jobNo } : {}),
    revenue: toNumber(shipment.revenue),
    cost: toNumber(shipment.cost),
    status: shipment.status,
    ...(shipment.notes ? { notes: shipment.notes } : {}),
    ...(cartonsUsed && cartonsUsed.length > 0 ? { cartonsUsed } : {}),
  };
}

export function serializeLedgerTransaction(entry: any) {
  return {
    id: String(entry.id),
    date: entry.date,
    description: entry.description,
    type: entry.type as 'debit' | 'credit',
    amount: toNumber(entry.amount),
    voucherType: mapVoucherTypeToLabel(entry.voucherType) as any,
    voucherNo: entry.voucherNo,
    ...(entry.jobNo ? { jobNo: entry.jobNo } : {}),
    ...(entry.shipInv ? { shipInv: entry.shipInv } : {}),
    ...(entry.branch ? { branch: entry.branch } : {}),
    ...(entry.orig ? { orig: entry.orig } : {}),
    ...(entry.dest ? { dest: entry.dest } : {}),
    ...(entry.pcsWeight ? { pcsWeight: entry.pcsWeight } : {}),
    ...(entry.chequeNo ? { chequeNo: entry.chequeNo } : {}),
    ...(entry.chequeDate ? { chequeDate: entry.chequeDate } : {}),
  };
}

export function serializeUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    permissions: Array.isArray(user.permissions)
      ? user.permissions.map(mapPageKeyToLabel)
      : [],
    protected: Boolean(user.isProtected),
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt),
  };
}

export function serializeExpense(expense: any) {
  const createdByUsername =
    typeof expense.createdBy === 'object' && expense.createdBy?.username
      ? expense.createdBy.username
      : typeof expense.createdBy === 'string'
      ? expense.createdBy
      : 'system';

  return {
    id: expense.id,
    date: expense.date,
    categoryId: expense.categoryId,
    amount: toNumber(expense.amount),
    description: expense.description,
    ...(expense.paidTo ? { paidTo: expense.paidTo } : {}),
    paymentMethod: mapExpensePaymentMethodToLabel(expense.paymentMethod) as any,
    ...(expense.referenceNo ? { referenceNo: expense.referenceNo } : {}),
    createdBy: createdByUsername,
    createdAt: expense.createdAt instanceof Date ? expense.createdAt.toISOString() : String(expense.createdAt),
    updatedAt: expense.updatedAt instanceof Date ? expense.updatedAt.toISOString() : String(expense.updatedAt),
  };
}

export function serializeExpenseCategory(cat: any) {
  return {
    id: cat.id,
    name: cat.name,
    isActive: Boolean(cat.isActive),
  };
}

export function serializeCartonType(ct: any) {
  return {
    id: ct.id,
    name: ct.name,
    ...(ct.lengthCm !== null && ct.lengthCm !== undefined ? { lengthCm: toNumber(ct.lengthCm) } : {}),
    ...(ct.widthCm !== null && ct.widthCm !== undefined ? { widthCm: toNumber(ct.widthCm) } : {}),
    ...(ct.heightCm !== null && ct.heightCm !== undefined ? { heightCm: toNumber(ct.heightCm) } : {}),
    lowStockThreshold: ct.lowStockThreshold,
    isActive: Boolean(ct.isActive),
  };
}

export function serializeCartonMovement(mov: any) {
  return {
    id: mov.id,
    cartonTypeId: mov.cartonTypeId,
    date: mov.date,
    movementType: mov.movementType,
    quantity: mov.quantity,
    shipmentId: mov.shipmentId ?? null,
    vendorId: mov.vendorId ?? null,
    unitCost: mov.unitCost !== null && mov.unitCost !== undefined ? toNumber(mov.unitCost) : null,
    note: mov.note ?? undefined,
    createdBy: mov.createdBy ?? 'system',
    createdAt: mov.createdAt instanceof Date ? mov.createdAt.toISOString() : String(mov.createdAt),
  };
}

export function serializeWeightProforma(wp: any) {
  return {
    id: wp.id,
    cnNo: wp.cnNo,
    shipper: wp.shipper,
    services: wp.services,
    date: wp.date,
    divisor: wp.divisor,
    shipmentId: wp.shipmentId ?? null,
    boxes: Array.isArray(wp.boxes) ? wp.boxes : JSON.parse(String(wp.boxes || '[]')),
  };
}

export function serializeInvoice(inv: any) {
  return {
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    shipmentId: inv.shipmentId ?? null,
    customerId: inv.customerId ?? null,
    customerName: inv.customerName,
    consignee: inv.consignee ?? '',
    isWalkIn: Boolean(inv.isWalkIn),
    date: inv.date,
    awb: inv.awb,
    ...(inv.jobNo ? { jobNo: inv.jobNo } : {}),
    courier: inv.courier ?? '',
    service: inv.service ?? '',
    ...(inv.productName ? { productName: inv.productName } : {}),
    origin: inv.origin ?? '',
    destination: inv.destination ?? '',
    ...(inv.destinationAddress ? { destinationAddress: inv.destinationAddress } : {}),
    pieces: inv.pieces,
    weight: toNumber(inv.weight),
    amount: toNumber(inv.amount),
    status: inv.status === 'Cancelled' ? 'Cancelled' : 'Issued',
    ...(inv.notes ? { notes: inv.notes } : {}),
  };
}
