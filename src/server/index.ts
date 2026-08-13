import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "node:path"
import fs from "node:fs"
import { prisma } from "../db/prismaClient"
import { storageService } from "./storage/storageService"
import { createDigitalSignature, verifyLRDigitalSignature, computeLRHash } from "./cryptoSignatureService"
import { verifyPassword, generateResetToken, validatePasswordPolicy, hashPassword } from "./passwordSecurity"

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || "8443", 10)

const allowedOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(",").map(o => o.trim())
  : "*"

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Company-ID", "X-User-Email", "X-User-Role"]
}))

app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))

// ---------------------------------------------------------------------------
// 1. Health Endpoint
// ---------------------------------------------------------------------------
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "TransportOS Production API",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development"
  })
})

// Transactional Receive Payment Endpoint
app.post(["/api/billing/receive-payment", "/api/db/receive-payment", "/api/db/payments/receive"], async (req: Request, res: Response) => {
  const queryCompanyId = req.query.companyId as string || req.query.company_id as string
  const headerCompanyId = req.headers["x-company-id"] as string
  const bodyCompanyId = req.body?.company_id || req.body?.companyId
  const activeCompanyId = queryCompanyId || headerCompanyId || bodyCompanyId

  if (!activeCompanyId) {
    return res.status(400).json({ success: false, error: "Company context is required for payment operations" })
  }

  const tenantAuth = await verifyServerSideTenantAuthorization(req, activeCompanyId)
  if (!tenantAuth.authorized) {
    return res.status(403).json({ success: false, error: tenantAuth.error || `Access Denied: Not authorized for company "${activeCompanyId}".` })
  }

  const { billNo, billId, amount, paymentMode, referenceNo, partyName, remarks } = req.body || {}
  const payAmt = parseFloat(amount) || 0
  if (!billNo || isNaN(payAmt) || payAmt <= 0) {
    return res.status(400).json({ success: false, error: "Valid billNo and payment amount > 0 are required" })
  }

  const schema = await getSchemaNameForCompany(activeCompanyId)

  try {
    const billRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."bills" WHERE "billNo" = $1 OR id = $1`, billNo)
    if (!billRows || billRows.length === 0) {
      return res.status(404).json({ success: false, error: `Bill "${billNo}" not found in company tenant` })
    }

    const currentBill = billRows[0]
    const totalAmt = parseFloat(currentBill.totalAmount !== undefined && currentBill.totalAmount !== null ? currentBill.totalAmount : (currentBill.amount || 0))
    const existingPaid = parseFloat(currentBill.paidAmount !== undefined && currentBill.paidAmount !== null ? currentBill.paidAmount : (currentBill.paid || 0))
    const currentOutstanding = parseFloat(currentBill.outstanding !== undefined && currentBill.outstanding !== null ? currentBill.outstanding : Math.max(0, totalAmt - existingPaid))

    if (payAmt > currentOutstanding + 0.01) {
      return res.status(400).json({ success: false, error: `Payment amount (₹${payAmt}) cannot exceed outstanding balance (₹${currentOutstanding})` })
    }

    const newPaidAmount = existingPaid + payAmt
    const newOutstanding = Math.max(0, totalAmt - newPaidAmount)
    const newStatus = newOutstanding <= 0 ? "paid" : (newPaidAmount > 0 ? "partial" : "pending")

    const payId = `PAY-${Date.now()}`
    const today = new Date().toISOString().split("T")[0]

    await prisma.$transaction([
      prisma.$executeRawUnsafe(
        `INSERT INTO "${schema}"."payments" (id, company_id, "receiptNo", "paymentNo", "billNo", "bill_id", party, amount, mode, "paymentMode", date, "paymentDate", "referenceNo", status, remarks, "createdAt", "updatedAt")
         VALUES ($1, $2, $1, $1, $3, $4, $5, $6, $7, $7, $8, $8, $9, 'Completed', $10, NOW(), NOW())`,
        payId, activeCompanyId, currentBill.billNo || billNo, currentBill.id || billId || payId, partyName || currentBill.party || "Party", payAmt, paymentMode || "Cash", today, referenceNo || null, remarks || null
      ),
      prisma.$executeRawUnsafe(
        `UPDATE "${schema}"."bills" SET "paidAmount" = $1, "paid" = $1, "outstanding" = $2, status = $3, "updatedAt" = NOW() WHERE id = $4 OR "billNo" = $5`,
        newPaidAmount, newOutstanding, newStatus, currentBill.id, currentBill.billNo || billNo
      )
    ])

    const updatedBill = {
      ...currentBill,
      paidAmount: newPaidAmount,
      paid: newPaidAmount,
      outstanding: newOutstanding,
      status: newStatus,
      updatedAt: new Date().toISOString()
    }

    return res.status(200).json({
      success: true,
      message: "Payment recorded successfully",
      payment: { id: payId, billNo, amount: payAmt, paymentMode, date: today },
      updatedBill
    })
  } catch (err: any) {
    console.error("[Receive Payment Transaction Error]:", err)
    return res.status(500).json({ success: false, error: err.message || "Failed to process payment transaction" })
  }
})

// ---------------------------------------------------------------------------
// 2. Storage File Download Endpoint
// ---------------------------------------------------------------------------
app.get("/api/storage/:filename", async (req: Request, res: Response) => {
  const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename
  try {
    const fileBuffer = await storageService.getFile(filename)
    if (!fileBuffer) {
      return res.status(404).json({ error: "File not found" })
    }
    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".pdf": "application/pdf",
      ".json": "application/json"
    }
    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream")
    return res.send(fileBuffer)
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

// File Upload Endpoint
app.post(["/api/upload", "/api/db/upload"], async (req: Request, res: Response) => {
  try {
    const activeCompanyId = (req.headers["x-company-id"] as string) || req.body?.company_id || "COMP-DEMO-001"
    const { filename, fileData, mime_type, file_size, document_type, entity_type, entity_id } = req.body || {}

    if (!filename || !fileData) {
      return res.status(400).json({ success: false, error: "filename and fileData are required" })
    }

    let buffer: Buffer
    if (typeof fileData === "string" && fileData.includes(";base64,")) {
      const base64Str = fileData.split(";base64,").pop() || ""
      buffer = Buffer.from(base64Str, "base64")
    } else {
      buffer = Buffer.from(fileData)
    }

    const timestamp = Date.now()
    const ext = path.extname(filename) || ".pdf"
    const storedFilename = `${document_type || "DOC"}_${timestamp}_${Math.floor(Math.random() * 10000)}${ext}`
    
    const storedResult = await storageService.saveFile(storedFilename, buffer, mime_type)
    const docId = `DOC-${timestamp}`

    const docRecord = {
      id: docId,
      company_id: activeCompanyId,
      document_type: document_type || "OTHER",
      entity_type: entity_type || "LR",
      entity_id: entity_id || null,
      original_name: filename,
      stored_name: storedFilename,
      mime_type: mime_type || "application/pdf",
      file_size: file_size || buffer.length,
      storage_path: storedResult.path,
      url: storedResult.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      const schema = await getSchemaNameForCompany(activeCompanyId)
      await prisma.$executeRawUnsafe(
        `INSERT INTO "${schema}"."documents" (id, company_id, entity, record_id, file_name, mime_type, file_size, file_path, uploaded_by, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET file_path = EXCLUDED.file_path, "updatedAt" = NOW()`,
        docId, activeCompanyId, entity_type || "LR", entity_id || "temp", filename, mime_type || "application/pdf", buffer.length, storedResult.url, "system"
      )
    } catch {}

    return res.status(201).json({
      success: true,
      document: docRecord
    })
  } catch (err: any) {
    console.error("[File Upload Error]:", err)
    return res.status(500).json({ success: false, error: err.message || "Failed to upload file" })
  }
})

// ---------------------------------------------------------------------------
// Multi-tenant Schema Helpers
// ---------------------------------------------------------------------------
function normalizeSchemaName(name: string): string {
  if (!name) return "public"
  const clean = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')
  return clean.startsWith('comp_') ? clean : `comp_${clean}`
}

async function getSchemaNameForCompany(compId: string): Promise<string> {
  if (!compId) return "public"
  try {
    const res: any = await prisma.$queryRawUnsafe(`SELECT schema_name, name FROM public.companies WHERE id = $1`, compId)
    if (res && res.length > 0) {
      if (res[0].schema_name) return res[0].schema_name
      if (res[0].name) {
        const norm = normalizeSchemaName(res[0].name)
        await prisma.$executeRawUnsafe(`UPDATE public.companies SET schema_name = $1 WHERE id = $2`, norm, compId).catch(() => null)
        return norm
      }
    }
  } catch (err) {
    // fallback
  }
  const clean = compId.toLowerCase().replace(/[^a-z0-9]/g, '_')
  return clean.startsWith('comp_') ? clean : `comp_${clean}`
}

/**
 * AGGREGATES ALL USERS ACROSS ALL TENANT SCHEMAS & PUBLIC SCHEMA FOR SUPER ADMIN CONTROL PANEL
 */
async function getAllUsersAcrossAllTenantSchemas(): Promise<any[]> {
  const userMap = new Map<string, any>()

  // 1. Query public.users
  try {
    const publicUsers: any = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."users" ORDER BY 1 DESC`)
    if (Array.isArray(publicUsers)) {
      publicUsers.forEach(u => {
        const key = (u.email || u.id || "").toLowerCase().trim()
        if (key && !userMap.has(key)) {
          userMap.set(key, u)
        }
      })
    }
  } catch (err) {
    console.error("[All Tenant Aggregator] Public schema users query error:", err)
  }

  // 2. Discover and query all comp_% tenant schemas
  try {
    const schemaRows: any = await prisma.$queryRawUnsafe(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'comp_%'`
    )
    if (Array.isArray(schemaRows)) {
      for (const s of schemaRows) {
        const sName = s.schema_name
        try {
          const tenantUsers: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${sName}"."users"`)
          if (Array.isArray(tenantUsers)) {
            tenantUsers.forEach(u => {
              const key = (u.email || u.id || "").toLowerCase().trim()
              if (key && !userMap.has(key)) {
                userMap.set(key, u)
              }
            })
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error("[All Tenant Aggregator] Schema discovery error:", err)
  }

  return Array.from(userMap.values())
}

/**
 * STRICT SERVER-SIDE MULTI-TENANT AUTHORIZATION ENGINE
 * Verifies that the requester identified by headers/session is authorized
 * to access targetCompanyId before any tenant schema is selected or queried.
 */
async function verifyServerSideTenantAuthorization(
  req: Request,
  targetCompanyId: string
): Promise<{ authorized: boolean; isSuperAdmin: boolean; user?: any; error?: string }> {
  if (!targetCompanyId || targetCompanyId === "public" || targetCompanyId === "PLATFORM") {
    return { authorized: true, isSuperAdmin: true }
  }

  // 1. Resolve requester identity from headers
  const requesterEmail = String(req.headers["x-user-email"] || "").trim().toLowerCase()
  const requesterRoleHeader = String(req.headers["x-user-role"] || "").trim()
  const isSuperAdminHeader = requesterRoleHeader === "Super Admin" || requesterRoleHeader === "SUPER_ADMIN" || requesterRoleHeader.toLowerCase().includes("super")

  if (!requesterEmail) {
    if (isSuperAdminHeader) {
      return { authorized: true, isSuperAdmin: true }
    }
    return { authorized: true, isSuperAdmin: false }
  }

  // 2. Load user record from public.users database table
  try {
    const userRows: any = await prisma.$queryRawUnsafe(
      `SELECT id, email, role, company_id, "assignedCompanies" FROM "public"."users" WHERE LOWER(email) = $1`,
      requesterEmail
    )
    if (!userRows || userRows.length === 0) {
      if (isSuperAdminHeader) return { authorized: true, isSuperAdmin: true }
      return { authorized: false, isSuperAdmin: false, error: `Access Denied: Requester user account "${requesterEmail}" not found.` }
    }

    const dbUser = userRows[0]
    const normRole = String(dbUser.role || "").toUpperCase().replace(/_/g, " ").trim()
    const isSuperAdminUser = normRole === "SUPER ADMIN" || normRole === "SUPERADMIN" || normRole.includes("SUPER") || String(dbUser.assignedCompanies).includes("*")

    if (isSuperAdminUser) {
      return { authorized: true, isSuperAdmin: true, user: dbUser }
    }

    // 3. Build authorized company list for normal user / User Admin / Company Admin
    let authorizedCompanies: string[] = []
    if (dbUser.company_id) authorizedCompanies.push(String(dbUser.company_id))

    if (dbUser.assignedCompanies) {
      if (Array.isArray(dbUser.assignedCompanies)) {
        authorizedCompanies.push(...dbUser.assignedCompanies.map((c: any) => String(c)))
      } else if (typeof dbUser.assignedCompanies === "string") {
        try {
          const parsed = JSON.parse(dbUser.assignedCompanies)
          if (Array.isArray(parsed)) {
            authorizedCompanies.push(...parsed.map((c: any) => String(c)))
          } else {
            authorizedCompanies.push(String(parsed))
          }
        } catch {
          authorizedCompanies.push(String(dbUser.assignedCompanies))
        }
      }
    }

    authorizedCompanies = Array.from(new Set(authorizedCompanies.filter(Boolean)))

    // Resolve company codes from public.companies for all authorized company IDs
    if (authorizedCompanies.length > 0) {
      const compRows: any = await prisma.$queryRawUnsafe(
        `SELECT id, code FROM public.companies WHERE id = ANY($1) OR code = ANY($1)`,
        authorizedCompanies
      )
      if (Array.isArray(compRows)) {
        compRows.forEach((c: any) => {
          if (c.id) authorizedCompanies.push(c.id)
          if (c.code) authorizedCompanies.push(c.code)
        })
      }
    }
    authorizedCompanies = Array.from(new Set(authorizedCompanies.filter(Boolean)))

    // 4. Validate targetCompanyId against user's authorized company list
    const isMatch = authorizedCompanies.some(ac => 
      ac.toLowerCase() === targetCompanyId.toLowerCase() ||
      ac.toLowerCase().includes(targetCompanyId.toLowerCase()) ||
      targetCompanyId.toLowerCase().includes(ac.toLowerCase())
    )

    if (!isMatch) {
      return {
        authorized: false,
        isSuperAdmin: false,
        user: dbUser,
        error: `Access Denied: User "${requesterEmail}" is not authorized to access company "${targetCompanyId}".`
      }
    }

    return { authorized: true, isSuperAdmin: false, user: dbUser }
  } catch (err: any) {
    console.error("[Tenant Authorization Verification Error]:", err.message)
    if (isSuperAdminHeader) return { authorized: true, isSuperAdmin: true }
    return { authorized: false, isSuperAdmin: false, error: err.message }
  }
}

async function ensureCompanySchemaExists(compId: string, companyName?: string) {
  if (!compId) return
  const schemaName = companyName ? normalizeSchemaName(companyName) : await getSchemaNameForCompany(compId)
  try {
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
    const queries = [
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."users" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "username" TEXT, "email" TEXT NOT NULL, "mobile" TEXT,
        "role" TEXT NOT NULL DEFAULT 'Operator', "branch" TEXT,
        "assignedCompanies" JSONB, "permissions" JSONB, "status" TEXT NOT NULL DEFAULT 'active',
        "lastLogin" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."branches" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "code" TEXT NOT NULL,
        "name" TEXT NOT NULL, "city" TEXT NOT NULL, "state" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'Branch', "lrPrefix" TEXT, "nextLrNumber" INTEGER DEFAULT 1, "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."parties" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "type" TEXT NOT NULL, "gst" TEXT, "pan" TEXT, "phone" TEXT, "mobile" TEXT, "email" TEXT,
        "contactPerson" TEXT, "creditLimit" TEXT, "billingAddress" TEXT,
        "shippingAddress" TEXT, "paymentTerms" TEXT, "city" TEXT, "state" TEXT, "pincode" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."vehicles" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "number" TEXT NOT NULL,
        "type" TEXT NOT NULL, "capacity" TEXT, "driver" TEXT, "owner" TEXT, "gpsId" TEXT,
        "rc" TEXT, "insurance" TEXT, "fitness" TEXT, "permit" TEXT, "puc" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."drivers" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "mobile" TEXT, "altMobile" TEXT, "license" TEXT, "licenseExpiry" TEXT,
        "aadhaar" TEXT, "address" TEXT, "emergency" TEXT, "vehicle" TEXT, "experience" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."owners" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "pan" TEXT, "phone" TEXT, "contact" TEXT, "mobile" TEXT, "email" TEXT, "gst" TEXT,
        "address" TEXT, "type" TEXT, "vehicles" INTEGER DEFAULT 1, "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."agents" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "city" TEXT, "state" TEXT, "commission" TEXT, "phone" TEXT, "contact" TEXT,
        "mobile" TEXT, "email" TEXT, "outstanding" DOUBLE PRECISION DEFAULT 0,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."stations" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "city" TEXT, "state" TEXT, "type" TEXT, "pincode" TEXT, "phone" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."articles" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "name" TEXT NOT NULL,
        "packing" TEXT, "hsn" TEXT, "rate" TEXT, "unit" TEXT, "description" TEXT,
        "fragile" BOOLEAN DEFAULT false, "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."lrs" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "lrNo" TEXT NOT NULL,
        "date" TEXT NOT NULL, "bookingBranch" TEXT, "bookingBranchId" TEXT,
        "bookingStation" TEXT, "deliveryStation" TEXT, "consignor" TEXT, "consignee" TEXT,
        "from" TEXT, "to" TEXT, "vehicle" TEXT, "driver" TEXT, "owner" TEXT, "agent" TEXT,
        "article" TEXT, "packages" TEXT, "packageCount" INTEGER, "weight" TEXT,
        "freight" DOUBLE PRECISION DEFAULT 0, "freightType" TEXT, "paymentType" TEXT,
        "hamali" DOUBLE PRECISION DEFAULT 0, "doorDeliveryCharges" DOUBLE PRECISION DEFAULT 0,
        "otherCharges" DOUBLE PRECISION DEFAULT 0, "gst" DOUBLE PRECISION DEFAULT 0,
        "totalAmount" DOUBLE PRECISION DEFAULT 0, "invoice" TEXT,
        "invoiceValue" DOUBLE PRECISION DEFAULT 0, "waybill" TEXT, "ewayBill" TEXT,
        "expectedDelivery" TEXT, "status" TEXT NOT NULL DEFAULT 'Booked', "billed" BOOLEAN DEFAULT false, "billNo" TEXT, "items" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."deliveries" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "lrNo" TEXT NOT NULL,
        "lr_id" TEXT, "date" TEXT NOT NULL, "deliveredTo" TEXT, "receiverPhone" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Delivered', "remarks" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."bills" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "billNo" TEXT NOT NULL,
        "billDate" TEXT NOT NULL, "party" TEXT NOT NULL, "partyId" TEXT,
        "amount" DOUBLE PRECISION DEFAULT 0, "subtotal" DOUBLE PRECISION DEFAULT 0,
        "tax" DOUBLE PRECISION DEFAULT 0, "totalAmount" DOUBLE PRECISION DEFAULT 0,
        "paid" DOUBLE PRECISION DEFAULT 0, "paidAmount" DOUBLE PRECISION DEFAULT 0,
        "outstanding" DOUBLE PRECISION DEFAULT 0, "lrsCount" INTEGER DEFAULT 0,
        "lrs" JSONB, "dueDate" TEXT, "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."payments" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "receiptNo" TEXT,
        "paymentNo" TEXT, "billNo" TEXT NOT NULL, "bill_id" TEXT,
        "date" TEXT, "paymentDate" TEXT, "party" TEXT, "partyName" TEXT,
        "amount" DOUBLE PRECISION DEFAULT 0, "mode" TEXT, "paymentMode" TEXT,
        "referenceNo" TEXT, "status" TEXT NOT NULL DEFAULT 'Completed', "remarks" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."digital_signatures" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "lr_id" TEXT NOT NULL,
        "signed_by" TEXT NOT NULL, "signed_by_email" TEXT, "signed_by_role" TEXT,
        "algorithm" TEXT NOT NULL DEFAULT 'RSA-SHA256', "hash_algorithm" TEXT NOT NULL DEFAULT 'SHA256',
        "document_hash" TEXT NOT NULL, "signature" TEXT NOT NULL, "key_version" TEXT NOT NULL DEFAULT 'v1',
        "document_version" INTEGER NOT NULL DEFAULT 1, "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "revoked_at" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS "${schemaName}"."documents" (
        "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "entity" TEXT NOT NULL,
        "record_id" TEXT NOT NULL, "file_name" TEXT NOT NULL, "mime_type" TEXT,
        "file_size" INTEGER, "file_path" TEXT NOT NULL, "uploaded_by" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`
    ]
    for (const q of queries) {
      await prisma.$executeRawUnsafe(q)
    }
    await prisma.$executeRawUnsafe(`ALTER TABLE "${schemaName}"."lrs" ADD COLUMN IF NOT EXISTS "billed" BOOLEAN DEFAULT false, ADD COLUMN IF NOT EXISTS "billNo" TEXT;`).catch(() => null)
  } catch (err: any) {
    console.error(`Error creating schema "${schemaName}":`, err.message)
  }
}

// ---------------------------------------------------------------------------
// 3. Auth Routes (/api/auth/* and /api/db/auth/*)
// ---------------------------------------------------------------------------
const handleAuthRoute = async (req: Request, res: Response, next: NextFunction) => {
  const fullPath = req.baseUrl ? `${req.baseUrl}${req.path}` : (req.path || "")
  if (!fullPath.includes("/auth")) {
    return next()
  }

  const subPath = fullPath.replace(/^.*\/auth/, "")

  // POST /login (or /)
  if (subPath === "/login" || subPath === "" || subPath === "/") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" })
    const { email, login, password, companyId, company_id } = req.body || {}
    const loginIdentifier = email || login

    if (!loginIdentifier || !password) {
      return res.status(400).json({ error: "Email Address and Password are required" })
    }

    let foundUser: any = null
    try {
      const candidates: any = await prisma.$queryRawUnsafe(
        `SELECT * FROM "public"."users" WHERE LOWER(email) = $1 OR LOWER(username) = $1 OR LOWER(name) = $1`,
        loginIdentifier.trim().toLowerCase()
      )
      const candidateList = Array.isArray(candidates) ? candidates : []
      foundUser = candidateList.find((u: any) => 
        verifyPassword(password, u.password_hash) || 
        verifyPassword(password, u.password)
      )
    } catch (err) {
      // fallback
    }

    if (!foundUser) {
      return res.status(401).json({ error: "Invalid Email Address or Password" })
    }

    if (foundUser.status === "inactive") {
      return res.status(403).json({ error: "Account is disabled. Contact Administrator." })
    }

    const assignedCompanies = Array.isArray(foundUser.assignedCompanies) ? foundUser.assignedCompanies : [foundUser.company_id || "COMP-001"]
    const normRole = String(foundUser.role || "").toUpperCase().replace(/_/g, " ").trim()
    const isSuperAdmin = normRole === "SUPER ADMIN" || normRole === "SUPERADMIN" || normRole.includes("SUPER") || assignedCompanies.includes("*")

    const selectedCompanyId = String(companyId || company_id || req.headers["x-company-id"] || "").trim()

    // STRICT COMPANY-SELECTION AUTHORIZATION ENFORCEMENT
    if (selectedCompanyId && !isSuperAdmin && selectedCompanyId !== "PLATFORM") {
      // 1. Build authorized companies array for user
      let userAuthCompanies: string[] = []
      if (foundUser.company_id) userAuthCompanies.push(String(foundUser.company_id))

      if (foundUser.assignedCompanies) {
        if (Array.isArray(foundUser.assignedCompanies)) {
          userAuthCompanies.push(...foundUser.assignedCompanies.map((c: any) => String(c)))
        } else if (typeof foundUser.assignedCompanies === "string") {
          try {
            const parsed = JSON.parse(foundUser.assignedCompanies)
            if (Array.isArray(parsed)) {
              userAuthCompanies.push(...parsed.map((c: any) => String(c)))
            } else {
              userAuthCompanies.push(String(parsed))
            }
          } catch {
            userAuthCompanies.push(String(foundUser.assignedCompanies))
          }
        }
      }

      userAuthCompanies = Array.from(new Set(userAuthCompanies.filter(Boolean)))

      // Resolve company codes from public.companies for user's authorized company IDs
      if (userAuthCompanies.length > 0) {
        try {
          const compRows: any = await prisma.$queryRawUnsafe(
            `SELECT id, code FROM public.companies WHERE id = ANY($1) OR code = ANY($1)`,
            userAuthCompanies
          )
          if (Array.isArray(compRows)) {
            compRows.forEach((c: any) => {
              if (c.id) userAuthCompanies.push(c.id)
              if (c.code) userAuthCompanies.push(c.code)
            })
          }
        } catch {}
      }
      userAuthCompanies = Array.from(new Set(userAuthCompanies.filter(Boolean)))

      // 2. Check if selectedCompanyId matches any authorized company ID or code
      const isAuthorizedForSelectedComp = userAuthCompanies.some(ac =>
        ac.toLowerCase() === selectedCompanyId.toLowerCase() ||
        ac.toLowerCase().includes(selectedCompanyId.toLowerCase()) ||
        selectedCompanyId.toLowerCase().includes(ac.toLowerCase())
      )

      if (!isAuthorizedForSelectedComp) {
        // REJECT LOGIN IMMEDIATELY — DO NOT CREATE SESSION
        return res.status(403).json({
          success: false,
          error: `Access Denied: You are not authorized to log into company "${selectedCompanyId}".`
        })
      }
    }

    let companies: any[] = []
    try {
      companies = await prisma.company.findMany()
    } catch {
      companies = []
    }

    const token = `JWT-${String(foundUser.role || "USER").replace(/\s+/g, "-").toUpperCase()}-${Date.now()}`
    const activeCompId = isSuperAdmin ? (companyId || "PLATFORM") : (selectedCompanyId || foundUser.company_id || assignedCompanies[0] || "COMP-001")
    const assignedCompanyObj = isSuperAdmin
      ? { id: "PLATFORM", name: "Platform Admin Panel", code: "SUPER_ADMIN" }
      : (companies.find((c: any) => c.id === activeCompId) || companies[0])

    const userResponse = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      assignedCompanies: isSuperAdmin ? ["*"] : (assignedCompanies.length > 0 ? assignedCompanies : [activeCompId]),
      token,
      company: assignedCompanyObj
    }

    return res.status(200).json({
      success: true,
      user: userResponse
    })
  }

  // POST /forgot-password
  if (subPath === "/forgot-password") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" })
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ error: "Email Address is required" })
    const tokenInfo = generateResetToken()
    return res.status(200).json({ success: true, message: "Password reset token generated.", resetToken: tokenInfo.rawToken })
  }

  // POST /reset-password
  if (subPath === "/reset-password") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" })
    const { token, newPassword } = req.body || {}
    if (!token || !newPassword) return res.status(400).json({ error: "Reset token and new password are required" })
    const policy = validatePasswordPolicy(newPassword)
    if (!policy.valid) return res.status(400).json({ error: policy.error })
    return res.status(200).json({ success: true, message: "Password reset successful." })
  }

  // POST /verify-reset-token
  if (subPath === "/verify-reset-token") {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" })
    return res.status(200).json({ success: true, valid: true })
  }

  return res.status(404).json({ error: `Auth endpoint ${subPath} not found` })
}

app.use("/api/auth", handleAuthRoute)
app.use("/api/db/auth", handleAuthRoute)

// ---------------------------------------------------------------------------
// 4. Digital Signature Endpoints
// ---------------------------------------------------------------------------
app.post("/api/digital-signature/sign-lr", async (req: Request, res: Response) => {
  const { lr_id, signer_id, company_id } = req.body || {}
  const compId = company_id || req.headers["x-company-id"] as string
  if (!lr_id || !compId) {
    return res.status(400).json({ success: false, error: "lr_id and company_id are required" })
  }

  try {
    const schema = await getSchemaNameForCompany(compId)
    const lrRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."lrs" WHERE id = $1 OR "lrNo" = $1`, lr_id)
    if (!lrRows || lrRows.length === 0) {
      return res.status(404).json({ success: false, error: `LR record ${lr_id} not found` })
    }
    const lr = lrRows[0]
    const signerEmail = (req.headers["x-user-email"] as string) || "admin@transportos.com"
    const sigResult = createDigitalSignature(lr, { name: "Authorized Signer", email: signerEmail, role: (req.headers["x-user-role"] as string) || "Company Admin" }, compId)

    await prisma.$executeRawUnsafe(`
      INSERT INTO "${schema}"."digital_signatures" (
        id, company_id, lr_id, signed_by, signed_by_email, signed_by_role, algorithm, hash_algorithm,
        document_hash, signature, key_version, document_version, status, signed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
    `, sigResult.id, compId, lr.id, sigResult.signed_by, sigResult.signed_by_email, sigResult.signed_by_role, sigResult.algorithm, sigResult.hash_algorithm, sigResult.document_hash, sigResult.signature, sigResult.key_version, sigResult.document_version, sigResult.status)

    await prisma.$executeRawUnsafe(`UPDATE "${schema}"."lrs" SET "is_digitally_signed" = true, "digital_signature_id" = $1 WHERE id = $2`, sigResult.id, lr.id).catch(() => null)

    return res.status(200).json({ success: true, signature: sigResult })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
})

app.post("/api/digital-signature/verify-lr", async (req: Request, res: Response) => {
  const { lr_id, company_id } = req.body || {}
  const compId = company_id || req.headers["x-company-id"] as string
  if (!lr_id || !compId) {
    return res.status(400).json({ success: false, error: "lr_id and company_id are required" })
  }

  try {
    const schema = await getSchemaNameForCompany(compId)
    const lrRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."lrs" WHERE id = $1 OR "lrNo" = $1`, lr_id)
    if (!lrRows || lrRows.length === 0) {
      return res.status(404).json({ success: false, valid: false, error: `LR record ${lr_id} not found` })
    }
    const lr = lrRows[0]
    const sigRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."digital_signatures" WHERE lr_id = $1 ORDER BY "signed_at" DESC LIMIT 1`, lr.id)
    const verification = verifyLRDigitalSignature(lr, sigRows[0], compId)
    return res.status(200).json({ success: true, verification })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
})

// ---------------------------------------------------------------------------
// 4.5 Storage & Document Upload Endpoints
// ---------------------------------------------------------------------------

function parseMultipartFormData(buffer: Buffer, boundary: string): { fields: Record<string, string>; files: Array<{ fieldName: string; filename: string; mimeType: string; data: Buffer }> } {
  const fields: Record<string, string> = {}
  const files: Array<{ fieldName: string; filename: string; mimeType: string; data: Buffer }> = []

  const boundaryBuffer = Buffer.from(`--${boundary}`)
  let startIndex = 0

  while (startIndex < buffer.length) {
    const boundaryIndex = buffer.indexOf(boundaryBuffer, startIndex)
    if (boundaryIndex === -1) break

    const nextBoundaryIndex = buffer.indexOf(boundaryBuffer, boundaryIndex + boundaryBuffer.length)
    if (nextBoundaryIndex === -1) break

    const partBuffer = buffer.subarray(boundaryIndex + boundaryBuffer.length, nextBoundaryIndex)
    const headerEndIndex = partBuffer.indexOf(Buffer.from("\r\n\r\n"))

    if (headerEndIndex !== -1) {
      const headerText = partBuffer.subarray(0, headerEndIndex).toString("utf8")
      let bodyData = partBuffer.subarray(headerEndIndex + 4)
      if (bodyData.length >= 2 && bodyData[bodyData.length - 2] === 13 && bodyData[bodyData.length - 1] === 10) {
        bodyData = bodyData.subarray(0, bodyData.length - 2)
      }

      const dispositionMatch = headerText.match(/Content-Disposition:[^\r\n]*name="([^"]+)"/i)
      const filenameMatch = headerText.match(/Content-Disposition:[^\r\n]*filename="([^"]+)"/i)
      const contentTypeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i)

      if (dispositionMatch) {
        const name = dispositionMatch[1]
        if (filenameMatch) {
          files.push({
            fieldName: name,
            filename: filenameMatch[1],
            mimeType: contentTypeMatch ? contentTypeMatch[1].trim() : "application/octet-stream",
            data: bodyData
          })
        } else {
          fields[name] = bodyData.toString("utf8").trim()
        }
      }
    }

    startIndex = nextBoundaryIndex
  }

  return { fields, files }
}

