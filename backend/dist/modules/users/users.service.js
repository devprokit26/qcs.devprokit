"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("../../prisma/client");
const config_1 = require("../../config");
const serialize_1 = require("../../lib/serialize");
const httpErrors_1 = require("../../lib/httpErrors");
/** The User Accounts page is admin-only: it can never be stored as a permission of a normal user. */
function withoutAdminOnlyPermission(perms) {
    return perms.filter(p => p !== 'users_management');
}
async function listUsers() {
    const users = await client_1.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return users.map(serialize_1.serializeUser);
}
async function getUser(id) {
    const user = await client_1.prisma.user.findUnique({ where: { id } });
    if (!user)
        throw (0, httpErrors_1.notFoundError)('User not found');
    return (0, serialize_1.serializeUser)(user);
}
async function createUser(input) {
    const existing = await client_1.prisma.user.findUnique({ where: { username: input.username } });
    if (existing)
        throw (0, httpErrors_1.conflictError)(`Username "${input.username}" is already taken`);
    const passwordHash = await bcryptjs_1.default.hash(input.password, config_1.config.bcryptRounds);
    const user = await client_1.prisma.user.create({
        data: {
            name: input.name,
            username: input.username,
            passwordHash,
            permissions: withoutAdminOnlyPermission(input.permissions),
        },
    });
    return (0, serialize_1.serializeUser)(user);
}
async function updateUser(id, input) {
    const user = await client_1.prisma.user.findUnique({ where: { id } });
    if (!user)
        throw (0, httpErrors_1.notFoundError)('User not found');
    if (user.isProtected && input.permissions) {
        if (input.permissions.length < 9) {
            throw (0, httpErrors_1.badRequestError)('Cannot remove permissions from protected admin');
        }
    }
    const data = {};
    if (input.name)
        data.name = input.name;
    if (input.permissions) {
        // Protected admin keeps every page (including users_management); everyone else never gets it
        data.permissions = user.isProtected
            ? input.permissions
            : withoutAdminOnlyPermission(input.permissions);
    }
    if (input.password)
        data.passwordHash = await bcryptjs_1.default.hash(input.password, config_1.config.bcryptRounds);
    const updated = await client_1.prisma.user.update({ where: { id }, data });
    return (0, serialize_1.serializeUser)(updated);
}
async function deleteUser(id, currentUserId) {
    if (currentUserId && id === currentUserId) {
        throw (0, httpErrors_1.badRequestError)('Cannot delete yourself');
    }
    const user = await client_1.prisma.user.findUnique({ where: { id } });
    if (!user)
        throw (0, httpErrors_1.notFoundError)('User not found');
    if (user.isProtected)
        throw (0, httpErrors_1.badRequestError)('Cannot delete the protected admin account');
    await client_1.prisma.$transaction(async (tx) => {
        await tx.expense.updateMany({ where: { createdById: id }, data: { createdById: null } });
        await tx.auditLog.updateMany({ where: { userId: id }, data: { userId: null } });
        await tx.user.delete({ where: { id } });
    });
}
//# sourceMappingURL=users.service.js.map