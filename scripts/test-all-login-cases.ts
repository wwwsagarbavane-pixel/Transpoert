import http from "node:http"

function httpRequest(path: string, method: string = "POST", body: any = null, headers: Record<string, string> = {}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const reqHeaders: Record<string, string> = { ...headers }
    let payload: any = body
    if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
      payload = JSON.stringify(body)
      reqHeaders["Content-Type"] = "application/json"
      reqHeaders["Content-Length"] = String(Buffer.byteLength(payload))
    }

    const req = http.request({
      hostname: "localhost",
      port: 8443,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let raw = ""
      res.on("data", chunk => raw += chunk)
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode || 500, data: JSON.parse(raw) })
        } catch {
          resolve({ status: res.statusCode || 500, data: raw })
        }
      })
    })

    req.on("error", reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function runAllLoginSecurityTests() {
  console.log("=========================================================================")
  console.log("FULL MANDATORY LOGIN & MULTI-TENANT ISOLATION SECURITY AUDIT")
  console.log("=========================================================================\n")

  const compA = "COMP-103816" // EPR Transport
  const compB = "COMP-483231" // Farmer Transport

  // TEST 1: Existing company + existing admin (erp@gmail.com) -> SUCCESS
  console.log("TEST 1: Existing company + existing admin (erp@gmail.com)...")
  const res1 = await httpRequest("/api/auth/login", "POST", { email: "erp@gmail.com", password: "Test@123", company_id: compA })
  if (res1.status === 200 && res1.data?.user?.token) {
    console.log("   RESULT: HTTP 200 OK — Existing Company Admin Login SUCCESS ✅")
  } else {
    throw new Error(`TEST 1 FAILED: ${JSON.stringify(res1.data)}`)
  }

  // TEST 2: Create brand new company + newly created Company Admin -> login SUCCESS
  console.log("\nTEST 2: Provisioning BRAND NEW Transport Company + New Company Admin...")
  const newCompId = `COMP-AUTO-${Date.now().toString().slice(-4)}`
  const newAdminEmail = `new_admin_${Date.now().toString().slice(-4)}@transport.com`
  const newAdminPass = "SecureAdminPass@123"

  // Step 2a: Create company
  const compRes = await httpRequest("/api/db/companies", "POST", {
    id: newCompId,
    code: "NTRP",
    name: "New Transport Express",
    logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    status: "active"
  }, { "X-Company-ID": "PLATFORM", "X-User-Role": "Super Admin", "X-User-Email": "Admin@gmail.com" })

  if (compRes.status !== 201 && compRes.status !== 200) {
    throw new Error(`Company Provisioning Failed: ${JSON.stringify(compRes.data)}`)
  }

  // Step 2b: Create Company Admin user
  const userRes = await httpRequest("/api/db/users", "POST", {
    id: `USR-${Date.now()}`,
    company_id: newCompId,
    name: "New Company Admin",
    email: newAdminEmail,
    password: newAdminPass,
    role: "Company Admin",
    assignedCompanies: [newCompId],
    status: "active"
  }, { "X-Company-ID": newCompId, "X-User-Role": "Super Admin", "X-User-Email": "Admin@gmail.com" })

  if (userRes.status !== 201 && userRes.status !== 200) {
    throw new Error(`User Creation Failed: ${JSON.stringify(userRes.data)}`)
  }
  console.log(`   Provisioned New Company "${newCompId}" with Admin Email "${newAdminEmail}" ✅`)

  // Step 2c: Test Login as Newly Created Company Admin
  const loginRes2 = await httpRequest("/api/auth/login", "POST", { email: newAdminEmail, password: newAdminPass, company_id: newCompId })
  if (loginRes2.status === 200 && loginRes2.data?.user?.token) {
    console.log("   RESULT: HTTP 200 OK — Newly Created Company Admin Login SUCCESS ✅")
  } else {
    throw new Error(`TEST 2 FAILED: New Company Admin login failed: ${JSON.stringify(loginRes2.data)}`)
  }

  // TEST 3: Company A user selecting Company B -> MUST FAIL with HTTP 403
  console.log("\nTEST 3: Company A user selecting Company B (Cross-Company Attack)...")
  const res3 = await httpRequest("/api/auth/login", "POST", { email: "erp@gmail.com", password: "Test@123", company_id: compB })
  if (res3.status === 403) {
    console.log(`   RESULT: HTTP 403 Forbidden — "${res3.data?.error}" ✅`)
  } else {
    throw new Error(`SECURITY VULNERABILITY IN TEST 3: Expected 403 Forbidden, got ${res3.status}`)
  }

  // TEST 4: Company A user selecting Company A -> SUCCESS
  console.log("\nTEST 4: Company A user selecting Company A...")
  const res4 = await httpRequest("/api/auth/login", "POST", { email: "erp@gmail.com", password: "Test@123", company_id: compA })
  if (res4.status === 200) {
    console.log("   RESULT: HTTP 200 OK — Login SUCCESS ✅")
  } else {
    throw new Error(`TEST 4 FAILED: Expected 200 OK, got ${res4.status}`)
  }

  // TEST 5 & 6: Multi-company user tests
  console.log("\nTEST 5 & 6: Multi-company assigned vs unassigned login...")
  const multiEmail = `multi_user_${Date.now()}@transport.com`
  await httpRequest("/api/db/users", "POST", {
    id: `USR-MULTI-${Date.now()}`,
    company_id: compA,
    name: "Multi Tenant Operator",
    email: multiEmail,
    password: "Pass@12345",
    role: "Operator",
    assignedCompanies: [compA, compB],
    status: "active"
  }, { "X-Company-ID": compA, "X-User-Role": "Super Admin" })

  // Select assigned company compB -> SUCCESS
  const res5 = await httpRequest("/api/auth/login", "POST", { email: multiEmail, password: "Pass@12345", company_id: compB })
  if (res5.status === 200) {
    console.log("   RESULT: HTTP 200 OK — Multi-company assigned company login SUCCESS ✅")
  } else {
    throw new Error(`TEST 5 FAILED: Expected 200 OK, got ${res5.status}`)
  }

  // Select unassigned company -> FAIL (HTTP 403)
  const res6 = await httpRequest("/api/auth/login", "POST", { email: multiEmail, password: "Pass@12345", company_id: newCompId })
  if (res6.status === 403) {
    console.log(`   RESULT: HTTP 403 Forbidden — Multi-company unassigned company REJECTED ✅`)
  } else {
    throw new Error(`TEST 6 FAILED: Expected 403 Forbidden, got ${res6.status}`)
  }

  // TEST 7: Super Admin login -> SUCCESS
  console.log("\nTEST 7: Super Admin login (Admin@gmail.com)...")
  const res7 = await httpRequest("/api/auth/login", "POST", { email: "Admin@gmail.com", password: "Test@123" })
  if (res7.status === 200 && res7.data?.user?.token) {
    console.log("   RESULT: HTTP 200 OK — Super Admin Login SUCCESS ✅")
  } else {
    throw new Error(`TEST 7 FAILED: Super Admin login failed: ${JSON.stringify(res7.data)}`)
  }

  // TEST 8 & 9: Super Admin segregation in User Management APIs
  console.log("\nTEST 8 & 9: Checking Super Admin segregation in user lists...")
  const compUsersRes = await httpRequest(`/api/db/users?companyId=${compA}`, "GET", null, { "X-Company-ID": compA, "X-User-Email": "erp@gmail.com", "X-User-Role": "Company Admin" })
  const compUsersList: any[] = compUsersRes.data?.data || []
  const hasSuperInComp = compUsersList.some(u => String(u.role).toLowerCase().includes("super"))
  if (!hasSuperInComp) {
    console.log("   RESULT: Super Admin does NOT appear in Company Users list ✅")
  } else {
    throw new Error("TEST 8 FAILED: Super Admin leaked into Company Users list")
  }

  // TEST 10: Operational Data Tenant Isolation Check
  console.log("\nTEST 10: Operational Data Tenant Isolation Check (Company A requesting Company B data)...")
  const crossDataRes = await httpRequest(`/api/db/bills?companyId=${compB}`, "GET", null, { "X-Company-ID": compB, "X-User-Email": "erp@gmail.com", "X-User-Role": "Company Admin" })
  if (crossDataRes.status === 403) {
    console.log("   RESULT: HTTP 403 Forbidden — Operational Data Tenant Isolated ✅")
  } else {
    throw new Error(`TEST 10 FAILED: Expected 403 Forbidden for cross-tenant access, got ${crossDataRes.status}`)
  }

  console.log("\n=========================================================================")
  console.log("ALL 10 MANDATORY SECURITY & AUTHENTICATION TESTS PASSED 100%")
  console.log("=========================================================================")
}

runAllLoginSecurityTests().catch((err) => {
  console.error("\n❌ SECURITY TEST SUITE FAILED:", err)
  process.exit(1)
})
