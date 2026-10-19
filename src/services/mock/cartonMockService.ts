import { CartonType, CartonMovement, CartonUsedLine, NewCartonType } from '@/models/types';
import { SEED_CARTON_TYPES, SEED_CARTON_MOVEMENTS } from './cartonSeedData';

const KEYS = {
  TYPES: 'alliance_carton_types',
  MOVEMENTS: 'alliance_carton_movements',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const p = JSON.parse(raw);
    if (Array.isArray(fallback) && (!Array.isArray(p) || p.length === 0)) return fallback;
    return p;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}

/* ---- Carton Types ---- */
export function getCartonTypes(): CartonType[] {
  return read<CartonType[]>(KEYS.TYPES, SEED_CARTON_TYPES);
}

export function saveCartonType(ct: NewCartonType): CartonType {
  const { openingQuantity, openingUnitCost, ...typeData } = ct;
  const types = getCartonTypes();
  const id = types.length ? Math.max(...types.map(t => t.id)) + 1 : 1;
  const newType: CartonType = { ...typeData, id };
  write(KEYS.TYPES, [...types, newType]);

  // Opening stock entered on the "New Carton Type" form
  if (openingQuantity && openingQuantity > 0) {
    addCartonMovement({
      cartonTypeId: id,
      date: new Date().toISOString().slice(0, 10),
      movementType: 'RECEIVED',
      quantity: openingQuantity,
      unitCost: openingUnitCost ?? null,
      note: 'Opening stock',
      createdBy: 'admin',
    });
  }
  return newType;
}

export function updateCartonType(id: number, patch: Partial<Omit<CartonType, 'id'>>): CartonType {
  const types = getCartonTypes().map(t => t.id === id ? { ...t, ...patch } : t);
  write(KEYS.TYPES, types);
  return types.find(t => t.id === id)!;
}

/**
 * Deletes a carton type together with its stock movements.
 * Refused when the box type has been used in a shipment, so shipment
 * history never points at a box type that no longer exists.
 */
export function deleteCartonType(id: number): void {
  const types = getCartonTypes();
  const target = types.find(t => t.id === id);
  if (!target) throw new Error('Carton type not found — it may already have been deleted');
  const movements = getCartonMovements();
  const usedIn = new Set(
    movements.filter(m => m.cartonTypeId === id && m.shipmentId).map(m => m.shipmentId)
  );
  if (usedIn.size > 0) {
    throw new Error(
      `"${target.name}" is used in ${usedIn.size} shipment(s) and cannot be deleted. Edit it and mark it inactive instead.`
    );
  }
  write(KEYS.TYPES, types.filter(t => t.id !== id));
  write(KEYS.MOVEMENTS, movements.filter(m => m.cartonTypeId !== id));
}

/* ---- Carton Movements ---- */
export function getCartonMovements(): CartonMovement[] {
  return read<CartonMovement[]>(KEYS.MOVEMENTS, SEED_CARTON_MOVEMENTS);
}

export function addCartonMovement(m: Omit<CartonMovement, 'id' | 'createdAt'>): CartonMovement {
  const movements = getCartonMovements();
  const id = movements.length ? Math.max(...movements.map(x => x.id)) + 1 : 1;
  const now = new Date().toISOString();
  const newM: CartonMovement = { ...m, id, createdAt: now };
  write(KEYS.MOVEMENTS, [...movements, newM]);
  return newM;
}

/** Called by shipment save: appends USED movements for each line */
export function applyCartonsUsed(
  cartonsUsed: CartonUsedLine[],
  shipmentId: number,
  date: string,
  createdBy: string
): void {
  for (const line of cartonsUsed) {
    if (line.quantity > 0) {
      addCartonMovement({
        cartonTypeId: line.cartonTypeId,
        date,
        movementType: 'USED',
        quantity: line.quantity,
        shipmentId,
        note: `Used in shipment #${shipmentId}`,
        createdBy,
      });
    }
  }
}

export function resetCartonData(): void {
  write(KEYS.TYPES, SEED_CARTON_TYPES);
  write(KEYS.MOVEMENTS, SEED_CARTON_MOVEMENTS);
}
