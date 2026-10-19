"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const client_1 = require("../../prisma/client");
const response_1 = require("../../utils/response");
const router = (0, express_1.Router)();
exports.dashboardRouter = router;
router.use(auth_1.authenticate);
// We're consolidating dashboard/reports for simplicity here, as they often query similar stats.
// Real production logic would abstract into services, but this serves the mock endpoints.
router.get('/kpi', (0, auth_1.requirePermission)('dashboard'), async (_req, res) => {
    try {
        const totalShipments = await client_1.prisma.shipment.count();
        const activeCustomers = await client_1.prisma.customer.count();
        const unpaidInvoices = 0; // Mock placeholder
        const pendingShipments = await client_1.prisma.shipment.count({ where: { status: 'Pending' } });
        (0, response_1.ok)(res, {
            totalShipments,
            activeCustomers,
            unpaidInvoices,
            pendingShipments
        });
    }
    catch (err) {
        (0, response_1.serverError)(res, 'Failed to fetch KPIs');
    }
});
router.get('/monthly-revenue', (0, auth_1.requirePermission)('dashboard'), async (_req, res) => {
    try {
        // Basic mock implementation mimicking the frontend's chart needs
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
        const revenue = [4000, 3000, 2000, 2780, 1890, 2390, 3490];
        const cost = [2400, 1398, 9800, 3908, 4800, 3800, 4300];
        const data = months.map((name, i) => ({
            name,
            revenue: revenue[i],
            cost: cost[i]
        }));
        (0, response_1.ok)(res, data);
    }
    catch (err) {
        (0, response_1.serverError)(res, 'Failed to fetch revenue');
    }
});
router.get('/recent-activities', (0, auth_1.requirePermission)('dashboard'), async (_req, res) => {
    try {
        // In a real app, query AuditLogs. Using mock static list for now
        const activities = [
            { id: 1, action: "Shipment #1042 created", time: "2 hours ago", user: "admin" },
            { id: 2, action: "Payment of PKR 50,000 received", time: "5 hours ago", user: "ops.tariq" }
        ];
        (0, response_1.ok)(res, activities);
    }
    catch (err) {
        (0, response_1.serverError)(res, 'Failed to fetch activities');
    }
});
//# sourceMappingURL=dashboard.router.js.map