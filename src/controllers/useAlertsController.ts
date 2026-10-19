import { useState, useEffect, useCallback } from 'react';
import { shipmentService, ledgerService } from '@/services';
import { Shipment } from '@/models/types';
import { calculateCustomerAging } from '@/models/aging';
import toast from 'react-hot-toast';

export interface OverdueAlertItem {
  customerId: number;
  customerName: string;
  phone: string;
  email: string;
  creditDays: number;
  date: string;
  description: string;
  amount: number;
  daysOverdue: number;
  severity: {
    label: string;
    badgeClass: string;
    textClass: string;
    borderClass: string;
  };
}

export function useAlertsController() {
  const [alerts, setAlerts] = useState<OverdueAlertItem[]>([]);
  const [unfinalShipments, setUnfinalShipments] = useState<Shipment[]>([]);
  const [filter, setFilter] = useState<'all' | '1_30' | '31_60' | '60plus'>('all');
  const [loading, setLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const [customers, unfinalList] = await Promise.all([
        ledgerService.getCustomers(),
        shipmentService.getUnfinalShipments(),
      ]);
      setUnfinalShipments(unfinalList);

      const customerAlerts = await Promise.all(customers.map(async customer => {
        const txns = await ledgerService.getCustomerTransactions(customer.id);
        const aging = calculateCustomerAging(customer, txns);

        return aging.overdueInvoices.map(invoice => {
          let severity = {
            label: '1–30 Days',
            badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
            textClass: 'text-amber-600',
            borderClass: 'border-l-amber-500',
          };
          if (invoice.daysOverdue > 60) {
            severity = {
              label: '60+ Days',
              badgeClass: 'bg-red-100 text-red-800 border-red-200',
              textClass: 'text-red-600',
              borderClass: 'border-l-red-500',
            };
          } else if (invoice.daysOverdue > 30) {
            severity = {
              label: '31–60 Days',
              badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
              textClass: 'text-orange-600',
              borderClass: 'border-l-orange-500',
            };
          }

          return {
            customerId: customer.id,
            customerName: customer.name,
            phone: customer.phone,
            email: customer.email,
            creditDays: customer.creditDays || 30,
            date: invoice.date,
            description: invoice.description,
            amount: invoice.amount,
            daysOverdue: invoice.daysOverdue,
            severity,
          };
        });
      }));

      setAlerts(customerAlerts.flat().sort((a, b) => b.daysOverdue - a.daysOverdue));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const filteredAlerts = alerts.filter(alert => {
    if (filter === '1_30') return alert.daysOverdue <= 30;
    if (filter === '31_60') return alert.daysOverdue > 30 && alert.daysOverdue <= 60;
    if (filter === '60plus') return alert.daysOverdue > 60;
    return true;
  });

  return {
    alerts: filteredAlerts,
    unfinalShipments,
    totalCount: alerts.length + unfinalShipments.length,
    filter,
    setFilter,
    loading,
    refresh: loadAlerts,
  };
}
