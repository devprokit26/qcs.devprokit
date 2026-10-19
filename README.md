# ALINCE LOGISTICS &mdash; Freight &amp; Courier Management ERP

An enterprise-grade, single-page application built for Pakistani logistics operations, international freight forwarding, and customer/vendor ledger accounting.

---

## 🚀 Key Features

1. **Authentication & Role-Based Access Control**:
   - Seed credentials for system administrator and operations staff.
   - Fine-grained per-page access permissions (Dashboard, Shipments, Weight Proforma, Ledger, Alerts, Reports, Users).
2. **Operations & Booking (Shipments)**:
   - Real-time search, status filtering, and flexible date-range filters (Today, 7D, 30D, Custom range with financial summary).
   - Auto-suggested AWB, Ship. Invoice #, and Job #.
   - Walk-in cash customer toggle (skips customer ledger, treated as paid on the spot).
   - Live credit limit and overdue payment term validation before booking.
   - Client-facing invoice document with inline printing and PDF export.
   - Complete shipment table export to landscape PDF.
3. **Weight Proforma**:
   - Box-by-box actual vs. volumetric weight calculation ($Dim\ Weight = \frac{L \times W \times H}{Divisor}$).
   - Chargeable weight calculation ($\max(Actual, Dim)$) with dynamic box rows and divisor selector ($5000$ / $6000$).
   - Printable official Weight Proforma document with PDF download.
4. **Ledger & Khata Accounting**:
   - Dual sub-tabs: **Customers (Khata)** and **Vendors (Payables)**.
   - Full double-entry auto-postings: booking a shipment auto-posts customer debit (`AE-LOC-INV`) and courier vendor liability (`PINV`).
   - Editing a shipment auto-posts journal adjustments (`JVR`) and reversals on party reassignments.
   - Receipts (`BRV`, `CRV`, `JVR`) and vendor payments (`BPV`, `CPV`, `JVR`).
   - General Ledger statement (ASR format) with voucher numbers, running balances, and Dr/Cr indicators.
   - Automated WhatsApp and Email debt reminder generators.
5. **Aging & Payment Alerts**:
   - FIFO credit allocation engine sorting invoices into Current, 1–30, 31–60, and 60+ days overdue buckets.
   - Nav badge count and instant payment resolution shortcuts.
6. **Analytics & Reports**:
   - Revenue vs Cost 7-day trend, Status donut, Service type horizontal bar charts.
   - Carrier profitability and market share analysis.
   - Destination country tonnage and average yield reports.

---

## 🏗️ Architecture: Strict MVC Separation

The application strictly enforces Model-View-Controller separation to decouple business logic from the UI and enable seamless transition to a PostgreSQL backend:

```
src/
├── models/             # Entity interfaces + Pure business logic (no React, no UI)
│   ├── types.ts        # Customer, Vendor, Shipment, Ledger, Voucher, User interfaces
│   ├── balance.ts      # Pure balance calculation: Opening + Debits - Credits
│   ├── aging.ts        # Pure FIFO credit allocation & aging bucket computation
│   ├── credit.ts       # Pure credit-limit breach & overdue booking lock rules
│   ├── weight.ts       # Pure volumetric (L*W*H/divisor) & chargeable weight formulas
│   ├── vouchers.ts     # Independent voucher auto-increment counters per type
│   └── ledger.ts       # Automated double-entry posting rules (AE-LOC-INV, PINV, JVR)
│
├── services/           # Data layer (Async Promises only)
│   ├── api/
│   │   └── interfaces.ts # TypeScript service contracts (IShipmentService, ILedgerService, etc.)
│   └── mock/           # LocalStorage implementation + rich seed data
│       ├── seedData.ts # 6+ customers, 8 vendors, 22+ shipments across all statuses
│       ├── storage.ts  # LocalStorage persistence adapter
│       └── ...         # Service implementations
│
├── controllers/        # Custom React hooks (one per module) connecting views to services
│   ├── useAuthController.ts
│   ├── useDashboardController.ts
│   ├── useShipmentsController.ts
│   ├── useWeightProformaController.ts
│   ├── useLedgerController.ts
│   ├── useAlertsController.ts
│   ├── useReportsController.ts
│   └── useUsersController.ts
│
├── views/              # Presentational layer (UI components & pages only)
│   ├── components/
│   │   ├── common/     # Reusable Button, Input, Select, Badge, StatCard, Modal, ConfirmDialog
│   │   ├── layout/     # AppShell, Sidebar, TopBar, Logo
│   │   ├── shipments/  # ShipmentModal, ShipmentInvoiceModal
│   │   ├── weightProforma/ # WeightProformaModal, WeightProformaViewModal
│   │   ├── ledger/     # CustomerModal, VendorModal, PaymentModal, DebitModal, GeneralLedgerModal...
│   │   └── users/      # UserModal
│   └── pages/          # LoginPage, DashboardPage, ShipmentsPage, WeightProformaPage, LedgerPage...
│
├── routes/             # React Router with route-level lazy loading & ProtectedRoute guards
├── utils/              # PKR currency and date formatters, constants, jsPDF generators
└── styles/             # Tailwind & theme tokens with @fontsource self-hosted typography
```

> **Strict Rule**: Views **never** touch `localStorage` or services directly. Only controllers do.

---

## 🔄 Swapping Mock Services for Real Express / PostgreSQL API

To transition from the client-side mock data layer to your production Express + PostgreSQL backend:

1. **Keep the Service Interface**:
   All methods in `src/services/api/interfaces.ts` return Promises (e.g. `Promise<Shipment[]>`, `Promise<Customer>`).
2. **Create REST Services in `src/services/rest/`**:
   Implement the same interfaces using `fetch` or `axios`:
   ```typescript
   // src/services/rest/shipmentRestService.ts
   import { IShipmentService } from '../api/interfaces';
   
   export class ShipmentRestService implements IShipmentService {
     async getShipments(filter) {
       const res = await fetch(`/api/shipments?${new URLSearchParams(filter as any)}`);
       return res.json();
     }
     // ...
   }
   ```
3. **Switch Export in `src/services/index.ts`**:
   ```typescript
   const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
   export const shipmentService = useMock ? mockShipmentService : restShipmentService;
   ```
   **Zero changes are required in controllers, views, or business models!**

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js (v18+ or v20+ recommended)
- npm (v9+)

### Installation
```bash
# 1. Clone repository & install dependencies
npm install

# 2. Start local development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔑 Demo Credentials

- **Admin Account**: Username `admin` / Password `admin123` (Full Access)
- **Operations Staff**: Username `ops.tariq` / Password `user123` (Limited Access)

---

## 🧪 Running Automated Tests

Run the complete Vitest test suite:
```bash
npm test
```

For watch mode:
```bash
npm run test:watch
```

---

## 📦 Production Build & Deployment

Build the optimized static assets:
```bash
npm run build
```

This compiles optimized, route-split bundles into `dist/` with self-hosted fonts and hashed asset filenames.

See [DEPLOYMENT.md](file:///e:/Alince%20ERP/DEPLOYMENT.md) for full DigitalOcean Ubuntu Nginx configuration, SSL setup with Certbot, and automated `deploy.sh` script instructions.
