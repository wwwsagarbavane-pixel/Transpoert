import { prisma } from "../src/db/prismaClient"

async function inspectSarda() {
  console.log("=== SEARCHING FOR SARDA COMPANY & USER IN POSTGRESQL ===")
  const compRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."companies" WHERE LOWER(name) LIKE '%sarda%' OR LOWER(code) LIKE '%sard%'`)
  console.log("Matching Companies:", compRows)

  const userRows: any = await prisma.$queryRawUnsafe(`SELECT id, company_id, name, email, role, "assignedCompanies" FROM "public"."users" WHERE LOWER(email) LIKE '%test%' OR LOWER(name) LIKE '%sarda%'`)
  console.log("Matching Users:", userRows)

  const allComps: any = await prisma.$queryRawUnsafe(`SELECT id, code, name FROM "public"."companies" ORDER BY "createdAt" DESC LIMIT 5`)
  console.log("Top 5 Companies:", allComps)

  await prisma.$disconnect()
}

inspectSarda().catch(console.error)
