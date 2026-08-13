import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testExplicitPrismaQuery() {
  console.log("=== STARTING EXPLICIT PRISMA SCHEMA UPDATE TEST ===")

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  const externalPgClient = new Client({ connectionString })
  await externalPgClient.connect()

  const testPhone = `98200${Math.floor(10000 + Math.random() * 90000)}`
  const partyId = 'PRT-001'
  const targetSchema = 'testtranpoart'

  try {
    console.log(`\n1. Executing Prisma explicit raw query on "${targetSchema}"."parties"...`)
    
    await prisma.$executeRawUnsafe(`
      UPDATE "${targetSchema}"."parties" 
      SET phone = $1, "updatedAt" = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, testPhone, partyId)

    console.log(`✅ Prisma explicit query executed.`)

    console.log(`\n2. External PG Client querying "testtranpoart"."parties"...`)
    const res = await externalPgClient.query(`
      SELECT id, name, phone, "updatedAt" 
      FROM "testtranpoart"."parties" 
      WHERE id = $1
    `, [partyId])

    console.log("Fetched Record from External Client:", res.rows[0])
    const isMatch = res.rows[0].phone === testPhone

    console.log("\n==================================================")
    console.log("PRISMA EXPLICIT SCHEMA QUERY RESULT")
    console.log("==================================================")
    console.log(`Expected Phone Value : ${testPhone}`)
    console.log(`Actual PostgreSQL Value: ${res.rows[0].phone}`)
    console.log(`Immediate Visibility   : ${isMatch ? "PASS (INSTANT COMMIT)" : "FAIL"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Explicit Prisma query test error:", err)
  } finally {
    await prisma.$disconnect()
    await externalPgClient.end()
  }
}

testExplicitPrismaQuery()
