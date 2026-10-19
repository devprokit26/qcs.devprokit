import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PrintDocument } from '../common/PrintDocument';
import { WeightProforma } from '@/models/types';
import { calculateBoxWeights, calculateProformaTotals } from '@/models/weight';
import { formatDateSlash } from '@/utils/formatters';
import { exportWeightProformaPDF } from '@/utils/pdfExport';
import { Printer, Download } from 'lucide-react';

interface WeightProformaViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proforma: WeightProforma | null;
}

export const WeightProformaViewModal: React.FC<WeightProformaViewModalProps> = ({
  isOpen,
  onClose,
  proforma,
}) => {
  if (!proforma) return null;

  const totals = calculateProformaTotals(proforma.boxes, proforma.divisor);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    void exportWeightProformaPDF(proforma, totals);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Weight Proforma Document"
      subtitle={`C/N No. ${proforma.cnNo} — ${proforma.shipper}`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full no-print">
          <div className="text-xs text-slate-500 font-medium">
            Official chargeable weight worksheet
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
              Print
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportPDF} icon={<Download className="w-4 h-4" />}>
              Export PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <PrintDocument
        docTitle="WEIGHT PROFORMA"
        docRef={`C/N No. ${proforma.cnNo}`}
        docDate={formatDateSlash(proforma.date)}
        closingNote="Qadir Cargo Service • Official chargeable weight worksheet."
      >
        {/* Metadata Table */}
        <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse border border-slate-900 text-xs">
          <tbody>
            <tr>
              <td className="border border-slate-900 bg-[#FEF3C7] text-[#C81320] font-extrabold px-3 py-2 w-28">
                C/N No.
              </td>
              <td className="border border-slate-900 font-bold px-3 py-2 mono">{proforma.cnNo}</td>
              <td className="border border-slate-900 bg-[#FEF3C7] text-[#C81320] font-extrabold px-3 py-2 w-28">
                Services
              </td>
              <td className="border border-slate-900 font-semibold px-3 py-2">{proforma.services}</td>
              <td className="border border-slate-900 bg-[#FEF3C7] text-[#C81320] font-extrabold px-3 py-2 w-24">
                Date
              </td>
              <td className="border border-slate-900 font-bold px-3 py-2 mono">{formatDateSlash(proforma.date)}</td>
            </tr>
            <tr>
              <td className="border border-slate-900 bg-[#FEF3C7] text-[#C81320] font-extrabold px-3 py-2">
                Shipper
              </td>
              <td colSpan={5} className="border border-slate-900 font-extrabold px-3 py-2 text-sm text-[#292929]">
                {proforma.shipper}
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 bg-[#FEF3C7] text-[#C81320] font-extrabold px-3 py-2">
                PCS.
              </td>
              <td className="border border-slate-900 font-bold px-3 py-2 mono">{proforma.boxes.length}</td>
              <td className="border border-slate-900 bg-[#FEF3C7] text-[#C81320] font-extrabold px-3 py-2">
                Chg Wt.
              </td>
              <td colSpan={3} className="border border-slate-900 font-black px-3 py-2 text-sm mono text-[#00A6BD]">
                {totals.totalCh.toFixed(2)} KG
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        {/* Box Detail Table */}
        <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse border border-slate-900 text-xs">
          <thead className="bg-[#292929] text-white">
            <tr>
              <th className="border border-slate-900 py-2 px-3 text-center w-16">Box No.</th>
              <th className="border border-slate-900 py-2 px-3 text-right">Act. Weight (KG)</th>
              <th className="border border-slate-900 py-2 px-3 text-center">Dimension (Cm)</th>
              <th className="border border-slate-900 py-2 px-3 text-right">Dim Weight (KG)</th>
              <th className="border border-slate-900 py-2 px-3 text-right">Ch. Weight (KG)</th>
            </tr>
          </thead>
          <tbody>
            {proforma.boxes.map((b, i) => {
              const calc = calculateBoxWeights(b, proforma.divisor);
              return (
                <tr key={i} className="border-b border-slate-300">
                  <td className="border border-slate-900 py-2 px-3 text-center font-bold">{i + 1}</td>
                  <td className="border border-slate-900 py-2 px-3 text-right mono">{calc.actWeight.toFixed(2)}</td>
                  <td className="border border-slate-900 py-2 px-3 text-center mono">
                    {calc.l} &times; {calc.w} &times; {calc.h}
                  </td>
                  <td className="border border-slate-900 py-2 px-3 text-right mono">{calc.dimWeight.toFixed(2)}</td>
                  <td className="border border-slate-900 py-2 px-3 text-right mono font-bold text-[#292929]">
                    {calc.chWeight.toFixed(2)}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-[#FEF3C7] font-black border-t-2 border-slate-900 text-slate-900">
              <td className="border border-slate-900 py-2 px-3 text-center">TOTAL</td>
              <td className="border border-slate-900 py-2 px-3 text-right mono">{totals.totalAct.toFixed(2)}</td>
              <td className="border border-slate-900 py-2 px-3 text-center text-[10px] text-slate-500">
                Divisor: {proforma.divisor || 5000}
              </td>
              <td className="border border-slate-900 py-2 px-3 text-right mono">{totals.totalDim.toFixed(2)}</td>
              <td className="border border-slate-900 py-2 px-3 text-right mono text-sm font-black text-[#C81320]">
                {totals.totalCh.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </PrintDocument>
    </Modal>
  );
};
