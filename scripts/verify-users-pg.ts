import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function verifyUsersPg() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    const usersRes = await client.query(`SELECT id, company_id, name, email, role, status FROM public.users`)
    console.log("PostgreSQL public.users accounts:")
    console.table(usersRes.rows)

    const compRes = await client.query(`SELECT id, code, name, schema_name FROM public.companies`)
    console.log("PostgreSQL public.companies records:")
    console.table(compRes.rows)
  } finally {
    await client.end()
  }
}

verifyUsersPg()
