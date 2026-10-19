import { IShipmentService, ShipmentFilterOptions } from '../api/interfaces';

import { Shipment, ShipmentStatus } from '@/models/types';
import { storage } from './storage';
import { checkCustomerCredit } from '@/models/credit';
import { generateShipmentCreateEntries, generateShipmentUpdateEntries } from '@/models/ledger';
import { applyCartonsUsed } from './cartonMockService';
import { todayLocal } from '@/utils/dates';

export class ShipmentMockService implements IShipmentService {
  async getShipments(filter?: ShipmentFilterOptions): Promise<Shipment[]> {
    await new Promise(r => setTimeout(r, 40));
    let list = storage.getShipments();

    if (!filter) return list;

    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        s =>
          s.awb.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q) ||
          s.courier.toLowerCase().includes(q) ||
          s.destination.toLowerCase().includes(q) ||
          (s.origin && s.origin.toLowerCase().includes(q))
      );
    }

    if (filter.status && filter.status !== 'All' && filter.status !== '') {
      list = list.filter(s => s.status.toLowerCase() === filter.status?.toLowerCase());
    }

    const todayStr = todayLocal();
    let from: string | null = null;
    let to: string | null = null;

    if (filter.range === 'today') {
      from = todayStr;
      to = todayStr;
    } else if (filter.range === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      from = d.toISOString().split('T')[0];
      to = todayStr;
    } else if (filter.range === 'month') {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      from = d.toISOString().split('T')[0];
      to = todayStr;
    } else if (filter.range === 'custom') {
      from = filter.from || null;
      to = filter.to || null;
    }

    if (from) list = list.filter(s => s.date >= from!);
    if (to) list = list.filter(s => s.date <= to!);

    // Sort by date descending, then id descending
    return list.sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return diff !== 0 ? diff : b.id - a.id;
    });
  }

  async getShipmentById(id: number): Promise<Shipment | null> {
    await new Promise(r => setTimeout(r, 20));
    return storage.getShipments().find(s => s.id === id) || null;
  }

  async createShipment(
    data: Omit<Shipment, 'id'>,
    overrideCredit: boolean = false
  ): Promise<{ shipment: Shipment; warning?: string }> {
    await new Promise(r => setTimeout(r, 90));
    if (data.status === 'Unfinal') data = { ...data, revenue: 0, cost: 0 };
    const customers = storage.getCustomers();
    const vendors = storage.getVendors();
    const customerLedgers = storage.getCustomerLedger();
    const vendorLedgers = storage.getVendorLedger();
    let counters = storage.getVoucherCounters();

    const customer = !data.isWalkIn && data.customerId
      ? customers.find(c => c.id === data.customerId) || null
      : null;

    // Credit check for non-walk-in
    let warning: string | undefined;
    if (!data.isWalkIn && customer) {
      const custTxns = customerLedgers.find(l => l.customerId === customer.id)?.transactions || [];
      const check = checkCustomerCredit(customer, custTxns, data.revenue);

      if (check.daysLateBreach && !overrideCredit) {
        throw new Error(
          `Booking blocked: ${customer.name} has an overdue invoice ${check.oldestDaysOverdue} days past terms (${check.creditDays}d terms). Check override to proceed.`
        );
      }
      if (check.exceed && !overrideCredit) {
        throw new Error(
          `Credit limit exceeded: ${customer.name} limit is PKR ${check.creditLimit.toLocaleString()}, new balance will exceed by PKR ${check.exceedBy.toLocaleString()}. Check override to proceed.`
        );
      }
      if (check.exceed) {
        warning = `Customer exceeds credit limit by PKR ${check.exceedBy.toLocaleString()}`;
      }
    }

    const shipments = storage.getShipments();
    const nextId = shipments.length ? Math.max(...shipments.map(s => s.id)) + 1 : 1;

    const newShipment: Shipment = {
      id: nextId,
      ...data,
      revenue: Number(data.revenue) || 0,
      cost: Number(data.cost) || 0,
      weight: Number(data.weight) || 0,
      pieces: Number(data.pieces) || 1,
    };

    // Find vendor matching courier name
    const courierVendor = vendors.find(
      v => v.name.toLowerCase() === data.courier.toLowerCase()
    ) || null;

    // Generate auto-posting ledger actions via pure model
    const posting = generateShipmentCreateEntries(newShipment, customer, courierVendor, counters);
    counters = posting.updatedCounters;
    storage.setVoucherCounters(counters);

    // Apply ledger postings
    posting.actions.forEach(action => {
      if (action.target === 'customer') {
        let rec = customerLedgers.find(l => l.customerId === action.entityId);
        if (!rec) {
          rec = { customerId: action.entityId, transactions: [] };
          customerLedgers.push(rec);
        }
        rec.transactions.unshift(action.transaction);
      } else if (action.target === 'vendor') {
        let rec = vendorLedgers.find(l => l.vendorId === action.entityId);
        if (!rec) {
          rec = { vendorId: action.entityId, transactions: [] };
          vendorLedgers.push(rec);
        }
        rec.transactions.unshift(action.transaction);
      }
    });

    storage.setCustomerLedger(customerLedgers);
    storage.setVendorLedger(vendorLedgers);

    shipments.unshift(newShipment);
    storage.setShipments(shipments);

    // Auto-deduct carton inventory stock
    if (newShipment.cartonsUsed && newShipment.cartonsUsed.length > 0) {
      applyCartonsUsed(newShipment.cartonsUsed, newShipment.id, newShipment.date, 'system');
    }

    return { shipment: newShipment, warning };
  }

  async updateShipment(
    id: number,
    data: Omit<Shipment, 'id'>,
    overrideCredit: boolean = false
  ): Promise<{ shipment: Shipment; warning?: string }> {
    await new Promise(r => setTimeout(r, 90));
    if (data.status === 'Unfinal') data = { ...data, revenue: 0, cost: 0 };
    const shipments = storage.getShipments();
    const idx = shipments.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Shipment not found');

    const oldShipment = shipments[idx];
    const customers = storage.getCustomers();
    const vendors = storage.getVendors();
    const customerLedgers = storage.getCustomerLedger();
    const vendorLedgers = storage.getVendorLedger();
    let counters = storage.getVoucherCounters();

    const oldCustomer = !oldShipment.isWalkIn && oldShipment.customerId
      ? customers.find(c => c.id === oldShipment.customerId) || null
      : null;
    const newCustomer = !data.isWalkIn && data.customerId
      ? customers.find(c => c.id === data.customerId) || null
      : null;

    const oldVendor = vendors.find(v => v.name.toLowerCase() === oldShipment.courier.toLowerCase()) || null;
    const newVendor = vendors.find(v => v.name.toLowerCase() === data.courier.toLowerCase()) || null;

    // Credit check on update if customer changed or revenue increased
    let warning: string | undefined;
    if (!data.isWalkIn && newCustomer) {
      let revenueDelta = data.revenue;
      if (!oldShipment.isWalkIn && oldShipment.customerId === data.customerId) {
        revenueDelta = data.revenue - oldShipment.revenue;
      }

      if (revenueDelta > 0) {
        const custTxns = customerLedgers.find(l => l.customerId === newCustomer.id)?.transactions || [];
        const check = checkCustomerCredit(newCustomer, custTxns, revenueDelta);

        if (check.daysLateBreach && !overrideCredit) {
          throw new Error(
            `Booking blocked: ${newCustomer.name} has an overdue invoice ${check.oldestDaysOverdue} days past terms. Check override to proceed.`
          );
        }
        if (check.exceed && !overrideCredit) {
          throw new Error(
            `Credit limit exceeded: ${newCustomer.name} limit is PKR ${check.creditLimit.toLocaleString()}, will exceed by PKR ${check.exceedBy.toLocaleString()}. Check override to proceed.`
          );
        }
        if (check.exceed) {
          warning = `Customer exceeds credit limit by PKR ${check.exceedBy.toLocaleString()}`;
        }
      }
    }

    const updatedShipment: Shipment = {
      id,
      ...data,
      revenue: Number(data.revenue) || 0,
      cost: Number(data.cost) || 0,
      weight: Number(data.weight) || 0,
      pieces: Number(data.pieces) || 1,
    };

    // Generate update ledger postings via pure model
    const posting = generateShipmentUpdateEntries(
      oldShipment,
      updatedShipment,
      oldCustomer,
      newCustomer,
      oldVendor,
      newVendor,
      counters
    );
    counters = posting.updatedCounters;
    storage.setVoucherCounters(counters);

    posting.actions.forEach(action => {
      if (action.target === 'customer') {
        let rec = customerLedgers.find(l => l.customerId === action.entityId);
        if (!rec) {
          rec = { customerId: action.entityId, transactions: [] };
          customerLedgers.push(rec);
        }
        rec.transactions.unshift(action.transaction);
      } else if (action.target === 'vendor') {
        let rec = vendorLedgers.find(l => l.vendorId === action.entityId);
        if (!rec) {
          rec = { vendorId: action.entityId, transactions: [] };
          vendorLedgers.push(rec);
        }
        rec.transactions.unshift(action.transaction);
      }
    });

    storage.setCustomerLedger(customerLedgers);
    storage.setVendorLedger(vendorLedgers);

    shipments[idx] = updatedShipment;
    storage.setShipments(shipments);

    // Auto-deduct carton inventory if cartons changed
    if (updatedShipment.cartonsUsed && updatedShipment.cartonsUsed.length > 0) {
      // Only apply newly added cartons (diff from old)
      const oldLines = oldShipment.cartonsUsed || [];
      const newLines = updatedShipment.cartonsUsed.filter(nl => {
        const old = oldLines.find(ol => ol.cartonTypeId === nl.cartonTypeId);
        return !old || nl.quantity > old.quantity;
      }).map(nl => {
        const old = oldLines.find(ol => ol.cartonTypeId === nl.cartonTypeId);
        return { cartonTypeId: nl.cartonTypeId, quantity: nl.quantity - (old?.quantity ?? 0) };
      }).filter(l => l.quantity > 0);
      if (newLines.length > 0) {
        applyCartonsUsed(newLines, updatedShipment.id, updatedShipment.date, 'system');
      }
    }

    return { shipment: updatedShipment, warning };
  }

  async updateShipmentStatus(id: number, status: ShipmentStatus): Promise<Shipment> {
    await new Promise(r => setTimeout(r, 40));
    const shipments = storage.getShipments();
    const idx = shipments.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Shipment not found');

    if (shipments[idx].status === 'Unfinal' && status !== 'Unfinal') {
      throw new Error('Finalize this shipment from Alerts to enter revenue and cost.');
    }
    if (status === 'Unfinal') {
      const result = await this.updateShipment(id, {
        ...shipments[idx],
        revenue: 0,
        cost: 0,
        status,
      });
      return result.shipment;
    }

    shipments[idx].status = status;
    storage.setShipments(shipments);
    return shipments[idx];
  }

  async getUnfinalShipments(): Promise<Shipment[]> {
    await new Promise(r => setTimeout(r, 40));
    return storage.getShipments().filter(s => s.status === 'Unfinal');
  }


  async deleteShipment(id: number): Promise<boolean> {
    await new Promise(r => setTimeout(r, 60));
    const shipments = storage.getShipments().filter(s => s.id !== id);
    storage.setShipments(shipments);
    return true;
  }
}

export const shipmentService = new ShipmentMockService();
