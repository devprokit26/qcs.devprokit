import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { Shipment, Customer, Vendor, VendorBill, WeightProforma, Invoice } from '@/models/types';
import { formatDate, formatDateSlash, formatNum } from './formatters';
import { ProformaTotals } from '@/models/weight';
import { COMPANY, DOCUMENT_FOOTER_PHONE, DOCUMENT_FOOTER_TITLE, DOCUMENT_FOOTER_WEBSITE } from './branding';
import { amountInWords } from './amountInWords';

/** Company identity printed at the bottom of every page of every exported PDF. */
export const COMPANY_FOOTER = DOCUMENT_FOOTER_TITLE;
export const CHARCOAL: [number, number, number] = [41, 41, 41];
// export const TABLE_MARGIN = { left: 14, right: 14, bottom: 16 };

const BRAND_RED: [number, number, number] = [242, 22, 36];
const BRAND_CYAN: [number, number, number] = [0, 166, 189];

/* ---- Logo (downscaled once and cached as a PNG data-URL) ---------------- */
let logoCache: string | null | undefined;

async function loadLogo(): Promise<string | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    logoCache = await new Promise<string | null>(resolve => {
      const img = new Image();
      img.onload = () => {
        try {
          const size = 160;
          const scale = Math.min(size / img.width, size / img.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = '/logo.png';
    });
  } catch {
    logoCache = null;
  }
  return logoCache;
}

/**
 * Draws the same header used on the printed shipment invoice:
 * logo + company block on the left, document title / ref / date on the right,
 * and a dark rule underneath. Returns the Y position where content may start.
 */
export async function drawHeader(
  doc: jsPDF,
  title: string,
  rightLines: string[]
): Promise<number> {
  const w = doc.internal.pageSize.getWidth();
  const left = 14;
  const right = w - 14;
  const logo = await loadLogo();

  let textX = left;
  if (logo) {
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(left, 11, 25, 15, 2, 2, 'S');
    doc.addImage(logo, 'PNG', left + 1, 12, 23, 13);
    textX = left + 29;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...CHARCOAL);
  doc.text(COMPANY.name, textX, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND_CYAN);
  doc.text(`${COMPANY.network} · Logistics & Freight`, textX, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100);
  doc.text(`${COMPANY.owner} · ${COMPANY.role} · ${COMPANY.phone}`, textX, 24);
  doc.text(COMPANY.address, textX, 28, { maxWidth: right - textX });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_RED);
  doc.text(title, right, 15, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(...CHARCOAL);
  let y = 20.5;
  rightLines.filter(Boolean).forEach((line, i) => {
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
    if (i > 0) doc.setTextColor(90);
    doc.text(line, right, y, { align: 'right' });
    y += 4.5;
  });

  const ruleY = Math.max(35, y);
  doc.setDrawColor(...CHARCOAL);
  doc.setLineWidth(0.6);
  doc.line(left, ruleY, right, ruleY);
  doc.setLineWidth(0.2);
  doc.setFont('helvetica', 'normal');
  return ruleY + 7;
}

/** Bottom credit line + page numbers on every page (drawn after all content). */
function addCompanyFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, h - 11, w - 14, h - 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(DOCUMENT_FOOTER_WEBSITE, 14, h - 6, { align: 'left' });
    doc.text(COMPANY_FOOTER, w / 2, h - 6, { align: 'center' });
    doc.text(DOCUMENT_FOOTER_PHONE, w - 14, h - 6, { align: 'right' });
    if (pageCount > 1) doc.text(`Page ${i} of ${pageCount}`, w - 14, h - 6.5, { align: 'right' });
  }
}

/** Table margins leave room for the header area and the footer on every page. */
export const TABLE_MARGIN = { left: 14, right: 14, bottom: 16 };

