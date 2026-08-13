import { hashPassword, verifyPassword } from "../src/server/passwordSecurity"
import { prisma } from "../src/db/prismaClient"

async function testHV() {
  const user: any = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."users" WHERE id = 'USR-SUPERADMIN-001'`)
  const storedHash = user[0].password_hash || user[0].password
  console.log("Stored Hash:", storedHash)

  console.log("verifyPassword('Test@123', storedHash) =>", verifyPassword("Test@123", storedHash))
  console.log("verifyPassword('admin', storedHash) =>", verifyPassword("admin", storedHash))
  console.log("verifyPassword('Admin@123', storedHash) =>", verifyPassword("Admin@123", storedHash))
  console.log("verifyPassword('TestPassword123', storedHash) =>", verifyPassword("TestPassword123", storedHash))
}

testHV().then(() => process.exit(0))
