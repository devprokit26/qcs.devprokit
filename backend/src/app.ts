import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import pinoHttp from 'pino-http';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { idempotency } from './middleware/idempotency';

import { authRouter } from './modules/auth/auth.router';
import { usersRouter } from './modules/users/users.router';
import { customersRouter } from './modules/customers/customers.router';
import { vendorsRouter } from './modules/vendors/vendors.router';
import { shipmentsRouter } from './modules/shipments/shipments.router';
import { ledgerRouter } from './modules/ledger/ledger.router';
import { cartonsRouter } from './modules/cartons/cartons.router';
import { expensesRouter } from './modules/expenses/expenses.router';
import { reportsRouter } from './modules/reports/reports.router';
import { weightProformaRouter } from './modules/weightProforma/weightProforma.router';
import { invoicesRouter } from './modules/invoices/invoices.router';
import { auditRouter } from './modules/audit/audit.router';
import { proformaRouter } from './modules/proforma/proforma.router';

export const app = express();

const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = config.corsOrigin.split(',').map(o => o.trim());
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// Health check: registered BEFORE the rate limiter and idempotency,
// so connectivity polling from the sync engine never counts against the limit
app.get('/api/v1/health', (_req, res) => res.json({ status: 'healthy', database: 'connected' }));

app.use(idempotency);

// General API rate limit (100,000 in development, 10,000 in production per 15 min)
app.use(
  rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: isProd ? config.rateLimitMax : 100000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests' },
  })
);

// Strict rate limit on login (only failed attempts count)
const authRateLimit = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: isProd ? config.authRateLimitMax : 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

// Routes
app.use('/api/v1/auth/login', authRateLimit);   // strict limit on /login only
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/vendors', vendorsRouter);
app.use('/api/v1/shipments', shipmentsRouter);
app.use('/api/v1/ledger', ledgerRouter);
app.use('/api/v1/cartons', cartonsRouter);
app.use('/api/v1/expenses', expensesRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/proforma', proformaRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/weight-proformas', weightProformaRouter);
app.use('/api/v1/invoices', invoicesRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);