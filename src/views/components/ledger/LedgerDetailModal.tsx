import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Customer, LedgerTransaction, AgingBuckets } from '@/models/types';
import { formatPKR, formatDate } from '@/utils/formatters';

interface LedgerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  transactions: LedgerTransaction[];
  balance: number;
  aging: AgingBuckets;
  shipmentCount: number;
  onOpenPayment: () => void;
  onOpenDebit: () => void;
}

export const LedgerDetailModal: React.FC<LedgerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  transactions,
  balance,
  aging,
  shipmentCount,
  onOpenPayment,
  onOpenDebit,
}) => {
  if (!customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer.name}
      subtitle={`${customer.city || 'Pakistan'} • Phone: ${customer.phone || '—'} • Acc Code: ${customer.accountCode || '—'}`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onClose();
                onOpenDebit();
              }}
            >
              Add Invoice
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onOpenPayment();
              }}
            >
              Receive Payment
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
          <div>
            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
              Balance
            </div>
            <div
              className={`mono text-base font-black mt-0.5 ${
                balance > 0 ? 'text-red-600' : balance < 0 ? 'text-emerald-600' : 'text-teal-600'
              }`}
            >
              {balance > 0 ? `Owes ${formatPKR(balance)}` : balance < 0 ? `Adv ${formatPKR(Math.abs(balance))}` : 'Settled'}
            </div>
          </div>

          <div>
            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
              Shipments
            </div>
            <div className="mono text-base font-black text-slate-800 mt-0.5">
              {shipmentCount}
            </div>
          </div>

          <div>
            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
              Credit Limit
            </div>
            <div className="mono text-base font-black text-slate-800 mt-0.5">
              {formatPKR(customer.creditLimit)}
            </div>
          </div>

          <div>
            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
              Aging Status
            </div>
            <div
              className={`text-xs font-black mt-1 ${
                aging.oldestDaysOverdue > 60
                  ? 'text-red-600'
                  : aging.oldestDaysOverdue > 0
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {aging.oldestDaysOverdue > 0 ? `${aging.oldestDaysOverdue}d overdue` : 'Current (Not due)'}
            </div>
          </div>
        </div>

        {/* Transaction History List */}
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            Ledger Transaction Entries
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[380px] overflow-y-auto bg-white">
            {customer.openingBalance > 0 && (
              <div className="p-3 bg-slate-50/70 flex items-center justify-between text-xs">
                <div>
                  <div className="font-extrabold text-slate-700">*** Opening Balance ***</div>
                  <div className="text-[11px] text-slate-400">Initial balance on ledger creation</div>
                </div>
                <div className="mono font-bold text-red-600">
                  +{formatPKR(customer.openingBalance)}
                </div>
              </div>
            )}

            {transactions.length > 0 ? (
              transactions.map((t, idx) => (
                <div key={idx} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {t.voucherType && (
                        <span className="mono font-extrabold text-[#00A6BD] mr-1.5">
                          {t.voucherType} {t.voucherNo || ''}
                        </span>
                      )}
                      {t.description}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(t.date)}
                      {t.jobNo && ` • Job: ${t.jobNo}`}
                      {t.chequeNo && ` • Ref: ${t.chequeNo}`}
                    </div>
                  </div>
                  <div
                    className={`mono font-extrabold text-right flex-shrink-0 ${
                      t.type === 'debit' ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {t.type === 'debit' ? '+' : '-'}{formatPKR(t.amount)}
                  </div>
                </div>
              ))
            ) : (
              !customer.openingBalance && (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                  No ledger entries recorded yet
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
