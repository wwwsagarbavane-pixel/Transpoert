import dotenv from 'dotenv'
dotenv.config()

export default {
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/transportos_erp?schema=public",
  },
}
