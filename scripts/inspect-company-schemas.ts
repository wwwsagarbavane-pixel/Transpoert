import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

function normalizeSchemaName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, '') // remove special characters
    .replace(/[\s-]+/g, '_')     // replace spaces & hyphens with underscores
    .replace(/_+/g, '_')         // collapse multiple underscores
}

async function inspectCompanySchemas() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    const res = await client.query("SELECT id, code, name FROM public.companies ORDER BY id")
    const companies = res.rows

    const mapping = companies.map(c => {
      const cleanId = c.id.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const currentSchema = cleanId.startsWith('comp_') ? cleanId : `comp_${cleanId}`
      const proposedSchema = normalizeSchemaName(c.name)
      return {
        "Company ID": c.id,
        "Company Name": c.name,
        "Current Schema": currentSchema,
        "Proposed Schema": proposedSchema
      }
    })

    console.log("=== CURRENT VS PROPOSED SCHEMA MAPPING PLAN ===")
    console.table(mapping)

  } catch (err) {
    console.error("Inspection error:", err)
  } finally {
    await client.end()
  }
}

inspectCompanySchemas()
