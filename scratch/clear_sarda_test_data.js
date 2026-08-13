import { prisma } from "../src/db/prismaClient.ts"

async function main() {
  console.log("Clearing test records for SARDA company (comp_sarda schema)...")
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "comp_sarda"."lrs" CASCADE;`)
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "comp_sarda"."bills" CASCADE;`)
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "comp_sarda"."payments" CASCADE;`).catch(() => 0)
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "comp_sarda"."deliveries" CASCADE;`).catch(() => 0)

    console.log("SUCCESS: All test LRs, Bills, Payments, and Deliveries cleared for SARDA company!")
  } catch (err) {
    console.error("Error clearing SARDA test data:", err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
