"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginService = loginService;
exports.meService = meService;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("../../prisma/client");
const config_1 = require("../../config");
/** Maps DB user fields to the shape expected by the frontend types.ts */
function mapUser(user) {
    return {
        id: user.id,
        name: user.name,
        username: user.username,
        // DB stores underscores, frontend uses hyphens (e.g. users-management)
        permissions: user.permissions.map(p => p.replace(/_/g, '-')),
        protected: user.isProtected,
        createdAt: user.createdAt.toISOString(),
    };
}
async function loginService(input) {
    const user = await client_1.prisma.user.findUnique({ where: { username: input.username } });
    if (!user)
        throw new Error('Invalid credentials');
    const valid = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!valid)
        throw new Error('Invalid credentials');
    const token = jsonwebtoken_1.default.sign({ sub: user.id }, config_1.config.jwtSecret, {
        expiresIn: (config_1.config.jwtExpiresIn || '7d'),
    });
    return { token, user: mapUser(user) };
}
async function meService(userId) {
    const user = await client_1.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true, name: true, username: true, permissions: true, isProtected: true, createdAt: true },
    });
    return mapUser(user);
}
//# sourceMappingURL=auth.service.js.map