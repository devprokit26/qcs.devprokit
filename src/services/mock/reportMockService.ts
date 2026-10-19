import {
  IReportService,
  AnalyticsSummary,
  CourierReportRow,
  DestinationReportRow,
  CustomerReportRow,
  DashboardCreditWarning,
} from '../api/interfaces';
import { storage } from './storage';
import { calculateCustomerBalance } from '@/models/balance';
import { calculateCustomerAging } from '@/models/aging';

export class ReportMockService implements IReportService {
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    await new Promise(r => setTimeout(r, 40));
    const shipments = storage.getShipments();
    const unfinalAwbs = shipments.filter(s => s.status === 'Unfinal').map(s => s.awb);
    const customers = storage.getCustomers();
    const vendors = storage.getVendors();
    const customerLedgers = storage.getCustomerLedger();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayShipments = shipments.filter(s => s.date === todayStr).length;

    const totalRevenue = shipments.reduce((sum, s) => sum + s.revenue, 0);
    const totalCost = shipments.reduce((sum, s) => sum + s.cost, 0);
    const netProfit = totalRevenue - totalCost;
    const profitMarginPercent = totalRevenue > 0
      ? Number(((netProfit / totalRevenue) * 100).toFixed(1))
      : 0;

    // Top courier
    const courierCounts: Record<string, number> = {};
    shipments.forEach(s => {
      courierCounts[s.courier] = (courierCounts[s.courier] || 0) + 1;
    });
    const topCourierEntry = Object.entries(courierCounts).sort((a, b) => b[1] - a[1])[0];
    const topCourier = topCourierEntry ? { name: topCourierEntry[0], count: topCourierEntry[1] } : null;

    // Top customer
    const customerCounts: Record<string, number> = {};
    shipments.forEach(s => {
      customerCounts[s.customerName] = (customerCounts[s.customerName] || 0) + 1;
    });
    const topCustomerEntry = Object.entries(customerCounts).sort((a, b) => b[1] - a[1])[0];
    const topCustomer = topCustomerEntry ? { name: topCustomerEntry[0], count: topCustomerEntry[1] } : null;

    // Outstanding receivable
    let outstandingReceivable = 0;
    let overdueAlertCount = 0;
    const agingTotals = { current: 0, d1_30: 0, d31_60: 0, d60plus: 0 };

    customers.forEach(c => {
      const txns = customerLedgers.find(l => l.customerId === c.id)?.transactions || [];
      const balance = calculateCustomerBalance(c, txns);
      if (balance > 0) {
        outstandingReceivable += balance;
      }
      const aging = calculateCustomerAging(c, txns);
      agingTotals.current += aging.current;
      agingTotals.d1_30 += aging.d1_30;
      agingTotals.d31_60 += aging.d31_60;
      agingTotals.d60plus += aging.d60plus;
      overdueAlertCount += aging.overdueInvoices.length;
    });

