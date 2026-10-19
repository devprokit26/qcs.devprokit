"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const validate_1 = require("../../middleware/validate");
const auth_1 = require("../../middleware/auth");
const auth_schema_1 = require("./auth.schema");
const auth_service_1 = require("./auth.service");
const response_1 = require("../../utils/response");
const config_1 = require("../../config");
const router = (0, express_1.Router)();
exports.authRouter = router;
// POST /api/v1/auth/login
router.post('/login', (0, validate_1.validate)(auth_schema_1.loginSchema), async (req, res) => {
    try {
        const result = await (0, auth_service_1.loginService)(req.body);
        // Set httpOnly cookie
        res.cookie('token', result.token, {
            httpOnly: true,
            secure: config_1.config.isProd,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return (0, response_1.ok)(res, result);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Login failed';
        return (0, response_1.unauthorized)(res, msg);
    }
});
// POST /api/v1/auth/logout
router.post('/logout', (_req, res) => {
    res.clearCookie('token');
    return (0, response_1.ok)(res, { message: 'Logged out' });
});
// GET /api/v1/auth/me
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const user = await (0, auth_service_1.meService)(req.user.id);
        return (0, response_1.ok)(res, user);
    }
    catch {
        return (0, response_1.unauthorized)(res);
    }
});
//# sourceMappingURL=auth.router.js.map