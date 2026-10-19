import { WeightBox } from './types';

export interface CalculatedBoxRow {
  actWeight: number;
  l: number;
  w: number;
  h: number;
  dimWeight: number;
  chWeight: number;
}

export interface ProformaTotals {
  totalAct: number;
  totalDim: number;
  totalCh: number;
  count: number;
}

/**
 * Pure function: Calculates dimensional and chargeable weight for a single box.
 * Dim weight = (L * W * H) / divisor
 * Chargeable weight = max(actual, dim)
 */
export function calculateBoxWeights(
  box: { actWeight?: number; l?: number; w?: number; h?: number },
  divisor: number = 5000
): CalculatedBoxRow {
  const actWeight = Number(box.actWeight) || 0;
  const l = Number(box.l) || 0;
  const w = Number(box.w) || 0;
  const h = Number(box.h) || 0;

  const dimWeight = (l > 0 && w > 0 && h > 0 && divisor > 0)
    ? Number(((l * w * h) / divisor).toFixed(2))
    : 0;

  const chWeight = Number(Math.max(actWeight, dimWeight).toFixed(2));

  return {
    actWeight,
    l,
    w,
    h,
    dimWeight,
    chWeight,
  };
}

/**
 * Pure function: Computes sum of actual, dimensional, and chargeable weights across all boxes.
 */
export function calculateProformaTotals(
  boxes: Array<{ actWeight?: number; l?: number; w?: number; h?: number }>,
  divisor: number = 5000
): ProformaTotals {
  let totalAct = 0;
  let totalDim = 0;
  let totalCh = 0;

  boxes.forEach(b => {
    const row = calculateBoxWeights(b, divisor);
    totalAct += row.actWeight;
    totalDim += row.dimWeight;
    totalCh += row.chWeight;
  });

  return {
    totalAct: Number(totalAct.toFixed(2)),
    totalDim: Number(totalDim.toFixed(2)),
    totalCh: Number(totalCh.toFixed(2)),
    count: boxes.length,
  };
}
