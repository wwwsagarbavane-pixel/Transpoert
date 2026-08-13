import React from "react"
import { motion } from "framer-motion"
import { Search, Plus, Eye, Edit2, Trash2, Printer, ChevronLeft, ChevronRight } from "lucide-react"

export function AppPageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon: Icon
}: {
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
  icon?: any
}) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
        <p className="text-xs text-gray-400 mt-1 font-normal">{subtitle}</p>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1.5 h-10 px-5 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 cursor-pointer transition-all shrink-0"
        >
          {Icon ? <Icon size={15} /> : <Plus size={15} />}
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}

export function AppToolbar({
  children,
  totalCount,
  onAdd,
  addLabel
}: {
  children?: React.ReactNode
  totalCount?: number
  onAdd?: () => void
  addLabel?: string
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 flex-1 flex-wrap min-w-[260px]">
        {children}
      </div>
      <div className="flex items-center gap-4">
        {totalCount !== undefined && (
          <div className="text-xs text-gray-400 font-semibold">
            Total : <span className="text-indigo-600 font-bold font-mono text-sm">{totalCount}</span>
          </div>
        )}
        {onAdd && addLabel && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 cursor-pointer transition-all"
          >
            <Plus size={14} /> {addLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export function AppSearch({
  value,
  onChange,
  placeholder = "Search..."
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}) {
  return (
    <div className="relative flex-1 min-w-[240px] max-w-[400px]">
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3.5 text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 transition-all"
      />
    </div>
  )
}

export function AppStatusBadge({ status }: { status: string }) {
  const s = status ? status.toLowerCase() : "active"
  if (s === "active" || s === "available") {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
      </span>
    )
  }
  if (s === "inactive") {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-gray-100 text-gray-600 border border-gray-200 inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Inactive
      </span>
    )
  }
  if (s === "pending") {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
      </span>
    )
  }
  if (s === "blocked" || s === "cancelled") {
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Blocked
      </span>
    )
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
      {status}
    </span>
  )
}

export function AppActionButtons({
  onView,
  onEdit,
  onDelete,
  onPrint
}: {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onPrint?: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      {onView && (
        <button
          onClick={onView}
          className="h-8 px-2.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Eye size={13} /> View
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          className="h-8 px-2.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Edit2 size={13} /> Edit
        </button>
      )}
      {onPrint && (
        <button
          onClick={onPrint}
          className="h-8 px-2.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Printer size={13} /> Print
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="h-8 px-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Trash2 size={13} /> Remove
        </button>
      )}
    </div>
  )
}

export function AppPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalRecords: number
}) {
  if (totalPages <= 1) return null

  return (
    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
      <div>Showing page {currentPage} of {totalPages} ({totalRecords} records)</div>
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-7 h-7 rounded-lg font-bold text-xs cursor-pointer ${
              p === currentPage ? "bg-indigo-600 text-white" : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
