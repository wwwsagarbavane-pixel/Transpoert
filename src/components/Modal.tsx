import { useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle2, AlertTriangle, Trash2, HelpCircle } from "lucide-react"

// Core Modal Props
interface AppModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg"
}

const widthClasses = {
  sm: "max-w-[500px]",
  md: "max-w-[700px]",
  lg: "max-w-[900px]"
}

// 1. AppModal (Core Standard Wrapper Modal)
export default function AppModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = "md"
}: AppModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (typeof window === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[9999]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative w-full ${widthClasses[maxWidth]} bg-white rounded-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-gray-100 overflow-visible z-[10000] my-8 flex flex-col`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white rounded-t-[20px] sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                  {icon && (
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold shrink-0">
                      {icon}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">{title}</h3>
                    {subtitle && <p className="text-[11px] text-gray-400 font-medium mt-0.5">{subtitle}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Body wrapper */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-72px)]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// 2. Delete Confirmation Dialog
interface DeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  itemName?: string
  confirmLabel?: string
  loading?: boolean
}

export function DeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  message,
  itemName,
  confirmLabel = "Delete",
  loading = false
}: DeleteDialogProps) {
  return (
    <AppModal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center space-y-4 py-3">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shadow-xs">
          <Trash2 size={24} />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 font-medium">
            {message} {itemName && <strong className="text-gray-800 font-bold">"{itemName}"</strong>}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3.5 w-full pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-[42px] px-4 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-[42px] px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </AppModal>
  )
}

// 3. Success Notification Dialog
interface SuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  confirmLabel?: string
}

export function SuccessDialog({
  isOpen,
  onClose,
  title = "Action Successful",
  message,
  confirmLabel = "Done"
}: SuccessDialogProps) {
  return (
    <AppModal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center space-y-4 py-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
          <CheckCircle2 size={24} />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 font-medium">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3.5 w-full pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-[42px] px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </AppModal>
  )
}

// 4. General Confirmation Dialog (ConfirmDialog)
interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  confirmStyle?: "purple" | "red"
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  confirmStyle = "purple",
  loading = false
}: ConfirmDialogProps) {
  return (
    <AppModal isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex flex-col items-center text-center space-y-4 py-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs border ${
          confirmStyle === "red"
            ? "bg-red-50 border-red-200 text-red-600"
            : "bg-indigo-50 border-indigo-200 text-indigo-600"
        }`}>
          {confirmStyle === "red" ? <AlertTriangle size={24} /> : <HelpCircle size={24} />}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 font-medium">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3.5 w-full pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-[42px] px-4 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-[42px] px-4 rounded-xl text-xs font-bold text-white transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
              confirmStyle === "red"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </AppModal>
  )
}

// 5. Right-Side Drawer (SideDrawer)
interface SideDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
}

export function SideDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children
}: SideDrawerProps) {
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (typeof window === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[9999]"
          />

          {/* Drawer Card */}
          <motion.div
            initial={{ x: "100%", opacity: 0.95 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-[500px] bg-white h-full shadow-2xl border-l border-gray-100 flex flex-col z-[10000]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold shrink-0">
                    {icon}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">{title}</h3>
                  {subtitle && <p className="text-[11px] text-gray-400 font-medium mt-0.5">{subtitle}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body Scrollable */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
