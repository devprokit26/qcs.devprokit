import { IShipmentService, ShipmentFilterOptions } from '../api/interfaces';
import { Shipment, ShipmentStatus } from '@/models/types';
import { apiFetch } from './apiClient';

/** Maps a DB shipment row to the frontend Shipment type */
function mapShipment(s: any): Shipment {
  return {
    id: s.id,
    date: s.date,
    customerId: s.customerId ?? null,
    customerName: s.customerName,
    isWalkIn: s.isWalkIn,
    walkInName: s.walkInName ?? undefined,
    courier: s.courier,
    service: s.service,
    awb: s.awb,
    origin: s.origin ?? '',
    destination: s.destination,
    destinationAddress: s.destinationAddress ?? undefined,
    productName: s.productName ?? undefined,
    pieces: s.pieces,
    weight: Number(s.weight),
    shipInv: s.shipInv ?? undefined,
    jobNo: s.jobNo ?? undefined,
    revenue: Number(s.revenue),
    cost: Number(s.cost),
    status: s.status,
    notes: s.notes ?? undefined,
    consignee: s.consignee ?? '',
    cartonsUsed: (s.cartonsUsed ?? []).map((c: any) => ({
      cartonTypeId: c.cartonTypeId,
      quantity: c.quantity,
    })),
  };
}

export class ShipmentRestService implements IShipmentService {
  async getShipments(filter?: ShipmentFilterOptions): Promise<Shipment[]> {
    const params = new URLSearchParams();
    if (filter?.search)  params.append('search', filter.search);
    if (filter?.status && filter.status !== '' && filter.status !== 'All')
      params.append('status', filter.status);
    if (filter?.range)   params.append('range', filter.range);
    if (filter?.from)    params.append('from', filter.from);
    if (filter?.to)      params.append('to', filter.to);
    const q = params.toString();
    const rows = await apiFetch<any[]>(`/shipments${q ? `?${q}` : ''}`);
    return rows.map(mapShipment);
  }

  async getShipmentById(id: number): Promise<Shipment | null> {
    try {
      const row = await apiFetch<any>(`/shipments/${id}`);
      return mapShipment(row);
    } catch {
      return null;
    }
  }

  async getUnfinalShipments(): Promise<Shipment[]> {
    return this.getShipments({ status: 'Unfinal' });
  }

  async createShipment(
    data: Omit<Shipment, 'id'>,
    overrideCredit = false
  ): Promise<{ shipment: Shipment; warning?: string }> {
    const payload = {
      ...data,
      overrideCredit,
      cartonsUsed: data.cartonsUsed ?? [],
    };

    const result = await apiFetch<any>('/shipments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // If apiFetch returned an empty/queued object (offline), return offline warning
    if (!result || (typeof result === 'object' && !result.id && !result.awb && !result.shipment)) {
      return {
        shipment: data as any,
        warning: 'You are offline: the shipment was saved on this device and will sync automatically when you are back online.',
      };
    }

    const row = result.shipment ? result.shipment : result;
    const warning = result.warning || row.warning;

    return {
      shipment: mapShipment(row),
      warning,
    };
  }

  async updateShipment(
    id: number,
    data: Omit<Shipment, 'id'>,
    overrideCredit = false
  ): Promise<{ shipment: Shipment; warning?: string }> {
    const payload = { ...data, overrideCredit, cartonsUsed: data.cartonsUsed ?? [] };

    const result = await apiFetch<any>(`/shipments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    // If apiFetch returned an empty/queued object (offline), return offline warning
    if (!result || (typeof result === 'object' && !result.id && !result.awb && !result.shipment)) {
      return {
        shipment: { ...data, id } as any,
        warning: 'You are offline: the shipment was saved on this device and will sync automatically when you are back online.',
      };
    }

    const row = result.shipment ? result.shipment : result;
    const warning = result.warning || row.warning;

    return {
      shipment: mapShipment(row),
      warning,
    };
  }

  async updateShipmentStatus(id: number, status: ShipmentStatus): Promise<Shipment> {
    const row = await apiFetch<any>(`/shipments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return mapShipment(row);
  }

  async deleteShipment(id: number): Promise<boolean> {
    await apiFetch(`/shipments/${id}`, { method: 'DELETE' });
    return true;
  }
}

export const shipmentService = new ShipmentRestService();