function today(): string {
  return new Date().toISOString().split('T')[0];
}
export function safeSave(doc: jsPDF, name: string) {
  addCompanyFooter(doc);
  doc.save(name.replace(/[\\/:*?"<>|]+/g, '_'));
}

export function reportError(err: unknown) {
  toast.error(err instanceof Error ? `PDF export failed: ${err.message}` : 'PDF export failed');
}

type LedgerRow = {
  date: string;
  voucherType: string;
  voucherNo: string;
  description: string;
  sub: string;
  jobNo: string;
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
  weightText: string;
};

type LedgerTotals = {
  opening: number;
  totalDebit: number;
  totalCredit: number;
  closing: number;
  periodFrom: string | null;
  periodTo: string | null;
  totalPcs?: number;
  totalWeight?: number;
};

const pkr = (n: number) => 'PKR ' + (Number(n) || 0).toLocaleString();
const num2 = (n: unknown) => (Number(n) || 0).toFixed(2);

/* ─── Shipment register ────────────────────────────────────────────────── */
export async function exportShipmentsPDF(shipments: Shipment[], periodLabel: string = 'All Time'): Promise<void> {
  try {
    if (!shipments.length) {
      toast.error('There are no shipments in the selected period to export');
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    let y = await drawHeader(doc, 'SHIPMENT REPORT', [
      `Period: ${periodLabel}`,
      `Generated: ${formatDate(new Date().toISOString())}`,
    ]);

    const totalRevenue = shipments.reduce((sum, s) => sum + (Number(s.revenue) || 0), 0);
    const totalCost = shipments.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);

    doc.setFontSize(8.5);
    doc.setTextColor(30);
    doc.text(
      `Total Shipments: ${shipments.length}   |   Revenue: ${pkr(totalRevenue)}   |   Cost: ${pkr(totalCost)}   |   Net Profit: ${pkr(totalRevenue - totalCost)}`,
      14,
      y
    );
    y += 5;

    autoTable(doc, {
      head: [['Date', 'AWB #', 'Customer','Consignee', 'Courier', 'Service', 'Orig -> Dest', 'Wt(KG)', 'Revenue', 'Cost', 'Profit', 'Status']],
      body: shipments.map(s => [
        formatDate(s.date),
        s.awb,
        s.isWalkIn ? `${s.walkInName || s.customerName} (Walk-in)` : s.customerName,
        s.consignee || '-',
        s.courier,
        s.service,
        `${s.origin || '-'} -> ${s.destination}`,
        num2(s.weight),
        pkr(s.revenue),
        pkr(s.cost),
        pkr((Number(s.revenue) || 0) - (Number(s.cost) || 0)),
        s.status,
      ]),
      startY: y,
      margin: TABLE_MARGIN,
      styles: { fontSize: 7.5, cellPadding: 2.2, font: 'helvetica' },
      headStyles: { fillColor: CHARCOAL, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    safeSave(doc, `QCS_Shipments_${today()}.pdf`);
  } catch (err) {
    reportError(err);
  }
}

/* ─── Shipment invoice ─────────────────────────────────────────────────── */
export async function exportInvoicePDF(shipment: Shipment, customer?: Customer | null): Promise<void> {
  try {
    const doc = new jsPDF({ orientation: 'portrait' });
    const s = shipment;
    const isPaid = !!s.isWalkIn;
    const custName = s.isWalkIn ? (s.walkInName || 'Walk-in Customer') : (customer?.name || s.customerName);

    let y = await drawHeader(doc, 'INVOICE', []);
    const date = formatDateSlash(s.date);
    const pieces = s.pieces || 1;
    const weight = num2(s.weight);
    const customerDetails = [
      custName,
      ...(!s.isWalkIn && customer?.city ? [customer.city] : []),
      ...(!s.isWalkIn && customer?.phone ? [customer.phone] : []),
    ].join('\n');

    autoTable(doc, {
      body: [
        [
          { content: 'Account Code', styles: { fontStyle: 'bold', fillColor: [214, 214, 214] } },
          customer?.accountCode || '-',
          { content: 'INVOICE', colSpan: 2, styles: { fontSize: 20, fontStyle: 'bold', halign: 'center', valign: 'middle' } },
        ],
        [
          { content: customerDetails, colSpan: 2 },
          { content: 'REFERENCE / CONSIGNEE', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [214, 214, 214] } },
        ],
        [
          { content: 'Invoice No.', styles: { fontStyle: 'bold', fillColor: [214, 214, 214] } },
          s.shipInv || s.awb,
          { content: s.consignee || custName, colSpan: 2 },
        ],
        [
          { content: 'MAWB No.', styles: { fontStyle: 'bold', fillColor: [214, 214, 214] } },
          s.awb,
          { content: 'Date:', styles: { fontStyle: 'bold', fillColor: [214, 214, 214] } },
          date,
        ],
        [
          { content: 'M.JobNo.', styles: { fontStyle: 'bold', fillColor: [214, 214, 214] } },
          s.jobNo || '-',
          { content: 'Destination', styles: { fontStyle: 'bold', fillColor: [214, 214, 214] } }, s.destination,
        ],
        [
          { content: 'Exchange Rate:', styles: { fontStyle: 'bold', fillColor: [214, 214, 214] } },
          '-',
          { content: 'Courier / Service', styles: { fontStyle: 'bold', fillColor: [214, 214, 214] } },
          `${s.courier} / ${s.service}`,
        ],
      ],
      startY: y,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.2, lineColor: [17, 24, 39], lineWidth: 0.2, textColor: [17, 24, 39] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 52 },
        2: { cellWidth: 38 },
        3: { cellWidth: 68 },
      },
    });
    // @ts-expect-error - lastAutoTable injected by autotable
    y = (doc.lastAutoTable?.finalY || y + 35) + 1;

    autoTable(doc, {
      head: [['FROM', 'TO', 'COMMODITY', 'PCS', 'GRS.WEIGHT', 'CH.WEIGHT']],
      body: [[s.origin || '-', s.destination, s.productName || 'Freight', String(pieces), weight, weight]],
      startY: y,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2, lineColor: [17, 24, 39], lineWidth: 0.2, halign: 'center' },
      headStyles: { fillColor: [214, 214, 214], textColor: [17, 24, 39], fontStyle: 'bold' },
    });
    // @ts-expect-error - lastAutoTable injected by autotable
    y = (doc.lastAutoTable?.finalY || y + 15) + 1;

    autoTable(doc, {
      head: [
        [{ content: 'JOB', colSpan: 7 }],
        ['No.', 'Year', 'HAWB NO.', 'PCS', 'CHARGEABLE WEIGHT', 'GROSS WEIGHT', 'PARTY NAME'],
      ],
      body: [[s.jobNo || '-', new Date(`${s.date}T00:00:00`).getFullYear().toString(), s.awb, String(pieces), weight, weight, s.consignee || custName]],
      startY: y,
      margin: { left: 14, right: 14 },
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2, lineColor: [17, 24, 39], lineWidth: 0.2, halign: 'center' },
      headStyles: { fillColor: [214, 214, 214], textColor: [17, 24, 39], fontStyle: 'bold' },
      columnStyles: { 6: { halign: 'left' } },
    });
    // @ts-expect-error - lastAutoTable injected by autotable
    y = (doc.lastAutoTable?.finalY || y + 20) + 3;

    autoTable(doc, {
      head: [['DESCRIPTION', 'PKGS', 'WEIGHT (KG)', 'AMOUNT (PKR)']],
      body: [[
        `${s.productName ? s.productName + ' - ' : ''}Freight charges - ${s.service} shipment via ${s.courier} to ${s.destination}${s.notes ? `\n${s.notes}` : ''}`,
        String(pieces),
        weight,
        formatNum(Number(s.revenue) || 0),
      ]],
      startY: y,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.15 },
      headStyles: { fillColor: [255, 255, 255], textColor: [55, 65, 81], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 105 }, 1: { halign: 'right', cellWidth: 18 }, 2: { halign: 'right', cellWidth: 25 }, 3: { halign: 'right', fontStyle: 'bold', cellWidth: 30 } },
    });

    // @ts-expect-error - lastAutoTable injected by autotable
    let finalY = (doc.lastAutoTable?.finalY || y + 20) + 6;
    const pageH = doc.internal.pageSize.getHeight();
    if (finalY + 55 > pageH - 16) {
      doc.addPage();
      finalY = await drawHeader(doc, 'INVOICE', []);
    }

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, finalY, 182, 23, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('PAYMENT STATUS', 135, finalY + 7);
    doc.text('TOTAL AMOUNT', 192, finalY + 7, { align: 'right' });
    doc.setFontSize(10);
    if (isPaid) doc.setTextColor(6, 95, 70); else doc.setTextColor(146, 64, 14);
    doc.text(isPaid ? 'PAID (CASH SALE)' : 'ON ACCOUNT / CREDIT', 135, finalY + 16);
    doc.setFontSize(14);
    doc.setTextColor(...CHARCOAL);
    doc.text(pkr(s.revenue), 192, finalY + 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Thank you for shipping with ${COMPANY.name}. System generated receipt.`, 105, finalY + 30, { align: 'center' });

    safeSave(doc, `Invoice_${s.shipInv || s.awb}_${today()}.pdf`);
  } catch (err) {
    reportError(err);
  }
}

/* ─── General ledger statement ─────────────────────────────────────────── */
export async function exportGeneralLedgerPDF(
  entity: Customer | Vendor,
  rows: LedgerRow[],
  totals: LedgerTotals,
  type: 'customer' | 'vendor'
): Promise<void> {
  try {
    const doc = new jsPDF({ orientation: 'landscape' });
    const isVendor = type === 'vendor';
    const fromStr = totals.periodFrom ? formatDateSlash(totals.periodFrom) : '';
    const toStr = totals.periodTo ? formatDateSlash(totals.periodTo) : '';
    const period = fromStr || toStr ? `From: ${fromStr || '-'} To: ${toStr || '-'}` : 'All transactions';
    const margin = 6;
    let y = await drawHeader(doc, isVendor ? 'VENDOR LEDGER STATEMENT' : 'CUSTOMER LEDGER STATEMENT', [
      entity.accountCode ? `A/C ${entity.accountCode}` : entity.name,
      `Date: ${formatDateSlash(today())}`,
      `Period: ${period}`,
    ]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...CHARCOAL);
    doc.text(entity.name.toUpperCase(), margin + 8, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100);
    doc.text(`Account Code: ${entity.accountCode || '-'}  ${entity.branch || ''} · Curr: PKR`, margin + 8, y + 4);
    y += 10;

    const opening: (string | { content: string; colSpan: number; styles: Record<string, unknown> })[] = [
      { content: '*** Opening Balance ***', colSpan: 9, styles: { fontStyle: 'bold' } },
      totals.opening >= 0 ? formatNum(Math.abs(totals.opening)) : '',
      totals.opening < 0 ? formatNum(Math.abs(totals.opening)) : '',
      formatNum(Math.abs(totals.opening)),
      totals.opening >= 0 ? 'Dr' : 'Cr',
    ];
    const body: (string | { content: string; colSpan: number; styles?: Record<string, unknown> })[][] = [opening];
    rows.forEach(r => body.push([
      formatDateSlash(r.date),
      r.voucherType,
      r.trackingNo,
      r.serviceName,
      r.serviceType,
      r.consignee || r.sub || r.description,
      r.destination,
      r.pieces ? String(r.pieces) : '',
      r.weightText.replace(/\s*KG$/i, ''),
      r.debit ? formatNum(r.debit) : '',
      r.credit ? formatNum(r.credit) : '',
      formatNum(Math.abs(r.balance)),
      r.dc,
    ]));

    autoTable(doc, {
      head: [
        [
          { content: 'VOUCHER', colSpan: 2 },
          { content: 'TRACKING NO.', rowSpan: 2 },
          { content: 'SERVICE', colSpan: 2 },
          { content: 'CONSIGNEE / SENDER', rowSpan: 2 },
          { content: 'DEST', rowSpan: 2 },
          { content: 'PKGS', rowSpan: 2 },
          { content: 'WEIGHT (CHARGED)', rowSpan: 2 },
          { content: 'AMOUNT', colSpan: 3 },
          { content: 'D/C', rowSpan: 2 },
        ],
        ['DATE', 'TYPE', 'NAME', 'TYPE', 'DEBIT', 'CREDIT', 'BALANCE'],
      ],
      body,
      startY: y,
      margin: { left: margin, right: margin, bottom: 16 },
      styles: { fontSize: 6.5, cellPadding: 1.5, lineColor: [17, 24, 39], lineWidth: 0.15, textColor: [17, 24, 39] },
      headStyles: { fillColor: [214, 214, 214], textColor: [17, 24, 39], fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 17 },
        1: { cellWidth: 21 },
        2: { cellWidth: 24 },
        3: { cellWidth: 22 },
        4: { cellWidth: 20 },
        5: { cellWidth: 57 },
        6: { cellWidth: 18 },
        7: { cellWidth: 12, halign: 'right' },
        8: { cellWidth: 19, halign: 'right' },
        9: { cellWidth: 23, halign: 'right' },
        10: { cellWidth: 23, halign: 'right' },
        11: { cellWidth: 23, halign: 'right' },
        12: { cellWidth: 10, halign: 'center' },
      },
      didParseCell: data => {
        if (data.row.index === 0 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [248, 248, 248];
        }
      },
      foot: [[
        { content: 'TOTAL', colSpan: 7 },
        totals.totalPcs ? String(totals.totalPcs) : '',
        totals.totalWeight ? totals.totalWeight.toFixed(2) : '',
        formatNum(totals.totalDebit),
        formatNum(totals.totalCredit),
        formatNum(Math.abs(totals.closing)),
        totals.closing >= 0 ? 'Dr' : 'Cr',
      ]],
      footStyles: { fillColor: [232, 232, 232], textColor: [17, 24, 39], fontStyle: 'bold' },
      showFoot: 'lastPage',
    });

    safeSave(doc, `${isVendor ? 'Vendor' : 'Customer'}_GL_${entity.name.replace(/\s+/g, '_')}_${today()}.pdf`);
  } catch (err) {
    reportError(err);
  }
}

/* ─── Weight proforma ──────────────────────────────────────────────────── */
export async function exportWeightProformaPDF(proforma: WeightProforma, totals: ProformaTotals): Promise<void> {
  try {
    const doc = new jsPDF({ orientation: 'portrait' });
    const wp = proforma;
    const divisor = wp.divisor || 5000;

    const y = await drawHeader(doc, 'WEIGHT PROFORMA', [`C/N No. ${wp.cnNo}`, `Date: ${formatDateSlash(wp.date)}`]);

    autoTable(doc, {
      body: [
        ['C/N No.', wp.cnNo, 'Services', wp.services || '-'],
        ['Shipper', { content: wp.shipper, colSpan: 3 }],
        ['PCS.', String(wp.boxes.length), 'Chg Wt.', `${totals.totalCh.toFixed(2)} KG`],
      ],
      startY: y,
      margin: TABLE_MARGIN,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5, lineColor: [15, 23, 42], lineWidth: 0.2, textColor: [15, 23, 42] },
      columnStyles: {
        0: { fillColor: [254, 243, 199], textColor: [140, 106, 33], fontStyle: 'bold', cellWidth: 28 },
        2: { fillColor: [254, 243, 199], textColor: [140, 106, 33], fontStyle: 'bold', cellWidth: 28 },
      },
    });

    // @ts-expect-error - lastAutoTable injected by autotable
    const nextY = (doc.lastAutoTable?.finalY || y + 25) + 6;

    const body = (wp.boxes || []).map((b, i) => {
      const act = Number(b.actWeight) || 0;
      const l = Number(b.l) || 0;
      const w = Number(b.w) || 0;
      const h = Number(b.h) || 0;
      const dim = (l * w * h) / divisor;
      return [String(i + 1), act.toFixed(2), `${l} x ${w} x ${h}`, dim.toFixed(2), Math.max(act, dim).toFixed(2)];
    });

    autoTable(doc, {
      head: [['Box No.', 'Act. Weight (KG)', 'Dimension (Cm)', 'Dim Weight (KG)', 'Ch. Weight (KG)']],
      body,
      startY: nextY,
      margin: TABLE_MARGIN,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.8, halign: 'center', lineColor: [15, 23, 42], lineWidth: 0.2 },
      headStyles: { fillColor: CHARCOAL, textColor: [255, 255, 255], fontStyle: 'bold' },
      foot: [['TOTAL', totals.totalAct.toFixed(2), `Divisor: ${divisor}`, totals.totalDim.toFixed(2), totals.totalCh.toFixed(2)]],
      footStyles: { fillColor: [254, 243, 199], textColor: [15, 23, 42], fontStyle: 'bold', halign: 'center' },
      showFoot: 'lastPage',
    });

    safeSave(doc, `WeightProforma_${wp.cnNo}_${today()}.pdf`);
  } catch (err) {
    reportError(err);
  }
}

/* ─── Vendor bill ──────────────────────────────────────────────────────── */
export async function exportBillPDF(bill: VendorBill, vendor?: Vendor | null): Promise<void> {
  try {
    const doc = new jsPDF({ orientation: 'portrait' });
    const billNo = `${bill.voucherType} ${bill.voucherNo}`.trim();

    let y = await drawHeader(doc, 'VENDOR BILL', [billNo, `Date: ${formatDateSlash(bill.date)}`]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('BILL FROM (VENDOR)', 14, y);
    doc.text('BILL INFORMATION', 110, y);
    doc.setFontSize(11);
    doc.setTextColor(...CHARCOAL);
    doc.text(doc.splitTextToSize(bill.vendorName, 90), 14, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90);
    const leftLines: string[] = [];
    if (vendor) {
      const cityPhone = `${vendor.city || ''}${vendor.phone ? ' | ' + vendor.phone : ''}`.trim();
      if (cityPhone) leftLines.push(cityPhone);
      if (vendor.email) leftLines.push(vendor.email);
      if (vendor.accountCode) leftLines.push(`Acc Code: ${vendor.accountCode}`);
    }
    if (leftLines.length) doc.text(leftLines, 14, y + 11);
    doc.setTextColor(50);
    const rightLines = [`Voucher: ${billNo}`, ...(bill.jobNo ? [`Job No: ${bill.jobNo}`] : [])];
    doc.text(rightLines, 110, y + 6);
    y += 10 + Math.max(leftLines.length + 1, rightLines.length) * 4.2;

    autoTable(doc, {
      head: [['Description', 'Amount (PKR)']],
      body: [[bill.description || 'Vendor bill', formatNum(Number(bill.amount) || 0)]],
      startY: y,
      margin: TABLE_MARGIN,
      styles: { fontSize: 9, cellPadding: 3.5 },
      headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });

    // @ts-expect-error - lastAutoTable injected by autotable
    const finalY = (doc.lastAutoTable?.finalY || y + 20) + 8;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, finalY, 182, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('STATUS', 18, finalY + 6);
    doc.text('TOTAL AMOUNT', 192, finalY + 6, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28);
    doc.text('PAYABLE', 18, finalY + 14);
    doc.setFontSize(14);
    doc.setTextColor(...CHARCOAL);
    doc.text(pkr(bill.amount), 192, finalY + 14.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`${COMPANY.name} - System generated vendor bill.`, 105, finalY + 30, { align: 'center' });

    safeSave(doc, `Bill_${bill.voucherType}_${bill.voucherNo}_${today()}.pdf`);
  } catch (err) {
    reportError(err);
  }
}

type PaymentReceiptPDFParams =
  | {
      partyType: 'customer';
      receipt: Invoice;
      customer?: Customer | null;
      balanceAfter?: number;
    }
  | {
      partyType: 'vendor';
      receipt: VendorBill;
      vendor?: Vendor | null;
      balanceAfter?: number;
    };

/** Exports a branded customer receipt or vendor payment voucher. */
export async function exportPaymentReceiptPDF(params: PaymentReceiptPDFParams): Promise<void> {
  try {
    const { receipt, partyType, balanceAfter } = params;
    const doc = new jsPDF({ orientation: 'portrait' });
    const isCustomer = partyType === 'customer';
    const voucher = isCustomer
      ? (receipt as Invoice).invoiceNo
      : `${(receipt as VendorBill).voucherType} ${(receipt as VendorBill).voucherNo}`.trim();
    const date = receipt.date;
    const amount = Number(receipt.amount) || 0;
    const method = receipt.paymentMethod || (voucher.startsWith('CRV') || voucher.startsWith('CPV') ? 'Cash' : 'Bank');
    const reference = receipt.chequeNo || '—';
    const name = isCustomer
      ? (receipt as Invoice).customerName
      : (receipt as VendorBill).vendorName;
    const party = isCustomer ? params.customer : params.vendor;
    let y = await drawHeader(doc, isCustomer ? 'PAYMENT RECEIPT' : 'PAYMENT VOUCHER', [voucher, `Date: ${formatDateSlash(date)}`]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(isCustomer ? 'RECEIVED FROM' : 'PAID TO', 14, y);
    doc.text('PAYMENT DETAILS', 110, y);
    doc.setFontSize(11);
    doc.setTextColor(...CHARCOAL);
    doc.text(doc.splitTextToSize(name, 85), 14, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(90);
    const partyLines = party
      ? [
          [party.city, party.phone].filter(Boolean).join(' | '),
          party.email || '',
          party.accountCode ? `Account: ${party.accountCode}` : '',
        ].filter(Boolean)
      : [];
    if (partyLines.length) doc.text(partyLines, 14, y + 11);
    doc.setTextColor(60);
    doc.text([`Voucher: ${voucher}`, `Method: ${method}`, `Cheque / Ref No.: ${reference}`, `Date: ${formatDateSlash(date)}`], 110, y + 6);
    y += 14 + Math.max(partyLines.length, 4) * 4.2;

    autoTable(doc, {
      head: [['Description', 'Method', 'Reference', 'Amount (PKR)']],
      body: [[
        isCustomer ? 'Payment received against account balance' : 'Payment made against account payable',
        method,
        voucher,
        formatNum(amount),
      ]],
      startY: y,
      margin: TABLE_MARGIN,
      styles: { fontSize: 8.5, cellPadding: 3.5 },
      headStyles: { fillColor: [248, 250, 252], textColor: [51, 65, 85], fontStyle: 'bold' },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
    });

    // @ts-expect-error - lastAutoTable injected by autotable
    y = (doc.lastAutoTable?.finalY || y + 20) + 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Amount in words: ${amountInWords(amount)}`, 14, y);
    y += 9;

    if (balanceAfter !== undefined) {
      const before = balanceAfter + amount;
      const balanceText = (value: number) => value > 0.01
        ? `${isCustomer ? 'Owes' : 'Payable'} ${pkr(value)}`
        : value < -0.01
          ? `Advance ${pkr(Math.abs(value))}`
          : 'Settled';
      const values = [
        ['BALANCE BEFORE', balanceText(before)],
        [isCustomer ? 'RECEIVED NOW' : 'PAID NOW', pkr(amount)],
        ['BALANCE AFTER', balanceText(balanceAfter)],
      ];
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, y, 182, 20, 2, 2, 'S');
      values.forEach(([label, value], index) => {
        const x = 18 + index * 59;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(label, x, y + 7);
        doc.setFontSize(8);
        doc.setTextColor(...CHARCOAL);
        doc.text(doc.splitTextToSize(value, 54), x, y + 14);
      });
      y += 28;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, 182, 22, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(5, 150, 105);
    doc.text(isCustomer ? 'PAYMENT RECEIVED' : 'PAYMENT MADE', 18, y + 13);
    doc.setTextColor(100);
    doc.text(isCustomer ? 'TOTAL RECEIVED' : 'TOTAL PAID', 192, y + 7, { align: 'right' });
    doc.setFontSize(12);
    doc.setTextColor(...CHARCOAL);
    doc.text(pkr(amount), 192, y + 15, { align: 'right' });

    safeSave(doc, `${isCustomer ? 'Customer_Receipt' : 'Vendor_Payment'}_${voucher.replace(/\s+/g, '_')}_${today()}.pdf`);
  } catch (err) {
    reportError(err);
  }
}
