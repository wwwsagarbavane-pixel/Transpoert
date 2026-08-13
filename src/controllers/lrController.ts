import { apiClient } from "../services/apiClient"
import { DBLR } from "../db/schema"
import { companyContext } from "../services/companyContext"

export const lrController = {
  getNextLRNumber: async (companyId: string = companyContext.getActiveCompanyId()): Promise<string> => {
    try {
      const res = await apiClient.get<{ lrNumber: string }>("/lrs/next-number", { companyId })
      return res.lrNumber || `LR-${Date.now()}`
    } catch {
      const lrs = await lrController.fetchLRs({ status: "all" }, companyId)
      if (lrs.length === 0) return "LR-1001"
      let maxNum = 0
      lrs.forEach(r => {
        const match = r.lr?.match(/\d+/)
        if (match) {
          const num = parseInt(match[0], 10)
          if (num > maxNum) maxNum = num
        }
      })
      return `LR-${maxNum + 1}`
    }
  },

  fetchLRs: async (params?: { search?: string; status?: string; consignor?: string } | string, companyId: string = companyContext.getActiveCompanyId()): Promise<DBLR[]> => {
    let targetCompanyId = companyId
    let search = ""
    let status = ""
    let consignor = ""

    if (typeof params === "string") {
      if (params.startsWith("COMP-")) {
        targetCompanyId = params
      } else {
        search = params
      }
    } else if (params && typeof params === "object") {
      search = params.search || ""
      status = params.status || ""
      consignor = params.consignor || ""
    }

    return apiClient.get<DBLR[]>("/lrs", { companyId: targetCompanyId, search, status, consignor })
  },

  fetchLRById: async (lrId: string, companyId: string = companyContext.getActiveCompanyId()): Promise<DBLR | null> => {
    try {
      const res = await apiClient.get<DBLR>(`/lrs/${encodeURIComponent(lrId)}`, { companyId })
      return res || null
    } catch (err) {
      console.error("fetchLRById error:", err)
      return null
    }
  },

  createLR: async (lrData: Omit<DBLR, "id" | "company_id" | "createdAt" | "updatedAt">, companyId: string = companyContext.getActiveCompanyId()): Promise<DBLR> => {
    return apiClient.post<DBLR>("/lrs", { ...lrData, company_id: companyId })
  },

  updateLR: async (lrIdentifier: string, updates: Partial<DBLR>, companyId: string = companyContext.getActiveCompanyId()): Promise<DBLR> => {
    return apiClient.put<DBLR>(`/lrs/${encodeURIComponent(lrIdentifier)}`, { ...updates, company_id: companyId })
  },

  deleteLR: async (lrIdentifier: string, companyId: string = companyContext.getActiveCompanyId()): Promise<void> => {
    return apiClient.delete(`/lrs/${encodeURIComponent(lrIdentifier)}?companyId=${encodeURIComponent(companyId)}`)
  }
}
