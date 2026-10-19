import { useState, useEffect, useCallback } from 'react';
import { WeightProforma, Shipment } from '@/models/types';
import { weightProformaService, shipmentService } from '@/services';
import { calculateProformaTotals } from '@/models/weight';
import { exportWeightProformaPDF } from '@/utils/pdfExport';
import toast from 'react-hot-toast';

export function useWeightProformaController() {
  const [proformas, setProformas] = useState<WeightProforma[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [list, sList] = await Promise.all([
        weightProformaService.getProformas(search),
        shipmentService.getShipments(),
      ]);
      setProformas(list);
      setShipments(sList);
    } catch {
      toast.error('Failed to load weight proformas');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const createProforma = async (data: Omit<WeightProforma, 'id'>) => {
    try {
      const created = await weightProformaService.createProforma(data);
      toast.success(`Weight Proforma C/N ${created.cnNo} created!`);
      await loadData();
      return created;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create weight proforma');
      return null;
    }
  };

  const updateProforma = async (id: number, data: Partial<WeightProforma>) => {
    try {
      const updated = await weightProformaService.updateProforma(id, data);
      toast.success(`Weight Proforma C/N ${updated.cnNo} updated!`);
      await loadData();
      return updated;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update weight proforma');
      return null;
    }
  };

  const deleteProforma = async (id: number) => {
    try {
      await weightProformaService.deleteProforma(id);
      toast.success('Weight Proforma deleted');
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete weight proforma');
    }
  };

  const exportPDF = async (proforma: WeightProforma) => {
    const totals = calculateProformaTotals(proforma.boxes, proforma.divisor);
    await exportWeightProformaPDF(proforma, totals);
  };

  return {
    proformas,
    shipments,
    search,
    setSearch,
    loading,
    createProforma,
    updateProforma,
    deleteProforma,
    exportPDF,
    refresh: loadData,
  };
}
