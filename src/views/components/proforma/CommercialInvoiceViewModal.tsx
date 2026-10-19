import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ProformaInvoice, ProformaPackage } from '@/models/types';
import { formatDateSlash } from '@/utils/formatters';
import { COMPANY, DOCUMENT_FOOTER_PHONE, DOCUMENT_FOOTER_TITLE, DOCUMENT_FOOTER_WEBSITE } from '@/utils/branding';
import { exportProformaPDF } from '@/utils/proformaPdf';
import { Printer, Download } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  proforma: ProformaInvoice | null;
}

const money = (n: number) =>
  (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const hasPackingValues = (packages?: ProformaPackage[]): boolean => {
  if (!packages || packages.length === 0) return false;
  return packages.some(
    b =>
      (b.contents && b.contents.trim() !== '') ||
      Number(b.grossWeight) > 0 ||
      Number(b.netWeight) > 0 ||
      Number(b.l) > 0 ||
      Number(b.w) > 0 ||
      Number(b.h) > 0
  );
};

export const CommercialInvoiceViewModal: React.FC<Props> = ({ isOpen, onClose, proforma }) => {
  if (!proforma) return null;

  const currency = proforma.currency || 'USD';
  const currencyLabel = currency === 'USD' ? '$' : currency;
  const invoiceTitle = proforma.type === 'GIFT' ? 'Gift Invoice' : 'Commercial Invoice';
  const subtotal = proforma.items.reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const freight = Number(proforma.freight) || 0;
  const grandTotal = subtotal + freight;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${invoiceTitle} Preview`}
      subtitle={`Invoice No: STR${proforma.serialNo} — ${proforma.demoConsigneeName || proforma.destination}`}
      size="full"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full no-print">
          <div className="text-xs text-slate-500 font-semibold">Commercial invoice</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>
              Print
            </Button>
            <Button variant="primary" size="sm" onClick={() => void exportProformaPDF(proforma, 'invoice')} icon={<Download className="w-4 h-4" />}>
              Export PDF
            </Button>
          </div>
        </div>
      }
    >
      <div id="print-section" className="proforma-invoice bg-white p-5 sm:p-10 max-w-[950px] mx-auto text-slate-900 font-sans text-sm">
        <header className="flex items-center justify-between gap-6 border-b-2 border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt={`${COMPANY.name} logo`} className="w-20 h-20 object-contain" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-wide">{COMPANY.name}</h2>
              <div className="font-bold text-slate-600">{COMPANY.network} · Logistics &amp; Freight</div>
              <div className="mt-1 max-w-md text-xs text-slate-600">{COMPANY.address}</div>
              <div className="text-xs text-slate-600">{COMPANY.phone}</div>
            </div>
          </div>
          <div className="text-right">
            <h1 className="whitespace-nowrap text-2xl font-black uppercase tracking-wider text-slate-800">{invoiceTitle}</h1>
            <div className="mt-2 text-sm"><strong>Invoice No:</strong> STR{proforma.serialNo}</div>
            <div className="text-sm"><strong>Date:</strong> {formatDateSlash(proforma.invoiceDate)}</div>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
          <div className="rounded border border-slate-200 p-4">
            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Bill From</h3>
            <div className="font-bold">{COMPANY.name}</div>
            <div>{COMPANY.address}</div>
            <div>Phone: {COMPANY.phone}</div>
          </div>
          <div className="rounded border border-slate-200 p-4">
            <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Bill To</h3>
            <div className="font-bold">{proforma.demoConsigneeName || '—'}</div>
            <div className="whitespace-pre-line">{proforma.demoConsigneeAddress || '—'}</div>
            {proforma.demoConsigneePhone && <div>Phone: {proforma.demoConsigneePhone}</div>}
            {proforma.destination && <div>{proforma.destination}</div>}
          </div>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-x-6 gap-y-2 border-y border-slate-200 py-3 text-xs sm:grid-cols-4">
          <div><span className="text-slate-500">Shipper:</span> <strong>{proforma.shipperName || '—'}</strong></div>
          <div><span className="text-slate-500">Origin:</span> <strong>{proforma.departure || 'Sialkot, Pakistan'}</strong></div>
          <div><span className="text-slate-500">Destination:</span> <strong>{proforma.destination || '—'}</strong></div>
          <div><span className="text-slate-500">CTN #:</span> <strong>{proforma.cartonNo || '—'}</strong></div>
        </section>

        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="border border-slate-800 px-3 py-2">Item</th>
              <th className="border border-slate-800 px-3 py-2 text-right">Quantity</th>
              <th className="border border-slate-800 px-3 py-2 text-right">Rate ({currency})</th>
              <th className="border border-slate-800 px-3 py-2 text-right">Tax</th>
              <th className="border border-slate-800 px-3 py-2 text-right">Amount ({currency})</th>
            </tr>
          </thead>
          <tbody>
            {proforma.items.map((item, index) => (
              <tr key={`${item.description}-${index}`} className="odd:bg-slate-50">
                <td className="border border-slate-200 px-3 py-2">{item.description || '—'}</td>
                <td className="border border-slate-200 px-3 py-2 text-right">{item.qty} {item.unit}</td>
                <td className="border border-slate-200 px-3 py-2 text-right">{money(Number(item.unitPrice) || 0)}</td>
                <td className="border border-slate-200 px-3 py-2 text-right">{money(0)}</td>
                <td className="border border-slate-200 px-3 py-2 text-right font-bold">{money((Number(item.qty) || 0) * (Number(item.unitPrice) || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-full max-w-sm space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{currencyLabel} {money(subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping &amp; Freight</span><span>{currencyLabel} {money(freight)}</span></div>
          <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-base font-black">
            <span>Total ({proforma.incoterm || 'CFR'})</span><span>{currencyLabel} {money(grandTotal)}</span>
          </div>
        </div>

        <section className="mt-8 border-t border-slate-200 pt-4 text-xs">
          <h3 className="mb-1 font-black uppercase">Terms &amp; Conditions</h3>
          <p>{proforma.incoterm ? `Incoterm: ${proforma.incoterm}. ` : ''}{proforma.reasonForExport || 'As agreed by the parties.'}</p>
          {proforma.invoiceHsCode && <p className="mt-1"><strong>HS Code:</strong> {proforma.invoiceHsCode}</p>}
          {proforma.notes && <p className="mt-1 whitespace-pre-line">{proforma.notes}</p>}
        </section>

        {hasPackingValues(proforma.packages) && (
          <section className="mt-8">
            <h3 className="mb-2 font-black uppercase">Packing List</h3>
            <table className="w-full border-collapse text-left text-xs">
              <thead><tr className="bg-slate-800 text-white">
                <th className="border px-2 py-1">Box</th><th className="border px-2 py-1">Contents</th>
                <th className="border px-2 py-1">Dimensions (cm)</th><th className="border px-2 py-1 text-right">Gross KG</th>
                <th className="border px-2 py-1 text-right">Net KG</th>
              </tr></thead>
              <tbody>{proforma.packages.map((box, index) => (
                <tr key={index}>
                  <td className="border border-slate-200 px-2 py-1">{index + 1}</td>
                  <td className="border border-slate-200 px-2 py-1">{box.contents || '—'}</td>
                  <td className="border border-slate-200 px-2 py-1">{box.l || box.w || box.h ? `${box.l} × ${box.w} × ${box.h}` : '—'}</td>
                  <td className="border border-slate-200 px-2 py-1 text-right">{money(Number(box.grossWeight) || 0)}</td>
                  <td className="border border-slate-200 px-2 py-1 text-right">{money(Number(box.netWeight) || 0)}</td>
                </tr>
              ))}</tbody>
            </table>
          </section>
        )}

        <footer className="print-footer mt-10 border-t border-slate-200 pt-3 text-[10px] font-semibold text-slate-500">
          <div className="print-footer-row flex items-center justify-between">
            <span className="print-footer-contact">{DOCUMENT_FOOTER_WEBSITE}</span>
            <span className="print-footer-title">{DOCUMENT_FOOTER_TITLE}</span>
            <span className="print-footer-contact">{DOCUMENT_FOOTER_PHONE}</span>
          </div>
        </footer>
      </div>
    </Modal>
  );
};
