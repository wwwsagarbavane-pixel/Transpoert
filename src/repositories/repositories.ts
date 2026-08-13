import { apiClient } from "../services/apiClient"
import { companyContext } from "../services/companyContext"
import {
  DBParty, DBVehicle, DBDriver, DBOwner, DBAgent, DBStation,
  DBArticle, DBLR, DBBill, DBUser, DBCompany
} from "../db/schema"

export const companyRepository = {
  findAll: async (): Promise<DBCompany[]> => {
    return apiClient.get<DBCompany[]>("/companies")
  },
  findById: async (id: string): Promise<DBCompany | null> => {
    return apiClient.get<DBCompany>(`/companies/${encodeURIComponent(id)}`)
  },
  create: async (company: Partial<DBCompany>): Promise<DBCompany> => {
    return apiClient.post<DBCompany>("/companies", company)
  },
  update: async (id: string, company: Partial<DBCompany>): Promise<DBCompany> => {
    return apiClient.put<DBCompany>(`/companies/${encodeURIComponent(id)}`, company)
  },
  save: async (company: DBCompany, isEditMode: boolean = false): Promise<DBCompany> => {
    if (isEditMode && company.id) {
      return apiClient.put<DBCompany>(`/companies/${encodeURIComponent(company.id)}`, company)
    }
    return apiClient.post<DBCompany>("/companies", company)
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${encodeURIComponent(id)}`)
  }
}

export const branchRepository = {
  findAll: async (companyId?: string): Promise<any[]> => {
    return apiClient.get<any[]>("/branches", { companyId })
  },
  findById: async (id: string): Promise<any | null> => {
    return apiClient.get<any>(`/branches/${encodeURIComponent(id)}`)
  },
  create: async (branch: any): Promise<any> => {
    return apiClient.post<any>("/branches", branch)
  },
  update: async (id: string, branch: any): Promise<any> => {
    return apiClient.put<any>(`/branches/${encodeURIComponent(id)}`, branch)
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/branches/${encodeURIComponent(id)}`)
  }
}

export const partyRepository = {
  findAll: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBParty[]> => {
    return apiClient.get<DBParty[]>("/parties", { companyId })
  },
  findActive: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBParty[]> => {
    return apiClient.get<DBParty[]>("/parties", { companyId, activeOnly: true })
  },
  findById: async (id: string, companyId: string = companyContext.getActiveCompanyId()): Promise<DBParty | null> => {
    return apiClient.get<DBParty>(`/parties/${encodeURIComponent(id)}`, { companyId })
  },
  create: async (arg1: any, arg2?: any): Promise<DBParty> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const party = arg2 !== undefined ? arg2 : arg1
    return apiClient.post<DBParty>("/parties", { ...party, company_id: companyId })
  },
  save: async (arg1: any, arg2?: any): Promise<DBParty> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const party = arg2 !== undefined ? arg2 : arg1
    return apiClient.put<DBParty>(`/parties/${encodeURIComponent(party.id)}`, { ...party, company_id: companyId })
  },
  softDelete: async (arg1: any, arg2?: any): Promise<boolean> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const id = arg2 !== undefined ? arg2 : arg1
    await apiClient.delete(`/parties/${encodeURIComponent(id)}?companyId=${encodeURIComponent(companyId)}`)
    return true
  }
}

export const vehicleRepository = {
  findAll: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBVehicle[]> => {
    return apiClient.get<DBVehicle[]>("/vehicles", { companyId })
  },
  findById: async (id: string, companyId: string = companyContext.getActiveCompanyId()): Promise<DBVehicle | null> => {
    return apiClient.get<DBVehicle>(`/vehicles/${encodeURIComponent(id)}`)
  },
  create: async (arg1: any, arg2?: any): Promise<DBVehicle> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const vehicle = arg2 !== undefined ? arg2 : arg1
    return apiClient.post<DBVehicle>("/vehicles", { ...vehicle, company_id: companyId })
  },
  save: async (arg1: any, arg2?: any): Promise<DBVehicle> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const vehicle = arg2 !== undefined ? arg2 : arg1
    return apiClient.put<DBVehicle>(`/vehicles/${encodeURIComponent(vehicle.id)}`, vehicle)
  },
  softDelete: async (arg1: any, arg2?: any): Promise<boolean> => {
    const id = arg2 !== undefined ? arg2 : arg1
    await apiClient.delete(`/vehicles/${encodeURIComponent(id)}`)
    return true
  }
}

