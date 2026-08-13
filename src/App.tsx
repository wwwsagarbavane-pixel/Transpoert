import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import Dashboard from "./components/Dashboard"
import CreateLR from "./pages/CreateLR"
import LRList from "./pages/LRList"
import BlankLR from "./pages/BlankLR"
import Delivery from "./pages/Delivery"
import Billing from "./pages/Billing"
import Parties from "./pages/Parties"
import BranchMaster from "./pages/BranchMaster"
import Vehicles from "./pages/Vehicles"
import Drivers from "./pages/Drivers"
import VehicleOwners from "./pages/VehicleOwners"
import Agents from "./pages/Agents"
import ArticleMaster from "./pages/ArticleMaster"
import StationMaster from "./pages/StationMaster"
import Reports from "./pages/Reports"
import UserManagement from "./pages/UserManagement"
import CompanySetup from "./pages/CompanySetup"
import Login from "./pages/Login"
import Profile from "./pages/Profile"
import LandingPage from "./pages/LandingPage"
import AdminControlPanel from "./pages/AdminControlPanel"
import AccessDenied from "./components/AccessDenied"
import { canAccessPage } from "./security/rbac"
import { DBCompany } from "./db/schema"
import { companyContext } from "./services/companyContext"
import { sessionService } from "./services/sessionService"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React Error:", error, errorInfo)
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-md">
              <AlertCircle size={28} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold tracking-tight text-white">TransportOS Recovery System</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An isolated component error occurred. The main ERP environment remains active.
              </p>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/80 text-left font-mono text-[11px] text-red-400 overflow-x-auto max-h-24">
              {this.state.error?.message || "Render exception encountered."}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={this.handleRetry}
                className="flex-1 h-10 rounded-xl text-xs font-bold text-slate-200 bg-slate-700 hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 h-10 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw size={14} /> Reload ERP
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function getPageFromPathname(): string | null {
  try {
    const path = window.location.pathname.toLowerCase().replace(/^\/+|\/+$/g, "")
    if (path === "billing") return "Billing"
    if (path === "create-lr" || path === "createlr") return "Create LR"
    if (path === "lr-register" || path === "lrlist" || path === "lrs") return "LR Register"
    if (path === "parties") return "Parties"
    if (path === "delivery") return "Delivery"
    if (path === "vehicles") return "Vehicles"
    if (path === "drivers") return "Drivers"
    if (path === "reports") return "Reports"
  } catch {}
  return null
}

