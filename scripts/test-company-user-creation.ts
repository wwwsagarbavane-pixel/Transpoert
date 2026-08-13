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

async function testCreation() {
  console.log("=== TESTING COMPANY USER CREATION FOR ACTIVE COMPANY (COMP-103816) ===")
  const eprComp = "COMP-103816"
  const testUserId = `USER-EPR-STAFF-${Date.now()}`

  const payload = {
    id: testUserId,
    name: "EPR Staff Member",
    email: `epr_staff_${Date.now()}@transportos.com`,
    mobile: "9988771122",
    role: "Operator",
    company_id: eprComp,
    assignedCompanies: [eprComp],
    status: "active"
  }

  const res = await httpRequest("/api/db/users", "POST", payload, {
    "X-Company-ID": eprComp,
    "X-User-Role": "Company Admin"
  })

  console.log("Status:", res.status)
  console.log("Created Record in Backend DB:", res.data?.data)

  if (res.data?.data?.company_id === eprComp) {
    console.log("SUCCESS: User saved strictly under active company (COMP-103816) in backend! ✅")
  } else {
    console.error("FAIL: User company_id mismatch!")
  }

  // Cleanup
  await httpRequest(`/api/db/users/${encodeURIComponent(testUserId)}`, "DELETE", null, { "X-Company-ID": eprComp, "X-User-Role": "Company Admin" })
}

testCreation().catch(console.error)
