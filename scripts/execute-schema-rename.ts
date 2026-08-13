import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function executeSchemaRename() {
  console.log("=== EXECUTING SAFE ALTER SCHEMA RENAMES ===")
  const client = new Client({ connectionString })
  await client.connect()

  try {
    // 1. Ensure schema_name column exists in public.companies
    await client.query(`ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS "schema_name" TEXT`)

    // 2. Pre-migration count check for comp_003 and comp_925663
    const comp3Before = await client.query(`SELECT count(*) FROM "comp_003"."parties"`).catch(() => ({ rows: [{ count: 0 }] }))
    const compMIBefore = await client.query(`SELECT count(*) FROM "comp_925663"."stations"`).catch(() => ({ rows: [{ count: 0 }] }))
    console.log(`Pre-rename check: comp_003 parties = ${comp3Before.rows[0].count}, comp_925663 stations = ${compMIBefore.rows[0].count}`)

    // 3. Define exact rename map
    const renames = [
      { id: 'COMP-001', oldSchema: 'comp_001', newSchema: 'dummy_transport_pvt_ltd' },
      { id: 'COMP-002', oldSchema: 'comp_002', newSchema: 'ganesh_transport' },
      { id: 'COMP-003', oldSchema: 'comp_003', newSchema: 'testtranpoart' },
      { id: 'COMP-004', oldSchema: 'comp_004', newSchema: 'test_transport' },
      { id: 'COMP-925663', oldSchema: 'comp_925663', newSchema: 'mi_transpoert' },
    ]

    for (const item of renames) {
      // Execute ALTER SCHEMA if oldSchema exists
      const schemaCheck = await client.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
        [item.oldSchema]
      )

      if (schemaCheck.rows.length > 0) {
        await client.query(`ALTER SCHEMA "${item.oldSchema}" RENAME TO "${item.newSchema}"`)
        console.log(`✅ Renamed schema: "${item.oldSchema}" → "${item.newSchema}"`)
      } else {
        // Ensure newSchema exists
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${item.newSchema}"`)
        console.log(`ℹ️ Schema "${item.newSchema}" already exists or created.`)
      }

      // Store permanent schema_name in public.companies table
      await client.query(
        `UPDATE public.companies SET schema_name = $1 WHERE id = $2`,
        [item.newSchema, item.id]
      )
    }

    console.log("\n==================================================")
    console.log("SAFE ALTER SCHEMA RENAMES COMPLETED SUCCESSFULLY")
    console.log("==================================================\n")

  } catch (err) {
    console.error("Execution error:", err)
  } finally {
    await client.end()
  }
}

executeSchemaRename()
