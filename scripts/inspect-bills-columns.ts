import { prisma } from "../src/db/prismaClient"

async function inspectBillsColumns() {
  console.log("=== INSPECTING COLUMNS OF PUBLIC.BILLS AND COMP_103816.BILLS ===")
  try {
    const colsPublic: any = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bills'`)
    console.log("public.bills columns:", colsPublic.map((c: any) => c.column_name))
  } catch (err: any) {
    console.log("Error querying public.bills:", err.message)
  }

  try {
    const colsComp: any = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'comp_103816' AND table_name = 'bills'`)
    console.log("comp_103816.bills columns:", colsComp.map((c: any) => c.column_name))
  } catch (err: any) {
    console.log("Error querying comp_103816.bills:", err.message)
  }
}

inspectBillsColumns().catch(console.error)
