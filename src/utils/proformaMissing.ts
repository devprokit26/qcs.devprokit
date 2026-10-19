import { ProformaDraft } from '@/models/types';

const VAGUE = ['gift', 'gifts', 'misc', 'miscellaneous', 'items', 'goods'];

/** Print is blocked while this returns anything. */
export function getProformaMissing(p: ProformaDraft, part: 'invoice' | 'packing' | 'both' = 'both'): string[] {
  const m: string[] = [];
  if (!p.shipperName.trim()) m.push('Shipper name');
  if (!p.shipperAddress.trim()) m.push('Shipper address');
  if (!p.demoConsigneeName.trim()) m.push('Consignee name');
  if (!p.demoConsigneeAddress.trim()) m.push('Consignee address');
  if (!p.destination.trim()) m.push('Destination country');

  if (p.type === 'DOX') {
    if (!p.items[0]?.description?.trim()) m.push('Description of documents');
  } else {
    if (!p.items.length) m.push('At least one item line');
    p.items.forEach((it, i) => {
      const n = `Item ${i + 1}`;
      if (!it.description.trim()) m.push(`${n}: description`);
      if (!(it.qty > 0)) m.push(`${n}: quantity`);
      if (!(it.unitPrice > 0)) m.push(`${n}: ${p.type === 'GIFT' ? 'declared value' : 'unit price'}`);
      if (p.type === 'GIFT' && VAGUE.includes(it.description.trim().toLowerCase())) {
        m.push(`${n}: description is too vague, write what the item actually is`);
      }
      if (p.type === 'COMMERCIAL') {
        if (!it.hsCode.trim()) m.push(`${n}: HS code`);
        if (!it.originCountry.trim()) m.push(`${n}: country of origin`);
      }
    });
    if (p.type === 'COMMERCIAL') {
      if (!p.reasonForExport.trim()) m.push('Reason for export');
      if (!p.incoterm.trim()) m.push('Incoterm');
    }
    if (p.type === 'GIFT' && !p.reasonForExport.trim()) m.push('Purpose (Gift / Sample)');
    if (part !== 'invoice') {
      if (!p.packages.length) m.push('Packing list: add at least one box');
      p.packages.forEach((b, i) => { if (!(b.grossWeight > 0)) m.push(`Box ${i + 1}: gross weight`); });
    }
  }
  return m;
}