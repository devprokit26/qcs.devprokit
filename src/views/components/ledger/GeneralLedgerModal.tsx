import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { PrintDocument } from '../common/PrintDocument';
import { Customer, Vendor } from '@/models/types';
import { formatDateSlash, formatNum } from '@/utils/formatters';
import { exportGeneralLedgerPDF } from '@/utils/pdfExport';
import { COMPANY } from '@/utils/branding';
import { Printer, Download } from 'lucide-react';

interface GeneralLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    entity: Customer | Vendor;
    rows: Array<{
      date: string;
      voucherType: string;
      voucherNo: string;
      description: string;
      sub: string;
      weightText: string;
      jobNo: string;
      branch: string;
      trackingNo: string;
      serviceName: string;
      serviceType: string;
      consignee: string;
      destination: string;
      pieces: number;
      debit: number;
      credit: number;
      balance: number;
      dc: string;
    }>;
    totals: {
      opening: number;
      totalDebit: number;
      totalCredit: number;
      totalPcs: number;
      totalWeight: number;
      closing: number;
      periodFrom: string | null;
      periodTo: string | null;
    };
  } | null;
  type: 'customer' | 'vendor';
}

type GeneralLedgerData = NonNullable<GeneralLedgerModalProps['data']>;
const EMPTY_ROWS: GeneralLedgerData['rows'] = [];
const EMPTY_TOTALS: GeneralLedgerData['totals'] = {
  opening: 0,
  totalDebit: 0,
  totalCredit: 0,
  totalPcs: 0,
  totalWeight: 0,
  closing: 0,
  periodFrom: null,
  periodTo: null,
};

