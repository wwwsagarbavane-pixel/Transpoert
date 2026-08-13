import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Bell, Plus, ChevronRight, FileText, User, LogOut, Settings,
  Menu, Building2, KeyRound, HelpCircle, ShieldAlert, X, CheckCircle2,
  Lock, Sparkles, Sliders
} from "lucide-react"

interface HeaderProps {
  activeItem: string
  companyName?: string
  companyLogo?: string
  userBranch?: string
  onCreateLR: () => void
  onProfileClick: () => void
  onLogout: () => void
  userName: string
  userRole: string
  onMenuClick?: () => void
}

export default function Header({
  activeItem,
  companyName = "TransportOS Pvt Ltd",
  companyLogo,
  userBranch = "Main HQ",
  onCreateLR,
  onProfileClick,
  onLogout,
  userName,
  userRole,
  onMenuClick
}: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  // Compute initials from user's full name
  const initials = userName
    ? userName.split(" ").map(n => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase()
    : "US"

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="glass sticky top-0 z-30 border-b border-black/[0.06] px-4 md:px-6 h-[58px] flex items-center gap-3 md:gap-4 shrink-0 bg-white/70 backdrop-blur-md"
    >
      {/* Drawer Hamburger Toggle (visible on Mobile & Tablet) */}
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100/80 hover:bg-gray-200/80 text-gray-600 transition-colors shrink-0 cursor-pointer"
        >
          <Menu size={16} />
        </button>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0 font-sans">
        <FileText size={14} className="text-gray-400 shrink-0 hidden xs:block" />
        <span className="text-gray-400 font-medium hidden sm:block">TransportOS</span>
        <ChevronRight size={13} className="text-gray-300 hidden sm:block" />
        <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md text-xs truncate hidden md:inline-block max-w-[180px]">
          {companyName}
        </span>
        <ChevronRight size={13} className="text-gray-300 hidden md:block" />
        <span className="text-gray-900 font-extrabold truncate text-sm md:text-base">{activeItem}</span>
      </div>

      {/* Global Quick Search */}
      <div className="relative hidden md:flex items-center font-sans">
        <Search size={13} className="absolute left-3 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search LR, party, vehicle..."
          className="pl-9 pr-10 h-9 w-[200px] lg:w-[260px] bg-gray-100/80 rounded-xl text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:bg-white transition-all duration-200 border border-transparent focus:border-indigo-200 font-medium"
        />
        <kbd className="absolute right-3 text-[10px] text-gray-400 bg-gray-200/80 px-1.5 py-0.5 rounded-md font-mono">⌘K</kbd>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5 relative font-sans">
        {/* Notification Bell */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100/80 text-gray-600 hover:bg-gray-200/80 transition-colors cursor-pointer"
        >
          <Bell size={15} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
        </motion.button>

        {/* Primary New LR Action Button */}
        <motion.button
          type="button"
          onClick={onCreateLR}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs md:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 cursor-pointer transition-colors"
        >
          <Plus size={15} />
          <span className="hidden xs:block">New LR</span>
        </motion.button>

        {/* REDESIGNED ENTERPRISE USER PROFILE DROPDOWN */}
        <div className="relative">
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center cursor-pointer select-none shadow-md shadow-indigo-500/20 transition-all border border-indigo-500/30"
          >
            {initials}
          </div>

          <AnimatePresence>
            {showDropdown && (
              <>
                {/* Backdrop Click Dismiss */}
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />

                {/* 330px Premium Glass Profile Menu */}
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2.5 w-[330px] bg-white rounded-[18px] border border-gray-100 shadow-2xl z-50 overflow-hidden font-sans text-xs text-gray-700 divide-y divide-gray-100"
                >
                  {/* PROFILE HEADER CARD */}
                  <div className="p-4 bg-gradient-to-b from-indigo-50/60 to-white space-y-3">
                    <div className="flex items-start gap-3">
                      {/* Avatar initials */}
                      <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 border border-indigo-500/30">
                        {initials}
                      </div>

                      {/* User & Role Details */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h4 className="font-extrabold text-gray-900 text-sm truncate leading-tight">{userName}</h4>
                        <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700 border border-purple-200/80">
                            {userRole}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium truncate">
                            · {userBranch}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Company Branding Badge */}
                    <div className="p-2.5 bg-white rounded-xl border border-gray-200/80 shadow-xs flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 p-0.5 overflow-hidden">
                        {companyLogo ? (
                          <img src={companyLogo} alt={companyName} className="w-full h-full object-contain" />
                        ) : (
                          <Building2 size={14} className="text-indigo-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block leading-none">Active Workspace</span>
                        <span className="text-xs font-bold text-gray-900 truncate block mt-0.5">{companyName}</span>
                      </div>
                    </div>
                  </div>

                  {/* MENU NAVIGATION LINKS */}
                  <div className="p-2 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => { onProfileClick(); setShowDropdown(false) }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between text-gray-700 hover:text-gray-900 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <User size={15} />
                        </div>
                        <span className="font-bold text-xs">My Profile</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { onProfileClick(); setShowDropdown(false) }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between text-gray-700 hover:text-gray-900 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <Lock size={15} />
                        </div>
                        <span className="font-bold text-xs">Change Password</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { onProfileClick(); setShowDropdown(false) }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between text-gray-700 hover:text-gray-900 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <Sliders size={15} />
                        </div>
                        <span className="font-bold text-xs">Preferences & Settings</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowHelpModal(true); setShowDropdown(false) }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between text-gray-700 hover:text-gray-900 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                          <HelpCircle size={15} />
                        </div>
                        <span className="font-bold text-xs">Help & Support</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </button>
                  </div>

                  {/* SEPARATE RED LOGOUT SECTION */}
                  <div className="p-2 bg-red-50/30">
                    <button
                      type="button"
                      onClick={() => { setShowLogoutConfirm(true); setShowDropdown(false) }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl bg-red-50/80 hover:bg-red-100 text-red-600 hover:text-red-700 font-extrabold transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                        <LogOut size={15} />
                      </div>
                      <span>Logout Account</span>
                    </button>
                  </div>

                  {/* FOOTER METADATA */}
                  <div className="px-4 py-2.5 bg-gray-50/80 flex items-center justify-between text-[11px] text-gray-400 font-medium">
                    <span className="flex items-center gap-1.5 text-gray-500 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Current Session
                    </span>
                    <span className="font-mono text-gray-400">Version 1.0</span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* LOGOUT CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 max-w-sm w-full space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto shadow-xs">
                <LogOut size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-gray-900">Confirm Logout</h3>
                <p className="text-xs text-gray-500 font-normal">Are you sure you want to end your active TransportOS ERP session?</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 h-10 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { setShowLogoutConfirm(false); onLogout() }}
                  className="flex-1 h-10 rounded-xl text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HELP & SUPPORT MODAL */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">TransportOS ERP Support</h3>
                    <p className="text-[11px] text-gray-400 font-normal">Dedicated enterprise customer care and technical support</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-1">
                  <div className="font-bold text-indigo-900">24/7 Enterprise Help Desk</div>
                  <div className="text-gray-600">Email: <span className="font-mono font-bold text-indigo-600">support@transportos.in</span></div>
                  <div className="text-gray-600">Toll-Free Hotline: <span className="font-mono font-bold text-indigo-600">1800-123-9876</span></div>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1">
                  <div className="font-bold text-gray-800">System Documentation & User Manuals</div>
                  <p className="text-gray-500">Access ERP operation guidelines, LR register tutorials, and billing workflow guides.</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="w-full h-10 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Close Support Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
