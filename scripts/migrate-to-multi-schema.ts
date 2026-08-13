import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function executeMultiSchemaMigration() {
  console.log("=== STARTING COMPANY-WISE MULTI-SCHEMA MIGRATION ===")
  const client = new Client({ connectionString })
  await client.connect()

  try {
    // 1. Fetch companies
    const compRes = await client.query("SELECT id, name FROM public.companies")
    const companies = compRes.rows
    console.log(`Found ${companies.length} registered companies in public.companies`)

    const businessTables = [
      'branches', 'parties', 'vehicles', 'drivers', 'owners',
      'agents', 'stations', 'articles', 'lrs', 'deliveries', 'bills', 'payments'
    ]

    const getCompanySchemaName = (compId: string) => {
      const clean = compId.toLowerCase().replace(/[^a-z0-9]/g, '_')
      return clean.startsWith('comp_') ? clean : `comp_${clean}`
    }

    for (const comp of companies) {
      const schemaName = getCompanySchemaName(comp.id)
      console.log(`\nSetting up schema [${schemaName}] for ${comp.name} (${comp.id})...`)

      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)

      // Create business tables inside schemaName
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."branches" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "code" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "city" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'Branch',
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "${schemaName}"."parties" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "gst" TEXT,
          "pan" TEXT,
          "phone" TEXT,
          "mobile" TEXT,
          "email" TEXT,
          "contactPerson" TEXT,
          "creditLimit" TEXT,
          "billingAddress" TEXT,
          "shippingAddress" TEXT,
          "paymentTerms" TEXT,
          "city" TEXT,
          "state" TEXT,
          "pincode" TEXT,
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "${schemaName}"."vehicles" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "number" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "capacity" TEXT,
          "driver" TEXT,
          "owner" TEXT,
          "gpsId" TEXT,
          "rc" TEXT,
          "insurance" TEXT,
          "fitness" TEXT,
          "permit" TEXT,
          "puc" TEXT,
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "${schemaName}"."drivers" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "mobile" TEXT,
          "altMobile" TEXT,
          "license" TEXT,
          "licenseExpiry" TEXT,
          "aadhaar" TEXT,
          "address" TEXT,
          "emergency" TEXT,
          "vehicle" TEXT,
          "experience" TEXT,
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "${schemaName}"."owners" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "pan" TEXT,
          "phone" TEXT,
          "contact" TEXT,
          "mobile" TEXT,
          "email" TEXT,
          "gst" TEXT,
          "address" TEXT,
          "type" TEXT,
          "vehicles" INTEGER DEFAULT 1,
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "${schemaName}"."agents" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "city" TEXT,
          "state" TEXT,
          "commission" TEXT,
          "phone" TEXT,
          "contact" TEXT,
          "mobile" TEXT,
          "email" TEXT,
          "outstanding" DOUBLE PRECISION DEFAULT 0,
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "${schemaName}"."stations" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "city" TEXT,
          "state" TEXT,
          "type" TEXT,
          "pincode" TEXT,
          "phone" TEXT,
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "${schemaName}"."articles" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "packing" TEXT,
          "hsn" TEXT,
          "rate" TEXT,
          "unit" TEXT,
          "description" TEXT,
          "fragile" BOOLEAN DEFAULT false,
          "status" TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "${schemaName}"."lrs" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "lrNo" TEXT NOT NULL,
          "date" TEXT NOT NULL,
          "bookingBranch" TEXT,
          "bookingBranchId" TEXT,
          "bookingStation" TEXT,
          "deliveryStation" TEXT,
          "consignor" TEXT,
          "consignee" TEXT,
          "from" TEXT,
          "to" TEXT,
          "vehicle" TEXT,
          "driver" TEXT,
          "owner" TEXT,
          "agent" TEXT,
          "article" TEXT,
          "packages" TEXT,
          "packageCount" INTEGER,
          "weight" TEXT,
          "freight" DOUBLE PRECISION DEFAULT 0,
          "freightType" TEXT,
          "paymentType" TEXT,
          "hamali" DOUBLE PRECISION DEFAULT 0,
          "doorDeliveryCharges" DOUBLE PRECISION DEFAULT 0,
          "otherCharges" DOUBLE PRECISION DEFAULT 0,
          "gst" DOUBLE PRECISION DEFAULT 0,
          "totalAmount" DOUBLE PRECISION DEFAULT 0,
          "invoice" TEXT,
          "invoiceValue" DOUBLE PRECISION DEFAULT 0,
          "waybill" TEXT,
          "ewayBill" TEXT,
          "expectedDelivery" TEXT,
          "status" TEXT NOT NULL DEFAULT 'Booked',
          "items" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "${schemaName}"."deliveries" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "lrNo" TEXT NOT NULL,
          "lr_id" TEXT,
          "date" TEXT NOT NULL,
          "deliveredTo" TEXT,
          "receiverPhone" TEXT,
          "status" TEXT NOT NULL DEFAULT 'Delivered',
          "remarks" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "${schemaName}"."bills" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "billNo" TEXT NOT NULL,
          "billDate" TEXT NOT NULL,
          "party" TEXT NOT NULL,
          "partyId" TEXT,
          "amount" DOUBLE PRECISION DEFAULT 0,
          "subtotal" DOUBLE PRECISION DEFAULT 0,
          "tax" DOUBLE PRECISION DEFAULT 0,
          "totalAmount" DOUBLE PRECISION DEFAULT 0,
          "paid" DOUBLE PRECISION DEFAULT 0,
          "paidAmount" DOUBLE PRECISION DEFAULT 0,
          "outstanding" DOUBLE PRECISION DEFAULT 0,
          "lrsCount" INTEGER DEFAULT 0,
          "lrs" JSONB,
          "dueDate" TEXT,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "${schemaName}"."payments" (
          "id" TEXT PRIMARY KEY,
          "company_id" TEXT NOT NULL,
          "receiptNo" TEXT NOT NULL,
          "billNo" TEXT NOT NULL,
          "bill_id" TEXT,
          "date" TEXT NOT NULL,
          "party" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "mode" TEXT NOT NULL DEFAULT 'Cash',
          "referenceNo" TEXT,
          "status" TEXT NOT NULL DEFAULT 'Completed',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `)

      // Migrate existing records for this company into schemaName
      for (const tbl of businessTables) {
        await client.query(`
          INSERT INTO "${schemaName}"."${tbl}"
          SELECT * FROM public."${tbl}"
          WHERE company_id = $1
          ON CONFLICT (id) DO NOTHING
        `, [comp.id])
      }

      console.log(`✅ Schema [${schemaName}] populated successfully.`)
    }

    console.log("\n==================================================")
    console.log("COMPANY-WISE MULTI-SCHEMA MIGRATION COMPLETED")
    console.log("==================================================\n")

  } catch (err) {
    console.error("Migration error:", err)
  } finally {
    await client.end()
  }
}

executeMultiSchemaMigration()
