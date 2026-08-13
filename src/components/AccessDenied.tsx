import { motion } from "framer-motion"
import { ShieldAlert, ArrowLeft, Lock, Building2, UserCheck } from "lucide-react"

interface AccessDeniedProps {
  pageName: string
  userName?: string
  userRole?: string
  companyName?: string
  onReturnHome: () => void
}

export default function AccessDenied({
  pageName,
  userName = "User",
  userRole = "Operator",
  companyName = "TransportOS Workspace",
  onReturnHome
}: AccessDeniedProps) {
  return (
    <div className="flex-1 overflow-y-auto font-sans flex items-center justify-center p-6 bg-slate-50/50 min-h-[calc(100vh-60px)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-white border border-gray-100 rounded-3xl shadow-2xl p-8 text-center space-y-6"
      >
        {/* Shield Security Alert Badge */}
        <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 border border-purple-200/80 flex items-center justify-center mx-auto shadow-md shadow-purple-500/10">
          <ShieldAlert size={32} />
        </div>

        {/* Header Title */}
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-red-50 text-red-700 border border-red-200 tracking-wider">
            HTTP 403 · Access Denied
          </span>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Unauthorized Module Access</h2>
          <p className="text-xs text-gray-500 font-normal leading-relaxed">
            Your role (<strong className="text-purple-700 font-bold">{userRole}</strong>) does not have authorization to view or execute operations in <strong className="text-gray-800">{pageName}</strong>.
          </p>
        </div>

        {/* User Role Context Card */}
        <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-2.5 text-left text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Logged Account:</span>
            <span className="font-bold text-gray-900 flex items-center gap-1">
              <UserCheck size={13} className="text-indigo-600" /> {userName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Assigned Role:</span>
            <span className="font-extrabold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md uppercase text-[10px]">
              {userRole}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Attempted Module:</span>
            <span className="font-bold text-red-600 font-mono text-[11px] flex items-center gap-1">
              <Lock size={12} /> {pageName}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200/60 pt-2 mt-1">
            <span className="text-gray-400 font-medium">Workspace Tenant:</span>
            <span className="font-semibold text-gray-700 truncate max-w-[180px] flex items-center gap-1">
              <Building2 size={12} className="text-gray-400" /> {companyName}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onReturnHome}
            className="w-full h-11 rounded-2xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ArrowLeft size={15} /> Return to Allowed Dashboard
          </button>
        </div>

        <p className="text-[11px] text-gray-400 font-medium">
          If you require access to this module, contact your Company Administrator.
        </p>
      </motion.div>
    </div>
  )
}
