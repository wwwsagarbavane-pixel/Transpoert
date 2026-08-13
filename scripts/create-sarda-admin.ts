import { prisma } from "../src/db/prismaClient"
import crypto from "node:crypto"

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex")
  return `pbkdf2$100000$${salt}$${hash}`
}

async function createSardaAdmin() {
  const companyId = "COMP-122974" // Sarda Tranport
  const email = "test@gmail.com"
  const password = "password" // default password or hash
  const pwdHash = hashPassword(password)

  console.log("Provisioning Admin user for Sarda Tranport (COMP-122974)...")

  // 1. Ensure User in public.users
  const userId = `USR-${Date.now()}`
  await prisma.$executeRawUnsafe(
    `INSERT INTO "public"."users" (id, company_id, name, email, password, password_hash, role, "assignedCompanies", status, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET
       company_id = EXCLUDED.company_id,
       password = EXCLUDED.password,
       password_hash = EXCLUDED.password_hash,
       "assignedCompanies" = EXCLUDED."assignedCompanies",
       status = 'active'`,
    userId, companyId, "Sarda Admin", email.toLowerCase(), pwdHash, pwdHash, "Company Admin", JSON.stringify([companyId]), "active"
  )

  console.log("Admin user 'test@gmail.com' successfully synced to public.users! ✅")

  // 2. Ensure user in company schema
  const schema = "comp_sarda_tranport"
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}"."users" (
      "id" TEXT PRIMARY KEY, "company_id" TEXT, "name" TEXT NOT NULL,
      "username" TEXT, "email" TEXT NOT NULL, "mobile" TEXT, "role" TEXT NOT NULL DEFAULT 'Company Admin',
      "branch" TEXT, "assignedCompanies" TEXT, "permissions" TEXT, "status" TEXT NOT NULL DEFAULT 'active',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await prisma.$executeRawUnsafe(
    `INSERT INTO "${schema}"."users" (id, company_id, name, email, role, "assignedCompanies", status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET status = 'active'`,
    userId, companyId, "Sarda Admin", email.toLowerCase(), "Company Admin", JSON.stringify([companyId]), "active"
  )

  console.log("Admin user inserted into schema 'comp_sarda_tranport'! ✅")
  await prisma.$disconnect()
}

createSardaAdmin().catch(console.error)
