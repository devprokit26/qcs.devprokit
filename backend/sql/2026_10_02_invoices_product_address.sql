-- =============================================================================
-- Alince ERP — migration 2026-10-02
--   1. shipments.product_name          (new column)
--   2. shipments.destination_address   (new column)
--   3. invoices                        (new table, 1 invoice per shipment)
--   4. Backfill: create an invoice for every EXISTING shipment
--
-- Safe to run more than once (IF NOT EXISTS / ON CONFLICT everywhere).
-- Run it with:
--   psql "postgresql://USER:PASSWORD@HOST:5432/alince_erp" -f backend/sql/2026_10_02_invoices_product_address.sql
-- =============================================================================

BEGIN;

-- 1 + 2. New shipment columns -------------------------------------------------
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "product_name"        TEXT;
ALTER TABLE "shipments" ADD COLUMN IF NOT EXISTS "destination_address" TEXT;

-- 3. Invoices table ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "invoices" (
    "id"                  SERIAL          NOT NULL,
    "invoice_no"          TEXT            NOT NULL,
    "shipment_id"         INTEGER,
    "customer_id"         INTEGER,
    "customer_name"       TEXT            NOT NULL,
    "is_walk_in"          BOOLEAN         NOT NULL DEFAULT false,
    "date"                TEXT            NOT NULL,
    "awb"                 TEXT            NOT NULL,
    "job_no"              TEXT,
    "courier"             TEXT            NOT NULL DEFAULT '',
    "service"             TEXT            NOT NULL DEFAULT '',
    "product_name"        TEXT,
    "origin"              TEXT            NOT NULL DEFAULT '',
    "destination"         TEXT            NOT NULL DEFAULT '',
    "destination_address" TEXT,
    "pieces"              INTEGER         NOT NULL DEFAULT 1,
    "weight"              DECIMAL(10,3)   NOT NULL DEFAULT 0,
    "amount"              DECIMAL(14,2)   NOT NULL DEFAULT 0,
    "status"              TEXT            NOT NULL DEFAULT 'Issued',
    "notes"               TEXT,
    "created_at"          TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "invoices_shipment_id_key" ON "invoices"("shipment_id");
CREATE INDEX        IF NOT EXISTS "invoices_date_idx"        ON "invoices"("date");
CREATE INDEX        IF NOT EXISTS "invoices_customer_id_idx" ON "invoices"("customer_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_shipment_id_fkey') THEN
    ALTER TABLE "invoices"
      ADD CONSTRAINT "invoices_shipment_id_fkey" FOREIGN KEY ("shipment_id")
      REFERENCES "shipments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_customer_id_fkey') THEN
    ALTER TABLE "invoices"
      ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id")
      REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 4. Backfill invoices for shipments that were created before this update ------
INSERT INTO "invoices" (
    "invoice_no", "shipment_id", "customer_id", "customer_name", "is_walk_in",
    "date", "awb", "job_no", "courier", "service", "product_name",
    "origin", "destination", "destination_address", "pieces", "weight",
    "amount", "status", "notes", "created_at", "updated_at"
)
SELECT
    COALESCE(NULLIF(s."ship_inv", ''), 'INV-' || s."id"),
    s."id",
    CASE WHEN s."is_walk_in" THEN NULL ELSE s."customer_id" END,
    CASE WHEN s."is_walk_in" THEN COALESCE(NULLIF(s."walk_in_name", ''), s."customer_name", 'Walk-in Customer')
         ELSE s."customer_name" END,
    s."is_walk_in",
    s."date", s."awb", s."job_no", s."courier", s."service", s."product_name",
    s."origin", s."destination", s."destination_address", s."pieces", s."weight",
    s."revenue", 'Issued', s."notes", s."created_at", CURRENT_TIMESTAMP
FROM "shipments" s
ON CONFLICT ("shipment_id") DO NOTHING;

COMMIT;

-- Quick check (optional):
--   SELECT COUNT(*) AS shipments FROM shipments;
--   SELECT COUNT(*) AS invoices  FROM invoices;
