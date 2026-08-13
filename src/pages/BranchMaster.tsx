import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Plus, Building, Eye, Edit2, Trash2, Save } from "lucide-react"
import { dbQuery } from "../db/db"
import { companyRepository, branchRepository } from "../repositories/repositories"
import { companyContext } from "../services/companyContext"
import AppModal, { DeleteDialog } from "../components/Modal"
import { AppPageHeader, AppToolbar, AppSearch, AppActionButtons } from "../components/MasterListComponents"

interface DBBranch {
  id: string
  company_id: string
  code: string
  name: string
  lr_prefix: string
  lr_next_no: number
  city?: string
  state?: string
  type?: string
  status?: string
  createdAt?: string
  updatedAt?: string
}

const inputCls = "h-10 w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 focus:bg-white transition-all font-medium"

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? "md:col-span-2 col-span-1" : "col-span-1"}`}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{required && <span className="text-indigo-500"> *</span>}
      </label>
      {children}
    </div>
  )
}

const emptyForm = {
  id: "",
  code: "",
  name: "",
  lr_prefix: "",
  lr_next_no: "1"
}

export default function BranchMaster() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [viewBranch, setViewBranch] = useState<DBBranch | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [branchesList, setBranchesList] = useState<DBBranch[]>([])

  const activeCompId = companyContext.getActiveCompanyId() || "COMP-DEMO-001"

  const loadBranches = async () => {
    try {
      const compBranches = await branchRepository.findAll(activeCompId)
      setBranchesList(compBranches || [])
    } catch (err) {
      console.error("Failed to load branches:", err)
    }
  }

  useEffect(() => {
    loadBranches()
  }, [activeCompId])

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const filtered = branchesList.filter(b =>
    !search ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase()) ||
    (b.lr_prefix && b.lr_prefix.toLowerCase().includes(search.toLowerCase()))
  )

  const handleEditBranch = (b: DBBranch) => {
    setEditingId(b.id)
    setForm({
      id: b.id,
      code: b.code || "",
      name: b.name || "",
      lr_prefix: b.lr_prefix || (b as any).lrPrefix || "",
      lr_next_no: String(b.lr_next_no || (b as any).nextLrNumber || 1)
    })
    setShowForm(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.code.trim() || !form.lr_prefix.trim()) return

    setSaving(true)
    try {
      const lrPref = form.lr_prefix.trim().toUpperCase()
      const nextNum = parseInt(form.lr_next_no, 10) || 1

      if (editingId) {
        const record = {
          id: editingId,
          company_id: activeCompId,
          code: form.code.trim(),
          name: form.name.trim(),
          lrPrefix: lrPref,
          lr_prefix: lrPref,
          nextLrNumber: nextNum,
          lr_next_no: nextNum,
          city: form.name.trim() || "Main",
          state: "Maharashtra",
          type: "Branch",
          status: "active",
          updatedAt: new Date().toISOString()
        }
        await branchRepository.update(editingId, record)
      } else {
        const newId = `BR-${Date.now()}`
        const record = {
          id: newId,
          company_id: activeCompId,
          code: form.code.trim(),
          name: form.name.trim(),
          lrPrefix: lrPref,
          lr_prefix: lrPref,
          nextLrNumber: nextNum,
          lr_next_no: nextNum,
          city: form.name.trim() || "Main",
          state: "Maharashtra",
          type: "Branch",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        await branchRepository.create(record)
      }

      await loadBranches()
      setShowForm(false)
      setEditingId(null)
      setForm({ ...emptyForm })
    } catch (err) {
      console.error("Save branch error:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await branchRepository.delete(deleteTarget)
    await loadBranches()
    setDeleteTarget(null)
  }

  return (
    <div className="flex-1 overflow-y-auto font-sans bg-[#F8FAFC]">
      <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-6 space-y-5 pb-20 md:pb-6">

        {/* Page Header */}
        <AppPageHeader
          title="Branch Master"
          subtitle="Manage all company branch offices, LR prefixes, and numbering series"
          actionLabel="Add New Branch"
          onAction={() => { setEditingId(null); setForm({ ...emptyForm }); setShowForm(true) }}
        />

        {/* Toolbar & Search */}
        <AppToolbar totalCount={filtered.length}>
          <AppSearch
            value={search}
            onChange={setSearch}
            placeholder="Search by branch code, name, prefix..."
          />
        </AppToolbar>

        {/* Data Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">CODE</th>
                  <th className="py-3.5 px-4">BRANCH NAME</th>
                  <th className="py-3.5 px-4">LR PREFIX</th>
                  <th className="py-3.5 px-4">NEXT LR RUNNING NO</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors h-14">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{b.code}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-900">{b.name}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-800">{b.lr_prefix || "—"}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-800">{b.lr_next_no || "1"}</td>
                    <td className="py-3.5 px-4 text-right">
                      <AppActionButtons
                        onView={() => setViewBranch(b)}
                        onEdit={() => handleEditBranch(b)}
                        onDelete={() => setDeleteTarget(b.id)}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs font-normal text-gray-400">
                      No branch records registered for this company.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CREATE vs EDIT Modal */}
      <AppModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Branch" : "Create Branch"}
        subtitle={editingId ? `Edit master data for ${form.name}` : "Add a new branch office to the system"}
        icon={<Building size={16} />}
        maxWidth="md"
      >
        <form onSubmit={handleSaveForm} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="col-span-1 md:col-span-2 pb-1.5 border-b border-gray-100 flex items-center">
              <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">Branch Details</span>
            </div>

            <Field label="Branch Name" required span2>
              <input type="text" required value={form.name} onChange={e => set("name")(e.target.value)} placeholder="e.g. Pune Central Depot" className={inputCls} />
            </Field>

            <Field label="Branch Code" required>
              <input type="text" required value={form.code} onChange={e => set("code")(e.target.value)} placeholder="BR-PUN-01" className={inputCls} />
            </Field>

            <Field label="LR Prefix" required>
              <input type="text" required value={form.lr_prefix} onChange={e => set("lr_prefix")(e.target.value.toUpperCase())} placeholder="PUN" className={inputCls} />
            </Field>

            <Field label="Next LR Running Number" required>
              <input type="number" required value={form.lr_next_no} onChange={e => set("lr_next_no")(e.target.value)} placeholder="1" className={inputCls} />
            </Field>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="h-10 px-5 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save size={15} />
              {saving ? "Saving..." : (editingId ? "Update Branch" : "Create Branch")}
            </button>
          </div>
        </form>
      </AppModal>

      {/* VIEW MODAL */}
      <AppModal
        isOpen={!!viewBranch}
        onClose={() => setViewBranch(null)}
        title={viewBranch?.name || ""}
        subtitle={viewBranch ? `Code: ${viewBranch.code}` : ""}
        icon={<Building size={16} />}
        maxWidth="sm"
      >
        {viewBranch && (
          <div className="space-y-4 pt-1">
            <div className="space-y-2 text-xs text-gray-700">
              <div><span className="font-semibold text-gray-500">Branch Name:</span> {viewBranch.name}</div>
              <div><span className="font-semibold text-gray-500">Branch Code:</span> {viewBranch.code}</div>
              <div><span className="font-semibold text-gray-500">LR Prefix:</span> {viewBranch.lr_prefix || "—"}</div>
              <div><span className="font-semibold text-gray-500">Next LR Running No:</span> {viewBranch.lr_next_no || "1"}</div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button onClick={() => setViewBranch(null)} className="w-full h-[42px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer">
                Close Window
              </button>
            </div>
          </div>
        )}
      </AppModal>

      {/* DELETE MODAL */}
      <DeleteDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Branch Record"
        message="Are you sure you want to delete this branch from your company master database?"
        itemName={branchesList.find(b => b.id === deleteTarget)?.name || ""}
      />

    </div>
  )
}
