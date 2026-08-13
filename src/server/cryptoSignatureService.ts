import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const KEYS_DIR = path.resolve(__dirname, "../../storage/keys")

if (!fs.existsSync(KEYS_DIR)) {
  fs.mkdirSync(KEYS_DIR, { recursive: true })
}

// Memory key cache for ultra-fast verification
const keyCache = new Map<string, { privateKey: string; publicKey: string }>()

export function getOrGenerateCompanyKeyPair(companyId: string = "COMP-001"): { privateKey: string; publicKey: string } {
  const safeId = companyId.replace(/[^a-zA-Z0-9_-]/g, "_")
  if (keyCache.has(safeId)) {
    return keyCache.get(safeId)!
  }

  const privPath = path.join(KEYS_DIR, `${safeId}_private.pem`)
  const pubPath = path.join(KEYS_DIR, `${safeId}_public.pem`)

  if (fs.existsSync(privPath) && fs.existsSync(pubPath)) {
    const privateKey = fs.readFileSync(privPath, "utf-8")
    const publicKey = fs.readFileSync(pubPath, "utf-8")
    const keys = { privateKey, publicKey }
    keyCache.set(safeId, keys)
    return keys
  }

  // Generate RSA-2048 Key Pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  })

  fs.writeFileSync(privPath, privateKey, "utf-8")
  fs.writeFileSync(pubPath, publicKey, "utf-8")

  const keys = { privateKey, publicKey }
  keyCache.set(safeId, keys)
  return keys
}

export function buildCanonicalLRPayload(lr: any): string {
  let goodsItems: any[] = []
  if (lr.goods_items) {
    goodsItems = Array.isArray(lr.goods_items) 
      ? lr.goods_items 
      : (typeof lr.goods_items === "string" ? JSON.parse(lr.goods_items || "[]") : [])
  }
  if (!goodsItems || goodsItems.length === 0) {
    goodsItems = [{
      article: lr.article || "General Cargo",
      no_of_articles: Number(lr.packageCount || lr.noof_articles || 1),
      rate_per_article: Number(lr.rate || 0),
      weight_in_kgs: Number(lr.weight || lr.weight_in_kgs || 0),
      charged_weight: Number(lr.charged_weight || lr.weight || 0),
      freightAmount: Number(lr.freight || 0)
    }]
  }

  const sortedItems = goodsItems.map((item: any) => ({
    article: String(item.article || "").trim(),
    no_of_articles: Number(item.no_of_articles) || 1,
    rate_per_article: Number(item.rate_per_article) || 0,
    weight_in_kgs: Number(item.weight_in_kgs) || 0,
    charged_weight: Number(item.charged_weight || item.weight_in_kgs) || 0,
    freightAmount: Number(item.freightAmount) || 0,
    lot_no: String(item.lot_no || "").trim(),
    quality: String(item.quality || "").trim(),
    pr_no: String(item.pr_no || "").trim(),
    pm_no: String(item.pm_no || "").trim(),
    description: String(item.description || "").trim()
  })).sort((a: any, b: any) => a.article.localeCompare(b.article))

  const canonicalObj = {
    lr_id: String(lr.id || "").trim(),
    lr_no: String(lr.lrNo || lr.lr || "").trim(),
    date: String(lr.date || "").trim(),
    company_id: String(lr.company_id || "").trim(),
    booking_branch: String(lr.bookingBranch || lr.branch || "").trim(),
    booking_station: String(lr.bookingStation || lr.from || "").trim(),
    delivery_station: String(lr.deliveryStation || lr.to || "").trim(),
    consignor: String(lr.consignor || "").trim(),
    consignee: String(lr.consignee || "").trim(),
    bill_to: String(lr.bill_to || "Consignor").trim(),
    vehicle: String(lr.vehicle || "").trim(),
    driver: String(lr.driver || "").trim(),
    goods_items: sortedItems,
    total_freight: Number(lr.freight || 0),
    advance: Number(lr.advance || 0),
    hamali: Number(lr.hamali || 0),
    balance: Number(lr.balance || 0),
    freight_type: String(lr.freightType || lr.freight_type || "To Pay").trim(),
    invoice_no: String(lr.invoice || lr.invoice_no || "").trim(),
    eway_bill_no: String(lr.ewayBill || lr.way_bill_no || "").trim(),
    document_version: Number(lr.document_version || 1)
  }

  return JSON.stringify(canonicalObj)
}

