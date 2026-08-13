import { prisma } from "../src/db/prismaClient"

async function inspectLatest() {
  console.log("=== INSPECTING LATEST COMPANIES AND USERS IN POSTGRESQL ===")
  const companies: any = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."companies" ORDER BY "createdAt" DESC LIMIT 10`)
  console.log("Latest Companies in public.companies:")
  console.log(companies)

  const users: any = await prisma.$queryRawUnsafe(`SELECT id, company_id, name, email, password, password_hash, role, "assignedCompanies", status FROM "public"."users" ORDER BY "createdAt" DESC LIMIT 10`)
  console.log("\nLatest Users in public.users:")
  console.log(users)

  await prisma.$disconnect()
}

inspectLatest().catch(console.error)
