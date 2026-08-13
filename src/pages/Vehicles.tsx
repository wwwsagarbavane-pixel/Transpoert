import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, AlertTriangle, X, ChevronDown, Eye, Upload, FileText, CheckCircle2, Edit2, Trash2, Truck, Save } from "lucide-react"
import { vehicleController, driverController, ownerController } from "../controllers/masterControllers"
import { DBVehicle } from "../db/schema"
import { companyContext } from "../services/companyContext"
import { DeleteDialog } from "../components/Modal"
import { AppPageHeader, AppToolbar, AppSearch, AppStatusBadge, AppActionButtons } from "../components/MasterListComponents"
import SearchDropdown from "../components/SearchDropdown"

const vehicleTypes = ["Trailer", "10-Wheeler", "6-Wheeler", "4-Wheeler", "Mini Truck"]
const inputCls = "h-10 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 focus:bg-white transition-all font-normal"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
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

const emptyForm = { id: "", number: "", type: "Trailer", capacity: "18T", owner: "In-house Fleet", driver: "Unassigned", gpsId: "", status: "active" as DBVehicle["status"] }

export default function Vehicles() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewVehicle, setViewVehicle] = useState<DBVehicle | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [vehiclesList, setVehiclesList] = useState<DBVehicle[]>([])
  const [ownersList, setOwnersList] = useState<string[]>([])
  const [driversList, setDriversList] = useState<string[]>([])

  const activeCompanyId = companyContext.getActiveCompanyId()

  const loadData = async () => {
    const [vList, oList, dList] = await Promise.all([
      vehicleController.getVehicles(false, activeCompanyId),
      ownerController.getOwners(false, activeCompanyId),
      driverController.getDrivers(false, activeCompanyId)
    ])
    setVehiclesList(vList)
    setOwnersList(oList.map(o => o.name))
    setDriversList(dList.map(d => d.name))
  }

  useEffect(() => {
    loadData()
  }, [activeCompanyId])

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }))
  const filtered = vehiclesList.filter(v => !search || v.number.toLowerCase().includes(search.toLowerCase()) || (v.driver && v.driver.toLowerCase().includes(search.toLowerCase())) || (v.owner && v.owner.toLowerCase().includes(search.toLowerCase())))

  const handleEditVehicle = (v: DBVehicle) => {
    setEditingId(v.id)
    setForm({
      id: v.id,
      number: v.number,
      type: v.type || "Trailer",
      capacity: v.capacity || "18T",
      owner: v.owner || "In-house Fleet",
      driver: v.driver || "Unassigned",
      gpsId: v.gpsId || "",
      status: (v.status as "active" | "maintenance" | "idle" | "out_of_service") || "active"
    })
    setShowForm(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await vehicleController.updateVehicle(editingId, form, activeCompanyId)
      } else {
        await vehicleController.createVehicle(form, activeCompanyId)
      }
      await loadData()
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
    await vehicleController.deleteVehicle(deleteTarget, activeCompanyId)
    await loadData()
    setDeleteTarget(null)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-5 pb-20 md:pb-6">

        {/* Header */}
        <AppPageHeader
          title="Vehicle Master"
          subtitle="Manage company fleet vehicles, carrying capacity, assigned drivers, and vehicle owners"
          actionLabel="Add Vehicle"
          onAction={() => { setEditingId(null); setForm({ ...emptyForm }); setShowForm(true) }}
        />

        {/* Toolbar & Search */}
        <AppToolbar totalCount={filtered.length}>
          <AppSearch
            value={search}
            onChange={setSearch}
            placeholder="Search vehicle number, driver or owner..."
          />
        </AppToolbar>

        {/* Table Container Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">VEHICLE NUMBER</th>
                  <th className="py-3.5 px-4">TYPE & CAPACITY</th>
                  <th className="py-3.5 px-4">ASSIGNED DRIVER</th>
                  <th className="py-3.5 px-4">OWNER</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                {filtered.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors h-14">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{v.number}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                        {v.type} ({v.capacity})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">{v.driver || "Unassigned"}</td>
                    <td className="py-3.5 px-4 text-gray-600">{v.owner || "In-house Fleet"}</td>
                    <td className="py-3.5 px-4">
                      <AppStatusBadge status={v.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <AppActionButtons
                        onEdit={() => handleEditVehicle(v)}
                        onDelete={() => setDeleteTarget(v.id)}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs font-normal text-gray-400">
                      No vehicle records registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-gray-900">{editingId ? `Edit Vehicle: ${form.number}` : "Create New Vehicle Record"}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {editingId ? "EDITING RECORD" : "NEW RECORD"}
                  </span>
                </div>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveForm(e); }} className="p-6 space-y-4">
                
                {/* Record Audit Metadata for EDIT Mode */}
                {editingId && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs font-mono text-gray-500">
                    <div>RECORD ID: <span className="font-bold text-indigo-600">{form.id}</span></div>
                    <div>STATUS: <span className="font-bold text-indigo-600 uppercase">{form.status}</span></div>
                  </div>
                )}

                <Field label="Vehicle Registration Number *" required>
                  <input type="text" required value={form.number} onChange={e => set("number")(e.target.value.toUpperCase())} placeholder="e.g. MH-12-AB-3456" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Vehicle Body Type">
                    <Sel options={vehicleTypes} placeholder="Select Type" value={form.type} onChange={set("type")} />
                  </Field>
                  <Field label="Carrying Capacity">
                    <input type="text" value={form.capacity} onChange={e => set("capacity")(e.target.value)} placeholder="18T" className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Assigned Driver">
                    <Sel options={driversList} placeholder="Assign Driver" value={form.driver} onChange={set("driver")} />
                  </Field>
                  <Field label="Vehicle Owner">
                    <Sel options={ownersList} placeholder="Select Owner" value={form.owner} onChange={set("owner")} />
                  </Field>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 h-10 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {editingId ? <><Save size={15} /> {saving ? "Updating..." : "Update Vehicle Record"}</> : <><Plus size={15} /> {saving ? "Creating..." : "Create Vehicle Record"}</>}
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
        title="Delete Vehicle Record"
        message="Are you sure you want to remove this vehicle from active registers?"
        itemName={vehiclesList.find(v => v.id === deleteTarget)?.number || ""}
      />
    </div>
  )
}
