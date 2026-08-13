import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testBranchAndUserFields() {
  console.log("==================================================")
  console.log("TESTING BRANCH MASTER (PREFIX vs CODE) & USER MOBILE PERSISTENCE")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const compId = "COMP-DEMO-001"
  const branchId = `BR-TEST-${Date.now().toString().slice(-5)}`
  const userId = `USR-TEST-${Date.now().toString().slice(-5)}`
  const userEmail = `ganesh.${Date.now().toString().slice(-4)}@gmail.com`

  try {
    // ---------------------------------------------------------
    // TEST 1: BRANCH MASTER (Branch Code vs LR Prefix)
    // ---------------------------------------------------------
    console.log(`1. Testing BRANCH MASTER CREATE...`)
    const branchCreateRes = await fetch("http://localhost:8443/api/db/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({
        id: branchId,
        company_id: compId,
        code: "ABD-NG",
        name: "Nagpur",
        city: "Nagpur",
        state: "Maharashtra",
        type: "Branch",
        lrPrefix: "NG",
        nextLrNumber: 1001,
        status: "active"
      })
    })

    console.log("   Branch Create Status:", branchCreateRes.status)

    // Fetch Branch from API
    const branchGetRes = await fetch(`http://localhost:8443/api/db/branches?companyId=${compId}`)
    const branches: any[] = await branchGetRes.json()
    const savedBranch = branches.find(b => b.id === branchId)

    console.log("   Saved Branch Record:", savedBranch)
    const branchPass1 = savedBranch && savedBranch.code === "ABD-NG" && savedBranch.name === "Nagpur" &&
                        (savedBranch.lrPrefix === "NG" || savedBranch.lr_prefix === "NG") &&
                        (savedBranch.nextLrNumber === 1001 || savedBranch.lr_next_no === 1001)

    console.log(`   ✅ BRANCH CREATE (Code: ABD-NG, Prefix: NG, Next: 1001): ${branchPass1 ? "PASS" : "FAIL"}\n`)

    // Edit Branch
    console.log("2. Testing BRANCH MASTER UPDATE (SAME ID)...")
    await fetch(`http://localhost:8443/api/db/branches/${branchId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({
        id: branchId,
        company_id: compId,
        code: "ABD-NG-UPDATED",
        name: "Nagpur Main",
        city: "Nagpur",
        state: "Maharashtra",
        type: "Branch",
        lrPrefix: "NGU",
        nextLrNumber: 1002,
        status: "active"
      })
    })

    const branchGetRes2 = await fetch(`http://localhost:8443/api/db/branches?companyId=${compId}`)
    const branches2: any[] = await branchGetRes2.json()
    const updatedBranch = branches2.find(b => b.id === branchId)
    console.log("   Updated Branch Record:", updatedBranch)

    const branchPass2 = updatedBranch && updatedBranch.code === "ABD-NG-UPDATED" &&
                        (updatedBranch.lrPrefix === "NGU" || updatedBranch.lr_prefix === "NGU") &&
                        (updatedBranch.nextLrNumber === 1002 || updatedBranch.lr_next_no === 1002)

    console.log(`   ✅ BRANCH UPDATE PERSISTENCE: ${branchPass2 ? "PASS" : "FAIL"}\n`)

    // ---------------------------------------------------------
    // TEST 2: COMPANY USER MANAGEMENT (Mobile Number Field)
    // ---------------------------------------------------------
    console.log(`3. Testing USER MANAGEMENT CREATE (Mobile: 9876543210)...`)
    const userCreateRes = await fetch("http://localhost:8443/api/db/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        company_id: compId,
        name: "Ganesh",
        full_name: "Ganesh",
        email: userEmail,
        mobile: "9876543210",
        password: "TestPassword123",
        role: "Operator",
        branch: "Nagpur",
        status: "active"
      })
    })

    console.log("   User Create Status:", userCreateRes.status)

    // Direct PostgreSQL Check
    const pgUser = (await pgClient.query(`SELECT id, name, email, mobile FROM public.users WHERE id = $1`, [userId])).rows[0]
    console.log("   PostgreSQL Saved User Record:", pgUser)

    const userPass1 = userCreateRes.status === 201 && pgUser && pgUser.mobile === "9876543210"
    console.log(`   ✅ USER CREATE WITH MOBILE (9876543210): ${userPass1 ? "PASS" : "FAIL"}\n`)

    // Edit User Mobile
    console.log("4. Testing USER MANAGEMENT UPDATE Mobile (9112233445)...")
    await fetch(`http://localhost:8443/api/db/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        company_id: compId,
        name: "Ganesh",
        full_name: "Ganesh",
        email: userEmail,
        mobile: "9112233445",
        password: "TestPassword123",
        role: "Operator",
        branch: "Nagpur",
        status: "active"
      })
    })

    const pgUser2 = (await pgClient.query(`SELECT id, name, email, mobile FROM public.users WHERE id = $1`, [userId])).rows[0]
    console.log("   PostgreSQL Updated User Record:", pgUser2)

    const userPass2 = pgUser2 && pgUser2.mobile === "9112233445"
    console.log(`   ✅ USER UPDATE MOBILE PERSISTENCE: ${userPass2 ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DELETE FROM demo_transport.branches WHERE id = $1`, [branchId])
    await pgClient.query(`DELETE FROM public.users WHERE id = $1`, [userId])

    console.log("==================================================")
    console.log(`BRANCH & USER FIELDS TEST: ${branchPass1 && branchPass2 && userPass1 && userPass2 ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testBranchAndUserFields()
