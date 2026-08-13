import { apiClient } from "../services/apiClient"
import { DBStation } from "../db/schema"
import { companyContext } from "../services/companyContext"

export const stationController = {
  getStations: async (activeOnly = true, companyId: string = companyContext.getActiveCompanyId()): Promise<DBStation[]> => {
    return apiClient.get<DBStation[]>("/stations", { companyId, activeOnly })
  },
  addStation: async (data: Partial<DBStation>, companyId: string = companyContext.getActiveCompanyId()): Promise<DBStation> => {
    return apiClient.post<DBStation>("/stations", { ...data, company_id: companyId })
  },
  updateStation: async (id: string, updates: Partial<DBStation>): Promise<DBStation> => {
    return apiClient.put<DBStation>(`/stations/${encodeURIComponent(id)}`, updates)
  },
  deleteStation: async (id: string): Promise<void> => {
    return apiClient.delete(`/stations/${encodeURIComponent(id)}`)
  }
}
