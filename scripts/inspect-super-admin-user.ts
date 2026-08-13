import { prisma } from "../src/db/prismaClient"

async function inspectSuperAdmin() {
  console.log("=== INSPECTING PUBLIC.USERS FOR SUPER ADMIN ACCOUNTS ===")
  const users: any = await prisma.$queryRawUnsafe(`SELECT id, email, username, name, role, company_id, "assignedCompanies", status FROM public.users`)
  console.log("All Users in public.users:", JSON.stringify(users, null, 2))
}

inspectSuperAdmin().catch(console.error)
