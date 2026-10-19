"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWeightProformas = listWeightProformas;
exports.getWeightProforma = getWeightProforma;
exports.createWeightProforma = createWeightProforma;
exports.updateWeightProforma = updateWeightProforma;
exports.deleteWeightProforma = deleteWeightProforma;
const client_1 = require("../../prisma/client");
const serialize_1 = require("../../lib/serialize");
const httpErrors_1 = require("../../lib/httpErrors");
async function listWeightProformas(search) {
    const where = search ? {
        OR: [
            { cnNo: { contains: search, mode: 'insensitive' } },
            { shipper: { contains: search, mode: 'insensitive' } },
        ],
    } : {};
    const list = await client_1.prisma.weightProforma.findMany({
        where,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
    return list.map(serialize_1.serializeWeightProforma);
}
async function getWeightProforma(id) {
    const wp = await client_1.prisma.weightProforma.findUnique({ where: { id } });
    if (!wp)
        throw (0, httpErrors_1.notFoundError)('Weight Proforma not found');
    return (0, serialize_1.serializeWeightProforma)(wp);
}
async function createWeightProforma(input) {
    const wp = await client_1.prisma.weightProforma.create({
        data: input,
    });
    return (0, serialize_1.serializeWeightProforma)(wp);
}
async function updateWeightProforma(id, input) {
    const wp = await client_1.prisma.weightProforma.update({
        where: { id },
        data: input,
    });
    return (0, serialize_1.serializeWeightProforma)(wp);
}
async function deleteWeightProforma(id) {
    await client_1.prisma.weightProforma.delete({ where: { id } });
}
//# sourceMappingURL=weightProforma.service.js.map