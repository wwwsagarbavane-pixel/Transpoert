import { prisma } from "../src/db/prismaClient"
import crypto from "crypto"

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex")
  return `pbkdf2$100000$${salt}$${hash}`
}

async function fixOrphanedUsers() {
  console.log("=== FIXING ORPHANED NEW COMPANY USERS IN DB ===")

  // 1. Get orphaned users from comp_platform.users
  const platformUsers: any = await prisma.$queryRawUnsafe(`SELECT * FROM "comp_platform"."users" WHERE company_id = 'PLATFORM' AND role = 'Company Admin'`)
  console.log("Found Platform Users:", platformUsers.map((u: any) => ({ name: u.name, email: u.email })))

  // RS Company: COMP-040324
  const rsUser = platformUsers.find((u: any) => u.email === "rs@gmail.com")
  if (rsUser) {
    const passHash = hashPassword(rsUser.password || "Test@123")
    await prisma.$executeRawUnsafe(
      `INSERT INTO "public"."users" (id, company_id, name, email, password, password_hash, role, "assignedCompanies", status, "createdAt", "updatedAt")
       VALUES ($1, 'COMP-040324', $2, $3, $4, $4, 'Company Admin', $5, 'active', NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET company_id = 'COMP-040324', email = $3, password = $4, password_hash = $4, "assignedCompanies" = $5`,
      rsUser.id, rsUser.name, rsUser.email, passHash, JSON.stringify(["COMP-040324"])
    )
    console.log("Fixed RS Admin (rs@gmail.com) -> COMP-040324 ✅")
  }

  // GS Company: COMP-126349
  const gsUser = platformUsers.find((u: any) => u.email === "gs@gmail.com")
  if (gsUser) {
    const passHash = hashPassword(gsUser.password || "Test@123")
    await prisma.$executeRawUnsafe(
      `INSERT INTO "public"."users" (id, company_id, name, email, password, password_hash, role, "assignedCompanies", status, "createdAt", "updatedAt")
       VALUES ($1, 'COMP-126349', $2, $3, $4, $4, 'Company Admin', $5, 'active', NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET company_id = 'COMP-126349', email = $3, password = $4, password_hash = $4, "assignedCompanies" = $5`,
      gsUser.id, gsUser.name, gsUser.email, passHash, JSON.stringify(["COMP-126349"])
    )
    console.log("Fixed GS Admin (gs@gmail.com) -> COMP-126349 ✅")
  }

  // 2. Also ensure companies in public.companies have schema_name set
  await prisma.$executeRawUnsafe(`UPDATE "public"."companies" SET schema_name = 'comp_rs' WHERE id = 'COMP-040324' AND (schema_name IS NULL OR schema_name = '')`)
  await prisma.$executeRawUnsafe(`UPDATE "public"."companies" SET schema_name = 'comp_gs' WHERE id = 'COMP-126349' AND (schema_name IS NULL OR schema_name = '')`)
  console.log("Updated schema_name for newly created companies in public.companies ✅")
}

fixOrphanedUsers().catch(console.error)
