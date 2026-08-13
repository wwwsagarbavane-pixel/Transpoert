import { prisma } from "../src/db/prismaClient"
import {
  getOrGenerateCompanyKeyPair,
  buildCanonicalLRPayload,
  computeLRHash,
  createDigitalSignature,
  verifyLRDigitalSignature
} from "../src/server/cryptoSignatureService"

async function runDigitalSignatureTest() {
  console.log("=== STARTING REAL CRYPTOGRAPHIC DIGITAL SIGNATURE END-TO-END VERIFICATION ===")

  const companyId = "COMP-003"
  const schema = "comp_testtranpoart"

  // Ensure schema exists
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}"."lrs" (
      "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "lrNo" TEXT NOT NULL,
      "date" TEXT NOT NULL, "bookingBranch" TEXT, "bookingStation" TEXT, "deliveryStation" TEXT,
      "consignor" TEXT, "consignee" TEXT, "from" TEXT, "to" TEXT, "vehicle" TEXT, "driver" TEXT,
      "freight" DOUBLE PRECISION DEFAULT 0, "freightType" TEXT, "paymentType" TEXT,
      "hamali" DOUBLE PRECISION DEFAULT 0, "advance" DOUBLE PRECISION DEFAULT 0,
      "is_digitally_signed" BOOLEAN DEFAULT false, "digital_signature_id" TEXT,
      "document_version" INTEGER DEFAULT 1, "goods_items" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "is_digitally_signed" BOOLEAN DEFAULT false;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "digital_signature_id" TEXT;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "${schema}"."lrs" ADD COLUMN IF NOT EXISTS "document_version" INTEGER DEFAULT 1;`)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}"."digital_signatures" (
      "id" TEXT PRIMARY KEY, "company_id" TEXT NOT NULL, "lr_id" TEXT NOT NULL,
      "signed_by" TEXT NOT NULL, "signed_by_email" TEXT, "signed_by_role" TEXT,
      "algorithm" TEXT NOT NULL DEFAULT 'RSA-SHA256', "hash_algorithm" TEXT NOT NULL DEFAULT 'SHA256',
      "document_hash" TEXT NOT NULL, "signature" TEXT NOT NULL, "key_version" TEXT NOT NULL DEFAULT 'v1',
      "document_version" INTEGER NOT NULL DEFAULT 1, "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "revoked_at" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // 1. Generate / Verify RSA-2048 Keypair
  console.log("\n1. Keypair Management Check:")
  const keyPair = getOrGenerateCompanyKeyPair(companyId)
  if (!keyPair.privateKey.includes("BEGIN PRIVATE KEY") || !keyPair.publicKey.includes("BEGIN PUBLIC KEY")) {
    throw new Error("FAILED: Valid RSA-2048 keypair not generated!")
  }
  console.log("✓ RSA-2048 Keypair successfully generated and stored on server.")

  // 2. Create Multi-Article Test LR
  const testLrId = `LR-SIG-TEST-${Date.now()}`
  const testLrNo = `LR-77001-${Math.floor(Math.random() * 1000)}`
  const goodsItems = [
    { article: "Article A - Heavy Gears", no_of_articles: 5, rate_per_article: 400, weight_in_kgs: 200, freightAmount: 2000 },
    { article: "Article B - Hydraulic Pump", no_of_articles: 2, rate_per_article: 1500, weight_in_kgs: 100, freightAmount: 3000 },
    { article: "Article C - Control Cables", no_of_articles: 10, rate_per_article: 100, weight_in_kgs: 50, freightAmount: 1000 }
  ]

  console.log(`\n2. Creating Test LR (${testLrNo}) with 3 Articles in schema "${schema}"...`)
  await prisma.$executeRawUnsafe(`
    INSERT INTO "${schema}"."lrs" (
      "id", "company_id", "lrNo", "date", "bookingBranch", "bookingStation", "deliveryStation",
      "consignor", "consignee", "from", "to", "vehicle", "driver", "freight", "freightType",
      "goods_items", "document_version", "is_digitally_signed", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, '2026-08-10', 'Pune HQ', 'Pune', 'Mumbai',
      'Consignor Company A', 'Consignee Company B', 'Pune', 'Mumbai', 'MH-12-AB-9999', 'Suresh Driver', 6000, 'To Pay',
      $4, 1, false, NOW(), NOW()
    )
  `, testLrId, companyId, testLrNo, JSON.stringify(goodsItems))

  const lrRes: any = await prisma.$queryRawUnsafe(`SELECT * FROM "${schema}"."lrs" WHERE id = $1`, testLrId)
  const lrRecord = lrRes[0]

  // 3. Test Canonical Payload & SHA-256 Hashing
  console.log("\n3. Canonical Payload & SHA-256 Hash Generation Check:")
  const canonicalStr = buildCanonicalLRPayload(lrRecord)
  const hash1 = computeLRHash(lrRecord)
  console.log(`✓ Canonical Payload built (${canonicalStr.length} chars)`)
  console.log(`✓ SHA-256 Hash: ${hash1}`)

  if (hash1.length !== 64) {
    throw new Error("FAILED: SHA-256 hash output is invalid!")
  }

  // 4. Test Digital Signature Creation
  console.log("\n4. RSA-2048 Signing Check:")
  const signerInfo = { id: "USR-ADMIN", name: "Rajesh Sharma", role: "Company Admin", email: "rajesh@testtransport.com" }
  const sigRecord = createDigitalSignature(lrRecord, signerInfo, companyId)

  console.log(`✓ Signature ID: ${sigRecord.id}`)
  console.log(`✓ Signer: ${sigRecord.signed_by} (${sigRecord.signed_by_role})`)
  console.log(`✓ RSA-2048 Signature Base64 Length: ${sigRecord.signature.length}`)

  // Store signature in DB
  await prisma.$executeRawUnsafe(`
    INSERT INTO "${schema}"."digital_signatures" (
      "id", "company_id", "lr_id", "signed_by", "signed_by_email", "signed_by_role",
      "algorithm", "hash_algorithm", "document_hash", "signature", "key_version",
      "document_version", "status", "signed_at", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
    )
  `, sigRecord.id, companyId, testLrId, sigRecord.signed_by, sigRecord.signed_by_email, sigRecord.signed_by_role, sigRecord.algorithm, sigRecord.hash_algorithm, sigRecord.document_hash, sigRecord.signature, sigRecord.key_version, sigRecord.document_version, sigRecord.status, new Date(sigRecord.signed_at))

  await prisma.$executeRawUnsafe(`
    UPDATE "${schema}"."lrs" SET "is_digitally_signed" = true, "digital_signature_id" = $1 WHERE id = $2
  `, sigRecord.id, testLrId)

  // 5. Test Cryptographic Verification
  console.log("\n5. Cryptographic Public Key Verification Check:")
  const verification1 = verifyLRDigitalSignature(lrRecord, sigRecord, companyId)
  console.log(`✓ Verification Result: ${verification1.status} (Valid: ${verification1.valid})`)

  if (!verification1.valid || verification1.status !== "SIGNED") {
    throw new Error("FAILED: Cryptographic public key verification failed on initial signed LR!")
  }

  // 6. Test Document Modification & Auto-Revocation Check
  console.log("\n6. Document Modification & Revocation Check:")
  console.log("Modifying signed LR freight amount from ₹6000 to ₹7500...")

  const modifiedLrRecord = { ...lrRecord, freight: 7500, document_version: 2 }
  const verification2 = verifyLRDigitalSignature(modifiedLrRecord, sigRecord, companyId)
  console.log(`✓ Verification on Modified LR: ${verification2.status} (Valid: ${verification2.valid})`)

  if (verification2.valid || verification2.status === "SIGNED") {
    throw new Error("FAILED: Modified LR was erroneously reported as valid!")
  }
  console.log(`✓ Correctly detected document modification: ${verification2.error}`)

  // 7. Test Re-Signing Modified LR Version 2
  console.log("\n7. Re-Signing Modified LR Version 2 Check:")
  const sigRecord2 = createDigitalSignature(modifiedLrRecord, signerInfo, companyId)
  const verification3 = verifyLRDigitalSignature(modifiedLrRecord, sigRecord2, companyId)

  console.log(`✓ Re-Signed Version 2 Hash: ${sigRecord2.document_hash}`)
  console.log(`✓ Re-Signed Version 2 Verification: ${verification3.status} (Valid: ${verification3.valid})`)

  if (!verification3.valid || verification3.documentVersion !== 2) {
    throw new Error("FAILED: Re-signed LR v2 verification failed!")
  }

  // Clean up test data
  await prisma.$executeRawUnsafe(`DELETE FROM "${schema}"."lrs" WHERE id = $1`, testLrId)
  await prisma.$executeRawUnsafe(`DELETE FROM "${schema}"."digital_signatures" WHERE lr_id = $1`, testLrId)
  console.log("\n✓ Cleaned up test records.")

  console.log("\nALL REAL CRYPTOGRAPHIC DIGITAL SIGNATURE CHECKS PASSED SUCCESSFULLY! ✅")
}

runDigitalSignatureTest()
  .catch(err => {
    console.error("Digital signature test failed:", err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
