import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PrintDocument } from '../common/PrintDocument';
import { Customer, Invoice } from '@/models/types';
import { formatDateSlash, formatPKR, formatNum } from '@/utils/formatters';
import { amountInWords } from '@/utils/amountInWords';
import { exportPaymentReceiptPDF } from '@/utils/pdfExport';
import { Download, Printer } from 'lucide-react';

interface CustomerReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** A customer payment row (kind === 'payment') from the Invoices list */
  receipt: Invoice | null;
  customer?: Customer | null;
  balanceAfter?: number;
}

/** Printable receipt for a payment received from a customer. */
export const CustomerReceiptModal: React.FC<CustomerReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  customer,
  balanceAfter,
}) => {
  if (!receipt) return null;

  const receiptNo = receipt.invoiceNo;
  const voucherType = receiptNo.split(/\s+/)[0];
  const paymentMethod = receipt.paymentMethod || (voucherType === 'BRV'
    ? 'Bank Receipt'
    : voucherType === 'CRV'
      ? 'Cash Receipt'
      : 'Journal Adjustment');
  const balanceLabel = (balance: number) => balance > 0.01
    ? `Owes ${formatPKR(balance)}`
    : balance < -0.01
      ? `Advance ${formatPKR(Math.abs(balance))}`
      : 'Settled';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Receipt"
      subtitle={`Receipt ${receiptNo} from ${receipt.customerName}`}
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 no-print">
          <div className="text-xs text-slate-500 font-medium">Received from customer</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => { void exportPaymentReceiptPDF({ partyType: 'customer', receipt, customer, balanceAfter }); }}
              icon={<Download className="w-4 h-4" />}
              data-testid="download-customer-receipt-btn"
            >
              Download PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              icon={<Printer className="w-4 h-4" />}
              data-testid="print-receipt-btn"
            >
              Print
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <PrintDocument
        docTitle="PAYMENT RECEIPT"
        docRef={receiptNo}
        docDate={formatDateSlash(receipt.date)}
        docExtra="Customer Payment"
        closingNote="Qadir Cargo Service · System generated payment receipt."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-200">
          <section className="p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Received From
            </div>
            <div className="text-base font-extrabold text-slate-900">{receipt.customerName}</div>
            {customer && (
              <div className="text-xs text-slate-600 font-medium mt-2 space-y-1">
                {(customer.city || customer.phone) && <div>{[customer.city, customer.phone].filter(Boolean).join(' | ')}</div>}
                {customer.email && <div>{customer.email}</div>}
                {customer.accountCode && <div>Account: {customer.accountCode}</div>}
              </div>
            )}
          </section>
          <section className="p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Payment Details
            </div>
            <div className="text-xs text-slate-700 space-y-2 font-semibold">
              <div><span className="text-slate-500">Voucher:</span> <span className="mono font-bold">{receiptNo}</span></div>
              <div><span className="text-slate-500">Method:</span> {paymentMethod}</div>
              <div><span className="text-slate-500">Cheque / Ref No.:</span> {receipt.chequeNo || '—'}</div>
              <div><span className="text-slate-500">Date:</span> {formatDateSlash(receipt.date)}</div>
            </div>
          </section>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-300">
                <th className="py-2.5 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Description
                </th>
                <th className="py-2.5 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Method
                </th>
                <th className="py-2.5 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">
                  Reference
                </th>
                <th className="py-2.5 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 text-right">
                  Amount (PKR)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              <tr>
                <td className="py-3 px-3">{receipt.notes || 'Payment received against account balance'}</td>
                <td className="py-3 px-3">{paymentMethod}</td>
                <td className="py-3 px-3 mono">{receiptNo}</td>
                <td className="py-3 px-3 text-right mono font-extrabold text-slate-900">
                  {formatNum(receipt.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="py-4 px-3 text-xs text-slate-500">
          Amount in words: <strong className="text-slate-800">{amountInWords(receipt.amount)}</strong>
        </div>

        {balanceAfter !== undefined && (
          <div className="print-keep grid grid-cols-3 gap-3 py-3 px-4 rounded-lg border border-dashed border-slate-300 text-xs">
            <div>
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Balance Before</div>
              <strong className="block mt-1">{balanceLabel(balanceAfter + receipt.amount)}</strong>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Received Now</div>
              <strong className="block mt-1">{formatPKR(receipt.amount)}</strong>
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase text-slate-400">Balance After</div>
              <strong className="block mt-1">{balanceLabel(balanceAfter)}</strong>
            </div>
          </div>
        )}

        <div className="print-keep mt-4 p-4 bg-slate-50 border-y border-slate-200 flex flex-wrap items-center justify-end gap-8">
          <div>
            <div className="text-[10.5px] font-bold text-slate-400">Status</div>
            <span className="inline-block mt-1 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
              PAYMENT RECEIVED
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10.5px] font-bold text-slate-400">Total Received</div>
            <div className="mono text-xl font-black text-slate-900">{formatPKR(receipt.amount)}</div>
          </div>
        </div>
      </PrintDocument>
    </Modal>
  );
};