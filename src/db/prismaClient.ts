import pkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config()

const PrismaClient = pkg.PrismaClient || (pkg as any).default?.PrismaClient || (pkg as any)
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

const adapter = new PrismaPg({ connectionString })
export const prisma = new PrismaClient({ adapter })
