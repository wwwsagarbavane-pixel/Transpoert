import { prisma } from "../src/db/prismaClient"

async function inspectAllTenantUsers() {
  console.log("=== INSPECTING ALL SCHEMAS AND USERS IN POSTGRESQL ===")
  const schemas: any = await prisma.$queryRawUnsafe(`SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'comp_%' OR schema_name = 'public'`)
  console.log("Found Schemas:", schemas.map((s: any) => s.schema_name))

  let allUsers: any[] = []
  for (const s of schemas) {
    const sName = s.schema_name
    try {
      const rows: any = await prisma.$queryRawUnsafe(`SELECT id, company_id, name, email, mobile, role, branch, "assignedCompanies", status FROM "${sName}"."users"`)
      console.log(`Schema "${sName}" has ${rows.length} users:`, rows.map((u: any) => ({ id: u.id, email: u.email, role: u.role, company: u.company_id })))
      allUsers.push(...rows.map((r: any) => ({ ...r, _sourceSchema: sName })))
    } catch (err: any) {
      console.log(`Schema "${sName}" users query failed or table missing:`, err.message)
    }
  }

  console.log(`\nTOTAL AGGREGATED USERS ACROSS ALL SCHEMAS: ${allUsers.length}`)
}

inspectAllTenantUsers().catch(console.error)
