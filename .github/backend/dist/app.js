"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = require("express-rate-limit");
const pino_http_1 = __importDefault(require("pino-http"));
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_router_1 = require("./modules/auth/auth.router");
const users_router_1 = require("./modules/users/users.router");
const customers_router_1 = require("./modules/customers/customers.router");
const vendors_router_1 = require("./modules/vendors/vendors.router");
const shipments_router_1 = require("./modules/shipments/shipments.router");
const ledger_router_1 = require("./modules/ledger/ledger.router");
const cartons_router_1 = require("./modules/cartons/cartons.router");
const expenses_router_1 = require("./modules/expenses/expenses.router");
const reports_router_1 = require("./modules/reports/reports.router");
const weightProforma_router_1 = require("./modules/weightProforma/weightProforma.router");
exports.app = (0, express_1.default)();
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        const allowed = config_1.config.corsOrigin.split(',').map(o => o.trim());
        if (!origin || allowed.includes(origin))
            callback(null, true);
        else
            callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
exports.app.use(express_1.default.json());
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, pino_http_1.default)({ logger: logger_1.logger }));
exports.app.use((0, express_rate_limit_1.rateLimit)({
    windowMs: config_1.config.rateLimitWindowMs,
    max: config_1.config.rateLimitMax,
    message: { success: false, message: 'Too many requests' },
}));
// Routes
exports.app.get('/api/v1/health', (_req, res) => res.json({ status: 'OK' }));
exports.app.use('/api/v1/auth', auth_router_1.authRouter);
exports.app.use('/api/v1/users', users_router_1.usersRouter);
exports.app.use('/api/v1/customers', customers_router_1.customersRouter);
exports.app.use('/api/v1/vendors', vendors_router_1.vendorsRouter);
exports.app.use('/api/v1/shipments', shipments_router_1.shipmentsRouter);
exports.app.use('/api/v1/ledger', ledger_router_1.ledgerRouter);
exports.app.use('/api/v1/cartons', cartons_router_1.cartonsRouter);
exports.app.use('/api/v1/expenses', expenses_router_1.expensesRouter);
exports.app.use('/api/v1/reports', reports_router_1.reportsRouter);
exports.app.use('/api/v1/weight-proformas', weightProforma_router_1.weightProformaRouter);
// Error handling
exports.app.use(errorHandler_1.notFoundHandler);
exports.app.use(errorHandler_1.errorHandler);
//# sourceMappingURL=app.js.map