import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Building, Save, CheckCircle2 } from "lucide-react"
import { dbQuery } from "../db/db"
import { companyRepository } from "../repositories/repositories"
import { companyContext } from "../services/companyContext"

const inputCls = "h-11 w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 focus:bg-white transition-all duration-150"

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? "md:col-span-2 col-span-1" : "col-span-1"}`}>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}{required && <span className="text-indigo-500"> *</span>}</label>
      {children}
    </div>
  )
}

export default function CompanySetup() {
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({
    companyName: "TransportOS Logistics",
    tagline: "Fast & Reliable Transport Solutions",
    gstin: "27AABCG5678B1Z9",
    pan: "AABCG5678B",
    email: "contact@transpos.in",
    phone: "022-98765432",
    address: "HQ Suite 4, Logistics Park",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    bankName: "HDFC Bank",
    accountNo: "50200012345678",
    ifsc: "HDFC0001234",
    termsAndConditions: "Goods carried at owner's risk."
  })

  const loadCompanyData = async () => {
    try {
      const activeCompId = companyContext.getActiveCompanyId() || "COMP-DEMO-001"
      const data = await companyRepository.findById(activeCompId)
      if (data) {
        setProfile({
          companyName: data.name || "TransportOS Logistics",
          tagline: (data as any).tagline || "",
          gstin: (data as any).gstin || "",
          pan: (data as any).pan || "",
          email: (data as any).email || "",
          phone: (data as any).phone || "",
          address: (data as any).address || "",
          city: data.city || "",
          state: (data as any).state || "",
          pincode: (data as any).pincode || "",
          bankName: (data as any).bankName || "",
          accountNo: (data as any).accountNo || "",
          ifsc: (data as any).ifsc || "",
          termsAndConditions: (data as any).termsAndConditions || ""
        })
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadCompanyData()
  }, [])

  const set = (k: string) => (v: string) => setProfile(p => ({ ...p, [k]: v }))

  const handleSaveCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const activeCompId = companyContext.getActiveCompanyId() || "COMP-DEMO-001"
      await companyRepository.update(activeCompId, {
        id: activeCompId,
        name: profile.companyName,
        ...profile,
        updatedAt: new Date().toISOString()
      } as any)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[1100px] mx-auto px-4 md:px-6 py-5 space-y-4">

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-extrabold">Company & Master Configuration</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Enterprise Organization Details, Tax IDs, and Bank Master</p>
          </div>
          <button onClick={handleSaveCompanyProfile} disabled={saving}
            className="flex items-center gap-1.5 h-10 px-5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">
            <Save size={15} /> {saving ? "Saving DB..." : "Save Settings"}
          </button>
        </motion.div>

        {saveSuccess && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-bold shadow-sm">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>Company setup saved successfully to Database!</span>
          </motion.div>
        )}

        <form onSubmit={handleSaveCompanyProfile} className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-[20px] p-6 card-shadow border border-gray-100 space-y-4">
            
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Building size={18} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Company Identity & Registration</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Company Name *" required span2>
                <input required value={profile.companyName} onChange={e => set("companyName")(e.target.value)} placeholder="Company Name" className={inputCls} />
              </Field>
              <Field label="Tagline">
                <input value={profile.tagline} onChange={e => set("tagline")(e.target.value)} placeholder="Tagline" className={inputCls} />
              </Field>
              <Field label="GSTIN Number">
                <input value={profile.gstin} onChange={e => set("gstin")(e.target.value.toUpperCase())} placeholder="27AABCT1234A1Z5" className={inputCls} />
              </Field>
              <Field label="PAN Number">
                <input value={profile.pan} onChange={e => set("pan")(e.target.value.toUpperCase())} placeholder="AABCT1234A" className={inputCls} />
              </Field>
              <Field label="Support Phone">
                <input value={profile.phone} onChange={e => set("phone")(e.target.value)} placeholder="022-41234567" className={inputCls} />
              </Field>
              <Field label="Support Email">
                <input value={profile.email} onChange={e => set("email")(e.target.value)} placeholder="contact@transpos.in" className={inputCls} />
              </Field>
              <Field label="City">
                <input value={profile.city} onChange={e => set("city")(e.target.value)} placeholder="Mumbai" className={inputCls} />
              </Field>
              <Field label="State">
                <input value={profile.state} onChange={e => set("state")(e.target.value)} placeholder="Maharashtra" className={inputCls} />
              </Field>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-[20px] p-6 card-shadow border border-gray-100 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-3">Bank Details & Print Terms</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Bank Name">
                <input value={profile.bankName} onChange={e => set("bankName")(e.target.value)} placeholder="e.g. HDFC Bank" className={inputCls} />
              </Field>
              <Field label="Account Number">
                <input value={profile.accountNo} onChange={e => set("accountNo")(e.target.value)} placeholder="50200012345678" className={inputCls} />
              </Field>
              <Field label="IFSC Code">
                <input value={profile.ifsc} onChange={e => set("ifsc")(e.target.value.toUpperCase())} placeholder="HDFC0001234" className={inputCls} />
              </Field>
            </div>

            <Field label="Invoice & LR Terms & Conditions">
              <textarea value={profile.termsAndConditions} onChange={e => set("termsAndConditions")(e.target.value)} rows={3}
                placeholder="Terms to display on printed LRs and Bills..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none" />
            </Field>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="h-11 px-6 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md">
                {saving ? "Saving DB..." : "Save Master Setup"}
              </button>
            </div>
          </motion.div>
        </form>

      </div>
    </div>
  )
}
