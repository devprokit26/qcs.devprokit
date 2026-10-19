/**
 * Service locator.
 * Set VITE_USE_MOCK=false in .env to switch from localStorage mock to the live Express backend.
 */
import { authService as mockAuth }         from './mock/authMockService';
import { authService as restAuth }         from './rest/authRestService';
import { shipmentService as mockShipment } from './mock/shipmentMockService';
import { shipmentService as restShipment } from './rest/shipmentRestService';
import * as mockCarton from './mock/cartonMockService';
import * as restCarton from './rest/cartonRestService';
import * as mockExpense from './mock/expenseMockService';
import * as restExpense from './rest/expenseRestService';
import { getAuditLogs as mockGetAuditLogs } from './mock/auditMockService';
import { getAuditLogs as restGetAuditLogs } from './rest/auditRestService';
export type { AuditEntry } from './rest/auditRestService';

export * from './api/interfaces';
export { storage } from './mock/storage';

import { ledgerService as mockLedger }         from './mock/ledgerMockService';
import { vendorService as mockVendor }         from './mock/vendorMockService';
import { weightProformaService as mockWeightProforma } from './mock/weightProformaMockService';
import { userService as mockUser }           from './mock/userMockService';
import { reportService as mockReport }         from './mock/reportMockService';

import { ledgerService as restLedger }         from './rest/ledgerRestService';
import { vendorService as restVendor }         from './rest/vendorRestService';
import { weightProformaService as restWeightProforma } from './rest/weightProformaRestService';
import { userService as restUser }           from './rest/userRestService';
import { reportService as restReport }         from './rest/reportRestService';
import { invoiceService as mockInvoice }       from './mock/invoiceMockService';
import { invoiceService as restInvoice }       from './rest/invoiceRestService';
import { proformaService as mockProforma }      from './mock/proformaMockService';
import { proformaService as restProforma }      from './rest/proformaRestService';

const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const authService     = useMock ? mockAuth     : restAuth;
export const shipmentService = useMock ? mockShipment : restShipment;
export const ledgerService   = useMock ? mockLedger   : restLedger;
export const vendorService   = useMock ? mockVendor   : restVendor;
export const weightProformaService = useMock ? mockWeightProforma : restWeightProforma;
export const userService     = useMock ? mockUser     : restUser;
export const reportService   = useMock ? mockReport   : restReport;
export const cartonService   = useMock ? mockCarton   : restCarton;
export const expenseService  = useMock ? mockExpense  : restExpense;
export const invoiceService  = useMock ? mockInvoice  : restInvoice;
export const proformaService = useMock ? mockProforma : restProforma;
export const getAuditLogs = useMock ? mockGetAuditLogs : restGetAuditLogs;
