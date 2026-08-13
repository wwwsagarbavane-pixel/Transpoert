import { apiClient } from "../services/apiClient"
import { DBParty } from "../db/schema"
import { companyContext } from "../services/companyContext"

export const partyController = {
  getParties: async (activeOnly = true, companyId: string = companyContext.getActiveCompanyId()): Promise<DBParty[]> => {
    return apiClient.get<DBParty[]>("/parties", { companyId, activeOnly })
  },
  addParty: async (partyData: Partial<DBParty>, companyId: string = companyContext.getActiveCompanyId()): Promise<DBParty> => {
    return apiClient.post<DBParty>("/parties", { ...partyData, company_id: companyId })
  },
  updateParty: async (id: string, updates: Partial<DBParty>, companyId: string = companyContext.getActiveCompanyId()): Promise<DBParty> => {
    return apiClient.put<DBParty>(`/parties/${encodeURIComponent(id)}`, { ...updates, company_id: companyId })
  },
  deleteParty: async (id: string, companyId: string = companyContext.getActiveCompanyId()): Promise<void> => {
    return apiClient.delete(`/parties/${encodeURIComponent(id)}?companyId=${encodeURIComponent(companyId)}`)
  }
}
