import { partyRepository } from "../repositories/repositories"
import { DBParty } from "../db/schema"
import { companyContext } from "./companyContext"

export type Party = DBParty

export const partyService = {
  getAllParties: async (companyId: string = companyContext.getActiveCompanyId()): Promise<Party[]> => {
    return await partyRepository.findAll(companyId)
  },

  getActiveParties: async (companyId: string = companyContext.getActiveCompanyId()): Promise<Party[]> => {
    return await partyRepository.findActive(companyId)
  },

  getPartyById: async (id: string, companyId: string = companyContext.getActiveCompanyId()): Promise<Party | undefined> => {
    const res = await partyRepository.findById(id, companyId)
    return res || undefined
  },

  createParty: async (newParty: Partial<Party>, companyId: string = companyContext.getActiveCompanyId()): Promise<Party> => {
    if (!newParty.name || !newParty.name.trim()) {
      throw new Error("Party name is required")
    }

    return await partyRepository.create(companyId, {
      ...newParty,
      company_id: companyId,
      name: newParty.name.trim(),
      type: newParty.type || "Both",
      gst: newParty.gst || newParty.gstin || "",
      gstin: newParty.gstin || newParty.gst || "",
      pan: newParty.pan || "",
      phone: newParty.phone || newParty.mobile || "",
      mobile: newParty.mobile || newParty.phone || "",
      email: newParty.email || "",
      contactPerson: newParty.contactPerson || newParty.name.trim(),
      creditLimit: newParty.creditLimit || 500000,
      outstanding: newParty.outstanding || 0,
      billingAddress: newParty.billingAddress || "",
      shippingAddress: newParty.shippingAddress || "",
      paymentTerms: newParty.paymentTerms || "30 Days",
      city: newParty.city || "",
      state: newParty.state || "",
      status: newParty.status || "active"
    })
  },

  updateParty: async (id: string, updatedFields: Partial<Party>, companyId: string = companyContext.getActiveCompanyId()): Promise<Party | null> => {
    const existing = await partyRepository.findById(id, companyId)
    if (!existing) return null
    const updated: Party = {
      ...existing,
      ...updatedFields,
      company_id: companyId,
      updatedAt: new Date().toISOString()
    }
    return await partyRepository.save(companyId, updated)
  },

  deleteParty: async (id: string, companyId: string = companyContext.getActiveCompanyId()): Promise<boolean> => {
    return await partyRepository.softDelete(companyId, id)
  }
}
