import { prisma } from "../src/db/prismaClient"
import { verifyPassword } from "../src/server/passwordSecurity"

async function run() {
  const users: any = await prisma.$queryRawUnsafe(`SELECT id, email, password FROM public.users`)
  for (const u of users) {
    console.log(`User: ${u.email}, Hash: ${u.password.substring(0, 20)}..., Test@123 match: ${verifyPassword("Test@123", u.password)}, admin match: ${verifyPassword("admin", u.password)}`)
  }
}

run()
