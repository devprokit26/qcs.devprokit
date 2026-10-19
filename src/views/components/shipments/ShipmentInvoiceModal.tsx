import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PrintDocument } from '../common/PrintDocument';
import { Shipment, Customer } from '@/models/types';
import { formatDateSlash, formatPKR, formatNum } from '@/utils/formatters';
import { exportInvoicePDF } from '@/utils/pdfExport';
import { Printer, Download } from 'lucide-react';

interface ShipmentInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  customer?: Customer | null;
}

export const ShipmentInvoiceModal: React.FC<ShipmentInvoiceModalProps> = ({
  isOpen,
  onClose,
  shipment,
  customer,
}) => {
  if (!shipment) return null;

  const isPaid = !!shipment.isWalkIn;
  const custName = shipment.isWalkIn
    ? (shipment.walkInName || 'Walk-in Customer')
    : (customer?.name || shipment.customerName);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    void exportInvoicePDF(shipment, customer);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Shipment Invoice"
      subtitle={`Client-facing receipt for AWB ${shipment.awb}`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full no-print">
          <div className="text-xs text-slate-500 font-medium">
            This is the official customer copy
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
        docTitle="INVOICE"
        docRef={shipment.shipInv || shipment.awb}
        docDate={formatDateSlash(shipment.date)}
        closingNote="Thank you for shipping with Qadir Cargo Service. System generated receipt."
      >
        <div className="shipment-invoice">
          <table className="shipment-invoice-grid">
            <tbody>
              <tr>
                <th>Account Code</th>
                <td colSpan={2}>{customer?.accountCode || '—'}</td>
                <th className="invoice-title" rowSpan={3}>INVOICE</th>
              </tr>
              <tr>
                <td colSpan={3} className="customer-block">
                  <strong>{custName}</strong>
                  {customer?.city && <span>{customer.city}</span>}
                  {customer?.phone && <span>{customer.phone}</span>}
                  {customer?.email && <span>{customer.email}</span>}
                </td>
              </tr>
              <tr>
                <th>Invoice No.</th>
                <td>{shipment.shipInv || shipment.awb}</td>
                <th>Date: {formatDateSlash(shipment.date)}</th>
              </tr>
              <tr>
                <th>MAWB No.</th>
                <td>{shipment.awb}</td>
                <th>Date: {formatDateSlash(shipment.date)}</th>
                <th>REFERENCE / CONSIGNEE</th>
              </tr>
              <tr>
                <th>M.JobNo.</th>
                <td colSpan={2}>{shipment.jobNo || '—'}</td>
                <td className="consignee-block">{shipment.consignee || custName}<br />{shipment.destination}</td>
              </tr>
              <tr>
                <td colSpan={3}></td>
                <th>Exchange Rate: —</th>
              </tr>
            </tbody>
          </table>

          <table className="shipment-invoice-grid shipment-route-grid">
            <thead><tr>
              <th>FROM</th><th>TO</th><th>COMMODITY</th><th>PCS</th><th>GRS.WEIGHT</th><th>CH.WEIGHT</th>
            </tr></thead>
            <tbody><tr>
              <td>{shipment.origin || '—'}</td>
              <td>{shipment.destination}</td>
              <td>{shipment.productName || 'Freight'}</td>
              <td>{shipment.pieces || 1}</td>
              <td>{(Number(shipment.weight) || 0).toFixed(2)}</td>
              <td>{(Number(shipment.weight) || 0).toFixed(2)}</td>
            </tr></tbody>
          </table>

          <table className="shipment-invoice-grid shipment-job-grid">
            <thead>
              <tr><th colSpan={7}>JOB</th></tr>
              <tr><th>No.</th><th>Year</th><th>HAWB NO.</th><th>PCS</th><th>CHARGEABLE WEIGHT</th><th>GROSS WEIGHT</th><th>PARTY NAME</th></tr>
            </thead>
            <tbody><tr>
              <td>{shipment.jobNo || '—'}</td>
              <td>{new Date(`${shipment.date}T00:00:00`).getFullYear()}</td>
              <td>{shipment.awb}</td>
              <td>{shipment.pieces || 1}</td>
              <td>{(Number(shipment.weight) || 0).toFixed(2)}</td>
              <td>{(Number(shipment.weight) || 0).toFixed(2)}</td>
              <td>{shipment.consignee || custName}</td>
            </tr></tbody>
          </table>

          <table className="shipment-invoice-items">
            <thead><tr><th>DESCRIPTION</th><th>PKGS</th><th>WEIGHT (KG)</th><th>AMOUNT (PKR)</th></tr></thead>
            <tbody><tr>
              <td>{shipment.productName ? `${shipment.productName} — ` : ''}Freight charges — {shipment.service} shipment via {shipment.courier} to {shipment.destination}{shipment.notes ? ` · ${shipment.notes}` : ''}</td>
              <td>{shipment.pieces || 1}</td>
              <td>{(Number(shipment.weight) || 0).toFixed(2)}</td>
              <td>{formatNum(shipment.revenue)}</td>
            </tr></tbody>
          </table>

          <div className="shipment-invoice-summary print-keep">
            <div><span>Payment Status</span><strong>{isPaid ? 'PAID (CASH SALE)' : 'ON ACCOUNT / CREDIT'}</strong></div>
            <div><span>Total Amount</span><strong>{formatPKR(shipment.revenue)}</strong></div>
          </div>
        </div>

      </PrintDocument>
    </Modal>
  );
};
