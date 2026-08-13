import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos?schema=public" })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log("=== MIGRATING BILLS & PAYMENTS COLUMNS IN POSTGRESQL (NON-DESTRUCTIVE) ===")

  // 1. Create Payments table
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."payments" (
        "id" text PRIMARY KEY,
        "company_id" text NOT NULL,
        "receiptNo" text NOT NULL,
        "paymentNo" text,
        "billNo" text NOT NULL,
        "bill_id" text,
        "date" text NOT NULL,
        "paymentDate" text,
        "party" text NOT NULL,
        "partyName" text,
        "amount" numeric NOT NULL DEFAULT 0,
        "mode" text NOT NULL DEFAULT 'Cash',
        "paymentMode" text,
        "referenceNo" text,
        "status" text NOT NULL DEFAULT 'Completed',
        "remarks" text,
        "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log("Payments table ready ✅")
  } catch (err: any) {
    console.log("Error creating payments table:", err.message)
  }

  // 2. Add extended columns to public.bills safely
  const billCols = [
    `ADD COLUMN IF NOT EXISTS "billNo" text`,
    `ADD COLUMN IF NOT EXISTS "party" text`,
    `ADD COLUMN IF NOT EXISTS "totalAmount" numeric DEFAULT 0`,
    `ADD COLUMN IF NOT EXISTS "paid" numeric DEFAULT 0`,
    `ADD COLUMN IF NOT EXISTS "outstanding" numeric DEFAULT 0`,
    `ADD COLUMN IF NOT EXISTS "subtotal" numeric DEFAULT 0`,
    `ADD COLUMN IF NOT EXISTS "tax" numeric DEFAULT 0`,
    `ADD COLUMN IF NOT EXISTS "lrsCount" integer DEFAULT 0`,
    `ADD COLUMN IF NOT EXISTS "lrs" text`
  ]

  for (const colSql of billCols) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "public"."bills" ${colSql};`)
    } catch (err: any) {
      console.log(`Error adding column (${colSql}):`, err.message)
    }
  }
  console.log("Bills table columns upgraded ✅")

  // 3. Test Inserting a Bill
  try {
    const res: any = await prisma.$executeRawUnsafe(`
      INSERT INTO "public"."bills" 
      ("id", "company_id", "billNo", "billNumber", "billDate", "dueDate", "party", "partyName", "amount", "totalAmount", "paid", "paidAmount", "outstanding", "status")
      VALUES ('TEST-BILL-100', 'COMP-483231', 'BILL-100', 'BILL-100', '12 Aug 2026', '30 Days', 'Farmer Corp', 'Farmer Corp', 5000, 5000, 0, 0, 5000, 'Pending'::"BillStatus")
    `)
    console.log("Test Bill Insert SUCCESS ✅:", res)
  } catch (err: any) {
    console.log("Test Bill Insert ERROR:", err.message)
  }

  // 4. Test Inserting a Payment
  try {
    const res: any = await prisma.$executeRawUnsafe(`
      INSERT INTO "public"."payments"
      ("id", "company_id", "receiptNo", "paymentNo", "billNo", "date", "paymentDate", "party", "partyName", "amount", "mode", "paymentMode", "referenceNo", "status", "remarks")
      VALUES ('PAY-TEST-1', 'COMP-483231', 'PAY-100', 'PAY-100', 'BILL-100', '2026-08-12', '2026-08-12', 'Farmer Corp', 'Farmer Corp', 2500, 'NEFT', 'NEFT', 'REF123456', 'Completed', 'Partial payment test')
    `)
    console.log("Test Payment Insert SUCCESS ✅:", res)
  } catch (err: any) {
    console.log("Test Payment Insert ERROR:", err.message)
  }

  await prisma.$disconnect()
  await pool.end()
}

main().catch(console.error)
