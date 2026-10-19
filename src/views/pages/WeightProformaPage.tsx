import React, { useState } from 'react';
import { useWeightProformaController } from '@/controllers/useWeightProformaController';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { WeightProformaModal } from '../components/weightProforma/WeightProformaModal';
import { WeightProformaViewModal } from '../components/weightProforma/WeightProformaViewModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { WeightProforma } from '@/models/types';
import { calculateProformaTotals } from '@/models/weight';
import { formatDate } from '@/utils/formatters';
import { Plus, Search, Edit2, Printer, Trash2, Scale } from 'lucide-react';

export const WeightProformaPage: React.FC = () => {
  const {
    proformas,
    shipments,
    search,
    setSearch,
    loading,
    createProforma,
    updateProforma,
    deleteProforma,
  } = useWeightProformaController();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProforma, setEditingProforma] = useState<WeightProforma | null>(null);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingProforma, setViewingProforma] = useState<WeightProforma | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleOpenAdd = () => {
    setEditingProforma(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (wp: WeightProforma) => {
    setEditingProforma(wp);
    setModalOpen(true);
  };

  const handleOpenView = (wp: WeightProforma) => {
    setViewingProforma(wp);
    setViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Weight Proforma</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Box-by-box actual vs. dimensional (volumetric) weight, and chargeable weight billed to clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            onClick={handleOpenAdd}
            icon={<Plus className="w-4 h-4" />}
            data-testid="new-wp-btn"
          >
            New Weight Proforma
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-card p-4 border border-slate-200/80 shadow-card flex items-center gap-3">
        <div className="relative flex-1 w-full">
          <Input
            placeholder="Search by C/N No., Shipper, AWB..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="search-wp-input"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Proforma Cards List */}
      <div className="space-y-3">
        {proformas.length > 0 ? (
          proformas.map(wp => {
            const totals = calculateProformaTotals(wp.boxes, wp.divisor);
            const linkedShipment = wp.shipmentId
              ? shipments.find(s => s.id === wp.shipmentId)
              : null;

            return (
              <div
                key={wp.id}
                className="bg-white rounded-card p-5 border border-slate-200/80 shadow-card hover:shadow-cardHover transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="mono font-extrabold text-sm text-[#00A6BD]">
                      C/N {wp.cnNo}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">&bull;</span>
                    <span className="text-xs text-slate-500 font-semibold">{formatDate(wp.date)}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1 truncate">
                    {wp.shipper}
                  </h3>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {wp.services || '—'}{' '}
                    {linkedShipment && (
                      <span className="text-blue-700 font-bold ml-1">
                        &bull; Linked to AWB {linkedShipment.awb} ({linkedShipment.destination})
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 self-stretch md:self-auto py-2 md:py-0 border-y md:border-y-0 border-slate-100">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Boxes
                    </div>
                    <div className="mono text-sm font-extrabold text-slate-900 mt-0.5">
                      {wp.boxes.length}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Act. Weight
                    </div>
                    <div className="mono text-sm font-extrabold text-slate-900 mt-0.5">
                      {totals.totalAct.toFixed(2)} KG
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#C81320]">
                      Ch. Weight
                    </div>
                    <div className="mono text-base font-black text-[#292929] mt-0.5">
                      {totals.totalCh.toFixed(2)} KG
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenEdit(wp)}
                    icon={<Edit2 className="w-3.5 h-3.5" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenView(wp)}
                    icon={<Printer className="w-3.5 h-3.5" />}
                  >
                    Print / PDF
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteId(wp.id)}
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-card border border-slate-200">
            <Scale className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No Weight Proforma records yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;+ New Weight Proforma&quot; to calculate chargeable weight for client consignments
            </p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <WeightProformaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        proformaToEdit={editingProforma}
        shipments={shipments}
        onSave={async data => {
          if (editingProforma) {
            await updateProforma(editingProforma.id, data);
          } else {
            await createProforma(data);
          }
        }}
      />

      {/* Document View Modal */}
      <WeightProformaViewModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        proforma={viewingProforma}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) deleteProforma(deleteId);
        }}
        title="Delete Weight Proforma"
        message="Are you sure you want to delete this weight proforma record? This action cannot be undone."
      />
    </div>
  );
};
