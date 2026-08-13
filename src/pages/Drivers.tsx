import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Phone, X, AlertTriangle, ChevronDown, Eye, Edit2, Trash2, Save } from "lucide-react"
import { driverController, vehicleController } from "../controllers/masterControllers"
import { DBDriver } from "../db/schema"
import { companyContext } from "../services/companyContext"
import { DeleteDialog } from "../components/Modal"
import { AppPageHeader, AppToolbar, AppSearch, AppStatusBadge, AppActionButtons } from "../components/MasterListComponents"
import SearchDropdown from "../components/SearchDropdown"

const inputCls = "h-10 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 focus:bg-white transition-all font-normal"

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? "col-span-1 md:col-span-2" : ""}`}>
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

const emptyForm = { id: "", name: "", mobile: "", altMobile: "", license: "LIC-990011", licenseExpiry: "2029-12-31", aadhaar: "", address: "", emergency: "", vehicle: "", status: "active" as DBDriver["status"] }

export default function Drivers() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const [driversList, setDriversList] = useState<DBDriver[]>([])
  const [vehiclesList, setVehiclesList] = useState<string[]>([])

  const activeCompanyId = companyContext.getActiveCompanyId()

  const loadData = async () => {
    const [dList, vList] = await Promise.all([
      driverController.getDrivers(false, activeCompanyId),
      vehicleController.getVehicles(false, activeCompanyId)
    ])
    setDriversList(dList)
    setVehiclesList(vList.map(v => v.number))
  }

  useEffect(() => {
    loadData()
  }, [activeCompanyId])

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }))
  const filtered = driversList.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.mobile.includes(search) || (d.license && d.license.toLowerCase().includes(search.toLowerCase())))

  const handleEditDriver = (d: DBDriver) => {
    setEditingId(d.id)
    setForm({
      id: d.id,
      name: d.name,
      mobile: d.mobile || "",
      altMobile: d.altMobile || "",
      license: d.license || "LIC-990011",
      licenseExpiry: d.licenseExpiry || "2029-12-31",
      aadhaar: d.aadhaar || "",
      address: d.address || "",
      emergency: d.emergency || "",
      vehicle: d.vehicle || "",
      status: d.status || "active"
    })
    setShowForm(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await driverController.updateDriver(editingId, form, activeCompanyId)
      } else {
        await driverController.createDriver(form, activeCompanyId)
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
    await driverController.deleteDriver(deleteTarget, activeCompanyId)
    await loadData()
    setDeleteTarget(null)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-5 pb-20 md:pb-6">

        {/* Header */}
        <AppPageHeader
          title="Driver Master"
          subtitle="Manage commercial drivers, licensing details, and assigned vehicles"
          actionLabel="Add Driver"
          onAction={() => { setEditingId(null); setForm({ ...emptyForm }); setShowForm(true) }}
        />

        {/* Toolbar & Search */}
        <AppToolbar totalCount={filtered.length}>
          <AppSearch
            value={search}
            onChange={setSearch}
            placeholder="Search driver name, mobile or license..."
          />
        </AppToolbar>

        {/* Search & Table Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">DRIVER NAME</th>
                  <th className="py-3.5 px-4">MOBILE PHONE</th>
                  <th className="py-3.5 px-4">LICENSE NO.</th>
                  <th className="py-3.5 px-4">ASSIGNED VEHICLE</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/50 transition-colors h-14">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{d.name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">{d.mobile || "—"}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">{d.license || "—"}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-indigo-600 font-bold">{d.vehicle || "Unassigned"}</td>
                    <td className="py-3.5 px-4">
                      <AppStatusBadge status={d.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <AppActionButtons
                        onEdit={() => handleEditDriver(d)}
                        onDelete={() => setDeleteTarget(d.id)}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs font-normal text-gray-400">
                      No driver records registered.
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
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-gray-900">{editingId ? `Edit Driver: ${form.name}` : "Create New Driver Record"}</h3>
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

                <Field label="Driver Full Name *" required>
                  <input type="text" required value={form.name} onChange={e => set("name")(e.target.value)} placeholder="e.g. Suresh Kumar" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mobile Phone Number *" required>
                    <input type="tel" required value={form.mobile} onChange={e => set("mobile")(e.target.value)} placeholder="98200XXXXX" className={inputCls} />
                  </Field>
                  <Field label="Driving License Number">
                    <input type="text" value={form.license} onChange={e => set("license")(e.target.value.toUpperCase())} placeholder="MH-12-2020-00123" className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Assigned Vehicle">
                    <Sel options={vehiclesList} placeholder="Assign Vehicle" value={form.vehicle} onChange={set("vehicle")} />
                  </Field>
                  <Field label="Status">
                    <SearchDropdown
                      value={form.status}
                      onChange={val => set("status")(val)}
                      options={[
                        { value: "active", label: "Available" },
                        { value: "inactive", label: "Inactive" }
                      ]}
                      placeholder="Select status"
                    />
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
                    {editingId ? <><Save size={15} /> {saving ? "Updating..." : "Update Driver Record"}</> : <><Plus size={15} /> {saving ? "Creating..." : "Create Driver Record"}</>}
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
        title="Delete Driver Record"
        message="Are you sure you want to remove this driver from active registers?"
        itemName={driversList.find(d => d.id === deleteTarget)?.name || ""}
      />
    </div>
  )
}
