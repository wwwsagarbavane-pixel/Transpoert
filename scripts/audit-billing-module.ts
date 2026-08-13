import { prisma } from "../src/db/prismaClient"

async function auditBillingModule() {
  console.log("=========================================================================")
  console.log("PHASE 1: READ-ONLY AUDIT OF BILLING MODULE & DATABASE RECORDS")
  console.log("=========================================================================\n")

  // 1. Inspect schemas in PostgreSQL
  const schemas: any = await prisma.$queryRawUnsafe(`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'comp_%' OR schema_name = 'public'`)
  console.log("PostgreSQL Schemas:", schemas.map((s: any) => s.schema_name))

  // 2. Audit public.bills & tenant bills tables
  for (const s of schemas) {
    const sName = s.schema_name
    try {
      const billRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${sName}"."bills"`)
      console.log(`\n--- Schema "${sName}" Bills (${billRows.length} records) ---`)
      billRows.forEach((b: any) => {
        console.log(`  ID: ${b.id} | BillNo: ${b.billNo || b.billNumber} | Company: ${b.company_id} | Party: ${b.party || b.partyName} | Amount: ${b.totalAmount || b.amount} | Paid: ${b.paidAmount || b.paid} | Outstanding: ${b.outstanding} | Status: ${b.status} | LRs: ${JSON.stringify(b.lrs)}`)
      })
    } catch (err: any) {
      console.log(`  Schema "${sName}" bills query note: ${err.message}`)
    }

    try {
      const payRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${sName}"."payments"`)
      console.log(`--- Schema "${sName}" Payments (${payRows.length} records) ---`)
      payRows.forEach((p: any) => {
        console.log(`  ID: ${p.id} | BillNo: ${p.billNo} | Amount: ${p.amount} | Mode: ${p.mode || p.paymentMode} | Date: ${p.date || p.paymentDate}`)
      })
    } catch (err: any) {
      console.log(`  Schema "${sName}" payments query note: ${err.message}`)
    }

    try {
      const lrRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${sName}"."lrs" WHERE "billed" = true OR "bill_id" IS NOT NULL OR "billNo" IS NOT NULL`)
      console.log(`--- Schema "${sName}" Billed LRs (${lrRows.length} records) ---`)
      lrRows.forEach((r: any) => {
        console.log(`  LR: ${r.lrNo || r.id} | Billed: ${r.billed} | BillNo: ${r.billNo || r.bill_id}`)
      })
    } catch (err: any) {
      console.log(`  Schema "${sName}" LRs query note: ${err.message}`)
    }
  }

  console.log("\n=========================================================================")
  console.log("AUDIT COMPLETE")
  console.log("=========================================================================")
}

auditBillingModule().catch(console.error)
