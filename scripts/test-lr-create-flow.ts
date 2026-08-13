import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testLrCreateFlow() {
  console.log("==================================================")
  console.log("TESTING LR CREATE FLOW AND lrNo PERSISTENCE IN POSTGRESQL")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const lrNo1 = `TEST-LR-${Date.now().toString().slice(-5)}-1`
  const lrNo2 = `TEST-LR-${Date.now().toString().slice(-5)}-2`
  const compId = "COMP-DEMO-001"

  try {
    // 1. CREATE FIRST LR via POST
    console.log(`1. Submitting CREATE LR request via POST /api/db/lrs with lrNo: "${lrNo1}"...`)
    const postRes1 = await fetch("http://localhost:8443/api/db/lrs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Company-ID": compId
      },
      body: JSON.stringify({
        id: lrNo1,
        company_id: compId,
        lrNo: lrNo1,
        lr: lrNo1,
        date: new Date().toISOString().split("T")[0],
        bookingBranch: "Main HQ",
        bookingStation: "Pune",
        deliveryStation: "Mumbai",
        consignor: "ABC Traders",
        consignee: "XYZ Logistics",
        from: "Pune",
        to: "Mumbai",
        vehicle: "MH-12-AB-1234",
        driver: "Ramesh Kumar",
        article: "Textile Bales",
        packages: 10,
        packageCount: 10,
        weight: "500",
        freight: 15000,
        freightType: "To Pay",
        paymentType: "To Pay",
        status: "Booked"
      })
    })

    const postJson1 = await postRes1.json()
    console.log(`   POST 1 Response Status: ${postRes1.status}`, postJson1)

    if (postRes1.status !== 201) {
      throw new Error(`POST 1 failed with status ${postRes1.status}: ${JSON.stringify(postJson1)}`)
    }

    // Direct PostgreSQL query check
    const pgLr1 = (await pgClient.query(`SELECT id, company_id, "lrNo", status FROM demo_transport.lrs WHERE id = $1 OR "lrNo" = $1`, [lrNo1])).rows[0]
    console.log("   PostgreSQL demo_transport.lrs Record 1:", pgLr1)

    const pass1 = postRes1.status === 201 && pgLr1 && pgLr1.lrNo === lrNo1
    console.log(`   ✅ CREATE FIRST LR (lrNo: ${lrNo1}): ${pass1 ? "PASS" : "FAIL"}\n`)

    // 2. CREATE SECOND SEQUENTIAL LR via POST
    console.log(`2. Submitting CREATE SECOND LR request via POST /api/db/lrs with lrNo: "${lrNo2}"...`)
    const postRes2 = await fetch("http://localhost:8443/api/db/lrs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Company-ID": compId
      },
      body: JSON.stringify({
        id: lrNo2,
        company_id: compId,
        lrNo: lrNo2,
        lr: lrNo2,
        date: new Date().toISOString().split("T")[0],
        bookingBranch: "Main HQ",
        bookingStation: "Pune",
        deliveryStation: "Delhi",
        consignor: "ABC Traders",
        consignee: "Delhi Super Store",
        from: "Pune",
        to: "Delhi",
        vehicle: "MH-12-CD-5678",
        driver: "Suresh Kumar",
        article: "Machinery Parts",
        packages: 5,
        packageCount: 5,
        weight: "1200",
        freight: 35000,
        freightType: "Paid",
        paymentType: "Paid",
        status: "Booked"
      })
    })

    const postJson2 = await postRes2.json()
    console.log(`   POST 2 Response Status: ${postRes2.status}`, postJson2)

    const pgLr2 = (await pgClient.query(`SELECT id, company_id, "lrNo", status FROM demo_transport.lrs WHERE id = $1 OR "lrNo" = $1`, [lrNo2])).rows[0]
    console.log("   PostgreSQL demo_transport.lrs Record 2:", pgLr2)

    const pass2 = postRes2.status === 201 && pgLr2 && pgLr2.lrNo === lrNo2
    console.log(`   ✅ CREATE SECOND LR (lrNo: ${lrNo2}): ${pass2 ? "PASS" : "FAIL"}\n`)

    // 3. GET /api/db/lrs List Verification
    console.log("3. Fetching GET /api/db/lrs?companyId=COMP-DEMO-001...")
    const getRes = await fetch("http://localhost:8443/api/db/lrs?companyId=COMP-DEMO-001")
    const getList: any[] = await getRes.json()
    const found1 = getList.find(r => (r.lrNo || r.lr || r.id) === lrNo1)
    const found2 = getList.find(r => (r.lrNo || r.lr || r.id) === lrNo2)
    console.log("   Found LR 1 in List:", found1 ? found1.lrNo || found1.lr : "NO")
    console.log("   Found LR 2 in List:", found2 ? found2.lrNo || found2.lr : "NO")

    const listPass = getRes.status === 200 && Boolean(found1) && Boolean(found2)
    console.log(`   ✅ GET LR REGISTER LIST: ${listPass ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DELETE FROM demo_transport.lrs WHERE id = $1 OR "lrNo" = $1`, [lrNo1])
    await pgClient.query(`DELETE FROM demo_transport.lrs WHERE id = $1 OR "lrNo" = $1`, [lrNo2])

    console.log("==================================================")
    console.log(`LR CREATE PERSISTENCE TEST: ${pass1 && pass2 && listPass ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testLrCreateFlow()
