import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, X, AlertTriangle, UserCheck, Edit2, Trash2 } from "lucide-react"
import { agentController } from "../controllers/masterControllers"
import { DBAgent } from "../db/schema"
import { companyContext } from "../services/companyContext"
import { DeleteDialog } from "../components/Modal"
import { AppPageHeader, AppToolbar, AppSearch, AppStatusBadge, AppActionButtons } from "../components/MasterListComponents"

const inputCls = "h-10 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 focus:bg-white transition-all font-normal"

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? "md:col-span-2 col-span-1" : ""}`}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}{required && <span className="text-indigo-500"> *</span>}</label>
      {children}
    </div>
  )
}

const emptyForm = { id: "", name: "", contact: "", mobile: "", city: "Mumbai", state: "Maharashtra", commission: "5%", status: "active" as "active" | "inactive" }

export default function Agents() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [agentsList, setAgentsList] = useState<DBAgent[]>([])

  const activeCompanyId = companyContext.getActiveCompanyId()

  const loadAgents = async () => {
    const list = await agentController.getAgents(false, activeCompanyId)
    setAgentsList(list)
  }

  useEffect(() => {
    loadAgents()
  }, [activeCompanyId])

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }))
  const filtered = agentsList.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.city && a.city.toLowerCase().includes(search.toLowerCase())) || (a.mobile || "").includes(search))

  const handleEditAgent = (a: DBAgent) => {
    setEditingId(a.id)
    setForm({
      id: a.id,
      name: a.name,
      contact: a.contact || "",
      mobile: a.mobile || "",
      city: a.city || "Mumbai",
      state: a.state || "Maharashtra",
      commission: a.commission || "5%",
      status: (a.status as "active" | "inactive") || "active"
    })
    setShowForm(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await agentController.updateAgent(editingId, form, activeCompanyId)
      } else {
        await agentController.createAgent(form, activeCompanyId)
      }
      await loadAgents()
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
    await agentController.deleteAgent(deleteTarget, activeCompanyId)
    await loadAgents()
    setDeleteTarget(null)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1140px] mx-auto px-6 py-6 space-y-5 pb-20 md:pb-6">

        {/* Header */}
        <AppPageHeader
          title="Agent Master"
          subtitle="Manage commission agents, broker contacts, and commission percentage rates"
          actionLabel="Add Agent"
          onAction={() => { setEditingId(null); setForm({ ...emptyForm }); setShowForm(true) }}
        />

        {/* Toolbar & Search */}
        <AppToolbar totalCount={filtered.length}>
          <AppSearch
            value={search}
            onChange={setSearch}
            placeholder="Search agent name, city or phone..."
          />
        </AppToolbar>

        {/* Search & Table Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">AGENT NAME</th>
                  <th className="py-3.5 px-4">CITY & STATE</th>
                  <th className="py-3.5 px-4">CONTACT PHONE</th>
                  <th className="py-3.5 px-4">COMMISSION RATE</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors h-14">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{a.name}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">{a.city || "Mumbai"}, {a.state || "Maharashtra"}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">{a.mobile || "—"}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{a.commission || "5%"}</td>
                    <td className="py-3.5 px-4">
                      <AppStatusBadge status={a.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <AppActionButtons
                        onEdit={() => handleEditAgent(a)}
                        onDelete={() => setDeleteTarget(a.id)}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs font-normal text-gray-400">
                      No agent records registered.
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
                <h3 className="text-base font-semibold text-gray-900">{editingId ? "Edit Agent Record" : "Create New Agent"}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSaveForm(e); }} className="p-6 space-y-4">
                <Field label="Agent Agency / Full Name *" required>
                  <input type="text" required value={form.name} onChange={e => set("name")(e.target.value)} placeholder="e.g. Western Agents" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact Phone">
                    <input type="tel" value={form.mobile} onChange={e => set("mobile")(e.target.value)} placeholder="98200XXXXX" className={inputCls} />
                  </Field>
                  <Field label="Commission Rate">
                    <input type="text" value={form.commission} onChange={e => set("commission")(e.target.value)} placeholder="5%" className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <input type="text" value={form.city} onChange={e => set("city")(e.target.value)} placeholder="Mumbai" className={inputCls} />
                  </Field>
                  <Field label="State">
                    <input type="text" value={form.state} onChange={e => set("state")(e.target.value)} placeholder="Maharashtra" className={inputCls} />
                  </Field>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
                    {saving ? "Saving..." : editingId ? "Update Agent" : "Save Agent"}
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
        title="Delete Agent Record"
        message="Are you sure you want to remove this commission agent from active registers?"
        itemName={agentsList.find(a => a.id === deleteTarget)?.name || ""}
      />
    </div>
  )
}
