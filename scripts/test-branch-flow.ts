import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testBranchFlow() {
  console.log("==================================================")
  console.log("TESTING BRANCH MASTER POST VS PUT PERSISTENCE FLOW")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const branchId = `BR-${Date.now().toString().slice(-6)}`
  const branchName = `Branch Test ${Date.now().toString().slice(-4)}`
  const updatedBranchName = `${branchName} (Updated)`

  try {
    // 1. CREATE NEW BRANCH via POST
    console.log(`1. Submitting CREATE Branch request via POST /api/db/branches...`)
    const postRes = await fetch("http://localhost:8443/api/db/branches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Company-ID": "COMP-DEMO-001"
      },
      body: JSON.stringify({
        id: branchId,
        company_id: "COMP-DEMO-001",
        code: "BTF",
        name: branchName,
        lr_prefix: "BTF",
        lr_next_no: 1,
        city: "Test City",
        state: "Maharashtra",
        type: "Branch",
        status: "active"
      })
    })

    const postJson = await postRes.json()
    console.log(`   POST Response Status: ${postRes.status}`, postJson)

    if (postRes.status !== 201) {
      throw new Error(`POST failed with status ${postRes.status}: ${JSON.stringify(postJson)}`)
    }

    // 2. Direct PostgreSQL Check for INSERT inside demo_transport.branches
    const pgBranch1 = (await pgClient.query(`SELECT id, company_id, code, name, city, state FROM demo_transport.branches WHERE id = $1`, [branchId])).rows[0]
    console.log("   PostgreSQL demo_transport.branches Record:", pgBranch1)

    const createSuccess = pgBranch1 && pgBranch1.name === branchName
    console.log(`   ✅ CREATE BRANCH POST: ${createSuccess ? "PASS" : "FAIL"}\n`)

    // 3. EDIT EXISTING BRANCH via PUT
    console.log(`2. Submitting UPDATE request via PUT /api/db/branches/${branchId}...`)
    const putRes = await fetch(`http://localhost:8443/api/db/branches/${branchId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Company-ID": "COMP-DEMO-001"
      },
      body: JSON.stringify({
        id: branchId,
        company_id: "COMP-DEMO-001",
        code: "BTF",
        name: updatedBranchName,
        lr_prefix: "BTF",
        lr_next_no: 2,
        city: "Test City",
        state: "Maharashtra",
        type: "Branch",
        status: "active"
      })
    })

    const putJson = await putRes.json()
    console.log(`   PUT Response Status: ${putRes.status}`, putJson)

    const pgBranch2 = (await pgClient.query(`SELECT id, company_id, code, name, city, state FROM demo_transport.branches WHERE id = $1`, [branchId])).rows[0]
    console.log("   PostgreSQL Updated Record:", pgBranch2)

    const updateSuccess = putRes.status === 200 && pgBranch2 && pgBranch2.id === branchId && pgBranch2.name === updatedBranchName
    console.log(`   ✅ EDIT BRANCH PUT: ${updateSuccess ? "PASS" : "FAIL"}\n`)

    // 4. GET Branches List Verification
    console.log("3. Fetching GET /api/db/branches?companyId=COMP-DEMO-001...")
    const getRes = await fetch("http://localhost:8443/api/db/branches?companyId=COMP-DEMO-001")
    const getList: any[] = await getRes.json()
    const found = getList.find(b => b.id === branchId)
    console.log("   Found Record in GET List:", found?.name)

    const getSuccess = found && found.name === updatedBranchName
    console.log(`   ✅ GET BRANCHES LIST: ${getSuccess ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DELETE FROM demo_transport.branches WHERE id = $1`, [branchId])

    console.log("==================================================")
    console.log(`BRANCH MASTER PERSISTENCE TEST: ${createSuccess && updateSuccess && getSuccess ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testBranchFlow()
