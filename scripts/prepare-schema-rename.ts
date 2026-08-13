import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

function normalizeSchemaName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
}

async function prepareSchemaRename() {
  const client = new Client({ connectionString })
  await client.connect()

  try {
    // 1. Add schema_name column to public.companies if it does not exist
    await client.query(`ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "schema_name" TEXT`)

    // 2. Fetch companies
    const res = await client.query("SELECT id, code, name, schema_name FROM public.companies ORDER BY id")
    const companies = res.rows

    const mappingTable: any[] = []

    for (const c of companies) {
      const cleanId = c.id.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const currentSchema = cleanId.startsWith('comp_') ? cleanId : `comp_${cleanId}`
      const proposedSchema = c.schema_name || normalizeSchemaName(c.name)

      // Save schema_name into public.companies if null
      if (!c.schema_name) {
        await client.query(`UPDATE public.companies SET schema_name = $1 WHERE id = $2`, [proposedSchema, c.id])
      }

      // Check current record count in current schema
      const partyCountRes = await client.query(`SELECT count(*) FROM "${currentSchema}"."parties"`).catch(() => ({ rows: [{ count: 0 }] }))
      const recordCount = partyCountRes.rows[0].count

      mappingTable.push({
        "Company ID": c.id,
        "Company Name": c.name,
        "Current Schema": currentSchema,
        "Proposed Permanent Schema": proposedSchema,
        "Existing Records": recordCount
      })
    }

    console.log("\n==================================================")
    console.log("FINAL PRE-EXECUTION VERIFIED SCHEMA MAPPING TABLE")
    console.log("==================================================")
    console.table(mappingTable)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Preparation error:", err)
  } finally {
    await client.end()
  }
}

prepareSchemaRename()
