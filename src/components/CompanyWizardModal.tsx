import React, { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2, User, Mail, Phone, Globe, MapPin, Upload,
  X, CheckCircle2, AlertCircle, RefreshCw, Trash2, Image as ImageIcon
} from "lucide-react"
import { companyRepository } from "../repositories/repositories"
import { apiClient } from "../services/apiClient"
import { dbQuery } from "../db/db"
import { DBCompany, DBUser } from "../db/schema"
import SearchDropdown from "./SearchDropdown"

interface CompanyWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onCompanyCreated: (companyId: string) => void
}

const inputCls = "h-11 w-full bg-gray-50/80 border border-gray-200 rounded-xl px-3.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 focus:bg-white transition-all font-medium"

function Field({ label, required, children, span2 }: { label: string; required?: boolean; children: React.ReactNode; span2?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 ${span2 ? "sm:col-span-2 col-span-1" : "col-span-1"}`}>
      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1">
        {label}
        {required && <span className="text-indigo-600 font-bold">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function CompanyWizardModal({ isOpen, onClose, onCompanyCreated }: CompanyWizardModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [dragActive, setDragActive] = useState(false)

  const emptyForm = {
    logo: "",
    name: "",
    contactPerson: "",
    email: "",
    mobile: "",
    adminName: "",
    adminEmail: "",
    adminMobile: "",
    adminPassword: "",
    adminConfirmPassword: "",
    gstin: "",
    pan: "",
    website: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    status: "active" as "active" | "inactive"
  }

  const [form, setForm] = useState({ ...emptyForm })

  if (!isOpen) return null

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  // Logo file upload handler
  const handleLogoUpload = (file: File) => {
    setErrorMsg("")
    if (!file.type.match(/image\/(png|jpeg|jpg|svg\+xml)/)) {
      setErrorMsg("Please upload a valid image file (PNG, JPG, JPEG, or SVG).")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File size exceeds 5MB limit. Please choose a smaller image.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setForm(prev => ({ ...prev, logo: e.target!.result as string }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0])
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    console.log("[Company Create] Form Submitted", form)

    // 1. Declare sanitized variables first
    const nameClean = form.name.trim()
    const contactClean = form.contactPerson.trim()
    const emailClean = form.email.trim().toLowerCase()
    const mobileClean = form.mobile.trim()

    const adminNameClean = form.adminName.trim() || contactClean
    const adminEmailClean = form.adminEmail.trim().toLowerCase() || emailClean
    const adminMobileClean = form.adminMobile.trim() || mobileClean
    const password = form.adminPassword
    const confirmPassword = form.adminConfirmPassword

    // 2. Comprehensive Validations
    if (!form.logo) {
      const err = "Company Logo is required. Please upload a company logo image."
      console.warn("[Company Create Validation Failed]", err)
      setErrorMsg(err)
      return
    }
    if (!nameClean) {
      const err = "Company Name is required."
      console.warn("[Company Create Validation Failed]", err)
      setErrorMsg(err)
      return
    }
    if (!contactClean) {
      const err = "Contact Person / Owner Name is required."
      console.warn("[Company Create Validation Failed]", err)
      setErrorMsg(err)
      return
    }
    if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      const err = "Please provide a valid Company Email address."
      console.warn("[Company Create Validation Failed]", err)
      setErrorMsg(err)
      return
    }
    if (!mobileClean || !/^\d{10}$/.test(mobileClean)) {
      const err = "Company Mobile Number must be a valid 10-digit phone number."
      console.warn("[Company Create Validation Failed]", err)
      setErrorMsg(err)
      return
    }

    if (!adminEmailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmailClean)) {
      const err = "Please provide a valid Admin Login Email."
      console.warn("[Company Create Validation Failed]", err)
      setErrorMsg(err)
      return
    }

    if (!password) {
      const err = "Company Admin Password is required."
      console.warn("[Company Create Validation Failed]", err)
      setErrorMsg(err)
      return
    }
    if (password.length < 6) {
      const err = "Admin Password must be at least 6 characters long."
      console.warn("[Company Create Validation Failed]", err)
      setErrorMsg(err)
      return
    }
    if (password !== confirmPassword) {
      const err = "Password and Confirm Password do not match."
      console.warn("[Company Create Validation Failed]", err)
      setErrorMsg(err)
      return
    }

    if (form.gstin && form.gstin.trim().length !== 15) {
      const err = "GST Number must be 15 characters long if provided."
      console.warn("[Company Create Validation Failed]", err)
      setErrorMsg(err)
      return
    }

    try {
      const allUsers = await dbQuery.getAll<DBUser>("users")
      const existingUser = allUsers.find(u => u.email && u.email.toLowerCase() === adminEmailClean.toLowerCase())
      if (existingUser) {
        setErrorMsg(`Admin email "${adminEmailClean}" is already in use by another user account. Please use a unique email.`)
        return
      }
    } catch (err) {
      // ignore
    }

    console.log("[Company Create] Validation Passed")
    setSaving(true)

    const companyId = `COMP-${Date.now().toString().substring(7)}`
    const autoCode = nameClean.replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase() || "COMP"

    try {
      console.log("[Company Create] API Request / DB Transaction Started for ID:", companyId)

      // 1. Save DBCompany Record
      const newCompany: DBCompany = {
        id: companyId,
        code: autoCode,
        name: nameClean,
        logo: form.logo,
        status: form.status,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await companyRepository.create(newCompany)
      console.log("[Company Create] 1. Company Record Saved via POST into public.companies")

      // 2. Create Default Head Office Station
      await apiClient.post("/stations", {
        id: `STN-${companyId}-HO`,
        company_id: companyId,
        name: `${form.city.trim() || "Head"} Office Station`,
        city: form.city.trim() || "Headquarters",
        state: form.state.trim() || "State",
        type: "Branch",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      console.log("[Company Create] 2. Default Station Created via POST")

      // 3. Create First Mandatory Company Admin User Account
      const newAdminUser: DBUser = {
        id: `USR-${Date.now()}`,
        company_id: companyId,
        name: adminNameClean,
        email: adminEmailClean,
        password: password,
        role: "Company Admin",
        assignedCompanies: [companyId],
        permissions: ["*"],
        branch: `${form.city.trim() || "Main"} HQ`,
        mobile: adminMobileClean,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await apiClient.post("/users", newAdminUser)
      console.log("[Company Create] 3. Admin User Created via POST")

      console.log("[Company Create] Transaction Complete Successfully!")

      // Reset and trigger callback
      setForm({ ...emptyForm })
      onCompanyCreated(companyId)
      onClose()
    } catch (err: any) {
      console.error("[Company Create Transaction Failed - Rollback Initiated]", err)
      try {
        await apiClient.delete(`/companies/${encodeURIComponent(companyId)}`)
        await apiClient.delete(`/stations/STN-${companyId}-HO`)
      } catch (rollbackErr) {
        console.error("[Company Create Rollback Error]", rollbackErr)
      }

      setErrorMsg(err.message || "Failed to create company and provision backend workspace.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-xs">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Create Enterprise Transport Company</h2>
              <p className="text-xs text-gray-400 font-normal">Provision a new isolated multi-tenant company workspace and branding setup</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="create-company-form" onSubmit={handleCreateCompany} className="p-7 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-semibold shadow-xs">
              <AlertCircle size={16} className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* SECTION 1: Company Logo Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center justify-between">
              <span>Company Logo <span className="text-indigo-600">*</span></span>
              <span className="text-[10px] text-gray-400 font-normal normal-case">PNG, JPG, JPEG, SVG up to 5MB</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              accept="image/png, image/jpeg, image/jpg, image/svg+xml"
              className="hidden"
            />

            {form.logo ? (
              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white border border-indigo-200 shadow-sm flex items-center justify-center p-2 overflow-hidden shrink-0">
                    <img src={form.logo} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Uploaded Company Logo</span>
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={12} /> Ready for PDF, Headers & Branding
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 px-3 rounded-xl text-xs font-bold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer shadow-xs"
                  >
                    Replace Logo
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, logo: "" }))}
                    className="h-9 px-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/50"
                    : "border-gray-200 bg-gray-50/50 hover:border-indigo-300 hover:bg-indigo-50/20"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 shadow-xs">
                  <Upload size={22} />
                </div>
                <div className="text-xs font-bold text-gray-800">
                  Click to Browse or Drag & Drop Company Logo
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Recommended size: 500x500px transparent background PNG</p>
              </div>
            )}
          </div>

          {/* SECTION 2: 2-Column Company Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company Name" required>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => set("name")(e.target.value)}
                placeholder="e.g. Mahavir Transport Logistics"
                className={inputCls}
              />
            </Field>

            <Field label="Contact Person / Owner Name" required>
              <input
                type="text"
                required
                value={form.contactPerson}
                onChange={e => set("contactPerson")(e.target.value)}
                placeholder="e.g. Rajesh Shah"
                className={inputCls}
              />
            </Field>

            <Field label="Email Address (Admin Login ID)" required>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => set("email")(e.target.value)}
                placeholder="admin@mahavirtransport.com"
                className={inputCls}
              />
            </Field>

            <Field label="Mobile Phone Number" required>
              <input
                type="tel"
                required
                value={form.mobile}
                onChange={e => set("mobile")(e.target.value)}
                placeholder="98200XXXXX"
                className={inputCls}
              />
            </Field>

            <Field label="GST Number">
              <input
                type="text"
                value={form.gstin}
                onChange={e => set("gstin")(e.target.value.toUpperCase())}
                placeholder="27AAACM1234A1Z5"
                className={`${inputCls} font-mono`}
              />
            </Field>

            <Field label="PAN Number">
              <input
                type="text"
                value={form.pan}
                onChange={e => set("pan")(e.target.value.toUpperCase())}
                placeholder="AAACM1234A"
                className={`${inputCls} font-mono`}
              />
            </Field>

            <Field label="Company Website">
              <input
                type="text"
                value={form.website}
                onChange={e => set("website")(e.target.value)}
                placeholder="https://mahavirtransport.com"
                className={inputCls}
              />
            </Field>

            <Field label="Company Status" required>
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

            <Field label="Registered Address" span2>
              <input
                type="text"
                value={form.address}
                onChange={e => set("address")(e.target.value)}
                placeholder="Plot No. 45, MIDC Industrial Area, Off Highway 4"
                className={inputCls}
              />
            </Field>

            <Field label="City">
              <input
                type="text"
                value={form.city}
                onChange={e => set("city")(e.target.value)}
                placeholder="Mumbai"
                className={inputCls}
              />
            </Field>

            <Field label="State">
              <input
                type="text"
                value={form.state}
                onChange={e => set("state")(e.target.value)}
                placeholder="Maharashtra"
                className={inputCls}
              />
            </Field>

            <Field label="Pincode">
              <input
                type="text"
                value={form.pincode}
                onChange={e => set("pincode")(e.target.value)}
                placeholder="400001"
                className={`${inputCls} font-mono`}
              />
            </Field>
          </div>

          {/* SECTION 3: Mandatory Company Administrator Account Credentials */}
          <div className="p-5 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-200/60 pb-3">
              <div>
                <h3 className="text-xs font-extrabold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                  <User size={15} className="text-purple-600" /> Provision Mandatory Company Administrator Login
                </h3>
                <p className="text-[11px] text-purple-700 mt-0.5">This admin account will be automatically assigned to this company with full privileges</p>
              </div>
              <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full uppercase">
                Role: Company Admin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Admin Full Name" required>
                <input
                  type="text"
                  required
                  value={form.adminName || form.contactPerson}
                  onChange={e => set("adminName")(e.target.value)}
                  placeholder="e.g. Rajesh Shah"
                  className={inputCls}
                />
              </Field>

              <Field label="Admin Login Email" required>
                <input
                  type="email"
                  required
                  value={form.adminEmail || form.email}
                  onChange={e => set("adminEmail")(e.target.value)}
                  placeholder="admin@mahavirtransport.com"
                  className={inputCls}
                />
              </Field>

              <Field label="Admin Mobile Phone" required>
                <input
                  type="tel"
                  required
                  value={form.adminMobile || form.mobile}
                  onChange={e => set("adminMobile")(e.target.value)}
                  placeholder="98200XXXXX"
                  className={inputCls}
                />
              </Field>

              <div />

              <Field label="Set Admin Password" required>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.adminPassword}
                  onChange={e => set("adminPassword")(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                />
              </Field>

              <Field label="Confirm Password" required>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.adminConfirmPassword}
                  onChange={e => set("adminConfirmPassword")(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          <button type="submit" className="hidden" />
        </form>

        {/* Modal Bottom Footer Actions */}
        <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 px-5 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="create-company-form"
            disabled={saving}
            className="h-11 px-7 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw size={15} className="animate-spin" /> Provisioning Workspace...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Create Company
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
