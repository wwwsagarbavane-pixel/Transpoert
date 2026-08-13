import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function diagnoseCompanyCreate() {
  console.log("=== STARTING READ-ONLY COMPANY CREATION DIAGNOSIS ===")

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  try {
    // 1. Check companies in public.companies
    const compRes = await pgClient.query(`SELECT id, code, name, schema_name, "createdAt" FROM public.companies ORDER BY "createdAt" DESC`)
    console.log(`\n1. Current Companies in public.companies (${compRes.rows.length} total):`)
    console.table(compRes.rows)

    // 2. Test simulating the exact payload sent by CompanyWizardModal
    const testId = `COMP-TEST-DIAGNOSE`
    const testRecord: any = {
      id: testId,
      code: "TEST",
      name: "Diagnose Test Logistics",
      schema_name: "diagnose_test_logistics",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    console.log("\n2. Testing Prisma upsert with payload containing schema_name:")
    try {
      await (prisma as any).company.upsert({
        where: { id: testId },
        update: testRecord,
        create: testRecord
      })
      console.log("Prisma Upsert Succeeded")
    } catch (prismaErr: any) {
      console.error("❌ PRISMA UPSERT FAILED WITH EXACT ERROR:")
      console.error(prismaErr.message)
    }

  } catch (err) {
    console.error("Diagnosis script error:", err)
  } finally {
    await prisma.$disconnect()
    await pgClient.end()
  }
}

diagnoseCompanyCreate()
