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

async function testSuperAdminLoginVariations() {
  console.log("=== TESTING SUPER ADMIN LOGIN FROM ANY SCREEN / COMPANY ===")

  // 1. Login from Super Admin portal (no company selected)
  console.log("\n1. Login via Super Admin portal (no company_id):")
  const res1 = await httpRequest("/api/auth/login", "POST", { email: "Admin@gmail.com", password: "Test@123", step: "super_admin" })
  console.log("   Status:", res1.status, res1.data?.user ? "SUCCESS ✅" : res1.data?.error)

  // 2. Login from Company A login screen (selected company COMP-103816)
  console.log("\n2. Login via Company A screen (company_id = COMP-103816):")
  const res2 = await httpRequest("/api/auth/login", "POST", { email: "Admin@gmail.com", password: "Test@123", company_id: "COMP-103816", step: "login" })
  console.log("   Status:", res2.status, res2.data?.user ? "SUCCESS ✅" : res2.data?.error)

  // 3. Login from Company B login screen (selected company COMP-483231)
  console.log("\n3. Login via Company B screen (company_id = COMP-483231):")
  const res3 = await httpRequest("/api/auth/login", "POST", { email: "Admin@gmail.com", password: "Test@123", company_id: "COMP-483231", step: "login" })
  console.log("   Status:", res3.status, res3.data?.user ? "SUCCESS ✅" : res3.data?.error)
}

testSuperAdminLoginVariations().catch(console.error)
