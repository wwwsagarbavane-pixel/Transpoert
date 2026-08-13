import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  User, Lock, Bell, Check, Save, Building, ShieldCheck,
  Building2, MapPin, KeyRound, Globe, Moon, Clock, Monitor, Phone, Mail, AlertCircle, History
} from "lucide-react"
import { sessionService } from "../services/sessionService"
import { userRepository } from "../repositories/repositories"
import { companyContext } from "../services/companyContext"
import { DBUser } from "../db/schema"

const inputCls = "h-11 w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-300 focus:bg-white transition-all font-medium"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 col-span-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}{required && <span className="text-indigo-500"> *</span>}</label>
      {children}
    </div>
  )
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <div className="text-sm font-semibold text-gray-800">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${value ? "bg-indigo-600" : "bg-gray-200"}`}>
        <motion.div animate={{ x: value ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
      </button>
    </div>
  )
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<"personal" | "company" | "security">("personal")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const session = sessionService.getSession()
  const activeUser = session.user
  const activeCompany = session.company
  const activeCompanyId = companyContext.getActiveCompanyId() || "COMP-DEMO-001"

  const [userProfile, setUserProfile] = useState({
    id: activeUser?.id || "",
    name: activeUser?.name || "Logged-in User",
    email: activeUser?.email || "",
    mobile: activeUser?.mobile || "",
    employeeId: activeUser?.id || "",
    branch: activeUser?.branch || "Main HQ",
    department: activeUser?.department || "Operations",
    designation: activeUser?.designation || activeUser?.role || "Operator",
    role: activeUser?.role || "Company Admin",
    companyName: activeCompany?.name || "Demo Transport",
    companyId: activeCompany?.id || activeCompanyId,
    lastLogin: activeUser?.lastLogin || new Date().toISOString(),
    createdAt: activeUser?.createdAt || new Date().toISOString()
  })

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: ""
  })

  const [preferences, setPreferences] = useState({
    theme: "Light Canvas / Dark Sidebar",
    language: "English (US)",
    timezone: "Asia/Kolkata (IST)",
    emailAlerts: true,
    whatsappAlerts: true,
    expiryReminders: true
  })

  const loadRealUserProfile = async () => {
    if (!activeUser?.id && !activeUser?.email) return
    try {
      const companyUsers = await userRepository.findAll(activeCompanyId)
      const found = companyUsers.find(
        u => u.id === activeUser.id || (activeUser.email && u.email.toLowerCase() === activeUser.email.toLowerCase())
      )
      if (found) {
        setUserProfile({
          id: found.id,
          name: found.name,
          email: found.email,
          mobile: found.mobile || "",
          employeeId: found.id,
          branch: found.branch || "Main HQ",
          department: (found as any).department || "Operations",
          designation: (found as any).designation || found.role || "Operator",
          role: found.role,
          companyName: activeCompany?.name || "Demo Transport",
          companyId: activeCompany?.id || activeCompanyId,
          lastLogin: found.lastLogin || activeUser.lastLogin || new Date().toISOString(),
          createdAt: found.createdAt || new Date().toISOString()
        })
      }
    } catch (err) {
      console.error("Failed to load user profile:", err)
    }
  }

  useEffect(() => {
    loadRealUserProfile()
  }, [activeCompanyId])

  const handleSaveProfile = async () => {
    setSaving(true)
    setErrorMsg("")
    try {
      if (userProfile.id) {
        const companyUsers = await userRepository.findAll(activeCompanyId)
        const existing = companyUsers.find(
          u => u.id === userProfile.id || u.email.toLowerCase() === userProfile.email.toLowerCase()
        )
        if (existing) {
          const updated: DBUser = {
            ...existing,
            name: userProfile.name.trim(),
            email: userProfile.email.trim().toLowerCase(),
            mobile: userProfile.mobile.trim(),
            branch: userProfile.branch,
            department: userProfile.department,
            designation: userProfile.designation,
            updatedAt: new Date().toISOString()
          }
          await userRepository.update(existing.id, updated)

          const currSession = sessionService.getSession()
          if (currSession.user && currSession.company) {
            sessionService.saveSession(currSession.company, {
              ...currSession.user,
              name: updated.name,
              email: updated.email,
              mobile: updated.mobile,
              branch: updated.branch
            }, currSession.activePage)
          }
        }
      }
      await loadRealUserProfile()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err: any) {
      console.error("Save profile error:", err)
      setErrorMsg(err.message || "Failed to update profile details")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    if (!passwordForm.new || passwordForm.new !== passwordForm.confirm) {
      setErrorMsg("New Password and Confirm Password do not match")
      return
    }
    if (passwordForm.new.length < 8) {
      setErrorMsg("Password must be at least 8 characters long")
      return
    }

    setSaving(true)
    try {
      if (userProfile.id) {
        const companyUsers = await userRepository.findAll(activeCompanyId)
        const existing = companyUsers.find(
          u => u.id === userProfile.id || u.email.toLowerCase() === userProfile.email.toLowerCase()
        )
        if (existing) {
          await userRepository.update(existing.id, {
            ...existing,
            password: passwordForm.new,
            password_hash: passwordForm.new,
            updatedAt: new Date().toISOString()
          })
          setPasswordForm({ current: "", new: "", confirm: "" })
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 2500)
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto font-sans">
      <div className="max-w-[900px] mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">User Profile Management</h1>
            <p className="text-xs text-gray-400 mt-0.5">Logged-in account credentials, tenant mapping, security, and preferences</p>
          </div>
          <button onClick={handleSaveProfile} disabled={saving}
            className="flex items-center gap-1.5 h-10 px-5 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 cursor-pointer justify-center">
            {saveSuccess ? <><Check size={14} /> Profile Saved!</> : <><Save size={15} /> {saving ? "Saving..." : "Save Profile Details"}</>}
          </button>
        </motion.div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* User Card Header Banner */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              {userProfile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="text-lg font-extrabold text-gray-900">{userProfile.name}</div>
              <div className="text-xs text-gray-400 font-mono">ID: {userProfile.employeeId} · Email: <span className="text-indigo-600 font-bold">{userProfile.email}</span></div>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <ShieldCheck size={12} /> {userProfile.role}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <Building2 size={12} /> {userProfile.companyName}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs space-y-1 border-l border-gray-100 pl-4 hidden sm:block">
            <div className="text-gray-400 font-medium">Last Login Session</div>
            <div className="font-mono text-gray-700 font-semibold">{new Date(userProfile.lastLogin).toLocaleString()}</div>
            <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
              Active Session Verified
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-gray-100 pb-2 overflow-x-auto">
          {[
            { id: "personal", label: "Personal Information", icon: User },
            { id: "company", label: "Company & Role Mapping", icon: Building2 },
            { id: "security", label: "Security & Sessions", icon: KeyRound },
          ].map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  active ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}>
                <Icon size={14} /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* TAB 1: Personal Information */}
        {activeTab === "personal" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Personal & Credentials Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <input type="text" value={userProfile.name} onChange={e => setUserProfile({ ...userProfile, name: e.target.value })} className={inputCls} />
              </Field>

              <Field label="Email Address (Login ID)" required>
                <input type="email" value={userProfile.email} onChange={e => setUserProfile({ ...userProfile, email: e.target.value })} className={inputCls} />
              </Field>

              <Field label="Mobile Phone Number *" required>
                <input type="tel" value={userProfile.mobile} onChange={e => setUserProfile({ ...userProfile, mobile: e.target.value })} className={inputCls} />
              </Field>

              <Field label="Employee Record ID">
                <input type="text" disabled value={userProfile.employeeId} className={`${inputCls} bg-gray-100 text-gray-400 font-mono`} />
              </Field>

              <Field label="Account Created Date">
                <input type="text" disabled value={new Date(userProfile.createdAt).toLocaleDateString("en-GB")} className={`${inputCls} bg-gray-100 text-gray-400 font-mono`} />
              </Field>
            </div>
          </motion.div>
        )}

        {/* TAB 2: Company & Role Mapping */}
        {activeTab === "company" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Organization & RBAC Role Authorization</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Assigned Tenant Company">
                <input type="text" disabled value={userProfile.companyName} className={`${inputCls} bg-gray-100 text-indigo-600 font-bold`} />
              </Field>

              <Field label="Role Authorization">
                <input type="text" disabled value={userProfile.role} className={`${inputCls} bg-gray-100 text-purple-700 font-bold`} />
              </Field>

              <Field label="Assigned Branch / Station">
                <input type="text" value={userProfile.branch} onChange={e => setUserProfile({ ...userProfile, branch: e.target.value })} className={inputCls} />
              </Field>

              <Field label="Department">
                <input type="text" value={userProfile.department} onChange={e => setUserProfile({ ...userProfile, department: e.target.value })} className={inputCls} />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Job Designation">
                  <input type="text" value={userProfile.designation} onChange={e => setUserProfile({ ...userProfile, designation: e.target.value })} className={inputCls} />
                </Field>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: Security & Sessions */}
        {activeTab === "security" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <form onSubmit={handleChangePassword} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">Change Account Password</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Current Password" required>
                  <input type="password" required value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })} className={inputCls} />
                </Field>
                <Field label="New Password" required>
                  <input type="password" required value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Confirm New Password" required>
                  <input type="password" required value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <button type="submit" disabled={saving} className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                Update Security Password
              </button>
            </form>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <History size={16} className="text-indigo-600" /> Active Login History & Session Logs
              </h2>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-gray-900">Current Session · Web Browser (Chrome / Edge)</div>
                  <div className="text-gray-400 font-mono">Last Active: {new Date().toLocaleTimeString()} · IP: Localhost</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Now
                </span>
              </div>
            </div>
          </motion.div>
        )}


      </div>
    </div>
  )
}
