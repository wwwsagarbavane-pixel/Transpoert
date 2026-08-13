import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testPgCommitSpeed() {
  console.log("=== STARTING POSTGRESQL TRANSACTION & COMMIT VERIFICATION ===")

  // Client 1: Simulating Backend API Update
  const appClient = new Client({ connectionString })
  await appClient.connect()

  // Client 2: Simulating pgAdmin / External Query Tool
  const externalQueryClient = new Client({ connectionString })
  await externalQueryClient.connect()

  const testPhone = `98200${Math.floor(10000 + Math.random() * 90000)}`
  const partyId = 'PRT-001'

  try {
    console.log(`\n1. App Client: Updating PRT-001 phone number to "${testPhone}"...`)
    const updateStartTime = Date.now()
    
    await appClient.query(`
      UPDATE "testtranpoart"."parties" 
      SET phone = $1, "updatedAt" = CURRENT_TIMESTAMP 
      WHERE id = $2
    `, [testPhone, partyId])

    const updateDuration = Date.now() - updateStartTime
    console.log(`✅ Update statement executed and committed in ${updateDuration}ms`)

    console.log(`\n2. External Query Client (pgAdmin Simulator): Querying PRT-001 immediately...`)
    const readStartTime = Date.now()
    
    const readRes = await externalQueryClient.query(`
      SELECT id, name, phone, "updatedAt" 
      FROM "testtranpoart"."parties" 
      WHERE id = $1
    `, [partyId])

    const readDuration = Date.now() - readStartTime
    const fetchedRecord = readRes.rows[0]

    console.log(`✅ External Query executed in ${readDuration}ms`)
    console.log("   Fetched Record from PostgreSQL:", fetchedRecord)

    const isImmediatelyUpdated = fetchedRecord.phone === testPhone

    console.log("\n==================================================")
    console.log("POSTGRESQL COMMIT VERIFICATION RESULT")
    console.log("==================================================")
    console.log(`Expected Phone Value : ${testPhone}`)
    console.log(`Actual PostgreSQL Value: ${fetchedRecord.phone}`)
    console.log(`Immediate Visibility   : ${isImmediatelyUpdated ? "PASS (INSTANT COMMIT)" : "FAIL"}`)
    console.log("==================================================\n")

    if (isImmediatelyUpdated) {
      console.log("DIAGNOSIS:")
      console.log("1. PostgreSQL commits all write/update transactions IMMEDIATELY.")
      console.log("2. Independent SQL sessions (like psql, pgAdmin SQL Tab, and Node.js clients) read the updated data instantaneously without restarting PostgreSQL.")
      console.log("3. pgAdmin's 'View/Edit Data' grid displays a static, cached snapshot of the table when opened. In pgAdmin, you must click the 'Execute/Refresh (F5)' button or re-run the SQL Query tab to refresh pgAdmin's UI grid.")
    } else {
      console.log("DIAGNOSIS: Database transaction did not commit immediately.")
    }

  } catch (err) {
    console.error("Test error:", err)
  } finally {
    await appClient.end()
    await externalQueryClient.end()
  }
}

testPgCommitSpeed()
