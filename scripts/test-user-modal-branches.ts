import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testUserModalBranches() {
  console.log("==================================================")
  console.log("TESTING USER ACCOUNT MODAL BRANCH DROPDOWN FLOW")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const testBranchId = `BR-MODAL-${Date.now().toString().slice(-5)}`
  const testBranchName = `Modal Branch ${Date.now().toString().slice(-4)}`

  try {
    // 1. Create a Branch for COMP-DEMO-001 via API POST
    console.log(`1. Creating Test Branch "${testBranchName}" for COMP-DEMO-001...`)
    const postRes = await fetch("http://localhost:8443/api/db/branches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Company-ID": "COMP-DEMO-001"
      },
      body: JSON.stringify({
        id: testBranchId,
        company_id: "COMP-DEMO-001",
        code: "MDB",
        name: testBranchName,
        lr_prefix: "MDB",
        lr_next_no: 1,
        city: "Pune",
        state: "Maharashtra",
        type: "Branch",
        status: "active"
      })
    })

    console.log("   Create Branch Status:", postRes.status)

    // 2. Fetch Branches for COMP-DEMO-001 (Simulating UserAccountModal load for Demo Transport)
    console.log("\n2. Simulating UserAccountModal Branch fetch for COMP-DEMO-001...")
    const demoBranchesRes = await fetch("http://localhost:8443/api/db/branches?companyId=COMP-DEMO-001")
    const demoBranches: any[] = await demoBranchesRes.json()
    console.log("   Fetched Branches Count:", demoBranches.length)
    const foundInDemo = demoBranches.find(b => b.id === testBranchId)
    console.log("   Found New Branch in Demo Transport:", foundInDemo ? `YES (${foundInDemo.name})` : "NO")

    const demoPass = demoBranchesRes.status === 200 && Boolean(foundInDemo)
    console.log(`   ✅ DEMO TRANSPORT BRANCH DROPDOWN: ${demoPass ? "PASS" : "FAIL"}\n`)

    // 3. Fetch Branches for another Company (Simulating Company switch in UserAccountModal)
    console.log("3. Simulating UserAccountModal Company switch to COMP-OTHER-001...")
    const otherBranchesRes = await fetch("http://localhost:8443/api/db/branches?companyId=COMP-OTHER-001")
    const otherBranches: any[] = await otherBranchesRes.json()
    const foundInOther = otherBranches.find(b => b.id === testBranchId)
    console.log("   Found New Branch in Other Company:", foundInOther ? "YES (BUG!)" : "NO (Correctly Scoped!)")

    const scopePass = otherBranchesRes.status === 200 && !foundInOther
    console.log(`   ✅ COMPANY BRANCH SCOPING: ${scopePass ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DELETE FROM demo_transport.branches WHERE id = $1`, [testBranchId])

    console.log("==================================================")
    console.log(`USER ACCOUNT MODAL BRANCH FLOW: ${demoPass && scopePass ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testUserModalBranches()
