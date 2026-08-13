import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function diagnoseDbState() {
  console.log("=== READ-ONLY DATABASE DIAGNOSIS ===")
  console.log(`Connection URL: ${connectionString.replace(/:[^:@]+@/, ':***@')}\n`)

  const client = new Client({ connectionString })
  await client.connect()

  try {
    // 1. Current DB & User
    const currentDbRes = await client.query(`SELECT current_database(), current_user`)
    console.log("1. Current DB & User:", currentDbRes.rows[0])

    // 2. All Schemas
    const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema') 
        AND schema_name NOT LIKE 'pg_%'
    `)
    const schemas = schemasRes.rows.map(r => r.schema_name)
    console.log("2. Schemas in PostgreSQL:", schemas)

    // 3. public.companies
    const companiesRes = await client.query(`SELECT id, code, name, schema_name, status FROM public.companies`)
    console.log(`3. public.companies (${companiesRes.rows.length} rows):`, companiesRes.rows)

    // 4. public.users
    const usersRes = await client.query(`SELECT id, email, name, role, company_id, status FROM public.users`)
    console.log(`4. public.users (${usersRes.rows.length} rows):`, usersRes.rows)

    // 5. public.super_admins (if exists)
    try {
      const saRes = await client.query(`SELECT id, email, name, status FROM public.super_admins`)
      console.log(`5. public.super_admins (${saRes.rows.length} rows):`, saRes.rows)
    } catch {
      console.log("5. public.super_admins table does NOT exist")
    }

    // 6. Check tables in each non-public schema
    for (const s of schemas) {
      if (s === "public") continue
      const tablesRes = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = $1`, [s])
      console.log(`Schema "${s}" has ${tablesRes.rows.length} tables`)
      for (const t of tablesRes.rows) {
        const countRes = await client.query(`SELECT count(*) FROM "${s}"."${t.table_name}"`)
        console.log(`   - "${s}"."${t.table_name}": ${countRes.rows[0].count} rows`)
      }
    }

  } catch (err) {
    console.error("Diagnosis error:", err)
  } finally {
    await client.end()
  }
}

diagnoseDbState()
