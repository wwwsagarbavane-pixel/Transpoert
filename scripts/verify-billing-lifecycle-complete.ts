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

async function verifyBillingLifecycleComplete() {
  console.log("=========================================================================")
  console.log("COMPLETE TRANSPORTOS BILLING LIFECYCLE & TENANT SECURITY VERIFICATION")
  console.log("=========================================================================\n")

  const compA = "COMP-103816"
  const compB = "COMP-483231"
  const headersA = { "X-Company-ID": compA, "X-User-Email": "erp@gmail.com", "X-User-Role": "Company Admin" }
  const headersB = { "X-Company-ID": compB, "X-User-Email": "gb@gmail.com", "X-User-Role": "Company Admin" }

  // 1. Create a test unbilled LR in Company A
  const testLrNo = `LR-TEST-${Date.now().toString().slice(-4)}`
  console.log(`1. Creating Test Unbilled LR "${testLrNo}" in Company A...`)
  const lrRes = await httpRequest(`/api/db/lrs?companyId=${compA}`, "POST", {
    id: testLrNo,
    company_id: compA,
    lrNo: testLrNo,
    date: "12 Aug 2026",
    consignor: "Test Consignor Party",
    consignee: "Test Consignee Receiver",
    from: "Nagpur",
    to: "Ahmedabad",
    freight: 12000,
    hamali: 500,
    freightType: "Paid",
    status: "Booked"
  }, headersA)

  if (lrRes.status !== 201 && lrRes.status !== 200) {
    throw new Error(`LR Creation Failed: ${JSON.stringify(lrRes.data)}`)
  }
  console.log("   Unbilled LR created in PostgreSQL ✅")

  // 2. Fetch Unbilled LRs list
  console.log("\n2. Fetching Unbilled LRs list for Company A...")
  const allLrsRes = await httpRequest(`/api/db/lrs?companyId=${compA}`, "GET", null, headersA)
  const lrsList: any[] = allLrsRes.data?.data || []
  const foundLr = lrsList.find(r => r.lrNo === testLrNo || r.id === testLrNo)
  if (foundLr && !foundLr.billed) {
    console.log(`   Found LR "${testLrNo}" in unbilled list (Freight: ₹${foundLr.freight}) ✅`)
  } else {
    throw new Error("Unbilled LR missing from LRs list")
  }

  // 3. Generate Bill for the LR
  const testBillNo = `BILL-TEST-${Date.now().toString().slice(-4)}`
  console.log(`\n3. Generating Bill "${testBillNo}" for LR "${testLrNo}"...`)
  const billRes = await httpRequest(`/api/db/bills?companyId=${compA}`, "POST", {
    id: testBillNo,
    company_id: compA,
    billNo: testBillNo,
    billDate: "12 Aug 2026",
    party: "Test Consignor Party",
    amount: 12500,
    totalAmount: 12500,
    subtotal: 12500,
    tax: 0,
    lrsCount: 1,
    paid: 0,
    paidAmount: 0,
    outstanding: 12500,
    dueDate: "30 Days",
    status: "pending",
    lrs: [testLrNo]
  }, headersA)

  if (billRes.status === 201 || billRes.status === 200) {
    console.log(`   RESULT: Bill "${testBillNo}" Created in PostgreSQL (HTTP ${billRes.status}) ✅`)
  } else {
    throw new Error(`Bill Creation Failed: ${JSON.stringify(billRes.data)}`)
  }

  // 4. Fetch Bills List & Verify No Duplicates
  console.log("\n4. Fetching Bills list & verifying deduplication...")
  const billsListRes = await httpRequest(`/api/db/bills?companyId=${compA}`, "GET", null, headersA)
  const billsList: any[] = billsListRes.data?.data || []
  const matchingBills = billsList.filter(b => b.billNo === testBillNo || b.id === testBillNo)
  console.log(`   Bill "${testBillNo}" count in listing: ${matchingBills.length}`)
  if (matchingBills.length === 1) {
    console.log("   RESULT: Bill appears EXACTLY ONCE (No duplicates) ✅")
  } else {
    throw new Error(`DUPLICATE BILL DETECTED: Bill appeared ${matchingBills.length} times`)
  }

  // 5. Test Partial Payment Receive
  console.log("\n5. Testing Partial Payment Receive (₹5,000 against ₹12,500)...")
  const payRes1 = await httpRequest(`/api/db/receive-payment?companyId=${compA}`, "POST", {
    billNo: testBillNo,
    billId: testBillNo,
    amount: 5000,
    paymentMode: "Bank",
    referenceNo: "TXN-BANK-1001",
    partyName: "Test Consignor Party"
  }, headersA)

  console.log("   Payment Response Status:", payRes1.status)
  console.log("   Payment Response Data:", JSON.stringify(payRes1.data))

  if (payRes1.status === 200 && payRes1.data?.updatedBill) {
    const updatedB = payRes1.data.updatedBill
    console.log(`   Received ₹5,000 | Paid: ₹${updatedB.paidAmount || updatedB.paid} | Outstanding: ₹${updatedB.outstanding} | Status: ${updatedB.status} ✅`)
    if (updatedB.outstanding !== 7500 || updatedB.status !== "partial") {
      throw new Error(`Invalid partial payment calculations: ${JSON.stringify(updatedB)}`)
    }
  } else {
    throw new Error(`Payment Recording Failed: ${JSON.stringify(payRes1.data)}`)
  }

  // 6. Test Final Payment Receive
  console.log("\n6. Testing Final Payment Receive (₹7,500 to settle balance)...")
  const payRes2 = await httpRequest(`/api/db/receive-payment?companyId=${compA}`, "POST", {
    billNo: testBillNo,
    billId: testBillNo,
    amount: 7500,
    paymentMode: "UPI",
    referenceNo: "TXN-UPI-2002",
    partyName: "Test Consignor Party"
  }, headersA)

  if (payRes2.status === 200 && payRes2.data?.updatedBill) {
    const updatedB2 = payRes2.data.updatedBill
    console.log(`   Received ₹7,500 | Paid: ₹${updatedB2.paidAmount || updatedB2.paid} | Outstanding: ₹${updatedB2.outstanding} | Status: ${updatedB2.status} ✅`)
    if (updatedB2.outstanding !== 0 || updatedB2.status !== "paid") {
      throw new Error(`Invalid final payment calculations: ${JSON.stringify(updatedB2)}`)
    }
  } else {
    throw new Error(`Final Payment Recording Failed: ${JSON.stringify(payRes2.data)}`)
  }

  // 7. Verify Multi-Tenant Isolation
  console.log("\n7. Verifying Multi-Tenant Security (Company B attempting to access Company A's bill)...")
  const crossBillRes = await httpRequest(`/api/db/bills/${testBillNo}?companyId=${compB}`, "GET", null, headersB)
  if (crossBillRes.status === 403 || crossBillRes.status === 404) {
    console.log(`   RESULT: HTTP ${crossBillRes.status} Access Denied — Tenant Security Verified ✅`)
  } else {
    throw new Error(`TENANT ISOLATION LEAK: Company B accessed Company A bill: ${JSON.stringify(crossBillRes.data)}`)
  }

  console.log("\n=========================================================================")
  console.log("ALL BILLING LIFECYCLE & TENANT SECURITY TESTS PASSED 100%")
  console.log("=========================================================================")
}

verifyBillingLifecycleComplete().catch((err) => {
  console.error("\n❌ BILLING VERIFICATION FAILED:", err)
  process.exit(1)
})
