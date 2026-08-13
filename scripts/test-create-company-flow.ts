import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testCreateCompanyFlow() {
  console.log("==================================================")
  console.log("TESTING CREATE COMPANY POST VS PUT PERSISTENCE FLOW")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const compId = `COMP-${Date.now().toString().slice(-6)}`
  const compName = `Test Company Flow ${Date.now().toString().slice(-4)}`
  const updatedCompName = `${compName} (Edited)`

  try {
    // 1. CREATE NEW COMPANY via POST
    console.log(`1. Submitting CREATE request via POST /api/db/companies...`)
    const postRes = await fetch("http://localhost:8443/api/db/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: compId,
        code: "TCF",
        name: compName,
        status: "active"
      })
    })

    const postJson = await postRes.json()
    console.log(`   POST Response Status: ${postRes.status}`, postJson)

    if (postRes.status !== 201) {
      throw new Error(`POST failed with status ${postRes.status}: ${JSON.stringify(postJson)}`)
    }

    // 2. Direct PostgreSQL Check for INSERT & Schema Provisioning
    const pgComp1 = (await pgClient.query(`SELECT id, code, name, schema_name, status FROM public.companies WHERE id = $1`, [compId])).rows[0]
    console.log("   PostgreSQL Saved Record:", pgComp1)

    const schemaRes = await pgClient.query(`
      SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1
    `, [pgComp1?.schema_name])
    console.log("   PostgreSQL Schema Provisioned:", schemaRes.rows[0]?.schema_name)

    const createSuccess = pgComp1 && pgComp1.name === compName && schemaRes.rows.length > 0
    console.log(`   ✅ CREATE COMPANY POST: ${createSuccess ? "PASS" : "FAIL"}\n`)

    // 3. EDIT EXISTING COMPANY via PUT
    console.log(`2. Submitting UPDATE request via PUT /api/db/companies/${compId}...`)
    const putRes = await fetch(`http://localhost:8443/api/db/companies/${compId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: compId,
        code: "TCF",
        name: updatedCompName,
        status: "active"
      })
    })

    const putJson = await putRes.json()
    console.log(`   PUT Response Status: ${putRes.status}`, putJson)

    const pgComp2 = (await pgClient.query(`SELECT id, code, name, schema_name, status FROM public.companies WHERE id = $1`, [compId])).rows[0]
    console.log("   PostgreSQL Updated Record:", pgComp2)

    const updateSuccess = putRes.status === 200 && pgComp2 && pgComp2.id === compId && pgComp2.name === updatedCompName
    console.log(`   ✅ EDIT COMPANY PUT: ${updateSuccess ? "PASS" : "FAIL"}\n`)

    // 4. GET Companies List Verification
    console.log("3. Fetching GET /api/db/companies...")
    const getRes = await fetch("http://localhost:8443/api/db/companies")
    const getList: any[] = await getRes.json()
    const found = getList.find(c => c.id === compId)
    console.log("   Found Record in GET List:", found?.name)

    const getSuccess = found && found.name === updatedCompName
    console.log(`   ✅ GET COMPANIES LIST: ${getSuccess ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DROP SCHEMA IF EXISTS "${pgComp1.schema_name}" CASCADE`)
    await pgClient.query(`DELETE FROM public.companies WHERE id = $1`, [compId])

    console.log("==================================================")
    console.log(`CREATE COMPANY FLOW TEST: ${createSuccess && updateSuccess && getSuccess ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testCreateCompanyFlow()
