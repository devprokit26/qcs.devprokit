import { IWeightProformaService } from '../api/interfaces';
import { WeightProforma } from '@/models/types';
import { apiFetch } from './apiClient';

export class WeightProformaRestService implements IWeightProformaService {
  async getProformas(search: string = ''): Promise<WeightProforma[]> {
    const q = new URLSearchParams();
    if (search) q.append('search', search);
    return apiFetch<WeightProforma[]>(`/weight-proformas?${q.toString()}`);
  }

  async getProformaById(id: number): Promise<WeightProforma | null> {
    return apiFetch<WeightProforma>(`/weight-proformas/${id}`);
  }

  async createProforma(data: Omit<WeightProforma, 'id'>): Promise<WeightProforma> {
    return apiFetch<WeightProforma>('/weight-proformas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProforma(id: number, data: Partial<WeightProforma>): Promise<WeightProforma> {
    return apiFetch<WeightProforma>(`/weight-proformas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProforma(id: number): Promise<boolean> {
    await apiFetch(`/weight-proformas/${id}`, { method: 'DELETE' });
    return true;
  }
}

export const weightProformaService = new WeightProformaRestService();
