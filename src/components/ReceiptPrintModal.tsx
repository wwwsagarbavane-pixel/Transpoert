import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Printer, X, ShieldCheck } from "lucide-react"
import { DBPayment } from "../db/schema"
import { companyContext } from "../services/companyContext"
import { companyRepository } from "../repositories/repositories"

interface ReceiptPrintModalProps {
  isOpen: boolean
  payment: DBPayment | null
  onClose: () => void
}

export default function ReceiptPrintModal({ isOpen, payment, onClose }: ReceiptPrintModalProps) {
  const [companyDetails, setCompanyDetails] = useState<{
    companyName: string
    address: string
    phone: string
    gstin: string
    logo?: string
  }>({
    companyName: "TransportOS Enterprise",
    address: "Logistics Hub, Pune - 411001 (MH)",
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

  if (!isOpen || !payment) return null

  const handlePrint = () => {
    window.print()
  }

  const receiptNo = payment.receiptNo || (payment as any).paymentNo || `PAY-${payment.id}`
  const dateStr = payment.date || (payment as any).paymentDate || new Date().toISOString().split("T")[0]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-2xl overflow-hidden print:max-w-none print:shadow-none print:border-none print:rounded-none font-sans"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 print:hidden">
            <div>
              <h3 className="text-base font-bold text-gray-900 font-mono">Payment Receipt — {receiptNo}</h3>
              <p className="text-xs text-gray-400">Official Payment Confirmation & Tax Receipt</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} /> Print Receipt
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
            <div className="border-2 border-indigo-900 rounded-2xl p-6 space-y-6 text-gray-900 bg-white">
              
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-4">
                <div>
                  <h2 className="text-xl font-black text-indigo-950 uppercase">{companyDetails.companyName}</h2>
                  <p className="text-xs text-gray-600 font-medium">{companyDetails.address}</p>
                  <p className="text-xs text-gray-500">GSTIN: {companyDetails.gstin} · Phone: {companyDetails.phone}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-indigo-900 text-white font-extrabold text-xs uppercase tracking-wider rounded">
                    Payment Receipt
                  </span>
                  <div className="text-xs font-mono text-gray-600 mt-2">Receipt No: <strong>{receiptNo}</strong></div>
                  <div className="text-xs font-mono text-gray-600">Date: <strong>{dateStr}</strong></div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Received From (Party)</span>
                  <strong className="text-sm font-bold text-gray-900 block">{payment.party || (payment as any).partyName}</strong>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Related Bill / Reference</span>
                  <strong className="text-sm font-bold text-indigo-700 font-mono block">
                    {payment.billNo || (payment as any).bill_id || "Direct Freight Payment"}
                  </strong>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-emerald-800 uppercase block">Total Amount Received</span>
                  <span className="text-xs text-emerald-600 font-medium">Payment Mode: <strong>{payment.mode || (payment as any).paymentMode || "Cash"}</strong> {(payment.referenceNo || (payment as any).reference_no) ? `(Ref: ${payment.referenceNo || (payment as any).reference_no})` : ""}</span>
                </div>
                <div className="text-2xl font-black text-emerald-900 font-mono">
                  ₹{(payment.amount || 0).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Status & Signatures */}
              <div className="pt-4 flex items-end justify-between text-xs border-t border-gray-200">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 inline-block uppercase">
                    Status: {payment.status || "Completed"}
                  </span>
                  <p className="text-[10px] text-gray-400">System Verified Electronic Transaction</p>
                </div>

                <div className="text-center space-y-1">
                  <div className="h-10 w-36 border-b border-gray-400 flex items-end justify-center pb-0.5 text-[9px] text-gray-400">
                    Authorized Signatory
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 block">For {companyDetails.companyName}</span>
                </div>
              </div>

            </div>
          </div>

          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 print:hidden">
            <span className="text-xs text-gray-400 font-medium">Verified Payment Confirmation Record</span>
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
