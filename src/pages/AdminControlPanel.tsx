import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Building2, Users, Activity, Settings, Key, LogOut,
  Plus, Search, CheckCircle2, XCircle, Edit2, Trash2, ShieldCheck, RefreshCw,
  Server, HardDrive, ShieldAlert, ChevronRight, Layers, FileText, Check, Power,
  Building, ChevronLeft, UserCheck, Menu, Sparkles, Filter, Bell, ArrowUpRight,
  Clock, Shield, UserX, SlidersHorizontal, ArrowUpDown
} from "lucide-react"
import { DBCompany, DBUser, DBAuditLog } from "../db/schema"
import { companyRepository, userRepository } from "../repositories/repositories"
import { dbQuery } from "../db/db"
import Logo from "../components/Logo"
import CompanyWizardModal from "../components/CompanyWizardModal"
import UserAccountModal from "../components/UserAccountModal"

interface AdminControlPanelProps {
  onLogout: () => void
  user: { name: string; email: string; role: string }
}

const inputCls = "w-full h-10 bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 focus:bg-white transition-all font-medium"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
        {label} {required && <span className="text-indigo-500">*</span>}
      </label>
      {children}
    </div>
  )
}

type AdminTab = "Dashboard" | "Company Management" | "User Management" | "Activity Logs" | "Audit Logs" | "System Settings" | "License Management"

