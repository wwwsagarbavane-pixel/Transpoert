-- Baseline Migration 0_init for TransportOS PostgreSQL Database

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "logo" TEXT,
    "schema_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Branch',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "assignedCompanies" JSONB,
    "permissions" JSONB,
    "branch" TEXT,
    "lastLogin" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parties" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "gst" TEXT,
    "pan" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "creditLimit" TEXT,
    "billingAddress" TEXT,
    "shippingAddress" TEXT,
    "paymentTerms" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" TEXT,
    "driver" TEXT,
    "owner" TEXT,
    "gpsId" TEXT,
    "rc" TEXT,
    "insurance" TEXT,
    "fitness" TEXT,
    "permit" TEXT,
    "puc" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT,
    "altMobile" TEXT,
    "license" TEXT,
    "licenseExpiry" TEXT,
    "aadhaar" TEXT,
    "address" TEXT,
    "emergency" TEXT,
    "vehicle" TEXT,
    "experience" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owners" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pan" TEXT,
    "phone" TEXT,
    "contact" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "gst" TEXT,
    "address" TEXT,
    "type" TEXT,
    "vehicles" INTEGER DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "commission" TEXT,
    "phone" TEXT,
    "contact" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "outstanding" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "type" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "packing" TEXT,
    "hsn" TEXT,
    "rate" TEXT,
    "unit" TEXT,
    "description" TEXT,
    "fragile" BOOLEAN DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lrs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "lrNo" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "bookingBranch" TEXT,
    "bookingBranchId" TEXT,
    "bookingStation" TEXT,
    "deliveryStation" TEXT,
    "consignor" TEXT,
    "consignee" TEXT,
    "from" TEXT,
    "to" TEXT,
    "vehicle" TEXT,
    "driver" TEXT,
    "owner" TEXT,
    "agent" TEXT,
    "article" TEXT,
    "packages" TEXT,
    "packageCount" INTEGER,
    "weight" TEXT,
    "freight" DOUBLE PRECISION DEFAULT 0,
    "freightType" TEXT,
    "paymentType" TEXT,
    "hamali" DOUBLE PRECISION DEFAULT 0,
    "doorDeliveryCharges" DOUBLE PRECISION DEFAULT 0,
    "otherCharges" DOUBLE PRECISION DEFAULT 0,
    "gst" DOUBLE PRECISION DEFAULT 0,
    "totalAmount" DOUBLE PRECISION DEFAULT 0,
    "invoice" TEXT,
    "invoiceValue" DOUBLE PRECISION DEFAULT 0,
    "waybill" TEXT,
    "ewayBill" TEXT,
    "expectedDelivery" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Booked',
    "items" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "lrNo" TEXT NOT NULL,
    "lr_id" TEXT,
    "date" TEXT NOT NULL,
    "deliveredTo" TEXT,
    "receiverPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Delivered',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "billDate" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "partyId" TEXT,
    "amount" DOUBLE PRECISION DEFAULT 0,
    "subtotal" DOUBLE PRECISION DEFAULT 0,
    "tax" DOUBLE PRECISION DEFAULT 0,
    "totalAmount" DOUBLE PRECISION DEFAULT 0,
    "paid" DOUBLE PRECISION DEFAULT 0,
    "paidAmount" DOUBLE PRECISION DEFAULT 0,
    "outstanding" DOUBLE PRECISION DEFAULT 0,
    "lrsCount" INTEGER DEFAULT 0,
    "lrs" JSONB,
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "bill_id" TEXT,
    "date" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mode" TEXT NOT NULL DEFAULT 'Cash',
    "referenceNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "user" TEXT,
    "role" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "recordId" TEXT,
    "entityId" TEXT,
    "url" TEXT,
    "payload" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "branches_company_id_idx" ON "branches"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "parties_company_id_idx" ON "parties"("company_id");

-- CreateIndex
CREATE INDEX "vehicles_company_id_idx" ON "vehicles"("company_id");

-- CreateIndex
CREATE INDEX "drivers_company_id_idx" ON "drivers"("company_id");

-- CreateIndex
CREATE INDEX "owners_company_id_idx" ON "owners"("company_id");

-- CreateIndex
CREATE INDEX "agents_company_id_idx" ON "agents"("company_id");

-- CreateIndex
CREATE INDEX "stations_company_id_idx" ON "stations"("company_id");

-- CreateIndex
CREATE INDEX "articles_company_id_idx" ON "articles"("company_id");

-- CreateIndex
CREATE INDEX "lrs_company_id_idx" ON "lrs"("company_id");

-- CreateIndex
CREATE INDEX "deliveries_company_id_idx" ON "deliveries"("company_id");

-- CreateIndex
CREATE INDEX "bills_company_id_idx" ON "bills"("company_id");

-- CreateIndex
CREATE INDEX "payments_company_id_idx" ON "payments"("company_id");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parties" ADD CONSTRAINT "parties_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stations" ADD CONSTRAINT "stations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lrs" ADD CONSTRAINT "lrs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
