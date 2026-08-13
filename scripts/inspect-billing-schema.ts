import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos?schema=public" })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log("=== INSPECTING ALL TABLES IN POSTGRESQL ===")
  const allTables: any = await prisma.$queryRawUnsafe(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name
  `)
  console.log("All Tables:", allTables)

  for (const t of allTables) {
    const s = t.table_schema
    const tbl = t.table_name
    try {
      const cols: any = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = '${s}' AND table_name = '${tbl}'
        ORDER BY ordinal_position
      `)
      console.log(`\nTable '${s}.${tbl}' columns (${cols.length}):`, cols.map((c: any) => `${c.column_name} (${c.data_type})`).join(", "))
    } catch (err: any) {
      console.log(`Error inspecting ${s}.${tbl}: ${err.message}`)
    }
  }

  await prisma.$disconnect()
  await pool.end()
}

main().catch(console.error)
