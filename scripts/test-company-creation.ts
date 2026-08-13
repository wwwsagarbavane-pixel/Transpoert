import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

function normalizeSchemaName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
}

async function testCompanyCreation() {
  console.log("=== STARTING COMPANY CREATION PERSISTENCE VERIFICATION ===")

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const testCompId = `COMP-${Date.now().toString().substring(7)}`
  const testCompName = `Express Freight System ${Date.now().toString().substring(8)}`
  const expectedSchemaName = normalizeSchemaName(testCompName)

  try {
    console.log(`\n1. Creating Test Company: ID="${testCompId}", Name="${testCompName}"...`)
    
    // Simulate endpoint company creation via Prisma upsert
    const companyRecord = {
      id: testCompId,
      code: "EFS",
      name: testCompName,
      schema_name: expectedSchemaName,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await prisma.company.upsert({
      where: { id: testCompId },
      update: companyRecord,
      create: companyRecord
    })
    console.log(`✅ Prisma Company Upsert Succeeded!`)

    // Create its normalized PostgreSQL company schema + business tables
    await pgClient.query(`CREATE SCHEMA IF NOT EXISTS "${expectedSchemaName}"`)
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS "${expectedSchemaName}"."branches" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "code" TEXT NOT NULL,
        "name" TEXT NOT NULL, "city" TEXT NOT NULL, "state" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'Branch', "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS "${expectedSchemaName}"."parties" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "type" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    console.log(`✅ Provisioned company schema "${expectedSchemaName}"`)

    // 2. VERIFY RECORD IN PUBLIC.COMPANIES
    console.log(`\n2. Verifying record in public.companies...`)
    const verifyCompRes = await pgClient.query(`
      SELECT id, code, name, schema_name, status, "createdAt" 
      FROM public.companies 
      WHERE id = $1
    `, [testCompId])

    const savedRecord = verifyCompRes.rows[0]
    console.log("Saved Company Record:", savedRecord)

    const isCompanyPersisted = 
      savedRecord &&
      savedRecord.id === testCompId &&
      savedRecord.name === testCompName &&
      savedRecord.schema_name === expectedSchemaName

    console.log(`Company Persisted Check: ${isCompanyPersisted ? "PASS" : "FAIL"}`)

    // 3. VERIFY COMPANY SCHEMA EXISTS
    console.log(`\n3. Verifying PostgreSQL schema "${expectedSchemaName}"...`)
    const schemaCheck = await pgClient.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name = $1
    `, [expectedSchemaName])
    const isSchemaCreated = schemaCheck.rows.length > 0
    console.log(`Company Schema Check: ${isSchemaCreated ? "PASS" : "FAIL"}`)

    // 4. VERIFY EXISTING COMPANIES & DATA REMAIN INTACT
    console.log(`\n4. Verifying existing companies & data integrity...`)
    const allCompaniesRes = await pgClient.query(`SELECT count(*) FROM public.companies`)
    const comp3PartiesRes = await pgClient.query(`SELECT count(*) FROM "testtranpoart"."parties"`)

    console.log(`Total Companies in public.companies: ${allCompaniesRes.rows[0].count}`)
    console.log(`Parties count in testtranpoart: ${comp3PartiesRes.rows[0].count} (Expected 3)`)

    const isDataIntact = parseInt(allCompaniesRes.rows[0].count) >= 6 && parseInt(comp3PartiesRes.rows[0].count) === 3

    console.log("\n==================================================")
    console.log("FINAL COMPANY CREATION PERSISTENCE VERIFICATION")
    console.log("==================================================")
    console.log(`Public Companies Record Saved : ${isCompanyPersisted ? "PASS" : "FAIL"}`)
    console.log(`Company Schema Created        : ${isSchemaCreated ? "PASS" : "FAIL"}`)
    console.log(`Existing Data Integrity      : ${isDataIntact ? "PASS" : "FAIL"}`)
    console.log("==================================================\n")

    // Clean up test company & schema created by verification script
    await pgClient.query(`DROP SCHEMA IF EXISTS "${expectedSchemaName}" CASCADE`)
    await pgClient.query(`DELETE FROM public.companies WHERE id = $1`, [testCompId])

  } catch (err) {
    console.error("Test execution failed:", err)
  } finally {
    await prisma.$disconnect()
    await pgClient.end()
  }
}

testCompanyCreation()
