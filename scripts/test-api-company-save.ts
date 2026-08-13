import dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testApiCompanySave() {
  console.log("=== STARTING HTTP API COMPANY SAVE TEST ===")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const testCompId = `COMP-HTTP-${Date.now().toString().substring(7)}`
  const testCompName = `HTTP Test Logistics ${Date.now().toString().substring(8)}`

  const payload = {
    id: testCompId,
    code: "HTTP",
    name: testCompName,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  try {
    console.log(`\n1. Sending PUT request to http://localhost:8443/api/db/companies/${testCompId}...`)
    const res = await fetch(`http://localhost:8443/api/db/companies/${testCompId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    const status = res.status
    const json = await res.json()

    console.log(`HTTP Response Status: ${status}`)
    console.log(`HTTP Response Body:`, json)

    console.log(`\n2. Querying PostgreSQL public.companies for ID="${testCompId}"...`)
    const pgRes = await pgClient.query(`SELECT * FROM public.companies WHERE id = $1`, [testCompId])
    console.log(`Record in PostgreSQL:`, pgRes.rows[0] || "NULL (NOT FOUND)")

    if (pgRes.rows.length > 0) {
      console.log("✅ API Company Save Result: SUCCESS (Saved to PostgreSQL)")
      // Clean up
      const schemaName = pgRes.rows[0].schema_name
      if (schemaName) await pgClient.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
      await pgClient.query(`DELETE FROM public.companies WHERE id = $1`, [testCompId])
    } else {
      console.error("❌ API Company Save Result: FAILED (API returned 200 but PostgreSQL has NO record!)")
    }

  } catch (err) {
    console.error("HTTP test error:", err)
  } finally {
    await pgClient.end()
  }
}

testApiCompanySave()
