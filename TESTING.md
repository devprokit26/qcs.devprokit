# ALINCE LOGISTICS &mdash; Quality Assurance &amp; Testing Manual

This document provides a comprehensive test plan for verifying all modules, business rules, calculations, and UI workflows in the **ALINCE LOGISTICS** ERP.

---

## 🔑 Demo Credentials

| Role | Username | Password | Access Permissions |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `admin123` | **Full Access** (All pages + User Administration) |
| **Operations Staff** | `ops.tariq` | `user123` | Dashboard, Shipments, Weight Proforma, Alerts |

---

## 🧪 Automated Testing Suite (`npm test`)

The test suite runs using **Vitest** and **React Testing Library**:

```bash
npm test
```

### Automated Test Coverage Summary
- **Balance Models**: Pure tests verifying customer balance ($Opening + Debits - Credits$) and vendor liabilities.
- **Aging Engine**: Tests verifying FIFO credit allocation against opening balance and oldest debits, distributing remainder into Current, 1–30, 31–60, and 60+ days overdue buckets.
- **Credit Limit & Overdue Rules**: Tests verifying warnings when credit limits are exceeded, and blocking new bookings when invoices are past credit days.
- **Weight Proforma Calculations**: Tests verifying dimensional weight formula ($\frac{L \times W \times H}{Divisor}$), chargeable weight ($\max(Actual, Dim)$), and column sum aggregations.
- **Voucher Auto-Incrementation**: Tests verifying unique independent sequential numbering per voucher type (`AE-LOC-INV`, `BRV`, `PINV`, `BPV`, `JVR`).
- **Ledger Posting Rules**: Tests verifying automated double-entry postings upon shipment creation (customer debit + courier vendor liability), walk-in cash sale exemption, and adjustment/reversal postings on shipment edits.
- **Component Tests**: Tests verifying login form authentication, page permission blocking via `ProtectedRoute`, and shipment form walk-in toggle behavior.

---

## 📋 Manual QA Checklist by Module

### 1. Authentication & Session Management
- [ ] Navigate to `/login`. Verify the ALINCE LOGISTICS emblem renders cleanly.
- [ ] Attempt login with invalid credentials &rarr; Verify error message toast displays.
- [ ] Log in with `admin` / `admin123` &rarr; Verify redirection to `/dashboard` and toast notification.
- [ ] Log out and log in with `ops.tariq` / `user123` &rarr; Verify **Reports**, **Ledger**, and **Users** pages are hidden from sidebar.
- [ ] Manually navigate to `/users` as `ops.tariq` &rarr; Verify access restriction guard blocks the view.

