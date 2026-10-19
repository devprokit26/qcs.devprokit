/**
 * REST implementations for Carton functions.
 * The controller imports these same function names from here when VITE_USE_MOCK=false.
 * Function signatures MUST exactly match cartonMockService.ts exports.
 */
import { CartonType, CartonMovement, CartonUsedLine, NewCartonType } from '@/models/types';
import { apiFetch } from './apiClient';

/* ---- Carton Types ---- */

export async function getCartonTypes(): Promise<CartonType[]> {
  return apiFetch<CartonType[]>('/cartons/types');
}

export async function saveCartonType(ct: NewCartonType): Promise<CartonType> {
  return apiFetch<CartonType>('/cartons/types', {
    method: 'POST',
    body: JSON.stringify(ct),
  });
}

export async function updateCartonType(
  id: number,
  patch: Partial<Omit<CartonType, 'id'>>
): Promise<CartonType> {
  return apiFetch<CartonType>(`/cartons/types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteCartonType(id: number): Promise<void> {
  await apiFetch(`/cartons/types/${id}`, { method: 'DELETE' });
}

/* ---- Movements ---- */

export async function getCartonMovements(): Promise<CartonMovement[]> {
  return apiFetch<CartonMovement[]>('/cartons/movements');
}

export async function addCartonMovement(
  m: Omit<CartonMovement, 'id' | 'createdAt'>
): Promise<CartonMovement> {
  return apiFetch<CartonMovement>('/cartons/movements', {
    method: 'POST',
    body: JSON.stringify(m),
  });
}

export async function applyCartonsUsed(
  lines: CartonUsedLine[],
  shipmentId: number,
  date: string,
  createdBy: string
): Promise<void> {
  // Send each carton line as a USED movement to the backend
  await Promise.all(
    lines.map(line =>
      apiFetch('/cartons/movements', {
        method: 'POST',
        body: JSON.stringify({
          cartonTypeId: line.cartonTypeId,
          quantity: line.quantity,
          movementType: 'USED',
          shipmentId,
          date,
          createdBy,
        }),
      })
    )
  );
}

export async function resetCartonData(): Promise<void> {
  // No-op in REST mode
  return Promise.resolve();
}
