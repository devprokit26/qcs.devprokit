"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCartonTypes = listCartonTypes;
exports.listCartonMovements = listCartonMovements;
exports.createCartonType = createCartonType;
exports.updateCartonType = updateCartonType;
exports.deleteCartonType = deleteCartonType;
exports.addCartonMovement = addCartonMovement;
const client_1 = require("../../prisma/client");
const dates_1 = require("../../lib/dates");
const serialize_1 = require("../../lib/serialize");
const httpErrors_1 = require("../../lib/httpErrors");
async function listCartonTypes() {
    const types = await client_1.prisma.cartonType.findMany({ orderBy: { name: 'asc' } });
    return types.map(serialize_1.serializeCartonType);
}
async function listCartonMovements() {
    const movements = await client_1.prisma.cartonMovement.findMany({
        orderBy: { date: 'desc' },
        include: { cartonType: true }
    });
    return movements.map(serialize_1.serializeCartonMovement);
}
async function createCartonType(input, username = 'system') {
    const { openingQuantity, openingUnitCost, ...typeData } = input;
    // Create the type and (optionally) its first stock in ONE transaction,
    // so we never end up with a box type that is missing its opening stock.
    const ct = await client_1.prisma.$transaction(async (tx) => {
        const created = await tx.cartonType.create({ data: typeData });
        if (openingQuantity && openingQuantity > 0) {
            await tx.cartonMovement.create({
                data: {
                    cartonTypeId: created.id,
                    date: (0, dates_1.todayStr)(),
                    movementType: 'RECEIVED',
                    quantity: openingQuantity,
                    unitCost: openingUnitCost ?? null,
                    note: 'Opening stock',
                    createdBy: username,
                },
            });
        }
        return created;
    });
    return (0, serialize_1.serializeCartonType)(ct);
}
async function updateCartonType(id, input) {
    const existing = await client_1.prisma.cartonType.findUnique({ where: { id } });
    if (!existing)
        throw (0, httpErrors_1.notFoundError)('Carton type not found');
    const ct = await client_1.prisma.cartonType.update({ where: { id }, data: input });
    return (0, serialize_1.serializeCartonType)(ct);
}
/**
 * Deletes a carton type and its stock movements.
 * Refused when the box type has been used in shipments (history must stay intact).
 */
async function deleteCartonType(id) {
    const ct = await client_1.prisma.cartonType.findUnique({ where: { id } });
    if (!ct)
        throw (0, httpErrors_1.notFoundError)('Carton type not found');
    const used = await client_1.prisma.cartonMovement.findMany({
        where: { cartonTypeId: id, shipmentId: { not: null } },
        select: { shipmentId: true },
        distinct: ['shipmentId'],
    });
    if (used.length > 0) {
        throw (0, httpErrors_1.badRequestError)(`"${ct.name}" is used in ${used.length} shipment(s) and cannot be deleted. Edit it and mark it inactive instead.`);
    }
    await client_1.prisma.$transaction([
        client_1.prisma.cartonMovement.deleteMany({ where: { cartonTypeId: id } }),
        client_1.prisma.cartonType.delete({ where: { id } }),
    ]);
}
async function addCartonMovement(input, username) {
    const mov = await client_1.prisma.cartonMovement.create({
        data: {
            ...input,
            movementType: input.movementType,
            createdBy: username
        },
        include: { cartonType: true }
    });
    return (0, serialize_1.serializeCartonMovement)(mov);
}
//# sourceMappingURL=cartons.service.js.map