"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginService = loginService;
exports.meService = meService;
exports.maybeRefreshToken = maybeRefreshToken;
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
        throw new Error('Incorrect username or password. Please try again.');
    const valid = await bcryptjs_1.default.compare(input.password, user.passwordHash);
    if (!valid)
        throw new Error('Incorrect username or password. Please try again.');
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
/**
 * Sliding refresh: if the token has less than 2 days left, issue a fresh 7-day token.
 * Returns null if no refresh is needed or if the token cannot be decoded.
 */
function maybeRefreshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded?.sub || !decoded?.exp)
            return null;
        const expiresInMs = decoded.exp * 1000 - Date.now();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        if (expiresInMs > twoDaysMs)
            return null; // no refresh needed
        const fresh = jsonwebtoken_1.default.sign({ sub: decoded.sub }, config_1.config.jwtSecret, {
            expiresIn: (config_1.config.jwtExpiresIn || '7d'),
        });
        return { token: fresh };
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=auth.service.js.map