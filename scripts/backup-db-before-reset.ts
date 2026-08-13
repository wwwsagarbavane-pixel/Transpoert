import { Client } from 'pg'
import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function backupDbBeforeReset() {
  console.log("=== STEP 1: CREATING DATABASE BACKUP BEFORE RESET ===")
  const client = new Client({ connectionString })
  await client.connect()

  const backupData: Record<string, any> = {}

  try {
    // 1. Fetch all schemas
    const schemasRes = await client.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema') AND schema_name NOT LIKE 'pg_%'`)
    const schemas = schemasRes.rows.map(r => r.schema_name)
    console.log("Found Schemas:", schemas)

    for (const schema of schemas) {
      backupData[schema] = {}
      const tablesRes = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = $1`, [schema])
      for (const t of tablesRes.rows) {
        const table = t.table_name
        const dataRes = await client.query(`SELECT * FROM "${schema}"."${table}"`)
        backupData[schema][table] = dataRes.rows
      }
    }

    const backupPath = path.resolve(process.cwd(), "backup_transportos_erp_before_reset.json")
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2))
    console.log(`✅ Backup successfully saved to ${backupPath}`)

  } catch (err) {
    console.error("Backup failed:", err)
  } finally {
    await client.end()
  }
}

backupDbBeforeReset()
