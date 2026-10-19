"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requirePermission = requirePermission;
exports.requireAnyPermission = requireAnyPermission;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const config_1 = require("../config");
const client_1 = require("../prisma/client");
const response_1 = require("../utils/response");
const enums_1 = require("../lib/enums");
async function authenticate(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token)
        return (0, response_1.unauthorized)(res);
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.JsonWebTokenError || err instanceof jsonwebtoken_1.TokenExpiredError) {
            return (0, response_1.unauthorized)(res, 'Invalid or expired token');
        }
        return (0, response_1.unauthorized)(res, 'Authentication failed');
    }
    try {
        const user = await client_1.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, username: true, permissions: true, isProtected: true },
        });
        if (!user)
            return (0, response_1.unauthorized)(res, 'User not found');
        req.user = user;
        next();
    }
    catch (err) {
        res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable. Please retry.',
        });
    }
}
function requirePermission(page) {
    return (req, res, next) => {
        if (!req.user)
            return (0, response_1.unauthorized)(res);
        if (req.user.isProtected)
            return next();
        const mappedPage = (0, enums_1.mapPageKeyToKey)(page);
        if (!req.user.permissions.includes(mappedPage))
            return (0, response_1.forbidden)(res);
        next();
    };
}
function requireAnyPermission(...pages) {
    return (req, res, next) => {
        if (!req.user)
            return (0, response_1.unauthorized)(res);
        if (req.user.isProtected)
            return next();
        const mappedPages = pages.map(enums_1.mapPageKeyToKey);
        const hasAny = mappedPages.some(page => req.user.permissions.includes(page));
        if (!hasAny)
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