import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function verifyWorkspaceSelectorVisibility() {
  console.log("=== STARTING WORKSPACE SELECTOR COMPANY VISIBILITY VERIFICATION ===")
  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const testCompId = `COMP-WS-${Date.now().toString().substring(7)}`
  const testCompName = `Kaveri Logistics Hub ${Date.now().toString().substring(8)}`

  try {
    console.log(`\n1. Creating Test Company: ID="${testCompId}", Name="${testCompName}"...`)

    const payload = {
      id: testCompId,
      code: "KLH",
      name: testCompName,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const saveRes = await fetch(`http://localhost:8443/api/db/companies/${testCompId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    const saveJson = await saveRes.json()
    console.log(`API Save Response Status: ${saveRes.status}`, saveJson)

    // 2. Direct PostgreSQL query verification
    console.log(`\n2. Direct PostgreSQL Query: SELECT * FROM public.companies WHERE id = '${testCompId}';`)
    const pgRes = await pgClient.query(`SELECT id, code, name, schema_name, status FROM public.companies WHERE id = $1`, [testCompId])
    const savedRecord = pgRes.rows[0]
    console.log("PostgreSQL Saved Record:", savedRecord)

    const isSavedInPg = savedRecord && savedRecord.id === testCompId && savedRecord.name === testCompName

    // 3. API GET /companies test (Simulating Workspace Company Selector load)
    console.log(`\n3. Simulating Workspace Company Selector GET /companies API call...`)
    const getRes = await fetch("http://localhost:8443/api/db/companies")
    const apiCompanies: any[] = await getRes.json()
    
    // Simulate CompanySelection.tsx loadCompanies filtering logic
    const activeCompaniesInUi = apiCompanies.filter((c: any) => c.status === "active")
    const foundInUi = activeCompaniesInUi.find((c: any) => c.id === testCompId)

    console.log(`API Returned ${apiCompanies.length} Total Companies (${activeCompaniesInUi.length} Active).`)
    console.log(`Newly Created Company Visible in UI List: ${foundInUi ? "YES" : "NO"}`)

    console.log("\n==================================================")
    console.log("WORKSPACE COMPANY SELECTOR VISIBILITY CHECKLIST")
    console.log("==================================================")
    console.log(`1. Record Saved in public.companies : ${isSavedInPg ? "PASS" : "FAIL"}`)
    console.log(`2. Permanent schema_name Stored      : ${savedRecord?.schema_name ? "PASS (" + savedRecord.schema_name + ")" : "FAIL"}`)
    console.log(`3. Visible in GET /companies API     : ${foundInUi ? "PASS" : "FAIL"}`)
    console.log(`4. Company Code & Name Matched       : ${foundInUi?.code === "KLH" && foundInUi?.name === testCompName ? "PASS" : "FAIL"}`)
    console.log(`5. Total Companies Visible in UI     : ${activeCompaniesInUi.length}`)
    console.log("==================================================\n")

    // Clean up test verification record
    if (savedRecord?.schema_name) {
      await pgClient.query(`DROP SCHEMA IF EXISTS "${savedRecord.schema_name}" CASCADE`)
    }
    await pgClient.query(`DELETE FROM public.companies WHERE id = $1`, [testCompId])

  } catch (err) {
    console.error("Verification failed:", err)
  } finally {
    await pgClient.end()
  }
}

verifyWorkspaceSelectorVisibility()
