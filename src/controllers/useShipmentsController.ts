import { useState, useEffect, useCallback } from 'react';
import { Shipment, ShipmentStatus, Customer, Vendor } from '@/models/types';
import { shipmentService, ledgerService, vendorService, ShipmentFilterOptions } from '@/services';
import { exportShipmentsPDF } from '@/utils/pdfExport';
import toast from 'react-hot-toast';

export function useShipmentsController() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<ShipmentFilterOptions>({
    search: '',
    status: '',
    range: 'all',
    from: '',
    to: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [shipmentList, custList, vendList] = await Promise.all([
        shipmentService.getShipments(filter),
        ledgerService.getCustomers(),
        vendorService.getVendors(),
      ]);
      setShipments(shipmentList);
      setCustomers(custList);
      setVendors(vendList);
    } catch (_err) {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const refreshVendors = async () => {
    try {
      const vendList = await vendorService.getVendors();
      setVendors(vendList);
    } catch {
      // ignore error
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createShipment = async (
    data: Omit<Shipment, 'id'>,
    overrideCredit: boolean = false
  ): Promise<Shipment | null> => {
    try {
      const res = await shipmentService.createShipment(data, overrideCredit);
      if (res.warning) {
        toast(res.warning, { icon: '⚠️', duration: 5000 });
      }
      toast.success(
        data.isWalkIn
          ? 'Walk-in cash shipment booked!'
          : `Shipment booked for ${res.shipment.customerName}!`
      );
      await loadData();
      return res.shipment;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to book shipment';
      toast.error(msg, { duration: 6000 });
      return null;
    }
  };

  const updateShipment = async (
    id: number,
    data: Omit<Shipment, 'id'>,
    overrideCredit: boolean = false
  ): Promise<Shipment | null> => {
    try {
      const res = await shipmentService.updateShipment(id, data, overrideCredit);
      if (res.warning) {
        toast(res.warning, { icon: '⚠️', duration: 5000 });
      }
      toast.success('Shipment updated successfully!');
      await loadData();
      return res.shipment;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update shipment';
      toast.error(msg, { duration: 6000 });
      return null;
    }
  };

  const updateStatus = async (id: number, status: ShipmentStatus) => {
    try {
      const updated = await shipmentService.updateShipmentStatus(id, status);
      toast.success(`Status updated to "${status}" for ${updated.awb}`);
      setShipments(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const deleteShipment = async (id: number) => {
    try {
      await shipmentService.deleteShipment(id);
      toast.success('Shipment removed');
      await loadData();
    } catch {
      toast.error('Failed to delete shipment');
    }
  };

  const exportPDF = async () => {
    if (shipments.length === 0) {
      toast.error('There are no shipments in the selected period to export');
      return;
    }
    const rangeLabel = filter.range === 'all'
      ? 'All Time'
      : filter.range === 'today'
      ? 'Today'
      : filter.range === 'week'
      ? 'Last 7 Days'
      : filter.range === 'month'
      ? 'Last 30 Days'
      : `From ${filter.from} to ${filter.to}`;

    await exportShipmentsPDF(shipments, rangeLabel);
  };

  // Range summary calculations
  const totalRevenue = shipments.reduce((sum, s) => sum + s.revenue, 0);
  const totalCost = shipments.reduce((sum, s) => sum + s.cost, 0);
  const totalProfit = totalRevenue - totalCost;

  return {
    shipments,
    customers,
    vendors,
    loading,
    filter,
    setFilter,
    createShipment,
    updateShipment,
    updateStatus,
    deleteShipment,
    exportPDF,
    refresh: loadData,
    refreshVendors,
    summary: {
      count: shipments.length,
      revenue: totalRevenue,
      cost: totalCost,
      profit: totalProfit,
    },
  };
}
