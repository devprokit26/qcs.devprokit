import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PrintDocument } from '../common/PrintDocument';
import { VendorBill, Vendor } from '@/models/types';
import { formatDateSlash, formatPKR, formatNum } from '@/utils/formatters';
import { amountInWords } from '@/utils/amountInWords';
import { exportBillPDF, exportPaymentReceiptPDF } from '@/utils/pdfExport';
import { Printer, Download } from 'lucide-react';

interface VendorBillViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: VendorBill | null;
  vendor?: Vendor | null;
  balanceAfter?: number;
}

/** Printable copy of a vendor bill or a vendor payment voucher. */
export const VendorBillViewModal: React.FC<VendorBillViewModalProps> = ({
  isOpen,
  onClose,
  bill,
  vendor,
  balanceAfter,
}) => {
  if (!bill) return null;

  const isPayment = bill.kind === 'payment';
  const billNo = `${bill.voucherType} ${bill.voucherNo}`.trim();
  const paymentMethod = bill.paymentMethod || (bill.voucherType === 'CPV' ? 'Cash' : 'Bank');
  const balanceLabel = (balance: number) => balance > 0.01
    ? `Payable ${formatPKR(balance)}`
    : balance < -0.01
      ? `Advance ${formatPKR(Math.abs(balance))}`
      : 'Settled';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPayment ? 'Payment Voucher' : 'Vendor Bill'}
      subtitle={
        isPayment
          ? `Payment ${billNo} to ${bill.vendorName}`
          : `Bill ${billNo} from ${bill.vendorName}`
      }
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 no-print">
          <div className="text-xs text-slate-500 font-medium">
            {isPayment ? 'Paid to vendor' : 'Payable to vendor'}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              icon={<Printer className="w-4 h-4" />}
              data-testid="print-bill-btn"
            >
              Print
            </Button>
            {!isPayment && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => { void exportBillPDF(bill, vendor); }}
                icon={<Download className="w-4 h-4" />}
              >
                Export PDF
              </Button>
            )}
            {isPayment && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => { void exportPaymentReceiptPDF({ partyType: 'vendor', receipt: bill, vendor, balanceAfter }); }}
                icon={<Download className="w-4 h-4" />}
                data-testid="download-vendor-payment-btn"
              >
                Download PDF
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <PrintDocument
        docTitle={isPayment ? 'PAYMENT VOUCHER' : 'VENDOR BILL'}
        docRef={billNo}
        docDate={formatDateSlash(bill.date)}
        closingNote={isPayment
          ? 'Thank you for your payment. This is a system-generated voucher.'
          : 'Qadir Cargo Service · System generated vendor bill.'}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200">
          <section className="p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              {isPayment ? 'Paid To' : 'Bill From'}
            </div>
            <div className="text-base font-extrabold text-slate-900">{bill.vendorName}</div>
            {vendor && (
              <div className="text-xs text-slate-600 font-medium mt-2 space-y-1">
                {(vendor.city || vendor.phone) && <div>{[vendor.city, vendor.phone].filter(Boolean).join(' | ')}</div>}
                {vendor.email && <div>{vendor.email}</div>}
                {vendor.accountCode && <div>Account: {vendor.accountCode}</div>}
              </div>
            )}
          </section>
          <section className="p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              {isPayment ? 'Payment Details' : 'Bill Information'}
            </div>
            <div className="text-xs text-slate-700 space-y-2 font-semibold">
              <div><span className="text-slate-500">Voucher:</span> <span className="mono font-bold">{billNo}</span></div>
              {isPayment && <div><span className="text-slate-500">Method:</span> {paymentMethod}</div>}
              {isPayment && <div><span className="text-slate-500">Cheque / Ref No.:</span> {bill.chequeNo || '—'}</div>}
              <div><span className="text-slate-500">Date:</span> {formatDateSlash(bill.date)}</div>
              {bill.jobNo && <div><span className="text-slate-500">Job No:</span> {bill.jobNo}</div>}
            </div>
          </section>
        </div>

        {/* Item table */}
        <div className="my-5 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-300">
                <th className="py-2.5 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Description
                </th>
                {isPayment && <th className="py-2.5 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">Method</th>}
                {isPayment && <th className="py-2.5 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">Reference</th>}
                <th className="py-2.5 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 text-right">
                  Amount (PKR)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="py-3 px-3">{isPayment ? 'Payment made against account payable' : (bill.description || 'Vendor bill')}</td>
                {isPayment && <td className="py-3 px-3">{paymentMethod}</td>}
                {isPayment && <td className="py-3 px-3 mono">{billNo}</td>}
                <td className="py-3 px-3 text-right mono font-extrabold text-slate-900">{formatNum(bill.amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {isPayment && (
          <>
            <div className="py-4 px-3 text-xs text-slate-500">
              Amount in words: <strong className="text-slate-800">{amountInWords(bill.amount)}</strong>
            </div>
            {balanceAfter !== undefined && (
              <div className="print-keep grid grid-cols-3 gap-3 py-3 px-4 rounded-lg border border-dashed border-slate-300 text-xs">
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Balance Before</div>
                  <strong className="block mt-1">{balanceLabel(balanceAfter + bill.amount)}</strong>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Paid Now</div>
                  <strong className="block mt-1">{formatPKR(bill.amount)}</strong>
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase text-slate-400">Balance After</div>
                  <strong className="block mt-1">{balanceLabel(balanceAfter)}</strong>
                </div>
              </div>
            )}
          </>
        )}

        <div className="print-keep mt-4 p-4 bg-slate-50 border-y border-slate-200 flex flex-wrap items-center justify-end gap-8">
          <div>
            <div className="text-[10.5px] font-bold text-slate-400">Status</div>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-black ${
              isPayment ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>{isPayment ? 'PAYMENT MADE' : 'PAYABLE'}</span>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] font-bold text-slate-400">{isPayment ? 'Total Paid' : 'Total Amount'}</div>
            <div className="mono text-xl font-black text-slate-900">{formatPKR(bill.amount)}</div>
          </div>
        </div>

      </PrintDocument>
    </Modal>
  );
};