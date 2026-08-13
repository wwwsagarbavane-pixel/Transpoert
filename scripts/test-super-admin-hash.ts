import { prisma } from "../src/db/prismaClient"
import { verifyPassword } from "../src/server/passwordSecurity"

async function testHash() {
  const user: any = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."users" WHERE id = 'USR-SUPERADMIN-001'`)
  const hash = user[0].password_hash || user[0].password

  const candidates = [
    "Test@123", "Test123", "Admin@123", "Admin123!", "Admin@1234", "Admin@2026", "SuperAdmin@123",
    "TransportOS@123", "Transport@123", "Admin@2025", "Password@123", "Admin#123", "SuperAdmin#123",
    "admin@gmail.com", "Admin@gmail.com", "admin", "Admin", "12345678", "password123", "Password123"
  ]

  for (const c of candidates) {
    if (verifyPassword(c, hash)) {
      console.log(`MATCH FOUND: "${c}"`)
      return
    }
  }
  console.log("No match found in candidates.")
}

testHash().then(() => process.exit(0))
