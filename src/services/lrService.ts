import { lrRepository } from "../repositories/repositories"
import { DBLR } from "../db/schema"
import { companyContext } from "./companyContext"

export type LRRecord = DBLR

export const lrService = {
  getLRs: async (search?: string, status?: string): Promise<LRRecord[]> => {
    let list = await lrRepository.findAll()

    if (status && status !== "all") {
      list = list.filter(item => item.status === status)
    }

    if (search && search.trim() !== "") {
      const q = search.toLowerCase().trim()
      list = list.filter(item =>
        item.lr.toLowerCase().includes(q) ||
        item.consignor.toLowerCase().includes(q) ||
        item.consignee.toLowerCase().includes(q) ||
        (item.vehicle || "").toLowerCase().includes(q) ||
        (item.from || "").toLowerCase().includes(q) ||
        (item.to || "").toLowerCase().includes(q)
      )
    }

    return list
  },

  getLRById: async (id: string): Promise<LRRecord | undefined> => {
    const res = await lrRepository.findById(id)
    return res || undefined
  },

  generateNextLRNumber: async (): Promise<string> => {
    const list = await lrRepository.findAll()
    const maxNum = list.reduce((max, item) => {
      const match = item.lr.match(/\d+/)
      if (match) {
        const num = parseInt(match[0], 10)
        return num > max ? num : max
      }
      return max
    }, 2847)
    return `LR-${maxNum + 1}`
  },

  createLR: async (formData: Partial<LRRecord>): Promise<LRRecord> => {
    // Validation
    if (!formData.bookingBranch) throw new Error("Booking branch is required")
    if (!formData.bookingStation) throw new Error("Booking station is required")
    if (!formData.deliveryStation) throw new Error("Delivery station is required")
    if (!formData.consignor) throw new Error("Consignor party is required")
    if (!formData.consignee) throw new Error("Consignee party is required")
    if (!formData.article) throw new Error("Article is required")

    const nextLrNo = await lrService.generateNextLRNumber()
    const freight = parseFloat(String(formData.freight || 0))
    const advance = parseFloat(String(formData.advance || 0))
    const hamali = parseFloat(String(formData.hamali || 0))
    const balance = freight > 0 ? freight - advance + hamali : 0

    const newLR: Omit<DBLR, "id" | "createdAt" | "updatedAt"> = {
      company_id: formData.company_id || companyContext.getActiveCompanyId(),
      lr: formData.lr || nextLrNo,
      date: formData.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      bookingBranch: formData.bookingBranch,
      bookingStation: formData.bookingStation,
      deliveryStation: formData.deliveryStation,
      vehicle: formData.vehicle || "MH-12-AB-3456",
      driver: formData.driver || "Ganesh Bawane",
      owner: formData.owner || "Suresh Logistics Pvt Ltd",
      agent: formData.agent || "",
      from: formData.bookingStation,
      to: formData.deliveryStation,
      consignor: formData.consignor,
      consignee: formData.consignee,
      articles: parseInt(String(formData.packageCount || 1), 10),
      packageCount: parseInt(String(formData.packageCount || 1), 10),
      weight: formData.chargedWeight ? `${formData.chargedWeight}T` : "2.5T",
      actualWeight: parseFloat(String(formData.actualWeight || 2.5)),
      chargedWeight: parseFloat(String(formData.chargedWeight || 2.5)),
      freight,
      advance,
      balance,
      hamali,
      invoice: formData.invoice || "",
      invoiceValue: parseFloat(String(formData.invoiceValue || 0)),
      waybill: formData.waybill || "",
      ewayBill: formData.ewayBill || "",
      gst: formData.gst || "",
      freightType: formData.freightType || "To Pay",
      paymentType: formData.paymentType || "Credit",
      expectedDelivery: formData.expectedDelivery || "",
      status: "pending",
      remarks: formData.remarks || ""
    }

    return await lrRepository.create(newLR)
  },

  updateLR: async (id: string, updates: Partial<LRRecord>): Promise<LRRecord | null> => {
    const existing = await lrRepository.findById(id)
    if (!existing) return null
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
    return await lrRepository.save(updated)
  },

  deleteLR: async (id: string): Promise<boolean> => {
    return await lrRepository.softDelete(id)
  }
}
