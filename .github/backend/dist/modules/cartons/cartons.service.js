"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCartonTypes = listCartonTypes;
exports.listCartonMovements = listCartonMovements;
exports.createCartonType = createCartonType;
exports.updateCartonType = updateCartonType;
exports.addCartonMovement = addCartonMovement;
const client_1 = require("../../prisma/client");
async function listCartonTypes() {
    return client_1.prisma.cartonType.findMany({ orderBy: { name: 'asc' } });
}
async function listCartonMovements() {
    return client_1.prisma.cartonMovement.findMany({
        orderBy: { date: 'desc' },
        include: { cartonType: true }
    });
}
async function createCartonType(input) {
    return client_1.prisma.cartonType.create({ data: input });
}
async function updateCartonType(id, input) {
    return client_1.prisma.cartonType.update({ where: { id }, data: input });
}
async function addCartonMovement(input, username) {
    return client_1.prisma.cartonMovement.create({
        data: {
            ...input,
            movementType: input.movementType,
            createdBy: username
        },
        include: { cartonType: true }
    });
}
//# sourceMappingURL=cartons.service.js.map