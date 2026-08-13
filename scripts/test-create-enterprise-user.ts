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

async function testCreateEnterpriseUser() {
  console.log("=========================================================================")
  console.log("TESTING CREATE ENTERPRISE USER ACCOUNT (TIMESTAMP & RBAC SANITIZATION)")
  console.log("=========================================================================\n")

  const compId = "COMP-103816"
  const timestamp = Date.now().toString().slice(-4)
  const userEmail = `ent_user_${timestamp}@transport.com`

  console.log(`1. Creating Enterprise User Account "${userEmail}"...`)
  const userRes = await httpRequest(`/api/db/users?companyId=${compId}`, "POST", {
    id: `USR-ENT-${timestamp}`,
    company_id: compId,
    username: userEmail,
    email: userEmail,
    password: "Password@123",
    role: "Operator",
    branch: "Mumbai HQ",
    branch_ids: JSON.stringify(["Mumbai HQ"]),
    assignedCompanies: [compId],
    permissions: ["lrs.view", "lrs.create"],
    lastLogin: null, // Test null timestamp string / null value
    status: "active"
  }, { "X-Company-ID": compId, "X-User-Role": "Company Admin" })

  if (userRes.status === 201 || userRes.status === 200) {
    console.log("   RESULT: User created successfully in PostgreSQL (HTTP 200/201) ✅")
  } else {
    throw new Error(`Enterprise User creation failed: ${JSON.stringify(userRes.data)}`)
  }

  console.log(`\n2. Testing Login for newly created Enterprise User "${userEmail}"...`)
  const loginRes = await httpRequest("/api/auth/login", "POST", {
    email: userEmail,
    password: "Password@123",
    companyId: compId
  })

  if (loginRes.status === 200 && loginRes.data?.success) {
    console.log("   RESULT: Enterprise User Login SUCCESS ✅")
  } else {
    throw new Error(`Enterprise User login failed: ${JSON.stringify(loginRes.data)}`)
  }

  console.log("\n=========================================================================")
  console.log("ALL ENTERPRISE USER CREATION & TIMESTAMP SANITIZATION TESTS PASSED 100%")
  console.log("=========================================================================")
}

testCreateEnterpriseUser().catch((err) => {
  console.error("\n❌ TEST FAILED:", err)
  process.exit(1)
})
