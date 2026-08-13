import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, X, AlertTriangle, Package, MapPin, ChevronDown } from "lucide-react"
import { articleMaster, stationMaster } from "../data/mockData"
import { DeleteDialog } from "../components/Modal"
import SearchDropdown from "../components/SearchDropdown"

const inputCls = "h-11 w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-sm text-gray-800 placeholder:text-gray-450 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 focus:bg-white transition-all"

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? "md:col-span-2 col-span-1" : ""}`}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}{required && <span className="text-indigo-500"> *</span>}</label>
      {children}
    </div>
  )
}

function Sel({ options, placeholder, value, onChange }: { options: string[]; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <SearchDropdown
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
    />
  )
}

type Tab = "article" | "station"

export default function Masters() {
  const [tab, setTab] = useState<Tab>("article")
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [artForm, setArtForm] = useState({ name: "", description: "", unit: "", fragile: false, status: "active" })
  const [stnForm, setStnForm] = useState({ name: "", city: "", state: "", type: "Branch", pincode: "", phone: "", status: "active" })

  const filteredArt = articleMaster.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()))
  const filteredStn = stationMaster.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-5 pb-20 md:pb-5 space-y-4">

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Masters</h1>
            <p className="text-xs text-gray-400 mt-0.5">Article and station configuration</p>
          </div>
          <motion.button onClick={() => setShowForm(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 h-9 md:h-10 px-3 md:px-5 rounded-xl text-xs md:text-sm font-semibold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)", boxShadow: "0 3px 10px rgba(79,70,229,0.3)" }}>
            <Plus size={14} /> Add {tab === "article" ? "Article" : "Station"}
          </motion.button>
        </motion.div>

        {/* Tabs */}
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex items-center bg-white rounded-2xl p-1 gap-1 w-fit card-shadow">
            {([
              { key: "article", label: "Article Master", icon: Package },
              { key: "station", label: "Station Master", icon: MapPin },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { setTab(key); setSearch("") }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${tab === key ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-[280px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${tab === "article" ? "articles" : "stations"}...`}
            className="pl-8 pr-3 h-9 w-full bg-white rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 border border-gray-200 focus:border-indigo-300 transition-all card-shadow" />
        </div>

        {tab === "article" && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-[20px] card-shadow overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/60">
                  <tr>
                    {["Article", "Description", "Unit", "Fragile", "Status", ""].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3.5 px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredArt.map((a, i) => (
                    <motion.tr key={a.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                            <Package size={13} className="text-orange-500" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{a.name}</div>
                            <div className="text-[10px] text-gray-400">{a.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-600">{a.description}</td>
                      <td className="py-3.5 px-5 text-xs font-semibold text-gray-700">{a.unit}</td>
                      <td className="py-3.5 px-5">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${a.fragile ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>
                          {a.fragile ? "⚠ Fragile" : "Normal"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${a.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                          {a.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">Edit</button>
                          <button onClick={() => setDeleteTarget(a.name)} className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors">Delete</button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="block md:hidden space-y-3">
              {filteredArt.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl card-shadow p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0">
                        <Package size={15} className="text-orange-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{a.name}</div>
                        <div className="text-[10px] text-gray-400">{a.id}</div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${a.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                      {a.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Unit</div>
                      <div className="text-xs font-semibold text-gray-700 mt-0.5">{a.unit}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Fragile</div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${a.fragile ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>
                        {a.fragile ? "⚠ Fragile" : "Normal"}
                      </span>
                    </div>
                    {a.description && (
                      <div className="col-span-2">
                        <div className="text-[10px] text-gray-400 uppercase font-semibold">Description</div>
                        <div className="text-xs text-gray-600 mt-0.5">{a.description}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 h-10 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">Edit</button>
                    <button onClick={() => setDeleteTarget(a.name)} className="flex-1 h-10 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === "station" && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-[20px] card-shadow overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/60">
                  <tr>
                    {["Station", "City", "State", "Type", "Pincode", "Phone", "Status", ""].map(h => (
                      <th key={h} className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider py-3.5 px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStn.map((s, i) => (
                    <motion.tr key={s.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <MapPin size={13} className="text-indigo-500" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{s.name}</div>
                            <div className="text-[10px] text-gray-400">{s.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-700">{s.city}</td>
                      <td className="py-3.5 px-5 text-xs text-gray-600">{s.state}</td>
                      <td className="py-3.5 px-5">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.type === "Branch" ? "bg-indigo-50 text-indigo-600" : s.type === "Booking Point" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                          {s.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-gray-600">{s.pincode}</td>
                      <td className="py-3.5 px-5 font-mono text-xs text-gray-600">{s.phone}</td>
                      <td className="py-3.5 px-5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                          {s.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">Edit</button>
                          <button onClick={() => setDeleteTarget(s.name)} className="h-7 px-2.5 rounded-lg text-[11px] font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors">Delete</button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="block md:hidden space-y-3">
              {filteredStn.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl card-shadow p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
                        <MapPin size={15} className="text-indigo-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{s.name}</div>
                        <div className="text-[10px] text-gray-400">{s.id}</div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                      {s.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">City</div>
                      <div className="text-xs font-semibold text-gray-700 mt-0.5">{s.city}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">State</div>
                      <div className="text-xs text-gray-600 mt-0.5">{s.state}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Type</div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${s.type === "Branch" ? "bg-indigo-50 text-indigo-600" : s.type === "Booking Point" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                        {s.type}
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-semibold">Phone</div>
                      <div className="text-xs font-mono text-gray-600 mt-0.5">{s.phone}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 h-10 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">Edit</button>
                    <button onClick={() => setDeleteTarget(s.name)} className="flex-1 h-10 rounded-xl text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}


        {/* Add form drawer */}
        <AnimatePresence>
          {showForm && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
              <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] bg-white z-50 shadow-2xl flex flex-col h-full overflow-hidden">
                {/* Drawer header */}
                <div className="shrink-0 sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">Add {tab === "article" ? "Article" : "Station"}</h2>
                  <button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"><X size={18} className="text-gray-500" /></button>
                </div>
                {/* Scrollable form body */}
                <div className="flex-1 overflow-y-auto p-6">
                  {tab === "article" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Article Name" required span2><input value={artForm.name} onChange={e => setArtForm(p => ({ ...p, name: e.target.value }))} placeholder="Article name" className={inputCls} /></Field>
                      <Field label="Description" span2><input value={artForm.description} onChange={e => setArtForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description" className={inputCls} /></Field>
                      <Field label="Unit" required><input value={artForm.unit} onChange={e => setArtForm(p => ({ ...p, unit: e.target.value }))} placeholder="Box, Bale, Drum..." className={inputCls} /></Field>
                      <Field label="Fragile">
                        <Sel value={artForm.fragile ? "yes" : "no"} onChange={v => setArtForm(p => ({ ...p, fragile: v === "yes" }))} options={["no", "yes"]} placeholder="Select" />
                      </Field>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Station Name" required span2><input value={stnForm.name} onChange={e => setStnForm(p => ({ ...p, name: e.target.value }))} placeholder="Station name" className={inputCls} /></Field>
                      <Field label="City" required><input value={stnForm.city} onChange={e => setStnForm(p => ({ ...p, city: e.target.value }))} placeholder="City" className={inputCls} /></Field>
                      <Field label="State" required><input value={stnForm.state} onChange={e => setStnForm(p => ({ ...p, state: e.target.value }))} placeholder="State" className={inputCls} /></Field>
                      <Field label="Type"><Sel value={stnForm.type} onChange={v => setStnForm(p => ({ ...p, type: v }))} options={["Branch", "Booking Point", "Delivery Point"]} placeholder="Type" /></Field>
                      <Field label="Pincode"><input value={stnForm.pincode} onChange={e => setStnForm(p => ({ ...p, pincode: e.target.value }))} placeholder="6-digit pincode" className={inputCls} /></Field>
                      <Field label="Phone" span2><input value={stnForm.phone} onChange={e => setStnForm(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" className={inputCls} /></Field>
                    </div>
                  )}
                </div>
                {/* Sticky footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 sm:p-6 flex gap-3 shrink-0">
                  <button onClick={() => setShowForm(false)} className="flex-1 h-11 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="flex-1 h-11 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)" }}>
                    {tab === "article" ? "Save Article" : "Save Station"}
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      {/* Delete Modal */}
      <DeleteDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => setDeleteTarget(null)}
        title={`Delete ${tab === "article" ? "Article" : "Station"}`}
        message="Are you sure you want to delete this record? This action will permanently remove it."
        itemName={deleteTarget || ""}
      />
      </div>
    </div>
  )
}