export const driverRepository = {
  findAll: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBDriver[]> => {
    return apiClient.get<DBDriver[]>("/drivers", { companyId })
  },
  findById: async (id: string, companyId: string = companyContext.getActiveCompanyId()): Promise<DBDriver | null> => {
    return apiClient.get<DBDriver>(`/drivers/${encodeURIComponent(id)}`)
  },
  create: async (arg1: any, arg2?: any): Promise<DBDriver> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const driver = arg2 !== undefined ? arg2 : arg1
    return apiClient.post<DBDriver>("/drivers", { ...driver, company_id: companyId })
  },
  save: async (arg1: any, arg2?: any): Promise<DBDriver> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const driver = arg2 !== undefined ? arg2 : arg1
    return apiClient.put<DBDriver>(`/drivers/${encodeURIComponent(driver.id)}`, driver)
  },
  softDelete: async (arg1: any, arg2?: any): Promise<boolean> => {
    const id = arg2 !== undefined ? arg2 : arg1
    await apiClient.delete(`/drivers/${encodeURIComponent(id)}`)
    return true
  }
}

export const ownerRepository = {
  findAll: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBOwner[]> => {
    return apiClient.get<DBOwner[]>("/owners", { companyId })
  },
  findById: async (id: string, companyId: string = companyContext.getActiveCompanyId()): Promise<DBOwner | null> => {
    return apiClient.get<DBOwner>(`/owners/${encodeURIComponent(id)}`)
  },
  create: async (arg1: any, arg2?: any): Promise<DBOwner> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const owner = arg2 !== undefined ? arg2 : arg1
    return apiClient.post<DBOwner>("/owners", { ...owner, company_id: companyId })
  },
  save: async (arg1: any, arg2?: any): Promise<DBOwner> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const owner = arg2 !== undefined ? arg2 : arg1
    return apiClient.put<DBOwner>(`/owners/${encodeURIComponent(owner.id)}`, owner)
  },
  softDelete: async (arg1: any, arg2?: any): Promise<boolean> => {
    const id = arg2 !== undefined ? arg2 : arg1
    await apiClient.delete(`/owners/${encodeURIComponent(id)}`)
    return true
  }
}

export const agentRepository = {
  findAll: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBAgent[]> => {
    return apiClient.get<DBAgent[]>("/agents", { companyId })
  },
  findById: async (id: string, companyId: string = companyContext.getActiveCompanyId()): Promise<DBAgent | null> => {
    return apiClient.get<DBAgent>(`/agents/${encodeURIComponent(id)}`)
  },
  create: async (arg1: any, arg2?: any): Promise<DBAgent> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const agent = arg2 !== undefined ? arg2 : arg1
    return apiClient.post<DBAgent>("/agents", { ...agent, company_id: companyId })
  },
  save: async (arg1: any, arg2?: any): Promise<DBAgent> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const agent = arg2 !== undefined ? arg2 : arg1
    return apiClient.put<DBAgent>(`/agents/${encodeURIComponent(agent.id)}`, agent)
  },
  softDelete: async (arg1: any, arg2?: any): Promise<boolean> => {
    const id = arg2 !== undefined ? arg2 : arg1
    await apiClient.delete(`/agents/${encodeURIComponent(id)}`)
    return true
  }
}

export const stationRepository = {
  findAll: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBStation[]> => {
    return apiClient.get<DBStation[]>("/stations", { companyId })
  },
  findActive: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBStation[]> => {
    return apiClient.get<DBStation[]>("/stations", { companyId, activeOnly: true })
  },
  findById: async (id: string, companyId: string = companyContext.getActiveCompanyId()): Promise<DBStation | null> => {
    return apiClient.get<DBStation>(`/stations/${encodeURIComponent(id)}`)
  },
  create: async (arg1: any, arg2?: any): Promise<DBStation> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const station = arg2 !== undefined ? arg2 : arg1
    return apiClient.post<DBStation>("/stations", { ...station, company_id: companyId })
  },
  save: async (arg1: any, arg2?: any): Promise<DBStation> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const station = arg2 !== undefined ? arg2 : arg1
    return apiClient.put<DBStation>(`/stations/${encodeURIComponent(station.id)}`, station)
  },
  softDelete: async (arg1: any, arg2?: any): Promise<boolean> => {
    const id = arg2 !== undefined ? arg2 : arg1
    await apiClient.delete(`/stations/${encodeURIComponent(id)}`)
    return true
  }
}

export const articleRepository = {
  findAll: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBArticle[]> => {
    return apiClient.get<DBArticle[]>("/articles", { companyId })
  },
  findActive: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBArticle[]> => {
    return apiClient.get<DBArticle[]>("/articles", { companyId, activeOnly: true })
  },
  findById: async (id: string, companyId: string = companyContext.getActiveCompanyId()): Promise<DBArticle | null> => {
    return apiClient.get<DBArticle>(`/articles/${encodeURIComponent(id)}`)
  },
  create: async (arg1: any, arg2?: any): Promise<DBArticle> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const article = arg2 !== undefined ? arg2 : arg1
    return apiClient.post<DBArticle>("/articles", { ...article, company_id: companyId })
  },
  save: async (arg1: any, arg2?: any): Promise<DBArticle> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const article = arg2 !== undefined ? arg2 : arg1
    return apiClient.put<DBArticle>(`/articles/${encodeURIComponent(article.id)}`, article)
  },
  softDelete: async (arg1: any, arg2?: any): Promise<boolean> => {
    const id = arg2 !== undefined ? arg2 : arg1
    await apiClient.delete(`/articles/${encodeURIComponent(id)}`)
    return true
  }
}

