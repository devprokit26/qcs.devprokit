"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("../../prisma/client");
const config_1 = require("../../config");
const userSelect = {
    id: true, name: true, username: true,
    permissions: true, isProtected: true, createdAt: true,
};
async function listUsers() {
    return client_1.prisma.user.findMany({ select: userSelect, orderBy: { createdAt: 'asc' } });
}
async function createUser(input) {
    const existing = await client_1.prisma.user.findUnique({ where: { username: input.username } });
    if (existing)
        throw new Error(`Username "${input.username}" is already taken`);
    const passwordHash = await bcryptjs_1.default.hash(input.password, config_1.config.bcryptRounds);
    return client_1.prisma.user.create({
        data: {
            name: input.name,
            username: input.username,
            passwordHash,
            permissions: input.permissions,
        },
        select: userSelect,
    });
}
async function updateUser(id, input) {
    const user = await client_1.prisma.user.findUniqueOrThrow({ where: { id } });
    const data = {};
    if (input.name)
        data.name = input.name;
    if (input.permissions)
        data.permissions = input.permissions;
    if (input.password)
        data.passwordHash = await bcryptjs_1.default.hash(input.password, config_1.config.bcryptRounds);
    // Protected admin cannot have username changed or permissions stripped
    if (user.isProtected && input.permissions && input.permissions.length < 9) {
        throw new Error('Cannot remove permissions from default admin');
    }
    return client_1.prisma.user.update({ where: { id }, data, select: userSelect });
}
async function deleteUser(id) {
    const user = await client_1.prisma.user.findUniqueOrThrow({ where: { id } });
    if (user.isProtected)
        throw new Error('Cannot delete the protected admin account');
    await client_1.prisma.user.delete({ where: { id } });
}
//# sourceMappingURL=users.service.js.map