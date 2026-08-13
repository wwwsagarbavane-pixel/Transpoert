import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testPrismaTransactionCommit() {
  console.log("=== STARTING PRISMA LOCAL TRANSACTION COMMIT TEST ===")

  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  const externalPgClient = new Client({ connectionString })
  await externalPgClient.connect()

  const testPhone = `98200${Math.floor(10000 + Math.random() * 90000)}`
  const partyId = 'PRT-001'
  const targetSchema = 'testtranpoart'

  try {
    console.log(`\n1. Executing Prisma Transaction setting search_path local to transaction block...`)
    
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${targetSchema}", public`)
      await tx.party.update({
        where: { id: partyId },
        data: { phone: testPhone }
      })
    })

    console.log(`✅ Transaction committed.`)

    console.log(`\n2. External PG Client querying "testtranpoart"."parties"...`)
    const res = await externalPgClient.query(`
      SELECT id, name, phone, "updatedAt" 
      FROM "testtranpoart"."parties" 
      WHERE id = $1
    `, [partyId])

    console.log("Fetched Record from External Client:", res.rows[0])
    const isMatch = res.rows[0].phone === testPhone

    console.log("\n==================================================")
    console.log("PRISMA TRANSACTION LOCAL SEARCH PATH RESULT")
    console.log("==================================================")
    console.log(`Expected Phone Value : ${testPhone}`)
    console.log(`Actual PostgreSQL Value: ${res.rows[0].phone}`)
    console.log(`Immediate Visibility   : ${isMatch ? "PASS (INSTANT COMMIT)" : "FAIL"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Prisma transaction test error:", err)
  } finally {
    await prisma.$disconnect()
    await externalPgClient.end()
  }
}

testPrismaTransactionCommit()
