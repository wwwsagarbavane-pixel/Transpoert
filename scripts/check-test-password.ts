import { prisma } from "../src/db/prismaClient"

async function checkPassword() {
  const users: any = await prisma.$queryRawUnsafe(`SELECT email, password, password_hash, company_id, "assignedCompanies" FROM "public"."users" WHERE LOWER(email) = 'test@gmail.com'`)
  console.log("User record for test@gmail.com:", users)
  await prisma.$disconnect()
}

checkPassword().catch(console.error)
