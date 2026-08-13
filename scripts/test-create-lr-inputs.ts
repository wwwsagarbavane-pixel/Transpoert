import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testCreateLRInputs() {
  console.log("==================================================")
  console.log("TESTING CREATE LR FORM INPUTS & DROPDOWN SELECTIONS")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const compId = "COMP-DEMO-001"
  const schemaName = "demo_transport"
  const testLrNo = `LR-TEST-${Date.now().toString().slice(-6)}`

  try {
    // 1. Fetch Company Branches
    console.log(`1. Fetching Branches for company "${compId}"...`)
    const branchRes = await fetch(`http://localhost:8443/api/db/branches?companyId=${compId}`)
    const branches: any[] = await branchRes.json()
    console.log(`   Found ${branches.length} branches:`, branches.map(b => b.name))

    // 2. Fetch Company Parties
    console.log(`2. Fetching Parties for company "${compId}"...`)
    const partyRes = await fetch(`http://localhost:8443/api/db/parties?companyId=${compId}`)
    const parties: any[] = await partyRes.json()
    console.log(`   Found ${parties.length} parties:`, parties.map(p => p.name))

    // 3. Fetch Company Vehicles
    console.log(`3. Fetching Vehicles for company "${compId}"...`)
    const vehicleRes = await fetch(`http://localhost:8443/api/db/vehicles?companyId=${compId}`)
    const vehicles: any[] = await vehicleRes.json()
    console.log(`   Found ${vehicles.length} vehicles:`, vehicles.map(v => v.number))

    // Select master values or create test fallbacks
    const selectedBranch = branches[0]?.name || "Main HQ"
    const selectedConsignor = parties[0]?.name || "Consignor Logistics Ltd"
    const selectedConsignee = parties[1]?.name || parties[0]?.name || "Consignee Enterprises"
    const selectedVehicle = vehicles[0]?.number || "MH-12-AB-1234"

    // 4. Create LR Payload
    console.log(`\n4. Submitting Create LR with selected options (${testLrNo})...`)
    const lrPayload = {
      company_id: compId,
      lrNo: testLrNo,
      lr: testLrNo,
      date: new Date().toISOString().split("T")[0],
      bookingBranch: selectedBranch,
      branch: selectedBranch,
      bookingStation: "Mumbai",
      deliveryStation: "Nagpur",
      from: "Mumbai",
      to: "Nagpur",
      consignor: selectedConsignor,
      consignee: selectedConsignee,
      bill_to: "Consignor",
      vehicle: selectedVehicle,
      driver: "Ramesh Driver",
      article: "Cotton Bales",
      packageCount: 50,
      no_of_articles: 50,
      rate: 100,
      weight_in_kgs: 2500,
      freightType: "To Pay",
      freight_type: "To Pay",
      freight: 5000,
      freight_amount: 5000,
      advance: 1000,
      advance_amount: 1000,
      hamali: 200,
      balance: 4200,
      balance_amount: 4200,
      status: "Booked"
    }

    const createRes = await fetch("http://localhost:8443/api/db/lrs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Company-ID": compId
      },
      body: JSON.stringify(lrPayload)
    })

    console.log("   Create LR Response Status:", createRes.status)

    // 5. Verify PostgreSQL record insertion in schema.lrs
    const pgLR = (await pgClient.query(
      `SELECT * FROM "${schemaName}"."lrs" WHERE "lrNo" = $1 OR "lr" = $1`,
      [testLrNo]
    )).rows[0]

    console.log("   PostgreSQL Saved LR Record:", pgLR)

    const createPass = createRes.status === 201 && pgLR &&
                       (pgLR.lrNo === testLrNo || pgLR.lr === testLrNo) &&
                       (pgLR.freightType === "To Pay" || pgLR.freight_type === "To Pay")

    console.log(`   ✅ CREATE LR POSTGRESQL INSERT & SELECTION: ${createPass ? "PASS" : "FAIL"}\n`)

    // 6. Fetch LR Register List
    console.log("6. Verifying LR appears in LR Register GET API...")
    const listRes = await fetch(`http://localhost:8443/api/db/lrs?companyId=${compId}`)
    const allLrs: any[] = await listRes.json()
    const foundInList = allLrs.find(l => l.lrNo === testLrNo || l.lr === testLrNo)

    console.log("   Found in LR Register List:", foundInList?.lrNo || foundInList?.lr)
    const listPass = foundInList && foundInList.consignor === selectedConsignor

    console.log(`   ✅ LR APPEARS IN REGISTER WITH SELECTED VALUES: ${listPass ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DELETE FROM "${schemaName}"."lrs" WHERE id = $1 OR "lrNo" = $2`, [pgLR.id, testLrNo])

    console.log("==================================================")
    console.log(`CREATE LR INPUTS TEST: ${createPass && listPass ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testCreateLRInputs()
