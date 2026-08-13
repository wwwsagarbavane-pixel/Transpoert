const { Client } = require('pg')

async function createTargetDb() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
  })
  try {
    await client.connect()
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'transportos_erp'")
    if (res.rowCount === 0) {
      await client.query("CREATE DATABASE transportos_erp")
      console.log("CREATED_DATABASE:transportos_erp")
    } else {
      console.log("EXISTS_DATABASE:transportos_erp")
    }
    await client.end()
  } catch (err) {
    console.error("Error creating target database:", err)
  }
}

createTargetDb()
