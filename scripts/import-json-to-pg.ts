import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public" })
const prisma = new PrismaClient({ adapter })

const parseDate = (d: any): Date | null => {
  if (!d) return null
  const date = new Date(d)
  return isNaN(date.getTime()) ? null : date
}

async function importJsonData() {
  console.log("=== STARTING TRANSPORTOS JSON TO POSTGRESQL DATA MIGRATION ===")
  const jsonPath = path.resolve(process.cwd(), 'data', 'db.json')
  
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Data file not found at ${jsonPath}`)
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8')
  const data = JSON.parse(raw)

  const counts: Record<string, { json: number; pg: number; failed: number }> = {}

  const initCount = (entity: string, array: any[] | undefined) => {
    counts[entity] = { json: (array || []).length, pg: 0, failed: 0 }
  }

  initCount('companies', data.companies)
  initCount('branches', data.branches)
  initCount('users', data.users)
  initCount('parties', data.parties)
  initCount('vehicles', data.vehicles)
  initCount('drivers', data.drivers)
  initCount('owners', data.owners)
  initCount('agents', data.agents)
  initCount('stations', data.stations)
  initCount('articles', data.articles)
  initCount('lrs', data.lrs)
  initCount('deliveries', data.deliveries)
  initCount('bills', data.bills)
  initCount('payments', data.payments)
  initCount('audit_logs', data.audit_logs)

  try {
    // 1. Companies
    console.log(`\nImporting Companies (${counts.companies.json} records)...`)
    for (const c of data.companies || []) {
      try {
        await prisma.company.upsert({
          where: { id: c.id },
          update: {
            code: c.code || 'COMP',
            name: c.name || 'Company',
            city: c.city || null,
            logo: c.logo || null,
            status: c.status || 'active',
            lastLogin: parseDate(c.lastLogin),
          },
          create: {
            id: c.id,
            code: c.code || 'COMP',
            name: c.name || 'Company',
            city: c.city || null,
            logo: c.logo || null,
            status: c.status || 'active',
            lastLogin: parseDate(c.lastLogin),
            createdAt: parseDate(c.createdAt) || new Date(),
            updatedAt: parseDate(c.updatedAt) || new Date()
          }
        })
        counts.companies.pg++
      } catch (err: any) {
        console.error(`Failed to import company ${c.id}:`, err.message)
        counts.companies.failed++
      }
    }

    // Ensure dummy default company COMP-002 exists if missing
    const existingComp2 = await prisma.company.findUnique({ where: { id: 'COMP-002' } })
    if (!existingComp2) {
      await prisma.company.create({
        data: {
          id: 'COMP-002',
          code: 'GTR',
          name: 'Ganesh Transport',
          city: 'Mumbai',
          status: 'active'
        }
      })
    }

    // 2. Branches
    console.log(`Importing Branches (${counts.branches.json} records)...`)
    for (const b of data.branches || []) {
      try {
        const compId = b.company_id || 'COMP-002'
        await prisma.branch.upsert({
          where: { id: b.id },
          update: {
            company_id: compId,
            code: b.code || 'BR',
            name: b.name || 'Branch',
            city: b.city || 'City',
            state: b.state || 'State',
            type: b.type || 'Branch',
            status: b.status || 'active'
          },
          create: {
            id: b.id,
            company_id: compId,
            code: b.code || 'BR',
            name: b.name || 'Branch',
            city: b.city || 'City',
            state: b.state || 'State',
            type: b.type || 'Branch',
            status: b.status || 'active',
            createdAt: parseDate(b.createdAt) || new Date(),
            updatedAt: parseDate(b.updatedAt) || new Date()
          }
        })
        counts.branches.pg++
      } catch (err: any) {
        console.error(`Failed to import branch ${b.id}:`, err.message)
        counts.branches.failed++
      }
    }

    // 3. Users
    console.log(`Importing Users (${counts.users.json} records)...`)
    for (const u of data.users || []) {
      try {
        let compId = u.company_id || null
        if (compId) {
          const compExists = await prisma.company.findUnique({ where: { id: compId } })
          if (!compExists) compId = null
        }

        await prisma.user.upsert({
          where: { email: u.email },
          update: {
            company_id: compId,
            name: u.name || 'User',
            username: u.username || null,
            password: u.password || 'password123',
            role: u.role || 'Company User',
            assignedCompanies: u.assignedCompanies ? u.assignedCompanies : null,
            permissions: u.permissions ? u.permissions : null,
            branch: u.branch || null,
            lastLogin: parseDate(u.lastLogin),
            status: u.status || 'active'
          },
          create: {
            id: u.id || `USR-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            company_id: compId,
            name: u.name || 'User',
            username: u.username || null,
            email: u.email,
            password: u.password || 'password123',
            role: u.role || 'Company User',
            assignedCompanies: u.assignedCompanies ? u.assignedCompanies : null,
            permissions: u.permissions ? u.permissions : null,
            branch: u.branch || null,
            lastLogin: parseDate(u.lastLogin),
            status: u.status || 'active',
            createdAt: parseDate(u.createdAt) || new Date(),
            updatedAt: parseDate(u.updatedAt) || new Date()
          }
        })
        counts.users.pg++
      } catch (err: any) {
        console.error(`Failed to import user ${u.email}:`, err.message)
        counts.users.failed++
      }
    }

    // Helper for master entity imports
    const importMasterEntity = async (
      entityName: string,
      records: any[],
      prismaModel: any,
      transform: (item: any) => any
    ) => {
      console.log(`Importing ${entityName} (${records.length} records)...`)
      for (const item of records) {
        try {
          const payload = transform(item)
          const compId = payload.company_id || 'COMP-002'
          const compExists = await prisma.company.findUnique({ where: { id: compId } })
          if (!compExists) payload.company_id = 'COMP-002'

          await prismaModel.upsert({
            where: { id: item.id },
            update: payload,
            create: {
              ...payload,
              id: item.id,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date()
            }
          })
          counts[entityName].pg++
        } catch (err: any) {
          console.error(`Failed to import ${entityName} ${item.id}:`, err.message)
          counts[entityName].failed++
        }
      }
    }

    // 4. Parties
    await importMasterEntity('parties', data.parties || [], prisma.party, p => ({
      company_id: p.company_id || 'COMP-002',
      name: p.name || 'Party',
      type: p.type || 'Consignor',
      gst: p.gst || null,
      pan: p.pan || null,
      phone: p.phone || null,
      mobile: p.mobile || null,
      email: p.email || null,
      contactPerson: p.contactPerson || null,
      creditLimit: p.creditLimit ? String(p.creditLimit) : null,
      billingAddress: p.billingAddress || null,
      shippingAddress: p.shippingAddress || null,
      paymentTerms: p.paymentTerms || null,
      city: p.city || null,
      state: p.state || null,
      pincode: p.pincode || null,
      status: p.status === 1 || p.status === 'active' ? 'active' : 'inactive'
    }))

    // 5. Vehicles
    await importMasterEntity('vehicles', data.vehicles || [], prisma.vehicle, v => ({
      company_id: v.company_id || 'COMP-002',
      number: v.number || 'VEH-0000',
      type: v.type || 'Trailer',
      capacity: v.capacity || null,
      driver: v.driver || v.driverName || null,
      owner: v.owner || v.ownerName || null,
      gpsId: v.gpsId || null,
      rc: v.rc || null,
      insurance: v.insurance || null,
      fitness: v.fitness || null,
      permit: v.permit || null,
      puc: v.puc || null,
      status: String(v.status || 'active')
    }))

    // 6. Drivers
    await importMasterEntity('drivers', data.drivers || [], prisma.driver, d => ({
      company_id: d.company_id || 'COMP-002',
      name: d.name || 'Driver',
      mobile: d.mobile || null,
      altMobile: d.altMobile || null,
      license: d.license || d.licenseNo || null,
      licenseExpiry: d.licenseExpiry || null,
      aadhaar: d.aadhaar || null,
      address: d.address || null,
      emergency: d.emergency || null,
      vehicle: d.vehicle || null,
      experience: d.experience || null,
      status: String(d.status || 'active')
    }))

    // 7. Owners
    await importMasterEntity('owners', data.owners || [], prisma.owner, o => ({
      company_id: o.company_id || 'COMP-002',
      name: o.name || 'Owner',
      pan: o.pan || null,
      phone: o.phone || null,
      contact: o.contact || null,
      mobile: o.mobile || null,
      email: o.email || null,
      gst: o.gst || null,
      address: o.address || null,
      type: o.type || null,
      vehicles: typeof o.vehicles === 'number' ? o.vehicles : 1,
      status: String(o.status || 'active')
    }))

    // 8. Agents
    await importMasterEntity('agents', data.agents || [], prisma.agent, a => ({
      company_id: a.company_id || 'COMP-002',
      name: a.name || 'Agent',
      city: a.city || null,
      state: a.state || null,
      commission: a.commission || null,
      phone: a.phone || null,
      contact: a.contact || null,
      mobile: a.mobile || null,
      email: a.email || null,
      outstanding: typeof a.outstanding === 'number' ? a.outstanding : 0,
      status: String(a.status || 'active')
    }))

    // 9. Stations
    await importMasterEntity('stations', data.stations || [], prisma.station, s => ({
      company_id: s.company_id || 'COMP-002',
      name: s.name || 'Station',
      city: s.city || null,
      state: s.state || null,
      type: s.type || null,
      pincode: s.pincode || null,
      phone: s.phone || null,
      status: String(s.status || 'active')
    }))

    // 10. Articles
    await importMasterEntity('articles', data.articles || [], prisma.article, art => ({
      company_id: art.company_id || 'COMP-002',
      name: art.name || 'Article',
      packing: art.packing || null,
      hsn: art.hsn || null,
      rate: art.rate ? String(art.rate) : null,
      unit: art.unit || null,
      description: art.description || null,
      fragile: Boolean(art.fragile),
      status: String(art.status || 'active')
    }))

    // 11. LRs
    await importMasterEntity('lrs', data.lrs || [], prisma.lR, lr => ({
      company_id: lr.company_id || 'COMP-002',
      lrNo: lr.lrNo || lr.lr || 'LR-000',
      date: lr.date || new Date().toISOString().split('T')[0],
      bookingBranch: lr.bookingBranch || null,
      bookingBranchId: lr.bookingBranchId ? String(lr.bookingBranchId) : null,
      bookingStation: lr.bookingStation || null,
      deliveryStation: lr.deliveryStation || null,
      consignor: lr.consignor || null,
      consignee: lr.consignee || null,
      from: lr.from || null,
      to: lr.to || null,
      vehicle: lr.vehicle || null,
      driver: lr.driver || null,
      owner: lr.owner || null,
      agent: lr.agent || null,
      article: lr.article || null,
      packages: lr.packages ? String(lr.packages) : null,
      packageCount: typeof lr.packageCount === 'number' ? lr.packageCount : null,
      weight: lr.weight ? String(lr.weight) : null,
      freight: typeof lr.freight === 'number' ? lr.freight : 0,
      freightType: lr.freightType || null,
      paymentType: lr.paymentType || null,
      hamali: typeof lr.hamali === 'number' ? lr.hamali : 0,
      doorDeliveryCharges: typeof lr.doorDeliveryCharges === 'number' ? lr.doorDeliveryCharges : 0,
      otherCharges: typeof lr.otherCharges === 'number' ? lr.otherCharges : 0,
      gst: typeof lr.gst === 'number' ? lr.gst : 0,
      totalAmount: typeof lr.totalAmount === 'number' ? lr.totalAmount : (lr.freight || 0),
      invoice: lr.invoice || null,
      invoiceValue: typeof lr.invoiceValue === 'number' ? lr.invoiceValue : 0,
      waybill: lr.waybill || null,
      ewayBill: lr.ewayBill || null,
      expectedDelivery: lr.expectedDelivery || null,
      status: lr.status || 'Booked',
      items: lr.items ? lr.items : null
    }))

    // 12. Deliveries
    await importMasterEntity('deliveries', data.deliveries || [], prisma.delivery, del => ({
      company_id: del.company_id || 'COMP-002',
      lrNo: del.lrNo || del.lr || 'LR-000',
      lr_id: del.lr_id || null,
      date: del.date || new Date().toISOString().split('T')[0],
      deliveredTo: del.deliveredTo || null,
      receiverPhone: del.receiverPhone || null,
      status: del.status || 'Delivered',
      remarks: del.remarks || null
    }))

    // 13. Bills
    await importMasterEntity('bills', data.bills || [], prisma.bill, b => ({
      company_id: b.company_id || 'COMP-002',
      billNo: b.billNo || 'BILL-000',
      billDate: b.billDate || new Date().toISOString().split('T')[0],
      party: b.party || 'Customer Party',
      partyId: b.partyId || null,
      amount: typeof b.amount === 'number' ? b.amount : 0,
      subtotal: typeof b.subtotal === 'number' ? b.subtotal : (b.amount || 0),
      tax: typeof b.tax === 'number' ? b.tax : 0,
      totalAmount: typeof b.totalAmount === 'number' ? b.totalAmount : (b.amount || 0),
      paid: typeof b.paid === 'number' ? b.paid : 0,
      paidAmount: typeof b.paidAmount === 'number' ? b.paidAmount : (b.paid || 0),
      outstanding: typeof b.outstanding === 'number' ? b.outstanding : 0,
      lrsCount: typeof b.lrsCount === 'number' ? b.lrsCount : (b.lrs ? b.lrs.length : 0),
      lrs: b.lrs ? b.lrs : null,
      dueDate: b.dueDate || null,
      status: b.status || 'pending'
    }))

    // 14. Payments
    await importMasterEntity('payments', data.payments || [], prisma.payment, pay => ({
      company_id: pay.company_id || 'COMP-002',
      receiptNo: pay.receiptNo || 'RCP-000',
      billNo: pay.billNo || 'BILL-000',
      bill_id: pay.bill_id || null,
      date: pay.date || new Date().toISOString().split('T')[0],
      party: pay.party || 'Customer Party',
      amount: typeof pay.amount === 'number' ? pay.amount : 0,
      mode: pay.mode || 'Cash',
      referenceNo: pay.referenceNo || null,
      status: pay.status || 'Completed'
    }))

    // 15. Audit Logs
    console.log(`Importing Audit Logs (${counts.audit_logs.json} records)...`)
    for (const log of data.audit_logs || []) {
      try {
        await prisma.auditLog.upsert({
          where: { id: log.id },
          update: {
            company_id: log.company_id || 'SYSTEM',
            user: log.user || null,
            role: log.role || null,
            action: log.action || 'WRITE',
            entity: log.entity || null,
            recordId: log.recordId || log.entityId || null,
            entityId: log.entityId || log.recordId || null,
            url: log.url || null,
            payload: typeof log.payload === 'string' ? log.payload : (log.payload ? JSON.stringify(log.payload) : null),
            timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
            ip: log.ip || null
          },
          create: {
            id: log.id,
            company_id: log.company_id || 'SYSTEM',
            user: log.user || null,
            role: log.role || null,
            action: log.action || 'WRITE',
            entity: log.entity || null,
            recordId: log.recordId || log.entityId || null,
            entityId: log.entityId || log.recordId || null,
            url: log.url || null,
            payload: typeof log.payload === 'string' ? log.payload : (log.payload ? JSON.stringify(log.payload) : null),
            timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
            ip: log.ip || null,
            createdAt: log.createdAt ? new Date(log.createdAt) : new Date()
          }
        })
        counts.audit_logs.pg++
      } catch (err: any) {
        console.error(`Failed to import audit log ${log.id}:`, err.message)
        counts.audit_logs.failed++
      }
    }

    console.log("\n==================================================")
    console.log("MIGRATION SUMMARY (JSON FILE vs POSTGRESQL)")
    console.log("==================================================")
    console.table(counts)
    console.log("==================================================\n")

  } catch (err) {
    console.error("Migration failed with error:", err)
  } finally {
    await prisma.$disconnect()
  }
}

importJsonData()
