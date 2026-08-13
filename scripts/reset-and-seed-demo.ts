import { Client } from 'pg'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function resetAndSeedDemo() {
  console.log("=== STARTING CONTROLLED DESTRUCTIVE DATABASE RESET & DEMO SEED ===")
  const client = new Client({ connectionString })
  await client.connect()

  try {
    // ----------------------------------------------------
    // 1. DROP ALL OLD COMPANY SCHEMAS
    // ----------------------------------------------------
    console.log("\n1. Dropping old company schemas...")
    const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('public', 'pg_catalog', 'information_schema') 
        AND schema_name NOT LIKE 'pg_%'
    `)

    for (const row of schemasRes.rows) {
      const oldSchema = row.schema_name
      console.log(`   Dropping old schema "${oldSchema}"...`)
      await client.query(`DROP SCHEMA IF EXISTS "${oldSchema}" CASCADE`)
    }

    // ----------------------------------------------------
    // 2. RESET GLOBAL PUBLIC TABLES
    // ----------------------------------------------------
    console.log("\n2. Resetting global public tables...")
    await client.query(`DELETE FROM public.users`)
    await client.query(`DELETE FROM public.companies`)
    await client.query(`DELETE FROM public.audit_logs`)

    // ----------------------------------------------------
    // 3. CREATE EXACTLY 1 DEMO COMPANY
    // ----------------------------------------------------
    const demoCompId = "COMP-DEMO-001"
    const demoCompName = "Demo Transport"
    const demoSchema = "demo_transport"

    console.log(`\n3. Inserting Demo Company "${demoCompName}" into public.companies...`)
    await client.query(`
      INSERT INTO public.companies (id, code, name, schema_name, status, "createdAt", "updatedAt")
      VALUES ($1, 'DEMO', $2, $3, 'active', NOW(), NOW())
    `, [demoCompId, demoCompName, demoSchema])

    // ----------------------------------------------------
    // 4. CREATE SUPER ADMIN & DEMO COMPANY USER
    // ----------------------------------------------------
    console.log("\n4. Inserting Super Admin & Demo Company User into public.users...")
    
    // Super Admin: Admin@gmail.com / Test@123
    await client.query(`
      INSERT INTO public.users (id, company_id, name, email, password, role, "assignedCompanies", status, "createdAt", "updatedAt")
      VALUES ('USR-SUPERADMIN-001', NULL, 'Super Admin', 'Admin@gmail.com', 'Test@123', 'SUPER_ADMIN', '["*"]', 'active', NOW(), NOW())
    `)

    // Demo User: demo@gmail.com / Test@123
    await client.query(`
      INSERT INTO public.users (id, company_id, name, email, password, role, "assignedCompanies", status, "createdAt", "updatedAt")
      VALUES ('USR-DEMOADMIN-001', $1, 'Demo Transport Admin', 'demo@gmail.com', 'Test@123', 'Company Admin', $2, 'active', NOW(), NOW())
    `, [demoCompId, JSON.stringify([demoCompId])])

    // ----------------------------------------------------
    // 5. CREATE DEMO_TRANSPORT SCHEMA & TABLES
    // ----------------------------------------------------
    console.log(`\n5. Creating schema "${demoSchema}" & 12 business tables...`)
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${demoSchema}"`)

    const tables = [
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."branches" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "code" TEXT NOT NULL,
        "name" TEXT NOT NULL, "city" TEXT NOT NULL, "state" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'Branch', "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."parties" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "type" TEXT NOT NULL, "gst" TEXT, "pan" TEXT, "phone" TEXT, "mobile" TEXT, "email" TEXT,
        "contactPerson" TEXT, "creditLimit" TEXT, "billingAddress" TEXT,
        "shippingAddress" TEXT, "paymentTerms" TEXT, "city" TEXT, "state" TEXT, "pincode" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."vehicles" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "number" TEXT NOT NULL,
        "type" TEXT NOT NULL, "capacity" TEXT, "driver" TEXT, "owner" TEXT, "gpsId" TEXT,
        "rc" TEXT, "insurance" TEXT, "fitness" TEXT, "permit" TEXT, "puc" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."drivers" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "mobile" TEXT, "altMobile" TEXT, "license" TEXT, "licenseExpiry" TEXT,
        "aadhaar" TEXT, "address" TEXT, "emergency" TEXT, "vehicle" TEXT, "experience" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."owners" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "pan" TEXT, "phone" TEXT, "contact" TEXT, "mobile" TEXT, "email" TEXT, "gst" TEXT,
        "address" TEXT, "city" TEXT, "type" TEXT, "vehicles" INTEGER DEFAULT 1,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."agents" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "city" TEXT, "state" TEXT, "commission" TEXT, "phone" TEXT, "contact" TEXT,
        "mobile" TEXT, "email" TEXT, "outstanding" DOUBLE PRECISION DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."stations" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "city" TEXT, "state" TEXT, "type" TEXT, "pincode" TEXT, "phone" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."articles" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "packing" TEXT, "hsn" TEXT, "rate" TEXT, "unit" TEXT, "description" TEXT,
        "fragile" BOOLEAN DEFAULT false, "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."lrs" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "lrNo" TEXT NOT NULL,
        "date" TEXT NOT NULL, "bookingBranch" TEXT, "bookingBranchId" TEXT,
        "bookingStation" TEXT, "deliveryStation" TEXT, "consignor" TEXT, "consignee" TEXT,
        "from" TEXT, "to" TEXT, "vehicle" TEXT, "driver" TEXT, "owner" TEXT, "agent" TEXT,
        "article" TEXT, "packages" TEXT, "packageCount" INTEGER, "weight" TEXT,
        "freight" DOUBLE PRECISION DEFAULT 0, "freightType" TEXT, "paymentType" TEXT,
        "hamali" DOUBLE PRECISION DEFAULT 0, "doorDeliveryCharges" DOUBLE PRECISION DEFAULT 0,
        "otherCharges" DOUBLE PRECISION DEFAULT 0, "gst" DOUBLE PRECISION DEFAULT 0,
        "totalAmount" DOUBLE PRECISION DEFAULT 0, "invoice" TEXT,
        "invoiceValue" DOUBLE PRECISION DEFAULT 0, "waybill" TEXT, "ewayBill" TEXT,
        "expectedDelivery" TEXT, "status" TEXT NOT NULL DEFAULT 'Booked', "items" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."deliveries" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "lrNo" TEXT NOT NULL,
        "lr_id" TEXT, "date" TEXT NOT NULL, "deliveredTo" TEXT, "receiverPhone" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Delivered', "remarks" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."bills" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "billNo" TEXT NOT NULL,
        "billDate" TEXT NOT NULL, "party" TEXT NOT NULL, "partyId" TEXT,
        "amount" DOUBLE PRECISION DEFAULT 0, "subtotal" DOUBLE PRECISION DEFAULT 0,
        "tax" DOUBLE PRECISION DEFAULT 0, "totalAmount" DOUBLE PRECISION DEFAULT 0,
        "paid" DOUBLE PRECISION DEFAULT 0, "paidAmount" DOUBLE PRECISION DEFAULT 0,
        "outstanding" DOUBLE PRECISION DEFAULT 0, "lrsCount" INTEGER DEFAULT 0,
        "lrs" JSONB, "dueDate" TEXT, "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS "${demoSchema}"."payments" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "receiptNo" TEXT NOT NULL,
        "billNo" TEXT NOT NULL, "bill_id" TEXT, "date" TEXT NOT NULL, "party" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL DEFAULT 0, "mode" TEXT NOT NULL DEFAULT 'Cash',
        "referenceNo" TEXT, "status" TEXT NOT NULL DEFAULT 'Completed',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ]

    for (const q of tables) {
      await client.query(q)
    }

    // ----------------------------------------------------
    // 6. SEED DEMO BUSINESS DATA INSIDE DEMO_TRANSPORT
    // ----------------------------------------------------
    console.log(`\n6. Seeding clean demo business records inside "${demoSchema}"...`)

    // Branch
    await client.query(`
      INSERT INTO "${demoSchema}"."branches" ("id", "company_id", "code", "name", "city", "state", "type", "status")
      VALUES ('BR-DEMO-001', $1, 'MUM', 'Demo Headquarters', 'Mumbai', 'Maharashtra', 'Head Office', 'active')
    `, [demoCompId])

    // Parties
    await client.query(`
      INSERT INTO "${demoSchema}"."parties" ("id", "company_id", "name", "type", "gst", "city", "state", "creditLimit", "status")
      VALUES 
      ('PRT-DEMO-001', $1, 'Demo Consignor Pvt Ltd', 'Consignor', '27DEMO1234A1Z1', 'Mumbai', 'Maharashtra', '500000', 'active'),
      ('PRT-DEMO-002', $1, 'Demo Consignee Steel Ltd', 'Consignee', '27DEMO9999B1Z5', 'Pune', 'Maharashtra', '1000000', 'active')
    `, [demoCompId])

    // Vehicles
    await client.query(`
      INSERT INTO "${demoSchema}"."vehicles" ("id", "company_id", "number", "type", "capacity", "status")
      VALUES ('VEH-DEMO-001', $1, 'MH-12-DM-1001', '10-Wheeler Truck', '16 Tons', 'active')
    `, [demoCompId])

    // Drivers
    await client.query(`
      INSERT INTO "${demoSchema}"."drivers" ("id", "company_id", "name", "mobile", "license", "status")
      VALUES ('DRV-DEMO-001', $1, 'Demo Driver Ramesh', '9876543210', 'MH-1220220012345', 'active')
    `, [demoCompId])

    // Owners
    await client.query(`
      INSERT INTO "${demoSchema}"."owners" ("id", "company_id", "name", "mobile", "city", "status")
      VALUES ('OWN-DEMO-001', $1, 'Demo Fleet Owner', '9820011223', 'Mumbai', 'active')
    `, [demoCompId])

    // Agents
    await client.query(`
      INSERT INTO "${demoSchema}"."agents" ("id", "company_id", "name", "city", "commission", "status")
      VALUES ('AGT-DEMO-001', $1, 'Demo Cargo Agent', 'Mumbai', '2.5', 'active')
    `, [demoCompId])

    // Stations
    await client.query(`
      INSERT INTO "${demoSchema}"."stations" ("id", "company_id", "name", "city", "state", "status")
      VALUES 
      ('STN-DEMO-001', $1, 'Mumbai Hub', 'Mumbai', 'Maharashtra', 'active'),
      ('STN-DEMO-002', $1, 'Pune Hub', 'Pune', 'Maharashtra', 'active')
    `, [demoCompId])

    // Articles
    await client.query(`
      INSERT INTO "${demoSchema}"."articles" ("id", "company_id", "name", "unit", "description", "status")
      VALUES 
      ('ART-DEMO-001', $1, 'Demo Steel Rods', 'Tons', 'Industrial TMT Bars', 'active'),
      ('ART-DEMO-002', $1, 'Demo Machinery Parts', 'Units', 'CNC Spare Parts', 'active')
    `, [demoCompId])

    // LRs
    await client.query(`
      INSERT INTO "${demoSchema}"."lrs" ("id", "company_id", "lrNo", "date", "bookingBranch", "consignor", "consignee", "from", "to", "freight", "totalAmount", "status")
      VALUES ('LR-DEMO-001', $1, 'DEMO-LR-001', '2026-08-10', 'Demo Headquarters', 'Demo Consignor Pvt Ltd', 'Demo Consignee Steel Ltd', 'Mumbai', 'Pune', 15000, 16500, 'Booked')
    `, [demoCompId])

    // Deliveries
    await client.query(`
      INSERT INTO "${demoSchema}"."deliveries" ("id", "company_id", "lrNo", "lr_id", "date", "deliveredTo", "status")
      VALUES ('DEL-DEMO-001', $1, 'DEMO-LR-001', 'LR-DEMO-001', '2026-08-10', 'Demo Consignee Manager', 'Delivered')
    `, [demoCompId])

    // Bills
    await client.query(`
      INSERT INTO "${demoSchema}"."bills" ("id", "company_id", "billNo", "billDate", "party", "amount", "totalAmount", "status")
      VALUES ('BIL-DEMO-001', $1, 'DEMO-INV-001', '2026-08-10', 'Demo Consignor Pvt Ltd', 15000, 16500, 'pending')
    `, [demoCompId])

    // Payments
    await client.query(`
      INSERT INTO "${demoSchema}"."payments" ("id", "company_id", "receiptNo", "billNo", "date", "party", "amount", "mode", "status")
      VALUES ('PAY-DEMO-001', $1, 'DEMO-REC-001', 'DEMO-INV-001', '2026-08-10', 'Demo Consignor Pvt Ltd', 5000, 'Cash', 'Completed')
    `, [demoCompId])

    // ----------------------------------------------------
    // 7. SYNC LOCAL DATA/DB.JSON SEED BACKUP
    // ----------------------------------------------------
    console.log("\n7. Updating data/db.json to clean demo state...")
    const cleanDbJson = {
      companies: [{ id: demoCompId, code: "DEMO", name: demoCompName, schema_name: demoSchema, status: "active" }],
      users: [
        { id: "USR-SUPERADMIN-001", name: "Super Admin", email: "Admin@gmail.com", role: "SUPER_ADMIN", status: "active" },
        { id: "USR-DEMOADMIN-001", company_id: demoCompId, name: "Demo Transport Admin", email: "demo@gmail.com", role: "Company Admin", status: "active" }
      ]
    }
    fs.writeFileSync(path.resolve(process.cwd(), "data/db.json"), JSON.stringify(cleanDbJson, null, 2))

    console.log("\n==================================================")
    console.log("CONTROLLED DATABASE RESET & DEMO SEED COMPLETED!")
    console.log("==================================================\n")

  } catch (err) {
    console.error("Reset and seed error:", err)
  } finally {
    await client.end()
  }
}

resetAndSeedDemo()
