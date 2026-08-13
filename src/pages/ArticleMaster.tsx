import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Package, X, AlertTriangle, Edit2, Trash2 } from "lucide-react"
import { articleController } from "../controllers/articleController"
import { DBArticle } from "../db/schema"
import { companyContext } from "../services/companyContext"
import { DeleteDialog } from "../components/Modal"
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

const emptyForm = { id: "", name: "", unit: "Box", description: "", fragile: false, status: "active" as "active" | "inactive" }

export default function ArticleMaster() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [articlesList, setArticlesList] = useState<DBArticle[]>([])

  const activeCompanyId = companyContext.getActiveCompanyId()

  const loadArticles = async () => {
    const list = await articleController.getArticles(false, activeCompanyId)
    setArticlesList(list)
  }

  useEffect(() => {
    loadArticles()
  }, [activeCompanyId])

  const set = (k: string) => (v: any) => setForm(p => ({ ...p, [k]: v }))
  const filtered = articlesList.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.description && a.description.toLowerCase().includes(search.toLowerCase())))

  const handleEditArticle = (a: DBArticle) => {
    setEditingId(a.id)
    setForm({
      id: a.id,
      name: a.name,
      unit: a.unit || "Box",
      description: a.description || "",
      fragile: a.fragile || false,
      status: (a.status as "active" | "inactive") || "active"
    })
    setShowForm(true)
  }

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await articleController.updateArticle(editingId, form, activeCompanyId)
      } else {
        await articleController.addArticle(form, activeCompanyId)
      }
      await loadArticles()
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
    await articleController.deleteArticle(deleteTarget, activeCompanyId)
    await loadArticles()
    setDeleteTarget(null)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1140px] mx-auto px-6 py-6 space-y-5 pb-20 md:pb-6">

        {/* Header */}
        <AppPageHeader
          title="Article Master"
          subtitle="Manage goods commodity types, unit packaging standards, and descriptions"
          actionLabel="Add Article"
          onAction={() => { setEditingId(null); setForm({ ...emptyForm }); setShowForm(true) }}
        />

        {/* Toolbar & Search */}
        <AppToolbar totalCount={filtered.length}>
          <AppSearch
            value={search}
            onChange={setSearch}
            placeholder="Search article name or description..."
          />
        </AppToolbar>

        {/* Search & Table Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">ARTICLE NAME</th>
                  <th className="py-3.5 px-4">UNIT TYPE</th>
                  <th className="py-3.5 px-4">DESCRIPTION</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                {filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors h-14">
                    <td className="py-3.5 px-4 font-bold text-gray-900">{a.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                        {a.unit || "Box"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500">{a.description || "—"}</td>
                    <td className="py-3.5 px-4">
                      <AppStatusBadge status={a.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <AppActionButtons
                        onEdit={() => handleEditArticle(a)}
                        onDelete={() => setDeleteTarget(a.id)}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs font-normal text-gray-400">
                      No article records registered.
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
                <h3 className="text-base font-semibold text-gray-900">{editingId ? "Edit Article Record" : "Create New Article"}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveForm} className="p-6 space-y-4">
                <Field label="Article Name *" required>
                  <input type="text" required value={form.name} onChange={e => set("name")(e.target.value)} placeholder="e.g. Cotton Bales" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Unit Type">
                    <SearchDropdown
                      value={form.unit}
                      onChange={val => set("unit")(val)}
                      options={["Box", "Bale", "Carton", "Unit", "Drum", "Kg"]}
                      placeholder="Select unit type"
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
                <Field label="Description">
                  <input type="text" value={form.description} onChange={e => set("description")(e.target.value)} placeholder="Short packaging description" className={inputCls} />
                </Field>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-10 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 h-10 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
                    {saving ? "Saving..." : editingId ? "Update Article" : "Save Article"}
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
        title="Delete Article Record"
        message="Are you sure you want to remove this article type from active registers?"
        itemName={articlesList.find(a => a.id === deleteTarget)?.name || ""}
      />
    </div>
  )
}
