import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Printer, X, Download } from "lucide-react"
import { DBParty, DBBill, DBPayment } from "../db/schema"
import { companyContext } from "../services/companyContext"
import { companyRepository } from "../repositories/repositories"

interface OutstandingPartyPrintModalProps {
  isOpen: boolean
  party: DBParty | null
  partyBills: DBBill[]
  partyPayments: DBPayment[]
  onClose: () => void
}

export default function OutstandingPartyPrintModal({
  isOpen,
  party,
  partyBills,
  partyPayments,
  onClose
}: OutstandingPartyPrintModalProps) {
  const [companyDetails, setCompanyDetails] = useState<{
    companyName: string
    address: string
    phone: string
    gstin: string
    logo?: string
  }>({
    companyName: "TransportOS Enterprise",
    address: "Logistics HQ, Pune - 411001 (MH)",
    phone: "022-98765432",
    gstin: "27AABCG5678B1Z9",
    logo: ""
  })

  useEffect(() => {
    if (!isOpen) return
    const loadCompanyInfo = async () => {
      const activeCompanyId = companyContext.getActiveCompanyId()
      const comp = await companyRepository.findById(activeCompanyId)
      if (comp && comp.name) {
        setCompanyDetails({
          companyName: comp.name,
          address: `${(comp as any).address || ""}, ${comp.city || ""} (${(comp as any).state || ""})`.trim().replace(/^,\s*/, ""),
          phone: (comp as any).phone || "022-98765432",
          gstin: (comp as any).gstin || "27AABCG5678B1Z9",
          logo: comp.logo || ""
        })
      }
    }
    loadCompanyInfo()
  }, [isOpen])

  if (!isOpen || !party) return null

  const totalBilled = partyBills.reduce((sum, b) => sum + (b.totalAmount ?? b.amount ?? 0), 0)
  const totalPaid = partyBills.reduce((sum, b) => sum + (b.paidAmount ?? b.paid ?? 0), 0)
  const outstanding = Math.max(0, totalBilled - totalPaid)
  const reportDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  const handlePrint = () => {
    window.print()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-4xl overflow-hidden print:max-w-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 print:hidden">
            <div>
              <h3 className="text-base font-bold text-gray-900">Party Outstanding Statement — {party.name}</h3>
              <p className="text-xs text-gray-400">Statement of Freight Invoices & Payments as on {reportDate}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} /> Print Statement
              </button>
              <button
                onClick={onClose}
                className="h-9 px-3 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Printable Body */}
          <div className="p-8 space-y-6 print:p-0">
            <div className="border-2 border-indigo-950 rounded-2xl p-6 space-y-6 text-gray-900 bg-white">
              
              {/* Header Banner */}
              <div className="flex justify-between items-start border-b-2 border-indigo-950 pb-4">
                <div>
                  <h2 className="text-xl font-black text-indigo-950 uppercase">{companyDetails.companyName}</h2>
                  <p className="text-xs text-gray-600">{companyDetails.address}</p>
                  <p className="text-xs text-gray-500">GSTIN: {companyDetails.gstin} · Phone: {companyDetails.phone}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-indigo-950 text-white font-extrabold text-xs uppercase tracking-wider rounded">
                    OUTSTANDING STATEMENT
                  </span>
                  <div className="text-xs font-mono text-gray-600 mt-2">Report Date: <strong>{reportDate}</strong></div>
                </div>
              </div>

              {/* Party Summary Box */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Customer / Party Details</span>
                  <strong className="text-sm font-bold text-gray-900 block">{party.name}</strong>
                  <div className="text-gray-600">Type: {party.type} · GSTIN: {party.gst || "N/A"}</div>
                  <div className="text-gray-600">Mobile: {party.phone || party.mobile || "N/A"}</div>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1 text-right">
                  <span className="text-[10px] text-indigo-700 font-extrabold uppercase block">Balance Overview</span>
                  <div className="text-xs text-gray-600">Total Freight Billed: <strong>₹{totalBilled.toLocaleString("en-IN")}</strong></div>
                  <div className="text-xs text-emerald-700 font-semibold">Total Payments Received: <strong>₹{totalPaid.toLocaleString("en-IN")}</strong></div>
                  <div className="text-lg font-black text-red-600 mt-1 font-mono">
                    Net Outstanding: ₹{outstanding.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Bills Breakdown Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Invoices & Bills Breakdown</h4>
                <table className="w-full text-xs text-left border-collapse border border-gray-200">
                  <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="border border-gray-200 p-2">Bill No</th>
                      <th className="border border-gray-200 p-2">Date</th>
                      <th className="border border-gray-200 p-2 text-right">Bill Amount</th>
                      <th className="border border-gray-200 p-2 text-right">Paid Amount</th>
                      <th className="border border-gray-200 p-2 text-right">Balance</th>
                      <th className="border border-gray-200 p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partyBills.length > 0 ? (
                      partyBills.map(b => (
                        <tr key={b.billNo}>
                          <td className="border border-gray-200 p-2 font-mono font-bold text-indigo-700">{b.billNo}</td>
                          <td className="border border-gray-200 p-2 text-gray-600">{b.billDate}</td>
                          <td className="border border-gray-200 p-2 font-semibold text-right">₹{(b.totalAmount ?? b.amount ?? 0).toLocaleString("en-IN")}</td>
                          <td className="border border-gray-200 p-2 text-emerald-700 text-right">₹{(b.paidAmount ?? b.paid ?? 0).toLocaleString("en-IN")}</td>
                          <td className="border border-gray-200 p-2 font-bold text-red-600 text-right">₹{(b.outstanding || 0).toLocaleString("en-IN")}</td>
                          <td className="border border-gray-200 p-2 text-center font-bold uppercase text-[10px]">
                            {b.status}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-400 text-xs">No bill transactions found for this party</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-6 flex items-end justify-between text-xs border-t border-gray-200">
                <div className="text-[10px] text-gray-400">
                  System Generated Statement · Confidential
                </div>
                <div className="text-center space-y-1">
                  <div className="h-10 w-36 border-b border-gray-400 flex items-end justify-center pb-0.5 text-[9px] text-gray-400">
                    Accounts Signature
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 block">For {companyDetails.companyName}</span>
                </div>
              </div>

            </div>
          </div>

          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 print:hidden">
            <span className="text-xs text-gray-400 font-medium">Verified PostgreSQL Transaction Data</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
