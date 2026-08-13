import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  Printer, FileDown, Pencil, Eye, Download, AlertTriangle, X, Ban, MapPin, Calendar, CheckCircle2, User, Truck, FileText, Plus
} from "lucide-react"
import LRPrintModal from "../components/LRPrintModal"
import DigitalSignatureModal from "../components/DigitalSignatureModal"
import ViewLR from "./ViewLR"
import { lrController } from "../controllers/lrController"
import { DBLR } from "../db/schema"
import { companyContext } from "../services/companyContext"
import AppModal, { ConfirmDialog } from "../components/Modal"

const STATUS: Record<string, { label: string; bg: string; dot: string }> = {
  in_transit: { label: "In Transit", bg: "bg-blue-50/80 text-blue-600 border border-blue-100", dot: "bg-blue-500" },
  delivered: { label: "Delivered", bg: "bg-emerald-50/80 text-emerald-600 border border-emerald-100", dot: "bg-emerald-500" },
  pending: { label: "Pending", bg: "bg-amber-50/80 text-amber-600 border border-amber-100", dot: "bg-amber-500" },
  cancelled: { label: "Cancelled", bg: "bg-red-50/80 text-red-500 border border-red-100", dot: "bg-red-500" },
  Booked: { label: "Booked", bg: "bg-blue-50/80 text-blue-600 border border-blue-100", dot: "bg-blue-500" },
  Draft: { label: "Draft", bg: "bg-gray-50/80 text-gray-600 border border-gray-100", dot: "bg-gray-500" },
  booked: { label: "Booked", bg: "bg-blue-50/80 text-blue-600 border border-blue-100", dot: "bg-blue-500" },
  draft: { label: "Draft", bg: "bg-gray-50/80 text-gray-600 border border-gray-100", dot: "bg-gray-500" }
}

type SortKey = "lr" | "date" | "vehicle" | "from" | "consignor" | "freight" | "status"
type SortDir = "asc" | "desc"

import SignatureModal from "../components/SignatureModal"
import { Edit3 } from "lucide-react"

function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return dateStr
  }
}

