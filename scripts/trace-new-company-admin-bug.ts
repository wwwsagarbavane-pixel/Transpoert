import { prisma } from "../src/db/prismaClient"

async function traceNewCompanyAdminBug() {
  console.log("=========================================================================")
  console.log("TRACING NEW COMPANY CREATION & COMPANY ADMIN USER CREATION IN DB")
  console.log("=========================================================================\n")

  // 1. Inspect public.companies
  const companies: any = await prisma.$queryRawUnsafe(`SELECT id, code, name, schema_name, status, "createdAt" FROM public.companies`)
  console.log("All Companies in public.companies:", JSON.stringify(companies, null, 2))

  // 2. Inspect public.users
  const users: any = await prisma.$queryRawUnsafe(`SELECT id, company_id, name, email, password_hash, password, role, "assignedCompanies", status FROM public.users`)
  console.log("\nAll Users in public.users:", JSON.stringify(users, null, 2))

  // 3. Inspect tenant schema tables to see if users are created in public.users, tenant.users, or both
  const schemas: any = await prisma.$queryRawUnsafe(`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'comp_%'`)
  console.log("\nTenant Schemas found:", schemas.map((s: any) => s.schema_name))

  for (const s of schemas) {
    const sName = s.schema_name
    try {
      const uRows: any = await prisma.$queryRawUnsafe(`SELECT id, company_id, name, email, role, "assignedCompanies" FROM "${sName}"."users"`)
      console.log(`Schema "${sName}" users (${uRows.length}):`, uRows)
    } catch (err: any) {
      console.log(`Schema "${sName}" users table note:`, err.message)
    }
  }
}

traceNewCompanyAdminBug().catch(console.error)