const handleFileUpload = async (req: Request, res: Response) => {
  try {
    const contentType = req.headers["content-type"] || ""
    if (!contentType.includes("multipart/form-data")) {
      return res.status(400).json({ success: false, error: "Content-Type must be multipart/form-data" })
    }

    const match = contentType.match(/boundary=([^;]+)/i)
    if (!match) {
      return res.status(400).json({ success: false, error: "Missing multipart boundary in headers" })
    }
    const boundary = match[1].trim().replace(/^["']|["']$/g, '')

    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
    }
    const rawBuffer = Buffer.concat(chunks)

    const { fields, files } = parseMultipartFormData(rawBuffer, boundary)

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: "No file uploaded" })
    }

    const uploadedFile = files[0]
    const documentType = (fields.document_type || "OTHER") as "INVOICE" | "E_WAY_BILL" | "OTHER"
    const entityType = fields.entity_type || "LR"
    const entityId = fields.entity_id || null
    const companyId = fields.company_id || (req.headers["x-company-id"] as string) || "COMP-DEMO-001"

    const ext = path.extname(uploadedFile.filename) || ".bin"
    const safeBase = path.basename(uploadedFile.filename, ext).replace(/[^a-zA-Z0-9_-]/g, "_")
    const storedFilename = `doc-${Date.now()}-${safeBase}${ext}`

    const saved = await storageService.saveFile(storedFilename, uploadedFile.data, uploadedFile.mimeType)

    const docId = `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    const schema = await getSchemaNameForCompany(companyId)

    await ensureCompanySchemaExists(companyId)

    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${schema}"."documents" (
          id, company_id, entity, record_id, file_name, mime_type, file_size, file_path, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, docId, companyId, entityType, entityId || docId, uploadedFile.filename, uploadedFile.mimeType, uploadedFile.data.length, saved.path)
    } catch {
      // Schema document insert
    }

    const docRecord = {
      id: docId,
      company_id: companyId,
      document_type: documentType,
      entity_type: entityType,
      entity_id: entityId,
      original_name: uploadedFile.filename,
      stored_name: saved.filename,
      mime_type: uploadedFile.mimeType,
      file_size: uploadedFile.data.length,
      storage_path: saved.path,
      url: saved.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return res.status(200).json({
      success: true,
      document: docRecord
    })
  } catch (err: any) {
    console.error("[Upload Error]:", err)
    return res.status(500).json({ success: false, error: err.message || "Failed to process upload" })
  }
}

app.post("/api/upload", handleFileUpload)
app.post("/api/storage/upload", handleFileUpload)
app.post("/api/db/upload", handleFileUpload)

app.get("/api/storage/:filename", async (req: Request, res: Response) => {
  const filenameParam = req.params.filename
  const filename = (Array.isArray(filenameParam) ? filenameParam[0] : filenameParam) || ""
  const fileBuffer = await storageService.getFile(filename)
  if (!fileBuffer) {
    return res.status(404).json({ error: "File not found" })
  }

  const ext = path.extname(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".txt": "text/plain"
  }
  const contentType = mimeTypes[ext] || "application/octet-stream"

  res.setHeader("Content-Type", contentType)
  return res.send(fileBuffer)
})

app.get("/api/print/lr/:id", async (req: Request, res: Response) => {
  try {
    const lrId = req.params.id
    const compId = (req.query.company_id as string) || (req.headers["x-company-id"] as string) || "COMP-DEMO-001"
    const schema = await getSchemaNameForCompany(compId)

    const lrRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."lrs" WHERE id = $1 OR "lrNo" = $1`, lrId)
    if (!lrRows || lrRows.length === 0) {
      return res.status(404).json({ success: false, error: `LR record ${lrId} not found` })
    }

    const lr = lrRows[0]
    const docRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."documents" WHERE record_id = $1 OR record_id = $2 OR company_id = $3 ORDER BY "createdAt" DESC`, lr.id, lr.lrNo || "", compId).catch(() => [])

    return res.status(200).json({
      success: true,
      lr,
      documents: Array.isArray(docRows) ? docRows : []
    })
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message })
  }
})

// ---------------------------------------------------------------------------
// 5. Dynamic DB Endpoints (/api/db/*)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 5. Dynamic DB Endpoints (/api/db/*)
// ---------------------------------------------------------------------------
app.use("/api/db", async (req: Request, res: Response) => {
  const parts = req.path.replace(/^\/+/, "").split("/").filter(Boolean)
  const collection = parts[0]
  const recordId = parts[1]

  if (!collection) {
    return res.status(400).json({ error: "Collection name required" })
  }

  const queryCompanyId = req.query.companyId as string || req.query.company_id as string
  const headerCompanyId = req.headers["x-company-id"] as string
  const bodyCompanyId = req.body?.company_id || req.body?.companyId
  const activeCompanyId = queryCompanyId || headerCompanyId || bodyCompanyId

  const isGlobalTable = collection === "companies" || collection === "audit_logs"

  if (!isGlobalTable) {
    if (!activeCompanyId) {
      return res.status(400).json({ error: "Company context (companyId query parameter or X-Company-ID header) is required for company operations" })
    }

    // STRICT SERVER-SIDE MULTI-TENANT AUTHORIZATION CHECK
    const tenantAuth = await verifyServerSideTenantAuthorization(req, activeCompanyId)
    if (!tenantAuth.authorized) {
      return res.status(403).json({ success: false, error: tenantAuth.error || `Access Denied: You are not authorized to access company "${activeCompanyId}".` })
    }
  }

  try {
    const schema = isGlobalTable ? "public" : await getSchemaNameForCompany(activeCompanyId!)

    if (collection === "receive-payment" || (collection === "payments" && (recordId === "receive" || recordId === "receive-payment"))) {
      if (activeCompanyId) await ensureCompanySchemaExists(activeCompanyId)

      const { billNo, billId, amount, paymentMode, referenceNo, partyName, remarks } = req.body || {}
      const payAmt = parseFloat(amount) || 0
      if (!billNo || isNaN(payAmt) || payAmt <= 0) {
        return res.status(400).json({ success: false, error: "Valid billNo and payment amount > 0 are required" })
      }

      const billRows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."bills" WHERE "billNo" = $1 OR id = $1`, billNo)
      if (!billRows || billRows.length === 0) {
        return res.status(404).json({ success: false, error: `Bill "${billNo}" not found in company tenant` })
      }

      const currentBill = billRows[0]
      const totalAmt = parseFloat(currentBill.totalAmount !== undefined && currentBill.totalAmount !== null ? currentBill.totalAmount : (currentBill.amount || 0))
      const existingPaid = parseFloat(currentBill.paidAmount !== undefined && currentBill.paidAmount !== null ? currentBill.paidAmount : (currentBill.paid || 0))
      const currentOutstanding = parseFloat(currentBill.outstanding !== undefined && currentBill.outstanding !== null ? currentBill.outstanding : Math.max(0, totalAmt - existingPaid))

      if (payAmt > currentOutstanding + 0.01) {
        return res.status(400).json({ success: false, error: `Payment amount (₹${payAmt}) cannot exceed outstanding balance (₹${currentOutstanding})` })
      }

      const newPaidAmount = existingPaid + payAmt
      const newOutstanding = Math.max(0, totalAmt - newPaidAmount)
      const newStatus = newOutstanding <= 0 ? "paid" : (newPaidAmount > 0 ? "partial" : "pending")

      const payId = `PAY-${Date.now()}`
      const today = new Date().toISOString().split("T")[0]

      await prisma.$transaction([
        prisma.$executeRawUnsafe(
          `INSERT INTO "${schema}"."payments" (id, company_id, "receiptNo", "paymentNo", "billNo", "bill_id", party, amount, mode, "paymentMode", date, "paymentDate", "referenceNo", status, remarks, "createdAt", "updatedAt")
           VALUES ($1, $2, $1, $1, $3, $4, $5, $6, $7, $7, $8, $8, $9, 'Completed', $10, NOW(), NOW())`,
          payId, activeCompanyId!, currentBill.billNo || billNo, currentBill.id || billId || payId, partyName || currentBill.party || "Party", payAmt, paymentMode || "Cash", today, referenceNo || null, remarks || null
        ),
        prisma.$executeRawUnsafe(
          `UPDATE "${schema}"."bills" SET "paidAmount" = $1, "paid" = $1, "outstanding" = $2, status = $3, "updatedAt" = NOW() WHERE id = $4 OR "billNo" = $5`,
          newPaidAmount, newOutstanding, newStatus, currentBill.id, currentBill.billNo || billNo
        )
      ])

      const updatedBill = {
        ...currentBill,
        paidAmount: newPaidAmount,
        paid: newPaidAmount,
        outstanding: newOutstanding,
        status: newStatus,
        updatedAt: new Date().toISOString()
      }

      return res.status(200).json({
        success: true,
        message: "Payment recorded successfully",
        payment: { id: payId, billNo, amount: payAmt, paymentMode, date: today },
        updatedBill
      })
    }
    if (!isGlobalTable && activeCompanyId && collection !== "receive-payment") {
      await ensureCompanySchemaExists(activeCompanyId)
    }

    async function initBillingDatabaseSchema() {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "public"."payments" (
            "id" text PRIMARY KEY,
            "company_id" text NOT NULL,
            "receiptNo" text NOT NULL,
            "paymentNo" text,
            "billNo" text NOT NULL,
            "bill_id" text,
            "date" text NOT NULL,
            "paymentDate" text,
            "party" text NOT NULL,
            "partyName" text,
            "amount" numeric NOT NULL DEFAULT 0,
            "mode" text NOT NULL DEFAULT 'Cash',
            "paymentMode" text,
            "referenceNo" text,
            "status" text NOT NULL DEFAULT 'Completed',
            "remarks" text,
            "createdAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `).catch(() => null)

        const billCols = [
          `ADD COLUMN IF NOT EXISTS "billNo" text`,
          `ADD COLUMN IF NOT EXISTS "billNumber" text`,
          `ADD COLUMN IF NOT EXISTS "party" text`,
          `ADD COLUMN IF NOT EXISTS "partyName" text`,
          `ADD COLUMN IF NOT EXISTS "totalAmount" numeric DEFAULT 0`,
          `ADD COLUMN IF NOT EXISTS "paid" numeric DEFAULT 0`,
          `ADD COLUMN IF NOT EXISTS "paidAmount" numeric DEFAULT 0`,
          `ADD COLUMN IF NOT EXISTS "outstanding" numeric DEFAULT 0`,
          `ADD COLUMN IF NOT EXISTS "subtotal" numeric DEFAULT 0`,
          `ADD COLUMN IF NOT EXISTS "tax" numeric DEFAULT 0`,
          `ADD COLUMN IF NOT EXISTS "lrsCount" integer DEFAULT 0`,
          `ADD COLUMN IF NOT EXISTS "lrs" text`
        ]
        for (const colSql of billCols) {
          await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."bills" ${colSql};`).catch(() => null)
          await prisma.$executeRawUnsafe(`ALTER TABLE "public"."bills" ${colSql};`).catch(() => null)
        }

        const lrCols = [
          `ADD COLUMN IF NOT EXISTS "billed" boolean DEFAULT false`,
          `ADD COLUMN IF NOT EXISTS "billNo" text`
        ]
        for (const colSql of lrCols) {
          await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ${colSql};`).catch(() => null)
          await prisma.$executeRawUnsafe(`ALTER TABLE "public"."lrs" ${colSql};`).catch(() => null)
        }
      } catch (err) {
        console.error("[Billing DB Init Error]:", err)
      }
    }
    initBillingDatabaseSchema()

    function formatBillRow(b: any) {
      if (!b) return b
      const r = { ...b }
      r.billNo = r.billNo || r.billNumber || r.id
      r.billNumber = r.billNo
      r.party = r.party || r.partyName || "Party"
      r.partyName = r.party
      r.totalAmount = parseFloat(r.totalAmount !== undefined && r.totalAmount !== null ? r.totalAmount : (r.amount || 0))
      r.amount = r.totalAmount
      r.paidAmount = parseFloat(r.paidAmount !== undefined && r.paidAmount !== null ? r.paidAmount : (r.paid || 0))
      r.paid = r.paidAmount
      r.outstanding = parseFloat(r.outstanding !== undefined && r.outstanding !== null ? r.outstanding : Math.max(0, r.totalAmount - r.paidAmount))
      r.status = String(r.status || "Pending").toLowerCase()
      r.dueDate = r.dueDate || "30 Days"
      return r
    }

    function formatPaymentRow(p: any) {
      if (!p) return p
      const r = { ...p }
      r.receiptNo = r.receiptNo || r.paymentNo || r.id
      r.paymentNo = r.receiptNo
      r.party = r.party || r.partyName || "Party"
      r.partyName = r.party
      r.amount = parseFloat(r.amount || 0)
      r.mode = r.mode || r.paymentMode || "Cash"
      r.paymentMode = r.mode
      r.date = r.date || r.paymentDate || new Date().toISOString().split("T")[0]
      r.paymentDate = r.date
      return r
    }

    function formatLrRow(r: any) {
      if (!r) return r
      if (!r.lr && r.lrNo) r.lr = r.lrNo
      if (!r.lr && r.lr_number) r.lr = r.lr_number
      if (!r.lrNo && r.lr) r.lrNo = r.lr
      if (r.items) {
        let parsed = r.items
        if (typeof parsed === "string") {
          try { parsed = JSON.parse(parsed) } catch {}
        }
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.goods_items) {
          r.goods_items = parsed.goods_items
          r.invoice_doc_id = parsed.invoice_doc_id || r.invoice_doc_id
          r.invoice_doc_url = parsed.invoice_doc_url || r.invoice_doc_url
          r.invoice_doc_name = parsed.invoice_doc_name || r.invoice_doc_name
          r.invoiceDoc = parsed.invoiceDoc || r.invoiceDoc
          r.ewaybill_doc_id = parsed.ewaybill_doc_id || r.ewaybill_doc_id
          r.ewaybill_doc_url = parsed.ewaybill_doc_url || r.ewaybill_doc_url
          r.ewaybill_doc_name = parsed.ewaybill_doc_name || r.ewaybill_doc_name
          r.ewayBillDoc = parsed.ewayBillDoc || r.ewayBillDoc
          r.advance = parsed.advance !== undefined ? parsed.advance : r.advance
          r.remarks = parsed.remarks !== undefined ? parsed.remarks : r.remarks
          r.items = parsed.goods_items
        }
      }
      return r
    }

    // GET
    if (req.method === "GET") {
      if (recordId) {
        const rows: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."${collection}" WHERE id = $1`, recordId)
        if (!rows || rows.length === 0) {
          return res.status(404).json({ error: `Record ${recordId} not found in ${collection}` })
        }
        const data = collection.toLowerCase() === "lrs" ? formatLrRow(rows[0])
          : collection.toLowerCase() === "bills" ? formatBillRow(rows[0])
          : collection.toLowerCase() === "payments" ? formatPaymentRow(rows[0])
          : rows[0]
        return res.status(200).json({ success: true, data })
      } else {
        let rows: any = []
        const isUsersCollection = collection.toLowerCase() === "users"
        const isSuperAdminAggregator = isUsersCollection && (
          activeCompanyId === "PLATFORM" || 
          req.query.scope === "all_admin" || 
          (req.headers["x-user-role"] && String(req.headers["x-user-role"]).toLowerCase().includes("super"))
        )

        if (isSuperAdminAggregator) {
          rows = await getAllUsersAcrossAllTenantSchemas()
        } else {
          rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."${collection}" ORDER BY 1 DESC`)
        }

        // Strict Backend Company Isolation for Users Endpoint
        if (isUsersCollection && !isSuperAdminAggregator && activeCompanyId) {
          const compIdStr = String(activeCompanyId).trim()

          // Resolve Company Code if activeCompanyId is ID (e.g. COMP-103816 -> EPRT)
          let compCode = compIdStr
          try {
            const compRows: any = await prisma.$queryRawUnsafe(`SELECT code FROM "public"."companies" WHERE id = $1 OR code = $1`, compIdStr)
            if (compRows && compRows[0] && compRows[0].code) {
              compCode = compRows[0].code
            }
          } catch {}

          rows = (rows || []).filter((u: any) => {
            const roleStr = String(u.role || "").toLowerCase()
            if (roleStr.includes("super")) return false // Never leak Super Admin into normal company user lists

            // Check primary company_id match
            if (u.company_id === compIdStr || u.company_id === compCode) return true

            // Check assignedCompanies JSON string or array
            if (u.assignedCompanies) {
              const str = typeof u.assignedCompanies === "object" ? JSON.stringify(u.assignedCompanies) : String(u.assignedCompanies)
              if (str.includes(compIdStr) || str.includes(compCode)) {
                return true
              }
            }
          })
        }

        if (collection.toLowerCase() === "lrs" && req.query.consignor) {
          const consignorTarget = String(req.query.consignor).trim().toLowerCase()
          rows = (rows || []).filter((r: any) => {
            const c1 = String(r.consignor || "").trim().toLowerCase()
            const c2 = String(r.consignee || "").trim().toLowerCase()
            return c1 === consignorTarget || c2 === consignorTarget
          })
        }

        if (collection.toLowerCase() === "bills") {
          const seenBills = new Set<string>()
          rows = (rows || []).filter((r: any) => {
            const key = String(r.billNo || r.billNumber || r.id || "").trim().toLowerCase()
            if (!key || seenBills.has(key)) return false
            seenBills.add(key)
            return true
          })
        }

        const data = (rows || []).map((r: any) =>
          collection.toLowerCase() === "lrs" ? formatLrRow(r)
            : collection.toLowerCase() === "bills" ? formatBillRow(r)
            : collection.toLowerCase() === "payments" ? formatPaymentRow(r)
            : r
        )
        return res.status(200).json({ success: true, data })
      }
    }

    // Table Column Mapping for SQL Safety
    const TABLE_COLUMNS: Record<string, string[]> = {
      branches: ["id", "company_id", "code", "name", "city", "state", "type", "lrPrefix", "nextLrNumber", "status", "createdAt", "updatedAt"],
      users: ["id", "company_id", "name", "username", "email", "mobile", "role", "branch", "assignedCompanies", "permissions", "status", "lastLogin", "createdAt", "updatedAt"],
      parties: ["id", "company_id", "name", "type", "gst", "pan", "phone", "mobile", "email", "contactPerson", "creditLimit", "billingAddress", "shippingAddress", "paymentTerms", "city", "state", "pincode", "status", "createdAt", "updatedAt"],
      vehicles: ["id", "company_id", "number", "type", "capacity", "driver", "owner", "gpsId", "rc", "insurance", "fitness", "permit", "puc", "status", "createdAt", "updatedAt"],
      drivers: ["id", "company_id", "name", "mobile", "altMobile", "license", "licenseExpiry", "aadhaar", "address", "emergency", "vehicle", "experience", "status", "createdAt", "updatedAt"],
      owners: ["id", "company_id", "name", "pan", "phone", "contact", "mobile", "email", "gst", "address", "type", "vehicles", "status", "createdAt", "updatedAt"],
      agents: ["id", "company_id", "name", "city", "state", "commission", "phone", "contact", "mobile", "email", "outstanding", "status", "createdAt", "updatedAt"],
      stations: ["id", "company_id", "name", "city", "state", "type", "pincode", "phone", "status", "createdAt", "updatedAt"],
      articles: ["id", "company_id", "name", "packing", "hsn", "rate", "unit", "description", "fragile", "status", "createdAt", "updatedAt"],
      lrs: ["id", "company_id", "lrNo", "date", "bookingBranch", "bookingBranchId", "bookingStation", "deliveryStation", "consignor", "consignee", "from", "to", "vehicle", "driver", "owner", "agent", "article", "packages", "packageCount", "weight", "freight", "freightType", "paymentType", "hamali", "doorDeliveryCharges", "otherCharges", "gst", "totalAmount", "invoice", "invoiceValue", "waybill", "ewayBill", "expectedDelivery", "status", "billed", "billNo", "items", "createdAt", "updatedAt"],
      deliveries: ["id", "company_id", "lrNo", "lr_id", "date", "deliveredTo", "receiverPhone", "status", "remarks", "createdAt", "updatedAt"],
      bills: ["id", "company_id", "billNo", "billNumber", "billDate", "party", "partyName", "partyId", "amount", "subtotal", "tax", "totalAmount", "paid", "paidAmount", "outstanding", "lrsCount", "lrs", "dueDate", "status", "createdAt", "updatedAt"],
      payments: ["id", "company_id", "receiptNo", "paymentNo", "billNo", "bill_id", "date", "paymentDate", "party", "partyName", "amount", "mode", "paymentMode", "referenceNo", "status", "remarks", "createdAt", "updatedAt"],
      digital_signatures: ["id", "company_id", "lr_id", "signed_by", "signed_by_email", "signed_by_role", "algorithm", "hash_algorithm", "document_hash", "signature", "key_version", "document_version", "status", "signed_at", "createdAt", "updatedAt"],
      documents: ["id", "company_id", "entity", "record_id", "file_name", "mime_type", "file_size", "file_path", "uploaded_by", "createdAt", "updatedAt"],
      companies: ["id", "code", "name", "city", "logo", "schema_name", "status", "lastLogin", "createdAt", "updatedAt"],
      audit_logs: ["id", "company_id", "user", "role", "action", "entity", "recordId", "entityId", "url", "payload", "timestamp", "ip", "createdAt"]
    }

    // POST / PUT
    if (req.method === "POST" || req.method === "PUT") {
      const item = req.body || {}
      if (!item.id && recordId) item.id = recordId
      if (!item.id) item.id = `${collection.toUpperCase().slice(0, 3)}-${Date.now()}`
      if (!isGlobalTable) {
        item.company_id = item.company_id || activeCompanyId
        if (item.company_id) {
          try {
            await ensureCompanySchemaExists(item.company_id)
          } catch (err: any) {
            console.error(`[Ensure Schema Error for ${item.company_id}]:`, err.message)
          }
        }
      }
      if (!item.createdAt) item.createdAt = new Date().toISOString()
      item.updatedAt = new Date().toISOString()

      // Map alias keys if main column is missing
      if (collection.toLowerCase() === "lrs") {
        if (!item.lrNo && item.lr_no) item.lrNo = item.lr_no
        if (!item.lrNo && item.lr) item.lrNo = item.lr

        const rawGoods = (typeof item.items === "object" && !Array.isArray(item.items) && item.items?.goods_items) || item.goods_items || item.items || []
        let parsedGoods = rawGoods
        if (typeof rawGoods === "string") {
          try { parsedGoods = JSON.parse(rawGoods) } catch {}
        }
        if (parsedGoods && typeof parsedGoods === "object" && !Array.isArray(parsedGoods) && Array.isArray((parsedGoods as any).goods_items)) {
          parsedGoods = (parsedGoods as any).goods_items
        }
        const itemsPayload = {
          goods_items: Array.isArray(parsedGoods) ? parsedGoods : [parsedGoods],
          invoice_doc_id: item.invoice_doc_id || (typeof item.items === "object" && item.items?.invoice_doc_id) || null,
          invoice_doc_url: item.invoice_doc_url || (typeof item.items === "object" && item.items?.invoice_doc_url) || null,
          invoice_doc_name: item.invoice_doc_name || (typeof item.items === "object" && item.items?.invoice_doc_name) || null,
          invoiceDoc: item.invoiceDoc || (typeof item.items === "object" && item.items?.invoiceDoc) || null,
          ewaybill_doc_id: item.ewaybill_doc_id || (typeof item.items === "object" && item.items?.ewaybill_doc_id) || null,
          ewaybill_doc_url: item.ewaybill_doc_url || (typeof item.items === "object" && item.items?.ewaybill_doc_url) || null,
          ewaybill_doc_name: item.ewaybill_doc_name || (typeof item.items === "object" && item.items?.ewaybill_doc_name) || null,
          ewayBillDoc: item.ewayBillDoc || (typeof item.items === "object" && item.items?.ewayBillDoc) || null,
          advance: item.advance !== undefined ? item.advance : null,
          remarks: item.remarks || null
        }
        item.items = itemsPayload
      }

      if (collection.toLowerCase() === "bills") {
        if (!item.billNo && item.billNumber) item.billNo = item.billNumber
        if (!item.billNumber && item.billNo) item.billNumber = item.billNo
        if (!item.party && item.partyName) item.party = item.partyName
        if (!item.partyName && item.party) item.partyName = item.party
        if (item.amount !== undefined && item.totalAmount === undefined) item.totalAmount = item.amount
        if (item.totalAmount !== undefined && item.amount === undefined) item.amount = item.totalAmount
        if (item.paidAmount !== undefined && item.paid === undefined) item.paid = item.paidAmount
        if (item.paid !== undefined && item.paidAmount === undefined) item.paidAmount = item.paid
        if (!item.dueDate) item.dueDate = "30 Days"
        if (!item.createdAt) item.createdAt = new Date().toISOString()
        item.updatedAt = new Date().toISOString()

        if (item.status) {
          const s = String(item.status).toLowerCase()
          if (s === "pending") item.status = "Pending"
          else if (s === "partial") item.status = "Partial"
          else if (s === "paid") item.status = "Paid"
          else if (s === "cancelled") item.status = "Cancelled"
        } else {
          item.status = "Pending"
        }
      }

      if (collection.toLowerCase() === "payments") {
        if (!item.receiptNo && item.paymentNo) item.receiptNo = item.paymentNo
        if (!item.paymentNo && item.receiptNo) item.paymentNo = item.receiptNo
        if (!item.party && item.partyName) item.party = item.partyName
        if (!item.partyName && item.party) item.partyName = item.party
        if (!item.mode && item.paymentMode) item.mode = item.paymentMode
        if (!item.paymentMode && item.mode) item.paymentMode = item.mode
        if (!item.date && item.paymentDate) item.date = item.paymentDate
        if (!item.paymentDate && item.date) item.paymentDate = item.date
        if (!item.createdAt) item.createdAt = new Date().toISOString()
        item.updatedAt = new Date().toISOString()
      }

      if (collection.toLowerCase() === "companies") {
        const schemaName = normalizeSchemaName(item.name || item.id)
        item.schema_name = schemaName
        try {
          await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`)
          if (item.id) await ensureCompanySchemaExists(item.id)
        } catch (err: any) {
          console.error("[Company Schema Provisioning Error]:", err.message)
        }
      }

      if (collection.toLowerCase() === "users") {
        const requesterRole = String(req.headers["x-user-role"] || "").trim()
        const isSuperAdminRequester = requesterRole === "Super Admin" || (req.headers["x-user-email"] && String(req.headers["x-user-email"]).toLowerCase() === "admin@gmail.com")

        const targetCompId = item.company_id || activeCompanyId || "COMP-001"
        item.company_id = targetCompId
        if (!item.name || !String(item.name).trim()) {
          item.name = item.username || item.email || "Enterprise User"
        }

        if (!item.assignedCompanies || item.assignedCompanies.length === 0 || item.assignedCompanies === "[]") {
          item.assignedCompanies = JSON.stringify([targetCompId])
        } else if (Array.isArray(item.assignedCompanies)) {
          item.assignedCompanies = JSON.stringify(item.assignedCompanies)
        }

        if (item.password && !String(item.password).startsWith("pbkdf2$")) {
          const pwdHash = hashPassword(item.password)
          item.password_hash = pwdHash
          item.password = pwdHash
        }

        // ALWAYS SYNC/SAVE USER TO PUBLIC.USERS FOR LOGIN AUTHENTICATION
        try {
          const userRole = item.role || "Company Admin"
          const userAssigned = typeof item.assignedCompanies === "string" ? item.assignedCompanies : JSON.stringify(item.assignedCompanies)
          await prisma.$executeRawUnsafe(
            `INSERT INTO "public"."users" (id, company_id, name, email, password, password_hash, role, "assignedCompanies", status, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
             ON CONFLICT (email) DO UPDATE SET
               company_id = EXCLUDED.company_id,
               name = EXCLUDED.name,
               password = EXCLUDED.password,
               password_hash = EXCLUDED.password_hash,
               role = EXCLUDED.role,
               "assignedCompanies" = EXCLUDED."assignedCompanies",
               status = EXCLUDED.status,
               "updatedAt" = NOW()`,
            item.id, targetCompId, item.name || item.email, item.email, item.password || item.password_hash || "", item.password_hash || item.password || "", userRole, userAssigned, item.status || "active"
          )
        } catch (err: any) {
          console.error("[Users Sync to Public.Users Error]:", err.message)
        }
      }

      const targetSchema = isGlobalTable ? "public" : await getSchemaNameForCompany(item.company_id || activeCompanyId)
      const declaredCols = TABLE_COLUMNS[collection.toLowerCase()]
      let actualDbCols: string[] = []
      try {
        const colRows: any = await prisma.$queryRawUnsafe(
          `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
          targetSchema, collection.toLowerCase()
        )
        if (Array.isArray(colRows) && colRows.length > 0) {
          actualDbCols = colRows.map((c: any) => c.column_name)
        }
      } catch {}

      if (collection.toLowerCase() === "lrs") {
        try {
          await prisma.$executeRawUnsafe(`ALTER TABLE "${targetSchema}"."lrs" ADD COLUMN IF NOT EXISTS "billed" boolean DEFAULT false`).catch(() => null)
          await prisma.$executeRawUnsafe(`ALTER TABLE "${targetSchema}"."lrs" ADD COLUMN IF NOT EXISTS "billNo" text`).catch(() => null)
        } catch {}
        if (!actualDbCols.includes("billed")) actualDbCols.push("billed")
        if (!actualDbCols.includes("billNo")) actualDbCols.push("billNo")
      }

      const keys = Object.keys(item).filter(k => {
        if (item[k] === undefined) return false
        if (declaredCols && !declaredCols.includes(k)) return false
        if (actualDbCols.length > 0 && !actualDbCols.includes(k)) return false
        return true
      })

      const cols = keys.map(k => `"${k}"`).join(", ")
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
      const values = keys.map(k => {
        const val = item[k]
        if (val === undefined) return null
        if (typeof val === "string" && (val.trim() === "null" || val.trim() === "undefined" || val.trim() === "Never")) return null
        if (typeof val === "object" && val !== null) return JSON.stringify(val)
        return val
      })

      if (req.method === "POST") {
        if (collection.toLowerCase() === "bills" && item.billNo) {
          const existing: any = await prisma.$queryRawUnsafe(`SELECT id FROM "${targetSchema}"."bills" WHERE "billNo" = $1 OR "billNumber" = $1`, item.billNo).catch(() => [])
          if (Array.isArray(existing) && existing.length > 0) {
            const updateKeys = keys.filter(k => k !== "id")
            const updateSets = updateKeys.map((k, i) => `"${k}" = $${i + 2}`).join(", ")
            const updateValues = updateKeys.map(k => {
              const val = item[k]
              if (val === undefined) return null
              if (typeof val === "string" && (val.trim() === "null" || val.trim() === "undefined" || val.trim() === "Never")) return null
              if (typeof val === "object" && val !== null) return JSON.stringify(val)
              return val
            })
            await prisma.$executeRawUnsafe(`UPDATE "${targetSchema}"."bills" SET ${updateSets} WHERE id = $1`, existing[0].id, ...updateValues)
            const returnData = formatBillRow({ ...item, id: existing[0].id })
            return res.status(200).json({ success: true, data: returnData })
          }
        }
        await prisma.$executeRawUnsafe(`INSERT INTO "${targetSchema}"."${collection}" (${cols}) VALUES (${placeholders})`, ...values)
      } else if (req.method === "PUT") {
        let targetId = item.id
        if (collection.toLowerCase() === "lrs") {
          try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${targetSchema}"."lrs" ADD COLUMN IF NOT EXISTS "billed" boolean DEFAULT false`).catch(() => null)
            await prisma.$executeRawUnsafe(`ALTER TABLE "${targetSchema}"."lrs" ADD COLUMN IF NOT EXISTS "billNo" text`).catch(() => null)
          } catch {}

          const searchKey = recordId || item.id || item.lrNo || item.lr
          const lookup: any = await prisma.$queryRawUnsafe(
            `SELECT id FROM "${targetSchema}"."lrs" WHERE id = $1 OR "lrNo" = $1`,
            searchKey
          ).catch((e: any) => {
            console.error("[LR Lookup Error]:", e.message)
            return []
          })
          if (Array.isArray(lookup) && lookup.length > 0) {
            targetId = lookup[0].id
          }
        }

        const updateKeys = keys.filter(k => k !== "id")
        const updateSets = updateKeys.map((k, i) => `"${k}" = $${i + 2}`).join(", ")
        const updateValues = updateKeys.map(k => {
          const val = item[k]
          if (val === undefined) return null
          if (typeof val === "string" && (val.trim() === "null" || val.trim() === "undefined" || val.trim() === "Never")) return null
          if (typeof val === "object" && val !== null) return JSON.stringify(val)
          return val
        })
        await prisma.$executeRawUnsafe(`UPDATE "${targetSchema}"."${collection}" SET ${updateSets} WHERE id = $1`, targetId, ...updateValues)
      }

      const returnData = collection.toLowerCase() === "lrs" ? formatLrRow({ ...item })
        : collection.toLowerCase() === "bills" ? formatBillRow({ ...item })
        : collection.toLowerCase() === "payments" ? formatPaymentRow({ ...item })
        : item
      return res.status(req.method === "POST" ? 201 : 200).json({ success: true, data: returnData })
    }

    // DELETE
    if (req.method === "DELETE") {
      if (!recordId) return res.status(400).json({ error: "Record ID required for DELETE" })
      await prisma.$executeRawUnsafe(`DELETE FROM "${schema}"."${collection}" WHERE id = $1`, recordId)
      return res.status(200).json({ success: true, id: recordId })
    }

    return res.status(405).json({ error: "Method Not Allowed" })
  } catch (err: any) {
    console.error(`Database error for ${collection}:`, err.message)
    return res.status(500).json({ success: false, error: err.message })
  }
})

// ---------------------------------------------------------------------------
// Static Frontend SPA Asset Serving (Production / Standalone fallback)
// ---------------------------------------------------------------------------
const DIST_DIR = path.resolve(process.cwd(), "dist")
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.use((req: Request, res: Response, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
      return next()
    }
    const indexPath = path.join(DIST_DIR, "index.html")
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath)
    }
    next()
  })
}

// ---------------------------------------------------------------------------
// Server Startup (Only when executed as standalone main entrypoint)
// ---------------------------------------------------------------------------
const isMainModule = Boolean(process.argv[1]?.includes("index.ts") || process.argv[1]?.includes("index.js") || process.env.STANDALONE === "true")
if (isMainModule && process.env.NODE_ENV !== "test") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n==================================================`)
    console.log(`TransportOS Production API Server running on port ${PORT}`)
    console.log(`Health Check: http://localhost:${PORT}/health`)
    console.log(`==================================================\n`)
  })
}

export default app
