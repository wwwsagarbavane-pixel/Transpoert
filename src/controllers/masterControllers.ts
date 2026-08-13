import { apiClient } from "../services/apiClient"
import { DBVehicle, DBDriver, DBOwner, DBAgent } from "../db/schema"
import { companyContext } from "../services/companyContext"

export const vehicleController = {
  getVehicles: async (activeOnly = false, companyId: string = companyContext.getActiveCompanyId()): Promise<DBVehicle[]> => {
    return apiClient.get<DBVehicle[]>("/vehicles", { companyId, activeOnly })
  },
  createVehicle: async (data: Partial<DBVehicle>, companyId: string = companyContext.getActiveCompanyId()): Promise<DBVehicle> => {
    return apiClient.post<DBVehicle>("/vehicles", { ...data, company_id: companyId })
  },
  updateVehicle: async (id: string, updates: Partial<DBVehicle>, companyId?: string): Promise<DBVehicle> => {
    return apiClient.put<DBVehicle>(`/vehicles/${encodeURIComponent(id)}`, { ...updates, company_id: companyId })
  },
  deleteVehicle: async (id: string, companyId?: string): Promise<void> => {
    return apiClient.delete(`/vehicles/${encodeURIComponent(id)}`)
  }
}

export const driverController = {
  getDrivers: async (activeOnly = false, companyId: string = companyContext.getActiveCompanyId()): Promise<DBDriver[]> => {
    return apiClient.get<DBDriver[]>("/drivers", { companyId, activeOnly })
  },
  createDriver: async (data: Partial<DBDriver>, companyId: string = companyContext.getActiveCompanyId()): Promise<DBDriver> => {
    return apiClient.post<DBDriver>("/drivers", { ...data, company_id: companyId })
  },
  updateDriver: async (id: string, updates: Partial<DBDriver>, companyId?: string): Promise<DBDriver> => {
    return apiClient.put<DBDriver>(`/drivers/${encodeURIComponent(id)}`, { ...updates, company_id: companyId })
  },
  deleteDriver: async (id: string, companyId?: string): Promise<void> => {
    return apiClient.delete(`/drivers/${encodeURIComponent(id)}`)
  }
}

export const ownerController = {
  getOwners: async (activeOnly = false, companyId: string = companyContext.getActiveCompanyId()): Promise<DBOwner[]> => {
    return apiClient.get<DBOwner[]>("/owners", { companyId, activeOnly })
  },
  createOwner: async (data: Partial<DBOwner>, companyId: string = companyContext.getActiveCompanyId()): Promise<DBOwner> => {
    return apiClient.post<DBOwner>("/owners", { ...data, company_id: companyId })
  },
  updateOwner: async (id: string, updates: Partial<DBOwner>, companyId?: string): Promise<DBOwner> => {
    return apiClient.put<DBOwner>(`/owners/${encodeURIComponent(id)}`, { ...updates, company_id: companyId })
  },
  deleteOwner: async (id: string, companyId?: string): Promise<void> => {
    return apiClient.delete(`/owners/${encodeURIComponent(id)}`)
  }
}

export const agentController = {
  getAgents: async (activeOnly = false, companyId: string = companyContext.getActiveCompanyId()): Promise<DBAgent[]> => {
    return apiClient.get<DBAgent[]>("/agents", { companyId, activeOnly })
  },
  createAgent: async (data: Partial<DBAgent>, companyId: string = companyContext.getActiveCompanyId()): Promise<DBAgent> => {
    return apiClient.post<DBAgent>("/agents", { ...data, company_id: companyId })
  },
  updateAgent: async (id: string, updates: Partial<DBAgent>, companyId?: string): Promise<DBAgent> => {
    return apiClient.put<DBAgent>(`/agents/${encodeURIComponent(id)}`, { ...updates, company_id: companyId })
  },
  deleteAgent: async (id: string, companyId?: string): Promise<void> => {
    return apiClient.delete(`/agents/${encodeURIComponent(id)}`)
  }
}
