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

async function testGenerateBillCreation() {
  console.log("=== TESTING FREIGHT BILL GENERATION API ===")

  const testBillNo = `BILL-${Date.now().toString().slice(-5)}`
  const compId = "COMP-103816"

  const payload = {
    id: testBillNo,
    billNo: testBillNo,
    billDate: new Date().toLocaleDateString("en-GB"),
    party: "EPR Transport Party",
    partyName: "EPR Transport Party",
    partyId: "epr_transport_party",
    amount: 25000,
    totalAmount: 25000,
    subtotal: 25000,
    tax: 0,
    lrsCount: 1,
    paid: 0,
    paidAmount: 0,
    outstanding: 25000,
    dueDate: "30 Days",
    status: "pending",
    lrs: [],
    remarks: "Automated Freight Invoice Generation Test"
  }

  console.log(`Sending POST /api/db/bills for ${testBillNo}...`)
  const res = await httpRequest(`/api/db/bills?companyId=${compId}`, "POST", payload, {
    "X-Company-ID": compId,
    "X-User-Email": "erp@gmail.com",
    "X-User-Role": "Company Admin"
  })

  console.log("Response Status:", res.status)
  console.log("Response Body:", JSON.stringify(res.data, null, 2))

  if (res.status === 200 || res.status === 201) {
    console.log("\nFREIGHT BILL GENERATED SUCCESSFULLY ✅")
  } else {
    throw new Error(`BILL GENERATION FAILED: ${JSON.stringify(res.data)}`)
  }
}

testGenerateBillCreation().catch(console.error)