export default function LRList({ onCreateLR, onEditLR }: { onCreateLR: () => void; onEditLR?: (record: DBLR) => void }) {
  const [activeTab, setActiveTab] = useState<"register" | "blank">("register")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("lr")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(1)
  
  // Live Database State
  const [records, setRecords] = useState<DBLR[]>([])

  // Modals state
  const [viewLr, setViewLr] = useState<DBLR | null>(null)
  const [showPrint, setShowPrint] = useState<DBLR | null>(null)
  const [printCopyType, setPrintCopyType] = useState<"consignee" | "driver">("consignee")
  const [signatureTarget, setSignatureTarget] = useState<DBLR | null>(null)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const PER = 8

  const activeCompanyId = companyContext.getActiveCompanyId()

  const loadLRRecords = async () => {
    const list = await lrController.fetchLRs({ search, status: statusFilter }, activeCompanyId)
    setRecords(list)
  }

  useEffect(() => {
    loadLRRecords()
  }, [search, statusFilter, activeCompanyId])

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(k); setSortDir("asc") }
    setPage(1)
  }

  const sorted = [...records].sort((a, b) => {
    let valA = (a as any)[sortKey] || (a as any).lrNo || a.lr || ""
    let valB = (b as any)[sortKey] || (b as any).lrNo || b.lr || ""
    if (sortKey === "freight") {
      valA = Number(valA) || 0
      valB = Number(valB) || 0
    }
    if (valA < valB) return sortDir === "asc" ? -1 : 1
    if (valA > valB) return sortDir === "asc" ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER))
  const paginated = sorted.slice((page - 1) * PER, page * PER)

  const handleCancelLR = async () => {
    if (!cancelTarget) return
    await lrController.updateLR(cancelTarget, { status: "cancelled" }, activeCompanyId)
    await loadLRRecords()
    setCancelTarget(null)
  }

  const handleDeleteLR = async () => {
    if (!deleteTarget) return
    await lrController.deleteLR(deleteTarget, activeCompanyId)
    await loadLRRecords()
    setDeleteTarget(null)
  }

  const handleSaveSignature = async (sigDataUrl: string) => {
    if (!signatureTarget) return
    await lrController.updateLR(signatureTarget.id || signatureTarget.lr, { signature_url: sigDataUrl }, activeCompanyId)
    await loadLRRecords()
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1280px] mx-auto px-6 py-6 space-y-5 pb-20 md:pb-6">

        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">LR Register</h1>
            <p className="text-xs text-gray-400 font-normal mt-0.5">{records.length} booked lorry receipts recorded</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onCreateLR} className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 cursor-pointer">
              <Plus size={15} /> Create New LR
            </button>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center bg-gray-100 p-1 gap-1 rounded-xl overflow-x-auto">
              {["all", "in_transit", "delivered", "pending", "cancelled"].map(st => (
                <button key={st} onClick={() => { setStatusFilter(st); setPage(1) }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === st ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-500 hover:text-gray-700"}`}>
                  {st === "all" ? "All LRs" : STATUS[st]?.label || st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search LR, party or route..."
                className="pl-9 pr-3 h-9 w-full sm:w-[240px] bg-gray-50 border border-gray-200 rounded-lg text-xs font-normal focus:outline-none focus:bg-white focus:border-indigo-300 transition-all" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4 w-[16%] align-middle cursor-pointer" onClick={() => handleSort("lr")}>
                    <div className="flex items-center gap-1">LR NO {sortKey === "lr" && (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th className="py-3 px-3 w-[10%] align-middle cursor-pointer" onClick={() => handleSort("date")}>
                    <div className="flex items-center gap-1">DATE {sortKey === "date" && (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th className="py-3 px-4 w-[18%] align-middle cursor-pointer" onClick={() => handleSort("from")}>
                    <div className="flex items-center gap-1">ROUTE {sortKey === "from" && (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th className="py-3 px-4 w-[22%] align-middle cursor-pointer" onClick={() => handleSort("consignor")}>
                    <div className="flex items-center gap-1">CONSIGNOR / CONSIGNEE {sortKey === "consignor" && (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th className="py-3 px-4 w-[10%] align-middle text-right cursor-pointer" onClick={() => handleSort("freight")}>
                    <div className="flex items-center justify-end gap-1">FREIGHT {sortKey === "freight" && (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th className="py-3 px-3 w-[10%] align-middle cursor-pointer" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">STATUS {sortKey === "status" && (sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</div>
                  </th>
                  <th className="py-3 px-4 w-[14%] align-middle text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                {paginated.map(r => {
                  const lrDisplayNo = r.lrNo || r.lr || r.id
                  const st = STATUS[r.status as string] || STATUS.pending
                  const isSigned = Boolean(r.is_digitally_signed || (r as any).digital_signature_id || (r as any).signature)
                  return (
                    <tr key={r.id || lrDisplayNo} className="hover:bg-gray-50/60 transition-colors h-[68px]">
                      <td className="py-2.5 px-4 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-indigo-600 text-xs tracking-tight">{lrDisplayNo}</span>
                          {isSigned ? (
                            <button
                              onClick={() => setSignatureTarget(r)}
                              className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full font-bold border border-purple-200 hover:bg-purple-100 cursor-pointer inline-flex items-center gap-0.5 shrink-0"
                              title="View / Update Signature"
                            >
                              Signed ✓
                            </button>
                          ) : (
                            <button
                              onClick={() => setSignatureTarget(r)}
                              className="text-[10px] text-gray-400 hover:text-purple-600 hover:bg-purple-50 px-1.5 py-0.5 rounded-md font-medium border border-dashed border-gray-200 cursor-pointer shrink-0 transition-colors"
                              title="Add Digital Signature"
                            >
                              + Sign
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 align-middle text-xs text-gray-500 font-medium whitespace-nowrap">
                        {formatDisplayDate(r.date)}
                      </td>
                      <td className="py-2.5 px-4 align-middle">
                        <div className="text-xs font-semibold text-gray-900 leading-snug max-w-[170px] truncate" title={`${r.from || 'N/A'} → ${r.to || 'N/A'}`}>
                          {r.from || (r as any).bookingStation || "N/A"} → {r.to || (r as any).deliveryStation || "N/A"}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 align-middle">
                        <div className="text-xs space-y-0.5 max-w-[200px]">
                          <div className="font-semibold text-gray-900 truncate" title={r.consignor}>
                            <span className="text-gray-400 font-normal mr-1">Consignor:</span>{r.consignor}
                          </div>
                          <div className="text-gray-600 truncate" title={r.consignee}>
                            <span className="text-gray-400 font-normal mr-1">Consignee:</span>{r.consignee}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 align-middle text-right font-mono font-extrabold text-gray-900 text-xs">
                        ₹{((r as any).freight || (r as any).freight_amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 align-middle">
                        <span className={`h-5 px-2 text-[10px] font-bold leading-none rounded-full inline-flex items-center gap-1 border uppercase ${st.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewLr(r)}
                            className="h-7 px-2 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-100 transition-all flex items-center gap-1 cursor-pointer"
                            title="View LR"
                          >
                            <Eye size={12} /> View
                          </button>
                          {onEditLR && (
                            <button
                              onClick={() => onEditLR(r)}
                              className="h-7 px-2 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-100 transition-all flex items-center gap-1 cursor-pointer"
                              title="Edit LR"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => { setPrintCopyType("consignee"); setShowPrint(r); }}
                            className="h-7 px-2 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Print Consignee Copy"
                          >
                            <Printer size={12} /> Print
                          </button>
                          <button
                            onClick={() => { setPrintCopyType("driver"); setShowPrint(r); }}
                            className="h-7 px-2 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Print Driver Copy"
                          >
                            <Truck size={12} /> Driver
                          </button>
                          {r.status !== "cancelled" && (
                            <button
                              onClick={() => setCancelTarget(r.id || lrDisplayNo)}
                              className="h-7 w-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center cursor-pointer"
                              title="Cancel LR"
                            >
                              <Ban size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {paginated.length === 0 && (
              <div className="py-12 text-center text-xs font-normal text-gray-400">
                No lorry receipts recorded for this query.
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
              <div>Showing page {page} of {totalPages} ({sorted.length} LRs)</div>
              <div className="flex items-center gap-1">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">
                  <ChevronLeft size={16} />
                </button>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* View LR Page */}
      {viewLr && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
          <ViewLR
            lrRecord={viewLr}
            onBack={() => setViewLr(null)}
            onEdit={onEditLR ? (rec) => { setViewLr(null); onEditLR(rec); } : undefined}
          />
        </div>
      )}

      {/* Cryptographic Digital Signature Modal */}
      <DigitalSignatureModal
        isOpen={!!signatureTarget}
        lr={signatureTarget}
        onClose={() => setSignatureTarget(null)}
        onSignatureUpdated={() => {
          const activeCompanyId = companyContext.getActiveCompanyId()
          lrController.fetchLRs({}, activeCompanyId).then(setRecords)
        }}
      />

      {/* Cancel Modal */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelLR}
        title={`Cancel Lorry Receipt ${cancelTarget || ""}`}
        message="This Lorry Receipt will be marked as cancelled in the database. Are you sure you want to proceed?"
        confirmLabel="Cancel LR"
        confirmStyle="red"
      />

      {/* LR Print Modal */}
      <LRPrintModal
        isOpen={!!showPrint}
        lr={showPrint}
        initialCopyType={printCopyType}
        onClose={() => setShowPrint(null)}
      />
    </div>
  )
}
