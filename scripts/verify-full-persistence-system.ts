import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function verifyFullPersistenceSystem() {
  console.log("==================================================")
  console.log("STARTING FULL POSTGRESQL CRUD PERSISTENCE SYSTEM TEST")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const compId = `COMP-SYS-${Date.now().toString().substring(7)}`
  const compName = `System Trans Logistics ${Date.now().toString().substring(8)}`
  const updatedCompName = `${compName} (Renamed)`

  const results: Record<string, string> = {}

  try {
    // ----------------------------------------------------
    // 1. COMPANY CRUD
    // ----------------------------------------------------
    console.log("1. Testing COMPANY CREATE & UPDATE...")
    const postCompRes = await fetch("http://localhost:8443/api/db/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: compId, code: "SYS", name: compName, status: "active" })
    })
    const compPostJson = await postCompRes.json()

    const pgComp1 = (await pgClient.query(`SELECT id, name, schema_name FROM public.companies WHERE id = $1`, [compId])).rows[0]
    const schemaName = pgComp1?.schema_name

    // Update Company
    await fetch(`http://localhost:8443/api/db/companies/${compId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: compId, code: "SYS", name: updatedCompName, status: "active" })
    })
    const pgComp2 = (await pgClient.query(`SELECT id, name, schema_name FROM public.companies WHERE id = $1`, [compId])).rows[0]

    results["1. Company CREATE/UPDATE"] = (pgComp1 && pgComp2 && pgComp2.name === updatedCompName && pgComp2.schema_name === schemaName) ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 2. USER CRUD
    // ----------------------------------------------------
    console.log("2. Testing USER CREATE & UPDATE...")
    const userId = `USR-${Date.now()}`
    await fetch("http://localhost:8443/api/db/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, company_id: compId, name: "System Admin", email: `sys.${compId.toLowerCase()}@test.com`, password: "Pass@123", role: "Company Admin", status: "active" })
    })
    await fetch(`http://localhost:8443/api/db/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, company_id: compId, name: "System Admin (Updated)", email: `sys.${compId.toLowerCase()}@test.com`, password: "Pass@123", role: "Company Admin", status: "active" })
    })
    const pgUser = (await pgClient.query(`SELECT id, name, password FROM public.users WHERE id = $1`, [userId])).rows[0]
    results["2. User Credentials & UPDATE"] = (pgUser && pgUser.name === "System Admin (Updated)" && pgUser.password === "Pass@123") ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 3. BRANCH CRUD
    // ----------------------------------------------------
    console.log("3. Testing BRANCH CREATE & UPDATE...")
    const brId = `BR-${Date.now()}`
    await fetch("http://localhost:8443/api/db/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: brId, company_id: compId, code: "MUM", name: "Mumbai Branch", city: "Mumbai", state: "MH" })
    })
    await fetch(`http://localhost:8443/api/db/branches/${brId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: brId, company_id: compId, code: "MUM", name: "Mumbai Main Branch", city: "Mumbai", state: "MH" })
    })
    const pgBr = (await pgClient.query(`SELECT id, name FROM "${schemaName}"."branches" WHERE id = $1`, [brId])).rows[0]
    results["3. Branch CREATE/UPDATE"] = (pgBr && pgBr.name === "Mumbai Main Branch") ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 4. PARTY CRUD
    // ----------------------------------------------------
    console.log("4. Testing PARTY CREATE & UPDATE...")
    const prtId = `PRT-${Date.now()}`
    await fetch("http://localhost:8443/api/db/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: prtId, company_id: compId, name: "Alpha Traders", type: "Consignor", creditLimit: "100000" })
    })
    await fetch(`http://localhost:8443/api/db/parties/${prtId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: prtId, company_id: compId, name: "Alpha Traders Pvt Ltd", type: "Consignor", creditLimit: "300000" })
    })
    const pgPrt = (await pgClient.query(`SELECT id, name, "creditLimit" FROM "${schemaName}"."parties" WHERE id = $1`, [prtId])).rows[0]
    results["4. Party CREATE/UPDATE"] = (pgPrt && pgPrt.name === "Alpha Traders Pvt Ltd" && pgPrt.creditLimit === "300000") ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 5. VEHICLE CRUD
    // ----------------------------------------------------
    console.log("5. Testing VEHICLE CREATE & UPDATE...")
    const vehId = `VEH-${Date.now()}`
    await fetch("http://localhost:8443/api/db/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: vehId, company_id: compId, number: "MH-04-XX-1111", type: "Container" })
    })
    await fetch(`http://localhost:8443/api/db/vehicles/${vehId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: vehId, company_id: compId, number: "MH-04-XX-1111", type: "Container 32ft" })
    })
    const pgVeh = (await pgClient.query(`SELECT id, type FROM "${schemaName}"."vehicles" WHERE id = $1`, [vehId])).rows[0]
    results["5. Vehicle CREATE/UPDATE"] = (pgVeh && pgVeh.type === "Container 32ft") ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 6. DRIVER CRUD
    // ----------------------------------------------------
    console.log("6. Testing DRIVER CREATE & UPDATE...")
    const drvId = `DRV-${Date.now()}`
    await fetch("http://localhost:8443/api/db/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: drvId, company_id: compId, name: "Rajesh Kumar", mobile: "9876543210" })
    })
    await fetch(`http://localhost:8443/api/db/drivers/${drvId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: drvId, company_id: compId, name: "Rajesh Kumar", mobile: "9998887770" })
    })
    const pgDrv = (await pgClient.query(`SELECT id, mobile FROM "${schemaName}"."drivers" WHERE id = $1`, [drvId])).rows[0]
    results["6. Driver CREATE/UPDATE"] = (pgDrv && pgDrv.mobile === "9998887770") ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 7. OWNER CRUD
    // ----------------------------------------------------
    console.log("7. Testing OWNER CREATE & UPDATE...")
    const ownId = `OWN-${Date.now()}`
    await fetch("http://localhost:8443/api/db/owners", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: ownId, company_id: compId, name: "Fleet Owners Co", mobile: "9820011223" })
    })
    await fetch(`http://localhost:8443/api/db/owners/${ownId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: ownId, company_id: compId, name: "Fleet Owners Logistics", mobile: "9820011223" })
    })
    const pgOwn = (await pgClient.query(`SELECT id, name FROM "${schemaName}"."owners" WHERE id = $1`, [ownId])).rows[0]
    results["7. Owner CREATE/UPDATE"] = (pgOwn && pgOwn.name === "Fleet Owners Logistics") ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 8. AGENT CRUD
    // ----------------------------------------------------
    console.log("8. Testing AGENT CREATE & UPDATE...")
    const agtId = `AGT-${Date.now()}`
    await fetch("http://localhost:8443/api/db/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: agtId, company_id: compId, name: "Global Freight Agent", commission: "2.5" })
    })
    await fetch(`http://localhost:8443/api/db/agents/${agtId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: agtId, company_id: compId, name: "Global Freight Agent", commission: "3.5" })
    })
    const pgAgt = (await pgClient.query(`SELECT id, commission FROM "${schemaName}"."agents" WHERE id = $1`, [agtId])).rows[0]
    results["8. Agent CREATE/UPDATE"] = (pgAgt && pgAgt.commission === "3.5") ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 9. STATION CRUD
    // ----------------------------------------------------
    console.log("9. Testing STATION CREATE & UPDATE...")
    const stnId = `STN-${Date.now()}`
    await fetch("http://localhost:8443/api/db/stations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: stnId, company_id: compId, name: "Nagpur Hub", city: "Nagpur", state: "MH" })
    })
    await fetch(`http://localhost:8443/api/db/stations/${stnId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: stnId, company_id: compId, name: "Nagpur Terminal", city: "Nagpur", state: "MH" })
    })
    const pgStn = (await pgClient.query(`SELECT id, name FROM "${schemaName}"."stations" WHERE id = $1`, [stnId])).rows[0]
    results["9. Station CREATE/UPDATE"] = (pgStn && pgStn.name === "Nagpur Terminal") ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 10. ARTICLE CRUD
    // ----------------------------------------------------
    console.log("10. Testing ARTICLE CREATE & UPDATE...")
    const artId = `ART-${Date.now()}`
    await fetch("http://localhost:8443/api/db/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: artId, company_id: compId, name: "Steel Pipes", unit: "Tons" })
    })
    await fetch(`http://localhost:8443/api/db/articles/${artId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: artId, company_id: compId, name: "Steel TMT Bars", unit: "Tons" })
    })
    const pgArt = (await pgClient.query(`SELECT id, name FROM "${schemaName}"."articles" WHERE id = $1`, [artId])).rows[0]
    results["10. Article CREATE/UPDATE"] = (pgArt && pgArt.name === "Steel TMT Bars") ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 11. LR CRUD (Testing /lr Endpoint Normalization)
    // ----------------------------------------------------
    console.log("11. Testing LR CREATE & UPDATE (via /lr Endpoint)...")
    const lrId = `LR-${Date.now()}`
    const postLrRes = await fetch("http://localhost:8443/api/db/lr", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: lrId, company_id: compId, lrNo: "LR-77001", date: "2026-08-10", freight: 12000, totalAmount: 13200 })
    })
    await fetch(`http://localhost:8443/api/db/lr/${lrId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: lrId, company_id: compId, lrNo: "LR-77001", date: "2026-08-10", freight: 15000, totalAmount: 16500 })
    })
    const pgLr = (await pgClient.query(`SELECT id, "lrNo", freight, "totalAmount" FROM "${schemaName}"."lrs" WHERE id = $1`, [lrId])).rows[0]
    results["11. LR Endpoint & UPDATE"] = (postLrRes.status === 201 && pgLr && pgLr.freight === 15000) ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 12. DELIVERY CRUD
    // ----------------------------------------------------
    console.log("12. Testing DELIVERY CREATE & UPDATE...")
    const delId = `DEL-${Date.now()}`
    await fetch("http://localhost:8443/api/db/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: delId, company_id: compId, lrNo: "LR-77001", date: "2026-08-10", deliveredTo: "Amit Shah", status: "Delivered" })
    })
    await fetch(`http://localhost:8443/api/db/deliveries/${delId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: delId, company_id: compId, lrNo: "LR-77001", date: "2026-08-10", deliveredTo: "Amit Shah (Signed)", status: "Delivered" })
    })
    const pgDel = (await pgClient.query(`SELECT id, "deliveredTo" FROM "${schemaName}"."deliveries" WHERE id = $1`, [delId])).rows[0]
    results["12. Delivery CREATE/UPDATE"] = (pgDel && pgDel.deliveredTo === "Amit Shah (Signed)") ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 13. BILL CRUD
    // ----------------------------------------------------
    console.log("13. Testing BILL CREATE & UPDATE...")
    const billId = `BIL-${Date.now()}`
    await fetch("http://localhost:8443/api/db/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: billId, company_id: compId, billNo: "INV-9001", billDate: "2026-08-10", party: "Alpha Traders", amount: 15000, totalAmount: 16500 })
    })
    await fetch(`http://localhost:8443/api/db/bills/${billId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: billId, company_id: compId, billNo: "INV-9001", billDate: "2026-08-10", party: "Alpha Traders", amount: 18000, totalAmount: 19800 })
    })
    const pgBill = (await pgClient.query(`SELECT id, amount, "totalAmount" FROM "${schemaName}"."bills" WHERE id = $1`, [billId])).rows[0]
    results["13. Bill CREATE/UPDATE"] = (pgBill && pgBill.amount === 18000) ? "PASS" : "FAIL"

    // ----------------------------------------------------
    // 14. PAYMENT CRUD
    // ----------------------------------------------------
    console.log("14. Testing PAYMENT CREATE & UPDATE...")
    const payId = `PAY-${Date.now()}`
    await fetch("http://localhost:8443/api/db/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: payId, company_id: compId, receiptNo: "REC-101", billNo: "INV-9001", date: "2026-08-10", party: "Alpha Traders", amount: 5000, mode: "Cash" })
    })
    await fetch(`http://localhost:8443/api/db/payments/${payId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: payId, company_id: compId, receiptNo: "REC-101", billNo: "INV-9001", date: "2026-08-10", party: "Alpha Traders", amount: 10000, mode: "UPI" })
    })
    const pgPay = (await pgClient.query(`SELECT id, amount, mode FROM "${schemaName}"."payments" WHERE id = $1`, [payId])).rows[0]
    results["14. Payment CREATE/UPDATE"] = (pgPay && pgPay.amount === 10000 && pgPay.mode === "UPI") ? "PASS" : "FAIL"

    console.log("\n==================================================")
    console.log("POSTGRESQL SYSTEM-WIDE CRUD PERSISTENCE SUMMARY")
    console.log("==================================================")
    Object.entries(results).forEach(([test, status]) => {
      console.log(`${test.padEnd(36)} : ${status}`)
    })
    console.log("==================================================\n")

    // Cleanup test company & schema
    await pgClient.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
    await pgClient.query(`DELETE FROM public.users WHERE id = $1`, [userId])
    await pgClient.query(`DELETE FROM public.companies WHERE id = $1`, [compId])

  } catch (err) {
    console.error("System Verification Error:", err)
  } finally {
    await pgClient.end()
  }
}

verifyFullPersistenceSystem()
