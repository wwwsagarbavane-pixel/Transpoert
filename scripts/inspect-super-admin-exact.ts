import { prisma } from "../src/db/prismaClient"

async function inspectExact() {
  const users: any = await prisma.$queryRawUnsafe(`SELECT id, email, role, password, password_hash FROM "public"."users" WHERE LOWER(email) = 'admin@gmail.com'`)
  console.log("Super Admin Row:", JSON.stringify(users[0], null, 2))
}

inspectExact().then(() => process.exit(0))
