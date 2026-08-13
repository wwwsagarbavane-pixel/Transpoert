import { Client } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

async function testSchemaQuery() {
  console.log("=== TESTING SCHEMA QUALIFIED DB OPERATOR ===")
  const pgClient = new Client({ connectionString })
  await pgClient.connect()

  const schemaName = "ganesh_transport"
  const compId = "COMP-002"
  const partyId = `PRT-TEST-${Date.now()}`

  try {
    console.log(`1. Inserting Party into "${schemaName}"."parties"...`)
    const insertSql = `
      INSERT INTO "${schemaName}"."parties" 
      ("id", "company_id", "name", "type", "gst", "pan", "phone", "mobile", "email", "contactPerson", "creditLimit", "billingAddress", "shippingAddress", "paymentTerms", "city", "state", "pincode", "status", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      RETURNING *
    `
    const insertRes = await pgClient.query(insertSql, [
      partyId, compId, "Acme Logistics Test", "Consignor", "27AAACA1234A1Z1", "AAACA1234A",
      "9820011223", "9820011223", "test@acme.com", "Rajesh", "500000", "MIDC", "MIDC",
      "30 Days", "Mumbai", "Maharashtra", "400001", "active"
    ])
    console.log("Inserted Party:", insertRes.rows[0])

    console.log(`2. Updating Party in "${schemaName}"."parties"...`)
    const updateSql = `
      UPDATE "${schemaName}"."parties"
      SET "name" = $1, "creditLimit" = $2, "updatedAt" = NOW()
      WHERE "id" = $3
      RETURNING *
    `
    const updateRes = await pgClient.query(updateSql, ["Acme Logistics (Updated)", "750000", partyId])
    console.log("Updated Party:", updateRes.rows[0])

    console.log(`3. Querying Party from "${schemaName}"."parties"...`)
    const selectRes = await pgClient.query(`SELECT * FROM "${schemaName}"."parties" WHERE id = $1`, [partyId])
    console.log("Selected Party:", selectRes.rows[0])

    // Clean up
    await pgClient.query(`DELETE FROM "${schemaName}"."parties" WHERE id = $1`, [partyId])
    console.log("Cleaned up test party.")

  } catch (err) {
    console.error("Schema query test failed:", err)
  } finally {
    await pgClient.end()
  }
}

testSchemaQuery()