### 2. Dashboard Overview (`/dashboard`)
- [ ] Verify stat cards (Today's Shipments, Total Revenue, Total Cost, Net Profit, Net Margin) render values dynamically computed from shipment data.
- [ ] Verify the **Credit Warning Banner** appears at the top displaying customers who have exceeded their credit limits or have overdue invoices past their payment terms.
- [ ] Check Courier Performance bar breakdown &rarr; verify shipments sent across couriers (`FHL Express`, `UPS`, `DHL`, `FedEx`, `DPEX`, `DPD`) and percentages.
- [ ] Inspect 7-day Revenue vs Cost chart &rarr; verify daily bar pairs with hover tooltips.
- [ ] Click **"New Shipment"** quick action &rarr; verify modal opens.

### 3. Shipments (`/shipments`)
- [ ] **Search**: Type `USA` or `FHL` or `GARSON` into search bar &rarr; verify table filters in real time.
- [ ] **Status Filter**: Filter by `Delivered`, `Pending`, `Shipped`, `Returned` &rarr; verify rows match.
- [ ] **Date Range Filter**: Select `Today`, `Last 7 Days`, `Last 30 Days` &rarr; verify range summary chip shows period totals.
- [ ] **Custom Range**: Select `Custom Range...`, enter start and end dates &rarr; verify table updates.
- [ ] **Add Shipment (Account Customer)**: Click `+ Add Shipment`, select customer `ABC Trading Co.`, enter details, and save &rarr; verify toast, table update, and automated debit entry in customer ledger.
- [ ] **Add Shipment (Walk-in Customer)**: Click `+ Add Shipment`, check `Walk-in Customer (Cash Sale)`, enter walk-in name `Haroon (Walk-in)` &rarr; verify no customer ledger entry is created, but revenue is recorded.
- [ ] **Credit Warning & Override**: Try booking a shipment for customer `XYZ Export House` (over limit) &rarr; verify warning banner appears with override checkbox. Verify submission is blocked without checking override.
- [ ] **Inline Status Update**: Change status dropdown in table row &rarr; verify badge updates and toast displays.
- [ ] **Customer Invoice**: Click the printer icon on any row &rarr; verify customer invoice displays. Click **Print** and **Export PDF** &rarr; verify PDF downloads.
- [ ] **Export List to PDF**: Click `Export PDF` in topbar &rarr; verify table is exported as a landscape PDF.

### 4. Weight Proforma (`/weightproforma`)
- [ ] **List**: Verify existing proforma worksheets render with C/N numbers, shipper names, box count, actual weight, and chargeable weight.
- [ ] **New Proforma**: Click `+ New Weight Proforma`.
  - Enter C/N No: `9988112233`
  - Shipper: `FORWARD SPORTS SIALKOT`
  - Add 2 boxes:
    - Box 1: Act Wt = `10.0`, L = `50`, W = `40`, H = `30` (Dim Wt = `12.0`, Ch. Wt = `12.0`)
    - Box 2: Act Wt = `25.0`, L = `30`, W = `20`, H = `15` (Dim Wt = `1.8`, Ch. Wt = `25.0`)
  - Verify Totals row computes `35.00` Actual and `37.00` Chargeable Weight.
  - Save &rarr; verify card appears in list.
- [ ] **Print / PDF Document**: Click `Print / PDF` on the record &rarr; verify official Weight Proforma document appears with metadata and box grid. Click `Export PDF` &rarr; verify PDF downloads.

### 5. Ledger & Khata (`/ledger`)
- [ ] **Customer / Vendor Toggle**: Switch between **Customers** and **Vendors** sub-tabs &rarr; verify cards and headings switch cleanly.
- [ ] **Customer Khata Card**: Verify customer card displays correct current balance, credit limit, terms, and aging status badge.
- [ ] **Receive Payment (CRV/BRV/JVR)**: Click `Payment` on customer card. Select `BRV`, enter amount `20,000`, payment method `Bank Transfer`, ref `ONLINE` &rarr; verify customer balance decreases by 20,000 and aging recalculates.
- [ ] **Add Debit Invoice**: Click `Invoice` on customer card. Select `AE-LOC-INV`, enter amount `15,000` &rarr; verify customer balance increases by 15,000.
- [ ] **General Ledger Statement**: Click `Statement` on customer card &rarr; verify full ASR-style statement with opening balance, voucher numbers, running balance, and Dr/Cr indicators. Test `Export PDF`.
- [ ] **Reminders**: Click the `WhatsApp` icon on a customer with a phone number &rarr; verify WhatsApp Web opens with pre-composed reminder text. Click `Email` icon &rarr; verify `mailto:` link opens.
- [ ] **Vendor Liabilities**: Switch to Vendors tab. Click `Bill` on a vendor (e.g. `FHL Express`) &rarr; enter supplier invoice. Click `Payment` &rarr; record payment voucher (`BPV`/`CPV`).

### 6. Payment Alerts (`/alerts`)
- [ ] Verify nav item displays live red badge count of overdue invoices.
- [ ] Filter alerts by `1–30 Days`, `31–60 Days`, and `60+ Days` &rarr; verify cards match severity colors (amber, orange, red).
- [ ] Click `Record Payment` directly from an alert card &rarr; record payment and verify alert resolves immediately upon payment.

### 7. Reports & Analytics (`/reports`)
- [ ] Verify 7-day revenue vs cost bar chart.
- [ ] Verify shipment status donut chart displays live percentage split.
- [ ] Verify courier-wise table displays count, revenue, cost, profit, margin %, and market share %.
- [ ] Verify destination-wise table shows total weight (KG) and avg revenue per shipment.
- [ ] Verify customer-wise report shows total shipments, paid volume, and outstanding balances.

### 8. User Management (`/users`)
- [ ] Verify protected `Administrator` account cannot be deleted or renamed.
- [ ] Click `+ Add User`, create username `ops.khi`, choose page permissions (e.g. only Shipments & Weight Proforma) &rarr; verify user appears in table.
- [ ] Log out and log in as `ops.khi` &rarr; verify only permitted pages are accessible.

### 9. Demo Data Reset
- [ ] Click the user menu in the top right corner &rarr; click `Reset Demo Data` &rarr; verify confirmation toast and restoration of default seed dataset.
