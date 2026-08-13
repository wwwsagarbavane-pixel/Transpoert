import dotenv from 'dotenv'

dotenv.config()

async function testMissingCompanyContext() {
  console.log("=== TESTING MISSING COMPANY CONTEXT SAFETY REJECTION ===")

  // Send request with NO company_id in body, NO companyId query param, NO X-Company-ID header
  const res = await fetch("http://localhost:8443/api/db/parties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: `PRT-NO-CTX-${Date.now()}`,
      name: "Unscoped Party",
      type: "Consignor"
    })
  })

  const status = res.status
  const json = await res.json()

  console.log(`HTTP Status Code: ${status} (Expected 400)`)
  console.log(`Response Body:`, json)

  if (status === 400 && json.error?.includes("Company context")) {
    console.log("✅ SAFETY TEST PASSED: Missing company context correctly returned HTTP 400!")
  } else {
    console.error("❌ SAFETY TEST FAILED: Request without company context was not rejected!")
  }
}

testMissingCompanyContext()
