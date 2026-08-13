import { PrismaClient } from "@prisma/client"
import { prisma } from "../src/db/prismaClient"

async function testSchemaResolution() {
  console.log("=========================================================")
  console.log("TESTING SCHEMA RESOLUTION FOR MASTER COMPANIES")
  console.log("=========================================================\n")

  const companies: any = await prisma.$queryRawUnsafe(`SELECT id, code, name, schema_name FROM public.companies;`)
  console.log("Companies in public.companies:", companies)

  for (const c of companies) {
    const res: any = await prisma.$queryRawUnsafe(`SELECT schema_name, name FROM public.companies WHERE id = $1`, c.id)
    console.log(`Query for ID "${c.id}":`, res)
  }

  // Check what tables exist in farmer_transport, epr_tranposrt, demo_transport
  const schemas = ['farmer_transport', 'epr_tranposrt', 'demo_transport']
  for (const s of schemas) {
    const lrs: any = await prisma.$queryRawUnsafe(`SELECT id, "lrNo", "bookingBranch", "consignor", "consignee", "from", "to" FROM "${s}"."lrs" LIMIT 3;`)
    console.log(`\nLRs in "${s}" (${lrs.length} total):`, lrs)
  }

  console.log("=========================================================")
}

testSchemaResolution()
