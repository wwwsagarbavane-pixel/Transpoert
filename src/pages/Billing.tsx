import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, FileText, Plus, Eye, Edit2, Printer, FileDown, Ban, AlertTriangle, CheckCircle2, DollarSign, History, X, Wallet, UserCheck, Layers, ArrowRight } from "lucide-react"
import { billingController } from "../controllers/billingController"
import { partyController } from "../controllers/partyController"
import { lrController } from "../controllers/lrController"
import { companyRepository } from "../repositories/repositories"
import { DBBill, DBParty, DBLR, DBPayment, DBCompany } from "../db/schema"
import { companyContext } from "../services/companyContext"
import LRPrintModal from "../components/LRPrintModal"
import ReceiptPrintModal from "../components/ReceiptPrintModal"
import OutstandingPartyPrintModal from "../components/OutstandingPartyPrintModal"
import SearchDropdown from "../components/SearchDropdown"

const inputCls = "h-10 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 focus:bg-white transition-all font-normal"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}{required && <span className="text-indigo-500"> *</span>}</label>
      {children}
    </div>
  )
}

export default function Billing() {
  const [activeTab, setActiveTab] = useState<"bills" | "payments" | "outstanding">("bills")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Main Billing List Party Filter
  const [mainPartyFilter, setMainPartyFilter] = useState("all")

  // Master Lists for Selection (Scoped strictly to Active Company)
  const [activeCompanyParties, setActiveCompanyParties] = useState<DBParty[]>([])
  const [selectedConsignorParty, setSelectedConsignorParty] = useState<DBParty | null>(null)

  // Live Database Records for Active Company Context
  const [billsRegister, setBillsRegister] = useState<DBBill[]>([])
  const [allLrs, setAllLrs] = useState<DBLR[]>([])
  const [allPayments, setAllPayments] = useState<DBPayment[]>([])

  // Modal Flow for Generating Invoice
  const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false)
  const [selectedLrs, setSelectedLrs] = useState<string[]>([])
  const [newBillNo, setNewBillNo] = useState("BILL-1005")
  const [isGeneratingBill, setIsGeneratingBill] = useState(false)

  // Direct Bill Creation State
  const [showDirectBillModal, setShowDirectBillModal] = useState(false)
  const [directParty, setDirectParty] = useState("")
  const [directAmount, setDirectAmount] = useState("")
  const [directDueDate, setDirectDueDate] = useState("30 Days")
  const [directRemarks, setDirectRemarks] = useState("")

  // Bill detail / edit / print / cancel
  const [viewBill, setViewBill] = useState<DBBill | null>(null)
  const [cancelBillTarget, setCancelBillTarget] = useState<string | null>(null)
  const [editBillTarget, setEditBillTarget] = useState<DBBill | null>(null)
  const [editParty, setEditParty] = useState("")
  const [editAmount, setEditAmount] = useState("")
  const [editDueDate, setEditDueDate] = useState("30 Days")
  const [editStatus, setEditStatus] = useState("pending")

  // Payment Entry & History Modals
  const [paymentModalTarget, setPaymentModalTarget] = useState<DBBill | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Bank" | "Cheque" | "NEFT" | "UPI">("Cash")
  const [paymentRefNo, setPaymentRefNo] = useState("")
  const [paymentRemarks, setPaymentRemarks] = useState("")
  const [paymentSaving, setPaymentSaving] = useState(false)

  const [historyModalTarget, setHistoryModalTarget] = useState<DBBill | null>(null)
  const [billPayments, setBillPayments] = useState<DBPayment[]>([])

  // Outstanding Party section state
  const [outstandingStatusFilter, setOutstandingStatusFilter] = useState("all")
  const [outstandingSearch, setOutstandingSearch] = useState("")
  const [drilldownParty, setDrilldownParty] = useState<DBParty | null>(null)
  const [printPartyTarget, setPrintPartyTarget] = useState<DBParty | null>(null)
  const [receiptTarget, setReceiptTarget] = useState<DBPayment | null>(null)

  const activeCompanyId = companyContext.getActiveCompanyId()

  // Initial Master Loading & Active Company Data Fetching
  useEffect(() => {
    const initData = async () => {
      try {
        const compId = companyContext.getActiveCompanyId()
        const parties = await partyController.getParties(true, compId).catch(() => [])
        setActiveCompanyParties(parties)
        await loadCompanyBillingData(compId, mainPartyFilter)
      } catch (err) {
        console.error("Failed to load initial billing records:", err)
      }
    }
    initData()
  }, [])

  const loadCompanyBillingData = async (compId: string, partyFilterVal?: string) => {
    try {
      const partyNameArg = (partyFilterVal && partyFilterVal !== "all" && partyFilterVal !== "none")
        ? (activeCompanyParties.find(p => p.id === partyFilterVal || p.name === partyFilterVal)?.name || partyFilterVal)
        : undefined

      const [billsData, nextNo, lrsData, paymentsData] = await Promise.all([
        billingController.fetchBills({
          partyName: partyNameArg,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search
        }, compId),
        billingController.getNextBillNumber(compId),
        lrController.fetchLRs(partyNameArg ? { consignor: partyNameArg } : undefined, compId),
        billingController.fetchAllPayments(compId)
      ])

      setBillsRegister(billsData)
      setNewBillNo(nextNo)
      setAllLrs(lrsData)
      setAllPayments(paymentsData)
    } catch (err) {
      console.error("Error loading company billing records:", err)
    }
  }

  useEffect(() => {
    const compId = companyContext.getActiveCompanyId()
    loadCompanyBillingData(compId, mainPartyFilter)
  }, [mainPartyFilter, statusFilter, search])

  // Payment History loading when target changes
  useEffect(() => {
    if (historyModalTarget) {
      const compId = companyContext.getActiveCompanyId()
      billingController.getPaymentsForBill(historyModalTarget.billNo, compId).then(setBillPayments)
    }
  }, [historyModalTarget])

  // Party Selection Handler in Generate Invoice Popup
  const handleSelectConsignorPartyInModal = (partyIdOrName: string) => {
    if (!partyIdOrName || partyIdOrName === "none" || partyIdOrName === "all") {
      setSelectedConsignorParty(null)
      setSelectedLrs([])
      return
    }
    const foundParty = activeCompanyParties.find(p => p.id === partyIdOrName || p.name === partyIdOrName)
    setSelectedConsignorParty(foundParty || null)
    setSelectedLrs([])
  }

  // Outstanding Party List Computation for Active Company
  const partyOutstandingList = activeCompanyParties.map(p => {
    const partyBills = billsRegister.filter(b => b.party === p.name || b.partyId === p.id)
    const partyLrs = allLrs.filter(r => r.consignor === p.name || r.consignee === p.name)
    const partyPayments = allPayments.filter(pay => (pay.partyName === p.name || pay.party === p.name))

    const totalBilling = partyBills.length > 0
      ? partyBills.reduce((sum, b) => sum + (b.totalAmount ?? b.amount ?? 0), 0)
      : partyLrs.reduce((sum, r) => sum + (r.freight || 0), 0)

    const totalPaid = partyBills.reduce((sum, b) => sum + (b.paidAmount ?? b.paid ?? 0), 0)
    const outstanding = Math.max(0, totalBilling - totalPaid)

    const sortedPayDates = partyPayments.map(pay => pay.paymentDate || pay.date || pay.createdAt).filter(Boolean).sort()
    const lastPaymentDate = sortedPayDates.length > 0 ? sortedPayDates[sortedPayDates.length - 1] : "—"

    let status: "OUTSTANDING" | "PARTIAL" | "PAID" = "PAID"
    if (outstanding > 0) {
      status = totalPaid > 0 ? "PARTIAL" : "OUTSTANDING"
    }

    return {
      party: p,
      partyName: p.name,
      partyCode: p.id || p.gst || "P-1001",
      totalBilling,
      totalPaid,
      outstanding,
      lastPaymentDate,
      status,
      partyBills,
      partyPayments
    }
  }).filter(item => {
    if (outstandingStatusFilter !== "all" && item.status !== outstandingStatusFilter) return false
    if (outstandingSearch) {
      const q = outstandingSearch.toLowerCase()
      if (!item.partyName.toLowerCase().includes(q) && !item.partyCode.toLowerCase().includes(q)) return false
    }
    return true
  })

  // LRs eligible for billing in popup (Filtered strictly by selected party & active company)
  const pendingBillingLrs = selectedConsignorParty ? allLrs.filter(r => {
    const isAlreadyBilledInLr = (r as any).billed === true || !!(r as any).billNo
    const isAlreadyBilledInBill = billsRegister.some(b => b.lrs && (Array.isArray(b.lrs) ? b.lrs.includes(r.lr) : String(b.lrs).includes(r.lr)))
    const matchesParty = r.consignor === selectedConsignorParty.name || r.consignee === selectedConsignorParty.name
    return !isAlreadyBilledInLr && !isAlreadyBilledInBill && r.status !== "cancelled" && matchesParty
  }) : []

  // Multi-LR Compatibility Validation Engine
  const selectedLrObjects = allLrs.filter(r => selectedLrs.includes(r.lr))
  const firstLr = selectedLrObjects[0]

  const isSameParty = selectedLrObjects.every(r => r.consignor === firstLr?.consignor)
  const isSameConsignee = selectedLrObjects.every(r => r.consignee === firstLr?.consignee)
  const isSameFreightType = selectedLrObjects.every(r => r.freightType === firstLr?.freightType)

  const isBillingCompatible = selectedLrObjects.length > 0 && isSameParty && isSameConsignee && isSameFreightType
  let billingValidationError = ""
  if (selectedLrObjects.length > 1) {
    if (!isSameParty) billingValidationError = "Selected LRs have different Consignors."
    else if (!isSameConsignee) billingValidationError = "Selected LRs have different Consignees."
    else if (!isSameFreightType) billingValidationError = "Selected LRs have different Freight Types."
  }

  const handleToggleLrSelection = (lrNum: string) => {
    if (selectedLrs.includes(lrNum)) {
      setSelectedLrs(selectedLrs.filter(id => id !== lrNum))
    } else {
      setSelectedLrs([...selectedLrs, lrNum])
    }
  }

  const handleCreateBill = async () => {
    if (!isBillingCompatible || isGeneratingBill || !selectedConsignorParty) return
    setIsGeneratingBill(true)
    try {
      const items = selectedLrObjects
      const totalAmt = items.reduce((sum, item) => sum + (item.freight || 0) + (item.hamali || 0), 0)
      const partyName = selectedConsignorParty.name
      const compId = activeCompanyId
      const billNumberToUse = newBillNo || await billingController.getNextBillNumber(compId)

      await billingController.generateBill({
        billNo: billNumberToUse,
        billDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        party: partyName,
        partyName: partyName,
        partyId: selectedConsignorParty.id || partyName.toLowerCase().replace(/\s+/g, "_"),
        amount: totalAmt,
        totalAmount: totalAmt,
        subtotal: totalAmt,
        tax: 0,
        lrsCount: selectedLrs.length,
        paid: 0,
        paidAmount: 0,
        outstanding: totalAmt,
        dueDate: "30 Days",
        status: "pending",
        lrs: selectedLrs,
      }, compId)

      setSelectedLrs([])
      setShowGenerateInvoiceModal(false)
      setSelectedConsignorParty(null)
      await loadCompanyBillingData(compId, mainPartyFilter)
      setActiveTab("bills")
    } finally {
      setIsGeneratingBill(false)
    }
  }

  const handleDirectCreateBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!directParty.trim() || isGeneratingBill) return
    const amt = parseFloat(directAmount) || 0
    if (amt <= 0) return

    setIsGeneratingBill(true)
    try {
      const compId = activeCompanyId
      const billNumberToUse = newBillNo || await billingController.getNextBillNumber(compId)

      await billingController.generateBill({
        billNo: billNumberToUse,
        billDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        party: directParty,
        partyName: directParty,
        partyId: directParty.toLowerCase().replace(/\s+/g, "_"),
        amount: amt,
        totalAmount: amt,
        subtotal: amt,
        tax: 0,
        lrsCount: 1,
        paid: 0,
        paidAmount: 0,
        outstanding: amt,
        dueDate: directDueDate || "30 Days",
        status: "pending",
        lrs: [],
        remarks: directRemarks
      }, compId)

      setShowDirectBillModal(false)
      setDirectParty("")
      setDirectAmount("")
      setDirectRemarks("")
      await loadCompanyBillingData(compId, mainPartyFilter)
      setActiveTab("bills")
    } finally {
      setIsGeneratingBill(false)
    }
  }

  const handleCancelBill = async () => {
    if (!cancelBillTarget) return
    const compId = activeCompanyId
    await billingController.cancelInvoice(cancelBillTarget, compId)
    await loadCompanyBillingData(compId, mainPartyFilter)
    setCancelBillTarget(null)
  }

  const openEditModal = (b: DBBill) => {
    setEditBillTarget(b)
    setEditParty(b.party)
    setEditAmount((b.totalAmount ?? b.amount ?? 0).toString())
    setEditDueDate(b.dueDate || "30 Days")
    setEditStatus(b.status || "pending")
  }

  const handleSaveEditBill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editBillTarget) return
    const compId = activeCompanyId
    const amt = parseFloat(editAmount) || editBillTarget.totalAmount || 0
    const currentPaid = editBillTarget.paidAmount || editBillTarget.paid || 0
    const newOutstanding = Math.max(0, amt - currentPaid)
    let newStatus = editStatus
    if (newOutstanding <= 0) newStatus = "paid"
    else if (currentPaid > 0) newStatus = "partial"

    const updated: DBBill = {
      ...editBillTarget,
      company_id: compId,
      party: editParty,
      partyName: editParty,
      amount: amt,
      totalAmount: amt,
      subtotal: amt,
      paidAmount: currentPaid,
      paid: currentPaid,
      outstanding: newOutstanding,
      dueDate: editDueDate,
      status: newStatus,
      updatedAt: new Date().toISOString()
    }

    await billingController.updateBill(updated, compId)
    await loadCompanyBillingData(compId, mainPartyFilter)
    setEditBillTarget(null)
  }

  const handleRecordPaymentSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!paymentModalTarget) return
    const compId = activeCompanyId
    const amt = parseFloat(paymentAmount) || paymentModalTarget.outstanding || paymentModalTarget.amount || 0
    if (isNaN(amt) || amt <= 0) return

    setPaymentSaving(true)
    try {
      const newPay: DBPayment = {
        id: `PAY-${Date.now()}`,
        paymentNo: `PAY-${Date.now()}`,
        receiptNo: `PAY-${Date.now()}`,
        billNo: paymentModalTarget.billNo,
        bill_id: paymentModalTarget.id,
        party: paymentModalTarget.party,
        amount: amt,
        date: new Date().toISOString().split("T")[0],
        mode: paymentMode,
        referenceNo: paymentRefNo,
        status: "Completed",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await billingController.recordPayment({
        paymentNo: newPay.paymentNo,
        billNo: paymentModalTarget.billNo,
        billId: paymentModalTarget.id,
        partyName: paymentModalTarget.party,
        amount: amt,
        paymentDate: newPay.date,
        paymentMode: paymentMode,
        referenceNo: paymentRefNo,
        remarks: paymentRemarks
      }, compId)

      await loadCompanyBillingData(compId, mainPartyFilter)
      setPaymentModalTarget(null)
      setPaymentAmount("")
      setPaymentRefNo("")
      setPaymentRemarks("")
      setReceiptTarget(newPay)
    } catch (err) {
      console.error("Failed to record payment:", err)
    } finally {
      setPaymentSaving(false)
    }
  }

  // Helper to format linked LRs for generated bill row display
  const renderBillLrNumber = (b: DBBill) => {
    if (!b.lrs) return "—"
    if (Array.isArray(b.lrs)) {
      if (b.lrs.length === 0) return "—"
      if (b.lrs.length === 1) return b.lrs[0]
      return `${b.lrs[0]} (+${b.lrs.length - 1})`
    }
    return String(b.lrs)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1280px] mx-auto px-6 py-6 space-y-6 pb-20 md:pb-6">

        {/* 1. CLEAN STANDARD PAGE HEADER & CTA BUTTON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Freight Billing & Invoicing</h1>
            <p className="text-xs text-gray-500 font-normal mt-0.5">
              Active Tenant: <strong className="text-indigo-600 font-bold">{activeCompanyId}</strong> • Financial Ledger Overview
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl gap-1 border border-gray-200/60 shrink-0">
              <button
                onClick={() => setActiveTab("bills")}
                className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "bills"
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                Bills / Invoices ({billsRegister.length})
              </button>

              <button
                onClick={() => setActiveTab("payments")}
                className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "payments"
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                Payments ({allPayments.length})
              </button>

              <button
                onClick={() => setActiveTab("outstanding")}
                className={`h-8 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "outstanding"
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                Outstanding ({partyOutstandingList.length})
              </button>
            </div>

            {/* MAIN CTA BUTTON: GENERATE INVOICE */}
            <button
              onClick={() => {
                setSelectedConsignorParty(null)
                setSelectedLrs([])
                setShowGenerateInvoiceModal(true)
              }}
              className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Generate Invoice</span>
            </button>
          </div>
        </div>

        {/* 2. OVERALL BILLING OVERVIEW (SUMMARY METRICS CARD) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-600" />
              <span>BILLING OVERVIEW</span>
            </h3>
            <span className="text-xs text-gray-400 font-normal">Active Company Metrics</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 space-y-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Bills</span>
              <div className="text-lg font-bold text-gray-900 font-mono">{billsRegister.length}</div>
            </div>

            <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 space-y-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Amount</span>
              <div className="text-lg font-bold text-gray-900 font-mono">₹{billsRegister.reduce((s, b) => s + (b.totalAmount ?? b.amount ?? 0), 0).toLocaleString("en-IN")}</div>
            </div>

            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/70 space-y-0.5">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Paid</span>
              <div className="text-lg font-bold text-emerald-700 font-mono">₹{billsRegister.reduce((s, b) => s + (b.paidAmount ?? b.paid ?? 0), 0).toLocaleString("en-IN")}</div>
            </div>

            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/70 space-y-0.5">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Partial</span>
              <div className="text-lg font-bold text-amber-700 font-mono">{billsRegister.filter(b => b.status === "partial").length} Bills</div>
            </div>

            <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-100/70 space-y-0.5">
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">Pending</span>
              <div className="text-lg font-bold text-sky-700 font-mono">{billsRegister.filter(b => b.status === "pending").length} Bills</div>
            </div>

            <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100/70 space-y-0.5">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Outstanding</span>
              <div className="text-lg font-bold text-rose-700 font-mono">₹{billsRegister.reduce((s, b) => s + (b.outstanding || 0), 0).toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>

        {/* 3. MAIN BILLS REGISTER & LEDGER TAB CONTENTS */}
        <div className="space-y-4">
          {activeTab === "bills" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-gray-900 uppercase">Generated Freight Invoices ({billsRegister.length})</span>

                {/* PARTY FILTER ON MAIN BILLING LIST */}
                <div className="flex items-center gap-2.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">Filter Party:</label>
                  <div className="w-56">
                    <SearchDropdown
                      value={mainPartyFilter}
                      onChange={val => setMainPartyFilter(val)}
                      options={[
                        { value: "all", label: "All Parties" },
                        ...activeCompanyParties.map(p => ({ value: p.id, label: p.name }))
                      ]}
                      placeholder="All Parties"
                    />
                  </div>
                  <button
                    onClick={() => setShowDirectBillModal(true)}
                    className="h-9 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus size={13} /> Direct Invoice
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-[11px] font-semibold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4 align-middle">BILL NO</th>
                      <th className="py-3 px-4 align-middle">LR NO</th>
                      <th className="py-3 px-4 align-middle">DATE</th>
                      <th className="py-3 px-4 align-middle">PARTY NAME</th>
                      <th className="py-3 px-4 align-middle">BILL AMOUNT</th>
                      <th className="py-3 px-4 align-middle">STATUS</th>
                      <th className="py-3 px-4 align-middle text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                    {billsRegister.map(b => (
                      <tr key={b.id || b.billNo} className="hover:bg-gray-50/60 transition-colors h-12">
                        <td className="py-2.5 px-4 align-middle font-mono font-bold text-indigo-600 text-xs">{b.billNo}</td>
                        <td className="py-2.5 px-4 align-middle font-mono text-xs text-gray-600">{renderBillLrNumber(b)}</td>
                        <td className="py-2.5 px-4 align-middle text-xs text-gray-500">{b.billDate}</td>
                        <td className="py-2.5 px-4 align-middle font-semibold text-gray-900 text-xs">{b.party}</td>
                        <td className="py-2.5 px-4 align-middle font-bold text-gray-900 text-xs">₹{(b.totalAmount ?? b.amount ?? 0).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 align-middle">
                          <span className={`h-5 px-2 text-[10px] font-semibold leading-none rounded-full inline-flex items-center gap-1 border uppercase ${
                            b.status === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            b.status === "partial" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewBill(b)}
                              className="h-7 px-2 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 flex items-center gap-1 cursor-pointer"
                              title="View Invoice Details"
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              onClick={() => openEditModal(b)}
                              className="h-7 px-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 cursor-pointer"
                              title="Edit Invoice"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            {b.outstanding > 0 && (
                              <button
                                onClick={() => {
                                  setPaymentModalTarget(b)
                                  setPaymentAmount(b.outstanding.toString())
                                }}
                                className="h-7 px-2 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                                title="Receive Payment"
                              >
                                <DollarSign size={12} /> Receive
                              </button>
                            )}
                            <button
                              onClick={() => setHistoryModalTarget(b)}
                              className="h-7 px-2 rounded-lg text-xs text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 flex items-center gap-1 cursor-pointer"
                              title="Payment History"
                            >
                              <History size={12} />
                            </button>
                            <button
                              onClick={() => setCancelBillTarget(b.billNo)}
                              className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Cancel Bill"
                            >
                              <Ban size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {billsRegister.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-xs text-gray-400">
                          No freight invoices generated yet for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-[11px] font-semibold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4 align-middle">RECEIPT / PAY NO</th>
                      <th className="py-3 px-4 align-middle">DATE</th>
                      <th className="py-3 px-4 align-middle">BILL NO</th>
                      <th className="py-3 px-4 align-middle">PARTY NAME</th>
                      <th className="py-3 px-4 align-middle">AMOUNT</th>
                      <th className="py-3 px-4 align-middle">MODE</th>
                      <th className="py-3 px-4 align-middle text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                    {allPayments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors h-12">
                        <td className="py-2.5 px-4 align-middle font-mono font-bold text-indigo-600 text-xs">{p.receiptNo || p.paymentNo || p.id}</td>
                        <td className="py-2.5 px-4 align-middle text-xs text-gray-500">{p.date || p.paymentDate}</td>
                        <td className="py-2.5 px-4 align-middle font-mono font-semibold text-gray-800 text-xs">{p.billNo}</td>
                        <td className="py-2.5 px-4 align-middle font-semibold text-gray-900 text-xs">{p.party || p.partyName}</td>
                        <td className="py-2.5 px-4 align-middle font-bold text-emerald-600 text-xs">₹{(p.amount || 0).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 align-middle">
                          <span className="h-5 px-2 text-[10px] font-semibold rounded bg-gray-100 text-gray-700 inline-flex items-center">
                            {p.mode || p.paymentMode || "Cash"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 align-middle text-right">
                          <button
                            onClick={() => setReceiptTarget(p)}
                            className="h-7 px-2.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Printer size={12} /> Print Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                    {allPayments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-xs text-gray-400">
                          No payment records found for this company.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "outstanding" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-[11px] font-semibold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4 align-middle">PARTY NAME</th>
                      <th className="py-3 px-4 align-middle">PARTY CODE</th>
                      <th className="py-3 px-4 align-middle">TOTAL BILLING</th>
                      <th className="py-3 px-4 align-middle">TOTAL PAID</th>
                      <th className="py-3 px-4 align-middle">OUTSTANDING</th>
                      <th className="py-3 px-4 align-middle text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                    {partyOutstandingList.map(item => (
                      <tr key={item.party.id} className="hover:bg-gray-50/60 transition-colors h-12">
                        <td className="py-2.5 px-4 align-middle font-semibold text-gray-900 text-xs">{item.partyName}</td>
                        <td className="py-2.5 px-4 align-middle font-mono text-xs text-gray-500">{item.partyCode}</td>
                        <td className="py-2.5 px-4 align-middle font-semibold text-gray-900 text-xs">₹{item.totalBilling.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 align-middle font-semibold text-emerald-700 text-xs">₹{item.totalPaid.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 align-middle font-bold text-rose-600 text-xs">₹{item.outstanding.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-4 align-middle text-right">
                          <button
                            onClick={() => setDrilldownParty(item.party)}
                            className="h-7 px-2.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-100 cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <Eye size={12} /> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {partyOutstandingList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-xs text-gray-400">
                          No party outstanding records for this company.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* GENERATE FREIGHT INVOICE POPUP (SPACIOUS 800-900px MODAL) */}
      <AnimatePresence>
        {showGenerateInvoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-4xl p-6 space-y-5 max-h-[85vh] flex flex-col overflow-hidden">
              
              {/* POPUP HEADER */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Generate Freight Invoice</h3>
                  <p className="text-xs text-gray-500 font-normal mt-0.5">Select a Party & choose unbilled LRs to generate invoice</p>
                </div>
                <button
                  onClick={() => {
                    setShowGenerateInvoiceModal(false)
                    setSelectedConsignorParty(null)
                    setSelectedLrs([])
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* STEP 1: SELECT PARTY (FILTERED STRICTLY TO ACTIVE COMPANY) */}
                <Field label="SELECT PARTY" required>
                  <SearchDropdown
                    value={selectedConsignorParty?.id || ""}
                    onChange={val => handleSelectConsignorPartyInModal(val)}
                    options={[
                      { value: "none", label: "Select Party ▼" },
                      ...activeCompanyParties.map(p => ({ value: p.id, label: p.name }))
                    ]}
                    placeholder="Select Party ▼"
                  />
                </Field>

                {/* STEP 2: UNBILLED LRs LIST AFTER PARTY IS SELECTED */}
                {!selectedConsignorParty ? (
                  <div className="py-14 px-6 text-center space-y-2 rounded-xl bg-gray-50 border border-dashed border-gray-200">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                      <Wallet size={22} />
                    </div>
                    <h4 className="text-xs font-bold text-gray-900">Select a party to view unbilled LRs.</h4>
                    <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                      Choose a party from the dropdown above to load its unbilled lorry receipts.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* UNBILLED LRs HEADER ROW */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <span>UNBILLED LRs</span>
                        <span className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                          ({pendingBillingLrs.length})
                        </span>
                      </h4>
                      <span className="text-xs text-gray-600 font-semibold">
                        Selected: <strong className="text-indigo-600 font-bold">{selectedLrs.length} LRs</strong>
                      </span>
                    </div>

                    {billingValidationError && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900 flex items-center gap-2">
                        <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                        <span>{billingValidationError}</span>
                      </div>
                    )}

                    {/* UNBILLED LR TABLE VIEW (SHOWS LR NO ONLY) */}
                    <div className="rounded-xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-100 sticky top-0 bg-white">
                          <tr>
                            <th className="py-2.5 px-3.5 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={pendingBillingLrs.length > 0 && selectedLrs.length === pendingBillingLrs.length}
                                onChange={e => {
                                  if (e.target.checked) setSelectedLrs(pendingBillingLrs.map(r => r.lr))
                                  else setSelectedLrs([])
                                }}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </th>
                            <th className="py-2.5 px-3.5 align-middle">LR NO</th>
                            <th className="py-2.5 px-3.5 align-middle">DATE</th>
                            <th className="py-2.5 px-3.5 align-middle">ROUTE</th>
                            <th className="py-2.5 px-3.5 align-middle">FREIGHT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                          {pendingBillingLrs.map(r => {
                            const isSel = selectedLrs.includes(r.lr)
                            return (
                              <tr key={r.lr} className={`hover:bg-gray-50 transition-colors ${isSel ? "bg-indigo-50/40" : ""}`}>
                                <td className="py-2.5 px-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSel}
                                    onChange={() => handleToggleLrSelection(r.lr)}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>
                                <td className="py-2.5 px-3.5 align-middle font-mono font-bold text-indigo-600">{r.lr}</td>
                                <td className="py-2.5 px-3.5 align-middle text-gray-500">{r.date}</td>
                                <td className="py-2.5 px-3.5 align-middle font-medium text-gray-800">{r.from} → {r.to}</td>
                                <td className="py-2.5 px-3.5 align-middle font-bold text-gray-900">₹{((r.freight || 0) + (r.hamali || 0)).toLocaleString("en-IN")}</td>
                              </tr>
                            )
                          })}
                          {pendingBillingLrs.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-10 text-center text-xs text-gray-400">
                                No unbilled LRs available for {selectedConsignorParty.name}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {selectedLrObjects.length > 0 && (
                      <div className="p-3.5 bg-gray-50 rounded-xl space-y-1 text-xs border border-gray-100">
                        <div className="flex justify-between"><span className="text-gray-400 font-medium">Customer Party:</span><span className="font-bold text-gray-900">{selectedConsignorParty.name}</span></div>
                        <div className="flex justify-between border-t border-gray-200 pt-1.5"><span className="font-bold text-gray-900">Calculated Bill Freight:</span><span className="font-bold text-indigo-600 font-mono text-sm">₹{selectedLrObjects.reduce((s, i) => s + (i.freight || 0) + (i.hamali || 0), 0).toLocaleString("en-IN")}</span></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* POPUP ACTION BUTTONS */}
              <div className="flex gap-3 pt-3 border-t border-gray-100 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerateInvoiceModal(false)
                    setSelectedConsignorParty(null)
                    setSelectedLrs([])
                  }}
                  className="flex-1 h-10 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateBill}
                  disabled={!isBillingCompatible || selectedLrs.length === 0 || isGeneratingBill}
                  className="flex-1 h-10 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  {isGeneratingBill ? "Generating..." : "Confirm & Generate Bill"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECORD PAYMENT MODAL */}
      <AnimatePresence>
        {paymentModalTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Receive Payment</h3>
                  <p className="text-xs text-gray-400">Record customer payment for {paymentModalTarget.billNo}</p>
                </div>
                <button onClick={() => setPaymentModalTarget(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Bill Details Summary Card */}
              <div className="bg-gray-50 rounded-xl p-3.5 space-y-1.5 text-xs border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer Party:</span>
                  <span className="font-bold text-gray-900">{paymentModalTarget.party}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Invoice Total:</span>
                  <span className="font-bold text-gray-900 font-mono">₹{(paymentModalTarget.totalAmount ?? paymentModalTarget.amount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-200 pt-1.5 text-rose-600">
                  <span>Current Outstanding:</span>
                  <span className="font-mono">₹{paymentModalTarget.outstanding.toLocaleString()}</span>
                </div>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
                <Field label="Payment Received (₹)" required>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      className={`${inputCls} pl-8 font-bold text-indigo-600 text-sm`}
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Payment Mode" required>
                    <SearchDropdown
                      value={paymentMode}
                      onChange={val => setPaymentMode(val as any)}
                      options={[
                        { value: "Cash", label: "Cash" },
                        { value: "Bank", label: "Bank Transfer" },
                        { value: "Cheque", label: "Cheque" },
                        { value: "NEFT", label: "NEFT / RTGS" },
                        { value: "UPI", label: "UPI" }
                      ]}
                      placeholder="Select payment mode"
                    />
                  </Field>

                  <Field label="Ref / Cheque No">
                    <input
                      value={paymentRefNo}
                      onChange={e => setPaymentRefNo(e.target.value)}
                      placeholder="TXN-XXXX"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentModalTarget(null)}
                    className="flex-1 h-10 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentSaving}
                    className="flex-1 h-10 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={15} />
                    {paymentSaving ? "Updating DB..." : "Confirm & Save Payment"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYMENT HISTORY MODAL */}
      <AnimatePresence>
        {historyModalTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Payment History</h3>
                  <p className="text-xs text-gray-400">Transactions for {historyModalTarget.billNo} ({historyModalTarget.party})</p>
                </div>
                <button onClick={() => setHistoryModalTarget(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {billPayments.map(p => (
                  <div key={p.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900">{p.paymentMode} Payment — <span className="font-mono text-indigo-600">{p.paymentNo}</span></div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{p.paymentDate} · Ref: {p.referenceNo || 'N/A'}</div>
                    </div>
                    <div className="font-bold text-emerald-600 text-xs font-mono">
                      +₹{p.amount.toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
                {billPayments.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-400">No payment receipts recorded for this bill yet.</div>
                )}
              </div>

              <button
                onClick={() => setHistoryModalTarget(null)}
                className="w-full h-10 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                Close History
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT BILL MODAL */}
      <AnimatePresence>
        {editBillTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Edit Freight Bill</h3>
                  <p className="text-xs text-gray-400 font-mono">Invoice: {editBillTarget.billNo}</p>
                </div>
                <button onClick={() => setEditBillTarget(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEditBill} className="space-y-4">
                <Field label="Customer Party Name" required>
                  <SearchDropdown
                    value={editParty}
                    onChange={val => setEditParty(val)}
                    options={activeCompanyParties.map(p => ({ value: p.name, label: p.name }))}
                    placeholder="Select Party"
                  />
                </Field>

                <Field label="Bill Total Amount (₹)" required>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    className={inputCls}
                  />
                </Field>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditBillTarget(null)}
                    className="flex-1 h-10 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={15} /> Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW BILL DETAILS MODAL */}
      <AnimatePresence>
        {viewBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Freight Invoice Details</h3>
                  <p className="text-xs text-gray-400 font-mono">{viewBill.billNo}</p>
                </div>
                <button onClick={() => setViewBill(null)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex justify-between"><span className="text-gray-500 font-semibold uppercase text-[10px]">Invoice Number</span><span className="font-mono font-bold text-indigo-600">{viewBill.billNo}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-semibold uppercase text-[10px]">Linked LR Number</span><span className="font-mono text-gray-800">{renderBillLrNumber(viewBill)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-semibold uppercase text-[10px]">Invoice Date</span><span className="font-medium text-gray-900">{viewBill.billDate}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-semibold uppercase text-[10px]">Customer Party</span><span className="font-bold text-gray-900">{viewBill.party}</span></div>
                </div>

                <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 space-y-2">
                  <div className="flex justify-between"><span className="text-gray-700 font-semibold">Total Amount</span><span className="font-bold text-gray-900 font-mono">₹{(viewBill.totalAmount ?? viewBill.amount ?? 0).toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between"><span className="text-emerald-700 font-semibold">Received Amount</span><span className="font-bold text-emerald-700 font-mono">₹{(viewBill.paidAmount ?? viewBill.paid ?? 0).toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between border-t border-indigo-200/80 pt-2"><span className="text-rose-600 font-bold">Outstanding Receivable</span><span className="font-bold text-rose-600 text-sm font-mono">₹{viewBill.outstanding.toLocaleString("en-IN")}</span></div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setViewBill(null)} className="flex-1 h-10 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIRECT CREATE FREIGHT INVOICE MODAL */}
      <AnimatePresence>
        {showDirectBillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Generate Direct Invoice</h3>
                  <p className="text-xs text-gray-400 font-mono">Invoice #: {newBillNo}</p>
                </div>
                <button onClick={() => setShowDirectBillModal(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleDirectCreateBillSubmit} className="space-y-4">
                <Field label="Customer Party Name" required>
                  <SearchDropdown
                    value={directParty}
                    onChange={val => setDirectParty(val)}
                    options={activeCompanyParties.map(p => ({ value: p.name, label: p.name }))}
                    placeholder="Select Customer Party"
                  />
                </Field>

                <Field label="Total Bill Amount (₹)" required>
                  <input
                    type="number"
                    required
                    min="1"
                    value={directAmount}
                    onChange={e => setDirectAmount(e.target.value)}
                    placeholder="Enter bill amount e.g. 15000"
                    className={inputCls}
                  />
                </Field>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDirectBillModal(false)}
                    className="flex-1 h-10 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-10 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={15} /> Confirm & Generate Bill
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CANCEL CONFIRMATION MODAL */}
      <AnimatePresence>
        {cancelBillTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Ban size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Cancel Bill {cancelBillTarget}?</h3>
                <p className="text-xs text-gray-400 mt-1">This bill will be soft-deleted in the database.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setCancelBillTarget(null)} className="flex-1 h-10 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">
                  Keep Active
                </button>
                <button onClick={handleCancelBill} className="flex-1 h-10 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs">
                  Cancel Bill
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRILLDOWN PARTY DETAILS MODAL */}
      <AnimatePresence>
        {drilldownParty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden font-sans"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{drilldownParty.name} — Party Ledger</h3>
                </div>
                <button
                  onClick={() => setDrilldownParty(null)}
                  className="w-8 h-8 rounded-full hover:bg-gray-200 text-gray-500 flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setDrilldownParty(null)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINT MODALS */}
      <OutstandingPartyPrintModal
        isOpen={!!printPartyTarget}
        party={printPartyTarget}
        partyBills={billsRegister.filter(b => b.party === printPartyTarget?.name || b.partyId === printPartyTarget?.id)}
        partyPayments={allPayments.filter(p => p.partyName === printPartyTarget?.name || p.party === printPartyTarget?.name)}
        onClose={() => setPrintPartyTarget(null)}
      />

      <ReceiptPrintModal
        isOpen={!!receiptTarget}
        payment={receiptTarget}
        onClose={() => setReceiptTarget(null)}
      />
    </div>
  )
}
