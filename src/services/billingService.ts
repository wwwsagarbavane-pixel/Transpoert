import { billingRepository, lrRepository } from "../repositories/repositories"
import { DBBill } from "../db/schema"
import { billingController } from "../controllers/billingController"

export type BillRecord = DBBill

export const billingService = {
  getBills: async (params?: { partyId?: string; partyName?: string; status?: string; search?: string }): Promise<BillRecord[]> => {
    let result = await billingRepository.findAll()

    if (params?.partyId && params.partyId !== "all") {
      result = result.filter(b => b.partyId === params.partyId || b.party === params.partyId)
    } else if (params?.partyName && params.partyName !== "all") {
      result = result.filter(b => b.party.toLowerCase() === params.partyName?.toLowerCase())
    }

    if (params?.status && params.status !== "all") {
      if (params.status === "pending" || params.status === "partial") {
        result = result.filter(b => b.status === params.status)
      }
    }

    if (params?.search && params.search.trim() !== "") {
      const q = params.search.toLowerCase().trim()
      result = result.filter(b => 
        b.billNo.toLowerCase().includes(q) || 
        b.party.toLowerCase().includes(q)
      )
    }

    return result
  },

  createBill: async (newBill: Partial<BillRecord>): Promise<BillRecord> => {
    const amt = newBill.amount || newBill.totalAmount || 0
    if (!newBill.party) throw new Error("Party is required to generate bill")
    if (amt <= 0) throw new Error("Invoice amount must be greater than zero")

    const nextNo = newBill.billNo || await billingController.getNextBillNumber()
    const paidVal = newBill.paidAmount || newBill.paid || 0
    return await billingRepository.create({
      billNo: nextNo,
      billDate: newBill.billDate || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      party: newBill.party,
      partyId: newBill.partyId || newBill.party.toLowerCase().replace(/\s+/g, "_"),
      amount: amt,
      totalAmount: amt,
      subtotal: amt,
      tax: 0,
      lrsCount: (newBill.lrs || []).length,
      paid: paidVal,
      paidAmount: paidVal,
      outstanding: newBill.outstanding ?? (amt - paidVal),
      dueDate: newBill.dueDate || "15 Days",
      status: "pending",
      lrs: newBill.lrs || []
    })
  },

  recordCollection: async (billNo: string, amount: number): Promise<BillRecord | null> => {
    const bills = await billingRepository.findAll()
    const bill = bills.find(b => b.billNo === billNo || b.id === billNo)
    if (!bill) return null

    const currentPaid = bill.paidAmount ?? bill.paid ?? 0
    const billTotal = bill.totalAmount ?? bill.amount ?? 0
    const updatedPaid = currentPaid + amount
    const updatedOutstanding = Math.max(0, billTotal - updatedPaid)

    bill.paid = updatedPaid
    bill.paidAmount = updatedPaid
    bill.outstanding = updatedOutstanding
    bill.status = updatedOutstanding === 0 ? "Paid" : "Partially Paid"
    bill.updatedAt = new Date().toISOString()

    return await billingRepository.save(bill)
  },

  cancelBill: async (billNo: string): Promise<boolean> => {
    const bills = await billingRepository.findAll()
    const bill = bills.find(b => b.billNo === billNo || b.id === billNo)
    if (!bill) return false
    return await billingRepository.softDelete(bill.id)
  },

  exportBills: async (params?: { partyId?: string; status?: string; search?: string }): Promise<string> => {
    const filtered = await billingService.getBills(params)
    const headers = ["Bill No", "Bill Date", "Party", "Bill Amount", "Paid", "Outstanding", "Due Date", "Status"]
    const csvRows = [headers.join(",")]
    filtered.forEach(b => {
      csvRows.push([b.billNo, b.billDate, `"${b.party}"`, b.amount, b.paid, b.outstanding, b.dueDate, b.status].join(","))
    })
    return csvRows.join("\n")
  }
}
