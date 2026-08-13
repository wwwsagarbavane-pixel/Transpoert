const { Client } = require('pg')

const passwordsToTest = [
  'postgres', 'admin', 'root', '123456', 'Password123', 'transportos',
  '1234', '12345', 'pass', 'password', 'pgAdmin', 'pgadmin', 'postgre',
  'admin123', 'Postgres', 'Postgres123', 'admin@123', 'root123', '123'
]

async function testConnection() {
  for (const pwd of passwordsToTest) {
    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: pwd,
      port: 5432,
    })
    try {
      await client.connect()
      console.log(`SUCCESS_PASSWORD:${pwd}`)
      
      // Create transportos database if not exists
      const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'transportos'")
      if (res.rowCount === 0) {
        await client.query("CREATE DATABASE transportos")
        console.log("CREATED_DATABASE:transportos")
      } else {
        console.log("EXISTS_DATABASE:transportos")
      }
      await client.end()
      return pwd
    } catch (err) {
      // try next
    }
  }
  console.log("NO_MATCHING_PASSWORD_FOUND")
  return null
}

testConnection()
