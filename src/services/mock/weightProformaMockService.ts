import { IWeightProformaService } from '../api/interfaces';
import { WeightProforma } from '@/models/types';
import { storage } from './storage';

export class WeightProformaMockService implements IWeightProformaService {
  async getProformas(search: string = ''): Promise<WeightProforma[]> {
    await new Promise(r => setTimeout(r, 40));
    const all = storage.getWeightProformas();
    if (!search.trim()) return all;

    const q = search.toLowerCase();
    const shipments = storage.getShipments();

    return all.filter(w => {
      const linked = w.shipmentId ? shipments.find(s => s.id === w.shipmentId) : null;
      return (
        w.cnNo.toLowerCase().includes(q) ||
        w.shipper.toLowerCase().includes(q) ||
        w.services.toLowerCase().includes(q) ||
        (linked && linked.awb.toLowerCase().includes(q))
      );
    });
  }

  async getProformaById(id: number): Promise<WeightProforma | null> {
    await new Promise(r => setTimeout(r, 20));
    return storage.getWeightProformas().find(w => w.id === id) || null;
  }

  async createProforma(data: Omit<WeightProforma, 'id'>): Promise<WeightProforma> {
    await new Promise(r => setTimeout(r, 70));
    const list = storage.getWeightProformas();
    const nextId = list.length ? Math.max(...list.map(w => w.id)) + 1 : 1;
    const newProforma: WeightProforma = {
      id: nextId,
      ...data,
      divisor: Number(data.divisor) || 5000,
    };
    list.unshift(newProforma);
    storage.setWeightProformas(list);
    return newProforma;
  }

  async updateProforma(id: number, data: Partial<WeightProforma>): Promise<WeightProforma> {
    await new Promise(r => setTimeout(r, 60));
    const list = storage.getWeightProformas();
    const idx = list.findIndex(w => w.id === id);
    if (idx === -1) throw new Error('Weight Proforma record not found');

    const updated: WeightProforma = {
      ...list[idx],
      ...data,
      divisor: data.divisor !== undefined ? Number(data.divisor) : list[idx].divisor,
    };
    list[idx] = updated;
    storage.setWeightProformas(list);
    return updated;
  }

  async deleteProforma(id: number): Promise<boolean> {
    await new Promise(r => setTimeout(r, 60));
    const list = storage.getWeightProformas().filter(w => w.id !== id);
    storage.setWeightProformas(list);
    return true;
  }
}

export const weightProformaService = new WeightProformaMockService();
