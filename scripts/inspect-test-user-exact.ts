import { prisma } from "../src/db/prismaClient"

async function inspectTestUser() {
  console.log("=== EXACT INSPECTION FOR test@gmail.com IN POSTGRESQL ===")
  const userRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."users" WHERE LOWER(email) = 'test@gmail.com'`)
  console.log("User in public.users:", userRows)

  const sardaComp: any = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."companies" WHERE code = 'SARD' OR LOWER(name) LIKE '%sarda%'`)
  console.log("Sarda Company record:", sardaComp)

  await prisma.$disconnect()
}

inspectTestUser().catch(console.error)
