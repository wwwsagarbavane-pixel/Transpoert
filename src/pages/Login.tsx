import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Lock, ArrowRight, User, Eye, EyeOff, ShieldCheck,
  Search, ArrowLeft, AlertCircle, MapPin, RefreshCw,
  Building2, Globe, Truck, ShieldAlert
} from "lucide-react"
import Logo from "../components/Logo"
import { DBCompany, DBUser } from "../db/schema"
import { dbQuery } from "../db/db"
import { apiClient } from "../services/apiClient"
import { sessionService } from "../services/sessionService"

interface LoginProps {
  onLoginSuccess: (userPayload: {
    id: string
    name: string
    email: string
    role: string
    company?: DBCompany
    assignedCompanies: string[]
    token: string
  }) => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  // Step: "selection" | "login" | "super_admin" | "forgot_password" | "reset_password"
  const [step, setStep] = useState<"selection" | "login" | "super_admin" | "forgot_password" | "reset_password">("selection")

  // Companies master state
  const [companies, setCompanies] = useState<DBCompany[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<DBCompany | null>(null)

  // Login form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Forgot Password / Password Reset state
  const [resetEmail, setResetEmail] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [tokenValidating, setTokenValidating] = useState(false)

  // Fetch Companies on Mount & check for Reset Token in URL
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        let list = await dbQuery.getAll<DBCompany>("companies")
        if (!list || !Array.isArray(list) || list.length === 0) {
          const direct = await fetch("/api/db/companies").then(r => r.json()).catch(() => null)
          if (direct && direct.data && Array.isArray(direct.data) && direct.data.length > 0) {
            list = direct.data
          }
        }
        if (!list || !Array.isArray(list) || list.length === 0) {
          list = [
            { id: "COMP-DEMO-001", code: "DEMO", name: "Demo Transport", city: "Mumbai", status: "active" },
            { id: "COMP-884526", code: "SARDA", name: "SARDA", city: "Nagpur", status: "active" },
            { id: "COMP-570091", code: "SARDAT", name: "SARDA Transport", city: "Nagpur", status: "active" },
            { id: "COMP-103816", code: "EPRT", name: "EPR Tranposrt", city: "Pune", status: "active" }
          ] as any
        }
        setCompanies(list)
      } catch (err) {
        console.error("Failed to load companies:", err)
        setCompanies([
          { id: "COMP-DEMO-001", code: "DEMO", name: "Demo Transport", city: "Mumbai", status: "active" },
          { id: "COMP-884526", code: "SARDA", name: "SARDA", city: "Nagpur", status: "active" },
          { id: "COMP-570091", code: "SARDAT", name: "SARDA Transport", city: "Nagpur", status: "active" },
          { id: "COMP-103816", code: "EPRT", name: "EPR Tranposrt", city: "Pune", status: "active" }
        ] as any)
      } finally {
        setLoadingCompanies(false)
      }
    }
    fetchCompanies()

    // Restore remembered email
    const savedEmail = localStorage.getItem("remembered_email")
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }

    // Check for password reset token in URL parameters (?token=... or #token=...)
    const urlParams = new URLSearchParams(window.location.search)
    const tokenParam = urlParams.get("token") || urlParams.get("reset_token") || window.location.hash.replace("#", "").split("=")[1]
    if (tokenParam) {
      setResetToken(tokenParam)
      setStep("reset_password")
      setTokenValidating(true)
      apiClient.post("/auth/verify-reset-token", { token: tokenParam })
        .then((res: any) => {
          if (!res || !res.valid) {
            setError(res?.error || "Invalid or expired password reset token.")
          }
        })
        .catch((err: any) => {
          setError(err.message || "Invalid or expired password reset token.")
        })
        .finally(() => setTokenValidating(false))
    }
  }, [])

  // Filtered companies based on search
  const filteredCompanies = companies.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSelectCompany = (comp: DBCompany) => {
    setSelectedCompany(comp)
    setError("")
    setStep("login")
  }

  const handleBackToSelection = () => {
    setStep("selection")
    setSelectedCompany(null)
    setError("")
  }

  const handleSuperAdminMode = () => {
    setStep("super_admin")
    setSelectedCompany(null)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError("Please enter both Username/Email and Password")
      return
    }

    if (step === "login" && !selectedCompany) {
      setError("Please select a company first")
      setStep("selection")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await apiClient.post("/auth/login", {
        email: email.trim(),
        password: password.trim(),
        company_id: selectedCompany?.id,
        step
      })

      if (!res || !res.user) {
        setError("Invalid company, email or password.")
        return
      }

      if (rememberMe) {
        localStorage.setItem("remembered_email", email.trim())
      } else {
        localStorage.removeItem("remembered_email")
      }

      const authUser = res.user
      const comp = authUser.company || selectedCompany || undefined

      sessionService.clearSession()

      onLoginSuccess({
        id: authUser.id,
        name: authUser.name || authUser.email,
        email: authUser.email,
        role: authUser.role || "Company Admin",
        company: comp,
        assignedCompanies: authUser.assignedCompanies || [comp?.id].filter(Boolean),
        token: `jwt_token_${Date.now()}`
      })
    } catch (err: any) {
      setError(err.message || "Invalid company, email or password.")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail.trim()) {
      setError("Please enter your email address")
      return
    }
    setLoading(true)
    setError("")
    setSuccessMsg("")
    try {
      const res: any = await apiClient.post("/auth/forgot-password", { email: resetEmail.trim() })
      setSuccessMsg(res?.message || "If an account matching that email address exists, password reset instructions have been sent.")
    } catch (err: any) {
      setError(err.message || "Failed to process request. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify your new password.")
      return
    }
    setLoading(true)
    setError("")
    setSuccessMsg("")
    try {
      const res: any = await apiClient.post("/auth/reset-password", { token: resetToken, newPassword })
      if (!res || !res.success) {
        setError(res?.error || "Failed to reset password. Please request a new link.")
        return
      }
      setSuccessMsg(res.message || "Your password has been successfully reset. You may now log in.")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please request a new link.")
    } finally {
      setLoading(false)
    }
  }

  const getAvatarGradient = (code: string) => {
    const c = code.toUpperCase()
    if (c.includes("GANESH") || c === "GTR" || c === "GT") return "from-pink-500 to-rose-600"
    if (c.includes("TEST") || c === "TESTTR" || c === "T") return "from-orange-500 to-red-600"
    return "from-red-500 to-rose-600"
  }

  const getInitials = (name: string, code: string) => {
    if (code && code.length <= 3) return code.toUpperCase()
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  }

  const inputCls = "w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 focus:bg-white transition-all duration-150 font-medium"

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans bg-[#F8FAFC]">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1000px] px-6 relative z-10 py-10">

        {/* STEP 1: COMPANY SELECTION (GRID LAYOUT EXACTLY MATCHING USER SCREENSHOT IMAGE 2) */}
        {step === "selection" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-6">

            {/* Header Title with Search on Right side matching Image 2 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Select Workspace Company</h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">Please choose your tenant company to proceed to secure user login</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSuperAdminMode}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <ShieldAlert size={14} /> Super Admin
                </button>
                <div className="relative w-full sm:w-72 shrink-0">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search company or code..."
                    className="w-full h-11 bg-white border border-gray-200 rounded-full pl-9 pr-4 text-xs font-medium text-gray-900 placeholder:text-gray-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Grid of Company Cards matching Image 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loadingCompanies ? (
                <div className="col-span-full py-16 text-center text-xs text-gray-400 font-semibold flex items-center justify-center gap-2">
                  <RefreshCw size={16} className="animate-spin text-indigo-600" /> Querying active tenant workspace registry...
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="col-span-full py-16 text-center text-xs text-gray-400 font-medium bg-white rounded-3xl border border-gray-100">
                  No company workspace found
                </div>
              ) : (
                filteredCompanies.map(comp => (
                  <motion.div
                    key={comp.id}
                    whileHover={{ y: -3, scale: 1.005 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleSelectCompany(comp)}
                    className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        {/* Square Avatar with Gradient matching Image 2 */}
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getAvatarGradient(comp.code)} text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0`}>
                          {comp.logo ? <img src={comp.logo} alt="" className="w-full h-full object-contain rounded-2xl" /> : getInitials(comp.name, comp.code)}
                        </div>

                        {/* Active Tenant Badge matching Image 2 */}
                        <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50/80 border border-indigo-100/60 rounded-full px-3 py-1 flex items-center gap-1.5 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                          ACTIVE TENANT
                        </span>
                      </div>

                      <div className="mt-4">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{comp.name}</h3>
                        <div className="mt-1.5 inline-block text-[10px] font-extrabold text-gray-500 bg-gray-100/80 px-2.5 py-1 rounded-md font-mono uppercase tracking-wide">
                          CODE: {comp.code}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Link matching Image 2 */}
                    <div className="pt-6 mt-4 flex items-center justify-between border-t border-gray-50">
                      <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1 transition-all">
                        Open Workspace Console
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2: LOGIN FORM FOR SELECTED COMPANY OR SUPER ADMIN */}
        {(step === "login" || step === "super_admin") && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl max-w-[440px] mx-auto space-y-5">
            
            {/* Header Logo */}
            <div className="flex flex-col items-center text-center pb-2">
              <Logo className="h-10 w-auto mb-2" />
              <h2 className="text-xl font-extrabold text-gray-900">
                {step === "super_admin" ? "Super Admin Console" : "Sign In to ERP"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">
                {step === "super_admin" ? "Global System Management Portal" : `Workspace: ${selectedCompany?.name} (${selectedCompany?.code})`}
              </p>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <button
                type="button"
                onClick={handleBackToSelection}
                className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Company Selection
              </button>

              {step === "super_admin" && (
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
                  <ShieldCheck size={12} /> Super Admin Mode
                </span>
              )}
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {step === "super_admin" ? "Super Admin Username/Email" : "Username or Email Address"} <span className="text-indigo-500">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={step === "super_admin" ? "admin@transportos.com" : "Enter email or username"}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Password <span className="text-indigo-500">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-400 border-gray-300"
                  />
                  Remember Email Only
                </label>
                <button
                  type="button"
                  onClick={() => { setStep("forgot_password"); setError(""); setSuccessMsg(""); if (email) setResetEmail(email); }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 3: FORGOT PASSWORD REQUEST FORM */}
        {step === "forgot_password" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl max-w-[440px] mx-auto space-y-5">
            <div className="flex flex-col items-center text-center pb-2">
              <Logo className="h-10 w-auto mb-2" />
              <h2 className="text-xl font-extrabold text-gray-900">Forgot Password</h2>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">
                Enter your account email to receive secure password reset instructions
              </p>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <button
                type="button"
                onClick={() => { setStep(selectedCompany ? "login" : "selection"); setError(""); setSuccessMsg(""); }}
                className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-700 flex items-start gap-2.5">
                <ShieldCheck size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                <div className="space-y-1">
                  <p>{successMsg}</p>
                  <p className="text-[11px] font-normal text-emerald-600">Please check your inbox or security mail logs for your 15-minute reset token.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Account Email Address <span className="text-indigo-500">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="user@transportos.com"
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <>
                    <span>Send Password Reset Link</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 4: RESET PASSWORD FORM */}
        {step === "reset_password" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl max-w-[440px] mx-auto space-y-5">
            <div className="flex flex-col items-center text-center pb-2">
              <Logo className="h-10 w-auto mb-2" />
              <h2 className="text-xl font-extrabold text-gray-900">Set New Password</h2>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">
                Create a strong new password for your TransportOS account
              </p>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <button
                type="button"
                onClick={() => { setStep("login"); setError(""); setSuccessMsg(""); }}
                className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            </div>

            {tokenValidating ? (
              <div className="py-8 text-center text-xs text-gray-500 font-semibold flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-indigo-600" /> Verifying cryptographically secure reset token...
              </div>
            ) : (
              <>
                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-600 flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {successMsg ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-700 flex flex-col items-center text-center space-y-3">
                    <ShieldCheck size={28} className="text-emerald-600" />
                    <div>
                      <p className="font-bold text-sm">{successMsg}</p>
                      <p className="text-xs font-normal text-emerald-600 mt-1">Your password token has been invalidated and updated securely.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setStep("login"); setError(""); setSuccessMsg(""); }}
                      className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer mt-2"
                    >
                      Sign In Now
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    {!resetToken && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Password Reset Token <span className="text-indigo-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={resetToken}
                            onChange={e => setResetToken(e.target.value)}
                            placeholder="Enter reset token"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        New Password <span className="text-indigo-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Confirm New Password <span className="text-indigo-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 space-y-1 text-[11px] text-gray-500 font-medium">
                      <p className="font-bold text-gray-700">Password Requirements:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li className={newPassword.length >= 8 ? "text-emerald-600 font-semibold" : ""}>Minimum 8 characters long</li>
                        <li className={/[A-Z]/.test(newPassword) ? "text-emerald-600 font-semibold" : ""}>At least one uppercase letter (A-Z)</li>
                        <li className={/[a-z]/.test(newPassword) ? "text-emerald-600 font-semibold" : ""}>At least one lowercase letter (a-z)</li>
                        <li className={/[0-9]/.test(newPassword) ? "text-emerald-600 font-semibold" : ""}>At least one number (0-9)</li>
                        <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? "text-emerald-600 font-semibold" : ""}>At least one special character (!@#$%^&*)</li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <>
                          <span>Update & Save Password</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}
          </motion.div>
        )}

      </div>
    </div>
  )
}