    return {
      todayShipments,
      totalShipments: shipments.length,
      totalRevenue,
      totalCost,
      netProfit,
      profitMarginPercent,
      topCourier,
      topCustomer,
      outstandingReceivable,
      totalCustomers: customers.length,
      totalVendors: vendors.length,
      overdueAlertCount,
      unfinalAwbs,
      agingTotals,
    };
  }

  async getRevenueCostTrend(days: number = 7): Promise<Array<{ day: string; label: string; revenue: number; cost: number; profit: number }>> {
    await new Promise(r => setTimeout(r, 40));
    const shipments = storage.getShipments();

    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return d.toISOString().split('T')[0];
    });

    return dates.map(day => {
      const dayShipments = shipments.filter(s => s.date === day);
      const revenue = dayShipments.reduce((sum, s) => sum + s.revenue, 0);
      const cost = dayShipments.reduce((sum, s) => sum + s.cost, 0);
      const profit = revenue - cost;
      const label = new Date(day + 'T00:00:00').toLocaleDateString('en-PK', {
        weekday: 'short',
        day: 'numeric',
      });

      return {
        day,
        label,
        revenue,
        cost,
        profit,
      };
    });
  }

  async getStatusDistribution(): Promise<Record<string, number>> {
    await new Promise(r => setTimeout(r, 20));
    const shipments = storage.getShipments();
    const map: Record<string, number> = {
      Pending: 0,
      Shipped: 0,
      Delivered: 0,
      Returned: 0,
      Unfinal: 0,
    };
    shipments.forEach(s => {
      map[s.status] = (map[s.status] || 0) + 1;
    });
    return map;
  }

  async getServiceDistribution(): Promise<Record<string, number>> {
    await new Promise(r => setTimeout(r, 20));
    const shipments = storage.getShipments();
    const map: Record<string, number> = {
      Express: 0,
      Economy: 0,
      Standard: 0,
      Overnight: 0,
    };
    shipments.forEach(s => {
      map[s.service] = (map[s.service] || 0) + 1;
    });
    return map;
  }

  async getCourierReport(): Promise<CourierReportRow[]> {
    await new Promise(r => setTimeout(r, 40));
    const shipments = storage.getShipments();
    const totalCount = shipments.length || 1;

    const stats: Record<string, { count: number; revenue: number; cost: number }> = {};
    shipments.forEach(s => {
      if (!stats[s.courier]) {
        stats[s.courier] = { count: 0, revenue: 0, cost: 0 };
      }
      stats[s.courier].count++;
      stats[s.courier].revenue += s.revenue;
      stats[s.courier].cost += s.cost;
    });

    return Object.entries(stats)
      .map(([courier, data]) => {
        const profit = data.revenue - data.cost;
        const marginPercent = data.revenue > 0 ? Number(((profit / data.revenue) * 100).toFixed(1)) : 0;
        const sharePercent = Number(((data.count / totalCount) * 100).toFixed(1));

        return {
          courier,
          count: data.count,
          revenue: data.revenue,
          cost: data.cost,
          profit,
          marginPercent,
          sharePercent,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }

  async getDestinationReport(): Promise<DestinationReportRow[]> {
    await new Promise(r => setTimeout(r, 40));
    const shipments = storage.getShipments();
    const stats: Record<string, { count: number; totalWeight: number; revenue: number }> = {};

    shipments.forEach(s => {
      if (!stats[s.destination]) {
        stats[s.destination] = { count: 0, totalWeight: 0, revenue: 0 };
      }
      stats[s.destination].count++;
      stats[s.destination].totalWeight += s.weight;
      stats[s.destination].revenue += s.revenue;
    });

    return Object.entries(stats)
      .map(([destination, data]) => ({
        destination,
        count: data.count,
        totalWeight: Number(data.totalWeight.toFixed(1)),
        revenue: data.revenue,
        avgRevenue: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  async getCustomerReport(): Promise<CustomerReportRow[]> {
    await new Promise(r => setTimeout(r, 50));
    const shipments = storage.getShipments();
    const customers = storage.getCustomers();
    const customerLedgers = storage.getCustomerLedger();

    return customers.map(c => {
      const custShipments = shipments.filter(s => s.customerId === c.id && !s.isWalkIn);
      const totalPaid = custShipments.reduce((sum, s) => sum + s.revenue, 0);
      const txns = customerLedgers.find(l => l.customerId === c.id)?.transactions || [];
      const balance = calculateCustomerBalance(c, txns);

      let status: 'Owes' | 'Paid' | 'Advance' = 'Paid';
      if (balance > 0) status = 'Owes';
      else if (balance < 0) status = 'Advance';

      return {
        customerId: c.id,
        name: c.name,
        shipments: custShipments.length,
        totalPaid,
        outstanding: balance,
        status,
      };
    }).sort((a, b) => b.shipments - a.shipments);
  }

  async getCreditWarnings(): Promise<DashboardCreditWarning> {
    await new Promise(r => setTimeout(r, 20));
    const customers = storage.getCustomers();
    const customerLedgers = storage.getCustomerLedger();
    const overLimit: DashboardCreditWarning['overLimit'] = [];
    const lockedLate: DashboardCreditWarning['lockedLate'] = [];

    for (const cust of customers) {
      const txns = customerLedgers.find(l => l.customerId === cust.id)?.transactions || [];
      const balance = calculateCustomerBalance(cust, txns);
      const aging   = calculateCustomerAging(cust, txns);

      if (cust.creditLimit > 0 && balance > cust.creditLimit) {
        overLimit.push({ customer: cust, balance, limit: cust.creditLimit, exceedBy: balance - cust.creditLimit });
      }
      if (aging.oldestDaysOverdue > 0 && balance > 0) {
        lockedLate.push({ customer: cust, daysOverdue: aging.oldestDaysOverdue, creditDays: cust.creditDays || 30 });
      }
    }

    return { overLimit, lockedLate };
  }
}

export const reportService = new ReportMockService();
