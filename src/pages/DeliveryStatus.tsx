import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, CheckCircle2, Timer, AlertCircle, MapPin } from "lucide-react"
import { lrController } from "../controllers/lrController"
import { DBLR } from "../db/schema"
import { companyContext } from "../services/companyContext"

const STATUS_MAP = {
  in_transit: { label: "In Transit", icon: Timer, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200", step: 2 },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200", step: 3 },
  pending: { label: "Pending", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200", step: 1 },
  cancelled: { label: "Cancelled", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200", step: 0 },
}

const STEPS = ["Booked", "Dispatched", "In Transit", "Delivered"]

export default function DeliveryStatus() {
  const [search, setSearch] = useState("")
  const [lrList, setLrList] = useState<DBLR[]>([])
  const [selectedLrNo, setSelectedLrNo] = useState<string>("")

  const activeCompanyId = companyContext.getActiveCompanyId()

  useEffect(() => {
    lrController.fetchLRs({}, activeCompanyId).then(lrs => {
      setLrList(lrs)
      if (lrs.length > 0) setSelectedLrNo(lrs[0].lr)
    })
  }, [activeCompanyId])

  const active = lrList.find(r => r.lr === selectedLrNo) || lrList[0]
  const sc = active ? STATUS_MAP[active.status as keyof typeof STATUS_MAP] : STATUS_MAP.pending
  const filtered = lrList.filter(r => !search || r.lr.toLowerCase().includes(search.toLowerCase()) || r.consignor.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-6 py-5 space-y-4">

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-gray-900">Delivery Status</h1>
          <p className="text-xs text-gray-400 mt-0.5">Track live shipment status from database</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LR list */}
          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-50">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search LR..."
                  className="pl-8 pr-3 h-9 w-full bg-gray-100/80 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:bg-white border border-transparent focus:border-indigo-200 transition-all" />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              {filtered.map((r, i) => {
                const s = STATUS_MAP[r.status as keyof typeof STATUS_MAP] || STATUS_MAP.pending
                const Icon = s.icon
                return (
                  <motion.button key={r.lr}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedLrNo(r.lr)}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50/60 transition-colors ${selectedLrNo === r.lr ? "bg-indigo-50/60 border-l-2 border-l-indigo-500" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-600">{r.lr}</span>
                      <Icon size={13} className={s.color} />
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{r.from} → {r.to}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{r.consignor} · {r.date}</div>
                  </motion.button>
                )
              })}
              {filtered.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400">No shipments found in database.</div>
              )}
            </div>
          </motion.div>

          {/* Details & timeline */}
          {active ? (
            <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="lg:col-span-2 space-y-4">

              {/* Status Header */}
              <div className="bg-white rounded-[20px] border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div>
                    <span className="font-mono text-base font-bold text-indigo-600">{active.lr}</span>
                    <h2 className="text-xs text-gray-400 font-normal">{active.consignor} → {active.consignee}</h2>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${sc.bg} ${sc.color} ${sc.border} border`}>
                    {sc.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="relative pt-2 pb-1">
                  <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-2">
                    {STEPS.map((step, idx) => (
                      <span key={step} className={idx <= sc.step ? "text-indigo-600 font-bold" : ""}>
                        {step}
                      </span>
                    ))}
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${(sc.step / 3) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Route & Cargo Card */}
              <div className="bg-white rounded-[20px] border border-gray-100 p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">ROUTE DETAILS</div>
                  <div className="mt-2 space-y-1 font-bold text-gray-800">
                    <div className="flex items-center gap-1.5"><MapPin size={13} className="text-indigo-500" /> From: {active.from}</div>
                    <div className="flex items-center gap-1.5"><MapPin size={13} className="text-emerald-500" /> To: {active.to}</div>
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">CARGO & VEHICLE</div>
                  <div className="mt-2 space-y-1 text-gray-800 font-semibold">
                    <div>Vehicle: <span className="font-mono text-indigo-600">{active.vehicle}</span></div>
                    <div>Article: {active.article || "General Cargo"}</div>
                    <div>Freight Amount: ₹{(active.freight || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-[20px] p-12 text-center text-xs text-gray-400 border border-gray-100">
              Select a shipment to track status
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
