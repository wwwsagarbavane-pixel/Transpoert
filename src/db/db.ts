import { apiClient } from "../services/apiClient"
import { companyContext } from "../services/companyContext"
import { DBAuditLog } from "./schema"

export const dbQuery = {
  getAll: async <T>(storeName: string): Promise<T[]> => {
    try {
      return await apiClient.get<T[]>(`/${storeName}`)
    } catch (err) {
      console.error(`[REST API Error] getAll ${storeName}:`, err)
      return []
    }
  },

  getAllForCompany: async <T>(storeName: string, companyId?: string): Promise<T[]> => {
    try {
      const activeId = companyId || companyContext.getActiveCompanyId()
      const data = await apiClient.get<T[]>(`/${storeName}`, { companyId: activeId })
      if (activeId && storeName !== "companies") {
        return data.filter((item: any) =>
          item.company_id === activeId ||
          (storeName === "users" && item.assignedCompanies && item.assignedCompanies.includes(activeId))
        )
      }
      return data
    } catch (err) {
      console.error(`[REST API Error] getAllForCompany ${storeName}:`, err)
      return []
    }
  },

  getById: async <T>(storeName: string, id: string): Promise<T | null> => {
    try {
      return await apiClient.get<T>(`/${storeName}/${encodeURIComponent(id)}`)
    } catch (err) {
      console.error(`[REST API Error] getById ${storeName}/${id}:`, err)
      return null
    }
  },

  put: async <T>(storeName: string, item: any): Promise<T> => {
    try {
      if (item.id) {
        return await apiClient.put<T>(`/${storeName}/${encodeURIComponent(item.id)}`, item)
      } else {
        return await apiClient.post<T>(`/${storeName}`, item)
      }
    } catch (err) {
      console.error(`[REST API Error] put ${storeName}:`, err)
      throw err
    }
  },

  delete: async (storeName: string, id: string): Promise<void> => {
    try {
      await apiClient.delete(`/${storeName}/${encodeURIComponent(id)}`)
    } catch (err) {
      console.error(`[REST API Error] delete ${storeName}/${id}:`, err)
    }
  },

  softDelete: async (storeName: string, id: string, userId: string = "system"): Promise<void> => {
    try {
      await apiClient.delete(`/${storeName}/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`)
    } catch (err) {
      console.error(`[REST API Error] softDelete ${storeName}/${id}:`, err)
    }
  },

  logAudit: async (entity: string, action: "CREATE" | "UPDATE" | "DELETE" | "SOFT_DELETE", entityId: string, payload: any, companyId: string = "COMP-001") => {
    const log: DBAuditLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      company_id: companyId,
      entity,
      action,
      recordId: entityId,
      entityId,
      payload: JSON.stringify(payload),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    try {
      await apiClient.post("/audit-logs", log)
    } catch {
      // Ignore audit log endpoint errors
    }
  }
}
