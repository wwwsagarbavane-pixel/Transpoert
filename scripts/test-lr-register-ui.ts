import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testLrRegisterUi() {
  console.log("==================================================")
  console.log("TESTING LR REGISTER API RESPONSE & lrNo MAPPER")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const testLrNo = `ABD-LR-${Date.now().toString().slice(-6)}`
  const compId = "COMP-DEMO-001"

  try {
    // 1. Create a test LR via POST /api/db/lrs
    console.log(`1. Creating Test LR with lrNo: "${testLrNo}"...`)
    const postRes = await fetch("http://localhost:8443/api/db/lrs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Company-ID": compId
      },
      body: JSON.stringify({
        id: testLrNo,
        company_id: compId,
        lrNo: testLrNo,
        lr: testLrNo,
        date: "2026-08-10",
        bookingBranch: "Pune Branch",
        bookingStation: "Pune",
        deliveryStation: "Mumbai",
        consignor: "Star Industries",
        consignee: "Moon Retailers",
        from: "Pune",
        to: "Mumbai",
        vehicle: "MH-14-EF-9999",
        freight: 25000,
        freightType: "Paid",
        status: "Booked"
      })
    })

    console.log("   Create Status:", postRes.status)

    // 2. Fetch GET /api/db/lrs?companyId=COMP-DEMO-001 (Simulating LR Register load)
    console.log("\n2. Fetching GET /api/db/lrs?companyId=COMP-DEMO-001...")
    const getRes = await fetch(`http://localhost:8443/api/db/lrs?companyId=${compId}`)
    const lrsList: any[] = await getRes.json()

    console.log("   Total LRs in Register:", lrsList.length)
    const targetLr = lrsList.find(r => r.lrNo === testLrNo || r.lr === testLrNo || r.id === testLrNo)
    console.log("   Found Saved LR Record:", targetLr)

    const passLrNo = targetLr && (targetLr.lrNo === testLrNo || targetLr.lr === testLrNo)
    const passStatus = targetLr && (targetLr.status === "Booked" || targetLr.status === "booked")

    console.log(`\n   ✅ LR NUMBER VISIBLE IN API RESPONSE (lrNo: ${testLrNo}): ${passLrNo ? "PASS" : "FAIL"}`)
    console.log(`   ✅ STATUS DISPLAY ("Booked"): ${passStatus ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DELETE FROM demo_transport.lrs WHERE id = $1 OR "lrNo" = $1`, [testLrNo])

    console.log("==================================================")
    console.log(`LR REGISTER UI VERIFICATION: ${passLrNo && passStatus ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testLrRegisterUi()
