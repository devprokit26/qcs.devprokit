"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.reportsRouter = router;
router.use(auth_1.authenticate);
router.get('/analytics', (_req, res) => {
    (0, response_1.ok)(res, {
        todayShipments: 0,
        totalShipments: 0,
        totalRevenue: 0,
        totalCost: 0,
        netProfit: 0,
        profitMarginPercent: 0,
        topCourier: null,
        topCustomer: null,
        outstandingReceivable: 0,
        totalCustomers: 0,
        totalVendors: 0,
        overdueAlertCount: 0,
        agingTotals: {
            current: 0,
            d1_30: 0,
            d31_60: 0,
            d60plus: 0,
        },
    });
});
router.get('/trend', (_req, res) => {
    (0, response_1.ok)(res, []);
});
router.get('/status-distribution', (_req, res) => {
    (0, response_1.ok)(res, {});
});
router.get('/service-distribution', (_req, res) => {
    (0, response_1.ok)(res, {});
});
router.get('/couriers', (_req, res) => {
    (0, response_1.ok)(res, []);
});
router.get('/destinations', (_req, res) => {
    (0, response_1.ok)(res, []);
});
router.get('/customers', (_req, res) => {
    (0, response_1.ok)(res, []);
});
//# sourceMappingURL=reports.router.js.map