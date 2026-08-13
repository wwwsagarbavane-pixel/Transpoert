import { motion, AnimatePresence } from "framer-motion"
import Logo from "./Logo"
import {
  LayoutDashboard, FilePlus, FileText, FileOutput, Truck, UserCheck,
  Building2, MapPin, PackageCheck, BarChart3, Settings, ChevronLeft,
  Zap, Wallet, Users, Shield, Building, ChevronDown,
  BookOpen, Package, User, Briefcase, X
} from "lucide-react"

import { canAccessPage } from "../security/rbac"

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, FilePlus, FileText, FileOutput, Truck, UserCheck,
  Building2, MapPin, PackageCheck, BarChart3, Settings, Wallet,
  Users, Shield, Building, BookOpen, Package, User, Briefcase
}

type NavItem = {
  label: string
  icon: string
  badge?: string
  children?: { label: string; icon: string }[]
}

type NavSection = {
  section?: string
  items: NavItem[]
}

const NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard", icon: "LayoutDashboard" },
    ]
  },
  {
    section: "LR Management",
    items: [
      { label: "Create LR", icon: "FilePlus" },
      { label: "LR Register", icon: "FileText" },
      { label: "Blank LR", icon: "FileOutput" },
    ]
  },
  {
    section: "Operations",
    items: [
      { label: "Delivery", icon: "PackageCheck" },
      { label: "Billing", icon: "Wallet" },
    ]
  },
  {
    section: "Master Data",
    items: [
      { label: "Parties", icon: "Building2" },
      { label: "Vehicles", icon: "Truck" },
      { label: "Drivers", icon: "UserCheck" },
      { label: "Vehicle Owners", icon: "User" },
      { label: "Agents", icon: "Briefcase" },
      { label: "Articles", icon: "Package" },
      { label: "Stations", icon: "MapPin" },
    ]
  },
  {
    section: "Admin",
    items: [
      { label: "Reports", icon: "BarChart3" },
      { label: "User Management", icon: "Users" },
      { label: "Branches", icon: "Building" },
      { label: "Company Setup", icon: "Building2" },
      { label: "Settings", icon: "Settings" },
    ]
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  activeItem: string
  onSelect: (label: string) => void
  isOpen?: boolean
  onClose?: () => void
  userName?: string
  userRole?: string
  companyName?: string
}

export default function Sidebar({
  collapsed,
  onToggle,
  activeItem,
  onSelect,
  isOpen = false,
  onClose,
  userName = "User",
  userRole = "Company Admin",
  companyName = "TransportOS"
}: SidebarProps) {
  return (
    <>
      {/* Mobile/Tablet Drawer Overlay Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: collapsed ? 68 : 224,
          x: isOpen ? 0 : undefined 
        }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col h-full shrink-0 overflow-hidden lg:relative lg:flex transition-transform duration-200 md:duration-300 lg:transition-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-[68px]" : "w-[224px]"}
          max-md:w-[240px] max-md:z-[100]`}
        style={{ background: "#111827" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06] shrink-0 justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            {collapsed && !isOpen ? (
              <Logo className="h-9 w-9 shrink-0" light />
            ) : (
              <Logo className="h-11 w-[172px] shrink-0" light />
            )}
          </div>

          {/* Close button for Mobile/Tablet Drawer */}
          {isOpen && (
            <button 
              onClick={onClose}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 text-white/70 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-4 custom-scrollbar">
          {NAV.map(group => ({
            ...group,
            items: group.items.filter(item => canAccessPage(userRole, item.label))
          })).filter(group => group.items.length > 0).map((group, gi) => (
            <div key={gi}>
              {/* Section label */}
              {group.section && (!collapsed || isOpen) && (
                <div className="px-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
                    {group.section}
                  </span>
                </div>
              )}
              {group.section && (collapsed && !isOpen) && (
                <div className="border-t border-white/[0.07] mb-2" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon]
                  const isActive = activeItem === item.label
                  return (
                    <motion.button
                      key={item.label}
                      onClick={() => {
                        onSelect(item.label)
                        if (onClose) onClose() // auto close drawer on selection
                      }}
                      whileHover={{ x: (collapsed && !isOpen) ? 0 : 2 }}
                      whileTap={{ scale: 0.97 }}
                      title={(collapsed && !isOpen) ? item.label : undefined}
                      className="relative w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-left group"
                      style={{ color: isActive ? "#c7d2fe" : "rgba(255,255,255,0.45)" }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl"
                          style={{ background: "rgba(79,70,229,0.20)", border: "1px solid rgba(99,82,255,0.25)" }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-100" style={{ background: "rgba(255,255,255,0.05)" }} />
                      )}
                      <Icon size={16} className="relative shrink-0" />
                      <AnimatePresence>
                        {(!collapsed || isOpen) && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.13 }}
                            className="relative text-[13px] font-medium flex-1 truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {(!collapsed || isOpen) && item.badge && (
                        <span className="relative text-[10px] font-bold bg-indigo-500/25 text-indigo-400 px-1.5 py-0.5 rounded-full tabular-nums">
                          {item.badge}
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.06] px-3 py-3 shrink-0">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0 text-white text-xs font-bold font-mono">
              {userName ? userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "US"}
            </div>
            <AnimatePresence>
              {(!collapsed || isOpen) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <div className="text-white/85 text-xs font-semibold truncate">{userName}</div>
                  <div className="text-white/30 text-[10px] truncate">{userRole} · {companyName}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Toggle (hidden on tablet/mobile) */}
        <motion.button
          onClick={onToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="absolute top-[22px] -right-3 w-6 h-6 rounded-full bg-white border border-gray-200 items-center justify-center z-10 hidden lg:flex"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.14)" }}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronLeft size={11} className="text-gray-500" />
          </motion.div>
        </motion.button>
      </motion.aside>
    </>
  )
}
