"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listShipments = listShipments;
exports.getShipment = getShipment;
exports.createShipment = createShipment;
exports.updateShipment = updateShipment;
exports.updateShipmentStatus = updateShipmentStatus;
exports.deleteShipment = deleteShipment;
const client_1 = require("../../prisma/client");
async function listShipments() {
    return client_1.prisma.shipment.findMany({
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        include: { cartonsUsed: true }
    });
}
async function getShipment(id) {
    return client_1.prisma.shipment.findUniqueOrThrow({
        where: { id },
        include: { cartonsUsed: true }
    });
}
async function createShipment(input, username) {
    // In a real transactional system, we would:
    // 1. check customer credit
    // 2. deduct cartons
    // 3. update ledger
    // For now, implement basic creation.
    const { cartonsUsed, ...data } = input;
    return client_1.prisma.$transaction(async (tx) => {
        const shipment = await tx.shipment.create({
            data: {
                ...data
            }
        });
        if (cartonsUsed && cartonsUsed.length > 0) {
            await Promise.all(cartonsUsed.map(c => tx.cartonMovement.create({
                data: {
                    cartonTypeId: c.cartonTypeId,
                    date: data.date,
                    movementType: 'USED',
                    quantity: c.quantity,
                    shipmentId: shipment.id,
                    createdBy: username
                }
            })));
        }
        return shipment;
    });
}
async function updateShipment(id, input, username) {
    const { cartonsUsed, ...data } = input;
    return client_1.prisma.$transaction(async (tx) => {
        const shipment = await tx.shipment.update({
            where: { id },
            data
        });
        // For simplicity in this mock-to-backend transition, we assume cartons logic needs proper diffing.
        // If cartonsUsed is provided, we can handle it here or in a separate endpoint.
        return shipment;
    });
}
async function updateShipmentStatus(id, status) {
    return client_1.prisma.shipment.update({
        where: { id },
        data: { status: status },
        include: { cartonsUsed: true }
    });
}
async function deleteShipment(id) {
    await client_1.prisma.$transaction(async (tx) => {
        await tx.cartonMovement.deleteMany({ where: { shipmentId: id } });
        await tx.shipment.delete({ where: { id } });
    });
}
//# sourceMappingURL=shipments.service.js.map