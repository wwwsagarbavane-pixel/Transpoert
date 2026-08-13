import dotenv from 'dotenv'

dotenv.config()

async function testAuthLogins() {
  console.log("==================================================")
  console.log("TESTING SUPER ADMIN & DEMO USER AUTHENTICATION")
  console.log("==================================================\n")

  let allPassed = true

  // TEST 1: Super Admin Login (Admin@gmail.com / Test@123)
  console.log("1. Testing Super Admin Login (Admin@gmail.com)...")
  const adminRes = await fetch("http://localhost:8443/api/db/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "Admin@gmail.com", password: "Test@123", step: "super_admin" })
  })
  const adminJson = await adminRes.json()
  console.log("   Admin Login Status:", adminRes.status, adminJson)

  const adminPass = adminRes.status === 200 && adminJson.user?.role === "SUPER_ADMIN" && adminJson.user?.email === "Admin@gmail.com"
  if (adminPass) {
    console.log("   ✅ Super Admin Login: PASS (Role: SUPER_ADMIN, Email: Admin@gmail.com)\n")
  } else {
    console.error("   ❌ Super Admin Login: FAIL\n")
    allPassed = false
  }

  // TEST 2: Demo User Login (demo@gmail.com / Test@123)
  console.log("2. Testing Demo Company User Login (demo@gmail.com)...")
  const demoRes = await fetch("http://localhost:8443/api/db/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@gmail.com", password: "Test@123", company_id: "COMP-DEMO-001" })
  })
  const demoJson = await demoRes.json()
  console.log("   Demo User Login Status:", demoRes.status, demoJson)

  const demoPass = demoRes.status === 200 && demoJson.user?.role === "Company Admin" && demoJson.user?.email === "demo@gmail.com" && demoJson.user?.company?.name === "Demo Transport"
  if (demoPass) {
    console.log("   ✅ Demo User Login: PASS (Role: Company Admin, Email: demo@gmail.com, Company: Demo Transport)\n")
  } else {
    console.error("   ❌ Demo User Login: FAIL\n")
    allPassed = false
  }

  // TEST 3: Invalid Password Rejection
  console.log("3. Testing Invalid Password Rejection...")
  const wrongPassRes = await fetch("http://localhost:8443/api/db/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@gmail.com", password: "WrongPassword" })
  })
  console.log("   Wrong Password Status:", wrongPassRes.status)
  if (wrongPassRes.status === 401) {
    console.log("   ✅ Wrong Password Rejection: PASS (Status 401)\n")
  } else {
    console.error("   ❌ Wrong Password Rejection: FAIL\n")
    allPassed = false
  }

  console.log("==================================================")
  console.log(`AUTHENTICATION VERIFICATION: ${allPassed ? "ALL TESTS PASSED" : "FAILED"}`)
  console.log("==================================================\n")
}

testAuthLogins()
