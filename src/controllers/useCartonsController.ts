import { useState, useCallback, useEffect } from 'react';
import { CartonType, CartonMovement, MovementType, NewCartonType } from '@/models/types';
import { buildStockSummary, CartonStockRow } from '@/models/cartons';
import { cartonService } from '@/services';
import toast from 'react-hot-toast';

export interface CartonsState {
  cartonTypes: CartonType[];
  movements: CartonMovement[];
  stockSummary: CartonStockRow[];
  lowStockCount: number;
  loading: boolean;
}

export interface CartonsActions {
  refresh: () => void;
  addType: (ct: NewCartonType) => void;
  editType: (id: number, patch: Partial<Omit<CartonType, 'id'>>) => void;
  deleteType: (id: number) => Promise<boolean>;
  addMovement: (m: Omit<CartonMovement, 'id' | 'createdAt'>) => void;
  resetDemo: () => void;
  getStock: (cartonTypeId: number) => number;
  movementsForType: (cartonTypeId: number) => CartonMovement[];
}

export function useCartonsController(): CartonsState & CartonsActions {
  const [cartonTypes, setCartonTypes] = useState<CartonType[]>([]);
  const [movements, setMovements] = useState<CartonMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const types = await cartonService.getCartonTypes();
      const movs = await cartonService.getCartonMovements();
      setCartonTypes(types);
      setMovements(movs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stockSummary: CartonStockRow[] = buildStockSummary(
    movements,
    cartonTypes.map(t => t.id),
    Object.fromEntries(cartonTypes.map(t => [t.id, t.lowStockThreshold]))
  );

  const lowStockCount = stockSummary.filter(r => r.isLow).length;

  const addType = useCallback(async (ct: NewCartonType) => {
    try {
      await cartonService.saveCartonType(ct);
      const qty = ct.openingQuantity ?? 0;
      toast.success(
        qty > 0
          ? `Carton type "${ct.name}" created with ${qty} pcs opening stock`
          : `Carton type "${ct.name}" created`
      );
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create carton type');
    }
  }, [load]);

  const editType = useCallback(async (id: number, patch: Partial<Omit<CartonType, 'id'>>) => {
    try {
      await cartonService.updateCartonType(id, patch);
      toast.success('Carton type updated');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update carton type');
    }
  }, [load]);

  const deleteType = useCallback(async (id: number): Promise<boolean> => {
    try {
      const name = cartonTypes.find(t => t.id === id)?.name ?? 'Carton type';
      await cartonService.deleteCartonType(id);
      toast.success(`"${name}" deleted`);
      await load();
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete carton type');
      return false;
    }
  }, [load, cartonTypes]);

  const addMovement = useCallback(async (m: Omit<CartonMovement, 'id' | 'createdAt'>) => {
    try {
      await cartonService.addCartonMovement(m);
      const label: Record<MovementType, string> = {
        RECEIVED: 'Stock received',
        USED: 'Stock used',
        ADJUSTMENT_IN: 'Adjustment (in) recorded',
        ADJUSTMENT_OUT: 'Adjustment (out) recorded',
        RETURNED: 'Return recorded',
      };
      toast.success(label[m.movementType] ?? 'Movement recorded');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to record movement');
    }
  }, [load]);

  const resetDemo = useCallback(async () => {
    await cartonService.resetCartonData();
    toast.success('Carton data reset to demo');
    await load();
  }, [load]);

  const getStock = useCallback(
    (cartonTypeId: number) =>
      stockSummary.find(r => r.cartonTypeId === cartonTypeId)?.stock ?? 0,
    [stockSummary]
  );

  const movementsForType = useCallback(
    (cartonTypeId: number) =>
      movements.filter(m => m.cartonTypeId === cartonTypeId).slice().reverse(),
    [movements]
  );

  return {
    cartonTypes,
    movements,
    stockSummary,
    lowStockCount,
    loading,
    refresh: load,
    addType,
    editType,
    deleteType,
    addMovement,
    resetDemo,
    getStock,
    movementsForType,
  };
}
