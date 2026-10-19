"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsSummary = getAnalyticsSummary;
exports.getRevenueCostTrend = getRevenueCostTrend;
exports.getStatusDistribution = getStatusDistribution;
exports.getServiceDistribution = getServiceDistribution;
exports.getCourierReport = getCourierReport;
exports.getDestinationReport = getDestinationReport;
exports.getCustomerReport = getCustomerReport;
exports.getCreditWarnings = getCreditWarnings;
const client_1 = require("../../prisma/client");
const dates_1 = require("../../lib/dates");
const aging_1 = require("../../lib/domain/aging");
const balance_1 = require("../../lib/domain/balance");
const credit_1 = require("../../lib/domain/credit");
const serialize_1 = require("../../lib/serialize");
function toNum(d) {
    if (d == null)
        return 0;
    return typeof d === 'number' ? d : Number(d.toString());
}
async function getAnalyticsSummary() {
    const today = (0, dates_1.todayStr)();
    const [totalShipments, todayShipments, unfinalShipments, totalCustomers, totalVendors, revCost, courierGroups, customerGroups, allCustomers,] = await Promise.all([
        client_1.prisma.shipment.count(),
        client_1.prisma.shipment.count({ where: { date: today } }),
        client_1.prisma.shipment.findMany({
            where: { status: 'Unfinal' },
            select: { awb: true },
            orderBy: [{ date: 'desc' }, { id: 'desc' }],
        }),
        client_1.prisma.customer.count(),
        client_1.prisma.vendor.count(),
        client_1.prisma.shipment.aggregate({
            _sum: { revenue: true, cost: true },
        }),
        client_1.prisma.shipment.groupBy({
            by: ['courier'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 1,
        }),
        client_1.prisma.shipment.groupBy({
            by: ['customerName'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 1,
        }),
        client_1.prisma.customer.findMany({
            include: {
                ledgerEntries: true,
            },
        }),
    ]);
    const totalRevenue = toNum(revCost._sum.revenue);
    const totalCost = toNum(revCost._sum.cost);
    const netProfit = totalRevenue - totalCost;
    const profitMarginPercent = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
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
        const sc = (0, serialize_1.serializeCustomer)(cust);
        const txs = cust.ledgerEntries.map(serialize_1.serializeLedgerTransaction);
        const aging = (0, aging_1.calculateCustomerAging)(sc, txs);
        const balance = (0, balance_1.calculateCustomerBalance)(sc, txs);
        if (balance > 0)
            outstandingReceivable += balance;
        if (aging.totalOverdue > 0)
            overdueAlertCount++;
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
            d1_30: Math.round(agingTotals.d1_30),
            d31_60: Math.round(agingTotals.d31_60),
            d60plus: Math.round(agingTotals.d60plus),
        },
    };
}
async function getRevenueCostTrend(days = 7) {
    const today = (0, dates_1.todayStr)();
    const dates = Array.from({ length: days }, (_, i) => {
        return (0, dates_1.shiftDateStr)(today, -(days - 1 - i));
    });
    const shipments = await client_1.prisma.shipment.findMany({
        where: { date: { gte: dates[0], lte: dates[dates.length - 1] } },
        select: { date: true, revenue: true, cost: true },
    });
    const byDay = {};
    for (const s of shipments) {
        if (!byDay[s.date])
            byDay[s.date] = { revenue: 0, cost: 0 };
        byDay[s.date].revenue += toNum(s.revenue);
        byDay[s.date].cost += toNum(s.cost);
    }
    return dates.map(day => {
        const data = byDay[day] ?? { revenue: 0, cost: 0 };
        const profit = data.revenue - data.cost;
        const [y, m, d] = day.split('-').map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));
        const label = dt.toLocaleDateString('en-PK', {
            weekday: 'short',
            day: 'numeric',
            timeZone: 'UTC',
        });
        return { day, label, revenue: data.revenue, cost: data.cost, profit };
    });
}
async function getStatusDistribution() {
    const groups = await client_1.prisma.shipment.groupBy({
        by: ['status'],
        _count: { id: true },
    });
    const base = {
        Pending: 0, Shipped: 0, Delivered: 0, Returned: 0, Unfinal: 0,
    };
    for (const g of groups) {
        base[g.status] = g._count.id;
    }
    return base;
}
async function getServiceDistribution() {
    const groups = await client_1.prisma.shipment.groupBy({
        by: ['service'],
        _count: { id: true },
    });
    const base = {
        Express: 0, Economy: 0, Standard: 0, Overnight: 0,
    };
    for (const g of groups) {
        base[g.service] = g._count.id;
    }
    return base;
}
async function getCourierReport() {
    const groups = await client_1.prisma.shipment.groupBy({
        by: ['courier'],
        _count: { id: true },
        _sum: { revenue: true, cost: true },
    });
    const totalCount = groups.reduce((s, g) => s + g._count.id, 0) || 1;
    return groups
        .map(g => {
        const revenue = toNum(g._sum.revenue);
        const cost = toNum(g._sum.cost);
        const profit = revenue - cost;
        const count = g._count.id;
        return {
            courier: g.courier,
            count,
            revenue,
            cost,
            profit,
            marginPercent: revenue > 0 ? Number(((profit / revenue) * 100).toFixed(1)) : 0,
            sharePercent: Number(((count / totalCount) * 100).toFixed(1)),
        };
    })
        .sort((a, b) => b.revenue - a.revenue);
}
async function getDestinationReport() {
    const groups = await client_1.prisma.shipment.groupBy({
        by: ['destination'],
        _count: { id: true },
        _sum: { weight: true, revenue: true },
    });
    return groups
        .map(g => {
        const count = g._count.id;
        const totalWeight = toNum(g._sum.weight);
        const revenue = toNum(g._sum.revenue);
        return {
            destination: g.destination,
            count,
            totalWeight: Number(totalWeight.toFixed(1)),
            revenue,
            avgRevenue: count > 0 ? Math.round(revenue / count) : 0,
        };
    })
        .sort((a, b) => b.revenue - a.revenue);
}
async function getCustomerReport() {
    const customers = await client_1.prisma.customer.findMany({
        include: {
            shipments: { select: { revenue: true } },
            ledgerEntries: true,
        },
        orderBy: { id: 'asc' },
    });
    return customers
        .map(c => {
        const sc = (0, serialize_1.serializeCustomer)(c);
        const txs = c.ledgerEntries.map(serialize_1.serializeLedgerTransaction);
        const totalPaid = c.shipments.reduce((s, sh) => s + toNum(sh.revenue), 0);
        const outstanding = (0, balance_1.calculateCustomerBalance)(sc, txs);
        let status = 'Paid';
        if (outstanding > 0)
            status = 'Owes';
        if (outstanding < 0)
            status = 'Advance';
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
async function getCreditWarnings() {
    const customers = await client_1.prisma.customer.findMany({
        include: {
            ledgerEntries: true,
        },
    });
    const overLimit = [];
    const lockedLate = [];
    for (const cust of customers) {
        const sc = (0, serialize_1.serializeCustomer)(cust);
        const txs = cust.ledgerEntries.map(serialize_1.serializeLedgerTransaction);
        const balance = (0, balance_1.calculateCustomerBalance)(sc, txs);
        const check = (0, credit_1.checkCustomerCredit)(sc, txs, 0);
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
//# sourceMappingURL=reports.service.js.map