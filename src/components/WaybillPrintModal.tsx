import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Printer, X } from "lucide-react"
import { companyContext } from "../services/companyContext"
import { companyRepository } from "../repositories/repositories"

interface WaybillPrintModalProps {
  isOpen: boolean
  waybill: any | null
  onClose: () => void
}

export default function WaybillPrintModal({ isOpen, waybill, onClose }: WaybillPrintModalProps) {
  const [companyDetails, setCompanyDetails] = useState<{
    companyName: string
    address: string
    phone: string
    gstin: string
  }>({
    companyName: "TransportOS Enterprise",
    address: "Logistics HQ, Pune (MH)",
    phone: "022-98765432",
    gstin: "27AABCG5678B1Z9"
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
          gstin: (comp as any).gstin || "27AABCG5678B1Z9"
        })
      }
    }
    loadCompanyInfo()
  }, [isOpen])

  if (!isOpen || !waybill) return null

  const handlePrint = () => {
    window.print()
  }

  const wbNo = waybill.waybill_no || waybill.ewayBill || waybill.id || `EWB-${Date.now()}`
  const dateStr = waybill.date || new Date().toISOString().split("T")[0]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-3xl overflow-hidden print:max-w-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 print:hidden">
            <div>
              <h3 className="text-base font-bold text-gray-900 font-mono">Way Bill Document — {wbNo}</h3>
              <p className="text-xs text-gray-400">Electronic Transport Way Bill & Transit Permit</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} /> Print Way Bill
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
            <div className="border-2 border-slate-900 rounded-2xl p-6 space-y-6 text-gray-900 bg-white">
              
              {/* Top Banner */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">{companyDetails.companyName}</h2>
                  <p className="text-xs text-gray-600">{companyDetails.address}</p>
                  <p className="text-xs text-gray-500">GSTIN: {companyDetails.gstin} · Cell: {companyDetails.phone}</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider rounded">
                    Official Way Bill
                  </span>
                  <div className="text-xs font-mono text-gray-600 mt-2">Way Bill No: <strong>{wbNo}</strong></div>
                  <div className="text-xs font-mono text-gray-600">Date: <strong>{dateStr}</strong></div>
                </div>
              </div>

              {/* Transit Details */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Assigned Lorry Receipt (LR)</span>
                  <strong className="text-sm font-bold text-indigo-700 font-mono block">{waybill.lr_no || waybill.lrNo || waybill.lr}</strong>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Assigned Transit Vehicle & Driver</span>
                  <strong className="text-sm font-bold text-gray-900 block">{waybill.vehicle || "N/A"} · {waybill.driver || "Driver Assigned"}</strong>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Consignor (Dispatch Location)</span>
                  <strong className="text-xs font-bold text-gray-900 block">{waybill.consignor || "Consignor Party"} ({waybill.from_station || waybill.from || "Dispatch"})</strong>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase block">Consignee (Destination Location)</span>
                  <strong className="text-xs font-bold text-gray-900 block">{waybill.consignee || "Consignee Party"} ({waybill.to_station || waybill.to || "Destination"})</strong>
                </div>
              </div>

              {/* Compliance Note */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                <div className="font-bold text-slate-900">Goods In-Transit Clearance Terms:</div>
                <p className="text-[11px] leading-relaxed text-gray-600">
                  This Way Bill certifies that the consignment specified above is transported under authorized transit permits. All vehicle inspections and e-way bill clearances are verified by the carrier.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-4 flex items-end justify-between text-xs border-t border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block">Status: Active Transit Permit</span>
                </div>
                <div className="text-center space-y-1">
                  <div className="h-10 w-36 border-b border-gray-400 flex items-end justify-center pb-0.5 text-[9px] text-gray-400">
                    Carrier Stamp & Signature
                  </div>
                  <span className="text-[10px] font-bold text-gray-700 block">For {companyDetails.companyName}</span>
                </div>
              </div>

            </div>
          </div>

          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50 print:hidden">
            <span className="text-xs text-gray-400 font-medium">Valid Transit Document</span>
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
