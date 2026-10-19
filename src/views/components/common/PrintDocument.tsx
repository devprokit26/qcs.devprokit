import React from 'react';
import { COMPANY, DOCUMENT_FOOTER_PHONE, DOCUMENT_FOOTER_TITLE, DOCUMENT_FOOTER_WEBSITE } from '@/utils/branding';

/** Credit line shown at the foot of every printed page and exported PDF. */
export const PRINT_CREDIT = DOCUMENT_FOOTER_TITLE;

interface PrintDocumentProps {
  /** Big coloured label on the right of the header, e.g. "SHIPMENT INVOICE" */
  docTitle: string;
  /** Reference number shown under the title (invoice #, C/N #, account code …) */
  docRef?: React.ReactNode;
  /** Date (already formatted) shown under the reference */
  docDate?: React.ReactNode;
  /** Optional extra line(s) under the date */
  docExtra?: React.ReactNode;
  /** Small closing note above the footer (thank-you line etc.) */
  closingNote?: React.ReactNode;
  /** Hide the standard logo header when a document provides its own layout. */
  showBrandHeader?: boolean;
  children: React.ReactNode;
}

/**
 * One layout for EVERY printable document in the app (invoice, bill,
 * ledger statement, weight proforma …), styled after the shipment invoice.
 *
 * Print behaviour (see the @media print block in index.css):
 *  - @page margin is 0, so the browser does NOT print its own URL / date /
 *    page-title header & footer.
 *  - The page margins are recreated with the spacer <thead>/<tfoot> rows of
 *    .print-layout, which the browser repeats on every printed page.
 *  - .print-footer is position:fixed inside the page box, so it is drawn at
 *    the bottom of EVERY page and can never be pushed onto an extra page.
 */
export const PrintDocument: React.FC<PrintDocumentProps> = ({
  docTitle,
  docRef,
  docDate,
  docExtra,
  closingNote,
  showBrandHeader = true,
  children,
}) => (
  <div id="print-section" className="bg-white p-3 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
    <table className="print-layout w-full border-collapse">
      <thead className="print-spacer-head">
        <tr><td><div className="print-spacer-top" /></td></tr>
      </thead>
      <tbody>
        <tr>
          <td className="print-layout-cell">
            {showBrandHeader && <div className="print-doc-header flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b-2 border-[#292929] gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-20 h-12 rounded-lg bg-white p-1 flex items-center justify-center border border-slate-200 shadow-sm flex-shrink-0">
                  <img src="/logo.png" alt={`${COMPANY.network} logo`} className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none">
                    {COMPANY.name}
                  </div>
                  <div className="text-[10px] text-[#00A6BD] font-extrabold mt-1 uppercase tracking-wide">
                    {COMPANY.network} &bull; Logistics &amp; Freight
                  </div>
                  <div className="text-[9px] text-slate-600 font-semibold mt-1">
                    {COMPANY.owner} &bull; {COMPANY.role} &bull; {COMPANY.phone}
                  </div>
                  <div className="text-[9px] text-slate-500 font-medium mt-0.5">
                    {COMPANY.address}
                  </div>
                </div>
              </div>

              <div className="print-doc-meta sm:text-right">
                <div className="text-xs font-black text-[#F21624] uppercase tracking-widest">{docTitle}</div>
                {docRef && <div className="text-sm font-extrabold text-slate-900 mt-1 break-words">{docRef}</div>}
                {docDate && (
                  <div className="text-xs text-slate-500 font-semibold mt-0.5">
                    Date: <strong className="text-slate-800">{docDate}</strong>
                  </div>
                )}
                {docExtra && <div className="text-xs text-slate-500 font-semibold mt-0.5">{docExtra}</div>}
              </div>
            </div>}

            {children}

            {closingNote && (
              <div className="mt-5 text-center text-[10.5px] text-slate-400 font-semibold tracking-tight">
                {closingNote}
              </div>
            )}

            {/* On screen this sits under the document; in print it is pinned to every page bottom */}
            <div className="print-footer mt-4 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold tracking-wide">
              <div className="print-footer-row flex items-center justify-between">
                <span className="print-footer-contact">{DOCUMENT_FOOTER_WEBSITE}</span>
                <span className="print-footer-title">{PRINT_CREDIT}</span>
                <span className="print-footer-contact">{DOCUMENT_FOOTER_PHONE}</span>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot className="print-spacer-foot">
        <tr><td><div className="print-spacer-bottom" /></td></tr>
      </tfoot>
    </table>
  </div>
);
