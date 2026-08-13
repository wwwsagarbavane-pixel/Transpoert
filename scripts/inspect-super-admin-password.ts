import { prisma } from "../src/db/prismaClient"

async function check() {
  const users: any = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."users" WHERE LOWER(email) = 'admin@gmail.com' OR role = 'SUPER_ADMIN' OR role = 'Super Admin'`)
  console.log("Users matching Super Admin:", JSON.stringify(users, null, 2))
}

check().then(() => process.exit(0))
