import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testPrismaSchemaExplicit() {
  console.log("=== STARTING EXPLICIT MULTI-SCHEMA UPDATE TEST ===")

  const client1 = new Client({ connectionString })
  await client1.connect()

  const client2 = new Client({ connectionString })
  await client2.connect()

  const testPhone = `98200${Math.floor(10000 + Math.random() * 90000)}`
  const partyId = 'PRT-001'

  try {
    console.log(`\nUpdating "testtranpoart"."parties" PRT-001 phone to "${testPhone}"...`)
    await client1.query(`
      UPDATE "testtranpoart"."parties" 
      SET phone = $1, "updatedAt" = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [testPhone, partyId])

    console.log(`\nQuerying "testtranpoart"."parties" from Client 2...`)
    const res = await client2.query(`
      SELECT id, name, phone, "updatedAt" 
      FROM "testtranpoart"."parties" 
      WHERE id = $1
    `, [partyId])

    console.log("Fetched Record from Client 2:", res.rows[0])
    console.log("Match Status:", res.rows[0].phone === testPhone ? "SUCCESS (INSTANT COMMIT)" : "FAILED")

  } catch (err) {
    console.error("Explicit schema test error:", err)
  } finally {
    await client1.end()
    await client2.end()
  }
}

testPrismaSchemaExplicit()
