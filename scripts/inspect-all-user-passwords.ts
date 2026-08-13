import { prisma } from "../src/db/prismaClient"
import { verifyPassword } from "../src/server/passwordSecurity"

async function checkAll() {
  const users: any = await prisma.$queryRawUnsafe(`SELECT id, name, email, role, password, password_hash FROM "public"."users"`)
  const candidates = ["admin", "Admin", "Admin@123", "admin123", "SuperAdmin@123", "password", "123456", "demo", "demo123", "gb@gmail.com", "erp@gmail.com", "pr@gmail.com", "ganesh@gmail.com"]

  users.forEach((u: any) => {
    const hash = u.password_hash || u.password
    let matched = ""
    for (const c of candidates) {
      if (verifyPassword(c, hash)) {
        matched = c
        break
      }
    }
    console.log(`User ID: ${u.id} | Email: ${u.email} | Role: ${u.role} | HashPrefix: ${String(hash).slice(0, 30)}... | MatchedPassword: "${matched}"`)
  })
}

checkAll().then(() => process.exit(0))
