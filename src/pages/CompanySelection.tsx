import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Building, Plus, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, LogOut } from "lucide-react"
import { companyRepository } from "../repositories/repositories"
import { DBCompany } from "../db/schema"
import CompanyWizardModal from "../components/CompanyWizardModal"

interface CompanySelectionProps {
  onSelectCompany: (company: DBCompany) => void
  onLogout: () => void
  assignedCompanies?: string[]
  userName?: string
  userRole?: string
}

export default function CompanySelection({ onSelectCompany, onLogout, assignedCompanies, userName, userRole }: CompanySelectionProps) {
  const [companies, setCompanies] = useState<DBCompany[]>([])
  const [showWizard, setShowWizard] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadCompanies = async () => {
    setLoading(true)
    const list = await companyRepository.findAll()
    const activeList = Array.isArray(list) ? list.filter(c => c.status === "active") : []
    
    // Filter companies by user's RBAC assigned companies if restricted
    if (assignedCompanies && !assignedCompanies.includes("*")) {
      const authorized = activeList.filter(c => assignedCompanies.includes(c.id))
      setCompanies(authorized.length > 0 ? authorized : activeList)
    } else {
      setCompanies(activeList)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCompanies()
  }, [assignedCompanies])

  const handleCompanyCreated = async (newCompanyId: string) => {
    await loadCompanies()
    const all = await companyRepository.findAll()
    const newlyCreated = all.find(c => c.id === newCompanyId)
    if (newlyCreated) {
      onSelectCompany(newlyCreated)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-purple-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-200/70 bg-white/80 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <img src="/transportos-logo.png" alt="TransportOS Logo" className="h-10 w-auto object-contain" />
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Multi-Tenant ERP</span>
        </div>

        <div className="flex items-center gap-4">
          {userName && (
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-gray-900">{userName}</div>
              <div className="text-[10px] font-semibold text-indigo-600 uppercase">{userRole || "Company User"}</div>
            </div>
          )}
          <button
            onClick={onLogout}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Company Selection Screen Container */}
      <main className="max-w-[1100px] w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-center relative z-10 space-y-8">
        
        {/* Title Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={14} className="text-indigo-600" /> Authorized Business Workspace
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Select Business Company</h1>
          <p className="text-sm text-gray-500 font-normal">Choose an authorized tenant context to open your operational ERP dashboard</p>
        </div>

        {/* Company Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(comp => (
            <motion.div
              key={comp.id}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectCompany(comp)}
              className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-md hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-base flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors overflow-hidden p-1">
                    {comp.logo ? (
                      <img src={comp.logo} alt={comp.name} className="w-full h-full object-contain" />
                    ) : (
                      comp.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {comp.status === "inactive" ? "Inactive" : "Active Workspace"}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{comp.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">Tenant ID: <span className="font-mono text-gray-600">{comp.id}</span></p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Status: Active
                </span>
                <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Open Workspace <ArrowRight size={14} />
                </span>
              </div>
            </motion.div>
          ))}

          {companies.length === 0 && !loading && (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-200 text-sm space-y-2">
              <Building size={32} className="mx-auto text-gray-300" />
              <p className="font-semibold text-gray-700">No authorized companies assigned to your user account.</p>
              <p className="text-xs">Contact your System Super Admin to request tenant authorization.</p>
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-gray-200/60 bg-white/50 text-center text-xs text-gray-400 relative z-10">
        TransportOS Enterprise Multi-tenant Security Engine · Licensed Deployment
      </footer>

      {/* Setup Wizard Modal */}
      <CompanyWizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onCompanyCreated={handleCompanyCreated}
      />
    </div>
  )
}
