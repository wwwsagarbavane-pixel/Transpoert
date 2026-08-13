const ACTIVE_COMPANY_KEY = "transportos_active_company_id"
const SESSION_COMPANY_KEY = "transportos_session_company"

export const companyContext = {
  setActiveCompanyId: (companyId: string): void => {
    if (companyId) {
      localStorage.setItem(ACTIVE_COMPANY_KEY, companyId)
    }
  },

  getActiveCompanyId: (): string => {
    const active = localStorage.getItem(ACTIVE_COMPANY_KEY)
    if (active) return active
    try {
      const rawComp = localStorage.getItem(SESSION_COMPANY_KEY)
      if (rawComp) {
        const comp = JSON.parse(rawComp)
        if (comp && comp.id) return comp.id
      }
    } catch {}
    return "COMP-DEMO-001"
  },

  clearActiveCompany: (): void => {
    localStorage.removeItem(ACTIVE_COMPANY_KEY)
  }
}

