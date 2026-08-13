import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function verifyFinalCompanyFlow() {
  console.log("=== STARTING FINAL VERIFICATION OF COMPANY CREATION ===")
  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const testCompId = `COMP-${Date.now().toString().substring(7)}`
  const testCompName = `Kaveri Trans Logistics ${Date.now().toString().substring(8)}`
  const expectedSchema = `kaveri_trans_logistics_${testCompName.split(' ').pop()}`

  try {
    console.log(`\n1. Creating brand-new company via HTTP API: ID="${testCompId}", Name="${testCompName}"...`)
    
    const payload = {
      id: testCompId,
      code: "KAV",
      name: testCompName,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const res = await fetch(`http://localhost:8443/api/db/companies/${testCompId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    const status = res.status
    const json = await res.json()

    console.log(`HTTP Status: ${status}`)
    console.log(`API Response:`, json)

    // 2. Direct PostgreSQL verification
    console.log(`\n2. Executing: SELECT * FROM public.companies WHERE id = '${testCompId}';`)
    const compCheck = await pgClient.query(`SELECT id, code, name, schema_name, status FROM public.companies WHERE id = $1`, [testCompId])
    const savedComp = compCheck.rows[0]
    console.log("PostgreSQL Saved Record:", savedComp)

    const isRecordSaved = savedComp && savedComp.id === testCompId && savedComp.name === testCompName

    // 3. Schema verification
    console.log(`\n3. Verifying PostgreSQL schema "${savedComp?.schema_name}"...`)
    const schemaCheck = await pgClient.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, [savedComp?.schema_name])
    const isSchemaCreated = schemaCheck.rows.length > 0

    // 4. Verify 12 business tables in the new schema
    const businessTables = ['branches', 'parties', 'vehicles', 'drivers', 'owners', 'agents', 'stations', 'articles', 'lrs', 'deliveries', 'bills', 'payments']
    let tablesPresent = 0
    if (isSchemaCreated) {
      for (const t of businessTables) {
        const tCheck = await pgClient.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`, [savedComp.schema_name, t])
        if (tCheck.rows.length > 0) tablesPresent++
      }
    }

    // 5. Verify existing company data integrity
    const compCountRes = await pgClient.query(`SELECT count(*) FROM public.companies`)
    const comp3PartiesRes = await pgClient.query(`SELECT count(*) FROM "testtranpoart"."parties"`)

    console.log("\n==================================================")
    console.log("FINAL COMPANY CREATION PERSISTENCE CHECKLIST")
    console.log("==================================================")
    console.log(`1. public.companies Record Created : ${isRecordSaved ? "PASS" : "FAIL"}`)
    console.log(`2. Permanent schema_name Stored    : ${savedComp?.schema_name ? "PASS" : "FAIL"}`)
    console.log(`3. Company Schema Created           : ${isSchemaCreated ? "PASS" : "FAIL"}`)
    console.log(`4. 12 Business Tables Created      : ${tablesPresent === 12 ? "PASS (12/12)" : "FAIL"}`)
    console.log(`5. Total Companies in PostgreSQL   : ${compCountRes.rows[0].count}`)
    console.log(`6. Existing Data Integrity         : ${parseInt(comp3PartiesRes.rows[0].count) === 3 ? "PASS (3/3 parties)" : "FAIL"}`)
    console.log("==================================================\n")

    // Clean up test company & schema created by verification script
    if (savedComp?.schema_name) {
      await pgClient.query(`DROP SCHEMA IF EXISTS "${savedComp.schema_name}" CASCADE`)
    }
    await pgClient.query(`DELETE FROM public.companies WHERE id = $1`, [testCompId])

  } catch (err) {
    console.error("Verification error:", err)
  } finally {
    await pgClient.end()
  }
}

verifyFinalCompanyFlow()
