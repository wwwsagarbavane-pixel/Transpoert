import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import {
  UserCheck, Shield, KeyRound, Building2, Eye, EyeOff,
  AlertCircle, CheckCircle2, X, Lock, User, Check
} from "lucide-react"
import { dbQuery } from "../db/db"
import { companyRepository, branchRepository, userRepository } from "../repositories/repositories"
import { DBUser, DBCompany } from "../db/schema"
import { sessionService } from "../services/sessionService"
import { rbacService } from "../services/rbacService"
import SearchDropdown from "./SearchDropdown"

interface UserAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onUserSaved: () => void
  editingUser?: DBUser | null
  isSuperAdminContext?: boolean
  targetUserType?: "company" | "admin"
  defaultCompanyId?: string
}

const inputCls = "w-full h-11 bg-gray-50/80 border border-gray-200/80 rounded-xl px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 focus:bg-white transition-all font-normal"

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label} {required && <span className="text-indigo-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const safeTrim = (val: any) => (typeof val === "string" ? val.trim() : "")

export default function UserAccountModal({
  isOpen,
  onClose,
  onUserSaved,
  editingUser,
  isSuperAdminContext = false,
  targetUserType = "company",
  defaultCompanyId = "COMP-DEMO-001"
}: UserAccountModalProps) {
  const [companies, setCompanies] = useState<DBCompany[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([])
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    company_id: defaultCompanyId,
    branch: "Pune Head Office",
    role: isSuperAdminContext ? "Company Admin" : "Operator",
    status: "active" as "active" | "inactive"
  })

  // State to hold the user's checked permission keys
  const [effectivePermissions, setEffectivePermissions] = useState<string[]>([])
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false)
  const [tempPermissions, setTempPermissions] = useState<string[]>([])

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const compList = await companyRepository.findAll()
        setCompanies(compList)

        // Set initial company ID & assigned companies
        let assignedList: string[] = []
        if (editingUser?.assignedCompanies) {
          if (Array.isArray(editingUser.assignedCompanies)) {
            assignedList = editingUser.assignedCompanies
          } else if (typeof editingUser.assignedCompanies === "string") {
            try { assignedList = JSON.parse(editingUser.assignedCompanies) } catch { assignedList = [editingUser.assignedCompanies] }
          }
        }
        if (editingUser?.company_id && !assignedList.includes(editingUser.company_id)) {
          assignedList.unshift(editingUser.company_id)
        }
        if (assignedList.length === 0) {
          assignedList = [defaultCompanyId]
        }
        setSelectedCompanyIds(assignedList.filter(Boolean))

        const initialCompanyId = editingUser?.company_id || assignedList[0] || defaultCompanyId
        
        let branchList: any[] = []
        if (initialCompanyId) {
          branchList = await branchRepository.findAll(initialCompanyId)
        }
        setBranches(branchList || [])

        const initialBranchName = editingUser?.branch || (branchList.length > 0 ? branchList[0].name : "")

        if (editingUser) {
          setForm({
            name: safeTrim(editingUser.name || (editingUser as any).full_name),
            username: safeTrim((editingUser as any).username || editingUser.email),
            email: safeTrim(editingUser.email),
            mobile: safeTrim(editingUser.mobile),
            password: "",
            confirmPassword: "",
            company_id: initialCompanyId,
            branch: initialBranchName,
            role: editingUser.role || "Operator",
            status: (editingUser.status === 1 || editingUser.status === "active") ? "active" : "inactive"
          })
        } else {
          setForm({
            name: "",
            username: "",
            email: "",
            mobile: "",
            password: "",
            confirmPassword: "",
            company_id: initialCompanyId,
            branch: initialBranchName,
            role: targetUserType === "admin" ? "User Admin" : "Operator",
            status: "active"
          })
        }
      } catch (err: any) {
        console.error("Failed to load masters in UserAccountModal:", err)
        setErrorMsg(`Failed to load data: ${err.message || err}`)
      }
    }
    if (isOpen) {
      setErrorMsg("")
      setShowPassword(false)
      loadMasters()
    }
  }, [isOpen, editingUser, defaultCompanyId, isSuperAdminContext])

  const sessionUser = sessionService.getSession().user as any
  const userAssignedComps = useMemo(() => {
    let ids: string[] = []
    if (sessionUser?.assignedCompanies) {
      if (Array.isArray(sessionUser.assignedCompanies)) {
        ids = sessionUser.assignedCompanies
      } else if (typeof sessionUser.assignedCompanies === "string") {
        try { ids = JSON.parse(sessionUser.assignedCompanies) } catch { ids = [sessionUser.assignedCompanies] }
      }
    }
    if (sessionUser?.company_id && !ids.includes(sessionUser.company_id)) {
      ids.unshift(sessionUser.company_id)
    }
    if (!ids.includes(defaultCompanyId)) {
      ids.push(defaultCompanyId)
    }
    return ids.filter(Boolean)
  }, [sessionUser, defaultCompanyId])

  const visibleCompanies = useMemo(() => {
    if (isSuperAdminContext) return companies
    return companies.filter((c: any) => userAssignedComps.includes(c.id) || userAssignedComps.includes(c.code))
  }, [isSuperAdminContext, companies, userAssignedComps])

  const toggleCompanySelection = (compId: string) => {
    setSelectedCompanyIds(prev => {
      let updated: string[]
      if (prev.includes(compId)) {
        if (prev.length === 1) return prev // Keep at least one company
        updated = prev.filter(id => id !== compId)
      } else {
        updated = [...prev, compId]
      }
      if (updated.length > 0) {
        handleCompanyChange(updated[0])
      }
      return updated
    })
  }

  const handleCompanyChange = async (companyId: string) => {
    try {
      setErrorMsg("")
      const freshBranches = await branchRepository.findAll(companyId)
      setBranches(freshBranches || [])

      const initialBranchName = freshBranches && freshBranches.length > 0 ? freshBranches[0].name : ""
      setForm(prev => ({
        ...prev,
        company_id: companyId,
        branch: initialBranchName
      }))
    } catch (err: any) {
      console.error("Failed to load branches for company:", companyId, err)
      setErrorMsg(`Failed to load branches: ${err.message || err}`)
      setBranches([])
    }
  }

  // Handle changing selected Role
  const handleRoleChange = (newRole: string) => {
    setForm(prev => ({ ...prev, role: newRole }))
    setEffectivePermissions(rbacService.getPermissionsForRole(newRole))
  }

  // Filter branches dynamically based on selected company_id
  const branchOptions = branches.length > 0
    ? branches.map(b => ({ value: b.name, label: `${b.name} (${b.code || "HQ"})` }))
    : [{ value: "", label: "No branches available for this company." }]

  // Password Strength Calculator
  const computePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "None", color: "bg-gray-200" }
    let score = 0
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[a-z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500", text: "text-red-600" }
    if (score === 3) return { score, label: "Medium", color: "bg-amber-500", text: "text-amber-600" }
    if (score === 4) return { score, label: "Strong", color: "bg-indigo-500", text: "text-indigo-600" }
    return { score, label: "Enterprise Strong", color: "bg-emerald-500", text: "text-emerald-600" }
  }

  const pwdStrength = computePasswordStrength(form.password)

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    const nameVal = safeTrim(form.name)
    const emailVal = safeTrim(form.email)
    const mobileVal = safeTrim(form.mobile)
    const passwordVal = form.password || ""
    const confirmPasswordVal = form.confirmPassword || ""

    // 1. Mandatory Validations
    if (isSuperAdminContext && !form.company_id) { setErrorMsg("Assigned Company is required"); return }
    if (!form.branch || form.branch === "No branches found for this company.") { setErrorMsg("Branch selection is required"); return }
    if (!nameVal) { setErrorMsg("Full Name is required"); return }
    if (!emailVal) { setErrorMsg("Email Address is required"); return }
    if (!mobileVal) { setErrorMsg("Mobile Number is required"); return }
    const isNewUser = !editingUser
    if (isNewUser && !passwordVal) { setErrorMsg("Password is required"); return }
    if (passwordVal && passwordVal !== confirmPasswordVal) { setErrorMsg("Password and Confirm Password do not match"); return }

    if (passwordVal) {
      if (passwordVal.length < 8) {
        setErrorMsg("Password must be at least 8 characters long")
        return
      }

      if (!/[A-Z]/.test(passwordVal) || !/[a-z]/.test(passwordVal) || !/[0-9]/.test(passwordVal)) {
        setErrorMsg("Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number")
        return
      }
    }

    setSaving(true)
    try {
      const targetCompany = form.company_id || defaultCompanyId
      const allUsers = await dbQuery.getAllForCompany<DBUser>("users", targetCompany)

      // 2. Uniqueness Checks scoped inside the selected company
      const existingEmail = allUsers.find(
        u => u.company_id === targetCompany && safeTrim(u.email).toLowerCase() === emailVal.toLowerCase() && u.id !== editingUser?.id
      )
      if (existingEmail) {
        setErrorMsg(`Email "${emailVal}" is already registered to another user account in this company`)
        setSaving(false)
        return
      }

      // 3. Resolve branch details and role ID
      const selectedBranchObj = branches.find((b: any) => b.name === form.branch)
      const branchId = selectedBranchObj?.id || `BR-${Date.now()}`
      
      // Save role ID (form.role slugified)
      const roleId = (form.role || "Operator").toLowerCase().replace(/\s+/g, "-")

      // Calculate Custom Permissions (overrides vs default role permissions)
      const defaultRolePerms = rbacService.getPermissionsForRole(form.role)
      const added = effectivePermissions.filter(k => !defaultRolePerms.includes(k))
      const removed = defaultRolePerms.filter(k => !effectivePermissions.includes(k))
      const customPermissionsObj = { added, removed }

      // Creator session
      const currentSession = sessionService.getSession()
      const createdBy = currentSession.user?.name || "System"

      const userId = editingUser?.id || `USR-${Date.now()}`
      const usernameVal = safeTrim(form.username) || emailVal.toLowerCase()

      // 4. Construct DBUser Object matching exact requirements & backwards compatibility
      const finalPassword = passwordVal || editingUser?.password || (editingUser as any)?.password_hash

      const newUserRecord: any = {
        id: userId,
        company_id: targetCompany,
        branch_id: branchId,
        role_id: roleId,
        full_name: nameVal,
        username: usernameVal,
        email: emailVal.toLowerCase(),
        mobile: mobileVal,
        password_hash: finalPassword,
        status: form.status,
        created_by: createdBy,
        created_at: editingUser?.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),

        // Multi-tenant permissions tracking fields
        custom_permissions: JSON.stringify(customPermissionsObj),
        effective_permissions: JSON.stringify(effectivePermissions),

        // Backwards compatibility properties
        name: nameVal,
        password: finalPassword,
        role: form.role as any,
        branch: form.branch || "Main HQ",
        branch_ids: JSON.stringify([form.branch || "Main HQ"]),
        assignedCompanies: [targetCompany],
        permissions: effectivePermissions,
        lastLogin: editingUser?.lastLogin || new Date().toISOString(),
        createdAt: editingUser?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (editingUser) {
        await userRepository.update(editingUser.id, newUserRecord)
      } else {
        await userRepository.create(newUserRecord)
      }
      onUserSaved()
      onClose()
    } catch (err: any) {
      console.error("Save user account error:", err)
      setErrorMsg(err.message || "Failed to save user account")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const companyRoleOptions = ["Company Admin", "Manager", "Billing", "Delivery", "Operator", "Viewer"]
  const systemRoleOptions = ["Super Admin", "System Admin", "Support Admin"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center shadow-md shadow-indigo-500/20">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {editingUser ? "Edit User Credentials & Access" : "Create Enterprise User Account"}
              </h2>
              <p className="text-xs text-gray-400 font-normal">Full login account with RBAC authorization and tenant mapping</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Organization & Role Mapping */}
          <div className="space-y-4 border-b border-gray-100 pb-5">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 size={13} className="text-indigo-600" /> 1. Organization & Role Mapping
            </div>

            <div className={`grid grid-cols-1 ${isSuperAdminContext ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-4`}>
              {isSuperAdminContext && (
                <Field label="Company" required>
                  <SearchDropdown
                    value={form.company_id}
                    onChange={handleCompanyChange}
                    options={companies.map(c => ({
                      value: c.id,
                      label: `${c.name} (${c.code || c.id})`
                    }))}
                    placeholder="Select company"
                  />
                </Field>
              )}

              <Field label="Branch" required>
                <SearchDropdown
                  value={form.branch}
                  onChange={val => setForm({ ...form, branch: val })}
                  options={branchOptions}
                  placeholder="Select branch"
                />
              </Field>

              <Field label="Role" required>
                <SearchDropdown
                  value={form.role}
                  onChange={handleRoleChange}
                  options={
                    targetUserType === "admin"
                      ? ["Super Admin", "User Admin"]
                      : ["Company Admin", "Operator"]
                  }
                  placeholder="Select role"
                />
              </Field>
            </div>
          </div>

          {/* Section 2: Personal Information */}
          <div className="space-y-4 border-b border-gray-100 pb-5">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-indigo-600" /> 2. Personal Information
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className={inputCls}
                />
              </Field>

              <Field label="Email Address (Login ID)" required>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="rahul@company.com"
                  className={inputCls}
                />
              </Field>

              <Field label="Mobile Number" required>
                <input
                  type="tel"
                  required
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                  placeholder="98200XXXXX"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Section 3: Login Credentials */}
          <div className="space-y-4 border-b border-gray-100 pb-5">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={13} className="text-indigo-600" /> 3. Login Credentials
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Password" required={!editingUser}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required={!editingUser}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder={editingUser ? "Leave blank to keep current password" : "••••••••"}
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm Password" required={!editingUser}>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required={!editingUser}
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder={editingUser ? "Leave blank to keep current password" : "••••••••"}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Password Strength Indicator */}
            {form.password && (
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-500">Password Strength:</span>
                  <span className={`font-extrabold ${pwdStrength.text}`}>{pwdStrength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full ${pwdStrength.color} transition-all duration-300`}
                    style={{ width: `${(pwdStrength.score / 5) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-400">
                  Must be 8+ chars with uppercase, lowercase, number & special char.
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Status */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={13} className="text-indigo-600" /> 4. Status
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Status">
                <SearchDropdown
                  value={form.status}
                  onChange={val => setForm({ ...form, status: val as any })}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" }
                  ]}
                  placeholder="Select status"
                />
              </Field>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 size={16} />
              {saving ? "Provisioning..." : editingUser ? "Update User Account" : "Create Login User Account"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
