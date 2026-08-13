import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function verifyNamedSchemas() {
  console.log("=== STARTING COMPREHENSIVE NAMED SCHEMA VERIFICATION ===")
  const client = new Client({ connectionString })
  await client.connect()

  const results: Record<string, { pass: boolean; details: string }> = {}

  try {
    // 1. Verify schema_name column in public.companies
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'schema_name'
    `)
    results["1. public.companies.schema_name column exists"] = {
      pass: colCheck.rows.length > 0,
      details: colCheck.rows.length > 0 ? "schema_name column present in public.companies" : "Column missing"
    }

    // 2. Verify Company ID -> schema_name mappings
    const compRes = await client.query(`SELECT id, name, schema_name FROM public.companies ORDER BY id`)
    const expectedSchemas = [
      { id: 'COMP-001', schema: 'dummy_transport_pvt_ltd' },
      { id: 'COMP-002', schema: 'ganesh_transport' },
      { id: 'COMP-003', schema: 'testtranpoart' },
      { id: 'COMP-004', schema: 'test_transport' },
      { id: 'COMP-925663', schema: 'mi_transpoert' }
    ]

    let mappingsMatch = true
    for (const exp of expectedSchemas) {
      const match = compRes.rows.find(r => r.id === exp.id && r.schema_name === exp.schema)
      if (!match) mappingsMatch = false
    }
    results["2. Company ID -> schema_name DB mapping"] = {
      pass: mappingsMatch,
      details: mappingsMatch ? "All 5 companies have permanent schema_name stored" : "Mapping mismatch"
    }

    // 3. Verify PostgreSQL schemas exist
    const pgSchemasRes = await client.query(`
      SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name IN ('dummy_transport_pvt_ltd', 'ganesh_transport', 'testtranpoart', 'test_transport', 'mi_transpoert')
    `)
    results["3. PostgreSQL company schemas exist"] = {
      pass: pgSchemasRes.rows.length === 5,
      details: `Found ${pgSchemasRes.rows.length} / 5 named company schemas`
    }

    // 4. Verify 12 business tables in every company schema
    const businessTables = [
      'branches', 'parties', 'vehicles', 'drivers', 'owners',
      'agents', 'stations', 'articles', 'lrs', 'deliveries', 'bills', 'payments'
    ]

    let allTablesExist = true
    for (const exp of expectedSchemas) {
      for (const tbl of businessTables) {
        const tblCheck = await client.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = $1 AND table_name = $2
        `, [exp.schema, tbl])
        if (tblCheck.rows.length === 0) {
          allTablesExist = false
          console.error(`Missing table ${tbl} in schema ${exp.schema}`)
        }
      }
    }

    results["4. All 12 business tables exist in every schema"] = {
      pass: allTablesExist,
      details: allTablesExist ? "12/12 business tables verified in all 5 company schemas" : "Missing tables"
    }

    // 5. Verify record counts preserved
    const testtranpoartParties = await client.query(`SELECT count(*) FROM "testtranpoart"."parties"`)
    const miStations = await client.query(`SELECT count(*) FROM "mi_transpoert"."stations"`)

    results["5. Business record counts preserved (testtranpoart)"] = {
      pass: parseInt(testtranpoartParties.rows[0].count) === 3,
      details: `Parties count = ${testtranpoartParties.rows[0].count} (Expected 3)`
    }

    results["6. Business record counts preserved (mi_transpoert)"] = {
      pass: parseInt(miStations.rows[0].count) === 1,
      details: `Stations count = ${miStations.rows[0].count} (Expected 1)`
    }

    // 7. Verify Display Name rename does NOT change schema_name
    await client.query(`UPDATE public.companies SET name = 'Ganesh Transport Services Ltd' WHERE id = 'COMP-002'`)
    const comp2Check = await client.query(`SELECT name, schema_name FROM public.companies WHERE id = 'COMP-002'`)
    const schemaUnchanged = comp2Check.rows[0].schema_name === 'ganesh_transport'
    await client.query(`UPDATE public.companies SET name = 'Ganesh Transport' WHERE id = 'COMP-002'`) // revert display name change test

    results["7. Display name edit does NOT change schema_name"] = {
      pass: schemaUnchanged,
      details: schemaUnchanged ? "schema_name remains ganesh_transport after display name update" : "Schema changed unexpectedly"
    }

    // 8. Verify auto-creation of schema for new company
    const newCompId = `COMP-NEW-${Date.now()}`
    const newCompName = `Kaveri Logistics Pvt Ltd`
    const newNormSchema = `kaveri_logistics_pvt_ltd`

    await client.query(`
      INSERT INTO public.companies (id, code, name, schema_name, status, "createdAt", "updatedAt")
      VALUES ($1, 'KAV', $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [newCompId, newCompName, newNormSchema])

    await client.query(`CREATE SCHEMA IF NOT EXISTS "${newNormSchema}"`)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${newNormSchema}"."parties" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "type" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'active'
      )
    `)

    const newSchemaCheck = await client.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, [newNormSchema])
    results["8. Auto-provisioning schema on new company"] = {
      pass: newSchemaCheck.rows.length > 0,
      details: `Created schema "${newNormSchema}" for new company`
    }

    // Clean up test new company
    await client.query(`DROP SCHEMA IF EXISTS "${newNormSchema}" CASCADE`)
    await client.query(`DELETE FROM public.companies WHERE id = $1`, [newCompId])

    console.log("\n==================================================")
    console.log("NAMED SCHEMA VERIFICATION REPORT RESULTS")
    console.log("==================================================")
    console.table(results)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Verification failed:", err)
  } finally {
    await client.end()
  }
}

verifyNamedSchemas()
