import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Plus, Building2, X, AlertTriangle, ChevronDown, Eye, Mail, Phone, MapPin, CreditCard, Clock, FileText, Edit2, Trash2, Save } from "lucide-react"
import { partyController } from "../controllers/partyController"
import { companyContext } from "../services/companyContext"
import { DBParty } from "../db/schema"
import AppModal, { DeleteDialog } from "../components/Modal"
import { AppPageHeader, AppToolbar, AppSearch, AppStatusBadge, AppActionButtons } from "../components/MasterListComponents"
import { lrRecords, billingRecords } from "../data/mockData"
import SearchDropdown from "../components/SearchDropdown"

const inputCls = "h-10 w-full bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 focus:bg-white transition-all font-normal"

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? "md:col-span-2 col-span-1" : "col-span-1"}`}>
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

const emptyForm = {
  id: "",
  name: "",
  type: "Consignor",
  gstin: "",
  gst: "",
  pan: "",
  mobile: "",
  phone: "",
  email: "",
  contactPerson: "",
  credit_days: "30",
  creditLimit: "500000",
  address_type: "Both",
  billingAddress: "",
  shippingAddress: "",
  paymentTerms: "30 Days",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001",
  status: "active" as "active" | "inactive"
}

export default function Parties() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewParty, setViewParty] = useState<DBParty | null>(null)
  const [detailTab, setDetailTab] = useState<"general" | "addresses" | "lrs" | "bills" | "outstanding">("general")
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [partiesList, setPartiesList] = useState<DBParty[]>([])

  const loadParties = async () => {
    const list = await partyController.getParties()
    setPartiesList(list)
  }

  useEffect(() => {
    loadParties()
  }, [])

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const filtered = partiesList.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    ((p.gstin || p.gst) && (p.gstin || p.gst)?.includes(search)) ||
    (p.city && p.city.toLowerCase().includes(search.toLowerCase())) ||
    (p.contactPerson && p.contactPerson.toLowerCase().includes(search.toLowerCase()))
  )

  const partyLrs = viewParty ? lrRecords.filter(r => r.consignor === viewParty.name || r.consignee === viewParty.name) : []
  const partyBills = viewParty ? billingRecords.filter(b => b.party === viewParty.name) : []
  const outstandingBills = partyBills.filter(b => b.outstanding > 0)

  const handleEditParty = (p: DBParty) => {
    setEditingId(p.id)
    setForm({
      id: p.id,
      name: p.name,
      type: p.type || "Consignor",
      gstin: p.gstin || p.gst || "",
      gst: p.gstin || p.gst || "",
      pan: p.pan || "",
      mobile: p.mobile || p.phone || "",
      phone: p.mobile || p.phone || "",
      email: p.email || "",
      contactPerson: p.contactPerson || "",
      credit_days: String(p.credit_days || 30),
      creditLimit: String(p.creditLimit || 500000),
      address_type: p.address_type || "Both",
      billingAddress: p.billingAddress || "",
      shippingAddress: p.shippingAddress || "",
      paymentTerms: p.paymentTerms || "30 Days",
      city: p.city || "",
      state: p.state || "",
      pincode: p.pincode || "",
      status: (p.status === 1 || p.status === "active") ? "active" : "inactive"
    })
    setShowForm(true)
  }

  const [errorMsg, setErrorMsg] = useState("")

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    const cleanName = form.name.trim()
    const cleanGstin = form.gstin.trim().toUpperCase()
    const cleanPan = form.pan.trim().toUpperCase()
    const cleanMobile = form.mobile.trim()

    if (!cleanName) { setErrorMsg("Party Name is required"); return }
    if (!cleanMobile) { setErrorMsg("Mobile Number is required"); return }

    // 1. Mobile Format Validation (10 digits)
    if (!/^\d{10}$/.test(cleanMobile)) {
      setErrorMsg("Mobile number must be a valid 10-digit number (e.g. 9820011223)")
      return
    }

    // 2. GSTIN Format Validation
    if (cleanGstin && cleanGstin.length !== 15) {
      setErrorMsg("GSTIN must be a valid 15-character GSTIN number (e.g. 27AABCM1234A1Z5)")
      return
    }

    // 3. PAN Format Validation
    if (cleanPan && cleanPan.length !== 10) {
      setErrorMsg("PAN must be a valid 10-character PAN number (e.g. AABCM1234A)")
      return
    }

    // 4. Duplicate Party & Unique GSTIN Validation
    const dupName = partiesList.find(p => p.id !== editingId && p.name.toLowerCase() === cleanName.toLowerCase())
    if (dupName) {
      setErrorMsg(`Party with name "${cleanName}" already exists in database`)
      return
    }

    if (cleanGstin) {
      const dupGst = partiesList.find(p => p.id !== editingId && ((p.gstin && p.gstin.toUpperCase() === cleanGstin) || (p.gst && p.gst.toUpperCase() === cleanGstin)))
      if (dupGst) {
        setErrorMsg(`GSTIN "${cleanGstin}" is already registered to party "${dupGst.name}"`)
        return
      }
    }

    setSaving(true)
    try {
      const activeCompanyId = companyContext.getActiveCompanyId()
      const payload = {
        ...form,
        company_id: activeCompanyId,
        name: cleanName,
        gstin: cleanGstin,
        gst: cleanGstin,
        pan: cleanPan,
        mobile: cleanMobile,
        phone: cleanMobile,
        credit_days: parseInt(form.credit_days, 10) || 30,
        creditLimit: parseFloat(form.creditLimit) || 500000
      }
      if (editingId) {
        await partyController.updateParty(editingId, payload, activeCompanyId)
      } else {
        await partyController.addParty(payload, activeCompanyId)
      }
      await loadParties()
      setShowForm(false)
      setEditingId(null)
      setForm({ ...emptyForm })
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save party record")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await partyController.deleteParty(deleteTarget)
    await loadParties()
    setDeleteTarget(null)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-5 pb-20 md:pb-6">

        {/* Page Header */}
        <AppPageHeader
          title="Parties Master"
          subtitle="Customer CRM register containing consignors, consignees and billing parties"
          actionLabel="Add Party"
          onAction={() => { setEditingId(null); setForm({ ...emptyForm }); setShowForm(true) }}
        />

        {/* Toolbar & Search */}
        <AppToolbar totalCount={filtered.length}>
          <AppSearch
            value={search}
            onChange={setSearch}
            placeholder="Search by party name, city, GSTIN or contact person..."
          />
        </AppToolbar>

        {/* Table Container Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">PARTY NAME</th>
                  <th className="py-3.5 px-4">GSTIN</th>
                  <th className="py-3.5 px-4">CONTACT PERSON</th>
                  <th className="py-3.5 px-4">PHONE</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-normal">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer h-14" onClick={() => setViewParty(p)}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-400 font-normal">{p.city || "Headquarters"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">{p.gst || "—"}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">{p.contactPerson || p.name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">{p.phone || "—"}</td>
                    <td className="py-3.5 px-4">
                      <AppStatusBadge status={(p.status === 1 || p.status === "active") ? "active" : "inactive"} />
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <AppActionButtons
                        onView={() => setViewParty(p)}
                        onEdit={() => handleEditParty(p)}
                        onDelete={() => setDeleteTarget(p.id)}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs font-normal text-gray-400">
                      No customer party records registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add / Edit Party Modal */}
      <AppModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit Party" : "Create Party"}
        subtitle={editingId ? `Edit master data for ${form.name}` : "Add a new customer party to the system"}
        icon={<Building2 size={16} />}
        maxWidth="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveForm(e); }} className="space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Sub-sections layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Basic Information */}
            <div className="col-span-1 md:col-span-2 pb-1.5 border-b border-gray-100 flex items-center">
              <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">Basic Information</span>
            </div>

            <Field label="Party Name" required span2>
              <input type="text" required value={form.name} onChange={e => set("name")(e.target.value)} placeholder="e.g. Acme Traders Ltd" className={inputCls} />
            </Field>

            <Field label="GSTIN">
              <input type="text" maxLength={20} value={form.gstin} onChange={e => set("gstin")(e.target.value.toUpperCase())} placeholder="27AABCM1234A1Z5" className={inputCls} />
            </Field>

            <Field label="PAN">
              <input type="text" maxLength={20} value={form.pan} onChange={e => set("pan")(e.target.value.toUpperCase())} placeholder="AABCM1234A" className={inputCls} />
            </Field>

            {/* Contact */}
            <div className="col-span-1 md:col-span-2 mt-2 pb-1.5 border-b border-gray-100 flex items-center">
              <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">Contact</span>
            </div>

            <Field label="Mobile Number" required>
              <input type="tel" maxLength={20} required value={form.mobile} onChange={e => set("mobile")(e.target.value)} placeholder="98200XXXXX" className={inputCls} />
            </Field>

             <Field label="Credit Days">
               <SearchDropdown
                 value={form.credit_days}
                 onChange={val => set("credit_days")(val)}
                 options={[
                   { value: "7", label: "7 Days" },
                   { value: "15", label: "15 Days" },
                   { value: "30", label: "30 Days" },
                   { value: "45", label: "45 Days" },
                   { value: "60", label: "60 Days" },
                   { value: "90", label: "90 Days" },
                   { value: "120", label: "120 Days" }
                 ]}
                 placeholder="Select credit days"
               />
             </Field>
 
             {/* Address */}
             <div className="col-span-1 md:col-span-2 mt-2 pb-1.5 border-b border-gray-100 flex items-center">
               <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">Address</span>
             </div>
 
             <Field label="Address Type">
               <SearchDropdown
                 value={form.address_type}
                 onChange={val => set("address_type")(val)}
                 options={[
                   { value: "Both", label: "Both (Billing & Shipping)" },
                   { value: "Billing Address", label: "Billing Address" },
                   { value: "Shipping Address", label: "Shipping Address" },
                   { value: "Registered HQ", label: "Registered HQ" }
                 ]}
                 placeholder="Select address type"
               />
             </Field>

            <Field label="Address" span2>
              <input
                type="text"
                value={form.billingAddress}
                onChange={e => {
                  const val = e.target.value
                  setForm(prev => ({ ...prev, billingAddress: val, shippingAddress: val }))
                }}
                placeholder="Street / Plot No"
                className={inputCls}
              />
            </Field>

            <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-3">
              <Field label="City">
                <input type="text" value={form.city} onChange={e => set("city")(e.target.value)} placeholder="Mumbai" className={inputCls} />
              </Field>
              <Field label="State">
                <input type="text" value={form.state} onChange={e => set("state")(e.target.value)} placeholder="Maharashtra" className={inputCls} />
              </Field>
              <Field label="Pincode">
                <input type="text" maxLength={10} value={form.pincode} onChange={e => set("pincode")(e.target.value)} placeholder="400001" className={inputCls} />
              </Field>
            </div>

            {/* Business */}
            <div className="col-span-1 md:col-span-2 mt-2 pb-1.5 border-b border-gray-100 flex items-center">
              <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">Business</span>
            </div>

             <Field label="Status">
               <SearchDropdown
                 value={form.status}
                 onChange={val => set("status")(val as any)}
                 options={[
                   { value: "active", label: "Active" },
                   { value: "inactive", label: "Inactive" }
                 ]}
                 placeholder="Select status"
               />
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
              {saving ? "Saving..." : (editingId ? "Update Party" : "Create Party")}
            </button>
          </div>
        </form>
      </AppModal>

      {/* Delete Modal */}
      <DeleteDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Party Record"
        message="Are you sure you want to remove this party from active registers?"
        itemName={partiesList.find(p => p.id === deleteTarget)?.name || ""}
      />
    </div>
  )
}
