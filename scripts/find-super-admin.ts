import { prisma } from "../src/db/prismaClient"

async function findSuperAdmins() {
  const users: any = await prisma.$queryRawUnsafe(`SELECT id, email, username, name, role, company_id, password_hash, password FROM public.users`)
  const superAdmins = users.filter((u: any) => 
    String(u.role).toLowerCase().includes("super") || 
    String(u.email).toLowerCase().includes("admin")
  )
  console.log("Super Admins found:", JSON.stringify(superAdmins, null, 2))
}

findSuperAdmins().catch(console.error)
