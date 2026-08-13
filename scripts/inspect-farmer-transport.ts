import { Client } from 'pg'

async function inspectFarmerTransport() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/transportos_erp' })
  await client.connect()

  console.log("=========================================================")
  console.log("INSPECTING COMP-483231 (farmer_transport) & COMP-103816 (epr_tranposrt)")
  console.log("=========================================================\n")

  const schemas = ['farmer_transport', 'epr_tranposrt']

  for (const s of schemas) {
    console.log(`\n--- Schema "${s}" Counts ---`)
    const tables = ['branches', 'stations', 'parties', 'vehicles', 'drivers', 'owners', 'agents', 'articles', 'lrs', 'deliveries', 'bills', 'payments', 'users']
    for (const t of tables) {
      try {
        const countRes = await client.query(`SELECT COUNT(*)::int as count FROM "${s}"."${t}";`)
        console.log(`  ${t}: ${countRes.rows[0].count} records`)
      } catch (err: any) {
        console.log(`  ${t}: Error (${err.message})`)
      }
    }
  }

  await client.end()
}

inspectFarmerTransport()
