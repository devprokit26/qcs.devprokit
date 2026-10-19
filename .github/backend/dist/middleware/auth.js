"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requirePermission = requirePermission;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const client_1 = require("../prisma/client");
const response_1 = require("../utils/response");
async function authenticate(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token)
        return (0, response_1.unauthorized)(res);
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        const user = await client_1.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, username: true, permissions: true, isProtected: true },
        });
        if (!user)
            return (0, response_1.unauthorized)(res);
        req.user = user;
        next();
    }
    catch {
        return (0, response_1.unauthorized)(res);
    }
}
function requirePermission(page) {
    return (req, res, next) => {
        if (!req.user)
            return (0, response_1.unauthorized)(res);
        if (req.user.isProtected)
            return next(); // admin bypass
        if (!req.user.permissions.includes(page))
            return (0, response_1.forbidden)(res);
        next();
    };
}
function requireAdmin(req, res, next) {
    if (!req.user)
        return (0, response_1.unauthorized)(res);
    if (!req.user.isProtected)
        return (0, response_1.forbidden)(res, 'Admin only');
    next();
}
//# sourceMappingURL=auth.js.map