import { CartonMovement } from './types';

/** Compute available stock from the append-only movement ledger */
export function computeStock(movements: CartonMovement[], cartonTypeId: number): number {
  return movements
    .filter(m => m.cartonTypeId === cartonTypeId)
    .reduce((acc, m) => {
      switch (m.movementType) {
        case 'RECEIVED':
        case 'ADJUSTMENT_IN':
        case 'RETURNED':
          return acc + m.quantity;
        case 'USED':
        case 'ADJUSTMENT_OUT':
          return acc - m.quantity;
        default:
          return acc;
      }
    }, 0);
}

/** Compute total received for a carton type */
export function totalReceived(movements: CartonMovement[], cartonTypeId: number): number {
  return movements
    .filter(m => m.cartonTypeId === cartonTypeId && (m.movementType === 'RECEIVED' || m.movementType === 'ADJUSTMENT_IN' || m.movementType === 'RETURNED'))
    .reduce((s, m) => s + m.quantity, 0);
}

/** Compute total used for a carton type */
export function totalUsed(movements: CartonMovement[], cartonTypeId: number): number {
  return movements
    .filter(m => m.cartonTypeId === cartonTypeId && (m.movementType === 'USED' || m.movementType === 'ADJUSTMENT_OUT'))
    .reduce((s, m) => s + m.quantity, 0);
}

/** Returns true if stock is below the low-stock threshold */
export function isLowStock(stock: number, threshold: number): boolean {
  return stock <= threshold;
}

export interface CartonStockRow {
  cartonTypeId: number;
  stock: number;
  totalIn: number;
  totalOut: number;
  isLow: boolean;
}

/** Build a full stock summary map for all carton type IDs */
export function buildStockSummary(
  movements: CartonMovement[],
  cartonTypeIds: number[],
  thresholds: Record<number, number>
): CartonStockRow[] {
  return cartonTypeIds.map(id => {
    const stock = computeStock(movements, id);
    const totalIn = totalReceived(movements, id);
    const totalOut = totalUsed(movements, id);
    return {
      cartonTypeId: id,
      stock,
      totalIn,
      totalOut,
      isLow: isLowStock(stock, thresholds[id] ?? 5),
    };
  });
}