export function computeLRHash(lr: any): string {
  const canonicalData = buildCanonicalLRPayload(lr)
  return crypto.createHash("sha256").update(canonicalData).digest("hex")
}

export function createDigitalSignature(
  lr: any,
  signer: { id?: string; name: string; role: string; email?: string },
  companyId: string
) {
  const { privateKey } = getOrGenerateCompanyKeyPair(companyId)
  const documentHash = computeLRHash(lr)

  const sign = crypto.createSign("SHA256")
  sign.update(documentHash)
  const signatureBase64 = sign.sign(privateKey, "base64")

  const sigId = `SIG-${Date.now()}`
  const documentVersion = Number(lr.document_version || 1)

  return {
    id: sigId,
    company_id: companyId,
    lr_id: lr.id || lr.lr,
    signed_by: signer.name || "Authorized Signer",
    signed_by_email: signer.email || "operator@transportos.com",
    signed_by_role: signer.role || "Company Admin",
    algorithm: "RSA-SHA256",
    hash_algorithm: "SHA256",
    document_hash: documentHash,
    signature: signatureBase64,
    key_version: "v1",
    document_version: documentVersion,
    status: "ACTIVE" as const,
    signed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

export function verifyLRDigitalSignature(lr: any, signatureRecord: any, companyId: string) {
  if (!signatureRecord) {
    return { valid: false, status: "NOT_SIGNED", error: "No signature record found" }
  }

  if (signatureRecord.status === "REVOKED") {
    return {
      valid: false,
      status: "REVOKED",
      signerName: signatureRecord.signed_by,
      signerRole: signatureRecord.signed_by_role,
      signedAt: signatureRecord.signed_at,
      error: "Signature was revoked because the LR data was modified."
    }
  }

  const currentDocVersion = Number(lr.document_version || 1)
  const signedDocVersion = Number(signatureRecord.document_version || 1)
  if (currentDocVersion !== signedDocVersion) {
    return {
      valid: false,
      status: "DOCUMENT_MODIFIED",
      signerName: signatureRecord.signed_by,
      signerRole: signatureRecord.signed_by_role,
      signedAt: signatureRecord.signed_at,
      error: `LR document version mismatch (Signed v${signedDocVersion}, Current v${currentDocVersion}). Re-signature required.`
    }
  }

  const currentHash = computeLRHash(lr)
  if (currentHash !== signatureRecord.document_hash) {
    return {
      valid: false,
      status: "DOCUMENT_MODIFIED",
      signerName: signatureRecord.signed_by,
      signerRole: signatureRecord.signed_by_role,
      signedAt: signatureRecord.signed_at,
      error: "Document content hash mismatch. LR fields have been modified after signing."
    }
  }

  const { publicKey } = getOrGenerateCompanyKeyPair(companyId)
  const verify = crypto.createVerify("SHA256")
  verify.update(currentHash)
  const isCryptographicallyValid = verify.verify(publicKey, signatureRecord.signature, "base64")

  return {
    valid: isCryptographicallyValid,
    status: isCryptographicallyValid ? "SIGNED" : "INVALID_SIGNATURE",
    signerName: signatureRecord.signed_by,
    signerRole: signatureRecord.signed_by_role,
    signedAt: signatureRecord.signed_at,
    algorithm: signatureRecord.algorithm || "RSA-SHA256",
    documentVersion: signedDocVersion,
    documentHash: currentHash,
    error: isCryptographicallyValid ? undefined : "Cryptographic signature verification failed"
  }
}
