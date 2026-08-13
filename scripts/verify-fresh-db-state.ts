import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function verifyFreshDbState() {
  console.log("==================================================")
  console.log("STARTING DIRECT POSTGRESQL VERIFICATION OF RESET STATE")
  console.log("==================================================\n")

  const client = new Client({ connectionString })
  await client.connect()

  const verifications: Record<string, string> = {}

  try {
    // 1. Company Count
    const compRes = await client.query(`SELECT id, code, name, schema_name FROM public.companies`)
    const companies = compRes.rows
    console.log("1. Companies in public.companies:", companies)
    verifications["1. Exactly 1 Demo Company"] = (companies.length === 1 && companies[0].name === "Demo Transport" && companies[0].schema_name === "demo_transport") ? "PASS" : "FAIL"

    // 2. Super Admin Count
    const superAdminRes = await client.query(`SELECT id, name, email, role FROM public.users WHERE role IN ('SUPER_ADMIN', 'Super Admin')`)
    const superAdmins = superAdminRes.rows
    console.log("2. Super Admins in public.users:", superAdmins)
    verifications["2. Exactly 1 Super Admin"] = (superAdmins.length === 1 && superAdmins[0].email === "Admin@gmail.com") ? "PASS" : "FAIL"

    // 3. Demo User Count
    const demoUserRes = await client.query(`SELECT id, name, email, role, company_id FROM public.users WHERE email = 'demo@gmail.com'`)
    const demoUsers = demoUserRes.rows
    console.log("3. Demo Users in public.users:", demoUsers)
    verifications["3. Exactly 1 Demo Company User"] = (demoUsers.length === 1 && demoUsers[0].company_id === companies[0].id) ? "PASS" : "FAIL"

    // 4. Schema List
    const schemaRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('public', 'pg_catalog', 'information_schema') 
        AND schema_name NOT LIKE 'pg_%'
    `)
    const appSchemas = schemaRes.rows.map(r => r.schema_name)
    console.log("4. Non-public Application Schemas:", appSchemas)
    verifications["4. Zero Old Schemas (Only demo_transport)"] = (appSchemas.length === 1 && appSchemas[0] === "demo_transport") ? "PASS" : "FAIL"

    // 5. demo_transport Tables & Records
    const tablesRes = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'demo_transport'`)
    const demoTables = tablesRes.rows.map(r => r.table_name)
    console.log(`5. Tables in "demo_transport" (${demoTables.length} tables):`, demoTables)
    verifications["5. demo_transport 12 Business Tables"] = (demoTables.length >= 12) ? "PASS" : "FAIL"

    // 6. Test Login Endpoints via API
    console.log("\n6. Testing Login API Endpoints...")
    const adminLoginRes = await fetch("http://localhost:8443/api/db/users")
    const usersList: any[] = await adminLoginRes.json()
    const foundAdmin = usersList.find((u: any) => u.email === "Admin@gmail.com")
    const foundDemo = usersList.find((u: any) => u.email === "demo@gmail.com")

    verifications["6. Super Admin Account Accessible"] = (foundAdmin && foundAdmin.role === "SUPER_ADMIN") ? "PASS" : "FAIL"
    verifications["7. Demo User Account Accessible"] = (foundDemo && foundDemo.email === "demo@gmail.com") ? "PASS" : "FAIL"

    // 7. Test CRUD Persistence on demo_transport
    console.log("\n7. Testing Fresh CRUD Persistence on demo_transport...")
    const prtId = `PRT-FRESH-${Date.now()}`
    const postRes = await fetch("http://localhost:8443/api/db/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": companies[0].id },
      body: JSON.stringify({ id: prtId, company_id: companies[0].id, name: "Fresh Demo Party", type: "Consignor" })
    })
    const postSuccess = postRes.status === 201

    await fetch(`http://localhost:8443/api/db/parties/${prtId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": companies[0].id },
      body: JSON.stringify({ id: prtId, company_id: companies[0].id, name: "Fresh Demo Party (Updated)", type: "Consignor" })
    })

    const pgPrt = (await client.query(`SELECT id, name FROM demo_transport.parties WHERE id = $1`, [prtId])).rows[0]
    verifications["8. Fresh CRUD In-Place Persistence"] = (postSuccess && pgPrt && pgPrt.name === "Fresh Demo Party (Updated)") ? "PASS" : "FAIL"

    // Cleanup test party
    await client.query(`DELETE FROM demo_transport.parties WHERE id = $1`, [prtId])

    console.log("\n==================================================")
    console.log("FINAL DIRECT POSTGRESQL VERIFICATION SUMMARY")
    console.log("==================================================")
    Object.entries(verifications).forEach(([test, status]) => {
      console.log(`${test.padEnd(45)} : ${status}`)
    })
    console.log("==================================================\n")

  } catch (err) {
    console.error("Verification error:", err)
  } finally {
    await client.end()
  }
}

verifyFreshDbState()
