"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProformas = listProformas;
exports.listAvailableShipments = listAvailableShipments;
exports.createProforma = createProforma;
exports.updateProforma = updateProforma;
exports.deleteProforma = deleteProforma;
const client_1 = require("../../prisma/client");
const serialize_1 = require("../../lib/serialize");
const ledger_service_1 = require("../ledger/ledger.service");
const httpErrors_1 = require("../../lib/httpErrors");
const audit_1 = require("../../lib/audit");
// The real consignee / customer name are intentionally NOT returned anywhere.
function serialize(r) {
    return {
        id: r.id,
        serialNo: r.serialNo,
        type: r.type,
        shipmentId: r.shipmentId,
        invoiceDate: r.invoiceDate,
        shipperName: r.shipperName,
        shipperCnic: r.shipperCnic,
        shipperAddress: r.shipperAddress,
        shipperPhone: r.shipperPhone,
        demoConsigneeName: r.demoConsigneeName,
        demoConsigneeAddress: r.demoConsigneeAddress,
        demoConsigneePhone: r.demoConsigneePhone,
        cartonNo: r.cartonNo,
        currency: r.currency,
        exchangeRate: r.exchangeRate == null ? null : (0, serialize_1.toNumber)(r.exchangeRate),
        incoterm: r.incoterm,
        reasonForExport: r.reasonForExport,
        freight: (0, serialize_1.toNumber)(r.freight),
        items: Array.isArray(r.items) ? r.items : [],
        packages: Array.isArray(r.packages) ? r.packages : [],
        notes: r.notes ?? '',
        awb: r.awb,
        shipDate: r.shipDate,
        origin: r.origin,
        destination: r.destination,
        pieces: r.pieces,
        weight: (0, serialize_1.toNumber)(r.weight),
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        realShipperName: r.realShipperName, soldTo: r.soldTo, departure: r.departure, invoiceHsCode: r.invoiceHsCode,
    };
}
// Flat, readable version for the audit log (only demo names, never the real ones).
function auditSnapshot(r) {
    const s = serialize(r);
    return {
        type: s.type,
        invoiceDate: s.invoiceDate,
        shipperName: s.shipperName,
        shipperCnic: s.shipperCnic,
        shipperAddress: s.shipperAddress,
        shipperPhone: s.shipperPhone,
        consigneeName: s.demoConsigneeName,
        consigneeAddress: s.demoConsigneeAddress,
        consigneePhone: s.demoConsigneePhone,
        cartonNo: s.cartonNo,
        currency: s.currency,
        exchangeRate: s.exchangeRate,
        incoterm: s.incoterm,
        reasonForExport: s.reasonForExport,
        freight: s.freight,
        items: s.items
            .map((i, n) => `${n + 1}. ${i.description} | HS ${i.hsCode || '-'} | ${i.qty} ${i.unit} @ ${i.unitPrice}`)
            .join('\n'),
        boxes: s.packages
            .map((b, n) => `Box ${n + 1}: ${b.contents || '-'} | ${b.l}x${b.w}x${b.h} | gross ${b.grossWeight} / net ${b.netWeight}`)
            .join('\n'),
        notes: s.notes,
        realShipperName: s.realShipperName, soldTo: s.soldTo, departure: s.departure, invoiceHsCode: s.invoiceHsCode,
    };
}
async function listProformas() {
    const rows = await client_1.prisma.proformaInvoice.findMany({ orderBy: { serialNo: 'desc' } });
    return rows.map(serialize);
}
/** Shipments that don't have a proforma yet. No customer or consignee names. */
async function listAvailableShipments() {
    const used = (await client_1.prisma.proformaInvoice.findMany({ where: { shipmentId: { not: null } }, select: { shipmentId: true } }))
        .map(u => u.shipmentId)
        .filter((id) => id !== null);
    const rows = await client_1.prisma.shipment.findMany({
        where: { id: { notIn: used } },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
    return rows.map(s => ({
        id: s.id, awb: s.awb, date: s.date, origin: s.origin, destination: s.destination,
        courier: s.courier, productName: s.productName ?? '', pieces: s.pieces, weight: (0, serialize_1.toNumber)(s.weight),
    }));
}
async function createProforma(input, user) {
    return client_1.prisma.$transaction(async (tx) => {
        let ship = null;
        if (input.shipmentId) {
            ship = await tx.shipment.findUnique({ where: { id: input.shipmentId } });
            if (!ship)
                throw (0, httpErrors_1.notFoundError)('Shipment not found');
            const exists = await tx.proformaInvoice.findUnique({ where: { shipmentId: input.shipmentId } });
            if (exists)
                throw (0, httpErrors_1.badRequestError)(`This shipment already has proforma invoice ${exists.serialNo}`);
        }
        const serial = Number(await (0, ledger_service_1.getNextVoucherNo)(tx, 'PROFORMA'));
        if (serial < 5700001)
            throw (0, httpErrors_1.badRequestError)('Proforma counter is missing. Run the SQL step first.');
        const { shipmentId, items, packages, ...rest } = input;
        const row = await tx.proformaInvoice.create({
            data: {
                ...rest,
                serialNo: serial,
                shipmentId: shipmentId || null,
                items: items,
                packages: packages,
                exchangeRate: input.currency === 'PKR' ? null : input.exchangeRate ?? null,
                notes: input.notes ?? null,
                realConsignee: ship ? (ship.consignee ?? '') : '',
                realCustomerName: ship ? (ship.isWalkIn ? (ship.walkInName || ship.customerName) : ship.customerName) : (input.realShipperName || ''),
                awb: ship ? ship.awb : (rest.awb || ''),
                shipDate: ship ? ship.date : (rest.shipDate || input.invoiceDate),
                origin: ship ? ship.origin : (rest.origin || 'Pakistan'),
                destination: ship ? ship.destination : (rest.destination || ''),
                pieces: ship ? ship.pieces : (rest.pieces || 0),
                weight: ship ? ship.weight : (rest.weight || 0),
                createdBy: user.username,
            },
        });
        await (0, audit_1.writeAudit)(tx, {
            userId: user.id, action: 'create', module: 'Proforma', entity: 'Proforma',
            entityId: row.id, label: `${row.serialNo} · ${row.type} · ${row.awb || 'No AWB'}`,
        });
        return serialize(row);
    });
}
async function updateProforma(id, input, userId) {
    return client_1.prisma.$transaction(async (tx) => {
        const old = await tx.proformaInvoice.findUnique({ where: { id } });
        if (!old)
            throw (0, httpErrors_1.notFoundError)('Proforma not found');
        const data = { ...input };
        if (data.currency === 'PKR')
            data.exchangeRate = null;
        const row = await tx.proformaInvoice.update({ where: { id }, data });
        const changes = (0, audit_1.diffObjects)(auditSnapshot(old), auditSnapshot(row));
        if (Object.keys(changes).length) {
            await (0, audit_1.writeAudit)(tx, {
                userId, action: 'update', module: 'Proforma', entity: 'Proforma',
                entityId: id, label: `${row.serialNo} · ${row.type} · ${row.awb}`, changes,
            });
        }
        return serialize(row);
    });
}
async function deleteProforma(id, userId) {
    return client_1.prisma.$transaction(async (tx) => {
        const old = await tx.proformaInvoice.findUnique({ where: { id } });
        if (!old)
            throw (0, httpErrors_1.notFoundError)('Proforma not found');
        await tx.proformaInvoice.delete({ where: { id } });
        await (0, audit_1.writeAudit)(tx, {
            userId, action: 'delete', module: 'Proforma', entity: 'Proforma',
            entityId: id, label: `${old.serialNo} · ${old.type} · ${old.awb || 'No AWB'}`,
        });
        return { success: true, id };
    });
}
//# sourceMappingURL=proforma.service.js.map