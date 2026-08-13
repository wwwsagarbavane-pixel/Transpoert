import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, MapPin, X, AlertTriangle, Edit2, Trash2 } from "lucide-react"
import { stationController } from "../controllers/stationController"
import { DBStation } from "../db/schema"
import AppModal, { DeleteDialog } from "../components/Modal"
import { AppPageHeader, AppToolbar, AppSearch, AppStatusBadge, AppActionButtons } from "../components/MasterListComponents"
import SearchDropdown from "../components/SearchDropdown"

const inputCls = "h-10 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 focus:bg-white transition-all font-normal"

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? "md:col-span-2 col-span-1" : ""}`}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}{required && <span className="text-indigo-500"> *</span>}</label>
      {children}
    </div>
  )
}

const emptyForm = { id: "", name: "", city: "", state: "", type: "Branch", pincode: "", phone: "", status: "active" as "active" | "inactive" }

export default function StationMaster() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [stationsList, setStationsList] = useState<DBStation[]>([])

  const loadStations = async () => {
    const list = await stationController.getStations()
    setStationsList(list)
  }

  useEffect(() => {
    loadStations()
  }, [])

  const set = (k: string) => (v: any) => setForm(p => ({ ...p, [k]: v }))
  const filtered = stationsList.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()) || (s.state && s.state.toLowerCase().includes(search.toLowerCase())))

  const handleEditStation = (s: DBStation) => {
    setEditingId(s.id)
    setForm({
      id: s.id,
      name: s.name,
      city: s.city || "",
      state: s.state || "",
      type: s.type || "Branch",
      pincode: s.pincode || "",
      phone: s.phone || "",
      status: (s.status as "active" | "inactive") || "active"
    })
    setShowForm(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await stationController.updateStation(editingId, form)
      } else {
        await stationController.addStation(form)
      }
      await loadStations()
      setShowForm(false)
      setEditingId(null)
      setForm({ ...emptyForm })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await stationController.deleteStation(deleteTarget)
    await loadStations()
    setDeleteTarget(null)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1140px] mx-auto px-6 py-6 space-y-5 pb-20 md:pb-6">

        {/* Page Header */}
        <AppPageHeader
          title="Station Master"
          subtitle="Manage booking stations, delivery hubs, and destination routing points"
          actionLabel="Add Station"
          onAction={() => { setEditingId(null); setForm({ ...emptyForm }); setShowForm(true) }}
        />

        {/* Toolbar & Search */}
        <AppToolbar totalCount={filtered.length}>
          <AppSearch
            value={search}
            onChange={setSearch}
            placeholder="Search station, city or state..."
          />
        </AppToolbar>

        {/* Data Table Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">STATION / BRANCH</th>
                  <th className="py-3.5 px-4">CITY & STATE</th>
                  <th className="py-3.5 px-4">HUB TYPE</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors h-14">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-400 font-mono">ID: {s.id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-gray-800">{s.city || "—"}</div>
                      <div className="text-xs text-gray-400">{s.state || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                        {s.type || "Branch"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <AppStatusBadge status={s.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <AppActionButtons
                        onEdit={() => handleEditStation(s)}
                        onDelete={() => setDeleteTarget(s.id)}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs font-normal text-gray-400">
                      No station records registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">{editingId ? "Edit Station / Branch" : "Create New Station"}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveForm(e); }} className="p-6 space-y-4">
                <Field label="Station / Branch Name *" required>
                  <input type="text" required value={form.name} onChange={e => set("name")(e.target.value)} placeholder="e.g. Pune Central Depot" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <input type="text" value={form.city} onChange={e => set("city")(e.target.value)} placeholder="Pune" className={inputCls} />
                  </Field>
                  <Field label="State">
                    <input type="text" value={form.state} onChange={e => set("state")(e.target.value)} placeholder="Maharashtra" className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Hub Type">
                    <SearchDropdown
                      value={form.type}
                      onChange={val => set("type")(val)}
                      options={["Branch", "Booking Point", "Delivery Point", "Transhipment Hub"]}
                      placeholder="Select hub type"
                    />
                  </Field>
                  <Field label="Status">
                    <SearchDropdown
                      value={form.status}
                      onChange={val => set("status")(val)}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive" }
                      ]}
                      placeholder="Select status"
                    />
                  </Field>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">
                    {saving ? "Saving..." : editingId ? "Update Station" : "Create Station"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <DeleteDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Station Record"
        message="Are you sure you want to remove this station from active registers?"
        itemName={stationsList.find(s => s.id === deleteTarget)?.name || ""}
      />
    </div>
  )
}