export default function AdminControlPanel({ onLogout, user }: AdminControlPanelProps) {
  const [activeItem, setActiveItem] = useState<AdminTab>("Dashboard")
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [companies, setCompanies] = useState<DBCompany[]>([])
  const [usersList, setUsersList] = useState<DBUser[]>([])
  const [auditLogs, setAuditLogs] = useState<DBAuditLog[]>([])

  // Filters for Company Management
  const [companySearch, setCompanySearch] = useState("")
  const [companyStatusFilter, setCompanyStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [companySortBy, setCompanySortBy] = useState<"latest" | "name" | "code">("latest")

  // Filters for User Management
  const [userSearch, setUserSearch] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all")
  const [userCompanyFilter, setUserCompanyFilter] = useState<string>("all")
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "inactive">("all")

  // Company Form Modal
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<DBCompany | null>(null)
  const [companyForm, setCompanyForm] = useState({ name: "", code: "", status: "active" as "active" | "inactive" })

  // User Form Modal
  const [showUserModal, setShowUserModal] = useState(false)
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "Company Admin" as any, company_id: "COMP-001" })

  // Delete Modals
  const [deleteCompanyTarget, setDeleteCompanyTarget] = useState<string | null>(null)
  const [deleteUserTarget, setDeleteUserTarget] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState("")

  const loadData = async () => {
    try {
      const [compList, userRes, logRes] = await Promise.all([
        companyRepository.findAll(),
        userRepository.findAll("PLATFORM"),
        dbQuery.getAll<DBAuditLog>("audit_logs")
      ])
      setCompanies(compList || [])
      setUsersList(Array.isArray(userRes) ? userRes : [])
      setAuditLogs(Array.isArray(logRes) ? logRes : [])
    } catch (err) {
      console.error("Failed to load admin data:", err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const triggerToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(""), 3500)
  }

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyForm.name.trim()) return
    setSaving(true)
    try {
      if (editingCompany) {
        const updated = {
          ...editingCompany,
          name: companyForm.name,
          code: companyForm.code || editingCompany.code,
          status: companyForm.status,
          updatedAt: new Date().toISOString()
        }
        await companyRepository.update(editingCompany.id, updated)
        triggerToast(`Company "${updated.name}" updated successfully.`)
      } else {
        const newComp: DBCompany = {
          id: `COMP-${Date.now()}`,
          code: companyForm.code.toUpperCase() || `C${Date.now().toString().slice(-4)}`,
          name: companyForm.name,
          status: companyForm.status,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        await companyRepository.create(newComp)
        triggerToast(`Company "${newComp.name}" created successfully.`)
      }
      setShowCompanyModal(false)
      setEditingCompany(null)
      setCompanyForm({ name: "", code: "", status: "active" })
      await loadData()
    } catch (err) {
      console.error("Save company error:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCompanyConfirm = async () => {
    if (!deleteCompanyTarget) return
    try {
      await companyRepository.delete(deleteCompanyTarget)
      triggerToast("Company workspace deleted successfully.")
      setDeleteCompanyTarget(null)
      await loadData()
    } catch (err) {
      console.error("Failed to delete company:", err)
      triggerToast("Failed to delete company.")
    } finally {
      setDeleteCompanyTarget(null)
    }
  }

  const handleToggleCompanyStatus = async (comp: DBCompany) => {
    const nextStatus: "active" | "inactive" = comp.status === "active" ? "inactive" : "active"
    const updated: DBCompany = { ...comp, status: nextStatus, updatedAt: new Date().toISOString() }
    await companyRepository.update(comp.id, updated)
    triggerToast(`Company "${comp.name}" is now ${nextStatus.toUpperCase()}.`)
    await loadData()
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userForm.email.trim() || !userForm.name.trim()) return
    setSaving(true)
    try {
      const newUser: DBUser = {
        id: `USR-${Date.now()}`,
        name: userForm.name,
        email: userForm.email,
        password: userForm.password || "text@123",
        role: userForm.role,
        company_id: userForm.company_id,
        assignedCompanies: [userForm.company_id],
        branch: "Main HQ",
        lastLogin: new Date().toISOString(),
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      await userRepository.create(newUser)
      triggerToast(`User "${newUser.email}" created.`)
      setShowUserModal(false)
      setUserForm({ name: "", email: "", password: "", role: "Company Admin", company_id: "COMP-001" })
      await loadData()
    } catch (err) {
      console.error("Save user error:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUserConfirm = async () => {
    if (!deleteUserTarget) return
    try {
      await userRepository.delete(deleteUserTarget)
      triggerToast("User credentials removed.")
      setDeleteUserTarget(null)
      await loadData()
    } catch (err) {
      console.error(err)
    }
  }

  // Filter Companies Logic
  const filteredCompanies = companies
    .filter(c => {
      const matchesQuery = !companySearch || c.name.toLowerCase().includes(companySearch.toLowerCase()) || c.code.toLowerCase().includes(companySearch.toLowerCase()) || c.id.toLowerCase().includes(companySearch.toLowerCase())
      const matchesStatus = companyStatusFilter === "all" || c.status === companyStatusFilter
      return matchesQuery && matchesStatus
    })
    .sort((a, b) => {
      if (companySortBy === "name") return a.name.localeCompare(b.name)
      if (companySortBy === "code") return a.code.localeCompare(b.code)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  // Filter Users Logic
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const uName = String(u.name || (u as any).full_name || "").toLowerCase()
      const uEmail = String(u.email || "").toLowerCase()
      const uId = String(u.id || "").toLowerCase()
      const q = userSearch.trim().toLowerCase()

      const matchesQuery = !q || uName.includes(q) || uEmail.includes(q) || uId.includes(q)
      
      const normRole = String(u.role || "").trim()
      const matchesRole = userRoleFilter === "all" || normRole.toLowerCase() === userRoleFilter.toLowerCase()

      let assignedList: string[] = []
      if (u.company_id) assignedList.push(String(u.company_id))
      if (Array.isArray(u.assignedCompanies)) {
        assignedList.push(...u.assignedCompanies.map((c: any) => String(c)))
      } else if (typeof u.assignedCompanies === "string") {
        try {
          const parsed = JSON.parse(u.assignedCompanies)
          if (Array.isArray(parsed)) assignedList.push(...parsed.map((c: any) => String(c)))
          else assignedList.push(String(parsed))
        } catch {
          assignedList.push(String(u.assignedCompanies))
        }
      }

      const matchesCompany = userCompanyFilter === "all" || assignedList.some(ac => ac.toLowerCase() === userCompanyFilter.toLowerCase())

      const uStatus = String(u.status || "active").toLowerCase()
      const matchesStatus = userStatusFilter === "all" || uStatus === userStatusFilter.toLowerCase()

      return matchesQuery && matchesRole && matchesCompany && matchesStatus
    })
  }, [usersList, userSearch, userRoleFilter, userCompanyFilter, userStatusFilter])

  const navSections = [
    {
      items: [
        { label: "Dashboard" as AdminTab, icon: LayoutDashboard }
      ]
    },
    {
      section: "SYSTEM ADMINISTRATION",
      items: [
        { label: "Company Management" as AdminTab, icon: Building2, count: companies.length },
        { label: "User Management" as AdminTab, icon: Users, count: usersList.length }
      ]
    },
    {
      section: "GOVERNANCE & AUDIT",
      items: [
        { label: "Activity Logs" as AdminTab, icon: Activity },
        { label: "Audit Logs" as AdminTab, icon: ShieldCheck, count: auditLogs.length }
      ]
    },
    {
      section: "PLATFORM & LICENSE",
      items: [
        { label: "System Settings" as AdminTab, icon: Settings },
        { label: "License Management" as AdminTab, icon: Key }
      ]
    }
  ]

  const superAdminCount = usersList.filter(u => u.role === "Super Admin").length
  const companyAdminCount = usersList.filter(u => u.role === "Company Admin").length
  const operatorCount = usersList.filter(u => u.role === "Operator" || u.role === "Company User").length

  return (
    <div className="flex h-screen overflow-hidden relative font-sans" style={{ background: "#F4F7FC" }}>
      
      {/* DARK SIDEBAR - MATCHING ATTACHED SCREENSHOT */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden md:flex flex-col bg-[#0F172A] text-slate-300 h-full shrink-0 relative z-20 shadow-xl"
      >
        {/* Sidebar Header Logo */}
        <div className="h-[64px] px-4 flex items-center justify-between border-b border-slate-800">
          {!collapsed ? (
            <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
              <Logo className="h-7 w-auto shrink-0" light />
              <span className="text-[9px] font-black text-purple-300 bg-purple-950/90 border border-purple-500/40 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                Admin
              </span>
            </div>
          ) : (
            <div className="mx-auto flex items-center justify-center">
              <Logo className="h-7 w-auto shrink-0" light />
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <ChevronLeft size={16} className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Sidebar Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navSections.map((sec, i) => (
            <div key={i} className="space-y-1">
              {sec.section && !collapsed && (
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  {sec.section}
                </div>
              )}
              {sec.items.map(item => {
                const Icon = item.icon
                const isActive = activeItem === item.label
                return (
                  <button
                    key={item.label}
                    onClick={() => { setActiveItem(item.label) }}
                    className={`w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon size={16} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!(collapsed) && (item as any).count !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                      }`}>
                        {(item as any).count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Bottom User Avatar Bar - MATCHING ATTACHED SCREENSHOT */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                  SA
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-white truncate">{user.name}</div>
                  <div className="text-[10px] text-purple-300 font-semibold truncate">{user.email}</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogout}
              className="w-full h-9 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 flex items-center justify-center transition-colors cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        
        {/* TOP HEADER BAR - MATCHING ATTACHED SCREENSHOT */}
        <header className="sticky top-0 z-30 border-b border-black/[0.06] px-6 h-[58px] flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs md:text-sm flex-1 min-w-0">
            <FileText size={14} className="text-gray-400 shrink-0 hidden sm:inline" />
            <span className="text-gray-400 font-medium hidden sm:inline">TransportOS</span>
            <ChevronRight size={13} className="text-gray-300 hidden sm:inline" />
            <span className="text-purple-600 font-bold bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md text-xs truncate">
              Super Admin Control Panel
            </span>
            <ChevronRight size={13} className="text-gray-300" />
            <span className="text-gray-900 font-bold truncate">{activeItem}</span>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            <div className="relative hidden lg:flex items-center">
              <Search size={14} className="absolute left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies, users, logs... ⌘K"
                className="w-64 h-9 bg-gray-100/80 border border-gray-200/80 rounded-xl pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-400/30 transition-all font-normal"
              />
            </div>

            <button onClick={loadData} className="w-9 h-9 rounded-xl text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <RefreshCw size={14} />
            </button>

            <div className="relative">
              <button className="w-9 h-9 rounded-xl text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors relative">
                <Bell size={15} />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowCompanyModal(true)}
              className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} /> Create Company
            </button>

            {activeItem === "User Management" && (
              <button
                type="button"
                onClick={() => setShowUserModal(true)}
                className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} /> Add System User
              </button>
            )}

            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-purple-500/20">
                SA
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE MAIN BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Toast Alert */}
          <AnimatePresence>
            {toastMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold shadow-md">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>{toastMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* VIEW 1: Dashboard Overview (MATCHING ATTACHED SCREENSHOT METRICS) */}
          {activeItem === "Dashboard" && (
            <div className="space-y-6">
              {/* Header Title Banner */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">System Admin Operations</h1>
                  <p className="text-xs text-gray-400 font-normal mt-0.5">Multi-tenant orchestration, RBAC governance and live company metrics</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> All system services operational
                </div>
              </div>

              {/* Colorful Metric Cards Grid - EXACT MATCH OF ATTACHED SCREENSHOT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Building2 size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900">{companies.length}</div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Registered Companies</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Users size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Online
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900">{usersList.length}</div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Active Users</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <ShieldCheck size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
                      Master
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900">{superAdminCount}</div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Super Admins</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <UserCheck size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                      Tenant Leads
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900">{companyAdminCount}</div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Company Admins</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                      <Activity size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-50 text-cyan-700 border border-cyan-200">
                      Operators
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900">{operatorCount}</div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Operators & Staff</div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                      <Server size={20} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      100% Sync
                    </span>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-gray-900">Disk DB</div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">Local Server Storage</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-gray-400">System Quick Actions</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                  <button
                    onClick={() => { setEditingCompany(null); setCompanyForm({ name: "", code: "", status: "active" }); setShowCompanyModal(true) }}
                    className="p-4 bg-gray-50/80 hover:bg-indigo-50 border border-gray-200/80 hover:border-indigo-200 rounded-2xl flex flex-col items-center gap-2 text-center transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                      <Plus size={20} />
                    </div>
                    <span className="text-xs font-bold text-gray-800 group-hover:text-indigo-600">Create Company</span>
                  </button>

                  <button
                    onClick={() => setShowUserModal(true)}
                    className="p-4 bg-gray-50/80 hover:bg-purple-50 border border-gray-200/80 hover:border-purple-200 rounded-2xl flex flex-col items-center gap-2 text-center transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                      <UserCheck size={20} />
                    </div>
                    <span className="text-xs font-bold text-gray-800 group-hover:text-purple-600">Add System User</span>
                  </button>

                  <button
                    onClick={() => setActiveItem("Company Management")}
                    className="p-4 bg-gray-50/80 hover:bg-emerald-50 border border-gray-200/80 hover:border-emerald-200 rounded-2xl flex flex-col items-center gap-2 text-center transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                      <Building2 size={20} />
                    </div>
                    <span className="text-xs font-bold text-gray-800 group-hover:text-emerald-600">Manage Companies</span>
                  </button>

                  <button
                    onClick={() => setActiveItem("Audit Logs")}
                    className="p-4 bg-gray-50/80 hover:bg-amber-50 border border-gray-200/80 hover:border-amber-200 rounded-2xl flex flex-col items-center gap-2 text-center transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                      <ShieldCheck size={20} />
                    </div>
                    <span className="text-xs font-bold text-gray-800 group-hover:text-amber-600">View Audit Logs</span>
                  </button>

                  <button
                    onClick={() => setActiveItem("System Settings")}
                    className="p-4 bg-gray-50/80 hover:bg-slate-100 border border-gray-200/80 rounded-2xl flex flex-col items-center gap-2 text-center transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform">
                      <Settings size={20} />
                    </div>
                    <span className="text-xs font-bold text-gray-800">System Config</span>
                  </button>
                </div>
              </div>

              {/* Companies Table & Alert Notifications Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Registered Companies Data Table */}
                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Tenant Companies Overview</h3>
                      <p className="text-xs text-gray-400 font-normal">Active business organizations running on TransportOS</p>
                    </div>
                    <button onClick={() => setActiveItem("Company Management")} className="text-xs font-bold text-indigo-600 hover:underline">
                      Manage All →
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {companies.map(c => (
                      <div key={c.id} className="py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center font-mono">
                            {c.code.slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{c.name}</div>
                            <div className="text-xs text-gray-400 font-mono">ID: {c.id} · CODE: {c.code}</div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                          c.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Alerts Side Widget - MATCHING SCREENSHOT ALERT CARDS */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-bold text-gray-900">System Security Alerts</h3>
                    <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                      Operational
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-1">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-amber-600 shrink-0" /> RBAC Route Protection Active
                      </div>
                      <div className="text-amber-700 text-[11px]">Non-admin users are strictly blocked from accessing system controls.</div>
                    </div>

                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" /> Disk Backend Database Synced
                      </div>
                      <div className="text-emerald-700 text-[11px]">All records written to <span className="font-mono font-bold">data/transportos_db.json</span>.</div>
                    </div>

                    <div className="p-3.5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl space-y-1">
                      <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                        <Key size={14} className="text-indigo-600 shrink-0" /> Enterprise Multi-Tenant License
                      </div>
                      <div className="text-indigo-700 text-[11px]">Valid for unlimited companies & user credentials.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: COMPANY MANAGEMENT WITH ADVANCED FILTERS */}
          {activeItem === "Company Management" && (
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden p-6 space-y-5">
              
              {/* Top Header & Intro */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Company Management</h2>
                  <p className="text-xs text-gray-400 font-normal">Manage business tenant organizations, company codes, and active statuses</p>
                </div>

                <button
                  onClick={() => { setEditingCompany(null); setCompanyForm({ name: "", code: "", status: "active" }); setShowCompanyModal(true) }}
                  className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} /> Create Company
                </button>
              </div>

              {/* FILTER TOOLBAR FOR COMPANY MANAGEMENT */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={companySearch}
                      onChange={e => setCompanySearch(e.target.value)}
                      placeholder="Filter by company name or Tenant ID..."
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5">
                    <Filter size={13} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500">Status:</span>
                    <select
                      value={companyStatusFilter}
                      onChange={e => setCompanyStatusFilter(e.target.value as any)}
                      className="h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 cursor-pointer"
                    >
                      <option value="all">All Statuses ({companies.length})</option>
                      <option value="active">Active Only ({companies.filter(c => c.status === "active").length})</option>
                      <option value="inactive">Inactive Only ({companies.filter(c => c.status === "inactive").length})</option>
                    </select>
                  </div>

                  {/* Sort By Filter */}
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={13} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500">Sort By:</span>
                    <select
                      value={companySortBy}
                      onChange={e => setCompanySortBy(e.target.value as any)}
                      className="h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 cursor-pointer"
                    >
                      <option value="latest">Recently Added</option>
                      <option value="name">Company Name (A-Z)</option>
                    </select>
                  </div>

                  {(companySearch || companyStatusFilter !== "all") && (
                    <button
                      onClick={() => { setCompanySearch(""); setCompanyStatusFilter("all"); setCompanySortBy("latest") }}
                      className="h-10 px-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3.5 px-4">LOGO</th>
                      <th className="py-3.5 px-4">COMPANY NAME</th>
                      <th className="py-3.5 px-4">TENANT ID</th>
                      <th className="py-3.5 px-4">CREATED AT</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredCompanies.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors h-14">
                        <td className="py-3.5 px-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-xs overflow-hidden p-1 shadow-xs">
                            {c.logo ? (
                              <img src={c.logo} alt={c.name} className="w-full h-full object-contain" />
                            ) : (
                              c.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900">{c.name}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-500">{c.id}</td>
                        <td className="py-3.5 px-4 text-xs text-gray-400 font-normal">
                          {new Date(c.createdAt).toLocaleDateString("en-GB")}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            c.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingCompany(c)
                                setCompanyForm({ name: c.name, code: c.code, status: c.status })
                                setShowCompanyModal(true)
                              }}
                              className="h-8 px-3 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit2 size={13} /> Edit
                            </button>

                            <button
                              onClick={() => handleToggleCompanyStatus(c)}
                              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                c.status === "active" ? "bg-amber-50 text-amber-700 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              <Power size={13} /> {c.status === "active" ? "Disable" : "Enable"}
                            </button>

                            <button
                              onClick={() => setDeleteCompanyTarget(c.id)}
                              className="h-8 px-2.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCompanies.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs font-normal text-gray-400">
                          No company records found matching your filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: USER MANAGEMENT WITH PROPER ROLE & TENANT FILTERS */}
          {activeItem === "User Management" && (
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden p-6 space-y-5">
              
              {/* Top Header & Intro */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">User & Credential Management</h2>
                  <p className="text-xs text-gray-400 font-normal">Manage system users, assign roles (Super Admin, Company Admin, Operator) and tenant authorizations</p>
                </div>

                <button
                  onClick={() => setShowUserModal(true)}
                  className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} /> Add System User
                </button>
              </div>

              {/* ADVANCED FILTER TOOLBAR FOR USER MANAGEMENT */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[260px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Filter users by name, email or ID..."
                      className={inputCls}
                    />
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Role Filter */}
                    <div className="flex items-center gap-1.5">
                      <Shield size={13} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500">Role:</span>
                      <select
                        value={userRoleFilter}
                        onChange={e => setUserRoleFilter(e.target.value)}
                        className="h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 cursor-pointer"
                      >
                        <option value="all">All Roles ({usersList.length})</option>
                        <option value="Super Admin">Super Admin ({superAdminCount})</option>
                        <option value="Company Admin">Company Admin ({companyAdminCount})</option>
                        <option value="Operator">Operator / User ({operatorCount})</option>
                      </select>
                    </div>

                    {/* Assigned Tenant Filter */}
                    <div className="flex items-center gap-1.5">
                      <Building2 size={13} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500">Tenant:</span>
                      <select
                        value={userCompanyFilter}
                        onChange={e => setUserCompanyFilter(e.target.value)}
                        className="h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 cursor-pointer"
                      >
                        <option value="all">All Tenants</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                      <Filter size={13} className="text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500">Status:</span>
                      <select
                        value={userStatusFilter}
                        onChange={e => setUserStatusFilter(e.target.value as any)}
                        className="h-10 bg-white border border-gray-200 rounded-xl px-3 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 cursor-pointer"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                      </select>
                    </div>

                    {(userSearch || userRoleFilter !== "all" || userCompanyFilter !== "all" || userStatusFilter !== "all") && (
                      <button
                        onClick={() => { setUserSearch(""); setUserRoleFilter("all"); setUserCompanyFilter("all"); setUserStatusFilter("all") }}
                        className="h-10 px-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="py-3.5 px-4">USER NAME</th>
                      <th className="py-3.5 px-4">EMAIL (LOGIN ID)</th>
                      <th className="py-3.5 px-4">ROLE</th>
                      <th className="py-3.5 px-4">ASSIGNED TENANT</th>
                      <th className="py-3.5 px-4">STATUS</th>
                      <th className="py-3.5 px-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredUsers.map((u: DBUser) => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors h-14">
                        <td className="py-3.5 px-4 font-bold text-gray-900">{u.name}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-600">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                            u.role === "Super Admin" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                            u.role === "Company Admin" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                          {Array.isArray(u.assignedCompanies) ? u.assignedCompanies.join(", ") : u.assignedCompanies || u.company_id || "All Tenants"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {u.status || "active"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {u.role !== "Super Admin" && (
                            <button
                              onClick={() => setDeleteUserTarget(u.id)}
                              className="h-8 px-2.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-xs font-normal text-gray-400">
                          No user records found matching your search and role filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 4: Activity & Audit Logs */}
          {(activeItem === "Activity Logs" || activeItem === "Audit Logs") && (
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden p-6 space-y-4">
              <h2 className="text-base font-bold text-gray-900">Security Operations Audit Log</h2>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/70 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100 sticky top-0">
                    <tr>
                      <th className="py-3.5 px-4">TIMESTAMP</th>
                      <th className="py-3.5 px-4">ENTITY</th>
                      <th className="py-3.5 px-4">ACTION</th>
                      <th className="py-3.5 px-4">ENTITY ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 font-mono text-xs">
                    {auditLogs.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50/50 transition-colors h-12">
                        <td className="py-3 px-4 text-gray-500">{new Date(a.timestamp || a.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-indigo-600">{a.entity}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            a.action === "CREATE" ? "bg-emerald-50 text-emerald-700" :
                            a.action === "UPDATE" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                          }`}>
                            {a.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{a.entityId || a.recordId}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400 text-xs font-sans">
                          No audit entries recorded in backend database yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 5: Settings & License Management */}
          {(activeItem === "System Settings" || activeItem === "License Management") && (
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 max-w-xl">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Settings size={18} className="text-indigo-600" /> Platform System Settings
              </h2>
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                  <div className="font-bold text-gray-900">License Tier</div>
                  <div className="text-gray-500">Commercial Multi-tenant License</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                  <div className="font-bold text-gray-900">Backend Database Path</div>
                  <div className="font-mono text-emerald-600">data/transportos_db.json</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 5-STEP ENTERPRISE COMPANY ONBOARDING WIZARD MODAL */}
      <CompanyWizardModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onCompanyCreated={async () => {
          triggerToast("Company and initial Company Admin account provisioned successfully!")
          await loadData()
        }}
      />

      {/* ENTERPRISE USER ACCOUNT CREATION MODAL */}
      <UserAccountModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onUserSaved={async () => {
          triggerToast("User account credentials provisioned successfully!")
          await loadData()
        }}
        isSuperAdminContext={true}
        defaultCompanyId={companies[0]?.id || "COMP-001"}
      />

      {/* DELETE CONFIRMATION MODALS */}
      <AnimatePresence>
        {deleteCompanyTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 max-w-sm w-full space-y-4 text-center">
              <ShieldAlert size={32} className="mx-auto text-red-500" />
              <h3 className="text-base font-bold text-gray-900">Delete Company Record?</h3>
              <p className="text-xs text-gray-500 font-normal">This operation removes the company permanently from disk.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeleteCompanyTarget(null)} className="flex-1 h-9 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600">
                  Cancel
                </button>
                <button onClick={handleDeleteCompanyConfirm} className="flex-1 h-9 rounded-xl text-xs font-bold bg-red-600 text-white shadow-md shadow-red-500/20">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteUserTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 max-w-sm w-full space-y-4 text-center">
              <ShieldAlert size={32} className="mx-auto text-red-500" />
              <h3 className="text-base font-bold text-gray-900">Remove User Credentials?</h3>
              <p className="text-xs text-gray-500 font-normal">The user will no longer be able to authenticate into the system.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeleteUserTarget(null)} className="flex-1 h-9 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600">
                  Cancel
                </button>
                <button onClick={handleDeleteUserConfirm} className="flex-1 h-9 rounded-xl text-xs font-bold bg-red-600 text-white shadow-md shadow-red-500/20">
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
