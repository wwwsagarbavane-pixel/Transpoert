import { prisma } from "../src/db/prismaClient"
import { verifyPassword } from "../src/server/passwordSecurity"

async function testFix() {
  const loginIdentifier = "admin@gmail.com"
  const password = "Test@123"

  const candidates: any = await prisma.$queryRawUnsafe(
    `SELECT * FROM "public"."users" WHERE LOWER(email) = $1 OR LOWER(username) = $1 OR LOWER(name) = $1`,
    loginIdentifier.trim().toLowerCase()
  )
  const candidateList = Array.isArray(candidates) ? candidates : []
  const foundUser = candidateList.find((u: any) =>
    verifyPassword(password, u.password_hash) ||
    verifyPassword(password, u.password)
  )

  console.log("Found Super Admin User:", foundUser ? `ID: ${foundUser.id} | Email: ${foundUser.email} | Role: ${foundUser.role}` : "NULL")
}

testFix().then(() => process.exit(0))
