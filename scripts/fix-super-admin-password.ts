import { prisma } from "../src/db/prismaClient"
import { hashPassword } from "../src/server/passwordSecurity"

async function fixPassword() {
  const hp = hashPassword("Test@123")
  await prisma.$executeRawUnsafe(
    `UPDATE "public"."users" SET password = $1, password_hash = $1 WHERE id = 'USR-SUPERADMIN-001'`,
    hp
  )
  console.log("Super Admin password updated to valid hash for Test@123 ✅")
}

fixPassword().then(() => process.exit(0))
