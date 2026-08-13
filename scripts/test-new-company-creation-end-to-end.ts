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

async function testNewCompanyCreation() {
  console.log("=========================================================================")
  console.log("TESTING BRAND NEW COMPANY CREATION + STATIONS & ADMIN USER PROVISIONING")
  console.log("=========================================================================\n")

  const timestamp = Date.now().toString().slice(-4)
  const newCompId = `COMP-NEW-${timestamp}`
  const newCompName = `Brand New Transport ${timestamp}`
  const newAdminEmail = `brand_new_admin_${timestamp}@transport.com`

  console.log(`1. Creating New Company "${newCompName}" (${newCompId})...`)
  const compRes = await httpRequest("/api/db/companies", "POST", {
    id: newCompId,
    code: `BN${timestamp}`,
    name: newCompName,
    city: "Mumbai",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  if (compRes.status !== 201 && compRes.status !== 200) {
    throw new Error(`Company creation failed: ${JSON.stringify(compRes.data)}`)
  }
  console.log("   Company created in PostgreSQL public.companies ✅")

  console.log(`\n2. Creating Head Office Station for "${newCompId}" (relation check)...`)
  const stnRes = await httpRequest("/api/db/stations", "POST", {
    id: `STN-${newCompId}-HO`,
    company_id: newCompId,
    name: "Head Office Station",
    city: "Mumbai",
    state: "Maharashtra",
    type: "Branch",
    status: "active"
  })

  if (stnRes.status !== 201 && stnRes.status !== 200) {
    throw new Error(`Station creation failed: ${JSON.stringify(stnRes.data)}`)
  }
  console.log("   Station created in company tenant schema WITHOUT relation error ✅")

  console.log(`\n3. Creating Company Admin User "${newAdminEmail}" for "${newCompId}"...`)
  const userRes = await httpRequest("/api/db/users", "POST", {
    id: `USR-${timestamp}`,
    company_id: newCompId,
    name: "Brand New Admin",
    email: newAdminEmail,
    password: "password123",
    role: "Company Admin",
    assignedCompanies: [newCompId],
    status: "active"
  })

  if (userRes.status !== 201 && userRes.status !== 200) {
    throw new Error(`Admin User creation failed: ${JSON.stringify(userRes.data)}`)
  }
  console.log("   Admin user created in PostgreSQL public.users and tenant schema ✅")

  console.log(`\n4. Testing Login for "${newAdminEmail}" into "${newCompId}"...`)
  const loginRes = await httpRequest("/api/auth/login", "POST", {
    email: newAdminEmail,
    password: "password123",
    companyId: newCompId
  })

  if (loginRes.status === 200 && loginRes.data?.success) {
    console.log("   RESULT: HTTP 200 OK — Brand New Company Admin Login SUCCESS ✅")
  } else {
    throw new Error(`Login failed: ${JSON.stringify(loginRes.data)}`)
  }

  console.log("\n=========================================================================")
  console.log("ALL NEW COMPANY CREATION & PROVISIONING TESTS PASSED 100%")
  console.log("=========================================================================")
}

testNewCompanyCreation().catch((err) => {
  console.error("\n❌ TEST FAILED:", err)
  process.exit(1)
})
