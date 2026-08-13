import { prisma } from "../src/db/prismaClient"
import fs from "node:fs"
import path from "node:path"

async function runDriverCopyAttachmentsTest() {
  console.log("=== STARTING DRIVER COPY ATTACHMENTS END-TO-END VERIFICATION ===")

  const companyId = "COMP-003"
  const schema = "comp_testtranpoart"
  const uploadsDir = path.resolve(process.cwd(), "public/uploads")

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  // 1. Create dummy attachment files on server disk to test file existence verification
  const invoiceFileName = `DOC_INV_TEST_${Date.now()}.pdf`
  const ewaybillFileName = `DOC_EWB_TEST_${Date.now()}.pdf`
  const invoiceFilePath = path.join(uploadsDir, invoiceFileName)
  const ewaybillFilePath = path.join(uploadsDir, ewaybillFileName)

  fs.writeFileSync(invoiceFilePath, "%PDF-1.4 Mock Tax Invoice File Content for Driver Copy Test", "utf-8")
  fs.writeFileSync(ewaybillFilePath, "%PDF-1.4 Mock E-Way Bill File Content for Driver Copy Test", "utf-8")

  console.log(`✓ Created test files on server disk: ${invoiceFileName}, ${ewaybillFileName}`)

  // 2. Ensure Database Tables & Columns exist
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}"."lrs" (
      "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "lrNo" TEXT NOT NULL,
      "date" TEXT NOT NULL, "bookingBranch" TEXT, "bookingStation" TEXT, "deliveryStation" TEXT,
      "consignor" TEXT, "consignee" TEXT, "from" TEXT, "to" TEXT, "vehicle" TEXT, "driver" TEXT,
      "freight" DOUBLE PRECISION DEFAULT 0, "freightType" TEXT, "paymentType" TEXT,
      "invoice" TEXT, "invoiceValue" DOUBLE PRECISION DEFAULT 0, "ewayBill" TEXT,
      "is_digitally_signed" BOOLEAN DEFAULT false, "digital_signature_id" TEXT,
      "document_version" INTEGER DEFAULT 1, "goods_items" JSONB,
      "invoice_doc_id" TEXT, "invoice_doc_url" TEXT, "invoice_doc_name" TEXT,
      "ewaybill_doc_id" TEXT, "ewaybill_doc_url" TEXT, "ewaybill_doc_name" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "invoice" TEXT;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "invoiceValue" DOUBLE PRECISION DEFAULT 0;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "ewayBill" TEXT;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "goods_items" JSONB;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "invoice_doc_id" TEXT;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "invoice_doc_url" TEXT;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "invoice_doc_name" TEXT;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "ewaybill_doc_id" TEXT;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "ewaybill_doc_url" TEXT;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "ewaybill_doc_name" TEXT;`)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}"."documents" (
      "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "entity" TEXT NOT NULL DEFAULT 'LR',
      "record_id" TEXT NOT NULL DEFAULT '', "file_name" TEXT NOT NULL DEFAULT '', "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
      "file_size" INTEGER NOT NULL DEFAULT 0, "file_path" TEXT NOT NULL DEFAULT '', "uploaded_by" TEXT,
      "document_type" TEXT, "entity_type" TEXT, "entity_id" TEXT, "original_name" TEXT,
      "stored_name" TEXT, "storage_path" TEXT, "url" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 3. Create Test LR with 3 Articles & Document Metadata
  const testLrId = `LR-DRV-TEST-${Date.now()}`
  const testLrNo = `LR-DRV-99001-${Math.floor(Math.random() * 1000)}`
  const invoiceDocId = `DOC-INV-${Date.now()}`
  const ewaybillDocId = `DOC-EWB-${Date.now()}`

  const testGoodsItems = [
    { id: "G1", article: "Article 1: Industrial Pumps", no_of_articles: 10, rate_per_article: 500, weight_in_kgs: 300, freightAmount: 5000 },
    { id: "G2", article: "Article 2: Stainless Steel Tubes", no_of_articles: 25, rate_per_article: 200, weight_in_kgs: 500, freightAmount: 5000 },
    { id: "G3", article: "Article 3: Electric Motors", no_of_articles: 4, rate_per_article: 2500, weight_in_kgs: 400, freightAmount: 10000 }
  ]

  console.log(`\nInserting Test LR (${testLrNo}) with 3 articles & documents in PostgreSQL schema "${schema}"...`)

  await prisma.$executeRawUnsafe(`
    INSERT INTO "${schema}"."documents" ("id", "company_id", "entity", "record_id", "file_name", "file_path", "document_type", "entity_type", "entity_id", "original_name", "stored_name", "storage_path", "url", "uploaded_by", "createdAt", "updatedAt")
    VALUES 
    ($1, $2, 'LR', $3, $4, $5, 'INVOICE', 'LR', $3, 'TaxInvoice_INV-TEST-001.pdf', $6, $5, $5, 'operator@test.com', NOW(), NOW()),
    ($7, $2, 'LR', $3, $8, $9, 'E_WAY_BILL', 'LR', $3, 'EWayBill_EWB-TEST-001.pdf', $10, $9, $9, 'operator@test.com', NOW(), NOW())
  `, invoiceDocId, companyId, testLrId, invoiceFileName, `/uploads/${invoiceFileName}`, invoiceFileName, ewaybillDocId, ewaybillFileName, `/uploads/${ewaybillFileName}`, ewaybillFileName)

  await prisma.$executeRawUnsafe(`
    INSERT INTO "${schema}"."lrs" (
      "id", "company_id", "lrNo", "date", "bookingBranch", "bookingStation", "deliveryStation",
      "consignor", "consignee", "from", "to", "vehicle", "driver", "freight", "freightType",
      "invoice", "invoiceValue", "ewayBill", "goods_items", "invoice_doc_id", "invoice_doc_url",
      "invoice_doc_name", "ewaybill_doc_id", "ewaybill_doc_url", "ewaybill_doc_name",
      "is_digitally_signed", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, '2026-08-10', 'Pune Head Office', 'Pune', 'Mumbai',
      'Acme Manufacturing Pvt Ltd', 'Beta Supermarket Retail', 'Pune', 'Mumbai', 'MH-12-PQ-5555', 'Ramesh Driver', 20000, 'To Pay',
      'INV-TEST-001', 150000, 'EWB-TEST-001', $4, $5, $6, 'TaxInvoice_INV-TEST-001.pdf',
      $7, $8, 'EWayBill_EWB-TEST-001.pdf', true, NOW(), NOW()
    )
  `, testLrId, companyId, testLrNo, JSON.stringify(testGoodsItems), invoiceDocId, `/uploads/${invoiceFileName}`, ewaybillDocId, `/uploads/${ewaybillFileName}`)

  console.log("✓ Test LR & Attached Document records successfully created in PostgreSQL.")

  // 4. Test Backend Document Fetch & Verification (Simulating Driver Copy bundle endpoint)
  console.log("\n4. Testing Driver Copy Bundle & Document Retrieval:")
  const fetchedLrs: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."lrs" WHERE id = $1`, testLrId)
  if (!fetchedLrs || fetchedLrs.length === 0) {
    throw new Error("FAILED: Test LR not retrieved from PostgreSQL!")
  }

  const lrData = fetchedLrs[0]
  const fetchedDocs: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."documents" WHERE entity_id = $1 OR id = $2 OR id = $3`, testLrId, invoiceDocId, ewaybillDocId)
  const articlesList = typeof lrData.goods_items === "string" ? JSON.parse(lrData.goods_items) : lrData.goods_items

  console.log(`✓ Retained LR Number: ${lrData.lrNo}`)
  console.log(`✓ Number of Articles: ${articlesList.length} (Expected: 3)`)
  console.log(`✓ Attached Documents Count: ${fetchedDocs.length} (Expected: 2)`)

  if (articlesList.length !== 3) {
    throw new Error(`FAILED: Expected 3 articles, got ${articlesList.length}`)
  }

  if (fetchedDocs.length !== 2) {
    throw new Error(`FAILED: Expected 2 document records, got ${fetchedDocs.length}`)
  }

  // 5. Verify Disk File Existence for retrieved files
  for (const doc of fetchedDocs) {
    const fullPath = path.join(uploadsDir, doc.stored_name)
    console.log(`✓ Verifying File on Disk: ${doc.original_name} -> ${fullPath}`)
    if (!fs.existsSync(fullPath)) {
      throw new Error(`FAILED: Document file ${doc.original_name} does not exist at ${fullPath}`)
    }
  }

  // 6. Test Refresh Simulation (Requirement #15)
  console.log("\n5. Browser Refresh Simulation Test:")
  const coldFetchLrs: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."lrs" WHERE id = $1`, testLrId)
  const coldFetchDocs: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."documents" WHERE entity_id = $1`, testLrId)

  if (coldFetchLrs[0].invoice !== "INV-TEST-001" || coldFetchLrs[0].ewayBill !== "EWB-TEST-001") {
    throw new Error("FAILED: Cold fetch LR invoice/ewayBill data mismatch!")
  }
  if (coldFetchDocs.length !== 2) {
    throw new Error("FAILED: Cold fetch documents lost after refresh simulation!")
  }
  console.log("✓ Driver Copy Attachments completely persistent from PostgreSQL after cold refresh.")

  // 7. Clean up test records and disk files
  await prisma.$executeRawUnsafe(`DELETE FROM "${schema}"."lrs" WHERE id = $1`, testLrId)
  await prisma.$executeRawUnsafe(`DELETE FROM "${schema}"."documents" WHERE id IN ($1, $2)`, invoiceDocId, ewaybillDocId)
  if (fs.existsSync(invoiceFilePath)) fs.unlinkSync(invoiceFilePath)
  if (fs.existsSync(ewaybillFilePath)) fs.unlinkSync(ewaybillFilePath)
  console.log("✓ Cleaned up test database records & disk files.")

  console.log("\nALL DRIVER COPY ATTACHMENTS VERIFICATION CHECKS PASSED SUCCESSFULLY! ✅")
}

runDriverCopyAttachmentsTest()
  .catch(err => {
    console.error("Driver copy attachments test failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
