"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const response_1 = require("../../utils/response");
const reports_service_1 = require("./reports.service");
const router = (0, express_1.Router)();
exports.reportsRouter = router;
router.use(auth_1.authenticate);
router.use((0, auth_1.requireAnyPermission)('dashboard', 'reports', 'alerts'));
router.get('/analytics', async (_req, res) => {
    (0, response_1.ok)(res, await (0, reports_service_1.getAnalyticsSummary)());
});
router.get('/trend', async (req, res) => {
    const days = Math.min(Math.max(parseInt(String(req.query.days ?? '7'), 10) || 7, 1), 365);
    (0, response_1.ok)(res, await (0, reports_service_1.getRevenueCostTrend)(days));
});
router.get('/status-distribution', async (_req, res) => {
    (0, response_1.ok)(res, await (0, reports_service_1.getStatusDistribution)());
});
router.get('/service-distribution', async (_req, res) => {
    (0, response_1.ok)(res, await (0, reports_service_1.getServiceDistribution)());
});
router.get('/couriers', async (_req, res) => {
    (0, response_1.ok)(res, await (0, reports_service_1.getCourierReport)());
});
router.get('/destinations', async (_req, res) => {
    (0, response_1.ok)(res, await (0, reports_service_1.getDestinationReport)());
});
router.get('/customers', async (_req, res) => {
    (0, response_1.ok)(res, await (0, reports_service_1.getCustomerReport)());
});
router.get('/credit-warnings', async (_req, res) => {
    (0, response_1.ok)(res, await (0, reports_service_1.getCreditWarnings)());
});
//# sourceMappingURL=reports.router.js.map