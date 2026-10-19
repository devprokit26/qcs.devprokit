import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProformaInvoice, ProformaPackage } from '@/models/types';
import { formatDateSlash } from './formatters';
import { drawHeader, safeSave, reportError, TABLE_MARGIN } from './pdfExport';
import { COMPANY } from './branding';

const money = (n: number) =>
  (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const wrap = (doc: jsPDF, lines: (string | undefined | false)[], w: number) =>
  lines.filter(Boolean).flatMap(l => doc.splitTextToSize(String(l), w) as string[]);
const lastY = (doc: jsPDF, fallback: number) =>
  ((doc as any).lastAutoTable?.finalY ?? fallback) as number;

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

/**
 * Commercial invoice content with the shared QCS company header.
 * Packing list is ONLY included if it has actual values.
 */
async function commercialInvoicePage(doc: jsPDF, p: ProformaInvoice) {
  if (p.type === 'COMMERCIAL') {
    const cur = p.currency || 'USD';
    const curSymbol = cur === 'USD' ? '$' : cur;
    const subtotal = p.items.reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
      0
    );
    const freight = Number(p.freight) || 0;
    let y = await drawHeader(doc, 'COMMERCIAL INVOICE', [
      `Invoice No: STR${p.serialNo}`,
      `Date: ${formatDateSlash(p.invoiceDate)}`,
    ]);

    autoTable(doc, {
      body: [
        [
          { content: 'BILL FROM', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
          { content: 'BILL TO', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        ],
        [
          `${COMPANY.name}\n${COMPANY.address}\nPhone: ${COMPANY.phone}`,
          `${p.demoConsigneeName || '-'}\n${p.demoConsigneeAddress || '-'}\n${p.demoConsigneePhone ? `Phone: ${p.demoConsigneePhone}\n` : ''}${p.destination || ''}`,
        ],
        [
          `Shipper: ${p.shipperName || '-'}${p.shipperPhone ? `\nPhone: ${p.shipperPhone}` : ''}`,
          `Origin: ${p.departure || 'Sialkot, Pakistan'}\nDestination: ${p.destination || '-'}\nCTN #: ${p.cartonNo || '-'}`,
        ],
      ],
      startY: y,
      margin: TABLE_MARGIN,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, lineColor: [210, 215, 220], lineWidth: 0.2 },
      columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 90 } },
    });
    y = lastY(doc, y + 30) + 5;

    autoTable(doc, {
      head: [['Item', 'Quantity', `Rate (${cur})`, 'Tax', `Amount (${cur})`]],
      body: p.items.map(item => [
        item.description || '-',
        `${Number(item.qty) || 0} ${item.unit || 'PCS'}`,
        money(Number(item.unitPrice) || 0),
        money(0),
        money((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)),
      ]),
      startY: y,
      margin: TABLE_MARGIN,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, lineColor: [210, 215, 220], lineWidth: 0.2 },
      headStyles: { fillColor: [41, 41, 41], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    });
    y = lastY(doc, y + 20) + 5;

    autoTable(doc, {
      body: [
        ['Subtotal', `${curSymbol} ${money(subtotal)}`],
        ['Shipping & Freight', `${curSymbol} ${money(freight)}`],
        [{ content: `Total (${p.incoterm || 'CFR'})`, styles: { fontStyle: 'bold' } },
          { content: `${curSymbol} ${money(subtotal + freight)}`, styles: { fontStyle: 'bold' } }],
      ],
      startY: y,
      margin: { ...TABLE_MARGIN, left: 115 },
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: [210, 215, 220], lineWidth: 0.2 },
      columnStyles: { 0: { cellWidth: 45 }, 1: { halign: 'right', cellWidth: 40 } },
    });
    y = lastY(doc, y + 20) + 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TERMS & CONDITIONS', TABLE_MARGIN.left, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(doc.splitTextToSize(
      `${p.incoterm ? `Incoterm: ${p.incoterm}. ` : ''}${p.reasonForExport || 'As agreed by the parties.'}${p.notes ? `\n${p.notes}` : ''}`,
      180
    ), TABLE_MARGIN.left, y + 5);
    if (p.invoiceHsCode) doc.text(`HS Code: ${p.invoiceHsCode}`, TABLE_MARGIN.left, y + 14);
    y += p.invoiceHsCode ? 20 : 15;

    if (hasPackingValues(p.packages)) {
      if (y + 35 > doc.internal.pageSize.getHeight() - 12) {
        doc.addPage();
        y = 15;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('PACKING LIST', TABLE_MARGIN.left, y);
      y += 2;
      const gross = p.packages.reduce((sum, box) => sum + (Number(box.grossWeight) || 0), 0);
      const net = p.packages.reduce((sum, box) => sum + (Number(box.netWeight) || 0), 0);
      autoTable(doc, {
        head: [['Box', 'Contents', 'Dimensions (cm)', 'Gross KG', 'Net KG']],
        body: p.packages.map((box, index) => [
          String(index + 1),
          box.contents || '-',
          box.l || box.w || box.h ? `${box.l} x ${box.w} x ${box.h}` : '-',
          money(Number(box.grossWeight) || 0),
          money(Number(box.netWeight) || 0),
        ]),
        foot: [[`${p.packages.length} BOX(ES)`, '', 'TOTAL', money(gross), money(net)]],
        startY: y,
        margin: TABLE_MARGIN,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, lineColor: [210, 215, 220], lineWidth: 0.2 },
        headStyles: { fillColor: [41, 41, 41], textColor: [255, 255, 255], fontStyle: 'bold' },
        footStyles: { fillColor: [248, 250, 252], textColor: [0, 0, 0], fontStyle: 'bold' },
      });
    }
    return;
  }

  const cur = p.currency || 'USD';
  const curSymbol = cur === 'USD' ? '$' : cur;
  const left = 12;
  const right = 198;

  const headerY = await drawHeader(doc, 'COMMERCIAL INVOICE', [
    `STR${p.serialNo}`,
    `Date: ${formatDateSlash(p.invoiceDate)}`,
  ]);

  // 2. Shipper Block (Top Left)
  let y = headerY + 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SHIPPER:', left, y);
  doc.setLineWidth(0.25);
  doc.setDrawColor(0, 0, 0);
  doc.line(left, y + 1, left + 18, y + 1);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text((p.shipperName || 'MR BURHAN').toUpperCase(), left, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const shipperLines = wrap(doc, [p.shipperAddress], 72);
  doc.text(shipperLines, left, y + 4);
  y += 4 + shipperLines.length * 3.8;
  if (p.shipperPhone) {
    doc.text(`PH: ${p.shipperPhone}`, left, y);
    y += 4;
  }

  // 3. Middle & Right Info
  let midRightY = headerY + 4;
  if (p.cartonNo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`CTN # ${p.cartonNo}`, 125, midRightY);
  }
  if (p.shipperCnic) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`CNC: ${p.shipperCnic}`, 145, midRightY);
  }

  midRightY += 7;
  // Date, Invoice No, Destination, Departure on the right
  const rightX = 145;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Date:', rightX, midRightY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateSlash(p.invoiceDate), 162, midRightY);

  midRightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', rightX, midRightY);
  doc.setFont('helvetica', 'normal');
  doc.text(`STR${p.serialNo}`, 165, midRightY);

  midRightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Destination:', rightX, midRightY);
  doc.setFont('helvetica', 'normal');
  doc.text(p.destination || '—', 167, midRightY);

  midRightY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Departure:', rightX, midRightY);
  doc.setFont('helvetica', 'normal');
  doc.text(p.departure || 'Sialkot, Pakistan', 165, midRightY);

  // 4. Ship To Block (Below Shipper on left)
  let shipToY = Math.max(y + 2, headerY + 22);
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(9);
  doc.text('SHIP TO:', left, shipToY);

  shipToY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(p.demoConsigneeName || '', left, shipToY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const consigneeLines = wrap(doc, [p.demoConsigneeAddress, p.destination], 72);
  doc.text(consigneeLines, left, shipToY + 4);
  shipToY += 4 + consigneeLines.length * 3.8;

  if (p.demoConsigneePhone) {
    doc.setFont('helvetica', 'bold');
    doc.text(`PH ${p.demoConsigneePhone}`, left, shipToY);
    shipToY += 4;
  }

  // HS CODE above table
  const tableStartY = Math.max(shipToY + 2, midRightY + 8, headerY + 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(p.invoiceHsCode ? `HS CODE: ${p.invoiceHsCode}` : 'HS CODE:', 100, tableStartY - 2);

  // 5. 10-Column Items Table
  let subtotal = 0;
  p.items.forEach(i => (subtotal += (Number(i.qty) || 0) * (Number(i.unitPrice) || 0)));

  const bodyRows: string[][] = p.items.map(i => [
    i.description || '',
    (i.madeOf || i.description || '').toUpperCase(),
    (i.originCountry || 'PAKISTAN').toUpperCase(),
    i.hsCode || '-',
    (i.unit || 'PCS').toUpperCase(),
    (i.sizesColors || 'ASSORTED').toUpperCase(),
    (i.gender || 'UNISEX').toUpperCase(),
    String(i.qty || 0),
    i.unitPrice ? String(i.unitPrice) : '0',
    money((Number(i.qty) || 0) * (Number(i.unitPrice) || 0)),
  ]);

  // Fill up to 7 rows with 0.00 like the Excel template
  const needed = Math.max(0, 7 - bodyRows.length);
  for (let idx = 0; idx < needed; idx++) {
    bodyRows.push(['', '', '', '', '', '', '', '', '', '0.00']);
  }

  autoTable(doc, {
    head: [[
      'PRODUCT NAME',
      'DESCRIPTION OF GOODS WITH MADE OF DETAIL',
      'COUNTRY OF ORIGIN',
      'H.T.S CODE',
      'UNIT',
      'SIZES & COULORS',
      'GENDER',
      'QTY',
      'UNIT PRICE',
      `TOTAL VALUE ${cur}`,
    ]],
    body: bodyRows,
    startY: tableStartY,
    margin: { left, right: 12 },
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.6,
      overflow: 'linebreak',
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      halign: 'center',
    },
    headStyles: {
      fillColor: [41, 41, 41],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center',
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'left' },
      1: { cellWidth: 38, halign: 'left' },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 10 },
      5: { cellWidth: 18 },
      6: { cellWidth: 14 },
      7: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 14, halign: 'right' },
      9: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
  });

  let curY = lastY(doc, tableStartY + 40) + 2;

  // 6. Totals Section (Right Aligned under table)
  const freight = Number(p.freight) || 0;
  const grandTotal = subtotal + freight;
  const totalsBoxX = 145;
  const totalsValX = right;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);

  // Subtotal row
  doc.text('SUBTOTAL', totalsBoxX - 4, curY + 3.5, { align: 'right' });
  doc.rect(totalsBoxX, curY, totalsValX - totalsBoxX, 5);
  doc.text(`${curSymbol} ${money(subtotal)}`, totalsValX - 2, curY + 3.5, { align: 'right' });
  curY += 5;

  // Shipping & Freight row
  doc.text('SHIPPING & FRIEGHT', totalsBoxX - 4, curY + 3.5, { align: 'right' });
  doc.rect(totalsBoxX, curY, totalsValX - totalsBoxX, 5);
  doc.text(`${curSymbol} ${money(freight)}`, totalsValX - 2, curY + 3.5, { align: 'right' });
  curY += 5;

  // Grand Total CFR row
  doc.setFont('helvetica', 'bold');
  doc.text(`GRAND Total VALUE ${p.incoterm || 'CFR'}`, totalsBoxX - 4, curY + 4, { align: 'right' });
  doc.setLineWidth(0.3);
  doc.rect(totalsBoxX, curY, totalsValX - totalsBoxX, 5.5);
  doc.text(`${curSymbol} ${money(grandTotal)}`, totalsValX - 2, curY + 4, { align: 'right' });
  curY += 8;

  // 7. PACKING LIST — ONLY ADDED WHEN VALUES EXIST!
  if (hasPackingValues(p.packages)) {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (curY + 35 > pageHeight - 12) {
      doc.addPage();
      curY = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text('PACKING LIST', left, curY);
    curY += 2;

    const g = p.packages.reduce((s, b) => s + (Number(b.grossWeight) || 0), 0);
    const n = p.packages.reduce((s, b) => s + (Number(b.netWeight) || 0), 0);

    autoTable(doc, {
      head: [['Box No.', 'Contents', 'Dimensions (cm)', 'Gross Wt (KG)', 'Net Wt (KG)']],
      body: p.packages.map((b, i) => [
        String(i + 1),
        b.contents || '-',
        b.l || b.w || b.h ? `${b.l} x ${b.w} x ${b.h}` : '-',
        Number(b.grossWeight).toFixed(2),
        b.netWeight ? Number(b.netWeight).toFixed(2) : '-',
      ]),
      foot: [[`${p.packages.length} BOX(ES)`, '', 'TOTAL', g.toFixed(2), n ? n.toFixed(2) : '-']],
      startY: curY,
      margin: { left, right: 12 },
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.8, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0] },
      headStyles: { fillColor: [41, 41, 41], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' }, 4: { halign: 'right' } },
      showFoot: 'lastPage',
    });
  }
}

