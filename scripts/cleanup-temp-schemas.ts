import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function cleanupTempSchemas() {
  const client = new Client({ connectionString })
  await client.connect()

  const tempSchemas = ['comp_comp_001', 'comp_comp_002', 'comp_comp_003', 'comp_comp_004', 'comp_comp_925663']
  for (const s of tempSchemas) {
    await client.query(`DROP SCHEMA IF EXISTS "${s}" CASCADE`)
  }
  console.log("✅ Cleaned up temporary schema aliases cleanly.")
  await client.end()
}

cleanupTempSchemas()
