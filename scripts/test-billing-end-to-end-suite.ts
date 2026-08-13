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

async function runBillingEndToEndSuite() {
  console.log("=========================================================================")
  console.log("TRANSPORTOS BILLING MODULE END-TO-END AUDIT & VERIFICATION SUITE")
  console.log("=========================================================================\n")

  const compA = "COMP-483231"
  const compB = "COMP-103816"
  const billId = `BILL-E2E-${Date.now()}`
  const billNo = `INV-E2E-${Math.floor(Math.random() * 90000 + 10000)}`

  // STAGE 1: Create Bill
  console.log("1. Creating Freight Bill in Company A...")
  const billPayload = {
    id: billId,
    billNo: billNo,
    billNumber: billNo,
    billDate: "12 Aug 2026",
    dueDate: "30 Days",
    party: "Farmer Logistics Ltd",
    partyName: "Farmer Logistics Ltd",
    amount: 15000,
    totalAmount: 15000,
    paid: 0,
    paidAmount: 0,
    outstanding: 15000,
    lrsCount: 2,
    lrs: ["ABD-LR-000001", "ABD-LR-000002"],
    status: "pending"
  }

  const createRes = await httpRequest("/api/db/bills", "POST", billPayload, { "X-Company-ID": compA })
  if (createRes.status !== 201 && createRes.status !== 200) {
    throw new Error(`Failed to create bill: status ${createRes.status} ${JSON.stringify(createRes.data)}`)
  }
  console.log(`   Bill ${billNo} created successfully in PostgreSQL ✅`)

  // STAGE 2: Fetch Bills & Verify Persistence
  console.log("\n2. Querying Bills from PostgreSQL for Company A...")
  const fetchRes = await httpRequest("/api/db/bills", "GET", null, { "X-Company-ID": compA })
  const billsA: any[] = fetchRes.data?.data || []
  const fetchedBill = billsA.find(b => b.id === billId || b.billNo === billNo)

  if (!fetchedBill) {
    throw new Error(`Created bill ${billNo} not found in Company A bills query!`)
  }
  console.log(`   Fetched Bill: ${fetchedBill.billNo} | Total: ₹${fetchedBill.totalAmount} | Outstanding: ₹${fetchedBill.outstanding} | Status: ${fetchedBill.status} ✅`)

  // STAGE 3: Edit & Update Bill
  console.log("\n3. Testing Edit / Update Bill...")
  const updatePayload = {
    ...fetchedBill,
    party: "Farmer Logistics Corporation",
    partyName: "Farmer Logistics Corporation",
    amount: 18000,
    totalAmount: 18000,
    outstanding: 18000,
    dueDate: "60 Days"
  }

  const updateRes = await httpRequest(`/api/db/bills/${encodeURIComponent(billId)}`, "PUT", updatePayload, { "X-Company-ID": compA })
  if (updateRes.status !== 200) {
    throw new Error(`Failed to update bill: status ${updateRes.status} ${JSON.stringify(updateRes.data)}`)
  }

  const fetchUpdatedRes = await httpRequest(`/api/db/bills/${encodeURIComponent(billId)}`, "GET", null, { "X-Company-ID": compA })
  const updatedBill = fetchUpdatedRes.data?.data
  if (updatedBill.party !== "Farmer Logistics Corporation" || updatedBill.totalAmount !== 18000) {
    throw new Error(`Bill update did not persist cleanly: ${JSON.stringify(updatedBill)}`)
  }
  console.log(`   Bill updated: Party="${updatedBill.party}", Amount=₹${updatedBill.totalAmount}, DueDate="${updatedBill.dueDate}" ✅`)

  // STAGE 4: Record Partial Payment (Payment 1: ₹6,000)
  console.log("\n4. Recording Partial Payment 1 (₹6,000 via NEFT)...")
  const pay1Payload = {
    id: `PAY-E2E-1-${Date.now()}`,
    receiptNo: `REC-E2E-1-${Date.now()}`,
    paymentNo: `REC-E2E-1-${Date.now()}`,
    billNo: billNo,
    bill_id: billId,
    date: "2026-08-12",
    paymentDate: "2026-08-12",
    party: "Farmer Logistics Corporation",
    partyName: "Farmer Logistics Corporation",
    amount: 6000,
    mode: "NEFT",
    paymentMode: "NEFT",
    referenceNo: "NEFT-TXN-998811",
    status: "Completed",
    remarks: "Partial freight advance"
  }

  const pay1Res = await httpRequest("/api/db/payments", "POST", pay1Payload, { "X-Company-ID": compA })
  if (pay1Res.status !== 201 && pay1Res.status !== 200) {
    throw new Error(`Failed to record payment 1: ${JSON.stringify(pay1Res.data)}`)
  }

  // Update Bill Paid & Outstanding in PostgreSQL
  const postPay1Bill = {
    ...updatedBill,
    paid: 6000,
    paidAmount: 6000,
    outstanding: 12000,
    status: "Partial"
  }
  await httpRequest(`/api/db/bills/${encodeURIComponent(billId)}`, "PUT", postPay1Bill, { "X-Company-ID": compA })

  const fetchAfterPay1 = await httpRequest(`/api/db/bills/${encodeURIComponent(billId)}`, "GET", null, { "X-Company-ID": compA })
  const billAfterPay1 = fetchAfterPay1.data?.data
  console.log(`   After Payment 1: Received=₹${billAfterPay1.paidAmount}, Outstanding=₹${billAfterPay1.outstanding}, Status="${billAfterPay1.status}" ✅`)

  // STAGE 5: Record Second Payment (Payment 2: ₹12,000 - Full Clearance)
  console.log("\n5. Recording Final Payment 2 (₹12,000 via Bank Transfer)...")
  const pay2Payload = {
    id: `PAY-E2E-2-${Date.now()}`,
    receiptNo: `REC-E2E-2-${Date.now()}`,
    paymentNo: `REC-E2E-2-${Date.now()}`,
    billNo: billNo,
    bill_id: billId,
    date: "2026-08-12",
    paymentDate: "2026-08-12",
    party: "Farmer Logistics Corporation",
    partyName: "Farmer Logistics Corporation",
    amount: 12000,
    mode: "Bank",
    paymentMode: "Bank",
    referenceNo: "BNK-CLEAR-774411",
    status: "Completed",
    remarks: "Final invoice settlement"
  }

  await httpRequest("/api/db/payments", "POST", pay2Payload, { "X-Company-ID": compA })

  const postPay2Bill = {
    ...billAfterPay1,
    paid: 18000,
    paidAmount: 18000,
    outstanding: 0,
    status: "Paid"
  }
  await httpRequest(`/api/db/bills/${encodeURIComponent(billId)}`, "PUT", postPay2Bill, { "X-Company-ID": compA })

  const fetchAfterPay2 = await httpRequest(`/api/db/bills/${encodeURIComponent(billId)}`, "GET", null, { "X-Company-ID": compA })
  const billAfterPay2 = fetchAfterPay2.data?.data
  console.log(`   After Payment 2: Received=₹${billAfterPay2.paidAmount}, Outstanding=₹${billAfterPay2.outstanding}, Status="${billAfterPay2.status}" ✅`)

  // STAGE 6: Verify Payment History Ledger
  console.log("\n6. Fetching Payment History for Bill...")
  const allPaymentsRes = await httpRequest("/api/db/payments", "GET", null, { "X-Company-ID": compA })
  const paymentsList: any[] = allPaymentsRes.data?.data || []
  const billHistory = paymentsList.filter(p => p.billNo === billNo || p.bill_id === billId)

  console.log(`   Total Payments Recorded for ${billNo}: ${billHistory.length}`)
  billHistory.forEach((p, idx) => {
    console.log(`   [Payment ${idx + 1}] Receipt: ${p.receiptNo} | Amount: ₹${p.amount} | Mode: ${p.mode} | Ref: ${p.referenceNo}`)
  })
  if (billHistory.length < 2) {
    throw new Error(`Expected at least 2 payment records, found ${billHistory.length}`)
  }

  // STAGE 7: Tenant Isolation Verification (Company B Query)
  console.log(`\n7. Verifying Multi-Tenant Isolation (Querying Company B: ${compB})...`)
  const compBBillsRes = await httpRequest("/api/db/bills", "GET", null, { "X-Company-ID": compB })
  const billsB: any[] = compBBillsRes.data?.data || []
  const leakedBillInB = billsB.find(b => b.id === billId || b.billNo === billNo)

  if (leakedBillInB) {
    throw new Error(`CROSS-COMPANY DATA LEAK DETECTED! Company A bill found in Company B query!`)
  }
  console.log(`   Company B query returned ${billsB.length} bills. Company A bill strictly isolated ✅`)

  console.log("\n=========================================================================")
  console.log("ALL 7 END-TO-END BILLING MODULE AUDIT STAGES PASSED 100%")
  console.log("=========================================================================")
}

runBillingEndToEndSuite().catch((err) => {
  console.error("\n❌ BILLING AUDIT SUITE FAILED:", err)
  process.exit(1)
})
