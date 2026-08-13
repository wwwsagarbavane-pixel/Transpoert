import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Check, Search } from "lucide-react"

export interface DropdownOption {
  value: string
  label: string
}

export function getAddButtonLabel(category?: string, override?: string, label: string = "Record"): string {
  if (override) return override
  if (!category) return "Add New"
  switch (category.toLowerCase()) {
    case "vehicle": return "Add New Vehicle"
    case "driver": return "Add New Driver"
    case "owner": case "vehicle owner": return "Add New Vehicle Owner"
    case "agent": return "Add New Agent"
    case "party": case "consignor": case "consignee": return "Add New Party"
    case "station": case "branch": return "Add New Station"
    case "article": return "Add New Article"
    case "user": return "Add New User"
    default: return `Add New ${label}`
  }
}

export function getEntityName(category?: string): string {
  if (!category) return "Item"
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export function getPlaceholder(category?: string, defaultPlaceholder: string = "Select option"): string {
  if (!category) return defaultPlaceholder
  return `Select ${category}`
}

export function getSearchPlaceholder(category?: string): string {
  if (!category) return "Search options..."
  return `Search ${category}...`
}

export function getDisplayLabel(val: any, fallback: string = "—"): string {
  if (val === null || val === undefined || val === "") return fallback
  return String(val)
}

interface SearchDropdownProps {
  label?: string
  value: string
  options: (string | DropdownOption)[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  hasError?: boolean
  icon?: any
  size?: "sm" | "md" | "lg"
  className?: string
  onChange: (val: string) => void
}

export default function SearchDropdown({
  label,
  value,
  options,
  placeholder = "Select option",
  required = false,
  disabled = false,
  hasError = false,
  icon: Icon,
  size = "md",
  className = "",
  onChange
}: SearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    width: 200,
    openUpward: false
  })

  // Standardize options into array of DropdownOption objects
  const normalizedOptions: DropdownOption[] = options.map(opt => {
    if (typeof opt === "string") {
      return { value: opt, label: opt }
    }
    return opt
  })

  // Selected Option object
  const selectedOption = normalizedOptions.find(o => o.value === value)

  // Filtered options based on search query
  const filteredOptions = normalizedOptions.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.value.toLowerCase().includes(search.toLowerCase())
  )

  // Recalculate portal position
  const updatePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < 250 && rect.top > spaceBelow

    setCoords({
      top: openUpward
        ? rect.top + window.scrollY - 6
        : rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
      openUpward
    })
  }

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen])

  // Reposition on scroll or resize
  useEffect(() => {
    if (!isOpen) return

    const handleScrollOrResize = () => {
      updatePosition()
    }

    window.addEventListener("scroll", handleScrollOrResize, true)
    window.addEventListener("resize", handleScrollOrResize)

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true)
      window.removeEventListener("resize", handleScrollOrResize)
    }
  }, [isOpen])

  // Reset search when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSearch("")
      setFocusedIndex(-1)
    }
  }, [isOpen])

  // Handle clicking outside container/popover to close dropdown
  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        popoverRef.current && !popoverRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
      } else {
        setFocusedIndex(prev => (prev + 1) % filteredOptions.length)
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (isOpen) {
        setFocusedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length)
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (isOpen && focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        const selected = filteredOptions[focusedIndex]
        onChange(selected.value)
        setIsOpen(false)
      } else if (!isOpen) {
        setIsOpen(true)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  // Height classes based on size prop
  const heightCls = size === "sm" ? "h-9 text-xs" : size === "lg" ? "h-12 text-sm" : "h-[44px] text-xs md:text-sm"

  return (
    <div className={`flex flex-col gap-1.5 w-full font-sans ${className}`}>
      {label && (
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center justify-between select-none">
          <span>{label} {required && <span className="text-red-500 font-bold">*</span>}</span>
          {hasError && <span className="text-[10px] text-red-500 font-bold lowercase normal-case">Required</span>}
        </label>
      )}

      {/* Main Trigger Button */}
      <div className="relative w-full">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            <Icon size={16} />
          </div>
        )}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) {
              updatePosition()
              setIsOpen(!isOpen)
            }
          }}
          onKeyDown={handleKeyDown}
          className={`${heightCls} w-full rounded-xl ${Icon ? "pl-9" : "pl-3.5"} pr-9 text-xs md:text-sm font-normal transition-all text-left flex items-center justify-between cursor-pointer focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
            hasError
              ? "border-2 border-red-400 bg-red-50/20 text-red-900 ring-2 ring-red-400/20"
              : isOpen
              ? "border-indigo-400 bg-white ring-2 ring-indigo-400/20 shadow-sm"
              : "bg-gray-50/80 border border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-400/20"
          }`}
        >
          <span className={`truncate ${!selectedOption ? "text-gray-400 font-normal" : "text-gray-900 font-normal"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 shrink-0 ml-1 ${isOpen ? "rotate-180 text-indigo-600" : ""}`} />
        </button>
      </div>

      {/* PORTAL-BASED DROPDOWN OPTIONS POPOVER */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: coords.openUpward ? 4 : -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: coords.openUpward ? 4 : -4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[260px] font-sans text-xs"
              style={{
                position: "absolute",
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
                zIndex: 9999,
                transform: coords.openUpward ? "translateY(-100%)" : "none",
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)"
              }}
            >
              {/* Search filter input inside popover */}
              {normalizedOptions.length > 5 && (
                <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/80 shrink-0">
                  <Search size={13} className="text-gray-400 shrink-0 ml-1.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value)
                      setFocusedIndex(-1)
                    }}
                    placeholder="Search options..."
                    className="w-full h-8 text-xs bg-transparent text-gray-800 placeholder:text-gray-400 focus:outline-none font-medium"
                    autoFocus
                  />
                </div>
              )}

              {/* Options List */}
              <div className="overflow-y-auto flex-1 py-1 divide-y divide-gray-50">
                {filteredOptions.map((opt, idx) => {
                  const isSelected = value === opt.value
                  const isFocused = idx === focusedIndex
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onMouseDown={e => {
                        e.preventDefault()
                        onChange(opt.value)
                        setIsOpen(false)
                      }}
                      onClick={() => {
                        onChange(opt.value)
                        setIsOpen(false)
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : isFocused
                          ? "bg-slate-100 text-gray-900 font-semibold"
                          : "text-gray-700 hover:bg-slate-50 hover:text-gray-900 font-medium"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check size={14} className="text-indigo-600 shrink-0 ml-2" />}
                    </button>
                  )
                })}

                {filteredOptions.length === 0 && (
                  <div className="px-3.5 py-4 text-xs text-gray-400 text-center">No matching options found</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
