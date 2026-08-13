import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, CheckCircle2, Timer, AlertCircle, Upload, X, MapPin, Truck } from "lucide-react"
import Modal from "../components/Modal"
import { lrController } from "../controllers/lrController"
import { DBLR } from "../db/schema"
import { companyContext } from "../services/companyContext"

const STATUS_MAP = {
  in_transit: { label: "In Transit", icon: Timer, color: "text-blue-500", bg: "bg-blue-50", dot: "bg-blue-500" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  pending: { label: "Pending", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50", dot: "bg-amber-500" },
  cancelled: { label: "Cancelled", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", dot: "bg-red-500" },
}

const inputCls = "h-10 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 focus:bg-white transition-all font-normal"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}{required && <span className="text-indigo-500"> *</span>}</label>
      {children}
    </div>
  )
}

export default function Delivery() {
  const [search, setSearch] = useState("")
  const [lrRecords, setLrRecords] = useState<DBLR[]>([])
  const [selectedLrNo, setSelectedLrNo] = useState<string>("")
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [updateForm, setUpdateForm] = useState({
    receiverName: "",
    receiverMobile: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    deliveryTime: "14:00",
    remarks: ""
  })

  const activeCompanyId = companyContext.getActiveCompanyId()

  const loadLrs = async () => {
    const list = await lrController.fetchLRs({}, activeCompanyId)
    setLrRecords(list)
    if (list.length > 0 && (!selectedLrNo || !list.find(l => l.lr === selectedLrNo))) {
      setSelectedLrNo(list[0].lr)
    }
  }

  useEffect(() => {
    loadLrs()
  }, [activeCompanyId])

  const filteredLrs = lrRecords.filter(r => 
    !search || r.lr.toLowerCase().includes(search.toLowerCase()) || r.consignee.toLowerCase().includes(search.toLowerCase())
  )

  const active = lrRecords.find(r => r.lr === selectedLrNo) || filteredLrs[0]

  const handleMarkDelivered = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!active || saving) return
    setSaving(true)
    try {
      const activeLrNo = active.lrNo || active.lr || active.id
      await lrController.updateLR(active.id || activeLrNo, { status: "delivered" }, activeCompanyId)
      
      const delId = `DEL-${activeLrNo}`
      await fetch("http://localhost:8443/api/db/deliveries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": activeCompanyId
        },
        body: JSON.stringify({
          id: delId,
          company_id: activeCompanyId,
          lrNo: activeLrNo,
          lr_id: active.id || activeLrNo,
          date: updateForm.deliveryDate || new Date().toISOString().split("T")[0],
          deliveredTo: updateForm.receiverName,
          receiverPhone: updateForm.receiverMobile || "",
          status: "Delivered",
          remarks: updateForm.remarks || "Delivered successfully",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      })

      await loadLrs()
      setShowUpdateModal(false)
    } catch (err) {
      console.error("Failed to confirm delivery:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1280px] mx-auto px-6 py-6 space-y-5 pb-20 md:pb-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery & POD Portal</h1>
            <p className="text-xs text-gray-400 font-normal mt-0.5">Track shipment delivery status and upload proof of delivery</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left Column: Shipment List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search LR number or consignee..."
                  className="w-full h-9 pl-9 pr-3 bg-white border border-gray-200 rounded-lg text-xs font-normal focus:outline-none focus:border-indigo-300"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {filteredLrs.map(r => {
                const isSel = active && active.lr === r.lr
                const st = STATUS_MAP[r.status as keyof typeof STATUS_MAP] || STATUS_MAP.pending
                return (
                  <button
                    key={r.lr}
                    onClick={() => setSelectedLrNo(r.lr)}
                    className={`w-full text-left p-4 transition-colors flex items-center justify-between ${
                      isSel ? "bg-indigo-50/60 border-l-4 border-indigo-600" : "hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <div className="font-mono font-semibold text-sm text-gray-900">{r.lr}</div>
                      <div className="text-xs text-gray-600 font-medium mt-0.5">{r.consignee}</div>
                      <div className="text-[11px] text-gray-400 font-normal mt-0.5">{r.from} → {r.to}</div>
                    </div>
                    <span className={`h-5 px-2 text-[10px] font-medium leading-none rounded-full inline-flex items-center gap-1 border ${st.bg} ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </button>
                )
              })}

              {filteredLrs.length === 0 && (
                <div className="py-12 text-center text-xs font-normal text-gray-400">
                  No shipments available.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Shipment Detail */}
          {active ? (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900 font-mono">{active.lr}</h2>
                      <span className={`h-5 px-2 text-[10px] font-medium leading-none rounded-full inline-flex items-center gap-1 border ${
                        STATUS_MAP[active.status as keyof typeof STATUS_MAP]?.bg || "bg-amber-50"
                      } ${STATUS_MAP[active.status as keyof typeof STATUS_MAP]?.color || "text-amber-600"}`}>
                        {STATUS_MAP[active.status as keyof typeof STATUS_MAP]?.label || active.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-normal mt-0.5">Booked on {active.date}</p>
                  </div>
                  {active.status !== "delivered" && (
                    <button
                      onClick={() => setShowUpdateModal(true)}
                      className="h-10 px-4 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/10 flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={15} /> Mark as Delivered
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50/70 p-4 rounded-xl text-xs">
                  <div><span className="text-gray-400 uppercase font-semibold block">Consignor</span><span className="font-semibold text-gray-900">{active.consignor}</span></div>
                  <div><span className="text-gray-400 uppercase font-semibold block">Consignee</span><span className="font-semibold text-gray-900">{active.consignee}</span></div>
                  <div><span className="text-gray-400 uppercase font-semibold block">Route</span><span className="font-semibold text-gray-900">{active.from} → {active.to}</span></div>
                  <div><span className="text-gray-400 uppercase font-semibold block">Vehicle Number</span><span className="font-mono font-semibold text-gray-900">{active.vehicle || "MH-12-XX-1234"}</span></div>
                  <div><span className="text-gray-400 uppercase font-semibold block">Freight Type</span><span className="font-semibold text-gray-900">{active.freightType || "To Pay"}</span></div>
                  <div><span className="text-gray-400 uppercase font-semibold block">Total Freight</span><span className="font-extrabold text-indigo-600 text-sm">₹{active.freight?.toLocaleString()}</span></div>
                </div>

                {/* POD Upload Section */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Proof of Delivery (POD) Attachment</h4>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center space-y-2 hover:border-indigo-300 transition-colors cursor-pointer bg-gray-50/40">
                    <Upload size={24} className="mx-auto text-gray-400" />
                    <p className="text-xs font-medium text-gray-700">Click to upload signed POD image / PDF</p>
                    <p className="text-[10px] text-gray-400">Supports PNG, JPG, PDF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-xs font-normal text-gray-400">
              No shipment selected.
            </div>
          )}

        </div>

      </div>

      {/* Mark Delivered Modal */}
      <AnimatePresence>
        {showUpdateModal && active && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Mark LR {active.lr} Delivered</h3>
                <button onClick={() => setShowUpdateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <form onSubmit={handleMarkDelivered} className="p-6 space-y-4">
                <Field label="Receiver Name *" required>
                  <input type="text" required value={updateForm.receiverName} onChange={e => setUpdateForm({ ...updateForm, receiverName: e.target.value })} placeholder="Full name of receiver" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Delivery Date">
                    <input type="date" value={updateForm.deliveryDate} onChange={e => setUpdateForm({ ...updateForm, deliveryDate: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Delivery Time">
                    <input type="time" value={updateForm.deliveryTime} onChange={e => setUpdateForm({ ...updateForm, deliveryTime: e.target.value })} className={inputCls} />
                  </Field>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowUpdateModal(false)} className="flex-1 h-10 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
                    {saving ? "Saving..." : "Confirm Delivery"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