export const lrRepository = {
  findAll: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBLR[]> => {
    return apiClient.get<DBLR[]>("/lrs", { companyId })
  },
  findById: async (id: string, companyId: string = companyContext.getActiveCompanyId()): Promise<DBLR | null> => {
    return apiClient.get<DBLR>(`/lrs/${encodeURIComponent(id)}`)
  },
  findByNumber: async (arg1: string, arg2?: string): Promise<DBLR | null> => {
    const lrNumber = arg2 !== undefined ? arg2 : arg1
    return apiClient.get<DBLR>(`/lrs/${encodeURIComponent(lrNumber)}`)
  },
  create: async (arg1: any, arg2?: any): Promise<DBLR> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const lr = arg2 !== undefined ? arg2 : arg1
    return apiClient.post<DBLR>("/lrs", { ...lr, company_id: companyId })
  },
  save: async (arg1: any, arg2?: any): Promise<DBLR> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const lr = arg2 !== undefined ? arg2 : arg1
    return apiClient.put<DBLR>(`/lrs/${encodeURIComponent(lr.id)}`, lr)
  },
  softDelete: async (arg1: any, arg2?: any): Promise<boolean> => {
    const lrNumber = arg2 !== undefined ? arg2 : arg1
    await apiClient.delete(`/lrs/${encodeURIComponent(lrNumber)}`)
    return true
  }
}

export const userRepository = {
  findAll: async (companyId?: string): Promise<DBUser[]> => {
    const activeComp = companyId || companyContext.getActiveCompanyId() || "PLATFORM"
    return apiClient.get<DBUser[]>("/users", { companyId: activeComp, scope: activeComp === "PLATFORM" ? "all_admin" : undefined })
  },
  create: async (user: any): Promise<DBUser> => {
    return apiClient.post<DBUser>("/users", user)
  },
  update: async (id: string, user: any): Promise<DBUser> => {
    return apiClient.put<DBUser>(`/users/${encodeURIComponent(id)}`, user)
  },
  save: async (user: DBUser, isEditMode: boolean = false): Promise<DBUser> => {
    if (isEditMode && user.id) {
      return apiClient.put<DBUser>(`/users/${encodeURIComponent(user.id)}`, user)
    }
    return apiClient.post<DBUser>("/users", user)
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${encodeURIComponent(id)}`)
  }
}

export const billingRepository = {
  findAll: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBBill[]> => {
    return apiClient.get<DBBill[]>("/bills", { companyId })
  },
  create: async (arg1: any, arg2?: any): Promise<DBBill> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const bill = arg2 !== undefined ? arg2 : arg1
    return apiClient.post<DBBill>("/bills", { ...bill, company_id: companyId })
  },
  save: async (arg1: any, arg2?: any): Promise<DBBill> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const bill = arg2 !== undefined ? arg2 : arg1
    return apiClient.put<DBBill>(`/bills/${encodeURIComponent(bill.id)}`, { ...bill, company_id: companyId })
  },
  softDelete: async (arg1: any, arg2?: any): Promise<boolean> => {
    const id = arg2 !== undefined ? arg2 : arg1
    await apiClient.delete(`/bills/${encodeURIComponent(id)}`)
    return true
  }
}

export const paymentRepository = {
  findAll: async (companyId: string = companyContext.getActiveCompanyId()): Promise<any[]> => {
    return apiClient.get<any[]>("/payments", { companyId })
  },
  create: async (arg1: any, arg2?: any): Promise<any> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const payment = arg2 !== undefined ? arg2 : arg1
    return apiClient.post("/payments", { ...payment, company_id: companyId })
  },
  update: async (id: string, payment: any, companyId: string = companyContext.getActiveCompanyId()): Promise<any> => {
    return apiClient.put(`/payments/${encodeURIComponent(id)}`, { ...payment, company_id: companyId })
  },
  save: async (arg1: any, arg2?: any): Promise<any> => {
    const companyId = arg2 !== undefined ? arg1 : companyContext.getActiveCompanyId()
    const payment = arg2 !== undefined ? arg2 : arg1
    if (payment.id) {
      return apiClient.put(`/payments/${encodeURIComponent(payment.id)}`, { ...payment, company_id: companyId })
    }
    return apiClient.post("/payments", { ...payment, company_id: companyId })
  }
}
