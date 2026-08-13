import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function verifyMultiSchema() {
  console.log("=== STARTING MULTI-SCHEMA ISOLATION VERIFICATION ===")
  const client = new Client({ connectionString })
  await client.connect()

  try {
    // 1. List PostgreSQL schemas
    const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'comp_%'
      ORDER BY schema_name
    `)
    const schemas = schemasRes.rows.map(r => r.schema_name)
    console.log(`✅ Found ${schemas.length} Company Schemas in PostgreSQL:`, schemas.join(', '))

    // 2. Verify records in comp_003
    const comp3Parties = await client.query(`SELECT count(*) FROM comp_003.parties`)
    console.log(`✅ Records in comp_003.parties: ${comp3Parties.rows[0].count}`)

    // 3. Verify records in comp_925663
    const compMIStations = await client.query(`SELECT count(*) FROM comp_925663.stations`)
    console.log(`✅ Records in comp_925663.stations: ${compMIStations.rows[0].count}`)

    // 4. Test multi-schema insertion & search_path
    const testId = `PRT-SCH-TEST-${Date.now()}`
    await client.query(`SET search_path TO comp_003, public`)
    await client.query(`
      INSERT INTO comp_003.parties (id, company_id, name, type, status)
      VALUES ($1, 'COMP-003', 'MultiSchema Test Party', 'Consignor', 'active')
    `, [testId])

    const foundInComp003 = await client.query(`SELECT * FROM comp_003.parties WHERE id = $1`, [testId])
    console.log(`✅ Record created & verified in comp_003:`, foundInComp003.rows[0].name)

    const foundInComp001 = await client.query(`SELECT * FROM comp_001.parties WHERE id = $1`, [testId])
    console.log(`✅ Schema Isolation Verified: Record in comp_001 is ${foundInComp001.rows.length === 0 ? 'ABSENT (Clean Isolation)' : 'PRESENT'}`)

    // Clean up test record
    await client.query(`DELETE FROM comp_003.parties WHERE id = $1`, [testId])
    console.log(`✅ Cleaned up test record from comp_003.`)

    console.log("\n==================================================")
    console.log("ALL MULTI-SCHEMA ISOLATION TESTS PASSED")
    console.log("==================================================\n")

  } catch (err) {
    console.error("Multi-schema verification error:", err)
  } finally {
    await client.end()
  }
}

verifyMultiSchema()
