import http from "node:http"
import { prisma } from "../src/db/prismaClient"

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

async function runSecurityAudit() {
  console.log("=========================================================================")
  console.log("MULTI-TENANT AUTHORIZATION & CROSS-COMPANY SECURITY SUITE")
  console.log("=========================================================================\n")

  const compA = "COMP-103816" // EPR Transport
  const compB = "COMP-483231" // Farmer Transport
  const compC = "COMP-DEMO-001" // Demo Transport

  const userAEmail = "user_a_single@transportos.com"
  const userABEmail = "user_ab_multi@transportos.com"
  const superAdminEmail = "Admin@gmail.com"

  // Setup Test Users in public.users
  console.log("0. Preparing test accounts in public.users...")
  await prisma.$executeRawUnsafe(
    `INSERT INTO public.users (id, company_id, name, email, password, role, "assignedCompanies", status, "createdAt", "updatedAt")
     VALUES ('TEST-USER-A', $1, 'User A (Single Comp)', $2, 'Test@123', 'Operator', $3, 'active', NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET company_id = $1, email = $2, "assignedCompanies" = $3`,
    compA, userAEmail, JSON.stringify([compA])
  )

  await prisma.$executeRawUnsafe(
    `INSERT INTO public.users (id, company_id, name, email, password, role, "assignedCompanies", status, "createdAt", "updatedAt")
     VALUES ('TEST-USER-AB', $1, 'User AB (Multi Comp)', $2, 'Test@123', 'Operator', $3, 'active', NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET company_id = $1, email = $2, "assignedCompanies" = $3`,
    compA, userABEmail, JSON.stringify([compA, compB])
  )
  console.log("   Test accounts initialized ✅")

  // TEST 1: User A accesses Company A (Legitimate Access)
  console.log("\nTEST 1: User A (assigned to Company A) accesses Company A...")
  const res1 = await httpRequest("/api/db/parties", "GET", null, {
    "X-User-Email": userAEmail,
    "X-Company-ID": compA
  })
  if (res1.status === 200) {
    console.log("   RESULT: HTTP 200 OK — Legitimate Access Granted ✅")
  } else {
    throw new Error(`TEST 1 FAILED: Expected 200 OK, got status ${res1.status}: ${JSON.stringify(res1.data)}`)
  }

  // TEST 2: User A attempts to access Company B (Unauthorized Cross-Tenant Attack)
  console.log("\nTEST 2: User A (assigned only to Company A) attempts to access Company B...")
  const res2 = await httpRequest("/api/db/parties", "GET", null, {
    "X-User-Email": userAEmail,
    "X-Company-ID": compB
  })
  if (res2.status === 403) {
    console.log(`   RESULT: HTTP 403 Forbidden — "${res2.data?.error}" ✅`)
  } else {
    throw new Error(`SECURITY VULNERABILITY IN TEST 2: Expected HTTP 403 Forbidden, got ${res2.status}! Data leaked: ${JSON.stringify(res2.data)}`)
  }

  // TEST 3: User A attempts header manipulation (X-Company-ID: Company B)
  console.log("\nTEST 3: User A attempts header manipulation (X-Company-ID: Company B)...")
  const res3 = await httpRequest("/api/db/lrs", "GET", null, {
    "X-User-Email": userAEmail,
    "X-Company-ID": compB
  })
  if (res3.status === 403) {
    console.log(`   RESULT: HTTP 403 Forbidden — "${res3.data?.error}" ✅`)
  } else {
    throw new Error(`SECURITY VULNERABILITY IN TEST 3: Header spoofing allowed access! Got ${res3.status}`)
  }

  // TEST 4: User A sends company_id = Company B in request body
  console.log("\nTEST 4: User A sends company_id = Company B in POST request body...")
  const res4 = await httpRequest("/api/db/parties", "POST", { company_id: compB, name: "Malicious Party" }, {
    "X-User-Email": userAEmail
  })
  if (res4.status === 403) {
    console.log(`   RESULT: HTTP 403 Forbidden — "${res4.data?.error}" ✅`)
  } else {
    throw new Error(`SECURITY VULNERABILITY IN TEST 4: Body company_id spoofing allowed access! Got ${res4.status}`)
  }

  // TEST 5: User A sends companyId = Company B in query parameter
  console.log("\nTEST 5: User A sends companyId = Company B in URL query parameter...")
  const res5 = await httpRequest(`/api/db/bills?companyId=${compB}`, "GET", null, {
    "X-User-Email": userAEmail
  })
  if (res5.status === 403) {
    console.log(`   RESULT: HTTP 403 Forbidden — "${res5.data?.error}" ✅`)
  } else {
    throw new Error(`SECURITY VULNERABILITY IN TEST 5: Query param spoofing allowed access! Got ${res5.status}`)
  }

  // TEST 6: User A attempts to access Company B's business modules (LRs, Bills, Stations, Branches, Vehicles)
  console.log("\nTEST 6: User A attempts to query Company B's business modules...")
  const collections = ["lrs", "bills", "stations", "branches", "vehicles", "drivers"]
  for (const col of collections) {
    const r = await httpRequest(`/api/db/${col}?company_id=${compB}`, "GET", null, { "X-User-Email": userAEmail })
    if (r.status !== 403) {
      throw new Error(`SECURITY VULNERABILITY IN TEST 6: Collection "${col}" allowed unauthorized cross-tenant query! Status ${r.status}`)
    }
  }
  console.log("   RESULT: HTTP 403 Forbidden across ALL business modules — Zero Data Leakage ✅")

  // TEST 7: Multi-Company User AB (assigned to Company A + Company B)
  console.log("\nTEST 7: User AB (assigned to Company A + Company B) testing access boundaries...")
  const r7a = await httpRequest("/api/db/parties", "GET", null, { "X-User-Email": userABEmail, "X-Company-ID": compA })
  const r7b = await httpRequest("/api/db/parties", "GET", null, { "X-User-Email": userABEmail, "X-Company-ID": compB })
  const r7c = await httpRequest("/api/db/parties", "GET", null, { "X-User-Email": userABEmail, "X-Company-ID": compC })

  if (r7a.status === 200 && r7b.status === 200 && r7c.status === 403) {
    console.log("   Company A -> HTTP 200 OK ✅")
    console.log("   Company B -> HTTP 200 OK ✅")
    console.log("   Company C -> HTTP 403 Forbidden ✅")
    console.log("   RESULT: Multi-company access boundaries strictly enforced ✅")
  } else {
    throw new Error(`TEST 7 FAILED: Expected (200, 200, 403), got (${r7a.status}, ${r7b.status}, ${r7c.status})`)
  }

  // TEST 8: Super Admin Platform-Level Access
  console.log("\nTEST 8: Super Admin testing platform-level access...")
  const r8a = await httpRequest("/api/db/parties", "GET", null, { "X-User-Email": superAdminEmail, "X-User-Role": "Super Admin", "X-Company-ID": compA })
  const r8b = await httpRequest("/api/db/parties", "GET", null, { "X-User-Email": superAdminEmail, "X-User-Role": "Super Admin", "X-Company-ID": compB })
  const r8c = await httpRequest("/api/db/parties", "GET", null, { "X-User-Email": superAdminEmail, "X-User-Role": "Super Admin", "X-Company-ID": compC })

  if (r8a.status === 200 && r8b.status === 200 && r8c.status === 200) {
    console.log("   Company A -> HTTP 200 OK ✅")
    console.log("   Company B -> HTTP 200 OK ✅")
    console.log("   Company C -> HTTP 200 OK ✅")
    console.log("   RESULT: Super Admin platform-level access verified ✅")
  } else {
    throw new Error(`TEST 8 FAILED: Super Admin platform access failed (${r8a.status}, ${r8b.status}, ${r8c.status})`)
  }

  // Cleanup Test Records
  console.log("\nCleaning up test user accounts...")
  await prisma.$executeRawUnsafe(`DELETE FROM public.users WHERE id IN ('TEST-USER-A', 'TEST-USER-AB')`)
  console.log("Cleanup complete ✅")

  console.log("\n=========================================================================")
  console.log("ALL 8 SECURITY AUDIT TESTS PASSED 100% — TENANT ISOLATION FULLY SECURED")
  console.log("=========================================================================")
}

runSecurityAudit().catch((err) => {
  console.error("\n❌ SECURITY SUITE FAILED:", err)
  process.exit(1)
})
