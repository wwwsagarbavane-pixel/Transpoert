import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testUserDateFlow() {
  console.log("==================================================")
  console.log("TESTING ENTERPRISE USER DATE HANDLING & PERSISTENCE")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const userId1 = `USR-DATE-${Date.now().toString().slice(-6)}-1`
  const userId2 = `USR-DATE-${Date.now().toString().slice(-6)}-2`
  const email1 = `date.test.1.${Date.now().toString().slice(-4)}@example.com`
  const email2 = `date.test.2.${Date.now().toString().slice(-4)}@example.com`
  const validDateIso = new Date().toISOString()

  try {
    // 1. CREATE USER WITH OMITTED / EMPTY DATE ("Never", "")
    console.log(`1. Submitting CREATE User with empty / "Never" date fields...`)
    const postRes1 = await fetch("http://localhost:8443/api/db/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId1,
        company_id: "COMP-DEMO-001",
        name: "Empty Date User",
        full_name: "Empty Date User",
        email: email1,
        password: "TestPassword123",
        role: "Operator",
        branch: "Main HQ",
        lastLogin: "Never",
        status: "active"
      })
    })

    const postJson1 = await postRes1.json()
    console.log(`   POST 1 Response Status: ${postRes1.status}`, postJson1)

    const pgUser1 = (await pgClient.query(`SELECT id, email, "lastLogin" FROM public.users WHERE id = $1`, [userId1])).rows[0]
    console.log("   PostgreSQL User 1 Record:", pgUser1)

    const pass1 = postRes1.status === 201 && pgUser1 && pgUser1.email === email1
    console.log(`   ✅ CREATE USER WITH EMPTY/NEVER DATE: ${pass1 ? "PASS" : "FAIL"}\n`)

    // 2. CREATE USER WITH VALID DATE ISO STRING
    console.log(`2. Submitting CREATE User with valid Date ISO string ("${validDateIso}")...`)
    const postRes2 = await fetch("http://localhost:8443/api/db/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId2,
        company_id: "COMP-DEMO-001",
        name: "Valid Date User",
        full_name: "Valid Date User",
        email: email2,
        password: "TestPassword123",
        role: "Company Admin",
        branch: "Main HQ",
        lastLogin: validDateIso,
        status: "active"
      })
    })

    const postJson2 = await postRes2.json()
    console.log(`   POST 2 Response Status: ${postRes2.status}`, postJson2)

    const pgUser2 = (await pgClient.query(`SELECT id, email, "lastLogin" FROM public.users WHERE id = $1`, [userId2])).rows[0]
    console.log("   PostgreSQL User 2 Record:", pgUser2)

    const pass2 = postRes2.status === 201 && pgUser2 && pgUser2.email === email2 && Boolean(pgUser2.lastLogin)
    console.log(`   ✅ CREATE USER WITH VALID DATE: ${pass2 ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DELETE FROM public.users WHERE id = $1 OR id = $2`, [userId1, userId2])

    console.log("==================================================")
    console.log(`ENTERPRISE USER DATE HANDLING TEST: ${pass1 && pass2 ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testUserDateFlow()
