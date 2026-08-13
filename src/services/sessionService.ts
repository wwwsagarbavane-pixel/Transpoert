import { DBCompany } from "../db/schema"
import { companyContext } from "./companyContext"

const SESSION_TOKEN_KEY = "transportos_session_token"
const SESSION_USER_KEY = "transportos_session_user"
const SESSION_COMPANY_KEY = "transportos_session_company"
const LAST_PAGE_KEY = "transportos_last_active_page"

export interface SessionUser {
  id?: string
  name: string
  role: string
  email?: string
  mobile?: string
  branch?: string
  department?: string
  designation?: string
  lastLogin?: string
  createdAt?: string
}

export interface UserSession {
  company: DBCompany | null
  user: SessionUser | null
  activePage: string
  isLoggedIn: boolean
  token: string | null
}

export const sessionService = {
  saveSession: (company: DBCompany, user: SessionUser, activePage: string = "Dashboard"): void => {
    const token = `AUTH-TOKEN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    localStorage.setItem(SESSION_TOKEN_KEY, token)
    localStorage.setItem(SESSION_COMPANY_KEY, JSON.stringify(company))
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
    localStorage.setItem(LAST_PAGE_KEY, activePage)
    companyContext.setActiveCompanyId(company.id)
  },

  updateActivePage: (pageName: string): void => {
    localStorage.setItem(LAST_PAGE_KEY, pageName)
  },

  getSession: (): UserSession => {
    try {
      const token = localStorage.getItem(SESSION_TOKEN_KEY)
      const companyRaw = localStorage.getItem(SESSION_COMPANY_KEY)
      const userRaw = localStorage.getItem(SESSION_USER_KEY)
      const activePage = localStorage.getItem(LAST_PAGE_KEY) || "Dashboard"

      if (token && companyRaw && userRaw) {
        const company = JSON.parse(companyRaw) as DBCompany
        const user = JSON.parse(userRaw) as { name: string; role: string }
        return {
          company,
          user,
          activePage,
          isLoggedIn: true,
          token
        }
      }
    } catch (err) {
      console.error("Failed to restore session:", err)
    }

    return {
      company: null,
      user: null,
      activePage: "Dashboard",
      isLoggedIn: false,
      token: null
    }
  },

  clearSession: (): void => {
    localStorage.removeItem(SESSION_TOKEN_KEY)
    localStorage.removeItem(SESSION_COMPANY_KEY)
    localStorage.removeItem(SESSION_USER_KEY)
    localStorage.removeItem(LAST_PAGE_KEY)
    companyContext.clearActiveCompany()
  }
}
