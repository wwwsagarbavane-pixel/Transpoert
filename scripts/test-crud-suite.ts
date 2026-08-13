import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function runCrudTestSuite() {
  console.log("==================================================")
  console.log("STARTING BACKEND CRUD CONSISTENCY TEST SUITE")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const compId = `COMP-CRUD-${Date.now().toString().substring(7)}`
  const compName = `Enterprise Trans ${Date.now().toString().substring(8)}`
  const updatedCompName = `${compName} (Edited Name)`

  try {
    // ----------------------------------------------------
    // TEST 1: COMPANY CREATE
    // ----------------------------------------------------
    console.log(`1. TEST: Company CREATE (POST /api/db/companies)...`)
    const createCompRes = await fetch("http://localhost:8443/api/db/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: compId,
        code: "ENT",
        name: compName,
        status: "active"
      })
    })

    const createCompJson = await createCompRes.json()
    console.log(`   POST Response Status: ${createCompRes.status}`, createCompJson)

    // Check PostgreSQL public.companies
    const pgCompCheck = await pgClient.query(`SELECT id, code, name, schema_name, status FROM public.companies WHERE id = $1`, [compId])
    const savedComp = pgCompCheck.rows[0]
    console.log("   PostgreSQL Saved Record:", savedComp)
    const isCompCreated = savedComp && savedComp.id === compId && savedComp.name === compName

    // Check company schema
    const schemaCheck = await pgClient.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, [savedComp?.schema_name])
    const isSchemaCreated = schemaCheck.rows.length > 0

    // ----------------------------------------------------
    // TEST 2: COMPANY INITIAL USER CREDENTIAL PERSISTENCE
    // ----------------------------------------------------
    console.log(`\n2. TEST: Company User Login Credential Persistence (POST /api/db/users)...`)
    const userId = `USR-${Date.now()}`
    const userEmail = `admin.${compId.toLowerCase()}@test.com`
    const createUserRes = await fetch("http://localhost:8443/api/db/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: userId,
        company_id: compId,
        name: "Company Admin",
        email: userEmail,
        password: "SecurePassword123",
        role: "Company Admin",
        assignedCompanies: [compId],
        status: "active"
      })
    })
    console.log(`   POST User Status: ${createUserRes.status}`, await createUserRes.json())

    // Verify User in PostgreSQL public.users (Password must be stored in PG)
    const pgUserCheck = await pgClient.query(`SELECT id, company_id, email, password, role FROM public.users WHERE id = $1`, [userId])
    const savedUser = pgUserCheck.rows[0]
    console.log("   PostgreSQL Saved User:", { ...savedUser, password: "***" })
    const isUserSaved = savedUser && savedUser.id === userId && savedUser.password === "SecurePassword123"

    // Verify GET /api/db/users DOES NOT expose plain-text password
    const getUserRes = await fetch(`http://localhost:8443/api/db/users/${userId}`)
    const getUserJson: any = await getUserRes.json()
    const passwordStrippedFromApi = getUserJson.password === undefined

    // ----------------------------------------------------
    // TEST 3: COMPANY UPDATE (MUST UPDATE SAME RECORD, NOT CREATE NEW)
    // ----------------------------------------------------
    console.log(`\n3. TEST: Company UPDATE (PUT /api/db/companies/${compId})...`)
    const countBeforeUpdate = (await pgClient.query(`SELECT count(*) FROM public.companies`)).rows[0].count

    const updateCompRes = await fetch(`http://localhost:8443/api/db/companies/${compId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: compId,
        code: "ENT",
        name: updatedCompName,
        status: "active"
      })
    })
    console.log(`   PUT Response Status: ${updateCompRes.status}`, await updateCompRes.json())

    const countAfterUpdate = (await pgClient.query(`SELECT count(*) FROM public.companies`)).rows[0].count
    const pgUpdatedCompCheck = await pgClient.query(`SELECT id, code, name, schema_name FROM public.companies WHERE id = $1`, [compId])
    const updatedComp = pgUpdatedCompCheck.rows[0]
    console.log("   PostgreSQL Updated Record:", updatedComp)

    const isCompUpdatedInPlace = updatedComp && updatedComp.id === compId && updatedComp.name === updatedCompName && updatedComp.schema_name === savedComp.schema_name
    const isCountUnchanged = countBeforeUpdate === countAfterUpdate

    // ----------------------------------------------------
    // TEST 4: PARTY CREATE VS UPDATE
    // ----------------------------------------------------
    console.log(`\n4. TEST: Party CREATE & UPDATE (Same ID)...`)
    const partyId = `PRT-${Date.now()}`
    const createPartyRes = await fetch("http://localhost:8443/api/db/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({
        id: partyId,
        company_id: compId,
        name: "Initial Party Name",
        type: "Consignor",
        creditLimit: "100000"
      })
    })
    console.log(`   POST Party Status: ${createPartyRes.status}`)

    const updatePartyRes = await fetch(`http://localhost:8443/api/db/parties/${partyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({
        id: partyId,
        company_id: compId,
        name: "Updated Party Name",
        type: "Consignor",
        creditLimit: "250000"
      })
    })
    console.log(`   PUT Party Status: ${updatePartyRes.status}`)

    const pgPartyCheck = await pgClient.query(`SELECT id, name, "creditLimit" FROM "${savedComp.schema_name}"."parties" WHERE id = $1`, [partyId])
    const updatedParty = pgPartyCheck.rows[0]
    console.log("   PostgreSQL Updated Party:", updatedParty)
    const isPartyUpdatedInPlace = updatedParty && updatedParty.id === partyId && updatedParty.name === "Updated Party Name" && updatedParty.creditLimit === "250000"

    // ----------------------------------------------------
    // TEST 5: VEHICLE & DRIVER CREATE & UPDATE
    // ----------------------------------------------------
    console.log(`\n5. TEST: Vehicle & Driver CREATE & UPDATE...`)
    const vehId = `VEH-${Date.now()}`
    await fetch("http://localhost:8443/api/db/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: vehId, company_id: compId, number: "MH-12-AB-9999", type: "10-Wheeler" })
    })
    await fetch(`http://localhost:8443/api/db/vehicles/${vehId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: vehId, company_id: compId, number: "MH-12-AB-9999", type: "Container 32ft" })
    })

    const pgVehCheck = await pgClient.query(`SELECT id, number, type FROM "${savedComp.schema_name}"."vehicles" WHERE id = $1`, [vehId])
    const isVehUpdatedInPlace = pgVehCheck.rows[0] && pgVehCheck.rows[0].id === vehId && pgVehCheck.rows[0].type === "Container 32ft"

    // ----------------------------------------------------
    // TEST 6: LR CREATE & EDIT UPDATE
    // ----------------------------------------------------
    console.log(`\n6. TEST: LR CREATE & UPDATE (Same LR ID)...`)
    const lrId = `LR-${Date.now()}`
    await fetch("http://localhost:8443/api/db/lrs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: lrId, company_id: compId, lrNo: "LR-99901", date: "2026-08-10", freight: 5000, totalAmount: 5500 })
    })
    await fetch(`http://localhost:8443/api/db/lrs/${lrId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: lrId, company_id: compId, lrNo: "LR-99901", date: "2026-08-10", freight: 7500, totalAmount: 8250 })
    })

    const pgLrCheck = await pgClient.query(`SELECT id, "lrNo", freight, "totalAmount" FROM "${savedComp.schema_name}"."lrs" WHERE id = $1`, [lrId])
    const isLrUpdatedInPlace = pgLrCheck.rows[0] && pgLrCheck.rows[0].id === lrId && pgLrCheck.rows[0].freight === 7500

    // ----------------------------------------------------
    // TEST 7: INVALID UPDATE (RETURN 404 NOT FOUND)
    // ----------------------------------------------------
    console.log(`\n7. TEST: PUT with Non-Existent ID returns 404...`)
    const invalidPutRes = await fetch("http://localhost:8443/api/db/parties/NON-EXISTENT-ID-99999", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({ id: "NON-EXISTENT-ID-99999", company_id: compId, name: "Test" })
    })
    console.log(`   Invalid PUT Status: ${invalidPutRes.status} (Expected 404)`)
    const is404Working = invalidPutRes.status === 404

    console.log("\n==================================================")
    console.log("FINAL BACKEND CRUD CONSISTENCY VERIFICATION SUMMARY")
    console.log("==================================================")
    console.log(`1. Company CREATE                    : ${isCompCreated ? "PASS" : "FAIL"}`)
    console.log(`2. Company Schema Provisioned        : ${isSchemaCreated ? "PASS (" + savedComp?.schema_name + ")" : "FAIL"}`)
    console.log(`3. User Login Credential Persistence : ${isUserSaved ? "PASS" : "FAIL"}`)
    console.log(`4. API Password Security Stripped    : ${passwordStrippedFromApi ? "PASS" : "FAIL"}`)
    console.log(`5. Company UPDATE (Same ID)          : ${isCompUpdatedInPlace ? "PASS" : "FAIL"}`)
    console.log(`6. Company Count Preserved           : ${isCountUnchanged ? "PASS" : "FAIL"}`)
    console.log(`7. Party UPDATE (Same ID)            : ${isPartyUpdatedInPlace ? "PASS" : "FAIL"}`)
    console.log(`8. Vehicle UPDATE (Same ID)          : ${isVehUpdatedInPlace ? "PASS" : "FAIL"}`)
    console.log(`9. LR EDIT UPDATE (Same LR ID)       : ${isLrUpdatedInPlace ? "PASS" : "FAIL"}`)
    console.log(`10. Invalid PUT Returns 404          : ${is404Working ? "PASS" : "FAIL"}`)
    console.log("==================================================\n")

    // Clean up test verification record
    if (savedComp?.schema_name) {
      await pgClient.query(`DROP SCHEMA IF EXISTS "${savedComp.schema_name}" CASCADE`)
    }
    await pgClient.query(`DELETE FROM public.users WHERE id = $1`, [userId])
    await pgClient.query(`DELETE FROM public.companies WHERE id = $1`, [compId])

  } catch (err) {
    console.error("CRUD Test Suite Error:", err)
  } finally {
    await pgClient.end()
  }
}

runCrudTestSuite()