/**
 * Standard declaration page for Gift / Dox invoices with the shared QCS header.
 */
async function giftOrDoxPage(doc: jsPDF, p: ProformaInvoice) {
  const cur = p.currency || 'USD';
  const title = p.type === 'GIFT' ? 'GIFT INVOICE' : 'DOCUMENT DECLARATION (DOX)';
  let y = await drawHeader(doc, title, [`STR${p.serialNo}`, `Date: ${formatDateSlash(p.invoiceDate)}`]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('SHIPPER / EXPORTER', 14, y);
  doc.text('CONSIGNEE / SHIP TO', 110, y);

  doc.setFontSize(9.5);
  const ln = wrap(doc, [p.shipperName], 88);
  const rn = wrap(doc, [p.demoConsigneeName], 88);
  doc.text(ln, 14, y + 5);
  doc.text(rn, 110, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const la = wrap(doc, [p.shipperAddress, p.shipperPhone && `Tel: ${p.shipperPhone}`, p.shipperCnic && `CNIC: ${p.shipperCnic}`], 88);
  const ra = wrap(doc, [p.demoConsigneeAddress, p.destination, p.demoConsigneePhone && `Tel: ${p.demoConsigneePhone}`], 88);
  doc.text(la, 14, y + 5 + ln.length * 4.5);
  doc.text(ra, 110, y + 5 + rn.length * 4.5);

  y = y + 8 + Math.max(ln.length * 4.5 + la.length * 3.8, rn.length * 4.5 + ra.length * 3.8);

  const info: (string | { content: string; colSpan: number })[][] = [
    ['Country of Origin', 'Pakistan', 'Destination', p.destination],
    ['Invoice Date', formatDateSlash(p.invoiceDate), 'Invoice No.', `STR${p.serialNo}`],
    ['CTN #', p.cartonNo || '-', 'Weight', `${p.weight.toFixed(2)} KG`],
  ];
  if (p.type === 'GIFT') {
    info.push(['Purpose of Shipment', `${p.reasonForExport || 'Gift'} - NOT FOR SALE`, 'Currency', cur]);
  } else {
    info.push(['Nature', 'Documents only', 'Pieces', String(p.pieces || '-')]);
  }

  autoTable(doc, {
    body: info,
    startY: y,
    margin: TABLE_MARGIN,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
    columnStyles: {
      0: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 38 },
      2: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 38 },
    },
  });

  y = lastY(doc, y + 20) + 6;
  let sub = 0;

  if (p.type === 'DOX') {
    autoTable(doc, {
      head: [['Description of Contents', 'Pieces', 'Weight (KG)']],
      body: [[p.items[0]?.description || '', String(p.pieces || '-'), p.weight.toFixed(2)]],
      startY: y,
      margin: TABLE_MARGIN,
      styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.2 },
      headStyles: { fillColor: [41, 41, 41], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right', fontStyle: 'bold' } },
    });
  } else {
    p.items.forEach(i => (sub += (Number(i.qty) || 0) * (Number(i.unitPrice) || 0)));
    autoTable(doc, {
      head: [['#', 'Description of Item', 'HS Code', 'Qty', 'Unit', `Value / Unit (${cur})`, `Total Value (${cur})`]],
      body: p.items.map((i, n) => [
        String(n + 1),
        i.description,
        i.hsCode || '-',
        String(i.qty),
        i.unit,
        money(i.unitPrice),
        money(i.qty * i.unitPrice),
      ]),
      startY: y,
      margin: TABLE_MARGIN,
      styles: { fontSize: 8, cellPadding: 2.2, lineColor: [0, 0, 0], lineWidth: 0.2 },
      headStyles: { fillColor: [41, 41, 41], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 3: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right', fontStyle: 'bold' } },
    });

    y = lastY(doc, y + 20) + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`TOTAL DECLARED VALUE: ${cur} ${money(sub)}`, 196, y, { align: 'right' });
  }

  // Packing list if provided and requested
  if (hasPackingValues(p.packages)) {
    y = lastY(doc, y + 20) + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('PACKING LIST', 14, y);
    y += 2;
    autoTable(doc, {
      head: [['Box No.', 'Contents', 'Dimensions (cm)', 'Gross Wt (KG)', 'Net Wt (KG)']],
      body: p.packages.map((b, i) => [
        String(i + 1),
        b.contents || '-',
        b.l || b.w || b.h ? `${b.l} x ${b.w} x ${b.h}` : '-',
        Number(b.grossWeight).toFixed(2),
        b.netWeight ? Number(b.netWeight).toFixed(2) : '-',
      ]),
      startY: y,
      margin: TABLE_MARGIN,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
      headStyles: { fillColor: [41, 41, 41], textColor: [255, 255, 255], fontStyle: 'bold' },
    });
  }
}

