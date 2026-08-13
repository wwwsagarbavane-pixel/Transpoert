import http from "node:http"

function testLogin(email: string, pass: string, compId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ email, password: pass, companyId: compId })
    const req = http.request({
      hostname: "localhost",
      port: 8443,
      path: "/api/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    }, res => {
      let raw = ""
      res.on("data", c => raw += c)
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) })
        } catch {
          resolve({ status: res.statusCode, data: raw })
        }
      })
    })
    req.on("error", reject)
    req.write(body)
    req.end()
  })
}

async function runTest() {
  console.log("Testing Login for Test@gmail.com with password 'password'...")
  const res1 = await testLogin("Test@gmail.com", "password", "COMP-122974")
  console.log("Result for 'password':", res1)

  console.log("\nTesting Login for Test@gmail.com with password '123456'...")
  const res2 = await testLogin("Test@gmail.com", "123456", "COMP-122974")
  console.log("Result for '123456':", res2)
}

runTest().catch(console.error)
