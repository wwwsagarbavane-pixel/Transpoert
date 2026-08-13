import http from "node:http"

function httpRequest(path: string, method: string = "GET", body: any = null, headers: Record<string, string> = {}): Promise<{ status: number; data: any }> {
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

async function testNormalLogin() {
  console.log("=== TESTING NORMAL COMPANY USER LOGIN API ===")
  const res = await httpRequest("/api/auth/login", "POST", {
    email: "demo@gmail.com",
    password: "Test@123",
    companyId: "COMP-DEMO-001"
  })

  console.log("Status:", res.status)
  console.log("Response:", JSON.stringify(res.data, null, 2))
}

testNormalLogin().catch(console.error)