/**
 * Dedicated standalone packing page if requested separately.
 */
async function standalonePackingPage(doc: jsPDF, p: ProformaInvoice) {
  let y = await drawHeader(doc, 'PACKING LIST', [`STR${p.serialNo}`, `Date: ${formatDateSlash(p.invoiceDate)}`]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Invoice No: STR${p.serialNo}`, 14, y);
  doc.text(`Date: ${formatDateSlash(p.invoiceDate)}`, 110, y);
  y += 4;
  doc.text(`Shipper: ${p.shipperName}`, 14, y);
  doc.text(`Consignee: ${p.demoConsigneeName} (${p.destination})`, 110, y);
  y += 8;

  const g = p.packages.reduce((s, b) => s + (Number(b.grossWeight) || 0), 0);
  const n = p.packages.reduce((s, b) => s + (Number(b.netWeight) || 0), 0);

  autoTable(doc, {
    head: [['Box No.', 'Contents', 'Dimensions (cm)', 'Gross Wt (KG)', 'Net Wt (KG)']],
    body: p.packages.map((b, i) => [
      String(i + 1),
      b.contents || '-',
      b.l || b.w || b.h ? `${b.l} x ${b.w} x ${b.h}` : '-',
      Number(b.grossWeight).toFixed(2),
      b.netWeight ? Number(b.netWeight).toFixed(2) : '-',
    ]),
    foot: [[`${p.packages.length} BOX(ES)`, '', 'TOTAL', g.toFixed(2), n ? n.toFixed(2) : '-']],
    startY: y,
    margin: TABLE_MARGIN,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0] },
    headStyles: { fillColor: [41, 41, 41], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: { 3: { halign: 'right', fontStyle: 'bold' }, 4: { halign: 'right' } },
    showFoot: 'lastPage',
  });
}

export async function exportProformaPDF(
  p: ProformaInvoice,
  part: 'invoice' | 'packing' | 'both' = 'invoice'
) {
  try {
    const doc = new jsPDF({ orientation: 'portrait' });

    if (part === 'packing') {
      await standalonePackingPage(doc, p);
    } else {
      if (p.type === 'COMMERCIAL') {
        await commercialInvoicePage(doc, p);
      } else {
        await giftOrDoxPage(doc, p);
      }
    }

    safeSave(doc, `Proforma_${p.serialNo}_${p.type}.pdf`);
  } catch (err) {
    reportError(err);
  }
}