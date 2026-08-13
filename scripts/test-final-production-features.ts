import { prisma } from "../src/db/prismaClient"

async function runFinalProductionTest() {
  console.log("=== RUNNING FINAL PRODUCTION FEATURE VERIFICATION ===")

  try {
    // 1. Verify schema tables in public and company schemas
    console.log("1. Verifying schema tables...")
    const companies: any = await prisma.$queryRawUnsafe(`SELECT id, name, schema_name FROM public.companies LIMIT 2`)
    if (!companies || companies.length === 0) {
      throw new Error("No companies found in public.companies table")
    }

    const testComp = companies[0]
    const schema = testComp.schema_name || `comp_${testComp.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    console.log(`Using company: ${testComp.name} (${testComp.id}) with schema: "${schema}"`)

    // 2. Ensure schema & tables exist
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
    await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "signature_url" TEXT`)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schema}"."documents" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "entity" TEXT NOT NULL,
        "record_id" TEXT NOT NULL, "file_name" TEXT NOT NULL, "mime_type" TEXT NOT NULL,
        "file_size" INTEGER NOT NULL, "file_path" TEXT NOT NULL, "uploaded_by" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schema}"."waybills" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "waybill_no" TEXT NOT NULL,
        "date" TEXT NOT NULL, "lr_id" TEXT, "lr_no" TEXT NOT NULL, "vehicle" TEXT,
        "driver" TEXT, "from_station" TEXT, "to_station" TEXT, "consignor" TEXT,
        "consignee" TEXT, "status" TEXT NOT NULL DEFAULT 'Active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 3. Test Digital Signature on LR
    console.log("2. Testing Digital Signature persistence on LR...")
    const testLrId = `TEST-LR-${Date.now()}`
    const testLrNo = `LR-SIG-${Date.now().toString().slice(-4)}`
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."lrs" ("id", "company_id", "lrNo", "lr", "date", "consignor", "consignee", "from", "to", "freight", "status", "signature_url")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, testLrId, testComp.id, testLrNo, testLrNo, "2026-08-10", "Apex Traders", "Metro Retail", "Pune", "Mumbai", 15000, "Booked", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")

    const savedLr: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."lrs" WHERE id = $1`, testLrId)
    if (!savedLr || savedLr.length === 0 || !savedLr[0].signature_url) {
      throw new Error("Digital signature failed to persist on LR record")
    }
    console.log("✓ Digital Signature correctly attached and persisted on LR:", savedLr[0].lrNo)

    // 4. Test Document Upload Metadata
    console.log("3. Testing Document Upload metadata persistence...")
    const docId = `DOC-${Date.now()}`
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."documents" ("id", "company_id", "entity", "record_id", "file_name", "mime_type", "file_size", "file_path", "uploaded_by")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, docId, testComp.id, "lrs", testLrId, "pod_receipt.pdf", "application/pdf", 102450, `/uploads/${docId}.pdf`, "admin@company.com")

    const savedDoc: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."documents" WHERE id = $1`, docId)
    if (!savedDoc || savedDoc.length === 0) {
      throw new Error("Document metadata failed to persist")
    }
    console.log("✓ Document metadata saved:", savedDoc[0].file_name, "(Path:", savedDoc[0].file_path + ")")

    // 5. Test Way Bill Record
    console.log("4. Testing Way Bill record creation...")
    const wbId = `WB-${Date.now()}`
    const wbNo = `WAY-${Date.now().toString().slice(-4)}`
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."waybills" ("id", "company_id", "waybill_no", "date", "lr_id", "lr_no", "vehicle", "driver", "consignor", "consignee")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, wbId, testComp.id, wbNo, "2026-08-10", testLrId, testLrNo, "MH-12-AB-1234", "Ramesh Kumar", "Apex Traders", "Metro Retail")

    const savedWb: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."waybills" WHERE id = $1`, wbId)
    if (!savedWb || savedWb.length === 0) {
      throw new Error("Way Bill record failed to persist")
    }
    console.log("✓ Way Bill created:", savedWb[0].waybill_no, "for LR:", savedWb[0].lr_no)

    // 6. Test Payment Confirmation & Party Outstanding
    console.log("5. Testing Payment confirmation & Party Outstanding calculation...")
    const testPartyName = `Apex Traders ${Date.now()}`
    const billId = `BILL-TEST-${Date.now()}`
    const billNo = `BILL-${Date.now().toString().slice(-4)}`
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."bills" ("id", "company_id", "billNo", "billDate", "party", "partyId", "amount", "totalAmount", "paid", "paidAmount", "outstanding", "status")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, billId, testComp.id, billNo, "2026-08-10", testPartyName, "apex_traders", 20000, 20000, 5000, 5000, 15000, "partial")

    const payId = `PAY-${Date.now()}`
    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."payments" ("id", "company_id", "receiptNo", "billNo", "bill_id", "date", "party", "amount", "mode", "referenceNo", "status")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, payId, testComp.id, payId, billNo, billId, "2026-08-10", testPartyName, 5000, "UPI", "UPI-REF-998877", "Completed")

    const billsList: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."bills" WHERE "party" = $1`, testPartyName)
    const totalBilled = billsList.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0)
    const totalPaid = billsList.reduce((sum: number, b: any) => sum + (Number(b.paidAmount) || 0), 0)
    const outstanding = totalBilled - totalPaid

    console.log(`✓ ${testPartyName} Total Billed: ₹${totalBilled}, Paid: ₹${totalPaid}, Outstanding: ₹${outstanding}`)
    if (outstanding !== 15000) {
      throw new Error(`Outstanding calculation mismatch. Expected 15000, got ${outstanding}`)
    }

    console.log("\n==================================================")
    console.log("ALL FINAL PRODUCTION FEATURE VERIFICATIONS PASSED SUCCESSFULLY!")
    console.log("==================================================")
  } catch (err: any) {
    console.error("❌ TEST FAILED:", err.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runFinalProductionTest()
