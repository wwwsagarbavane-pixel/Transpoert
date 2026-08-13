import dotenv from 'dotenv'
import { Client } from 'pg'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function checkGetCompanies() {
  console.log("=== CHECKING GET /api/db/companies RESPONSE ===")
  const res = await fetch("http://localhost:8443/api/db/companies")
  const data = await res.json()
  console.log(`Backend API Returned ${data.length} Companies:`)
  console.table(data.map((c: any) => ({ id: c.id, code: c.code, name: c.name, schema_name: c.schema_name })))

  const pgClient = new Client({ connectionString })
  await pgClient.connect()
  const pgRes = await pgClient.query("SELECT id, code, name, schema_name FROM public.companies ORDER BY id")
  console.log(`\nPostgreSQL public.companies Has ${pgRes.rows.length} Rows:`)
  console.table(pgRes.rows)
  await pgClient.end()
}

checkGetCompanies()