export const GeneralLedgerModal: React.FC<GeneralLedgerModalProps> = ({
  isOpen,
  onClose,
  data,
  type,
}) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    setFromDate('');
    setToDate('');
  }, [data?.entity.id, isOpen, type]);

  const rows = data?.rows ?? EMPTY_ROWS;
  const totals = data?.totals ?? EMPTY_TOTALS;
  const isVendor = type === 'vendor';

  const filteredStatement = useMemo(() => {
    const validRange = !fromDate || !toDate || fromDate <= toDate;
    const opening = totals.opening + rows
      .filter(row => fromDate && row.date < fromDate)
      .reduce((balance, row) => balance + row.debit - row.credit, 0);
    const includedRows = validRange
      ? rows.filter(row =>
          (!fromDate || row.date >= fromDate) &&
          (!toDate || row.date <= toDate)
        )
      : [];

    let runningBalance = opening;
    const visibleRows = includedRows.map(row => {
      runningBalance += row.debit - row.credit;
      return { ...row, balance: runningBalance, dc: runningBalance >= 0 ? 'Dr' : 'Cr' };
    });
    const totalDebit = visibleRows.reduce((sum, row) => sum + row.debit, 0);
    const totalCredit = visibleRows.reduce((sum, row) => sum + row.credit, 0);
    const totalWeight = visibleRows.reduce((sum, row) => {
      const weight = Number.parseFloat(row.weightText);
      return sum + (Number.isFinite(weight) ? weight : 0);
    }, 0);
    const periodFrom = fromDate || visibleRows[0]?.date || totals.periodFrom;
    const periodTo = toDate || visibleRows[visibleRows.length - 1]?.date || totals.periodTo;

    return {
      rows: visibleRows,
      totals: {
        ...totals,
        opening,
        totalDebit,
        totalCredit,
        totalPcs: visibleRows.reduce((sum, row) => sum + row.pieces, 0),
        totalWeight,
        closing: runningBalance,
        periodFrom,
        periodTo,
      },
      validRange,
    };
  }, [fromDate, toDate, rows, totals]);
  const visibleRows = filteredStatement.rows;
  const visibleTotals = filteredStatement.totals;

  if (!data) return null;

  const { entity } = data;
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    void exportGeneralLedgerPDF(entity, visibleRows, visibleTotals, type);
  };

  const fromStr = fromDate ? formatDateSlash(fromDate) : (totals.periodFrom ? formatDateSlash(totals.periodFrom) : '');
  const toStr = toDate ? formatDateSlash(toDate) : (totals.periodTo ? formatDateSlash(totals.periodTo) : '');
  const basePeriod = fromStr || toStr
    ? `From: ${fromStr || '—'} To: ${toStr || '—'}`
    : 'All transactions';
  const periodText = fromDate || toDate
    ? `${basePeriod} · earlier entries carried into opening balance`
    : basePeriod;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="General Ledger Statement"
      subtitle={`Official voucher-level statement for ${entity.name}`}
      size="full"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full no-print">
          <div className="text-xs text-slate-500 font-medium">
            {periodText}
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
      <div className="no-print mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
          From Date
          <input
            type="date"
            value={fromDate}
            onChange={event => setFromDate(event.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            data-testid="statement-from-date"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-slate-700">
          To Date
          <input
            type="date"
            value={toDate}
            onChange={event => setToDate(event.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            data-testid="statement-to-date"
          />
        </label>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setFromDate('');
            setToDate('');
          }}
          data-testid="statement-clear-date-filter"
        >
          Clear
        </Button>
        {!filteredStatement.validRange && (
          <span role="alert" className="text-xs font-bold text-red-600 pb-2">
            From date must be on or before To date.
          </span>
        )}
      </div>
      <PrintDocument
        docTitle={isVendor ? 'VENDOR LEDGER STATEMENT' : 'CUSTOMER LEDGER STATEMENT'}
        docRef={entity.accountCode ? `A/C ${entity.accountCode}` : entity.name}
        docDate={formatDateSlash(new Date().toISOString().slice(0, 10))}
        docExtra={periodText}
        showBrandHeader={false}
      >
      <div className="text-xs ledger-statement">
        <div className="ledger-statement-header">
          <div className="ledger-statement-top">
            <div className="ledger-company-brand">
              <img className="ledger-statement-logo" src="/logo.png" alt={`${COMPANY.network} logo`} />
              <div className="ledger-statement-company">
                <div className="ledger-company-name">{COMPANY.name}</div>
                <div className="ledger-company-network">{COMPANY.network} · Logistics &amp; Freight</div>
                <div className="ledger-company-detail">{COMPANY.address}</div>
                <div className="ledger-company-detail">Contact: {COMPANY.owner} · {COMPANY.phone}</div>
              </div>
            </div>
            <div className="ledger-document-meta">
              <div className="ledger-document-title">{isVendor ? 'VENDOR LEDGER STATEMENT' : 'CUSTOMER LEDGER STATEMENT'}</div>
              <strong>A/C {entity.accountCode || '—'}</strong>
              <span>Date: {formatDateSlash(new Date().toISOString().slice(0, 10))}</span>
              <span title="Period is the transaction date range shown in this statement.">Period: {basePeriod}</span>
            </div>
          </div>
          <div className="ledger-statement-account-row">
            <div>
              <span>Account Code: </span><strong>{entity.accountCode || '—'}</strong>
              <span className="ledger-account-separator">•</span>
              <strong className="ledger-account-name">{entity.name.toUpperCase()}</strong>
              {entity.branch && <span className="ledger-account-branch"> · {entity.branch}</span>}
            </div>
            <div>Currency: <strong>PKR</strong></div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="ledger-statement-table-wrap">
          <table className="ledger-statement-table">
            <thead>
              <tr>
                <th colSpan={2}>Voucher</th><th rowSpan={2}>Tracking No.</th>
                <th colSpan={2}>Service</th><th rowSpan={2}>Consignee / Sender</th>
                <th rowSpan={2}>Dest</th><th rowSpan={2}>Pkgs</th>
                <th rowSpan={2}>Weight<br /><small>(Charged)</small></th>
                <th colSpan={3}>Amount</th><th rowSpan={2}>D/C</th>
              </tr>
              <tr>
                <th>Date</th><th>Type</th><th>Name</th><th>Type</th>
                <th>Debit</th><th>Credit</th><th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening balance row */}
              <tr className="opening-row">
                <td colSpan={9}>*** Opening Balance ***</td>
                <td className="number">{visibleTotals.opening >= 0 ? formatNum(Math.abs(visibleTotals.opening)) : ''}</td>
                <td className="number">{visibleTotals.opening < 0 ? formatNum(Math.abs(visibleTotals.opening)) : ''}</td>
                <td className="number">{formatNum(Math.abs(visibleTotals.opening))}</td>
                <td className="number">{visibleTotals.opening >= 0 ? 'Dr' : 'Cr'}</td>
              </tr>

              {/* Transaction rows */}
              {visibleRows.map((r, i) => (
                <tr key={i}>
                  <td className="mono">
                    {formatDateSlash(r.date)}
                  </td>
                  <td className="mono">
                    {r.voucherType}
                  </td>
                  <td className="mono">{r.trackingNo}</td>
                  <td>{r.serviceName}</td>
                  <td>{r.serviceType}</td>
                  <td>{r.consignee || r.sub || r.description}</td>
                  <td>{r.destination}</td>
                  <td className="number">{r.pieces || ''}</td>
                  <td className="number">{r.weightText.replace(/\s*KG$/i, '')}</td>
                  <td className="number">{r.debit ? formatNum(r.debit) : ''}</td>
                  <td className="number">{r.credit ? formatNum(r.credit) : ''}</td>
                  <td className="number">{formatNum(Math.abs(r.balance))}</td>
                  <td className="center">{r.dc}</td>
                </tr>
              ))}
              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={13} className="empty-row">No transactions in this date range.</td>
                </tr>
              )}

              <tr className="total-row">
                <td colSpan={7}>TOTAL</td>
                <td className="number">{visibleTotals.totalPcs || ''}</td>
                <td className="number">{visibleTotals.totalWeight > 0 ? visibleTotals.totalWeight.toFixed(2) : ''}</td>
                <td className="number">{formatNum(visibleTotals.totalDebit)}</td>
                <td className="number">{formatNum(visibleTotals.totalCredit)}</td>
                <td className="number">{formatNum(Math.abs(visibleTotals.closing))}</td>
                <td className="center">{visibleTotals.closing >= 0 ? 'Dr' : 'Cr'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </PrintDocument>
    </Modal>
  );
};
