import { PrismaClient } from '@prisma/client'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testPrismaSchemaPath() {
  console.log("=== TESTING PRISMA SEARCH_PATH VS DYNAMIC SQL ===")
  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const compId = `COMP-PATH-${Date.now().toString().substring(7)}`
  const schemaName = `comp_path_${Date.now().toString().substring(7)}`

  try {
    // 1. Create company in public.companies
    await pgClient.query(`INSERT INTO public.companies (id, code, name, schema_name, status, "createdAt", "updatedAt") VALUES ($1, 'PATH', 'Path Test', $2, 'active', NOW(), NOW())`, [compId, schemaName])
    
    // 2. Create schema & parties table
    await pgClient.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
    await pgClient.query(`CREATE TABLE IF NOT EXISTS "${schemaName}"."parties" (
      "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL, "type" TEXT NOT NULL, "creditLimit" TEXT
    )`)

    // 3. Test raw query with search path vs direct schema
    console.log(`Setting search_path to "${schemaName}", public...`)
    await prisma.$executeRawUnsafe(`SET search_path TO "${schemaName}", public`)

    const partyId = `PRT-${Date.now()}`
    console.log(`Inserting party "${partyId}" into schema "${schemaName}"...`)
    
    try {
      await prisma.party.create({
        data: {
          id: partyId,
          company_id: compId,
          name: "Test Party",
          type: "Consignor",
          creditLimit: "500000"
        }
      })
      console.log("Prisma party.create succeeded!")
    } catch (pErr: any) {
      console.error("Prisma party.create error:", pErr.message)
      
      // Raw SQL Fallback test
      console.log("Testing raw SQL query fallback...")
      await prisma.$executeRawUnsafe(
        `INSERT INTO "${schemaName}"."parties" ("id", "company_id", "name", "type", "creditLimit") VALUES ($1, $2, $3, $4, $5)`,
        partyId, compId, "Test Party", "Consignor", "500000"
      )
      console.log("Raw SQL insert succeeded!")
    }

    // Query back from PostgreSQL
    const res = await pgClient.query(`SELECT * FROM "${schemaName}"."parties" WHERE id = $1`, [partyId])
    console.log("PostgreSQL query result:", res.rows[0])

    // Cleanup
    await pgClient.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
    await pgClient.query(`DELETE FROM public.companies WHERE id = $1`, [compId])

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
    await prisma.$disconnect()
  }
}

testPrismaSchemaPath()
