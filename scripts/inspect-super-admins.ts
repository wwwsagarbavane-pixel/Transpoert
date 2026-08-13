import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function inspectSuperAdmins() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    const res = await client.query(`
      SELECT id, name, username, email, role, "assignedCompanies", status, "createdAt" 
      FROM public.users 
      WHERE role = 'Super Admin' OR 'id' = 'USR-SUPER-ADMIN'
    `)
    
    console.log("=== EXISTING SUPER ADMIN ACCOUNTS IN PUBLIC.USERS ===")
    console.table(res.rows)

    const allUsersRes = await client.query(`
      SELECT id, name, email, role, company_id, status 
      FROM public.users
    `)
    console.log("\n=== ALL USERS IN PUBLIC.USERS ===")
    console.table(allUsersRes.rows)

  } catch (err) {
    console.error("Inspection error:", err)
  } finally {
    await client.end()
  }
}

inspectSuperAdmins()
