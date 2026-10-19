import { prisma } from '../../prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { todayStr, shiftDateStr } from '../../lib/dates';
import { calculateCustomerAging, calculateVendorAging } from '../../lib/domain/aging';
import { calculateCustomerBalance, calculateVendorBalance } from '../../lib/domain/balance';
import { checkCustomerCredit } from '../../lib/domain/credit';
import { serializeCustomer, serializeLedgerTransaction } from '../../lib/serialize';

function toNum(d: Decimal | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === 'number' ? d : Number(d.toString());
}

export async function getAnalyticsSummary() {
  const today = todayStr();

  const [
    totalShipments,
    todayShipments,
    unfinalShipments,
    totalCustomers,
    totalVendors,
    revCost,
    courierGroups,
    customerGroups,
    allCustomers,
  ] = await Promise.all([
    prisma.shipment.count(),
    prisma.shipment.count({ where: { date: today } }),
    prisma.shipment.findMany({
      where: { status: 'Unfinal' },
      select: { awb: true },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    }),
    prisma.customer.count(),
    prisma.vendor.count(),
    prisma.shipment.aggregate({
      _sum: { revenue: true, cost: true },
    }),
    prisma.shipment.groupBy({
      by: ['courier'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    }),
    prisma.shipment.groupBy({
      by: ['customerName'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    }),
    prisma.customer.findMany({
      include: {
        ledgerEntries: true,
      },
    }),
  ]);

  const totalRevenue = toNum(revCost._sum.revenue);
  const totalCost    = toNum(revCost._sum.cost);
  const netProfit    = totalRevenue - totalCost;
  const profitMarginPercent =
    totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

  const topCourier = courierGroups[0]
    ? { name: courierGroups[0].courier, count: courierGroups[0]._count.id }
    : null;

  const topCustomer = customerGroups[0]
    ? { name: customerGroups[0].customerName, count: customerGroups[0]._count.id }
    : null;

  let outstandingReceivable = 0;
  let overdueAlertCount = 0;
  const agingTotals = { current: 0, d1_30: 0, d31_60: 0, d60plus: 0 };

  for (const cust of allCustomers) {
    const sc = serializeCustomer(cust);
    const txs = cust.ledgerEntries.map(serializeLedgerTransaction);
    const aging = calculateCustomerAging(sc, txs);
    const balance = calculateCustomerBalance(sc, txs);

    if (balance > 0) outstandingReceivable += balance;
    if (aging.totalOverdue > 0) overdueAlertCount++;

    agingTotals.current += aging.current;
    agingTotals.d1_30 += aging.d1_30;
    agingTotals.d31_60 += aging.d31_60;
    agingTotals.d60plus += aging.d60plus;
  }

  return {
    todayShipments,
    totalShipments,
    totalRevenue,
    totalCost,
    netProfit,
    profitMarginPercent,
    topCourier,
    topCustomer,
    outstandingReceivable: Math.round(outstandingReceivable),
    totalCustomers,
    totalVendors,
    overdueAlertCount,
    unfinalAwbs: unfinalShipments.map(shipment => shipment.awb),
    agingTotals: {
      current: Math.round(agingTotals.current),
      d1_30:   Math.round(agingTotals.d1_30),
      d31_60:  Math.round(agingTotals.d31_60),
      d60plus: Math.round(agingTotals.d60plus),
    },
  };
}

export async function getRevenueCostTrend(days: number = 7) {
  const today = todayStr();

  const dates = Array.from({ length: days }, (_, i) => {
    return shiftDateStr(today, -(days - 1 - i));
  });

  const shipments = await prisma.shipment.findMany({
    where: { date: { gte: dates[0], lte: dates[dates.length - 1] } },
    select: { date: true, revenue: true, cost: true },
  });

  const byDay: Record<string, { revenue: number; cost: number }> = {};
  for (const s of shipments) {
    if (!byDay[s.date]) byDay[s.date] = { revenue: 0, cost: 0 };
    byDay[s.date].revenue += toNum(s.revenue);
    byDay[s.date].cost    += toNum(s.cost);
  }

  return dates.map(day => {
    const data   = byDay[day] ?? { revenue: 0, cost: 0 };
    const profit = data.revenue - data.cost;
    const [y, m, d] = day.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    const label  = dt.toLocaleDateString('en-PK', {
      weekday: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    return { day, label, revenue: data.revenue, cost: data.cost, profit };
  });
}

export async function getStatusDistribution(): Promise<Record<string, number>> {
  const groups = await prisma.shipment.groupBy({
    by: ['status'],
    _count: { id: true },
  });
  const base: Record<string, number> = {
    Pending: 0, Shipped: 0, Delivered: 0, Returned: 0, Unfinal: 0,
  };
  for (const g of groups) {
    base[g.status] = g._count.id;
  }
  return base;
}

export async function getServiceDistribution(): Promise<Record<string, number>> {
  const groups = await prisma.shipment.groupBy({
    by: ['service'],
    _count: { id: true },
  });
  const base: Record<string, number> = {
    Express: 0, Economy: 0, Standard: 0, Overnight: 0,
  };
  for (const g of groups) {
    base[g.service] = g._count.id;
  }
  return base;
}

export async function getCourierReport() {
  const groups = await prisma.shipment.groupBy({
    by: ['courier'],
    _count: { id: true },
    _sum: { revenue: true, cost: true },
  });
  const totalCount = groups.reduce((s, g) => s + g._count.id, 0) || 1;

  return groups
    .map(g => {
      const revenue = toNum(g._sum.revenue);
      const cost    = toNum(g._sum.cost);
      const profit  = revenue - cost;
      const count   = g._count.id;
      return {
        courier:       g.courier,
        count,
        revenue,
        cost,
        profit,
        marginPercent: revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0,
        sharePercent:  Number(((count / totalCount) * 100).toFixed(1)),
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getDestinationReport() {
  const groups = await prisma.shipment.groupBy({
    by: ['destination'],
    _count: { id: true },
    _sum: { weight: true, revenue: true },
  });

  return groups
    .map(g => {
      const count       = g._count.id;
      const totalWeight = toNum(g._sum.weight);
      const revenue     = toNum(g._sum.revenue);
      return {
        destination: g.destination,
        count,
        totalWeight: Number(totalWeight.toFixed(1)),
        revenue,
        avgRevenue:  count > 0 ? Math.round(revenue / count) : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getCustomerReport() {
  const customers = await prisma.customer.findMany({
    include: {
      shipments: { select: { revenue: true } },
      ledgerEntries: true,
    },
    orderBy: { id: 'asc' },
  });

  return customers
    .map(c => {
      const sc = serializeCustomer(c);
      const txs = c.ledgerEntries.map(serializeLedgerTransaction);
      const totalPaid = c.shipments.reduce((s, sh) => s + toNum(sh.revenue), 0);
      const outstanding = calculateCustomerBalance(sc, txs);

      let status: 'Owes' | 'Paid' | 'Advance' = 'Paid';
      if (outstanding > 0)  status = 'Owes';
      if (outstanding < 0)  status = 'Advance';

      return {
        customerId: c.id,
        name: c.name,
        shipments: c.shipments.length,
        totalPaid,
        outstanding,
        status,
      };
    })
    .sort((a, b) => b.shipments - a.shipments);
}

export async function getCreditWarnings() {
  const customers = await prisma.customer.findMany({
    include: {
      ledgerEntries: true,
    },
  });

  const overLimit: Array<{
    customer: any;
    balance: number;
    limit: number;
    exceedBy: number;
  }> = [];
  const lockedLate: Array<{
    customer: any;
    daysOverdue: number;
    creditDays: number;
  }> = [];

  for (const cust of customers) {
    const sc = serializeCustomer(cust);
    const txs = cust.ledgerEntries.map(serializeLedgerTransaction);
    const balance = calculateCustomerBalance(sc, txs);
    const check = checkCustomerCredit(sc, txs, 0);

    if (check.exceed) {
      overLimit.push({
        customer: sc,
        balance,
        limit: sc.creditLimit,
        exceedBy: check.exceedBy,
      });
    }

    if (check.daysLateBreach && balance > 0) {
      lockedLate.push({
        customer: sc,
        daysOverdue: check.oldestDaysOverdue,
        creditDays: sc.creditDays,
      });
    }
  }

  return { overLimit, lockedLate };
}
