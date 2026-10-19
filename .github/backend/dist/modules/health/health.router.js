"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRouter = void 0;
const express_1 = require("express");
const client_1 = require("../../prisma/client");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.healthRouter = router;
router.get('/', async (_req, res) => {
    try {
        // Check DB connection
        await client_1.prisma.$queryRaw `SELECT 1`;
        (0, response_1.ok)(res, { status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
    }
    catch (error) {
        (0, response_1.serverError)(res, 'Database connection failed');
    }
});
//# sourceMappingURL=health.router.js.map