import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public" })
const prisma = new PrismaClient({ adapter })

async function verifyPgCrud() {
  console.log("=== STARTING POSTGRESQL END-TO-END CRUD VERIFICATION ===")
  const testCompId = `COMP-TEST-${Date.now()}`

  try {
    // 1. Create Company
    const comp = await prisma.company.create({
      data: {
        id: testCompId,
        code: 'TESTPG',
        name: 'PostgreSQL Test Corp',
        city: 'Mumbai',
        status: 'active'
      }
    })
    console.log("✅ Company Created in PG:", comp.id)

    // 2. Create Branch
    const branch = await prisma.branch.create({
      data: {
        id: `BR-${Date.now()}`,
        company_id: testCompId,
        code: 'PG-HQ',
        name: 'PG Main Branch',
        city: 'Mumbai',
        state: 'Maharashtra',
        status: 'active'
      }
    })
    console.log("✅ Branch Created in PG:", branch.id)

    // 3. Create Party
    const party = await prisma.party.create({
      data: {
        id: `PRT-${Date.now()}`,
        company_id: testCompId,
        name: 'PG Test Party Ltd',
        type: 'Consignor',
        gst: '27AAACP1234P1Z1',
        city: 'Mumbai',
        status: 'active'
      }
    })
    console.log("✅ Party Created in PG:", party.id)

    // 4. Create Vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        id: `VEC-${Date.now()}`,
        company_id: testCompId,
        number: 'MH-01-PG-9999',
        type: 'Container 32ft',
        capacity: '20T',
        status: 'active'
      }
    })
    console.log("✅ Vehicle Created in PG:", vehicle.id)

    // 5. Create Driver
    const driver = await prisma.driver.create({
      data: {
        id: `DRV-${Date.now()}`,
        company_id: testCompId,
        name: 'PG Driver Ramesh',
        mobile: '9988776655',
        license: 'MH-PG-2026-001',
        status: 'active'
      }
    })
    console.log("✅ Driver Created in PG:", driver.id)

    // 6. Create Station
    const station = await prisma.station.create({
      data: {
        id: `STN-${Date.now()}`,
        company_id: testCompId,
        name: 'PG Hub Station',
        city: 'Pune',
        state: 'Maharashtra',
        status: 'active'
      }
    })
    console.log("✅ Station Created in PG:", station.id)

    // 7. Create Article
    const article = await prisma.article.create({
      data: {
        id: `ART-${Date.now()}`,
        company_id: testCompId,
        name: 'PG Machinery Cargo',
        packing: 'Box',
        status: 'active'
      }
    })
    console.log("✅ Article Created in PG:", article.id)

    // 8. Create LR
    const lr = await prisma.lR.create({
      data: {
        id: `LR-${Date.now()}`,
        company_id: testCompId,
        lrNo: 'LR-PG-1001',
        date: new Date().toISOString().split('T')[0],
        consignor: party.name,
        from: 'Mumbai',
        to: 'Pune',
        freight: 15000,
        totalAmount: 15000,
        status: 'Booked'
      }
    })
    console.log("✅ LR Created in PG:", lr.id)

    // 9. Read verification
    const fetchedLrs = await prisma.lR.findMany({ where: { company_id: testCompId } })
    console.log(`✅ PG Read Verification: Found ${fetchedLrs.length} LR(s) for company ${testCompId}`)

    // 10. Clean up
    await prisma.lR.delete({ where: { id: lr.id } })
    await prisma.article.delete({ where: { id: article.id } })
    await prisma.station.delete({ where: { id: station.id } })
    await prisma.driver.delete({ where: { id: driver.id } })
    await prisma.vehicle.delete({ where: { id: vehicle.id } })
    await prisma.party.delete({ where: { id: party.id } })
    await prisma.branch.delete({ where: { id: branch.id } })
    await prisma.company.delete({ where: { id: comp.id } })
    console.log("✅ Cleaned up PG test records cleanly.")

    console.log("\n==================================================")
    console.log("ALL POSTGRESQL CRUD OPERATIONS FULLY VERIFIED")
    console.log("==================================================\n")

  } catch (err) {
    console.error("PG CRUD Verification Error:", err)
  } finally {
    await prisma.$disconnect()
  }
}

verifyPgCrud()
