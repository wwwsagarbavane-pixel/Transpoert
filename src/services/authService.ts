import { userRepository } from "../repositories/repositories"
import { DBUser } from "../db/schema"

export interface AuthSession {
  user: DBUser
  token: string
  expiresAt: string
}

const SESSION_KEY = "transportos_session"

export const authService = {
  login: async (email: string): Promise<AuthSession> => {
    const users = await userRepository.findAll()
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      user = await userRepository.create({
        name: email.split("@")[0] || "Enterprise User",
        email: email,
        role: "Admin",
        branch: "Mumbai HQ",
        lastLogin: new Date().toISOString(),
        status: "active"
      })
    } else {
      user.lastLogin = new Date().toISOString()
      await userRepository.save(user)
    }

    const token = `JWT_${btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role }))}_${Date.now()}`
    const expiresAt = new Date(Date.now() + 86400000).toISOString()

    const session: AuthSession = { user, token, expiresAt }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    return session
  },

  getCurrentSession: (): AuthSession | null => {
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (!stored) return null
      const session: AuthSession = JSON.parse(stored)
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(SESSION_KEY)
        return null
      }
      return session
    } catch {
      return null
    }
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY)
  },

  hasPermission: (requiredRole: string): boolean => {
    const session = authService.getCurrentSession()
    if (!session) return false
    if (session.user.role === "Admin" || session.user.role === "Super Admin") return true
    return session.user.role === requiredRole
  }
}
