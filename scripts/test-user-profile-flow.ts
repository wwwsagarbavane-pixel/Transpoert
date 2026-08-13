import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testUserProfileFlow() {
  console.log("==================================================")
  console.log("TESTING USER PROFILE REAL POSTGRESQL DATA PERSISTENCE")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const compId = "COMP-DEMO-001"
  const profUserId = `USR-PROF-${Date.now().toString().slice(-5)}`
  const profEmail = `prof.user.${Date.now().toString().slice(-4)}@demotransport.com`

  try {
    // 1. Create Logged-in User in PostgreSQL public.users
    console.log(`1. Creating Logged-in User "${profUserId}"...`)
    await fetch("http://localhost:8443/api/db/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: profUserId,
        company_id: compId,
        name: "Real Logged In User",
        full_name: "Real Logged In User",
        email: profEmail,
        mobile: "9988776655",
        password: "TestPassword123",
        role: "Company Admin",
        branch: "Main HQ",
        status: "active"
      })
    })

    // 2. Fetch User Profile from API (simulating Profile.tsx load)
    console.log(`\n2. Fetching GET /api/db/users?companyId=${compId}...`)
    const res = await fetch(`http://localhost:8443/api/db/users?companyId=${compId}`)
    const users: any[] = await res.json()

    const profile = users.find(u => u.id === profUserId || u.email === profEmail)
    console.log("   Fetched Real Profile Record:", profile)

    const loadPass = profile && profile.name === "Real Logged In User" &&
                     profile.email === profEmail &&
                     profile.mobile === "9988776655" &&
                     profile.id === profUserId

    console.log(`   ✅ PROFILE LOADED REAL POSTGRESQL DATA: ${loadPass ? "PASS" : "FAIL"}\n`)

    // 3. Update User Profile via PUT (simulating Save Profile Details)
    console.log("3. Testing SAVE PROFILE DETAILS (Updating Name & Mobile)...")
    const updateRes = await fetch(`http://localhost:8443/api/db/users/${profUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: profUserId,
        company_id: compId,
        name: "Real Logged In User Updated",
        full_name: "Real Logged In User Updated",
        email: profEmail,
        mobile: "9123456789",
        password: "TestPassword123",
        role: "Company Admin",
        branch: "Main HQ",
        status: "active"
      })
    })

    console.log("   Update Status:", updateRes.status)

    // Direct PostgreSQL Check
    const pgUser = (await pgClient.query(`SELECT id, name, email, mobile FROM public.users WHERE id = $1`, [profUserId])).rows[0]
    console.log("   PostgreSQL Saved Profile Record:", pgUser)

    const updatePass = updateRes.status === 200 && pgUser &&
                       pgUser.name === "Real Logged In User Updated" &&
                       pgUser.mobile === "9123456789" &&
                       pgUser.id === profUserId

    console.log(`   ✅ PROFILE UPDATE PERSISTENCE (SAME ID): ${updatePass ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DELETE FROM public.users WHERE id = $1`, [profUserId])

    console.log("==================================================")
    console.log(`USER PROFILE SECTION TEST: ${loadPass && updatePass ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testUserProfileFlow()
