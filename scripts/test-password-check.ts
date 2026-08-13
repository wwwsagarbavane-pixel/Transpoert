import { prisma } from "../src/db/prismaClient"
import { verifyPassword } from "../src/server/passwordSecurity"

async function testPw() {
  const user: any = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."users" WHERE id = 'USR-SUPERADMIN-001'`)
  const storedHash = user[0].password_hash || user[0].password
  console.log("Stored hash:", storedHash)

  const candidates = ["admin", "Admin", "Admin@123", "admin123", "SuperAdmin@123", "password", "Admin#123", "123456", "superadmin"]
  for (const c of candidates) {
    if (verifyPassword(c, storedHash)) {
      console.log(`FOUND MATCHING PASSWORD: "${c}"`)
    }
  }
}

testPw().then(() => process.exit(0))
