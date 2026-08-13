import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testDeliveryBillingFlow() {
  console.log("==================================================")
  console.log("TESTING DELIVERY & PAYMENT CONFIRMATION ACTIONS FLOW")
  console.log("==================================================\n")

  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const compId = "COMP-DEMO-001"
  const testLrNo = `DEL-LR-${Date.now().toString().slice(-5)}`
  const testBillNo = `BILL-TEST-${Date.now().toString().slice(-5)}`
  const testPayId = `PAY-TEST-${Date.now().toString().slice(-5)}`

  try {
    // 1. CREATE INITIAL TEST LR
    console.log(`1. Creating Test LR "${testLrNo}"...`)
    await fetch("http://localhost:8443/api/db/lrs", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({
        id: testLrNo,
        company_id: compId,
        lrNo: testLrNo,
        lr: testLrNo,
        date: "2026-08-10",
        consignor: "Sender Inc",
        consignee: "Receiver Ltd",
        from: "Pune",
        to: "Mumbai",
        freight: 12000,
        status: "Booked"
      })
    })

    // 2. TEST CONFIRM DELIVERY ACTION
    console.log("\n2. Testing CONFIRM DELIVERY action...")
    const delRes = await fetch(`http://localhost:8443/api/db/lrs/${testLrNo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({
        id: testLrNo,
        company_id: compId,
        lrNo: testLrNo,
        status: "delivered"
      })
    })
    console.log("   Delivery Update Status:", delRes.status)

    const pgLr = (await pgClient.query(`SELECT id, "lrNo", status FROM demo_transport.lrs WHERE id = $1`, [testLrNo])).rows[0]
    console.log("   PostgreSQL Updated LR Record:", pgLr)
    const delPass = delRes.status === 200 && pgLr && (pgLr.status === "delivered" || pgLr.status === "Delivered")
    console.log(`   ✅ CONFIRM DELIVERY POSTGRESQL UPDATE: ${delPass ? "PASS" : "FAIL"}\n`)

    // 3. CREATE INITIAL TEST BILL
    console.log(`3. Creating Test Bill "${testBillNo}"...`)
    await fetch("http://localhost:8443/api/db/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({
        id: testBillNo,
        company_id: compId,
        billNo: testBillNo,
        billDate: "2026-08-10",
        party: "Receiver Ltd",
        amount: 12000,
        subtotal: 12000,
        totalAmount: 12000,
        paid: 0,
        paidAmount: 0,
        outstanding: 12000,
        status: "pending"
      })
    })

    // 4. TEST CONFIRM & SAVE PAYMENT ACTION (First Payment)
    console.log("\n4. Testing CONFIRM & SAVE PAYMENT action (First Confirmation)...")
    const payRes1 = await fetch("http://localhost:8443/api/db/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({
        id: testPayId,
        company_id: compId,
        receiptNo: testPayId,
        billNo: testBillNo,
        bill_id: testBillNo,
        party: "Receiver Ltd",
        amount: 12000,
        mode: "UPI",
        referenceNo: "TXN-998877",
        status: "Completed"
      })
    })

    // Update associated Bill to Paid
    await fetch(`http://localhost:8443/api/db/bills/${testBillNo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({
        id: testBillNo,
        company_id: compId,
        billNo: testBillNo,
        totalAmount: 12000,
        paidAmount: 12000,
        paid: 12000,
        outstanding: 0,
        status: "paid"
      })
    })

    console.log("   First Payment Status:", payRes1.status)
    const pgPay1 = (await pgClient.query(`SELECT id, company_id, "billNo", amount FROM demo_transport.payments WHERE id = $1`, [testPayId])).rows[0]
    const pgBill1 = (await pgClient.query(`SELECT id, "paidAmount", outstanding, status FROM demo_transport.bills WHERE id = $1`, [testBillNo])).rows[0]
    console.log("   PostgreSQL Payment Record:", pgPay1)
    console.log("   PostgreSQL Bill Record:", pgBill1)

    const payPass1 = payRes1.status === 201 && pgPay1 && pgBill1 && pgBill1.status === "paid"
    console.log(`   ✅ FIRST PAYMENT CONFIRMATION: ${payPass1 ? "PASS" : "FAIL"}\n`)

    // 5. TEST REPEATED PAYMENT CONFIRMATION (Prevents Duplication)
    console.log("5. Testing REPEATED Payment Confirmation with Same ID (Update Existing)...")
    const payRes2 = await fetch(`http://localhost:8443/api/db/payments/${testPayId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Company-ID": compId },
      body: JSON.stringify({
        id: testPayId,
        company_id: compId,
        receiptNo: testPayId,
        billNo: testBillNo,
        bill_id: testBillNo,
        party: "Receiver Ltd",
        amount: 12000,
        mode: "Bank Transfer",
        referenceNo: "TXN-998877-UPDATED",
        status: "Completed"
      })
    })

    const pgPayCount = (await pgClient.query(`SELECT count(*)::int as cnt FROM demo_transport.payments WHERE id = $1`, [testPayId])).rows[0]?.cnt
    console.log("   Total Payment Records with Same ID:", pgPayCount)

    const noDupPass = payRes2.status === 200 && pgPayCount === 1
    console.log(`   ✅ NO DUPLICATE PAYMENT CREATED: ${noDupPass ? "PASS" : "FAIL"}\n`)

    // Cleanup
    await pgClient.query(`DELETE FROM demo_transport.lrs WHERE id = $1`, [testLrNo])
    await pgClient.query(`DELETE FROM demo_transport.bills WHERE id = $1`, [testBillNo])
    await pgClient.query(`DELETE FROM demo_transport.payments WHERE id = $1`, [testPayId])

    console.log("==================================================")
    console.log(`DELIVERY & PAYMENT ACTIONS TEST: ${delPass && payPass1 && noDupPass ? "ALL TESTS PASSED" : "FAILED"}`)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Test Error:", err)
  } finally {
    await pgClient.end()
  }
}

testDeliveryBillingFlow()