function MainApp() {
  const initialSession = sessionService.getSession()
  const pathPage = getPageFromPathname()

  const [showLanding, setShowLanding] = useState(!initialSession.isLoggedIn)
  const [selectedCompany, setSelectedCompany] = useState<DBCompany | null>(initialSession.company)
  const [isLoggedIn, setIsLoggedIn] = useState(initialSession.isLoggedIn)
  const [authUser, setAuthUser] = useState<any>(initialSession.user)
  
  const [collapsed, setCollapsed] = useState(false)
  function isSuperAdminRole(role?: string): boolean {
    if (!role) return false
    const r = role.toUpperCase().replace(/_/g, " ").trim()
    return r === "SUPER ADMIN" || r === "SUPERADMIN"
  }

  const [activeItem, setActiveItem] = useState(
    pathPage || (
      initialSession.activePage === "AdminControlPanel" && !isSuperAdminRole(initialSession.user?.role)
        ? "Dashboard"
        : initialSession.activePage || "Dashboard"
    )
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingLrRecord, setEditingLrRecord] = useState<any>(null)

  useEffect(() => {
    const session = sessionService.getSession()
    if (session.isLoggedIn && session.user) {
      setShowLanding(false)
      setIsLoggedIn(true)
      setAuthUser(session.user)
      if (session.company) {
        setSelectedCompany(session.company)
        companyContext.setActiveCompanyId(session.company.id)
      }
      const p = getPageFromPathname()
      if (p) {
        setActiveItem(p)
        sessionService.updateActivePage(p)
      } else if (!isSuperAdminRole(session.user.role) && session.activePage === "AdminControlPanel") {
        setActiveItem("Dashboard")
        sessionService.updateActivePage("Dashboard")
      }
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn && activeItem) {
      sessionService.updateActivePage(activeItem)
    }
  }, [activeItem, isLoggedIn])

  // Direct Login Handler (No Company Selection Page)
  const handleLoginSuccess = (userPayload: { id: string; name: string; email: string; role: string; company?: DBCompany; assignedCompanies: string[]; token: string }) => {
    sessionStorage.setItem("has_visited_app", "true")
    setAuthUser(userPayload)
    setIsLoggedIn(true)

    const comp = userPayload.company || {
      id: "COMP-DEMO-001",
      code: "DEMO",
      name: "Demo Transport",
      status: "active",
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setSelectedCompany(comp)
    companyContext.setActiveCompanyId(comp.id)

    if (isSuperAdminRole(userPayload.role)) {
      sessionService.saveSession(comp, { name: userPayload.name, role: userPayload.role }, "AdminControlPanel")
      setActiveItem("AdminControlPanel")
    } else {
      setActiveItem("Dashboard")
      sessionService.saveSession(comp, { name: userPayload.name, role: userPayload.role }, "Dashboard")
    }
  }

  const handleLogout = () => {
    sessionService.clearSession()
    sessionStorage.removeItem("has_visited_app")
    setIsLoggedIn(false)
    setAuthUser(null)
    setSelectedCompany(null)
    setShowLanding(true)
  }

  const navigate = (page: string) => {
    setActiveItem(page)
    sessionService.updateActivePage(page)
  }

  const handleStartApp = () => {
    sessionStorage.setItem("has_visited_app", "true")
    setShowLanding(false)
  }

  // STEP 0: Public SaaS Landing Page
  if (showLanding) {
    return <LandingPage onStart={handleStartApp} />
  }

  // STEP 1: Login Screen (No Company Selection)
  if (!isLoggedIn || !authUser) {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
      />
    )
  }

  // STEP 2: Super Admin Application (Super Admin ONLY)
  if (isSuperAdminRole(authUser.role)) {
    return (
      <AdminControlPanel
        user={authUser}
        onLogout={handleLogout}
      />
    )
  }

  // Fallback Company Object for Normal User
  const activeCompany = selectedCompany || {
    id: "COMP-001",
    code: "DUMMY",
    name: "Dummy Transport Pvt Ltd",
    status: "active",
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // STEP 3: TransportOS ERP Application (Company Users DIRECTLY)
  return (
    <div key={activeCompany.id} className="flex h-screen overflow-hidden relative" style={{ background: "#F4F7FC" }}>
      {/* Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(c => !c)}
          activeItem={activeItem}
          onSelect={setActiveItem}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          userName={authUser.name}
          userRole={authUser.role}
          companyName={activeCompany.name}
        />
      </div>

      {/* Mobile drawer sidebar */}
      <div className="md:hidden">
        <Sidebar
          collapsed={false}
          onToggle={() => {}}
          activeItem={activeItem}
          onSelect={setActiveItem}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          userName={authUser.name}
          userRole={authUser.role}
          companyName={activeCompany.name}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden pb-[60px] md:pb-0">
        <Header 
          activeItem={activeItem}
          companyName={activeCompany.name}
          companyLogo={activeCompany.logo}
          userBranch={authUser.branch || "Main HQ"}
          onCreateLR={() => { setEditingLrRecord(null); navigate("Create LR"); }} 
          onProfileClick={() => navigate("Profile")}
          onLogout={handleLogout} 
          userName={authUser.name}
          userRole={authUser.role}
          onMenuClick={() => setDrawerOpen(true)}
        />

        {!canAccessPage(authUser.role, activeItem) ? (
          <AccessDenied
            pageName={activeItem}
            userName={authUser.name}
            userRole={authUser.role}
            companyName={activeCompany.name}
            onReturnHome={() => setActiveItem("Dashboard")}
          />
        ) : (
          <>
            {activeItem === "Dashboard" && <Dashboard key={activeCompany.id} onNavigate={(p) => { if (p === "Create LR") setEditingLrRecord(null); navigate(p); }} />}
            {activeItem === "Create LR" && <CreateLR key={activeCompany.id} editingLR={editingLrRecord} onNavigateToList={() => { setEditingLrRecord(null); navigate("LR Register"); }} />}
            {activeItem === "LR Register" && <LRList key={activeCompany.id} onCreateLR={() => { setEditingLrRecord(null); navigate("Create LR"); }} onEditLR={(r) => { setEditingLrRecord(r); setActiveItem("Create LR"); }} />}
            {activeItem === "Blank LR" && <BlankLR key={activeCompany.id} />}
            {activeItem === "Delivery" && <Delivery key={activeCompany.id} />}
            {activeItem === "Billing" && <Billing key={activeCompany.id} />}
            {activeItem === "Parties" && <Parties key={activeCompany.id} />}
            {(activeItem === "Branches" || activeItem === "Branch Master") && <BranchMaster key={activeCompany.id} />}
            {activeItem === "Vehicles" && <Vehicles key={activeCompany.id} />}
            {activeItem === "Drivers" && <Drivers key={activeCompany.id} />}
            {activeItem === "Vehicle Owners" && <VehicleOwners key={activeCompany.id} />}
            {activeItem === "Agents" && <Agents key={activeCompany.id} />}
            {(activeItem === "Articles" || activeItem === "Article Master") && <ArticleMaster key={activeCompany.id} />}
            {(activeItem === "Stations" || activeItem === "Station Master") && <StationMaster key={activeCompany.id} />}
            {activeItem === "Reports" && <Reports key={activeCompany.id} />}
            {activeItem === "User Management" && <UserManagement key={activeCompany.id} />}
            {activeItem === "Company Setup" && <CompanySetup key={activeCompany.id} />}
            {(activeItem === "Settings" || activeItem === "Profile") && <Profile key={activeCompany.id} />}
          </>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  )
}
