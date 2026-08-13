import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testUserMultitenantFiltering() {
  console.log("==================================================")
  console.log("TESTING USER MANAGEMENT MULTI-TENANT FILTERING FLOW")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const compA = "COMP-DEMO-001"
  const compB = `COMP-B-${Date.now().toString().slice(-4)}`
  const userIdA = `USR-COMP-A-${Date.now().toString().slice(-5)}`
  const userIdB = `USR-COMP-B-${Date.now().toString().slice(-5)}`

  try {
    // 0. Create Company B in public.companies
    await fetch("http://localhost:8443/api/db/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: compB,
        code: compB,
        name: "Test Company B",
        status: "active"
      })
    })
    // 1. Create User under Company A
    console.log(`1. Creating User A under Company A ("${compA}")...`)
    await fetch("http://localhost:8443/api/db/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userIdA,
        company_id: compA,
        name: "User Company A",
        email: `usera.${Date.now()}@compa.com`,
        password: "TestPassword123",
        role: "Operator",
        status: "active"
      })
    })

    // 2. Create User under Company B
    console.log(`2. Creating User B under Company B ("${compB}")...`)
    const postResB = await fetch("http://localhost:8443/api/db/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userIdB,
        company_id: compB,
        name: "User Company B",
        email: `userb.${Date.now()}@compb.com`,
        password: "TestPassword123",
        role: "Operator",
        status: "active"
      })
    })
    const postJsonB = await postResB.json()
    console.log("   User B Create Status:", postResB.status, postJsonB)

    // 3. Fetch Users for Company A
    console.log(`\n3. Fetching GET /api/db/users?companyId=${compA}...`)
    const resA = await fetch(`http://localhost:8443/api/db/users?companyId=${compA}`)
    const usersA: any[] = await resA.json()

    console.log("   Company A Users Count:", usersA.length)
    const hasUserAInA = usersA.some(u => u.id === userIdA)
    const hasUserBInA = usersA.some(u => u.id === userIdB)

    console.log(`   - User A present in Company A list: ${hasUserAInA}`)
    console.log(`   - User B present in Company A list (MUST BE FALSE): ${hasUserBInA}`)

    // 4. Fetch Users for Company B
    console.log(`\n4. Fetching GET /api/db/users?companyId=${compB}...`)
    const resB = await fetch(`http://localhost:8443/api/db/users?companyId=${compB}`)
    const usersB: any[] = await resB.json()

    console.log("   Company B Users Count:", usersB.length)
    const hasUserBInB = usersB.some(u => u.id === userIdB)
    const hasUserAInB = usersB.some(u => u.id === userIdA)

    console.log(`   - User B present in Company B list: ${hasUserBInB}`)
    console.log(`   - User A present in Company B list (MUST BE FALSE): ${hasUserAInB}`)

    const passMultiTenant = hasUserAInA && !hasUserBInA && hasUserBInB && !hasUserAInB

    console.log(`\n   ✅ MULTI-TENANT USER FILTERING TEST: ${passMultiTenant ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DELETE FROM public.users WHERE id = $1 OR id = $2`, [userIdA, userIdB])
    await pgClient.query(`DELETE FROM public.companies WHERE id = $1`, [compB])

    console.log("==================================================")
    console.log(`USER MANAGEMENT MULTI-TENANT FILTERING: ${passMultiTenant ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testUserMultitenantFiltering()
