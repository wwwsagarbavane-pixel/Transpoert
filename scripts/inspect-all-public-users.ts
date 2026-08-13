import { prisma } from "../src/db/prismaClient"

async function checkPublicUsers() {
  const users: any = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."users"`)
  console.log("TOTAL USERS IN public.users:", users.length)
  console.log("All emails in public.users:", users.map((u: any) => ({ email: u.email, role: u.role, comp: u.company_id, assigned: u.assignedCompanies })))

  const cols: any = await prisma.$queryRawUnsafe(`SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'`)
  console.log("\npublic.users Columns:", cols)

  await prisma.$disconnect()
}

checkPublicUsers().catch(console.error)
