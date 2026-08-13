import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testPrismaCommitSpeed() {
  console.log("=== STARTING PRISMA ORM COMMIT VERIFICATION ===")

  // 1. Prisma Client (Backend App)
  const adapter = new PrismaPg({ connectionString })
  const prisma = new PrismaClient({ adapter })

  // 2. Direct PG Client (pgAdmin / SQL Query tool simulator)
  const directPgClient = new Client({ connectionString })
  await directPgClient.connect()

  const testPhone = `98200${Math.floor(10000 + Math.random() * 90000)}`
  const partyId = 'PRT-001'

  try {
    await prisma.$executeRawUnsafe(`SET search_path TO "testtranpoart", public`)

    console.log(`\n1. Prisma ORM: Updating party PRT-001 phone to "${testPhone}"...`)
    const updateStart = Date.now()

    await prisma.party.update({
      where: { id: partyId },
      data: { phone: testPhone }
    })

    const updateTime = Date.now() - updateStart
    console.log(`✅ Prisma update completed in ${updateTime}ms`)

    console.log(`\n2. Direct PG Client: Executing fresh SQL query on testtranpoart.parties...`)
    const readStart = Date.now()

    const pgRes = await directPgClient.query(`
      SELECT id, name, phone, "updatedAt" 
      FROM "testtranpoart"."parties" 
      WHERE id = $1
    `, [partyId])

    const readTime = Date.now() - readStart
    const fetched = pgRes.rows[0]

    console.log(`✅ Direct SQL Query returned in ${readTime}ms`)
    console.log("   Fetched Record:", fetched)

    const isMatch = fetched.phone === testPhone

    console.log("\n==================================================")
    console.log("PRISMA TRANSACTION COMMIT VERIFICATION RESULT")
    console.log("==================================================")
    console.log(`Expected Phone Value : ${testPhone}`)
    console.log(`Actual PostgreSQL Value: ${fetched.phone}`)
    console.log(`Immediate Visibility   : ${isMatch ? "PASS (INSTANT COMMIT)" : "FAIL"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Prisma test error:", err)
  } finally {
    await prisma.$disconnect()
    await directPgClient.end()
  }
}

testPrismaCommitSpeed()
