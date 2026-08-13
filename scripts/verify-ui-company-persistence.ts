import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function verifyUiCompanyPersistence() {
  console.log("=== STARTING SUPER ADMIN UI COMPANY CREATION VERIFICATION ===")
  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const testCompId = `COMP-${Date.now().toString().substring(7)}`
  const testCompName = `Shree Ganesh Logistics ${Date.now().toString().substring(8)}`

  try {
    console.log(`\n1. Submitting Company Creation payload (Simulating Super Admin Form Submission):`)
    console.log(`   Company ID   : ${testCompId}`)
    console.log(`   Company Name : ${testCompName}`)

    // 1. Create Company via REST API
    const compPayload = {
      id: testCompId,
      code: "SGL",
      name: testCompName,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const saveRes = await fetch(`http://localhost:8443/api/db/companies/${testCompId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(compPayload)
    })

    const saveJson = await saveRes.json()
    console.log(`API Save Response Status: ${saveRes.status}`, saveJson)

    // 2. Create Admin User via REST API
    const adminUserPayload = {
      id: `USR-${Date.now()}`,
      company_id: testCompId,
      name: "Super Admin Test User",
      email: `admin.${testCompId.toLowerCase()}@ganeshlogistics.com`,
      password: "Password@123",
      role: "Company Admin",
      assignedCompanies: [testCompId],
      status: "active"
    }

    const userRes = await fetch(`http://localhost:8443/api/db/users/${adminUserPayload.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminUserPayload)
    })
    console.log(`Admin User API Save Status: ${userRes.status}`, await userRes.json())

    // 3. DIRECT POSTGRESQL VERIFICATION: SELECT * FROM public.companies;
    console.log(`\n2. Direct PostgreSQL Query: SELECT * FROM public.companies WHERE id = '${testCompId}';`)
    const pgCompRes = await pgClient.query(`SELECT * FROM public.companies WHERE id = $1`, [testCompId])
    const savedRecord = pgCompRes.rows[0]
    console.log("PostgreSQL Saved Company Record:", savedRecord)

    const isSavedInPg = savedRecord && savedRecord.id === testCompId && savedRecord.name === testCompName

    // 4. VERIFY SCHEMA CREATION
    console.log(`\n3. Verifying PostgreSQL schema "${savedRecord?.schema_name}"...`)
    const pgSchemaRes = await pgClient.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, [savedRecord?.schema_name])
    const isSchemaCreated = pgSchemaRes.rows.length > 0

    // 5. VERIFY GET /api/db/companies RETURNS RECORD TO UI
    console.log(`\n4. Verifying GET /api/db/companies response returned to Frontend UI...`)
    const getRes = await fetch("http://localhost:8443/api/db/companies")
    const getCompaniesList: any[] = await getRes.json()
    const foundInUiList = getCompaniesList.find((c: any) => c.id === testCompId)

    console.log("Found in UI Companies List:", foundInUiList ? "YES" : "NO")

    console.log("\n==================================================")
    console.log("SUPER ADMIN COMPANY CREATION VERIFICATION SUMMARY")
    console.log("==================================================")
    console.log(`1. PostgreSQL Record Created       : ${isSavedInPg ? "PASS" : "FAIL"}`)
    console.log(`2. Permanent schema_name Stored    : ${savedRecord?.schema_name ? "PASS (" + savedRecord.schema_name + ")" : "FAIL"}`)
    console.log(`3. PostgreSQL Schema Created       : ${isSchemaCreated ? "PASS" : "FAIL"}`)
    console.log(`4. Available in Frontend UI API    : ${foundInUiList ? "PASS" : "FAIL"}`)
    console.log(`5. Total Companies in PostgreSQL   : ${getCompaniesList.length}`)
    console.log("==================================================\n")

    // Clean up test verification record
    if (savedRecord?.schema_name) {
      await pgClient.query(`DROP SCHEMA IF EXISTS "${savedRecord.schema_name}" CASCADE`)
    }
    await pgClient.query(`DELETE FROM public.users WHERE id = $1`, [adminUserPayload.id])
    await pgClient.query(`DELETE FROM public.companies WHERE id = $1`, [testCompId])

  } catch (err) {
    console.error("Verification failed:", err)
  } finally {
    await pgClient.end()
  }
}

verifyUiCompanyPersistence()
