import { billingRepository, paymentRepository, lrRepository } from "../repositories/repositories"
import { DBBill, DBPayment } from "../db/schema"
import { companyContext } from "../services/companyContext"
import { apiClient } from "../services/apiClient"

export const billingController = {
  fetchBills: async (params?: { partyName?: string; status?: string; search?: string }, companyId: string = companyContext.getActiveCompanyId()): Promise<DBBill[]> => {
    let list = await billingRepository.findAll(companyId)
    if (params) {
      if (params.partyName && params.partyName !== "all") {
        list = list.filter(b => b.party.toLowerCase() === params.partyName!.toLowerCase())
      }
      if (params.status && params.status !== "all") {
        list = list.filter(b => b.status === params.status)
      }
      if (params.search) {
        const q = params.search.toLowerCase()
        list = list.filter(b => b.billNo.toLowerCase().includes(q) || b.party.toLowerCase().includes(q))
      }
    }
    return list
  },

  getNextBillNumber: async (companyId: string = companyContext.getActiveCompanyId()): Promise<string> => {
    try {
      const list = await billingRepository.findAll(companyId)
      if (!list || list.length === 0) return "BILL-1001"
      const numbers = list
        .map(b => {
          const str = b?.billNo || (b as any)?.billNumber || ""
          const match = str.match(/(?:BILL-)(\d+)/i) || str.match(/\d+/)
          if (match) {
            const num = parseInt(match[1] || match[0], 10)
            return (num > 0 && num < 1000000) ? num : 0
          }
          return 0
        })
        .filter(n => n > 0)
      const maxNo = numbers.length > 0 ? Math.max(...numbers) : 1000
      return `BILL-${maxNo + 1}`
    } catch {
      return "BILL-1001"
    }
  },

  generateBill: async (billData: Omit<DBBill, "id" | "company_id" | "createdAt" | "updatedAt">, companyId: string = companyContext.getActiveCompanyId()): Promise<DBBill> => {
    // Prevent duplicate bill creation if same billNo exists
    if (billData.billNo) {
      const existingBills = await billingRepository.findAll(companyId).catch(() => [])
      const duplicate = existingBills.find(b => (b.billNo || "").toLowerCase() === (billData.billNo || "").toLowerCase())
      if (duplicate) {
        return duplicate
      }
    }

    // Generate Bill record
    const createdBill = await billingRepository.create(companyId, billData)

    // Mark associated LRs as billed in DB if required
    if (billData.lrs && billData.lrs.length > 0) {
      const companyLrs = await lrRepository.findAll(companyId).catch(() => [])
      for (const lrNum of billData.lrs) {
        if (!lrNum) continue
        const targetLr = companyLrs.find(r => r.lr === lrNum || r.lrNo === lrNum || (r as any).lr_number === lrNum || r.id === lrNum)
        if (targetLr) {
          const lrNoVal = targetLr.lrNo || targetLr.lr || (targetLr as any).lr_number || targetLr.id
          await lrRepository.save(companyId, {
            ...targetLr,
            lrNo: lrNoVal,
            lr: lrNoVal,
            billed: true,
            billNo: createdBill.billNo || (createdBill as any).id,
            updatedAt: new Date().toISOString()
          }).catch(() => null)
        }
      }
    }

    return createdBill
  },

  recordPayment: async (
    paymentData: any,
    companyId: string = companyContext.getActiveCompanyId()
  ): Promise<{ payment: DBPayment; updatedBill: DBBill }> => {
    const res = await apiClient.post("/billing/receive-payment", {
      ...paymentData,
      company_id: companyId
    })
    if (res && res.success && res.payment && res.updatedBill) {
      return { payment: res.payment, updatedBill: res.updatedBill }
    }
    throw new Error(res?.error || "Failed to record transactional payment")
  },

  fetchAllPayments: async (companyId: string = companyContext.getActiveCompanyId()): Promise<DBPayment[]> => {
    return await paymentRepository.findAll(companyId)
  },

  getPaymentsForBill: async (
    billNo: string,
    companyId: string = companyContext.getActiveCompanyId()
  ): Promise<DBPayment[]> => {
    const all = await paymentRepository.findAll(companyId)
    return all.filter(p => p.billNo === billNo || (p as any).bill_id === billNo)
  },

  cancelInvoice: async (billNo: string, companyId: string = companyContext.getActiveCompanyId()): Promise<void> => {
    await billingRepository.softDelete(companyId, billNo)
  },

  updateBill: async (bill: DBBill, companyId: string = companyContext.getActiveCompanyId()): Promise<DBBill> => {
    return await billingRepository.save(companyId, bill)
  },

  exportCSV: async (params?: { partyName?: string; status?: string; search?: string }, companyId: string = companyContext.getActiveCompanyId()): Promise<string> => {
    const list = await billingController.fetchBills(params, companyId)
    const headers = "Bill No,Bill Date,Party,Amount,Paid,Outstanding,DueDate,Status\n"
    const rows = list.map(b => `${b.billNo},${b.billDate},"${b.party}",${b.amount},${b.paid},${b.outstanding},"${b.dueDate}",${b.status}`).join("\n")
    return headers + rows
  }
}
