import { apiFetch } from './apiClient';
import { AvailableShipment, ProformaInvoice } from '@/models/types';

export const proformaService = {
  list: () => apiFetch<ProformaInvoice[]>('/proforma'),
  available: () => apiFetch<AvailableShipment[]>('/proforma/available-shipments'),
  create: (d: unknown) => apiFetch<ProformaInvoice>('/proforma', { method: 'POST', body: JSON.stringify(d) }),
  update: (id: number, d: unknown) => apiFetch<ProformaInvoice>(`/proforma/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (id: number) => apiFetch<{ success: boolean; id: number }>(`/proforma/${id}`, { method: 'DELETE' }),
};