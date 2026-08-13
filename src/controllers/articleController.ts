import { apiClient } from "../services/apiClient"
import { DBArticle } from "../db/schema"
import { companyContext } from "../services/companyContext"

export const articleController = {
  getArticles: async (activeOnly = true, companyId: string = companyContext.getActiveCompanyId()): Promise<DBArticle[]> => {
    return apiClient.get<DBArticle[]>("/articles", { companyId, activeOnly })
  },
  addArticle: async (data: Partial<DBArticle>, companyId: string = companyContext.getActiveCompanyId()): Promise<DBArticle> => {
    return apiClient.post<DBArticle>("/articles", { ...data, company_id: companyId })
  },
  updateArticle: async (id: string, updates: Partial<DBArticle>, companyId?: string): Promise<DBArticle> => {
    return apiClient.put<DBArticle>(`/articles/${encodeURIComponent(id)}`, { ...updates, company_id: companyId })
  },
  deleteArticle: async (id: string, companyId?: string): Promise<void> => {
    return apiClient.delete(`/articles/${encodeURIComponent(id)}`)
  }
}
