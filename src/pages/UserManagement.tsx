import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import {
  Search, Plus, Shield, Trash2, Edit2, Building2, Users, Filter
} from "lucide-react"
import { userRepository, companyRepository } from "../repositories/repositories"
import { DBUser, DBCompany } from "../db/schema"
import { companyContext } from "../services/companyContext"
import { sessionService } from "../services/sessionService"
import UserAccountModal from "../components/UserAccountModal"
import { DeleteDialog } from "../components/Modal"

// Helper to check if a user belongs to Admin Panel Users
const isAdminPanelUser = (u: DBUser): boolean => {
  const norm = (u.role || "").toLowerCase().replace(/[^a-z]/g, "")
  return (
    norm.includes("superadmin") ||
    norm.includes("useradmin") ||
    norm.includes("systemadmin") ||
    norm.includes("platformadmin")
  )
}

export default function UserManagement() {
  // Data state
  const [allUsers, setAllUsers] = useState<DBUser[]>([])
  const [companies, setCompanies] = useState<DBCompany[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modals
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<DBUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string>("ALL")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")

  const activeCompId = companyContext.getActiveCompanyId() || "COMP-001"
  const activeCompanyObj = useMemo(() => {
    return companies.find(c => c.id === activeCompId || c.code === activeCompId)
  }, [companies, activeCompId])

  const session = sessionService.getSession()
  const loggedInUserRole = (session.user?.role || "").trim()
  const isSuperAdmin = loggedInUserRole === "Super Admin" || loggedInUserRole.toLowerCase().includes("super")

  // Load active company users and company master list
  const loadData = async () => {
    setLoading(true)
    try {
      const [compList, userList] = await Promise.all([
        companyRepository.findAll().catch(() => []),
        userRepository.findAll(activeCompId).catch(() => [])
      ])
      setCompanies(compList || [])
      setAllUsers(userList || [])
    } catch (err) {
      console.error("Failed to load user management data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeCompId])

  // Company Name Mapping Lookup
  const companyMap = useMemo(() => {
    const map: Record<string, { name: string; code: string }> = {}
    companies.forEach(c => {
      map[c.id] = { name: c.name, code: c.code || c.id }
      if (c.code) map[c.code] = { name: c.name, code: c.code }
    })
    return map
  }, [companies])

  // Helper to parse user's assigned company IDs
  const getAssignedCompanyIds = (u: DBUser): string[] => {
    let ids: string[] = []
    if (Array.isArray(u.assignedCompanies)) {
      ids = u.assignedCompanies
    } else if (typeof u.assignedCompanies === "string") {
      try {
        ids = JSON.parse(u.assignedCompanies)
      } catch {
        ids = [u.assignedCompanies]
      }
    }
    if (u.company_id && !ids.includes(u.company_id)) {
      ids.unshift(u.company_id)
    }
    return ids.filter(Boolean)
  }

  // Company Users List (strictly active company scope, excluding platform admins)
  const companyUsers = useMemo(() => {
    const activeCode = activeCompanyObj?.code || activeCompId
    return allUsers.filter(u => {
      if (isAdminPanelUser(u)) return false
      const assigned = getAssignedCompanyIds(u)
      return (
        u.company_id === activeCompId ||
        u.company_id === activeCode ||
        assigned.includes(activeCompId) ||
        assigned.includes(activeCode)
      )
    })
  }, [allUsers, activeCompId, activeCompanyObj])

  // Current display list based on filters
  const filteredUsers = useMemo(() => {
    return companyUsers.filter(u => {
      // Role Filter
      if (filterRole !== "ALL" && u.role !== filterRole) {
        return false
      }

      // Status Filter
      if (filterStatus !== "ALL") {
        const isActive = u.status === "active" || u.status === 1 || u.status === undefined
        if (filterStatus === "active" && !isActive) return false
        if (filterStatus === "inactive" && isActive) return false
      }

      // Search Query Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchName = u.name?.toLowerCase().includes(q)
        const matchEmail = u.email?.toLowerCase().includes(q)
        const matchMobile = u.mobile?.toLowerCase().includes(q)
        const matchRole = u.role?.toLowerCase().includes(q)
        const matchId = u.id?.toLowerCase().includes(q)
        return matchName || matchEmail || matchMobile || matchRole || matchId
      }

      return true
    })
  }, [companyUsers, filterRole, filterStatus, searchQuery])

  const handleEditUser = (u: DBUser) => {
    setEditingUser(u)
    setShowModal(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await userRepository.delete(deleteTarget)
      await loadData()
    } catch (err) {
      console.error("Failed to delete user:", err)
    } finally {
      setDeleteTarget(null)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never"
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex-1 overflow-y-auto font-sans bg-gray-50/50">
      <div className="max-w-[1320px] mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* Top Header & Context */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Enterprise User Management</h1>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                Manage Company Users with role-based access control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingUser(null)
                setShowModal(true)
              }}
              className="flex items-center gap-2 h-10 px-5 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 cursor-pointer transition-all active:scale-95"
            >
              <Plus size={16} /> Add Company User
            </button>
          </div>
        </motion.div>

        {/* DATA VIEW */}
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px] w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name, email, mobile, role or ID..."
                className="w-full h-10 bg-gray-50/80 border border-gray-200/80 rounded-xl pl-9 pr-3.5 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
              />
            </div>

            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
              {/* Active Workspace Badge */}
              <div className="flex items-center gap-1.5 bg-indigo-50/90 border border-indigo-100/80 rounded-xl px-3.5 h-10 text-xs font-extrabold text-indigo-900 shadow-2xs">
                <Building2 size={13} className="text-indigo-600 shrink-0" />
                <span>{activeCompanyObj?.name || "Active Company"}</span>
                <span className="text-[10px] text-indigo-500 font-mono font-bold">({activeCompanyObj?.code || activeCompId})</span>
              </div>

              {/* Role Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-gray-50/80 border border-gray-200/80 rounded-xl px-3 h-10 text-xs">
                <Filter size={13} className="text-gray-400 shrink-0" />
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="bg-transparent text-gray-800 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value="Company Admin">Company Admin</option>
                  <option value="Operator">Operator</option>
                </select>
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-gray-50/80 border border-gray-200/80 rounded-xl px-3 h-10 text-xs">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-transparent text-gray-800 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              <div className="text-xs text-gray-400 font-semibold px-2">
                Total: <span className="text-indigo-600 font-bold font-mono">{filteredUsers.length}</span>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/70 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-4">USER DETAILS</th>
                    <th className="py-3.5 px-4">EMAIL (LOGIN ID)</th>
                    <th className="py-3.5 px-4">ROLE</th>
                    <th className="py-3.5 px-4">ASSIGNED COMPANY</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4">LAST LOGIN</th>
                    <th className="py-3.5 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredUsers.map(u => {
                    const isActive = u.status === "active" || u.status === 1 || u.status === undefined

                    // Display normalized role badge
                    const displayRole = u.role === "Company Admin" ? "Company Admin" : "Operator"

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors h-16">
                        {/* Name & Mobile */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{u.name}</span>
                            <span className="text-xs text-gray-400 font-mono">{u.mobile || u.id}</span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-700">
                          {u.email}
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                            displayRole === "Company Admin"
                              ? "bg-amber-50 text-amber-800 border-amber-200/80"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                          }`}>
                            {displayRole}
                          </span>
                        </td>

                        {/* Assigned Company Badge */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50/80 text-indigo-800 border border-indigo-100 shadow-2xs">
                            <Building2 size={11} className="text-indigo-500 shrink-0" />
                            <span>{activeCompanyObj?.name || "Active Company"}</span>
                            <span className="text-[10px] text-indigo-400 font-mono font-bold">({activeCompanyObj?.code || activeCompId})</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Last Login */}
                        <td className="py-3.5 px-4 text-xs font-medium text-gray-500">
                          {formatDate(u.lastLogin)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditUser(u)}
                              className="h-8 px-3 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Edit2 size={13} /> Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u.id)}
                              className="h-8 px-2.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-xs font-normal text-gray-400 space-y-2">
                        <Users size={24} className="mx-auto text-gray-300" />
                        <p>No user records found matching active filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* User Account Modal */}
      <UserAccountModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingUser(null) }}
        onUserSaved={loadData}
        editingUser={editingUser}
        isSuperAdminContext={false}
        targetUserType="company"
        defaultCompanyId={activeCompId}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove User Account"
        message="The user account will be permanently removed. Are you sure you want to proceed?"
        itemName={allUsers.find(u => u.id === deleteTarget)?.name || ""}
      />
    </div>
  )
}
