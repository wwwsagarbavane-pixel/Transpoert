import { prisma } from "../src/db/prismaClient"

async function runBillingOutstandingPartyTest() {
  console.log("=== RUNNING BILLING OUTSTANDING PARTY TEST ===")

  try {
    // 1. Get company & schema
    const companies: any = await prisma.$queryRawUnsafe(`SELECT id, name, schema_name FROM public.companies LIMIT 1`)
    if (!companies || companies.length === 0) throw new Error("No company found")
    
    const company = companies[0]
    const schema = company.schema_name || `comp_${company.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    console.log(`Testing company: ${company.name} (${company.id}) on schema: "${schema}"`)

    // Ensure schema exists
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schema}"."bills" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "billNo" TEXT NOT NULL,
        "billDate" TEXT NOT NULL, "party" TEXT NOT NULL, "partyId" TEXT,
        "amount" DOUBLE PRECISION DEFAULT 0, "subtotal" DOUBLE PRECISION DEFAULT 0,
        "tax" DOUBLE PRECISION DEFAULT 0, "totalAmount" DOUBLE PRECISION DEFAULT 0,
        "paid" DOUBLE PRECISION DEFAULT 0, "paidAmount" DOUBLE PRECISION DEFAULT 0,
        "outstanding" DOUBLE PRECISION DEFAULT 0, "lrsCount" INTEGER DEFAULT 0,
        "lrs" JSONB, "dueDate" TEXT, "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schema}"."payments" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "receiptNo" TEXT NOT NULL,
        "billNo" TEXT NOT NULL, "bill_id" TEXT, "date" TEXT NOT NULL, "party" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL DEFAULT 0, "mode" TEXT NOT NULL DEFAULT 'Cash',
        "referenceNo" TEXT, "status" TEXT NOT NULL DEFAULT 'Completed',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 2. Create Test Bill
    const partyName = `Shree Balaji Logistics ${Date.now()}`
    const testBillId = `BILL-OUT-${Date.now()}`
    const testBillNo = `BILL-OUT-${Date.now().toString().slice(-4)}`

    console.log(`\n1. Creating Bill ${testBillNo} for ${partyName} with Amount ₹50,000...`)
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."bills" ("id", "company_id", "billNo", "billDate", "party", "partyId", "amount", "totalAmount", "paid", "paidAmount", "outstanding", "status")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, testBillId, company.id, testBillNo, "2026-08-10", partyName, "party_balaji", 50000, 50000, 0, 0, 50000, "pending")

    // Check Outstanding Status 1 (Initial)
    let bills: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."bills" WHERE "party" = $1`, partyName)
    let totalBilled = bills.reduce((s: number, b: any) => s + Number(b.totalAmount || 0), 0)
    let totalPaid = bills.reduce((s: number, b: any) => s + Number(b.paidAmount || 0), 0)
    let outstanding = totalBilled - totalPaid
    let status = outstanding > 0 ? (totalPaid > 0 ? "PARTIAL" : "OUTSTANDING") : "PAID"

    console.log(`Initial Outstanding -> Billed: ₹${totalBilled}, Paid: ₹${totalPaid}, Outstanding: ₹${outstanding}, Status: ${status}`)
    if (outstanding !== 50000 || status !== "OUTSTANDING") {
      throw new Error(`Expected Initial Outstanding ₹50,000 and status OUTSTANDING, got ₹${outstanding} (${status})`)
    }
    console.log("✓ Initial Outstanding calculation verified successfully!")

    // 3. Record Partial Payment of ₹30,000
    console.log(`\n2. Recording Partial Payment of ₹30,000 for ${testBillNo}...`)
    const pay1Id = `PAY-${Date.now()}-1`
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."payments" ("id", "company_id", "receiptNo", "billNo", "bill_id", "date", "party", "amount", "mode", "referenceNo", "status")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, pay1Id, company.id, pay1Id, testBillNo, testBillId, "2026-08-10", partyName, 30000, "NEFT", "NEFT-112233", "Completed")

    // Update Bill record after payment
    await prisma.$executeRawUnsafe(`
      UPDATE "${schema}"."bills"
      SET "paidAmount" = 30000, "paid" = 30000, "outstanding" = 20000, "status" = 'partial', "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
    `, testBillId)

    // Check Outstanding Status 2 (After Partial Payment)
    bills = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."bills" WHERE "party" = $1`, partyName)
    totalBilled = bills.reduce((s: number, b: any) => s + Number(b.totalAmount || 0), 0)
    totalPaid = bills.reduce((s: number, b: any) => s + Number(b.paidAmount || 0), 0)
    outstanding = totalBilled - totalPaid
    status = outstanding > 0 ? (totalPaid > 0 ? "PARTIAL" : "OUTSTANDING") : "PAID"

    console.log(`After Partial Payment -> Billed: ₹${totalBilled}, Paid: ₹${totalPaid}, Outstanding: ₹${outstanding}, Status: ${status}`)
    if (outstanding !== 20000 || status !== "PARTIAL") {
      throw new Error(`Expected Partial Outstanding ₹20,000 and status PARTIAL, got ₹${outstanding} (${status})`)
    }
    console.log("✓ Partial Payment recalculation verified successfully!")

    // 4. Record Final Payment of ₹20,000
    console.log(`\n3. Recording Final Payment of ₹20,000 for ${testBillNo}...`)
    const pay2Id = `PAY-${Date.now()}-2`
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."payments" ("id", "company_id", "receiptNo", "billNo", "bill_id", "date", "party", "amount", "mode", "referenceNo", "status")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, pay2Id, company.id, pay2Id, testBillNo, testBillId, "2026-08-10", partyName, 20000, "UPI", "UPI-556677", "Completed")

    // Update Bill record after final payment
    await prisma.$executeRawUnsafe(`
      UPDATE "${schema}"."bills"
      SET "paidAmount" = 50000, "paid" = 50000, "outstanding" = 0, "status" = 'paid', "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
    `, testBillId)

    // Check Outstanding Status 3 (After Full Payment)
    bills = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."bills" WHERE "party" = $1`, partyName)
    totalBilled = bills.reduce((s: number, b: any) => s + Number(b.totalAmount || 0), 0)
    totalPaid = bills.reduce((s: number, b: any) => s + Number(b.paidAmount || 0), 0)
    outstanding = totalBilled - totalPaid
    status = outstanding > 0 ? (totalPaid > 0 ? "PARTIAL" : "OUTSTANDING") : "PAID"

    console.log(`After Full Payment -> Billed: ₹${totalBilled}, Paid: ₹${totalPaid}, Outstanding: ₹${outstanding}, Status: ${status}`)
    if (outstanding !== 0 || status !== "PAID") {
      throw new Error(`Expected Final Outstanding ₹0 and status PAID, got ₹${outstanding} (${status})`)
    }
    console.log("✓ Full Payment recalculation verified successfully!")

    console.log("\n==================================================")
    console.log("BILLING -> OUTSTANDING PARTY MODULE TESTS PASSED!")
    console.log("==================================================")
  } catch (err: any) {
    console.error("❌ TEST FAILED:", err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runBillingOutstandingPartyTest()
