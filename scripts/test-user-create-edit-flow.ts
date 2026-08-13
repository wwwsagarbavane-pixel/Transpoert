import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testUserCreateEditFlow() {
  console.log("==================================================")
  console.log("TESTING ENTERPRISE USER CREATE VS EDIT PERSISTENCE FLOW")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const userId = `USR-TEST-${Date.now().toString().slice(-6)}`
  const userEmail = `user.test.${Date.now().toString().slice(-4)}@example.com`
  const updatedName = "Test User Updated Name"

  try {
    // 1. CREATE NEW USER via POST
    console.log(`1. Submitting CREATE request via POST /api/db/users with ID "${userId}"...`)
    const postRes = await fetch("http://localhost:8443/api/db/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        company_id: "COMP-DEMO-001",
        name: "Initial Test User Name",
        full_name: "Initial Test User Name",
        email: userEmail,
        password: "TestPassword123",
        password_hash: "TestPassword123",
        role: "Operator",
        branch: "Pune Head Office",
        status: "active"
      })
    })

    const postJson = await postRes.json()
    console.log(`   POST Response Status: ${postRes.status}`, postJson)

    if (postRes.status !== 201) {
      throw new Error(`POST failed with status ${postRes.status}: ${JSON.stringify(postJson)}`)
    }

    // Direct PostgreSQL Check for INSERT
    const pgUser1 = (await pgClient.query(`SELECT id, company_id, email, name, role FROM public.users WHERE id = $1`, [userId])).rows[0]
    console.log("   PostgreSQL Saved Record:", pgUser1)

    const createSuccess = postRes.status === 201 && pgUser1 && pgUser1.email === userEmail
    console.log(`   ✅ CREATE ENTERPRISE USER POST: ${createSuccess ? "PASS" : "FAIL"}\n`)

    // 2. EDIT EXISTING USER via PUT using SAME ID
    console.log(`2. Submitting UPDATE request via PUT /api/db/users/${userId}...`)
    const putRes = await fetch(`http://localhost:8443/api/db/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        company_id: "COMP-DEMO-001",
        name: updatedName,
        full_name: updatedName,
        email: userEmail,
        password: "TestPassword123",
        password_hash: "TestPassword123",
        role: "Company Admin",
        branch: "Pune Head Office",
        status: "active"
      })
    })

    const putJson = await putRes.json()
    console.log(`   PUT Response Status: ${putRes.status}`, putJson)

    const pgUser2 = (await pgClient.query(`SELECT id, company_id, email, name, role FROM public.users WHERE id = $1`, [userId])).rows[0]
    console.log("   PostgreSQL Updated Record:", pgUser2)

    const updateSuccess = putRes.status === 200 && pgUser2 && pgUser2.id === userId && pgUser2.name === updatedName && pgUser2.role === "Company Admin"
    console.log(`   ✅ EDIT ENTERPRISE USER PUT (SAME ID): ${updateSuccess ? "PASS" : "FAIL"}\n`)

    // 3. GET Users List Verification
    console.log("3. Fetching GET /api/db/users?companyId=COMP-DEMO-001...")
    const getRes = await fetch("http://localhost:8443/api/db/users?companyId=COMP-DEMO-001")
    const getList: any[] = await getRes.json()
    const found = getList.find(u => u.id === userId)
    console.log("   Found Record in GET List:", found?.name)

    const getSuccess = found && found.name === updatedName
    console.log(`   ✅ GET USERS LIST: ${getSuccess ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DELETE FROM public.users WHERE id = $1`, [userId])

    console.log("==================================================")
    console.log(`ENTERPRISE USER CREATE VS EDIT FLOW TEST: ${createSuccess && updateSuccess && getSuccess ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testUserCreateEditFlow()
