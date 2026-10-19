import { IProformaService } from '../api/interfaces';
import { AvailableShipment, ProformaDraft, ProformaInvoice } from '@/models/types';
import { storage } from './storage';

const FIRST_PROFORMA_SERIAL = 5_700_001;

export class ProformaMockService implements IProformaService {
  async list(): Promise<ProformaInvoice[]> {
    await new Promise(resolve => setTimeout(resolve, 30));
    return storage.getProformaInvoices().sort((a, b) => b.serialNo - a.serialNo);
  }

  async available(): Promise<AvailableShipment[]> {
    await new Promise(resolve => setTimeout(resolve, 30));
    const usedShipmentIds = new Set(
      storage.getProformaInvoices()
        .map(row => row.shipmentId)
        .filter((id): id is number => id != null && id > 0)
    );
    return storage.getShipments()
      .filter(shipment => !usedShipmentIds.has(shipment.id))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
      .map(shipment => ({
        id: shipment.id,
        awb: shipment.awb,
        date: shipment.date,
        origin: shipment.origin,
        destination: shipment.destination,
        courier: shipment.courier,
        productName: shipment.productName || '',
        pieces: shipment.pieces,
        weight: shipment.weight,
      }));
  }

  async create(data: ProformaDraft): Promise<ProformaInvoice> {
    const rows = storage.getProformaInvoices();
    const shipmentId = data.shipmentId || null;
    if (shipmentId && rows.some(row => row.shipmentId === shipmentId)) {
      throw new Error('This shipment already has a proforma invoice');
    }
    const serialNo = Math.max(FIRST_PROFORMA_SERIAL - 1, ...rows.map(row => row.serialNo)) + 1;
    const shipment = shipmentId ? storage.getShipments().find(row => row.id === shipmentId) : undefined;
    const created: ProformaInvoice = {
      ...data,
      id: rows.reduce((max, row) => Math.max(max, row.id), 0) + 1,
      serialNo,
      shipmentId,
      exchangeRate: data.currency === 'PKR' ? null : data.exchangeRate,
      awb: shipment?.awb ?? data.awb,
      shipDate: shipment?.date ?? data.shipDate,
      origin: shipment?.origin ?? data.origin,
      destination: shipment?.destination ?? data.destination,
      pieces: shipment?.pieces ?? data.pieces,
      weight: shipment?.weight ?? data.weight,
      createdAt: new Date().toISOString(),
    };
    storage.setProformaInvoices([created, ...rows]);
    return created;
  }

  async update(id: number, data: ProformaDraft): Promise<ProformaInvoice> {
    const rows = storage.getProformaInvoices();
    const index = rows.findIndex(row => row.id === id);
    if (index < 0) throw new Error('Proforma not found');
    const shipmentId = data.shipmentId || null;
    if (shipmentId && rows.some(row => row.id !== id && row.shipmentId === shipmentId)) {
      throw new Error('This shipment already has a proforma invoice');
    }
    const updated: ProformaInvoice = {
      ...rows[index],
      ...data,
      shipmentId,
      exchangeRate: data.currency === 'PKR' ? null : data.exchangeRate,
    };
    rows[index] = updated;
    storage.setProformaInvoices(rows);
    return updated;
  }

  async delete(id: number): Promise<{ success: boolean; id: number }> {
    const rows = storage.getProformaInvoices();
    if (!rows.some(row => row.id === id)) throw new Error('Proforma not found');
    storage.setProformaInvoices(rows.filter(row => row.id !== id));
    return { success: true, id };
  }
}

export const proformaService = new ProformaMockService();
