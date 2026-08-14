import pkg from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const PrismaClient = pkg.PrismaClient || (pkg as any).default?.PrismaClient || (pkg as any)
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public"

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
