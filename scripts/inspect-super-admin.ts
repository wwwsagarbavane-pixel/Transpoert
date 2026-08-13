import { prisma } from "../src/db/prismaClient"

async function inspectSuperAdmin() {
  console.log("=== INSPECTING SUPER ADMIN ACCOUNTS IN PUBLIC.USERS ===")
  try {
    const users: any = await prisma.$queryRawUnsafe(`SELECT id, company_id, name, username, email, role, password, password_hash, status FROM "public"."users"`)
    console.log(`Found ${users.length} total users in public.users:`)
    users.forEach((u: any, idx: number) => {
      console.log(`[User ${idx + 1}] ID: ${u.id} | Email: "${u.email}" | Role: "${u.role}" | Company: "${u.company_id}" | HasPwd: ${Boolean(u.password || u.password_hash)}`)
    })
  } catch (err: any) {
    console.error("Failed to query public.users:", err.message)
  }

  console.log("\n=== CHECKING ALL SCHEMAS FOR AUTH TABLES ===")
  try {
    const schemas: any = await prisma.$queryRawUnsafe(`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'comp_%' OR schema_name = 'public'`)
    console.log("Schemas:", schemas.map((s: any) => s.schema_name))
  } catch (err: any) {
    console.error("Failed to query schemas:", err.message)
  }
}

inspectSuperAdmin().then(() => process.exit(0)).catch(() => process.exit(1))
